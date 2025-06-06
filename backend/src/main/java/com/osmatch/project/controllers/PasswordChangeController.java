package com.osmatch.project.controllers;

import java.util.Date;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import com.osmatch.project.dto.PassChangeDto;
import com.osmatch.project.entity.PasswordResetToken;
import com.osmatch.project.entity.UserEntity;
import com.osmatch.project.repository.PasswordResetTokenRepository;
import com.osmatch.project.repository.UserRepository;

import jakarta.transaction.Transactional;

@RestController
public class PasswordChangeController {

        @Autowired
        UserRepository userRepo;

        @Autowired
        PasswordResetTokenRepository passRepo;

        @Autowired
        JavaMailSender mailSender;

        @Autowired
        BCryptPasswordEncoder encoder;

        @Transactional
        @PostMapping("/auth/sendEmail")
        public ResponseEntity<?> sendPasswordEmail(@RequestBody String email) {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setTo(email);
                message.setSubject("Reset Password - OSMatch");

                int expirationTime = 900000;
                Date expiration = new Date(System.currentTimeMillis() + expirationTime);
                String token = UUID.randomUUID().toString();
                UserEntity user = userRepo.findByEmail(email);
                if (user == null) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                                        "message", "No user found with that email."));
                }
                PasswordResetToken passResetToken = new PasswordResetToken();
                passResetToken.setEmail(email);
                passResetToken.setUser(user);
                passResetToken.setExpiryDate(expiration);
                passResetToken.setToken(token);
                passResetToken.setUsed(false);
                passRepo.save(passResetToken);

                String redirecturl = "http://localhost:3000/auth/passwordChange?token=" + token;
                String text = "Forgot your password? No problem. Use this link to reset it!\n\n" + redirecturl
                                + "\n\nThis link will expire in 15 minutes.";

                message.setText(text);
                mailSender.send(message);

                return ResponseEntity.ok(Map.of(
                                "message", "A link to reset your password has been sent to your email.",
                                "expiration", expiration));
        }

        @PostMapping("/auth/passwordChange")
        public ResponseEntity<?> changePassword(@RequestParam String token, @RequestBody PassChangeDto PassDto) {

                PasswordResetToken passResetToken = passRepo.findByToken(token)
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                                                "Expired token. Send another email."));
                if (passResetToken == null) {
                        return ResponseEntity.badRequest().body(Map.of(
                                        "message", "Invalid token. Send another email."));
                }

                if (passResetToken.getUsed() == true) {
                        return ResponseEntity.badRequest().body(Map.of(
                                        "message", "Token already used. Redirect."));
                }

                Date expiryDate = passResetToken.getExpiryDate();
                Date now = new Date();
                if (now.compareTo(expiryDate) > 0) {
                        return ResponseEntity.badRequest().body(Map.of(
                                        "message", "Link Expired. Redirect."));
                }

                String newPass = PassDto.getNewPassword();
                String confirmedPass = PassDto.getConfirmedPassword();

                if (newPass.compareTo(confirmedPass) != 0) {
                        return ResponseEntity.badRequest().body(Map.of(
                                        "message", "Passwords do not match. Try again."));
                }

                String email = passResetToken.getEmail();
                UserEntity user = userRepo.findByEmail(email);
                if (user == null) {

                        return ResponseEntity.badRequest().body(Map.of(
                                        "message", "User cannot be found with this token. Redirect."));
                }

                user.setPassword(encoder.encode(newPass));
                userRepo.save(user);

                passResetToken.setUsed(true);
                passRepo.save(passResetToken);

                return ResponseEntity.ok(Map.of(
                                "message", "Password successfully changed. Redirecting to login.",
                                "redirect", 1));
        }
}
