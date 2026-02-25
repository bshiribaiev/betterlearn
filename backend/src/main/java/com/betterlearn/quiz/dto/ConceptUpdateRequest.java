package com.betterlearn.quiz.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ConceptUpdateRequest(
        @NotBlank String name,
        @Size(max = 10000) String content
) {}
