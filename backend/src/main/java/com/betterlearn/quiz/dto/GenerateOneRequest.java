package com.betterlearn.quiz.dto;

import java.util.List;

public record GenerateOneRequest(List<String> previousQuestions) {}
