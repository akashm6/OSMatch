package com.osmatch.project.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "USERS")
public class UserEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE)
    private Long id;

    @Column(unique = true)
    private String githubId;

    @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "profile_id")
    private UserProfile profile;

    // JsonManagedReference -> Will be serialized in GETs
    private String username;

    private String first_name;

    private String last_name;

    @Column(unique = true)
    private String email;

    private String password;

    private Integer isOAuthLogin;

    private Integer totalSwipes;

    private Integer totalMatches;

}
