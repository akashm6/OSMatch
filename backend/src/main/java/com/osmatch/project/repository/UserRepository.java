package com.osmatch.project.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.osmatch.project.entity.UserEntity;

@Repository
public interface UserRepository extends JpaRepository<UserEntity, Long> {
    UserEntity findByUsername(String username);

    UserEntity findByEmail(String email);

    boolean existsByEmail(String email);

    @Modifying
    @Query("UPDATE UserEntity u SET u.password = :newPass WHERE u.password = :oldPass")
    void updatePassword(@Param("oldPass") String oldPass, @Param("newPass") String newPass);

}
