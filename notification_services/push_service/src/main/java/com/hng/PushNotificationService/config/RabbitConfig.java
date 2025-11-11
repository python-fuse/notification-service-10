package com.hng.PushNotificationService.config;

import org.springframework.amqp.core.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitConfig {

    public static final String EXCHANGE = "push.exchange";
    public static final String PUSH_QUEUE = "push.queue";
    public static final String PUSH_ROUTING_KEY = "push.routing.key";

    public static final String FAILED_QUEUE = "failed.queue";
    public static final String FAILED_ROUTING_KEY = "failed.routing.key";

    @Bean
    public DirectExchange pushExchange() {
        return ExchangeBuilder.directExchange(EXCHANGE).durable(true).build();
    }

    @Bean
    public Queue pushQueue() {
        return QueueBuilder.durable(PUSH_QUEUE).build();
    }

    @Bean
    public Queue failedQueue() {
        return QueueBuilder.durable(FAILED_QUEUE).build();
    }

    @Bean
    public Binding pushBinding(Queue pushQueue, DirectExchange pushExchange) {
        return BindingBuilder.bind(pushQueue).to(pushExchange).with(PUSH_ROUTING_KEY);
    }

    @Bean
    public Binding failedBinding(Queue failedQueue, DirectExchange pushExchange) {
        return BindingBuilder.bind(failedQueue).to(pushExchange).with(FAILED_ROUTING_KEY);
    }
}
