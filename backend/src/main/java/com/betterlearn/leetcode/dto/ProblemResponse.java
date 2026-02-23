package com.betterlearn.leetcode.dto;

import com.betterlearn.leetcode.LeetcodeProblem;

import java.time.LocalDate;

public record ProblemResponse(
        Long id,
        String url,
        String title,
        String notes,
        LocalDate firstAttempted,
        LocalDate nextReview,
        int intervalDays,
        double easinessFactor,
        int repetition,
        String status
) {
    public static ProblemResponse from(LeetcodeProblem p) {
        return new ProblemResponse(
                p.getId(), p.getUrl(), p.getTitle(), p.getNotes(),
                p.getFirstAttempted(), p.getNextReview(), p.getIntervalDays(),
                p.getEasinessFactor(), p.getRepetition(), p.getStatus()
        );
    }
}
