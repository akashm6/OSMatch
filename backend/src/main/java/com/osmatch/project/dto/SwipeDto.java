package com.osmatch.project.dto;

import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor

// SwipeDto for providing data for persisting swipes to DB
public class SwipeDto {

    Long userId;
    String issueUrl;
    String direction;

}
