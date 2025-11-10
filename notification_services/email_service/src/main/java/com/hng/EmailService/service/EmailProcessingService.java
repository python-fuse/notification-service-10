package com.hng.EmailService.service;

import com.hng.EmailService.dto.EmailRequestDto;
import com.hng.EmailService.dto.TemplateDto;
import com.hng.EmailService.util.TemplateRenderer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

import static com.hng.EmailService.config.RabbitConfig.EMAIL_EXCHANGE;
import static com.hng.EmailService.config.RabbitConfig.FAILED_ROUTING_KEY;

@Service
public class EmailProcessingService {

    private static final Logger log = LoggerFactory.getLogger(EmailProcessingService.class);

    private final TemplateClient templateClient;
    private final NotificationStatusClient statusClient;
    private final SendGridClient sendGridClient;
    private final RabbitTemplate rabbitTemplate;

    public EmailProcessingService(TemplateClient templateClient,
                                  NotificationStatusClient statusClient,
                                  SendGridClient sendGridClient,
                                  RabbitTemplate rabbitTemplate) {
        this.templateClient = templateClient;
        this.statusClient = statusClient;
        this.sendGridClient = sendGridClient;
        this.rabbitTemplate = rabbitTemplate;
    }

    public void process(EmailRequestDto request, String correlationId) {
        MDC.put("correlation_id", correlationId);
        log.info("Processing email request {}", request.request_id());

        try {
            // Update status to sending
            statusClient.updateStatus(request.request_id(), "sending");

            // 1. fetch template
            TemplateDto template = templateClient.fetchTemplate(request.template());

            // 2. render body
            String body = TemplateRenderer.render(template.template_body(), request.data());
            String subject = template.subject();

            // 3. send with exponential backoff attempts: 1st: immediate; retries: 2s,4s,8s
            int[] backoffs = {0, 2000, 4000, 8000}; // ms
            boolean sent = false;
            for (int attempt = 0; attempt < backoffs.length; attempt++) {
                if (attempt > 0) {
                    log.info("Retry attempt {} for request {}", attempt, request.request_id());
                    Thread.sleep(backoffs[attempt]);
                }
                try {
                    boolean ok = sendGridClient.sendEmail(request.email(), subject, body);
                    if (ok) {
                        sent = true;
                        break;
                    } else {
                        log.warn("SendGrid returned non-2xx, will retry if attempts remain.");
                    }
                } catch (Exception ex) {
                    log.error("Error sending email on attempt {}: {}", attempt, ex.getMessage());
                }
            }

            if (sent) {
                statusClient.updateStatus(request.request_id(), "delivered");
                log.info("Email delivered for request {}", request.request_id());
            } else {
                statusClient.updateStatus(request.request_id(), "failed");
                log.error("Failed to deliver email for request {}. Sending to dead-letter queue", request.request_id());
                // push original message to failed.queue
                rabbitTemplate.convertAndSend(EMAIL_EXCHANGE, FAILED_ROUTING_KEY, request);
            }
        } catch (Exception e) {
            log.error("Unhandled exception processing email {}: {}", request.request_id(), e.getMessage(), e);
            // best effort: update failed and push to dead-letter
            try { statusClient.updateStatus(request.request_id(), "failed"); } catch (Exception ex) { log.warn("Failed to update status: {}", ex.getMessage()); }
            rabbitTemplate.convertAndSend(EMAIL_EXCHANGE, FAILED_ROUTING_KEY, request);
        } finally {
            MDC.remove("correlation_id");
        }
    }
}
