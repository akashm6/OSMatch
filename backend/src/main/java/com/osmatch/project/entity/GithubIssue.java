package com.osmatch.project.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "github_issues")
public class GithubIssue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "issue_url", unique = true, length = 512)
    private String issueUrl;

    @Column(columnDefinition = "TEXT")
    private String title;

    @Column(columnDefinition = "TEXT")
    private String body;

    @Column(name = "repo_name")
    private String repoName;

    @Column(name = "repo_url", length = 512)
    private String repoUrl;

    @Column(name = "primary_language", length = 64)
    private String primaryLanguage;

    @Column(columnDefinition = "TEXT")
    private String description;

    private Integer stargazerCount;

    private Integer forkCount;

    private Integer watchers;

    @Column(columnDefinition = "JSON")
    private String labels;

    @Column(columnDefinition = "JSON")
    private String topics;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "inserted_at", columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime insertedAt = LocalDateTime.now();
}
