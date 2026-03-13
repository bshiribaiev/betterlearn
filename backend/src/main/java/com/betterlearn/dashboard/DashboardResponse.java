package com.betterlearn.dashboard;

import com.betterlearn.leetcode.dto.ProblemResponse;
import com.betterlearn.quiz.dto.ConceptResponse;
import com.betterlearn.vocabulary.dto.DueTermGroupResponse;

import java.util.List;

public record DashboardResponse(
        int dueCount,
        int totalCount,
        int masteredProblems,
        List<ProblemResponse> dueProblems,
        int topicsDueCount,
        int topicsTotalCount,
        int masteredTopicItems,
        List<ConceptResponse> dueConcepts,
        List<DueTermGroupResponse> dueTermGroups,
        List<ConceptResponse> recentConcepts
) {}
