package com.betterlearn.dashboard;

import com.betterlearn.leetcode.dto.ProblemResponse;

import java.util.List;

public record DashboardResponse(
        int dueCount,
        int totalCount,
        List<ProblemResponse> dueProblems
) {}
