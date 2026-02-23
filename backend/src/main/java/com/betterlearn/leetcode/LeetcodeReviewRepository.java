package com.betterlearn.leetcode;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LeetcodeReviewRepository extends JpaRepository<LeetcodeReview, Long> {

    List<LeetcodeReview> findByProblemIdOrderByReviewedAtDesc(Long problemId);
}
