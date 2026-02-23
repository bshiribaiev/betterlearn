package com.betterlearn.spacedrepetition;

import java.time.LocalDate;

public record Sm2Result(
        double easinessFactor,
        int repetition,
        int intervalDays,
        LocalDate nextReview,
        String status
) {}
