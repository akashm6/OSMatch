package com.swipebyte.project.dto;

import lombok.*;
import com.swipebyte.project.entity.Project;

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
