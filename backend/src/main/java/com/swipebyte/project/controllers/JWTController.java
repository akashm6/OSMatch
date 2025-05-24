package com.swipebyte.project.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import com.swipebyte.project.securityconfig.*;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;

// Checks a JWT from localStorage to see if a user is still authenticated
@RestController
public class JWTController {

    @Autowired
    JwtUtility utility;

    @GetMapping("/protected/jwt")
    public ResponseEntity<?> validateJWT(HttpServletRequest request) {

        String userId = (String) request.getAttribute("userId");

        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        return ResponseEntity.ok("Data Authorized for User Id: " + userId);
    }

}
