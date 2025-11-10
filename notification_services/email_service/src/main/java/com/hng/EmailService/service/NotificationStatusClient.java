package com.hng.EmailService.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

@Component
public class NotificationStatusClient {

    private final WebClient webClient;

    public NotificationStatusClient(@Value("${notification.service-url}") String baseUrl) {
        this.webClient = WebClient.builder().baseUrl(baseUrl).build();
    }

    public void updateStatus(String requestId, String status) {
        webClient.patch()
                .uri("/emails/{requestId}", requestId)
                .bodyValue(java.util.Map.of("status", status))
                .retrieve()
                .bodyToMono(Void.class)
                .block();
    }
}
