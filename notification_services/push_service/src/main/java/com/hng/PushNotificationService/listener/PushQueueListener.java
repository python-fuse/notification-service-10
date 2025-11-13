package com.hng.PushNotificationService.listener;

import com.hng.PushNotificationService.dto.PushRequestDto;
import com.hng.PushNotificationService.service.PushProcessingService;
import com.rabbitmq.client.Channel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class PushQueueListener {

    private static final Logger log = LoggerFactory.getLogger(PushQueueListener.class);
    private final PushProcessingService processingService;

    public PushQueueListener(PushProcessingService processingService) {
        this.processingService = processingService;
    }

    @RabbitListener(queues = "${rabbitmq.queue.push}")
    public void onMessage(PushRequestDto request, Message message, Channel channel) {
        String correlationId = message.getMessageProperties().getHeader("correlation_id");
        if (correlationId == null) {
            correlationId = message.getMessageProperties().getCorrelationId();
        }
        if (correlationId == null) correlationId = request.request_id();

        long deliveryTag = message.getMessageProperties().getDeliveryTag();
        
        try {
            log.info("Received push notification request: {}", request.request_id());
            processingService.process(request, correlationId);
            
            // Acknowledge the message after successful processing
            channel.basicAck(deliveryTag, false);
            log.info("Message acknowledged for request: {}", request.request_id());
            
        } catch (Exception e) {
            log.error("Failed to process push notification {}: {}", request.request_id(), e.getMessage(), e);
            try {
                // Negative acknowledgment - requeue=false (send to DLQ if configured)
                channel.basicNack(deliveryTag, false, false);
                log.warn("Message rejected for request: {}", request.request_id());
            } catch (Exception nackEx) {
                log.error("Failed to nack message: {}", nackEx.getMessage());
            }
        }
    }
}
