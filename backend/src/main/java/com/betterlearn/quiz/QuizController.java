package com.betterlearn.quiz;

import com.betterlearn.quiz.dto.*;
import com.betterlearn.vocabulary.VocabularyService;
import com.betterlearn.vocabulary.dto.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/quiz")
public class QuizController {

    private final QuizService quizService;
    private final VocabularyService vocabularyService;

    public QuizController(QuizService quizService, VocabularyService vocabularyService) {
        this.quizService = quizService;
        this.vocabularyService = vocabularyService;
    }

    // Topics
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

    @PutMapping("/topics/{id}")
    public TopicResponse updateTopic(@RequestAttribute Long userId,
                                      @PathVariable Long id,
                                      @Valid @RequestBody TopicUpdateRequest request) {
        return quizService.updateTopic(userId, id, request);
    }

    @DeleteMapping("/topics/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTopic(@RequestAttribute Long userId, @PathVariable Long id) {
        quizService.deleteTopic(userId, id);
    }

    // Concepts
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

    @PutMapping("/concepts/{id}")
    public ConceptResponse updateConcept(@RequestAttribute Long userId,
                                          @PathVariable Long id,
                                          @Valid @RequestBody ConceptUpdateRequest request) {
        return quizService.updateConcept(userId, id, request);
    }

    @PatchMapping("/concepts/{id}/reschedule")
    public ConceptResponse rescheduleConcept(@RequestAttribute Long userId,
                                              @PathVariable Long id,
                                              @RequestBody Map<String, String> body) {
        LocalDate date = LocalDate.parse(body.get("nextReview"));
        return quizService.rescheduleConcept(userId, id, date);
    }

    @DeleteMapping("/concepts/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteConcept(@RequestAttribute Long userId, @PathVariable Long id) {
        quizService.deleteConcept(userId, id);
    }

    @PostMapping("/concepts/{id}/pdf")
    public ConceptResponse uploadPdf(@RequestAttribute Long userId,
                                      @PathVariable Long id,
                                      @RequestParam("file") MultipartFile file) {
        return quizService.uploadPdf(userId, id, file);
    }

    @DeleteMapping("/concepts/{id}/pdf")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removePdf(@RequestAttribute Long userId, @PathVariable Long id) {
        quizService.removePdf(userId, id);
    }

    @GetMapping("/concepts/{id}/pdf")
    public ResponseEntity<byte[]> downloadPdf(@RequestAttribute Long userId, @PathVariable Long id) {
        QuizService.PdfDownload pdf = quizService.getPdfBytes(userId, id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + pdf.filename() + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf.bytes());
    }

    // Images
    @PostMapping("/concepts/{id}/images")
    public Map<String, String> uploadImage(@RequestAttribute Long userId,
                                            @PathVariable Long id,
                                            @RequestParam("file") MultipartFile file) {
        String url = quizService.uploadImage(userId, id, file);
        return Map.of("url", url);
    }

    @GetMapping("/concepts/{conceptId}/images/{filename}")
    public ResponseEntity<byte[]> getImage(@PathVariable Long conceptId,
                                            @PathVariable String filename) {
        QuizService.ImageDownload img = quizService.getImageBytes(conceptId, filename);
        return ResponseEntity.ok()
                .contentType(img.mediaType())
                .header(HttpHeaders.CACHE_CONTROL, "public, max-age=86400")
                .body(img.bytes());
    }

    @PostMapping("/concepts/{id}/generate")
    public QuizGenerateResponse generateForConcept(@RequestAttribute Long userId,
                                                    @PathVariable Long id) {
        return quizService.generateForConcept(userId, id);
    }

    @PostMapping("/concepts/{id}/submit")
    public SessionResponse submitForConcept(@RequestAttribute Long userId,
                                             @PathVariable Long id,
                                             @Valid @RequestBody QuizSubmitRequest request) {
        return quizService.submitForConcept(userId, id, request);
    }

    @PostMapping("/concepts/{id}/flashcard-review")
    public SessionResponse submitFlashcardReview(@RequestAttribute Long userId,
                                                  @PathVariable Long id,
                                                  @Valid @RequestBody FlashcardSubmitRequest request) {
        return quizService.submitFlashcardReview(userId, id, request.quality());
    }

    @GetMapping("/concepts/{id}/sessions")
    public List<SessionResponse> getConceptSessions(@RequestAttribute Long userId,
                                                     @PathVariable Long id) {
        return quizService.getConceptSessions(userId, id);
    }

    // Words (vocab under topic)
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

    // Words grouped
    @GetMapping("/topics/{topicId}/words/grouped")
    public List<WordGroupResponse> findWordsGrouped(@RequestAttribute Long userId,
                                                     @PathVariable Long topicId) {
        quizService.findOwnedTopic(userId, topicId);
        return vocabularyService.findByTopicGrouped(topicId);
    }

    @PostMapping("/topics/{topicId}/words/groups/{date}/label")
    public java.util.Map<String, String> generateGroupLabel(@RequestAttribute Long userId,
                                                             @PathVariable Long topicId,
                                                             @PathVariable LocalDate date) {
        QuizTopic topic = quizService.findOwnedTopic(userId, topicId);
        String label = vocabularyService.generateGroupLabel(topic, date);
        return java.util.Map.of("label", label);
    }

    // Term quiz
    @PostMapping("/topics/{topicId}/words/quiz/generate")
    public QuizGenerateResponse generateTermQuiz(@RequestAttribute Long userId,
                                                  @PathVariable Long topicId,
                                                  @RequestParam(required = false) LocalDate date,
                                                  @RequestParam(required = false) Integer count) {
        quizService.findOwnedTopic(userId, topicId);
        var questions = vocabularyService.generateTermQuiz(topicId, date, count);
        return new QuizGenerateResponse(questions);
    }

    @PostMapping("/topics/{topicId}/words/quiz/submit")
    public TermQuizResultResponse submitTermQuiz(@RequestAttribute Long userId,
                                                  @PathVariable Long topicId,
                                                  @RequestParam(required = false) LocalDate date,
                                                  @Valid @RequestBody QuizSubmitRequest request) {
        quizService.findOwnedTopic(userId, topicId);
        return vocabularyService.submitTermQuiz(userId, topicId, date, request.questions(), request.answers());
    }
}
