package com.betterlearn.vocabulary.dto;

import com.betterlearn.vocabulary.VocabularyWord;

import java.time.LocalDate;

public record WordResponse(
        Long id,
        Long topicId,
        String word,
        String definition,
        LocalDate nextReview,
        int intervalDays,
        double easinessFactor,
        int repetition,
        String status
) {
    public static WordResponse from(VocabularyWord w) {
        return new WordResponse(
                w.getId(), w.getTopic().getId(), w.getWord(), w.getDefinition(),
                w.getNextReview(), w.getIntervalDays(),
                w.getEasinessFactor(), w.getRepetition(), w.getStatus()
        );
    }
}
