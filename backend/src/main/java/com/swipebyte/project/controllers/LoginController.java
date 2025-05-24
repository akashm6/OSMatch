package com.swipebyte.project.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import java.util.*;
import com.swipebyte.project.entity.*;
import com.swipebyte.project.dto.*;
import com.swipebyte.project.securityconfig.*;

import com.swipebyte.project.repository.UserRepository;

@RestController
public class LoginController {

    @Autowired
    private UserRepository userRepo;

    @Autowired
    private PasswordEncoder encoder;

    @Autowired
    private JwtUtility jwtUtility;

    @PostMapping("/auth/login")
    public ResponseEntity<?> login(@RequestBody LoginDto login) {

        String input_pass = login.getPassword();
        String input_email = login.getEmail() != null ? login.getEmail() : null;

        UserEntity user = userRepo.findByEmail(input_email);

        if (user == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "This user does not exist."));
        }

        if (user.getIsOAuthLogin() == 1) {

            return ResponseEntity.badRequest().body(Map.of("message", "This email is already registered with OAuth."));
        }

        if (encoder.matches(input_pass, user.getPassword())) {

            String token = jwtUtility.generateToken(user.getId().toString());

            return ResponseEntity.ok(Map.of(
                    "token", token,
                    "userId", user.getId(),
                    "bio", user.getProfile().getBio(),
                    "email", user.getEmail(),
                    "message", "Login successful!"));
        }

        return ResponseEntity.badRequest()
                .body(Map.of("message", "Incorrect password."));
    }

    @PostMapping("auth/login/oauth/success")
    public ResponseEntity<?> handleGithubLogin(@AuthenticationPrincipal OAuth2User user) {
        return ResponseEntity.ok(user.getAttributes());

    }
}
