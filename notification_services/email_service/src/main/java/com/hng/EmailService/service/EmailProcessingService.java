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

//    private final TemplateClient templateClient;
//    private final NotificationStatusClient statusClient;
    private final SendGridClient sendGridClient;
    private final RabbitTemplate rabbitTemplate;
    private final RedisService redisService;

    public EmailProcessingService(
//            TemplateClient templateClient,
//                                  NotificationStatusClient statusClient,
                                  SendGridClient sendGridClient,
                                  RabbitTemplate rabbitTemplate,
                                  RedisService redisService) {
//        this.templateClient = templateClient;
//        this.statusClient = statusClient;
        this.sendGridClient = sendGridClient;
        this.rabbitTemplate = rabbitTemplate;
        this.redisService = redisService;
    }

    public void process(EmailRequestDto request, String correlationId) {
        MDC.put("correlation_id", correlationId);
        log.info("Processing email request {}", request.request_id());

        Object redisValue = redisService.fetch(request.request_id());
        log.info("Fetched Redis value for {}: {}", request.request_id(), redisValue);

//        confirm that the request is still valid, hasn’t expired, or is still in the "queued" state — before proceeding to send the email.
        if (redisValue == null) {
            log.warn("No Redis record found for request_id {}. Skipping email.", request.request_id());
            return;
        }

        Map redisMap = (Map) redisValue;
        Map value = (Map) redisMap.get("value");
        String status = (String) ((Map<String, Object>) value.get("data")).get("status");

        if (!"queued".equalsIgnoreCase(status)) {
            log.info("Skipping email for request_id {} since status is {}", request.request_id(), status);
            return;
        }

        try {
            // Update status to sending
//            statusClient.updateStatus(request.request_id(), "sending");

            // 1. fetch template
            String renderedBody = TemplateRenderer.render(request.body(), request.data());
            String subject = request.subject();

//            TemplateDto template = templateClient.fetchTemplate(request.template());

            // 2. render body
//            String body = TemplateRenderer.render(template.template_body(), request.data());
//            String subject = template.subject();

            // 3. send with exponential backoff attempts: 1st: immediate; retries: 2s,4s,8s
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
//                statusClient.updateStatus(request.request_id(), "delivered");
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
//                statusClient.updateStatus(request.request_id(), "failed");
                log.error("Failed to deliver email for request {}. Sending to dead-letter queue", request.request_id());
                // push original message to failed.queue
                rabbitTemplate.convertAndSend(EMAIL_EXCHANGE, FAILED_ROUTING_KEY, request);
            }
        } catch (Exception e) {
            log.error("Unhandled exception processing email {}: {}", request.request_id(), e.getMessage(), e);
            // best effort: update failed and push to dead-letter
        } finally {
            MDC.remove("correlation_id");
        }
    }
}
