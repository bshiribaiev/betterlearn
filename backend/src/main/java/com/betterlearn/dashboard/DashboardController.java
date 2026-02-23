package com.betterlearn.dashboard;

import com.betterlearn.leetcode.LeetcodeService;
import com.betterlearn.leetcode.dto.ProblemResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final LeetcodeService leetcodeService;

    public DashboardController(LeetcodeService leetcodeService) {
        this.leetcodeService = leetcodeService;
    }

    @GetMapping
    public DashboardResponse getDashboard(@RequestAttribute Long userId) {
        List<ProblemResponse> due = leetcodeService.findDue(userId);
        List<ProblemResponse> all = leetcodeService.findAll(userId);
        return new DashboardResponse(due.size(), all.size(), due);
    }
}
