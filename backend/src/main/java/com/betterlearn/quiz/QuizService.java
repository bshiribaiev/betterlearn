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
    private final QuizConceptRepository conceptRepo;
    private final QuizSessionRepository sessionRepo;
    private final UserRepository userRepo;
    private final Sm2Service sm2Service;
    private final GeminiService geminiService;
    private final ObjectMapper objectMapper;

    public QuizService(QuizTopicRepository topicRepo, QuizConceptRepository conceptRepo,
                       QuizSessionRepository sessionRepo, UserRepository userRepo,
                       Sm2Service sm2Service, GeminiService geminiService,
                       ObjectMapper objectMapper) {
        this.topicRepo = topicRepo;
        this.conceptRepo = conceptRepo;
        this.sessionRepo = sessionRepo;
        this.userRepo = userRepo;
        this.sm2Service = sm2Service;
        this.geminiService = geminiService;
        this.objectMapper = objectMapper;
    }

    // --- Topic CRUD ---

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
    public void deleteTopic(Long userId, Long topicId) {
        QuizTopic topic = findOwnedTopic(userId, topicId);
        topicRepo.delete(topic);
    }

    // --- Concept CRUD ---

    public List<ConceptResponse> findConceptsByTopic(Long userId, Long topicId) {
        findOwnedTopic(userId, topicId);
        return conceptRepo.findByTopicId(topicId).stream()
                .map(ConceptResponse::from)
                .toList();
    }

    public List<ConceptResponse> findDueConcepts(Long userId) {
        return conceptRepo.findDueByUserId(userId).stream()
                .map(ConceptResponse::from)
                .toList();
    }

    @Transactional
    public ConceptResponse createConcept(Long userId, Long topicId, ConceptCreateRequest request) {
        QuizTopic topic = findOwnedTopic(userId, topicId);

        if (conceptRepo.existsByTopicIdAndName(topicId, request.name())) {
            throw new IllegalArgumentException("Concept already exists: " + request.name());
        }

        QuizConcept concept = new QuizConcept(topic, request.name());
        return ConceptResponse.from(conceptRepo.save(concept));
    }

    @Transactional
    public void deleteConcept(Long userId, Long conceptId) {
        QuizConcept concept = findOwnedConcept(userId, conceptId);
        conceptRepo.delete(concept);
    }

    // --- Generate & Submit (per concept) ---

    public QuizGenerateResponse generateForConcept(Long userId, Long conceptId, int count) {
        QuizConcept concept = findOwnedConcept(userId, conceptId);
        String promptTopic = concept.getTopic().getName() + " — " + concept.getName();
        List<QuizQuestionDto> questions = geminiService.generateQuestions(promptTopic, count);
        return new QuizGenerateResponse(questions);
    }

    @Transactional
    public SessionResponse submitForConcept(Long userId, Long conceptId, QuizSubmitRequest request) {
        QuizConcept concept = findOwnedConcept(userId, conceptId);
        QuizTopic topic = concept.getTopic();

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

        // Update concept SM-2
        Sm2Result conceptResult = sm2Service.calculate(
                concept.getEasinessFactor(), concept.getRepetition(),
                concept.getIntervalDays(), quality
        );
        concept.applySmResult(conceptResult.easinessFactor(), conceptResult.repetition(),
                conceptResult.intervalDays(), conceptResult.nextReview(), conceptResult.status());

        // Update topic SM-2 with same quality
        Sm2Result topicResult = sm2Service.calculate(
                topic.getEasinessFactor(), topic.getRepetition(),
                topic.getIntervalDays(), quality
        );
        topic.applySmResult(topicResult.easinessFactor(), topicResult.repetition(),
                topicResult.intervalDays(), topicResult.nextReview(), topicResult.status());

        String questionsJson = serializeQuestions(questions);
        QuizSession session = new QuizSession(topic, concept, total, correct, quality, questionsJson);
        sessionRepo.save(session);
        conceptRepo.save(concept);
        topicRepo.save(topic);

        return SessionResponse.from(session);
    }

    public List<SessionResponse> getConceptSessions(Long userId, Long conceptId) {
        findOwnedConcept(userId, conceptId);
        return sessionRepo.findByConceptIdOrderByTakenAtDesc(conceptId).stream()
                .map(SessionResponse::from)
                .toList();
    }

    // --- Ownership checks ---

    private QuizTopic findOwnedTopic(Long userId, Long topicId) {
        QuizTopic topic = topicRepo.findById(topicId)
                .orElseThrow(() -> new IllegalArgumentException("Topic not found"));

        if (!topic.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Topic not found");
        }
        return topic;
    }

    private QuizConcept findOwnedConcept(Long userId, Long conceptId) {
        QuizConcept concept = conceptRepo.findById(conceptId)
                .orElseThrow(() -> new IllegalArgumentException("Concept not found"));

        if (!concept.getTopic().getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Concept not found");
        }
        return concept;
    }

    // --- Helpers ---

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
