package com.osmatch.project.controllers;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.osmatch.project.dto.StatsDto;
import com.osmatch.project.dto.SwipeDto;
import com.osmatch.project.entity.Project;
import com.osmatch.project.entity.UserEntity;
import com.osmatch.project.repository.ProjectRepository;
import com.osmatch.project.repository.UserRepository;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
public class SwipeController {

    @Autowired
    private ProjectRepository projectRepo;

    @Autowired
    private UserRepository userRepo;

    @PostMapping("/updateStats")
    public ResponseEntity<?> updateStats(@RequestBody StatsDto stats) {

        UserEntity user = userRepo.findById(stats.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "User not found."));

        Integer totalSwipes = stats.getTotalSwipes();
        Integer totalMatches = stats.getTotalMatches();

        user.setTotalMatches(totalMatches);
        user.setTotalSwipes(totalSwipes);
        userRepo.save(user);

        return ResponseEntity.ok("User stats succesfully saved.");
    }

    @PostMapping("/swipeRight/")
    public ResponseEntity<?> recordSwipe(@RequestBody SwipeDto swipeDto) {

        UserEntity user = userRepo.findById(swipeDto.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "User not found."));

        Project p = swipeDto.getProject();
        String bodyText = (p.getBodyText() != null && p.getBodyText() != "") ? p.getBodyText()
                : "No Body Text Available.";

        String description = (p.getDescription() != null && p.getDescription() != "") ? p.getDescription()
                : "No Description Available.";

        if (bodyText.length() > 255) {
            bodyText = bodyText.substring(0, 251) + "...";
        }

        if (description.length() > 255) {
            description = description.substring(0, 251) + "...";
        }

        p.setBodyText(bodyText);
        p.setDescription(description);
        p.setUser(user);
        projectRepo.save(p);

        return ResponseEntity.ok("Right Swipe recorded. Project now saved to database.");
    }

}
