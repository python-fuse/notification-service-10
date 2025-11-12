package com.hng.EmailService.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

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
}
