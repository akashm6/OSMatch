package com.osmatch.project.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserRegistrationDto {

    private String username;
    private String first_name;
    private String last_name;
    private String email;
    private String password;
    private String confirmPassword;

}
