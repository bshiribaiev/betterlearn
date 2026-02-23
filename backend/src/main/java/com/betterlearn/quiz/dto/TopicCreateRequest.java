package com.betterlearn.quiz.dto;

import jakarta.validation.constraints.NotBlank;

public record TopicCreateRequest(
        @NotBlank String name
) {}
