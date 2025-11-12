package com.hng.EmailService.controller;

import com.sendgrid.SendGrid;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class HealthController {

    private final ConnectionFactory rabbitConnectionFactory;
    private final SendGrid sendGrid;
    private final String sendGridApiKey;

    public HealthController(ConnectionFactory rabbitConnectionFactory,
                            @Value("${sendgrid.api-key}") String sendGridApiKey) {
        this.rabbitConnectionFactory = rabbitConnectionFactory;
        this.sendGridApiKey = sendGridApiKey;
        this.sendGrid = new SendGrid(sendGridApiKey);
    }

    @Operation(summary = "Health check for email service")
    @GetMapping("/health")
    public ResponseEntity<?> health() {
        String rabbitStatus = "unknown";
        try {
            rabbitConnectionFactory.createConnection().close();
            rabbitStatus = "connected";
        } catch (Exception e) {
            rabbitStatus = "disconnected";
        }

        String sendGridStatus = (sendGridApiKey == null || sendGridApiKey.isEmpty()) ? "not-configured" : "connected"; // optionally attempt a minimal request

        Map<String, Object> body = Map.of(
                "success", true,
                "message", "email service healthy",
                "data", Map.of("send_grid", sendGridStatus, "rabbitmq", rabbitStatus),
                "meta", null
        );
        return ResponseEntity.ok(body);
    }
}
