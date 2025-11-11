package com.hng.PushNotificationService.util;

import java.util.Map;

public class TemplateRenderer {

    public static String render(String templateBody, Map<String, Object> variables) {
        if (templateBody == null) return null;
        String rendered = templateBody;
        for (Map.Entry<String, Object> e : variables.entrySet()) {
            String placeholder = "{{" + e.getKey() + "}}";
            String value = e.getValue() == null ? "" : e.getValue().toString();
            rendered = rendered.replace(placeholder, value);
        }
        return rendered;
    }
}
