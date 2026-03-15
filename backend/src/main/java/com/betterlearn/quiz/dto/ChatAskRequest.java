package com.betterlearn.quiz.dto;

import jakarta.validation.constraints.NotBlank;

public record ChatAskRequest(@NotBlank String question) {}
