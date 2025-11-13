package com.hng.EmailService.service;

import com.hng.EmailService.dto.EmailRequestDto;
import com.hng.EmailService.util.TemplateRenderer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;

import static com.hng.EmailService.config.RabbitConfig.EMAIL_EXCHANGE;
import static com.hng.EmailService.config.RabbitConfig.FAILED_ROUTING_KEY;

@Service
public class EmailProcessingService {

    private static final Logger log = LoggerFactory.getLogger(EmailProcessingService.class);

    private final SendGridClient sendGridClient;
    private final RabbitTemplate rabbitTemplate;
    private final RedisService redisService;
    private final TemplateServiceClient templateServiceClient;

    public EmailProcessingService(
                                  SendGridClient sendGridClient,
                                  RabbitTemplate rabbitTemplate,
                                  RedisService redisService,
                                  TemplateServiceClient templateServiceClient) {
        this.sendGridClient = sendGridClient;
        this.rabbitTemplate = rabbitTemplate;
        this.redisService = redisService;
        this.templateServiceClient = templateServiceClient;
    }

    public void process(EmailRequestDto request, String correlationId) {
        MDC.put("correlation_id", correlationId);
        log.info("Processing email request {}", request.request_id());

        // Use the correct Redis key with status: prefix
        String redisKey = "status:" + request.request_id();
        Object redisValue = redisService.fetch(redisKey);
        log.info("Fetched Redis value for {}: {}", request.request_id(), redisValue);

//        confirm that the request is still valid, hasn't expired, or is still in the "queued" state — before proceeding to send the email.
        if (redisValue == null) {
            log.warn("No Redis record found for request_id {}. Skipping email.", request.request_id());
            throw new RuntimeException("No Redis record found for request_id: " + request.request_id());
        }

        // Parse the Redis structure: { "value": { "status": "queued", ... }, "expires": ... }
        Map<String, Object> redisMap = (Map<String, Object>) redisValue;
        Map<String, Object> value = (Map<String, Object>) redisMap.get("value");
        
        if (value == null) {
            log.error("Invalid Redis structure: 'value' field is missing for request_id {}", request.request_id());
            throw new RuntimeException("Invalid Redis structure for request_id: " + request.request_id());
        }
        
        String status = (String) value.get("status");
        
        if (status == null) {
            log.warn("Status field is missing in Redis for request_id {}", request.request_id());
            throw new RuntimeException("Status field missing for request_id: " + request.request_id());
        }

        if (!"queued".equalsIgnoreCase(status)) {
            log.info("Skipping email for request_id {} since status is {}", request.request_id(), status);
            return;  // Already processed, can safely acknowledge
        }

        try {
            // Update status to processing
            redisService.updateStatus(request.request_id(), "processing");
            log.info("Updated status to 'processing' for request {}", request.request_id());

            // 1. Render template using template service
            String renderedBody;
            String subject = request.subject();
            
            try {
                log.info("Rendering template {} with data: {}", request.template_code(), request.data());
                renderedBody = templateServiceClient.renderInlineTemplate(request.body(), request.data());
                log.info("Successfully rendered template for request {}", request.request_id());
            } catch (Exception e) {
                log.error("Failed to render template via template service, falling back to local renderer: {}", e.getMessage());
                // Fallback to local rendering if template service is unavailable
                renderedBody = TemplateRenderer.render(request.body(), request.data());
            }

            // 2. Send with exponential backoff attempts: 1st: immediate; retries: 2s,4s,8s
            int[] backoffs = {0, 2000, 4000, 8000}; // ms
            boolean sent = false;
            for (int attempt = 0; attempt < backoffs.length; attempt++) {
                if (attempt > 0) {
                    log.info("Retry attempt {} for request {}", attempt, request.request_id());
                    Thread.sleep(backoffs[attempt]);
                }
                try {
                    boolean ok = sendGridClient.sendEmail(request.email(), subject, renderedBody);
                    if (ok) {
                        sent = true;
                        break;
                    } else {
                        log.warn("SendGrid returned an error, will retry if attempts remain.");
                    }
                } catch (Exception ex) {
                    log.error("Error sending email on attempt {}: {}", attempt, ex.getMessage());
                }
            }

            if (sent) {
                // Update status to delivered in Redis
                redisService.updateStatus(request.request_id(), "delivered");
                log.info("Email delivered for request {}", request.request_id());

                // Send to status.queue after success
                rabbitTemplate.convertAndSend(
                        "status.queue",
                        new EmailRequestDto(
                                request.channel(),
                                request.request_id(),
                                request.user_id(),
                                request.template_code(),
                                request.subject(),
                                request.body(),
                                request.timestamp(),
                                request.data(),
                                request.correlation_id(),
                                request.attempts(),
                                request.email(),
                                request.push_token()
                        )
                );
            } else {
                // Update status to failed in Redis
                redisService.updateStatusWithError(request.request_id(), "failed", "Failed to deliver email after all retry attempts");
                log.error("Failed to deliver email for request {}. Sending to dead-letter queue", request.request_id());
                // push original message to failed.queue
                rabbitTemplate.convertAndSend(EMAIL_EXCHANGE, FAILED_ROUTING_KEY, request);
                throw new RuntimeException("Failed to deliver email after all retry attempts");
            }
        } catch (Exception e) {
            // Update status to failed in Redis with error message
            redisService.updateStatusWithError(request.request_id(), "failed", e.getMessage());
            log.error("Unhandled exception processing email {}: {}", request.request_id(), e.getMessage(), e);
            // Throw exception so message is not acknowledged and can be retried or sent to DLQ
            throw new RuntimeException("Failed to process email: " + e.getMessage(), e);
        } finally {
            MDC.remove("correlation_id");
        }
    }
}
