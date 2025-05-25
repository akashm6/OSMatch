package com.osmatch.project.dto;

import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class LoginDto {

    private Long id;
    private String email;
    private String password;

    public LoginDto(Long id, String email) {
        this.id = id;
        this.email = email;
    }

}
