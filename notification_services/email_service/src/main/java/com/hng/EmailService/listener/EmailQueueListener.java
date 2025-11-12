package com.hng.EmailService.listener;

import com.hng.EmailService.dto.EmailRequestDto;
import com.hng.EmailService.service.EmailProcessingService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class EmailQueueListener {

    private final EmailProcessingService processingService;
    private final Jackson2JsonMessageConverter converter = new Jackson2JsonMessageConverter();

    public EmailQueueListener(EmailProcessingService service) {
        this.processingService = service;
    }

    @RabbitListener(queues = "${rabbitmq.queue.email}")
    public void onMessage(@Payload EmailRequestDto request, Message message) {
        // correlation id can be header "correlation_id", or AMQP correlation id
        String correlationId = message.getMessageProperties().getHeader("correlation_id");
        if (correlationId == null) {
            correlationId = message.getMessageProperties().getCorrelationId();
        }
        if (correlationId == null) {
            correlationId = request.request_id();
        }
        processingService.process(request, correlationId);
    }
}
