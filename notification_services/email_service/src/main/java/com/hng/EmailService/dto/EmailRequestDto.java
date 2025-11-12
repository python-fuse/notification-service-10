package com.hng.EmailService.dto;

import java.util.Map;

public record EmailRequestDto(
        String request_id,
        String user_id,
        String email,
        String template,
        Map<String, Object> data
) {}
