package com.swipebyte.project.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.swipebyte.project.entity.Project;
import com.swipebyte.project.entity.UserEntity;

import lombok.NonNull;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByUrl(String url);

    @Query("SELECT p from Project p WHERE p.user.id = :userId")
    List<Project> findByUser(@Param("userId") Long userId);

    boolean existsByUrl(String url);
}