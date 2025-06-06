package com.osmatch.project.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.util.Date;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
public class PasswordResetToken {

    @Id
    private String token;

    private Date expiryDate;

    private String email;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private UserEntity user;

    private Boolean used;

}
