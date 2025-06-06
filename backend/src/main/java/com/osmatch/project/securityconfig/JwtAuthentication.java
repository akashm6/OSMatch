package com.osmatch.project.securityconfig;

import jakarta.servlet.FilterChain;
import org.springframework.lang.NonNull;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

// Filter to validate JWT tokens on secured endpoints
// i.e. validate if a user is authenticated on a login session
@Component
public class JwtAuthentication extends OncePerRequestFilter {
    // OncePerRequestFilter -> filter only needs to be applied once per session
    @Autowired
    private JwtUtility jwtUtility;

    @Override
    public void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        String userId = null;
        // token in format of Authorization Bearer <TOKEN>
        String token = request.getHeader("Authorization");

        if (token != null && token.startsWith("Bearer")) {
            token = token.substring(7);
            userId = jwtUtility.validateToken(token);
            // attaches userId to request so controllers can access
            if (userId != null) {
                request.setAttribute("userId", userId);
            }
        }

        filterChain.doFilter(request, response);

    }

}
