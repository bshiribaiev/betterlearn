package com.betterlearn.leetcode;

import com.betterlearn.leetcode.dto.ProblemCreateRequest;
import com.betterlearn.leetcode.dto.ProblemResponse;
import com.betterlearn.leetcode.dto.ProblemUpdateRequest;
import com.betterlearn.leetcode.dto.ReviewResponse;
import com.betterlearn.spacedrepetition.Sm2Result;
import com.betterlearn.spacedrepetition.Sm2Service;
import com.betterlearn.user.User;
import com.betterlearn.user.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
public class LeetcodeService {

    private static final Logger log = LoggerFactory.getLogger(LeetcodeService.class);

    private final LeetcodeRepository problemRepo;
    private final LeetcodeReviewRepository reviewRepo;
    private final UserRepository userRepo;
    private final Sm2Service sm2Service;
    private final RestTemplate restTemplate;

    public LeetcodeService(LeetcodeRepository problemRepo,
                           LeetcodeReviewRepository reviewRepo,
                           UserRepository userRepo,
                           Sm2Service sm2Service,
                           RestTemplate restTemplate) {
        this.problemRepo = problemRepo;
        this.reviewRepo = reviewRepo;
        this.userRepo = userRepo;
        this.sm2Service = sm2Service;
        this.restTemplate = restTemplate;
    }

    public List<ProblemResponse> findAll(Long userId) {
        return problemRepo.findAllByUserId(userId).stream()
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

        String confidence = request.confidence() != null ? request.confidence() : "none";
        LeetcodeProblem problem = new LeetcodeProblem(user, request.url(), title, request.notes(), confidence);

        if (request.difficulty() != null) {
            problem.setDifficulty(request.difficulty());
        } else {
            String slug = parseSlugFromUrl(request.url());
            if (slug != null) {
                String fetched = fetchDifficultyFromLeetCode(slug);
                if (fetched != null) problem.setDifficulty(fetched);
            }
        }

        if (!"none".equals(confidence)) {
            int quality = confidenceToQuality(confidence);
            Sm2Result result = sm2Service.calculate(
                    problem.getEasinessFactor(), problem.getRepetition(),
                    problem.getIntervalDays(), quality);
            problem.applySmResult(result.easinessFactor(), result.repetition(),
                    result.intervalDays(), result.nextReview(), result.status());
        }

        return ProblemResponse.from(problemRepo.save(problem));
    }

    @Transactional
    public ProblemResponse update(Long userId, Long problemId, ProblemUpdateRequest request) {
        LeetcodeProblem problem = findOwnedProblem(userId, problemId);

        if (request.title() != null) problem.setTitle(request.title());
        if (request.notes() != null) problem.setNotes(request.notes());
        if (request.lastReviewed() != null) problem.setLastReviewed(request.lastReviewed());
        if (request.difficulty() != null) problem.setDifficulty(request.difficulty());

        return ProblemResponse.from(problemRepo.save(problem));
    }

    @Transactional
    public ProblemResponse reschedule(Long userId, Long problemId, java.time.LocalDate nextReview) {
        LeetcodeProblem problem = findOwnedProblem(userId, problemId);
        problem.setNextReview(nextReview);
        int gap = (int) java.time.temporal.ChronoUnit.DAYS.between(java.time.LocalDate.now(), nextReview);
        if (gap > 0) problem.setIntervalDays(gap);
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
        problem.setConfidence(deriveConfidence(quality));
        problem.setLastReviewed(java.time.LocalDate.now());

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

    static int confidenceToQuality(String confidence) {
        return switch (confidence) {
            case "low" -> 1;
            case "average" -> 3;
            case "high" -> 5;
            default -> 3;
        };
    }

    static String deriveConfidence(int quality) {
        if (quality <= 2) return "low";
        if (quality <= 3) return "average";
        return "high";
    }

    static String parseTitleFromUrl(String url) {
        String path = url.replaceAll("\\?.*", "").replaceAll("/$", "");

        // Extract slug from /problems/<slug> pattern
        int problemsIdx = path.indexOf("/problems/");
        if (problemsIdx >= 0) {
            String afterProblems = path.substring(problemsIdx + "/problems/".length());
            String slug = afterProblems.contains("/")
                    ? afterProblems.substring(0, afterProblems.indexOf('/'))
                    : afterProblems;
            return slugToTitle(slug);
        }

        // Fallback: use last path segment
        String slug = path.substring(path.lastIndexOf('/') + 1);
        return slugToTitle(slug);
    }

    static String parseSlugFromUrl(String url) {
        String path = url.replaceAll("\\?.*", "").replaceAll("/$", "");
        int idx = path.indexOf("/problems/");
        if (idx < 0) return null;
        String after = path.substring(idx + "/problems/".length());
        return after.contains("/") ? after.substring(0, after.indexOf('/')) : after;
    }

    private String fetchDifficultyFromLeetCode(String slug) {
        try {
            String query = "query { question(titleSlug: \"" + slug + "\") { difficulty } }";
            Map<String, Object> body = Map.of("query", query);
            JsonNode response = restTemplate.postForObject("https://leetcode.com/graphql", body, JsonNode.class);
            if (response == null) return null;
            String difficulty = response.path("data").path("question").path("difficulty").asText(null);
            if (difficulty == null) return null;
            return difficulty.toLowerCase();
        } catch (Exception e) {
            log.debug("Failed to fetch LeetCode difficulty for {}: {}", slug, e.getMessage());
            return null;
        }
    }

    private static String slugToTitle(String slug) {
        String[] words = slug.split("-");
        StringBuilder title = new StringBuilder();
        for (String word : words) {
            if (!word.isEmpty()) {
                title.append(Character.toUpperCase(word.charAt(0)))
                     .append(word.substring(1))
                     .append(' ');
            }
        }
        String result = title.toString().trim();
        return result.isEmpty() ? slug : result;
    }
}
