package com.hng.PushNotificationService.dto;

import java.util.Map;

public record PushRequestDto(
        String channel,
        String request_id,
        String user_id,
        String template_code,
        String subject,
        String body,
        String timestamp,
        Map<String, Object> data,
        String correlation_id,
        int attempts,
        String email,
        String push_token
) {}
