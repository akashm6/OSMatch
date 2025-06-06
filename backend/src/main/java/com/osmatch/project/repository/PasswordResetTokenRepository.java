package com.osmatch.project.repository;

import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.osmatch.project.entity.PasswordResetToken;

import jakarta.transaction.Transactional;

import java.util.Date;
import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, String> {

    Optional<PasswordResetToken> findByToken(String token);

    @Modifying
    @Transactional
    @Query("DELETE FROM PasswordResetToken t WHERE t.expiryDate <= :now OR t.used = true")
    void deleteExpiredTokens(@Param("now") Date now);

}
