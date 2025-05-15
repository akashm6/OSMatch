package com.swipebyte.project.controllers;

import com.swipebyte.project.entity.Project;
import com.swipebyte.project.entity.UserEntity;
import com.swipebyte.project.repository.ProjectRepository;
import com.swipebyte.project.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;
import java.util.Set;

@RestController
@RequestMapping("/api/users")
public class UserProfileController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectRepository projectRepository;

    // Endpoint to add a swiped-right project
    @PostMapping("/{userId}/swipeRight")
    public ResponseEntity<?> addSwipedRightProject(@PathVariable Long userId, @RequestBody Project project) {
        Optional<UserEntity> optionalUser = userRepository.findById(userId);
        if (!optionalUser.isPresent()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
        }
        UserEntity user = optionalUser.get();
        // Save the project if it isn't already saved
        Project savedProject = projectRepository.save(project);
        Set<Project> likedProjects = user.getSwipedRightProjects();
        likedProjects.add(savedProject);
        user.setSwipedRightProjects(likedProjects);
        userRepository.save(user);
        return ResponseEntity.ok(user);
    }

    // Endpoint to retrieve all projects the user swiped right on
    @GetMapping("/{userId}/swipedRight")
    public ResponseEntity<?> getSwipedRightProjects(@PathVariable Long userId) {
        Optional<UserEntity> optionalUser = userRepository.findById(userId);
        if (!optionalUser.isPresent()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
        }
        UserEntity user = optionalUser.get();
        return ResponseEntity.ok(user.getSwipedRightProjects());
    }
}
