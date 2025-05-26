package com.osmatch.project.controllers;

import java.util.Date;
import java.util.Map;

import org.apache.catalina.connector.Response;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.mail.MailSender;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.osmatch.project.dto.PassChangeDto;
import com.osmatch.project.entity.UserEntity;
import com.osmatch.project.repository.UserRepository;

@RestController
public class PasswordChangeController {

    @Autowired
    UserRepository userRepo;

    @Autowired
    JavaMailSender mailSender;

    @Autowired
    BCryptPasswordEncoder encoder;

    @PostMapping("/auth/sendEmail")
    public ResponseEntity<?> sendPasswordEmail(@RequestBody String email) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("Reset Password - OSMatch");
        String redirecturl = "http://localhost:3000/auth/passwordChange";
        String text = "Forgot your password? No problem. Use this link to reset it!\n\n" + redirecturl
                + "\n\nThis link will expire in 15 minutes.";

        message.setText(text);
        int expirationTime = 900000;
        Date now = new Date();
        Date expiration = new Date(System.currentTimeMillis() + expirationTime);
        System.out.print("THIS IS THE EXPIRATION TIME: " + expiration);
        mailSender.send(message);
        return ResponseEntity.ok(Map.of(
                "message", "A link to reset your password has been sent to your email.",
                "expiration", expiration));
    }

    @PostMapping("/auth/passwordChange")
    public ResponseEntity<?> changePassword(@RequestBody PassChangeDto PassDto) {
        String newPass = PassDto.getNewPassword();
        UserEntity user = userRepo.findById(PassDto.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."));
        if (user == null) {
            return ResponseEntity.badRequest().body("User cannot be found with userId.");
        }

        return null;
    }

}
