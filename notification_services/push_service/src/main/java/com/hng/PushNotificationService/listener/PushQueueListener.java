package com.hng.PushNotificationService.listener;

import com.hng.PushNotificationService.dto.PushRequestDto;
import com.hng.PushNotificationService.service.PushProcessingService;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class PushQueueListener {

    private final PushProcessingService processingService;

    public PushQueueListener(PushProcessingService processingService) {
        this.processingService = processingService;
    }

    @RabbitListener(queues = "${rabbitmq.queue.push}")
    public void onMessage(PushRequestDto request, Message message) {
        String correlationId = message.getMessageProperties().getHeader("correlation_id");
        if (correlationId == null) {
            correlationId = message.getMessageProperties().getCorrelationId();
        }
        if (correlationId == null) correlationId = request.request_id();

        processingService.process(request, correlationId);
    }
}
