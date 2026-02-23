package com.betterlearn.quiz.dto;

import com.betterlearn.quiz.QuizConcept;

import java.time.LocalDate;

public record ConceptResponse(
        long id,
        long topicId,
        String name,
        LocalDate nextReview,
        int intervalDays,
        double easinessFactor,
        int repetition,
        String status,
        int totalReviews
) {
    public static ConceptResponse from(QuizConcept c) {
        return new ConceptResponse(
                c.getId(), c.getTopic().getId(), c.getName(),
                c.getNextReview(), c.getIntervalDays(),
                c.getEasinessFactor(), c.getRepetition(),
                c.getStatus(), c.getTotalReviews()
        );
    }
}
