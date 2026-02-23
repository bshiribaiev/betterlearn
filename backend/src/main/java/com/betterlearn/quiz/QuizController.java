package com.betterlearn.quiz;

import com.betterlearn.quiz.dto.*;
import com.betterlearn.vocabulary.VocabularyService;
import com.betterlearn.vocabulary.dto.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/quiz")
public class QuizController {

    private final QuizService quizService;
    private final VocabularyService vocabularyService;

    public QuizController(QuizService quizService, VocabularyService vocabularyService) {
        this.quizService = quizService;
        this.vocabularyService = vocabularyService;
    }

    // --- Topics ---

    @GetMapping("/topics")
    public List<TopicResponse> findAllTopics(@RequestAttribute Long userId) {
        return quizService.findAll(userId);
    }

    @GetMapping("/topics/due")
    public List<TopicResponse> findDueTopics(@RequestAttribute Long userId) {
        return quizService.findDue(userId);
    }

    @PostMapping("/topics")
    @ResponseStatus(HttpStatus.CREATED)
    public TopicResponse createTopic(@RequestAttribute Long userId,
                                     @Valid @RequestBody TopicCreateRequest request) {
        return quizService.create(userId, request);
    }

    @DeleteMapping("/topics/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTopic(@RequestAttribute Long userId, @PathVariable Long id) {
        quizService.deleteTopic(userId, id);
    }

    // --- Concepts ---

    @GetMapping("/topics/{topicId}/concepts")
    public List<ConceptResponse> findConcepts(@RequestAttribute Long userId,
                                              @PathVariable Long topicId) {
        return quizService.findConceptsByTopic(userId, topicId);
    }

    @PostMapping("/topics/{topicId}/concepts")
    @ResponseStatus(HttpStatus.CREATED)
    public ConceptResponse createConcept(@RequestAttribute Long userId,
                                         @PathVariable Long topicId,
                                         @Valid @RequestBody ConceptCreateRequest request) {
        return quizService.createConcept(userId, topicId, request);
    }

    @DeleteMapping("/concepts/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteConcept(@RequestAttribute Long userId, @PathVariable Long id) {
        quizService.deleteConcept(userId, id);
    }

    @PostMapping("/concepts/{id}/generate")
    public QuizGenerateResponse generateForConcept(@RequestAttribute Long userId,
                                                    @PathVariable Long id,
                                                    @RequestParam(defaultValue = "5") int count) {
        return quizService.generateForConcept(userId, id, count);
    }

    @PostMapping("/concepts/{id}/submit")
    public SessionResponse submitForConcept(@RequestAttribute Long userId,
                                             @PathVariable Long id,
                                             @Valid @RequestBody QuizSubmitRequest request) {
        return quizService.submitForConcept(userId, id, request);
    }

    @GetMapping("/concepts/{id}/sessions")
    public List<SessionResponse> getConceptSessions(@RequestAttribute Long userId,
                                                     @PathVariable Long id) {
        return quizService.getConceptSessions(userId, id);
    }

    // --- Words (vocab under topic) ---

    @GetMapping("/topics/{topicId}/words")
    public List<WordResponse> findWords(@RequestAttribute Long userId,
                                        @PathVariable Long topicId) {
        quizService.findOwnedTopic(userId, topicId);
        return vocabularyService.findByTopic(topicId);
    }

    @PostMapping("/topics/{topicId}/words")
    @ResponseStatus(HttpStatus.CREATED)
    public WordResponse createWord(@RequestAttribute Long userId,
                                    @PathVariable Long topicId,
                                    @Valid @RequestBody WordCreateRequest request) {
        QuizTopic topic = quizService.findOwnedTopic(userId, topicId);
        return vocabularyService.create(topic, request);
    }

    @PutMapping("/words/{id}")
    public WordResponse updateWord(@RequestAttribute Long userId,
                                    @PathVariable Long id,
                                    @RequestBody WordUpdateRequest request) {
        return vocabularyService.update(userId, id, request);
    }

    @DeleteMapping("/words/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteWord(@RequestAttribute Long userId, @PathVariable Long id) {
        vocabularyService.delete(userId, id);
    }

    @PostMapping("/words/{id}/review")
    public WordResponse submitWordReview(@RequestAttribute Long userId,
                                          @PathVariable Long id,
                                          @Valid @RequestBody ReviewRequest request) {
        return vocabularyService.submitReview(userId, id, request.quality());
    }

    @GetMapping("/words/{id}/history")
    public List<ReviewResponse> getWordHistory(@RequestAttribute Long userId,
                                                @PathVariable Long id) {
        return vocabularyService.getHistory(userId, id);
    }
}
