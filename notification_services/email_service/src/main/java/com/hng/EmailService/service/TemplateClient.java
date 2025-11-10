package com.hng.EmailService.service;

import com.hng.EmailService.dto.TemplateDto;
import com.hng.EmailService.dto.TemplateResponseDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

@Component
public class TemplateClient {
    private final WebClient webClient;

    public TemplateClient(@Value("${template.service-url}") String baseUrl) {
        this.webClient = WebClient.builder()
                .baseUrl(baseUrl)
                .build();
    }

    public TemplateDto fetchTemplate(String templateCode) {
        TemplateResponseDto resp = webClient.get()
                .uri("/templates/{code}", templateCode)
                .retrieve()
                .bodyToMono(TemplateResponseDto.class)
                .block(); // synchronous for simplicity
        if (resp == null || !resp.success()) {
            throw new RuntimeException("Template service returned error or null");
        }
        return resp.data();
    }
}
