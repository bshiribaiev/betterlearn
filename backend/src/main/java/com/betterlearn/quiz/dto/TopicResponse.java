package com.betterlearn.quiz.dto;

import com.betterlearn.quiz.QuizTopic;

import java.time.LocalDate;

public record TopicResponse(
        long id,
        String name,
        String textbookName,
        String textbookUrl,
        LocalDate nextReview,
        int intervalDays,
        double easinessFactor,
        int repetition,
        String status,
        int totalReviews,
        LocalDate earliestDueDate
) {
    public static TopicResponse from(QuizTopic topic) {
        return from(topic, null);
    }

    public static TopicResponse from(QuizTopic topic, LocalDate earliestDueDate) {
        return new TopicResponse(
                topic.getId(),
                topic.getName(),
                topic.getTextbookName(),
                topic.getTextbookUrl(),
                topic.getNextReview(),
                topic.getIntervalDays(),
                topic.getEasinessFactor(),
                topic.getRepetition(),
                topic.getStatus(),
                topic.getTotalReviews(),
                earliestDueDate
        );
    }
}
