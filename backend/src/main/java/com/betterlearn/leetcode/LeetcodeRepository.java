package com.betterlearn.leetcode;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface LeetcodeRepository extends JpaRepository<LeetcodeProblem, Long> {

    @Query("SELECT p FROM LeetcodeProblem p WHERE p.user.id = :userId ORDER BY CASE WHEN p.nextReview <= CURRENT_DATE THEN 0 ELSE 1 END, p.nextReview ASC")
    List<LeetcodeProblem> findAllByUserId(Long userId);

    @Query("SELECT p FROM LeetcodeProblem p WHERE p.user.id = :userId AND p.nextReview <= CURRENT_DATE ORDER BY p.nextReview ASC")
    List<LeetcodeProblem> findDueByUserId(Long userId);

    long countByUserId(Long userId);

    boolean existsByUserIdAndUrl(Long userId, String url);

    long countByUserIdAndStatus(Long userId, String status);
}
