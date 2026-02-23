package com.betterlearn.quiz.dto;

import jakarta.validation.constraints.NotNull;

import java.util.List;

public record QuizSubmitRequest(
        @NotNull List<QuizQuestionDto> questions,
        @NotNull List<Integer> answers
) {}
