package com.betterlearn.leetcode.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record ReviewRequest(
        @Min(0) @Max(5) int quality
) {}
