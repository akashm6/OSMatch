package com.osmatch.project.repository;

import com.osmatch.project.entity.GithubIssue;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GithubIssueRepository extends JpaRepository<GithubIssue, Long> {
    boolean existsByIssueUrl(String issueUrl);

    GithubIssue findByIssueUrl(String issueUrl);
}
