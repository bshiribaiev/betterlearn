package com.betterlearn.quiz.dto;

import jakarta.validation.constraints.NotBlank;

public record TopicUpdateRequest(
        @NotBlank String name,
        String textbookName,
        String textbookUrl
) {}
