package com.betterlearn.quiz.dto;

import jakarta.validation.constraints.NotBlank;

public record TermDto(@NotBlank String term, String definition) {}
