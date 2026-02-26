package com.betterlearn.quiz.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record FlashcardSubmitRequest(
        @Min(0) @Max(5) int quality
) {}
