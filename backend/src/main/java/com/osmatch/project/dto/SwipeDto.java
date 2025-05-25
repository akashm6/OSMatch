package com.osmatch.project.dto;

import com.osmatch.project.entity.Project;

import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
// SwipeDto for providing data for persisting swipes to DB
public class SwipeDto {

    Long userId;
    Project project;
    String direction;

}
