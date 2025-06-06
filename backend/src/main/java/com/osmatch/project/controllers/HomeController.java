package com.osmatch.project.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.osmatch.project.entity.UserEntity;
import com.osmatch.project.repository.UserRepository;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api")
public class HomeController {

    @Autowired
    private UserRepository userRepo;

    @GetMapping("/home")
    public ResponseEntity<?> getUserId(HttpServletRequest request) {
        String id = (String) request.getAttribute("userId");
        if (id == null) {
            System.out.println("User ID is missing in the request");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User ID not found in request.");
        }
        System.out.println("User ID: " + id);

        UserEntity userOpt = userRepo.findById(Long.parseLong(id)).get();
        if (userOpt == null) {
            System.out.println("User not found for ID: " + id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found.");
        }

        System.out.println("User Location: ");

        return ResponseEntity.ok("hello");
    }

}
