package com.betterlearn.quiz;

import com.betterlearn.quiz.dto.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/quiz/topics")
public class QuizController {

    private final QuizService quizService;

    public QuizController(QuizService quizService) {
        this.quizService = quizService;
    }

    @GetMapping
    public List<TopicResponse> findAll(@RequestAttribute Long userId) {
        return quizService.findAll(userId);
    }

    @GetMapping("/due")
    public List<TopicResponse> findDue(@RequestAttribute Long userId) {
        return quizService.findDue(userId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TopicResponse create(@RequestAttribute Long userId,
                                @Valid @RequestBody TopicCreateRequest request) {
        return quizService.create(userId, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@RequestAttribute Long userId, @PathVariable Long id) {
        quizService.delete(userId, id);
    }

    @PostMapping("/{id}/generate")
    public QuizGenerateResponse generate(@RequestAttribute Long userId,
                                          @PathVariable Long id,
                                          @RequestParam(defaultValue = "5") int count) {
        return quizService.generate(userId, id, count);
    }

    @PostMapping("/{id}/submit")
    public SessionResponse submit(@RequestAttribute Long userId,
                                   @PathVariable Long id,
                                   @Valid @RequestBody QuizSubmitRequest request) {
        return quizService.submit(userId, id, request);
    }

    @GetMapping("/{id}/sessions")
    public List<SessionResponse> getSessions(@RequestAttribute Long userId,
                                              @PathVariable Long id) {
        return quizService.getSessions(userId, id);
    }
}
