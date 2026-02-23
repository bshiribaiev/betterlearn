package com.betterlearn.leetcode.dto;

import com.betterlearn.leetcode.LeetcodeReview;

import java.time.Instant;

public record ReviewResponse(
        Long id,
        int quality,
        Instant reviewedAt
) {
    public static ReviewResponse from(LeetcodeReview r) {
        return new ReviewResponse(r.getId(), r.getQuality(), r.getReviewedAt());
    }
}
