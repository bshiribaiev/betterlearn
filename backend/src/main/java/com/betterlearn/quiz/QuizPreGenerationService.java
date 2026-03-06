package com.betterlearn.quiz;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class QuizPreGenerationService {

    private static final Logger log = LoggerFactory.getLogger(QuizPreGenerationService.class);
    private static final int BATCH_LIMIT = 10;

    private final QuizConceptRepository conceptRepo;
    private final QuizService quizService;

    public QuizPreGenerationService(QuizConceptRepository conceptRepo, QuizService quizService) {
        this.conceptRepo = conceptRepo;
        this.quizService = quizService;
    }

    @Scheduled(cron = "0 0 0 * * *")
    public void preGenerateDueQuizzes() {
        List<QuizConcept> concepts = conceptRepo.findDueWithoutCachedQuestions();
        int count = Math.min(concepts.size(), BATCH_LIMIT);
        log.info("Pre-generating quizzes for {} due concepts (of {} total)", count, concepts.size());

        for (int i = 0; i < count; i++) {
            QuizConcept concept = concepts.get(i);
            try {
                quizService.preGenerateQuiz(concept);
                log.info("Pre-generated quiz for concept {} ({})", concept.getId(), concept.getName());
            } catch (Exception e) {
                log.warn("Failed to pre-generate quiz for concept {}: {}", concept.getId(), e.getMessage());
            }
        }
    }
}
