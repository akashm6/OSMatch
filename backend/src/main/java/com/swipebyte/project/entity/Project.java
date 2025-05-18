package com.swipebyte.project.entity;

import java.util.List;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class Project {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    private String url;

    private String updatedAt;

    @Column(name = "body_text", columnDefinition = "LONGTEXT")
    private String bodyText;

    private String repo_url;

    private String primaryLanguage;

    private String description;

    private Integer watchers;

    private Integer stargazerCount;

    private String forkCount;

    @ElementCollection
    private List<String> topics;

    @ElementCollection
    private List<String> labels;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private UserEntity user;

}
