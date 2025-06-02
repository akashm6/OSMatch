package com.osmatch.project.securityconfig;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import static org.springframework.security.config.Customizer.withDefaults;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import com.osmatch.project.controllers.*;

import org.springframework.security.core.userdetails.UserDetailsService;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private UserDetailsService userDetailsService;

    @Autowired
    private JwtAuthentication jwtAuth;

    @Autowired
    private OAuthSuccessHandler oAuthSuccessHandler;

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(csrf -> csrf.disable())
                .cors(withDefaults())
                .authorizeHttpRequests(auth -> auth
                        // Permit default landing page and auth endpoints
                        .requestMatchers("/", "/login/**", "/auth/**", "/oauth2/**", "/error", "/profile/*", "/debug/*",
                                "swipeRight/", "/protected/*", "/updateStats")
                        .permitAll()
                        .anyRequest().authenticated())
                .userDetailsService(userDetailsService)
                .oauth2Login(oauth -> oauth.successHandler(oAuthSuccessHandler))
                .logout(withDefaults())
                .addFilterBefore(jwtAuth, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

}
