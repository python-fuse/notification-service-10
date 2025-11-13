package com.hng.EmailService.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Service
public class RedisService {

    private static final Logger log = LoggerFactory.getLogger(RedisService.class);
    private final RedisTemplate<String, Object> redisTemplate;

    public RedisService(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    // Save value with optional expiry
    public void save(String key, Object value, long ttlSeconds) {
        redisTemplate.opsForValue().set(key, value, ttlSeconds, TimeUnit.SECONDS);
        log.info("Saved {} to Redis with TTL {}s", key, ttlSeconds);
    }

    // Fetch value by key
    public Object fetch(String key) {
        Object value = redisTemplate.opsForValue().get(key);
        log.info("Fetched {} from Redis -> {}", key, value);
        return value;
    }

    // Delete value
    public void delete(String key) {
        redisTemplate.delete(key);
        log.info("Deleted {} from Redis", key);
    }

    // Update status in the notification lifecycle
    public void updateStatus(String requestId, String newStatus) {
        String redisKey = "status:" + requestId;
        Object redisValue = fetch(redisKey);
        
        if (redisValue == null) {
            log.warn("Cannot update status for {}: Record not found in Redis", requestId);
            return;
        }

        try {
            // Parse the Redis structure
            Map<String, Object> redisMap = (Map<String, Object>) redisValue;
            Map<String, Object> value = (Map<String, Object>) redisMap.get("value");
            Long expires = (Long) redisMap.get("expires");
            
            if (value != null) {
                // Update the status and timestamp
                value.put("status", newStatus);
                value.put("updated_at", Instant.now().toString());
                
                // If there's an error, clear it when status changes
                if (!"failed".equals(newStatus)) {
                    value.put("error_message", null);
                }
                
                // Calculate remaining TTL
                long currentTime = System.currentTimeMillis();
                long ttlSeconds = expires != null ? (expires - currentTime) / 1000 : 3600;
                
                if (ttlSeconds > 0) {
                    // Save back to Redis
                    redisMap.put("value", value);
                    save(redisKey, redisMap, ttlSeconds);
                    log.info("Updated status for {} to: {}", requestId, newStatus);
                } else {
                    log.warn("Status update skipped for {}: Record expired", requestId);
                }
            }
        } catch (Exception e) {
            log.error("Failed to update status for {}: {}", requestId, e.getMessage(), e);
        }
    }

    // Update status with error message
    public void updateStatusWithError(String requestId, String newStatus, String errorMessage) {
        String redisKey = "status:" + requestId;
        Object redisValue = fetch(redisKey);
        
        if (redisValue == null) {
            log.warn("Cannot update status for {}: Record not found in Redis", requestId);
            return;
        }

        try {
            Map<String, Object> redisMap = (Map<String, Object>) redisValue;
            Map<String, Object> value = (Map<String, Object>) redisMap.get("value");
            Long expires = (Long) redisMap.get("expires");
            
            if (value != null) {
                value.put("status", newStatus);
                value.put("updated_at", Instant.now().toString());
                value.put("error_message", errorMessage);
                
                long currentTime = System.currentTimeMillis();
                long ttlSeconds = expires != null ? (expires - currentTime) / 1000 : 3600;
                
                if (ttlSeconds > 0) {
                    redisMap.put("value", value);
                    save(redisKey, redisMap, ttlSeconds);
                    log.info("Updated status for {} to: {} with error: {}", requestId, newStatus, errorMessage);
                }
            }
        } catch (Exception e) {
            log.error("Failed to update status with error for {}: {}", requestId, e.getMessage(), e);
        }
    }
}
