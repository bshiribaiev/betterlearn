package com.betterlearn.quiz.dto;

import jakarta.validation.constraints.NotBlank;

public record ConceptCreateRequest(
        @NotBlank String name
) {}
