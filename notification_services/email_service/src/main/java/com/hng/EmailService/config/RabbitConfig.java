package com.hng.EmailService.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitConfig {
    public static final String EMAIL_EXCHANGE = "notifications.direct";
    public static final String EMAIL_QUEUE = "email.queue";
    public static final String EMAIL_ROUTING_KEY = "email";

    public static final String FAILED_QUEUE = "failed.queue";
    public static final String FAILED_ROUTING_KEY = "failed.routing.key";

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public DirectExchange emailExchange() {
        return ExchangeBuilder.directExchange(EMAIL_EXCHANGE).durable(true).build();
    }

    @Bean
    public Queue emailQueue() {
        return QueueBuilder.durable(EMAIL_QUEUE)
                // configure dead-lettering in RabbitMQ if desired (not used by manual DLQ push)
                .build();
    }

    @Bean
    public Queue failedQueue() {
        return QueueBuilder.durable(FAILED_QUEUE).build();
    }

    @Bean
    public Binding emailBinding(Queue emailQueue, DirectExchange emailExchange) {
        return BindingBuilder.bind(emailQueue).to(emailExchange).with(EMAIL_ROUTING_KEY);
    }

    @Bean
    public Binding failedBinding(Queue failedQueue, DirectExchange emailExchange) {
        return BindingBuilder.bind(failedQueue).to(emailExchange).with(FAILED_ROUTING_KEY);
    }

    // Listener factory (optional: concurrency, prefetch)
    @Bean
    public SimpleRabbitListenerContainerFactory rabbitListenerContainerFactory(
            ConnectionFactory connectionFactory,
            MessageConverter jsonMessageConverter) {
        SimpleRabbitListenerContainerFactory f = new SimpleRabbitListenerContainerFactory();
        f.setConnectionFactory(connectionFactory);
        f.setMessageConverter(jsonMessageConverter);
        f.setAcknowledgeMode(AcknowledgeMode.MANUAL);  // Changed to MANUAL for explicit control
        f.setPrefetchCount(10);
        f.setDefaultRequeueRejected(false);  // Don't requeue failed messages (send to DLQ instead)
        return f;
    }
}
