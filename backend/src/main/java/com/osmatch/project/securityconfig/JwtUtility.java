package com.osmatch.project.securityconfig;

import java.security.Key;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;

import java.util.*;

@Component
public class JwtUtility {
    @Value("${jwt.secret}")
    private String secret;

    private Key secretKey;
    private final long expirationTime = 86400000;

    @PostConstruct
    public void init() {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes());
    }

    public String generateToken(String userId) {
        JwtBuilder builder = Jwts.builder();
        Date now = new Date();
        Date expiration = new Date(System.currentTimeMillis() + expirationTime);

        return builder.setIssuedAt(now)
                .setExpiration(expiration)
                .setSubject(userId)
                .signWith(secretKey)
                .compact();
    }

    public String validateToken(String token) {
        try {
            Jws<Claims> parser = Jwts.parserBuilder()
                    .setSigningKey(secretKey)
                    .build()
                    .parseClaimsJws(token);

            // returns the userId in the payload
            String userId = parser.getBody().getSubject();

            return userId;
        }

        catch (JwtException e) {
            System.out.print("JwtUtility Exception: " + e.getMessage());
            return null;
        }
    }

}
