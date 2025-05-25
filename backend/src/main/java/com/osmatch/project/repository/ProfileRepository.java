package com.osmatch.project.repository;

import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.osmatch.project.entity.*;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.lang.NonNull;

@Repository
public interface ProfileRepository extends JpaRepository<UserProfile, Long> {

    // @Query("SELECT u FROM UserProfile u WHERE u.user.id = :userId")
    UserProfile findByUser_Id(Long userId);
}
