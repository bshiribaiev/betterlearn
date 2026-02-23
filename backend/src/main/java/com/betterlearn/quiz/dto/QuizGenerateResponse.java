package com.betterlearn.quiz.dto;

import java.util.List;

public record QuizGenerateResponse(
        List<QuizQuestionDto> questions
) {}
