package com.osmatch.project.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.osmatch.project.entity.*;
import java.util.List;

public interface LikedIssueRepository extends JpaRepository<LikedIssue, Long> {

    List<LikedIssue> findByUser_Id(Long userId);

    boolean existsByUserAndIssue(UserEntity user, GithubIssue issue);
}
