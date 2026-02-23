package com.betterlearn.quiz.dto;

import com.betterlearn.quiz.QuizSession;

import java.time.Instant;

public record SessionResponse(
        long id,
        int totalQuestions,
        int correctAnswers,
        int quality,
        Instant takenAt
) {
    public static SessionResponse from(QuizSession session) {
        return new SessionResponse(
                session.getId(),
                session.getTotalQuestions(),
                session.getCorrectAnswers(),
                session.getQuality(),
                session.getTakenAt()
        );
    }
}
