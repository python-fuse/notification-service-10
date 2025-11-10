package com.hng.EmailService.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitConfig {
    public static final String EMAIL_EXCHANGE = "email.exchange";
    public static final String EMAIL_QUEUE = "email.queue";
    public static final String EMAIL_ROUTING_KEY = "email.routing.key";

    public static final String FAILED_QUEUE = "failed.queue";
    public static final String FAILED_ROUTING_KEY = "failed.routing.key";

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
    public SimpleRabbitListenerContainerFactory rabbitListenerContainerFactory(ConnectionFactory connectionFactory) {
        SimpleRabbitListenerContainerFactory f = new SimpleRabbitListenerContainerFactory();
        f.setConnectionFactory(connectionFactory);
        f.setAcknowledgeMode(AcknowledgeMode.AUTO);
        f.setPrefetchCount(10);
        return f;
    }
}
