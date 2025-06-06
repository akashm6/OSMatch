package com.osmatch.project.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.osmatch.project.entity.*;

@Repository
public interface ProfileRepository extends JpaRepository<UserProfile, Long> {

    // @Query("SELECT u FROM UserProfile u WHERE u.user.id = :userId")
    UserProfile findByUser_Id(Long userId);
}
