package com.osmatch.project.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class StatsDto {

    private Integer totalSwipes;
    private Integer totalMatches;
    private Long userId;

}
