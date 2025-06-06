package com.osmatch.project.controllers;

import org.springframework.web.bind.annotation.*;

import com.osmatch.project.dto.*;
import com.osmatch.project.entity.*;
import java.util.Map;
import com.osmatch.project.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;

@RestController
public class RegisterController {

    @Autowired
    private UserRepository userRepo;

    @Autowired
    private ProfileRepository profileRepo;

    @Autowired
    private PasswordEncoder encoder;

    @PostMapping("/auth/register")
    public ResponseEntity<?> registerUser(@RequestBody UserRegistrationDto registerDto) {
        if (userRepo.existsByEmail(registerDto.getEmail())) {
            return ResponseEntity.badRequest().body("This email is already registered. Try again.");
        }

        UserEntity user = new UserEntity();
        user.setUsername(registerDto.getUsername());
        user.setFirst_name(registerDto.getFirst_name());
        user.setLast_name(registerDto.getLast_name());
        String password = registerDto.getPassword();
        String confirm = registerDto.getConfirmPassword();

        if (!password.equals(confirm)) {
            return ResponseEntity.badRequest().body("Passwords do not match. Please try again.");
        }

        String encodedPassword = encoder.encode(password);

        user.setPassword(encodedPassword);
        user.setEmail(registerDto.getEmail());
        user.setIsOAuthLogin(0);
        user.setTotalMatches(0);
        user.setTotalSwipes(0);

        userRepo.save(user);

        UserProfile newProfile = new UserProfile();
        newProfile.setUser(user);
        newProfile.setBio("No bio written.");
        profileRepo.save(newProfile);

        user.setProfile(newProfile);
        userRepo.save(user);

        return ResponseEntity.ok(Map.of(
                "message", "User Registered Successfully!"));
    }

}
