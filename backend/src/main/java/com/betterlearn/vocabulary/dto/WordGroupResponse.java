package com.betterlearn.vocabulary.dto;

import java.time.LocalDate;
import java.util.List;

public record WordGroupResponse(
        LocalDate addedDate,
        String label,
        int totalCount,
        int dueCount,
        List<WordResponse> words
) {}
