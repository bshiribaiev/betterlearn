package com.betterlearn.quiz.dto;

import com.betterlearn.quiz.QuizTopic;

import java.time.LocalDate;

public record TopicResponse(
        long id,
        String name,
        LocalDate nextReview,
        int intervalDays,
        double easinessFactor,
        int repetition,
        String status,
        int totalReviews
) {
    public static TopicResponse from(QuizTopic topic) {
        return new TopicResponse(
                topic.getId(),
                topic.getName(),
                topic.getNextReview(),
                topic.getIntervalDays(),
                topic.getEasinessFactor(),
                topic.getRepetition(),
                topic.getStatus(),
                topic.getTotalReviews()
        );
    }
}
