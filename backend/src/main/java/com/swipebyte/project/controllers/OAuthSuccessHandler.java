package com.swipebyte.project.controllers;

import com.swipebyte.project.entity.UserEntity;
import com.swipebyte.project.entity.UserProfile;
import com.swipebyte.project.repository.UserRepository;
import com.swipebyte.project.securityconfig.JwtUtility;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

// Used to handle Github OAuth logic
@Component
public class OAuthSuccessHandler implements AuthenticationSuccessHandler {

    @Autowired
    private UserRepository userRepo;

    @Autowired
    private JwtUtility utility;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
            Authentication authentication) throws IOException {

        OAuth2User user = (OAuth2User) authentication.getPrincipal();
        String email = (String) user.getAttribute("email");

        UserEntity existingUser = userRepo.findByEmail(email);
        if (existingUser == null) {
            existingUser = new UserEntity();
            existingUser.setEmail(email);
            String username = email.split("@")[0];
            existingUser.setUsername(username);
            existingUser.setPassword("");
            existingUser.setIsOAuthLogin(1);
            UserProfile profile = new UserProfile();
            profile.setUser(existingUser);
            profile.setBio("No bio written.");
            existingUser.setProfile(profile);
            userRepo.save(existingUser);
        }

        String token = utility.generateToken(existingUser.getId().toString());

        response.sendRedirect("http://localhost:3000/oauth/success?token=" + token + "&userId=" + existingUser.getId());

    }

}
