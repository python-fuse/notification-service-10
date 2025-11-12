package com.hng.PushNotificationService.service;

import com.hng.PushNotificationService.dto.PushRequestDto;
import com.hng.PushNotificationService.util.TemplateRenderer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

import static com.hng.PushNotificationService.config.RabbitConfig.PUSH_EXCHANGE;
import static com.hng.PushNotificationService.config.RabbitConfig.FAILED_ROUTING_KEY;

@Service
public class PushProcessingService {

    private static final Logger log = LoggerFactory.getLogger(PushProcessingService.class);

    private final OneSignalClient oneSignalClient;
    private final RabbitTemplate rabbitTemplate;
    private final StringRedisTemplate redisTemplate;
    private final String processedKeyPrefix;

    public PushProcessingService(OneSignalClient oneSignalClient,
                                 RabbitTemplate rabbitTemplate,
                                 StringRedisTemplate redisTemplate,
                                 @Value("${redis.processed-key-prefix}") String processedKeyPrefix) {
        this.oneSignalClient = oneSignalClient;
        this.rabbitTemplate = rabbitTemplate;
        this.redisTemplate = redisTemplate;
        this.processedKeyPrefix = processedKeyPrefix;
    }

    public void process(PushRequestDto request, String correlationId) {
        MDC.put("correlation_id", correlationId);
        String requestId = request.request_id();
        String redisKey = processedKeyPrefix + requestId;
        try {
            // idempotency: check Redis
            Boolean already = redisTemplate.hasKey(redisKey);
            if (Boolean.TRUE.equals(already)) {
                log.info("Request {} already processed. Skipping.", requestId);
                return;
            }

//            statusClient.updateStatus(requestId, "sending");

            // fetch template
//            TemplateDto template = templateClient.fetchTemplate(request.template_code());
//            String title = template.subject(); // subject used as title
//            String body = TemplateRenderer.render(template.template_body(), request.data());

            String renderedBody = TemplateRenderer.render(request.body(), request.data());
            String subject = request.subject();

            // validate push token
            if (!isValidToken(request.push_token())) {
                log.warn("Invalid push token for request {}: {}", requestId, request.push_token());
                rabbitTemplate.convertAndSend(PUSH_EXCHANGE, FAILED_ROUTING_KEY, request);
                return;
            }

            // retries/backoff: immediate try, then 2s, 4s, 8s
            int[] backoffs = {0, 2000, 4000, 8000};
            boolean sent = false;
            for (int attempt = 0; attempt < backoffs.length; attempt++) {
                if (attempt > 0) {
                    log.info("Retry attempt {} for request {}", attempt, requestId);
                    Thread.sleep(backoffs[attempt]);
                }
                try {
                    boolean ok = oneSignalClient.sendNotification(request.push_token(), subject, renderedBody, request.data());
                    if (ok) {
                        sent = true;
                        break;
                    } else {
                        log.warn("OneSignal send returned false attempt {}", attempt);
                    }
                } catch (Exception ex) {
                    log.error("Error sending via OneSignal attempt {}: {}", attempt, ex.getMessage());
                }
            }

            if (sent) {
//                statusClient.updateStatus(requestId, "delivered");
                // mark processed in Redis for idempotency; set TTL to e.g., 7 days
                redisTemplate.opsForValue().set(redisKey, "1", Duration.ofDays(7));
                log.info("Push delivered for request {}", requestId);
                // Send to status.queue after success
                rabbitTemplate.convertAndSend(
                        "status.queue",
                        new PushRequestDto(
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
//                statusClient.updateStatus(requestId, "failed");
                rabbitTemplate.convertAndSend(PUSH_EXCHANGE, FAILED_ROUTING_KEY, request);
                log.error("Push failed for request {} and sent to dead-letter", requestId);
            }

        } catch (Exception e) {
            log.error("Unhandled exception processing push {}: {}", requestId, e.getMessage(), e);
        } finally {
            MDC.remove("correlation_id");
        }
    }

    private boolean isValidToken(String token) {
        return token != null && !token.isBlank() && token.length() > 5;
    }
}
