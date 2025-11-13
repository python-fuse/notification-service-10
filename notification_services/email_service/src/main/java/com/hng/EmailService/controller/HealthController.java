package com.hng.EmailService.controller;

import com.sendgrid.SendGrid;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
public class HealthController {

    private final ConnectionFactory rabbitConnectionFactory;
    private final SendGrid sendGrid;
    private final RedisTemplate<String, Object> redisTemplate;
    private final String sendGridApiKey;

    public HealthController(ConnectionFactory rabbitConnectionFactory,
                            RedisTemplate<String, Object> redisTemplate,
                            @Value("${sendgrid.api-key}") String sendGridApiKey) {
        this.rabbitConnectionFactory = rabbitConnectionFactory;
        this.redisTemplate = redisTemplate;
        this.sendGridApiKey = sendGridApiKey;
        this.sendGrid = new SendGrid(sendGridApiKey);
    }

    @Operation(summary = "Health check for email service")
    @GetMapping("/health")
    public ResponseEntity<?> health() {
        // RabbitMQ check
        String rabbitStatus = "unknown";
        try {
            rabbitConnectionFactory.createConnection().close();
            rabbitStatus = "connected";
        } catch (Exception e) {
            rabbitStatus = "disconnected";
        }

        // SendGrid check
        String sendGridStatus = (sendGridApiKey == null || sendGridApiKey.isEmpty()) ? "not-configured" : "connected";

        // Redis check
        String redisStatus = "unknown";
        try {
            redisTemplate.hasKey("test-key"); // simple ping
            redisStatus = "connected";
        } catch (Exception e) {
            redisStatus = "disconnected";
        }

        Map<String, Object> body = new HashMap<>();
        body.put("success", true);
        body.put("message", "email service healthy");
        body.put("data", Map.of(
                "send_grid", sendGridStatus,
                "rabbitmq", rabbitStatus,
                "redis", redisStatus
        ));
        body.put("meta", null);
        return ResponseEntity.ok(body);
    }
}