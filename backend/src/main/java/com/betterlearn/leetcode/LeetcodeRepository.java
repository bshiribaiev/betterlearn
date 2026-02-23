package com.betterlearn.leetcode;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface LeetcodeRepository extends JpaRepository<LeetcodeProblem, Long> {

    List<LeetcodeProblem> findByUserIdOrderByNextReviewAsc(Long userId);

    @Query("SELECT p FROM LeetcodeProblem p WHERE p.user.id = :userId AND p.nextReview <= CURRENT_DATE ORDER BY p.nextReview ASC")
    List<LeetcodeProblem> findDueByUserId(Long userId);

    boolean existsByUserIdAndUrl(Long userId, String url);
}
