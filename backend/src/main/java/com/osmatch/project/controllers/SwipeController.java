package com.osmatch.project.controllers;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.osmatch.project.dto.StatsDto;
import com.osmatch.project.dto.SwipeDto;
import com.osmatch.project.entity.GithubIssue;
import com.osmatch.project.entity.LikedIssue;
import com.osmatch.project.entity.UserEntity;
import com.osmatch.project.repository.GithubIssueRepository;
import com.osmatch.project.repository.LikedIssueRepository;
import com.osmatch.project.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
public class SwipeController {

    @Autowired
    private GithubIssueRepository issueRepo;

    @Autowired
    private LikedIssueRepository likedRepo;

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

        String issueUrl = swipeDto.getIssueUrl();

        GithubIssue issue = issueRepo.findByIssueUrl(issueUrl);
        if (issue == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Issue not found.");
        }

        if (likedRepo.existsByUserAndIssue(user, issue)) {
            return ResponseEntity.ok("Issue already liked.");
        }

        LikedIssue liked = new LikedIssue();
        liked.setUser(user);
        liked.setIssue(issue);
        likedRepo.save(liked);

        return ResponseEntity.ok("Right Swipe recorded. Project now saved to database.");
    }

}
