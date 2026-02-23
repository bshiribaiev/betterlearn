package com.betterlearn.dashboard;

import com.betterlearn.leetcode.dto.ProblemResponse;
import com.betterlearn.quiz.dto.ConceptResponse;
import com.betterlearn.vocabulary.dto.WordResponse;

import java.util.List;

public record DashboardResponse(
        int dueCount,
        int totalCount,
        int masteredProblems,
        List<ProblemResponse> dueProblems,
        int conceptsDueCount,
        int conceptsTotalCount,
        int masteredConcepts,
        List<ConceptResponse> dueConcepts,
        int vocabDueCount,
        int vocabTotalCount,
        int masteredWords,
        List<WordResponse> dueWords
) {}
