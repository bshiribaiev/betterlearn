package com.betterlearn.dashboard;

import com.betterlearn.leetcode.dto.ProblemResponse;
import com.betterlearn.quiz.dto.TopicResponse;
import com.betterlearn.vocabulary.dto.WordResponse;

import java.util.List;

public record DashboardResponse(
        int dueCount,
        int totalCount,
        int masteredProblems,
        List<ProblemResponse> dueProblems,
        int quizDueCount,
        int quizTotalCount,
        int masteredTopics,
        List<TopicResponse> dueTopics,
        int vocabDueCount,
        int vocabTotalCount,
        int masteredWords,
        List<WordResponse> dueWords
) {}
