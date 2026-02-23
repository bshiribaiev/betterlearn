package com.betterlearn.quiz;

import com.betterlearn.quiz.dto.*;
import com.betterlearn.spacedrepetition.Sm2Result;
import com.betterlearn.spacedrepetition.Sm2Service;
import com.betterlearn.user.User;
import com.betterlearn.user.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class QuizService {

    private final QuizTopicRepository topicRepo;
    private final QuizSessionRepository sessionRepo;
    private final UserRepository userRepo;
    private final Sm2Service sm2Service;
    private final GeminiService geminiService;
    private final ObjectMapper objectMapper;

    public QuizService(QuizTopicRepository topicRepo, QuizSessionRepository sessionRepo,
                       UserRepository userRepo, Sm2Service sm2Service,
                       GeminiService geminiService, ObjectMapper objectMapper) {
        this.topicRepo = topicRepo;
        this.sessionRepo = sessionRepo;
        this.userRepo = userRepo;
        this.sm2Service = sm2Service;
        this.geminiService = geminiService;
        this.objectMapper = objectMapper;
    }

    public List<TopicResponse> findAll(Long userId) {
        return topicRepo.findAllByUserId(userId).stream()
                .map(TopicResponse::from)
                .toList();
    }

    public List<TopicResponse> findDue(Long userId) {
        return topicRepo.findDueByUserId(userId).stream()
                .map(TopicResponse::from)
                .toList();
    }

    @Transactional
    public TopicResponse create(Long userId, TopicCreateRequest request) {
        if (topicRepo.existsByUserIdAndName(userId, request.name())) {
            throw new IllegalArgumentException("Topic already exists: " + request.name());
        }

        User user = userRepo.getReferenceById(userId);
        QuizTopic topic = new QuizTopic(user, request.name());
        return TopicResponse.from(topicRepo.save(topic));
    }

    @Transactional
    public void delete(Long userId, Long topicId) {
        QuizTopic topic = findOwnedTopic(userId, topicId);
        topicRepo.delete(topic);
    }

    public QuizGenerateResponse generate(Long userId, Long topicId, int count) {
        QuizTopic topic = findOwnedTopic(userId, topicId);
        List<QuizQuestionDto> questions = geminiService.generateQuestions(topic.getName(), count);
        return new QuizGenerateResponse(questions);
    }

    @Transactional
    public SessionResponse submit(Long userId, Long topicId, QuizSubmitRequest request) {
        QuizTopic topic = findOwnedTopic(userId, topicId);

        List<QuizQuestionDto> questions = request.questions();
        List<Integer> answers = request.answers();

        if (questions.size() != answers.size()) {
            throw new IllegalArgumentException("Questions and answers count mismatch");
        }

        int correct = 0;
        for (int i = 0; i < questions.size(); i++) {
            if (answers.get(i) == questions.get(i).correctIndex()) {
                correct++;
            }
        }

        int total = questions.size();
        int quality = scoreToQuality(correct, total);

        Sm2Result result = sm2Service.calculate(
                topic.getEasinessFactor(),
                topic.getRepetition(),
                topic.getIntervalDays(),
                quality
        );
        topic.applySmResult(
                result.easinessFactor(),
                result.repetition(),
                result.intervalDays(),
                result.nextReview(),
                result.status()
        );

        String questionsJson = serializeQuestions(questions);
        QuizSession session = new QuizSession(topic, total, correct, quality, questionsJson);
        sessionRepo.save(session);
        topicRepo.save(topic);

        return SessionResponse.from(session);
    }

    public List<SessionResponse> getSessions(Long userId, Long topicId) {
        findOwnedTopic(userId, topicId);
        return sessionRepo.findByTopicIdOrderByTakenAtDesc(topicId).stream()
                .map(SessionResponse::from)
                .toList();
    }

    private QuizTopic findOwnedTopic(Long userId, Long topicId) {
        QuizTopic topic = topicRepo.findById(topicId)
                .orElseThrow(() -> new IllegalArgumentException("Topic not found"));

        if (!topic.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Topic not found");
        }
        return topic;
    }

    static int scoreToQuality(int correct, int total) {
        if (total == 0) return 0;
        int pct = (int) Math.round(100.0 * correct / total);
        if (pct >= 90) return 5;
        if (pct >= 80) return 4;
        if (pct >= 70) return 3;
        if (pct >= 60) return 2;
        if (pct >= 40) return 1;
        return 0;
    }

    private String serializeQuestions(List<QuizQuestionDto> questions) {
        try {
            return objectMapper.writeValueAsString(questions);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to serialize questions");
        }
    }
}
