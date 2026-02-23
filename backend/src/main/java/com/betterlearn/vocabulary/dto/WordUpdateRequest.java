package com.betterlearn.vocabulary.dto;

public record WordUpdateRequest(
        String word,
        String definition
) {}
