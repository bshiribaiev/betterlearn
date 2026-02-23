package com.betterlearn.vocabulary.dto;

import jakarta.validation.constraints.NotBlank;

public record WordCreateRequest(
        @NotBlank String word,
        @NotBlank String definition
) {}
