package com.hng.PushNotificationService.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitConfig {

    private static final Logger log = LoggerFactory.getLogger(RabbitConfig.class);

    public static final String PUSH_EXCHANGE = "push.exchange";
    public static final String PUSH_QUEUE = "push.queue";
    public static final String PUSH_ROUTING_KEY = "push.routing.key";

    public static final String FAILED_QUEUE = "failed.queue";
    public static final String FAILED_ROUTING_KEY = "failed.routing.key";

    @Bean
    public Jackson2JsonMessageConverter messageConverter() {
        log.info("🔧 Configuring Jackson2JsonMessageConverter for RabbitMQ");
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public DirectExchange pushExchange() {
        log.info("🔧 Creating push exchange: {}", PUSH_EXCHANGE);
        return ExchangeBuilder.directExchange(PUSH_EXCHANGE).durable(true).build();
    }

    @Bean
    public Queue pushQueue() {
        log.info("🔧 Creating push queue: {}", PUSH_QUEUE);
        return QueueBuilder.durable(PUSH_QUEUE).build();
    }

    @Bean
    public Queue failedQueue() {
        log.info("🔧 Creating failed queue: {}", FAILED_QUEUE);
        return QueueBuilder.durable(FAILED_QUEUE).build();
    }

    @Bean
    public Binding pushBinding(Queue pushQueue, DirectExchange pushExchange) {
        log.info("🔧 Binding {} to {} with routing key: {}", PUSH_QUEUE, PUSH_EXCHANGE, PUSH_ROUTING_KEY);
        return BindingBuilder.bind(pushQueue).to(pushExchange).with(PUSH_ROUTING_KEY);
    }

    @Bean
    public Binding failedBinding(Queue failedQueue, DirectExchange pushExchange) {
        log.info("🔧 Binding {} to {} with routing key: {}", FAILED_QUEUE, PUSH_EXCHANGE, FAILED_ROUTING_KEY);
        return BindingBuilder.bind(failedQueue).to(pushExchange).with(FAILED_ROUTING_KEY);
    }

    // Listener factory with MANUAL acknowledgment mode
    @Bean
    public SimpleRabbitListenerContainerFactory rabbitListenerContainerFactory(ConnectionFactory connectionFactory) {
        log.info("🔧 Configuring RabbitMQ listener factory with MANUAL acknowledgment");
        SimpleRabbitListenerContainerFactory f = new SimpleRabbitListenerContainerFactory();
        f.setConnectionFactory(connectionFactory);
        f.setAcknowledgeMode(AcknowledgeMode.MANUAL);
        f.setPrefetchCount(10);
        f.setMessageConverter(messageConverter());
        log.info("✅ RabbitMQ listener factory configured successfully");
        return f;
    }
}
