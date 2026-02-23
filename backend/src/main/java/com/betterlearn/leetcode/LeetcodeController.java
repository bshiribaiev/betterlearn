package com.betterlearn.leetcode;

import com.betterlearn.leetcode.dto.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/leetcode")
public class LeetcodeController {

    private final LeetcodeService leetcodeService;

    public LeetcodeController(LeetcodeService leetcodeService) {
        this.leetcodeService = leetcodeService;
    }

    @GetMapping
    public List<ProblemResponse> findAll(@RequestAttribute Long userId) {
        return leetcodeService.findAll(userId);
    }

    @GetMapping("/due")
    public List<ProblemResponse> findDue(@RequestAttribute Long userId) {
        return leetcodeService.findDue(userId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProblemResponse create(@RequestAttribute Long userId,
                                  @Valid @RequestBody ProblemCreateRequest request) {
        return leetcodeService.create(userId, request);
    }

    @PutMapping("/{id}")
    public ProblemResponse update(@RequestAttribute Long userId,
                                  @PathVariable Long id,
                                  @RequestBody ProblemUpdateRequest request) {
        return leetcodeService.update(userId, id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@RequestAttribute Long userId, @PathVariable Long id) {
        leetcodeService.delete(userId, id);
    }

    @PostMapping("/{id}/review")
    public ProblemResponse submitReview(@RequestAttribute Long userId,
                                        @PathVariable Long id,
                                        @Valid @RequestBody ReviewRequest request) {
        return leetcodeService.submitReview(userId, id, request.quality());
    }

    @GetMapping("/{id}/history")
    public List<ReviewResponse> getHistory(@RequestAttribute Long userId,
                                           @PathVariable Long id) {
        return leetcodeService.getHistory(userId, id);
    }
}
