package com.osmatch.project.controllers;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.osmatch.project.dto.SwipeDto;
import com.osmatch.project.entity.Project;
import com.osmatch.project.entity.UserEntity;
import com.osmatch.project.repository.ProjectRepository;
import com.osmatch.project.repository.UserRepository;

import java.beans.Transient;

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

    // User swipes left, we remove restaurant from redis cache, increment swipe
    // count, and hand to model
    @PostMapping("/swipeLeft")
    public ResponseEntity<?> recordLeftSwipe() {

        return null;

    }

    @PostMapping("/swipeRight/")
    public ResponseEntity<?> recordRightSwipe(@RequestBody SwipeDto swipeDto) {
        // return ResponseEntity.ok("This is the id the dto is getting: " +
        // swipeDto.getUserId());

        Project p = swipeDto.getProject();
        if (projectRepo.existsByUrl(p.getUrl())) {
            return ResponseEntity.ok("Project already saved. Swipe recorded.");
        }
        String bodyText = p.getBodyText();
        String description = p.getDescription();
        if (bodyText.length() > 255) {
            p.setBodyText(bodyText.substring(0, 254));
        }

        if (description.length() > 255) {

            p.setDescription(description.substring(0, 254));
        }

        UserEntity user = userRepo.findById(swipeDto.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "User not found."));

        p.setUser(user);
        projectRepo.save(p);

        return ResponseEntity.ok("Project now saved to database.");

    }

}
