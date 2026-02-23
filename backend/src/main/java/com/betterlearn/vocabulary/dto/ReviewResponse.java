package com.betterlearn.vocabulary.dto;

import com.betterlearn.vocabulary.VocabularyReview;

import java.time.Instant;

public record ReviewResponse(
        Long id,
        int quality,
        Instant reviewedAt
) {
    public static ReviewResponse from(VocabularyReview r) {
        return new ReviewResponse(r.getId(), r.getQuality(), r.getReviewedAt());
    }
}
