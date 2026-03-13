package com.betterlearn.dashboard;

import com.betterlearn.leetcode.LeetcodeRepository;
import com.betterlearn.leetcode.LeetcodeService;
import com.betterlearn.leetcode.dto.ProblemResponse;
import com.betterlearn.quiz.QuizConceptRepository;
import com.betterlearn.quiz.QuizService;
import com.betterlearn.quiz.dto.ConceptResponse;
import com.betterlearn.vocabulary.VocabularyService;
import com.betterlearn.vocabulary.dto.DueTermGroupResponse;
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
    private final QuizConceptRepository quizConceptRepository;

    public DashboardController(LeetcodeService leetcodeService, QuizService quizService,
                               VocabularyService vocabularyService,
                               LeetcodeRepository leetcodeRepository,
                               QuizConceptRepository quizConceptRepository) {
        this.leetcodeService = leetcodeService;
        this.quizService = quizService;
        this.vocabularyService = vocabularyService;
        this.leetcodeRepository = leetcodeRepository;
        this.quizConceptRepository = quizConceptRepository;
    }

    @GetMapping
    public DashboardResponse getDashboard(@RequestAttribute Long userId) {
        // LeetCode
        List<ProblemResponse> due = leetcodeService.findDue(userId);
        int totalCount = (int) leetcodeRepository.countByUserId(userId);
        int masteredProblems = (int) leetcodeRepository.countByUserIdAndStatus(userId, "mastered");

        // Topics: concepts + vocab combined
        List<ConceptResponse> conceptsDue = quizService.findDueConcepts(userId);
        List<DueTermGroupResponse> termGroups = vocabularyService.findDueGroupedForUser(userId);
        long conceptsTotal = quizConceptRepository.countByTopicUserId(userId);
        long wordsTotal = vocabularyService.countForUser(userId);
        int masteredConcepts = (int) quizConceptRepository.countByTopicUserIdAndStatus(userId, "mastered");
        int masteredWords = (int) vocabularyService.countByStatusForUser(userId, "mastered");

        int termsDueCount = termGroups.stream().mapToInt(DueTermGroupResponse::dueCount).sum();
        int topicsDueCount = conceptsDue.size() + termsDueCount;
        int topicsTotalCount = (int) (conceptsTotal + wordsTotal);
        int masteredTopicItems = masteredConcepts + masteredWords;

        List<ConceptResponse> recentConcepts = quizService.findRecentConcepts(userId);

        return new DashboardResponse(due.size(), totalCount, masteredProblems, due,
                topicsDueCount, topicsTotalCount, masteredTopicItems,
                conceptsDue, termGroups, recentConcepts);
    }
}
