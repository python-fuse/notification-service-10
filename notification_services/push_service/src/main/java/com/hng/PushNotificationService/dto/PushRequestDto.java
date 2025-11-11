package com.hng.PushNotificationService.dto;

import java.util.Map;

public record PushRequestDto(
        String request_id,
        String user_id,
        String channel,
        String push_token,
        String template_code,
        Map<String, Object> data
) {}
