package com.betterlearn.quiz.dto;

import com.betterlearn.quiz.QuizSession;

import java.time.Instant;
import java.time.LocalDate;

public record SessionResponse(
        long id,
        int totalQuestions,
        int correctAnswers,
        int quality,
        Instant takenAt,
        LocalDate nextReview
) {
    public static SessionResponse from(QuizSession session) {
        LocalDate nextReview = session.getConcept() != null
                ? session.getConcept().getNextReview() : null;
        return new SessionResponse(
                session.getId(),
                session.getTotalQuestions(),
                session.getCorrectAnswers(),
                session.getQuality(),
                session.getTakenAt(),
                nextReview
        );
    }
}
