package com.hng.PushNotificationService.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

@Component
public class NotificationStatusClient {

    private final WebClient webClient;
    public NotificationStatusClient(@Value("${notification.service-url}") String url) {
        this.webClient = WebClient.builder().baseUrl(url).build();
    }

    public void updateStatus(String requestId, String status) {
        webClient.patch()
                .uri("/push/{id}", requestId)
                .bodyValue(java.util.Map.of("status", status))
                .retrieve()
                .bodyToMono(Void.class)
                .block();
    }
}
