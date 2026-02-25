package com.betterlearn.vocabulary.dto;

import java.time.LocalDate;

public record DueTermGroupResponse(
        Long topicId,
        String topicName,
        LocalDate addedDate,
        String label,
        int dueCount
) {}
