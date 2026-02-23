package com.betterlearn.dashboard;

import com.betterlearn.leetcode.LeetcodeService;
import com.betterlearn.leetcode.dto.ProblemResponse;
import com.betterlearn.quiz.QuizService;
import com.betterlearn.quiz.dto.TopicResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final LeetcodeService leetcodeService;
    private final QuizService quizService;

    public DashboardController(LeetcodeService leetcodeService, QuizService quizService) {
        this.leetcodeService = leetcodeService;
        this.quizService = quizService;
    }

    @GetMapping
    public DashboardResponse getDashboard(@RequestAttribute Long userId) {
        List<ProblemResponse> due = leetcodeService.findDue(userId);
        List<ProblemResponse> all = leetcodeService.findAll(userId);
        List<TopicResponse> quizDue = quizService.findDue(userId);
        List<TopicResponse> quizAll = quizService.findAll(userId);
        return new DashboardResponse(due.size(), all.size(), due,
                quizDue.size(), quizAll.size(), quizDue);
    }
}
