package com.betterlearn.vocabulary.dto;

public record TermQuizResultResponse(
        int totalQuestions,
        int correctAnswers,
        int quality
) {}
