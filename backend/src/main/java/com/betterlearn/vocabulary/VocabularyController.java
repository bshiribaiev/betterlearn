package com.betterlearn.vocabulary;

import com.betterlearn.vocabulary.dto.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vocabulary")
public class VocabularyController {

    private final VocabularyService vocabularyService;

    public VocabularyController(VocabularyService vocabularyService) {
        this.vocabularyService = vocabularyService;
    }

    @GetMapping
    public List<WordResponse> findAll(@RequestAttribute Long userId) {
        return vocabularyService.findAll(userId);
    }

    @GetMapping("/due")
    public List<WordResponse> findDue(@RequestAttribute Long userId) {
        return vocabularyService.findDue(userId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public WordResponse create(@RequestAttribute Long userId,
                               @Valid @RequestBody WordCreateRequest request) {
        return vocabularyService.create(userId, request);
    }

    @PutMapping("/{id}")
    public WordResponse update(@RequestAttribute Long userId,
                               @PathVariable Long id,
                               @RequestBody WordUpdateRequest request) {
        return vocabularyService.update(userId, id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@RequestAttribute Long userId, @PathVariable Long id) {
        vocabularyService.delete(userId, id);
    }

    @PostMapping("/{id}/review")
    public WordResponse submitReview(@RequestAttribute Long userId,
                                     @PathVariable Long id,
                                     @Valid @RequestBody ReviewRequest request) {
        return vocabularyService.submitReview(userId, id, request.quality());
    }

    @GetMapping("/{id}/history")
    public List<ReviewResponse> getHistory(@RequestAttribute Long userId,
                                           @PathVariable Long id) {
        return vocabularyService.getHistory(userId, id);
    }
}
