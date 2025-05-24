package com.swipebyte.project.controllers;

import org.springframework.web.bind.annotation.*;

import com.swipebyte.project.dto.*;
import com.swipebyte.project.entity.*;
import com.swipebyte.project.repository.*;
import java.util.*;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.HashSet;

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
        user.setSwipedRightProjects(new HashSet<Project>());

        UserProfile newProfile = new UserProfile();
        newProfile.setUser(user);
        newProfile.setBio("No bio written.");
        profileRepo.save(newProfile);
        user.setProfile(newProfile);

        userRepo.save(user);

        return ResponseEntity.ok("User Registered Successfully!");
    }

}
