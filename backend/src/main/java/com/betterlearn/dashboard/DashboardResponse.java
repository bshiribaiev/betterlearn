package com.betterlearn.dashboard;

import com.betterlearn.leetcode.dto.ProblemResponse;
import com.betterlearn.quiz.dto.TopicResponse;

import java.util.List;

public record DashboardResponse(
        int dueCount,
        int totalCount,
        List<ProblemResponse> dueProblems,
        int quizDueCount,
        int quizTotalCount,
        List<TopicResponse> dueTopics
) {}
