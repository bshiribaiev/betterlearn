package com.betterlearn.leetcode.dto;

import jakarta.validation.constraints.NotBlank;

public record ProblemCreateRequest(
        @NotBlank String url,
        String title,
        String notes,
        String confidence
) {}
