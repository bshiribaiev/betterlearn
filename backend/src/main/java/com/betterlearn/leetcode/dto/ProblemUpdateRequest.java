package com.betterlearn.leetcode.dto;

import java.time.LocalDate;

public record ProblemUpdateRequest(
        String title,
        String notes,
        LocalDate lastReviewed
) {}
