package com.hng.EmailService.dto;

public record TemplateResponseDto(boolean success, String message, TemplateDto data) { }
