package com.hng.EmailService.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Component
public class TemplateServiceClient {

    private static final Logger log = LoggerFactory.getLogger(TemplateServiceClient.class);
    
    private final RestTemplate restTemplate;
    private final String baseUrl;
    private final String renderEndpoint;

    public TemplateServiceClient(
            @Value("${template-service.base-url}") String baseUrl,
            @Value("${template-service.render-endpoint}") String renderEndpoint) {
        this.restTemplate = new RestTemplate();
        this.baseUrl = baseUrl;
        this.renderEndpoint = renderEndpoint;
        log.info("Template service client initialized with base URL: {}", baseUrl);
    }

    /**
     * Render a template by code with variables
     */
    public String renderTemplate(String templateCode, Map<String, Object> variables) {
        try {
            String url = baseUrl + renderEndpoint;
            
            // Build request body
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("template_code", templateCode);
            requestBody.put("variables", variables);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
            
            log.info("Calling template service to render template: {}", templateCode);
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> body = response.getBody();
                Boolean success = (Boolean) body.get("success");
                
                if (Boolean.TRUE.equals(success)) {
                    Map<String, Object> data = (Map<String, Object>) body.get("data");
                    if (data != null) {
                        String rendered = (String) data.get("rendered");
                        log.info("Successfully rendered template: {}", templateCode);
                        return rendered;
                    }
                }
                
                log.error("Template service returned unsuccessful response: {}", body);
                throw new RuntimeException("Template rendering failed: " + body.get("error"));
            }
            
            log.error("Template service returned non-2xx status: {}", response.getStatusCode());
            throw new RuntimeException("Template service returned status: " + response.getStatusCode());
            
        } catch (Exception e) {
            log.error("Failed to render template {}: {}", templateCode, e.getMessage(), e);
            throw new RuntimeException("Failed to render template via template service: " + e.getMessage(), e);
        }
    }
    
    /**
     * Render an inline template string with variables
     */
    public String renderInlineTemplate(String templateString, Map<String, Object> variables) {
        try {
            String url = baseUrl + renderEndpoint;
            
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("template_str", templateString);
            requestBody.put("variables", variables);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
            
            log.info("Calling template service to render inline template");
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> body = response.getBody();
                Boolean success = (Boolean) body.get("success");
                
                if (Boolean.TRUE.equals(success)) {
                    Map<String, Object> data = (Map<String, Object>) body.get("data");
                    if (data != null) {
                        String rendered = (String) data.get("rendered");
                        log.info("Successfully rendered inline template");
                        return rendered;
                    }
                }
                
                log.error("Template service returned unsuccessful response: {}", body);
                throw new RuntimeException("Inline template rendering failed: " + body.get("error"));
            }
            
            log.error("Template service returned non-2xx status: {}", response.getStatusCode());
            throw new RuntimeException("Template service returned status: " + response.getStatusCode());
            
        } catch (Exception e) {
            log.error("Failed to render inline template: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to render inline template via template service: " + e.getMessage(), e);
        }
    }
}
