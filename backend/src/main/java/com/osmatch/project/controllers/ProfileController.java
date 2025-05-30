package com.osmatch.project.controllers;

import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.osmatch.project.dto.*;
import com.osmatch.project.entity.*;
import com.osmatch.project.repository.*;

import org.springframework.beans.factory.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import java.util.*;

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

        Long userId = user.getId();
        // find the profile of the user
        UserProfile currProfile = profileRepo.findByUser_Id(userId);

        if (currProfile == null) {

            return ResponseEntity.badRequest().body("Profile not found.");
        }
        // update the bio and save the new profile
        String currentBio = currProfile.getBio();
        String newBio = profile.getBio();
        if (!newBio.equals(currentBio)) {

            currProfile.setBio(newBio);
        }

        profileRepo.save(currProfile);

        return ResponseEntity.ok("Profile updated successfully.");
    }

}
