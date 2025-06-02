package com.osmatch.project.controllers;

import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import com.osmatch.project.repository.UserRepository;
import com.osmatch.project.securityconfig.*;
import com.osmatch.project.entity.*;
import jakarta.servlet.http.HttpServletRequest;

// Checks a JWT from localStorage to see if a user is still authenticated
@RestController
public class JWTController {

    @Autowired
    JwtUtility utility;

    @Autowired
    UserRepository userRepo;

    @GetMapping("/protected/jwt")
    public ResponseEntity<?> validateJWT(HttpServletRequest request) {

        String userId = (String) request.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Long longUserId = Long.parseLong(userId);
        UserEntity user = userRepo.findById(longUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        String username = user.getUsername();
        Integer totalSwipes = user.getTotalSwipes();
        Integer totalMatches = user.getTotalMatches();
        return ResponseEntity.ok(Map.of(
                "message", "JWT Validated for User.",
                "userId", userId,
                "username", username,
                "totalSwipes", totalSwipes,
                "totalMatches", totalMatches));
    }

}
