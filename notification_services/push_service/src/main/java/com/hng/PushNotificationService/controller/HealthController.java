package com.hng.PushNotificationService.controller;

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

    private final ConnectionFactory rabbitFactory;
    private final String oneSignalApiKey;
    private final RedisTemplate<String, Object> redisTemplate;

    public HealthController(ConnectionFactory rabbitFactory, @Value("${onesignal.api-key:}") String oneSignalApiKey, RedisTemplate<String, Object> redisTemplate) {
        this.rabbitFactory = rabbitFactory;
        this.redisTemplate = redisTemplate;
        this.oneSignalApiKey = oneSignalApiKey;
    }

    @Operation(summary = "Health check for push notification service")
    @GetMapping("/health")
    public ResponseEntity<?> health() {
        String rabbitStatus = "unknown";
        try {
            var conn = rabbitFactory.createConnection();
            conn.close();
            rabbitStatus = "connected";
        } catch (Exception e) {
            rabbitStatus = "disconnected";
        }

        String oneSignalStatus = (oneSignalApiKey == null || oneSignalApiKey.isBlank()) ? "not-configured" : "connected";

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
        body.put("message", "push notification service healthy");
        body.put("data", Map.of(
                "one_signal", oneSignalStatus,
                "rabbitmq", rabbitStatus,
                "redis", redisStatus
        ));
        body.put("meta", null);
        return ResponseEntity.ok(body);
    }
}
