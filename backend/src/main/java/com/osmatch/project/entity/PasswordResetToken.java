package com.osmatch.project.entity;

import java.time.LocalDateTime;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@Entity
public class PasswordResetToken {

    @Id
    private String token;

    private LocalDateTime expiryDate;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private UserEntity user;

    private Boolean used;

}
