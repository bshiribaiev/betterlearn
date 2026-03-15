package com.betterlearn.quiz.dto;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record ChatSaveRequest(Long conceptId, Long topicId, @NotEmpty List<TermDto> terms) {}
