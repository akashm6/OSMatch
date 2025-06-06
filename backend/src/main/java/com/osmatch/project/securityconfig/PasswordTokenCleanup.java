package com.osmatch.project.securityconfig;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import java.util.Date;

import com.osmatch.project.repository.PasswordResetTokenRepository;

@Service
@EnableScheduling
public class PasswordTokenCleanup {

    @Autowired
    PasswordResetTokenRepository tokenRepo;

    // schedule a service to remove expired or invalid tokens
    @Scheduled(fixedRate = 3600000)
    public void removeExpiredTokens() {

        Date now = new Date();
        tokenRepo.deleteExpiredTokens(now);

    }

}
