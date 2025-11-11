package com.hng.PushNotificationService.controller;

import io.swagger.v3.oas.annotations.Operation;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class HealthController {

    private final ConnectionFactory rabbitFactory;
    private final String oneSignalApiKey;

    public HealthController(ConnectionFactory rabbitFactory, @Value("${onesignal.api-key:}") String oneSignalApiKey) {
        this.rabbitFactory = rabbitFactory;
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

        Map<String,Object> body = Map.of(
                "success", true,
                "message", "push notification service healthy",
                "data", Map.of("one_signal", oneSignalStatus, "rabbitmq", rabbitStatus),
                "meta", null
        );
        return ResponseEntity.ok(body);
    }
}
