package com.hng.EmailService.listener;

import com.hng.EmailService.dto.EmailRequestDto;
import com.hng.EmailService.service.EmailProcessingService;
import com.rabbitmq.client.Channel;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.support.AmqpHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class EmailQueueListener {

    private final EmailProcessingService processingService;

    public EmailQueueListener(EmailProcessingService service) {
        this.processingService = service;
    }

    @RabbitListener(queues = "${rabbitmq.queue.email}")
    public void onMessage(@Payload EmailRequestDto request, 
                         Message message,
                         Channel channel,
                         @Header(AmqpHeaders.DELIVERY_TAG) long deliveryTag) {
        try {
            // correlation id can be header "correlation_id", or AMQP correlation id
            String correlationId = message.getMessageProperties().getHeader("correlation_id");
            if (correlationId == null) {
                correlationId = message.getMessageProperties().getCorrelationId();
            }
            if (correlationId == null) {
                correlationId = request.request_id();
            }
            
            // Process the message
            processingService.process(request, correlationId);
            
            // Only acknowledge if processing was successful
            channel.basicAck(deliveryTag, false);
            log.info("Message acknowledged successfully for request: {}", request.request_id());
            
        } catch (Exception e) {
            log.error("Failed to process message for request: {}", request.request_id(), e);
            try {
                // Reject the message and don't requeue (will go to DLQ if configured)
                channel.basicNack(deliveryTag, false, false);
            } catch (Exception ex) {
                log.error("Failed to reject message", ex);
            }
        }
    }
}
