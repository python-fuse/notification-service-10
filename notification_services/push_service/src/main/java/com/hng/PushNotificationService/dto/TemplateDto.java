package com.hng.PushNotificationService.dto;

import java.util.List;

public record TemplateDto(
        String template_code,
        String subject,
        String template_body,
        List<String> variables,
        int version
) {}
