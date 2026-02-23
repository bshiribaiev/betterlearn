package com.betterlearn.leetcode;

import com.betterlearn.leetcode.dto.ProblemCreateRequest;
import com.betterlearn.leetcode.dto.ProblemResponse;
import com.betterlearn.leetcode.dto.ProblemUpdateRequest;
import com.betterlearn.leetcode.dto.ReviewResponse;
import com.betterlearn.spacedrepetition.Sm2Result;
import com.betterlearn.spacedrepetition.Sm2Service;
import com.betterlearn.user.User;
import com.betterlearn.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class LeetcodeService {

    private final LeetcodeRepository problemRepo;
    private final LeetcodeReviewRepository reviewRepo;
    private final UserRepository userRepo;
    private final Sm2Service sm2Service;

    public LeetcodeService(LeetcodeRepository problemRepo,
                           LeetcodeReviewRepository reviewRepo,
                           UserRepository userRepo,
                           Sm2Service sm2Service) {
        this.problemRepo = problemRepo;
        this.reviewRepo = reviewRepo;
        this.userRepo = userRepo;
        this.sm2Service = sm2Service;
    }

    public List<ProblemResponse> findAll(Long userId) {
        return problemRepo.findByUserIdOrderByNextReviewAsc(userId).stream()
                .map(ProblemResponse::from)
                .toList();
    }

    public List<ProblemResponse> findDue(Long userId) {
        return problemRepo.findDueByUserId(userId).stream()
                .map(ProblemResponse::from)
                .toList();
    }

    @Transactional
    public ProblemResponse create(Long userId, ProblemCreateRequest request) {
        if (problemRepo.existsByUserIdAndUrl(userId, request.url())) {
            throw new IllegalArgumentException("Problem already tracked: " + request.url());
        }

        User user = userRepo.getReferenceById(userId);
        String title = request.title() != null && !request.title().isBlank()
                ? request.title()
                : parseTitleFromUrl(request.url());

        LeetcodeProblem problem = new LeetcodeProblem(user, request.url(), title, request.notes());
        return ProblemResponse.from(problemRepo.save(problem));
    }

    @Transactional
    public ProblemResponse update(Long userId, Long problemId, ProblemUpdateRequest request) {
        LeetcodeProblem problem = findOwnedProblem(userId, problemId);

        if (request.title() != null) problem.setTitle(request.title());
        if (request.notes() != null) problem.setNotes(request.notes());

        return ProblemResponse.from(problemRepo.save(problem));
    }

    @Transactional
    public void delete(Long userId, Long problemId) {
        LeetcodeProblem problem = findOwnedProblem(userId, problemId);
        problemRepo.delete(problem);
    }

    @Transactional
    public ProblemResponse submitReview(Long userId, Long problemId, int quality) {
        LeetcodeProblem problem = findOwnedProblem(userId, problemId);

        Sm2Result result = sm2Service.calculate(
                problem.getEasinessFactor(),
                problem.getRepetition(),
                problem.getIntervalDays(),
                quality
        );

        problem.applySmResult(
                result.easinessFactor(),
                result.repetition(),
                result.intervalDays(),
                result.nextReview(),
                result.status()
        );

        reviewRepo.save(new LeetcodeReview(problem, quality));
        return ProblemResponse.from(problemRepo.save(problem));
    }

    public List<ReviewResponse> getHistory(Long userId, Long problemId) {
        findOwnedProblem(userId, problemId);
        return reviewRepo.findByProblemIdOrderByReviewedAtDesc(problemId).stream()
                .map(ReviewResponse::from)
                .toList();
    }

    private LeetcodeProblem findOwnedProblem(Long userId, Long problemId) {
        LeetcodeProblem problem = problemRepo.findById(problemId)
                .orElseThrow(() -> new IllegalArgumentException("Problem not found"));

        if (!problem.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Problem not found");
        }
        return problem;
    }

    static String parseTitleFromUrl(String url) {
        String path = url.replaceAll("\\?.*", "").replaceAll("/$", "");
        String slug = path.substring(path.lastIndexOf('/') + 1);
        String[] words = slug.split("-");
        StringBuilder title = new StringBuilder();
        for (String word : words) {
            if (!word.isEmpty()) {
                title.append(Character.toUpperCase(word.charAt(0)))
                     .append(word.substring(1))
                     .append(' ');
            }
        }
        return title.toString().trim();
    }
}
