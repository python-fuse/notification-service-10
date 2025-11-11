package com.hng.PushNotificationService.service;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;

@Component
public class OneSignalClient {

    private final WebClient webClient;
    private final String appId;

    public OneSignalClient(@Value("${onesignal.url}") String baseUrl,
                           @Value("${onesignal.api-key}") String apiKey,
                           @Value("${onesignal.app-id}") String appId) {
        this.webClient = WebClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader("Authorization", "Basic " + apiKey)
                .build();
        this.appId = appId;
    }

    @CircuitBreaker(name = "oneSignalCircuit", fallbackMethod = "fallback")
    public boolean sendNotification(String pushToken, String title, String body, Map<String, Object> data) {
        Map<String, Object> payload = Map.of(
                "app_id", appId,
                // OneSignal targets: include_player_ids OR include_external_user_ids, etc.
                "include_player_ids", java.util.List.of(pushToken),
                "headings", Map.of("en", title),
                "contents", Map.of("en", body),
                "data", data
        );

        // block for simplicity; this method returns true if 200-299
        Map resp = webClient.post()
                .uri("/notifications")
                .bodyValue(payload)
                .retrieve()
                .bodyToMono(Map.class)
                .block();

        // If resp contains "id" or "recipients", consider success
        return resp != null && (resp.get("id") != null || resp.get("recipients") != null);
    }

    public boolean fallback(String pushToken, String title, String body, Map<String,Object> data, Throwable t) {
        // circuit open or permanent failure -> signal failure to caller
        return false;
    }
}
