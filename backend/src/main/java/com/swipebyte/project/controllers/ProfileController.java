package com.swipebyte.project.controllers;

import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.beans.factory.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import java.util.*;
import com.swipebyte.project.dto.*;
import com.swipebyte.project.entity.*;
import com.swipebyte.project.repository.*;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

@RestController
public class ProfileController {

    @Autowired
    private UserRepository userRepo;

    @Autowired
    private ProfileRepository profileRepo;

    @Autowired
    private ProjectRepository projectRepo;

    // Grabs the user's swiped right projects from db to display on profile
    @GetMapping("/profile/likedProjects")
    public ResponseEntity<?> getLikedProjects(@RequestParam Long userId) {

        List<Project> projects = projectRepo.findByUser(userId);

        return ResponseEntity.ok(projects);
    }

    @PostMapping("/profile/edit")
    public ResponseEntity<?> editProfile(@RequestBody ProfileDto profile) {

        UserEntity user = userRepo.findById(profile.getUserId()).get();

        UserProfile currProfile = user.getProfile();

        if (currProfile == null) {

            return ResponseEntity.badRequest().body("Profile not found.");
        }
        String currentBio = currProfile.getBio();
        String newBio = profile.getBio();
        if (!newBio.equals(currentBio)) {

            currProfile.setBio(newBio);
        }

        profileRepo.save(currProfile);

        return ResponseEntity.ok("Profile changed!");
    }

}
