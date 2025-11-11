package com.hng.PushNotificationService.service;

import com.hng.PushNotificationService.dto.TemplateDto;
import com.hng.PushNotificationService.dto.TemplateResponseDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

@Component
public class TemplateClient {

    private final WebClient webClient;
    public TemplateClient(@Value("${template.service-url}") String baseUrl) {
        this.webClient = WebClient.builder().baseUrl(baseUrl).build();
    }

    public TemplateDto fetchTemplate(String code) {
        TemplateResponseDto resp = webClient.get()
                .uri("/templates/{code}", code)
                .retrieve()
                .bodyToMono(TemplateResponseDto.class)
                .block();
        if (resp == null || !resp.success()) {
            throw new RuntimeException("Failed to fetch template: " + code);
        }
        return resp.data();
    }
}
