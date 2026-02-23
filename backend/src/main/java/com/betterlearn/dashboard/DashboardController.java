package com.betterlearn.dashboard;

import com.betterlearn.leetcode.LeetcodeRepository;
import com.betterlearn.leetcode.LeetcodeService;
import com.betterlearn.leetcode.dto.ProblemResponse;
import com.betterlearn.quiz.QuizService;
import com.betterlearn.quiz.QuizTopicRepository;
import com.betterlearn.quiz.dto.TopicResponse;
import com.betterlearn.vocabulary.VocabularyRepository;
import com.betterlearn.vocabulary.VocabularyService;
import com.betterlearn.vocabulary.dto.WordResponse;
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
    private final VocabularyService vocabularyService;
    private final LeetcodeRepository leetcodeRepository;
    private final QuizTopicRepository quizTopicRepository;
    private final VocabularyRepository vocabularyRepository;

    public DashboardController(LeetcodeService leetcodeService, QuizService quizService,
                               VocabularyService vocabularyService,
                               LeetcodeRepository leetcodeRepository,
                               QuizTopicRepository quizTopicRepository,
                               VocabularyRepository vocabularyRepository) {
        this.leetcodeService = leetcodeService;
        this.quizService = quizService;
        this.vocabularyService = vocabularyService;
        this.leetcodeRepository = leetcodeRepository;
        this.quizTopicRepository = quizTopicRepository;
        this.vocabularyRepository = vocabularyRepository;
    }

    @GetMapping
    public DashboardResponse getDashboard(@RequestAttribute Long userId) {
        List<ProblemResponse> due = leetcodeService.findDue(userId);
        List<ProblemResponse> all = leetcodeService.findAll(userId);
        int masteredProblems = (int) leetcodeRepository.countByUserIdAndStatus(userId, "mastered");
        List<TopicResponse> quizDue = quizService.findDue(userId);
        List<TopicResponse> quizAll = quizService.findAll(userId);
        int masteredTopics = (int) quizTopicRepository.countByUserIdAndStatus(userId, "mastered");
        List<WordResponse> vocabDue = vocabularyService.findDue(userId);
        List<WordResponse> vocabAll = vocabularyService.findAll(userId);
        int masteredWords = (int) vocabularyRepository.countByUserIdAndStatus(userId, "mastered");
        return new DashboardResponse(due.size(), all.size(), masteredProblems, due,
                quizDue.size(), quizAll.size(), masteredTopics, quizDue,
                vocabDue.size(), vocabAll.size(), masteredWords, vocabDue);
    }
}
