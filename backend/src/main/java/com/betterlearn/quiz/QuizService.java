package com.betterlearn.quiz;

import com.betterlearn.quiz.dto.*;
import com.betterlearn.spacedrepetition.Sm2Result;
import com.betterlearn.spacedrepetition.Sm2Service;
import com.betterlearn.user.User;
import com.betterlearn.user.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.web.multipart.MultipartFile;

import org.springframework.http.MediaType;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
public class QuizService {

    private final QuizTopicRepository topicRepo;
    private final QuizConceptRepository conceptRepo;
    private final QuizSessionRepository sessionRepo;
    private final UserRepository userRepo;
    private final Sm2Service sm2Service;
    private final GeminiService geminiService;
    private final PdfService pdfService;
    private final ImageService imageService;
    private final ObjectMapper objectMapper;

    public QuizService(QuizTopicRepository topicRepo, QuizConceptRepository conceptRepo,
                       QuizSessionRepository sessionRepo, UserRepository userRepo,
                       Sm2Service sm2Service,
                       GeminiService geminiService, PdfService pdfService,
                       ImageService imageService, ObjectMapper objectMapper) {
        this.topicRepo = topicRepo;
        this.conceptRepo = conceptRepo;
        this.sessionRepo = sessionRepo;
        this.userRepo = userRepo;
        this.sm2Service = sm2Service;
        this.geminiService = geminiService;
        this.pdfService = pdfService;
        this.imageService = imageService;
        this.objectMapper = objectMapper;
    }

    // Topic CRUD
    public List<TopicResponse> findAll(Long userId) {
        return topicRepo.findAllByUserId(userId).stream()
                .map(t -> TopicResponse.from(t, earliestDueDate(t.getId())))
                .toList();
    }

    public List<TopicResponse> findDue(Long userId) {
        return topicRepo.findDueByUserId(userId).stream()
                .map(t -> TopicResponse.from(t, earliestDueDate(t.getId())))
                .toList();
    }

    private LocalDate earliestDueDate(Long topicId) {
        return conceptRepo.findEarliestNextReviewByTopicId(topicId);
    }

    @Transactional
    public TopicResponse create(Long userId, TopicCreateRequest request) {
        if (topicRepo.existsByUserIdAndName(userId, request.name())) {
            throw new IllegalArgumentException("Topic already exists: " + request.name());
        }

        User user = userRepo.getReferenceById(userId);
        QuizTopic topic = new QuizTopic(user, request.name());
        topic.setTextbookName(request.textbookName());
        topic.setTextbookUrl(request.textbookUrl());
        return TopicResponse.from(topicRepo.save(topic));
    }

    @Transactional
    public TopicResponse updateTopic(Long userId, Long topicId, TopicUpdateRequest request) {
        QuizTopic topic = findOwnedTopic(userId, topicId);
        topic.setName(request.name());
        topic.setTextbookName(request.textbookName());
        topic.setTextbookUrl(request.textbookUrl());
        return TopicResponse.from(topicRepo.save(topic), earliestDueDate(topicId));
    }

    @Transactional
    public void deleteTopic(Long userId, Long topicId) {
        QuizTopic topic = findOwnedTopic(userId, topicId);
        topicRepo.delete(topic);
    }

    // Concept CRUD
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

        QuizConcept concept = new QuizConcept(topic, request.name());
        concept.setContent(request.content());
        concept.setTerms(request.terms());
        return ConceptResponse.from(conceptRepo.save(concept));
    }

    @Transactional
    public ConceptResponse updateConcept(Long userId, Long conceptId, ConceptUpdateRequest request) {
        QuizConcept concept = findOwnedConcept(userId, conceptId);
        concept.setName(request.name());
        concept.setContent(request.content());
        concept.setTerms(request.terms());
        return ConceptResponse.from(conceptRepo.save(concept));
    }

    @Transactional
    public ConceptResponse rescheduleConcept(Long userId, Long conceptId, LocalDate nextReview) {
        QuizConcept concept = findOwnedConcept(userId, conceptId);
        concept.setNextReview(nextReview);
        concept.setCachedQuestions(null);
        return ConceptResponse.from(conceptRepo.save(concept));
    }

    @Transactional
    public ConceptResponse moveConcept(Long userId, Long conceptId, Long newTopicId) {
        QuizConcept concept = findOwnedConcept(userId, conceptId);
        QuizTopic newTopic = findOwnedTopic(userId, newTopicId);
        concept.setTopic(newTopic);
        return ConceptResponse.from(conceptRepo.save(concept));
    }

    @Transactional
    public void deleteConcept(Long userId, Long conceptId) {
        QuizConcept concept = findOwnedConcept(userId, conceptId);
        imageService.deleteAllImages(conceptId);
        conceptRepo.delete(concept);
    }

    // Generate & Submit (per concept)
    @Transactional
    public QuizGenerateResponse generateForConcept(Long userId, Long conceptId) {
        QuizConcept concept = findOwnedConcept(userId, conceptId);

        // Return cached questions if available
        if (concept.getCachedQuestions() != null) {
            List<QuizQuestionDto> cached = deserializeQuestions(concept.getCachedQuestions());
            return new QuizGenerateResponse(cached);
        }

        String topicName = concept.getTopic().getName();
        String content = concept.getContent();
        String pdfText = concept.getPdfText();
        boolean hasContent = content != null && !content.isBlank();
        boolean hasPdf = pdfText != null && !pdfText.isBlank();

        int count = calculateQuestionCount(content, pdfText);

        List<QuizQuestionDto> questions;
        if (hasContent || hasPdf) {
            questions = geminiService.generateQuestionsFromContent(
                    topicName, concept.getName(), content, pdfText, count);
        } else {
            String promptTopic = topicName + " — " + concept.getName();
            questions = geminiService.generateQuestions(promptTopic, count);
        }
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

        concept.setCachedQuestions(null);

        String questionsJson = serializeQuestions(questions);
        QuizSession session = new QuizSession(topic, concept, total, correct, quality, questionsJson);
        sessionRepo.save(session);
        conceptRepo.save(concept);
        topicRepo.save(topic);

        return SessionResponse.from(session);
    }

    @Transactional(readOnly = true)
    public List<SessionResponse> getConceptSessions(Long userId, Long conceptId) {
        findOwnedConcept(userId, conceptId);
        return sessionRepo.findByConceptIdOrderByTakenAtDesc(conceptId).stream()
                .map(SessionResponse::from)
                .toList();
    }

    // PDF upload
    @Transactional
    public ConceptResponse uploadPdf(Long userId, Long conceptId, MultipartFile file) {
        QuizConcept concept = findOwnedConcept(userId, conceptId);

        try {
            byte[] bytes = file.getBytes();
            String text = pdfService.extractText(bytes);
            String filename = file.getOriginalFilename();

            // Delete old PDF if exists
            if (concept.getPdfFilename() != null) {
                pdfService.deletePdf(conceptId, concept.getPdfFilename());
            }

            pdfService.savePdf(conceptId, filename, bytes);
            concept.setPdfText(text);
            concept.setPdfFilename(filename);
            return ConceptResponse.from(conceptRepo.save(concept));
        } catch (IOException e) {
            throw new IllegalStateException("Failed to read uploaded file");
        }
    }

    @Transactional
    public void removePdf(Long userId, Long conceptId) {
        QuizConcept concept = findOwnedConcept(userId, conceptId);
        if (concept.getPdfFilename() != null) {
            pdfService.deletePdf(conceptId, concept.getPdfFilename());
        }
        concept.setPdfText(null);
        concept.setPdfFilename(null);
        conceptRepo.save(concept);
    }

    @Transactional(readOnly = true)
    public PdfDownload getPdfBytes(Long userId, Long conceptId) {
        QuizConcept concept = findOwnedConcept(userId, conceptId);
        if (concept.getPdfFilename() == null) {
            throw new IllegalArgumentException("No PDF attached");
        }
        byte[] bytes = pdfService.loadPdf(conceptId, concept.getPdfFilename());
        return new PdfDownload(concept.getPdfFilename(), bytes);
    }

    public record PdfDownload(String filename, byte[] bytes) {}

    // Image upload
    private static final Map<String, MediaType> IMAGE_TYPES = Map.of(
            "png", MediaType.IMAGE_PNG,
            "jpg", MediaType.IMAGE_JPEG,
            "jpeg", MediaType.IMAGE_JPEG,
            "gif", MediaType.IMAGE_GIF,
            "webp", MediaType.parseMediaType("image/webp")
    );

    @Transactional(readOnly = true)
    public String uploadImage(Long userId, Long conceptId, MultipartFile file) {
        findOwnedConcept(userId, conceptId);
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("File must be an image");
        }
        try {
            String filename = imageService.saveImage(conceptId, file.getOriginalFilename(), file.getBytes());
            return "/api/quiz/concepts/" + conceptId + "/images/" + filename;
        } catch (IOException e) {
            throw new IllegalStateException("Failed to read uploaded file");
        }
    }

    public ImageDownload getImageBytes(Long conceptId, String filename) {
        byte[] bytes = imageService.loadImage(conceptId, filename);
        String ext = filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
        MediaType type = IMAGE_TYPES.getOrDefault(ext, MediaType.APPLICATION_OCTET_STREAM);
        return new ImageDownload(bytes, type);
    }

    public record ImageDownload(byte[] bytes, MediaType mediaType) {}

    // Flashcard review
    @Transactional
    public SessionResponse submitFlashcardReview(Long userId, Long conceptId, int quality) {
        QuizConcept concept = findOwnedConcept(userId, conceptId);
        QuizTopic topic = concept.getTopic();

        // Count terms for totalQuestions
        int termCount = countTerms(concept.getTerms());

        // Update concept SM-2
        Sm2Result conceptResult = sm2Service.calculate(
                concept.getEasinessFactor(), concept.getRepetition(),
                concept.getIntervalDays(), quality
        );
        concept.applySmResult(conceptResult.easinessFactor(), conceptResult.repetition(),
                conceptResult.intervalDays(), conceptResult.nextReview(), conceptResult.status());

        // Update topic SM-2
        Sm2Result topicResult = sm2Service.calculate(
                topic.getEasinessFactor(), topic.getRepetition(),
                topic.getIntervalDays(), quality
        );
        topic.applySmResult(topicResult.easinessFactor(), topicResult.repetition(),
                topicResult.intervalDays(), topicResult.nextReview(), topicResult.status());

        QuizSession session = new QuizSession(topic, concept, termCount, 0, quality, "[]");
        sessionRepo.save(session);
        conceptRepo.save(concept);
        topicRepo.save(topic);

        return SessionResponse.from(session);
    }

    private int countTerms(String termsJson) {
        if (termsJson == null || termsJson.isBlank()) return 0;
        try {
            return objectMapper.readTree(termsJson).size();
        } catch (Exception e) {
            return 0;
        }
    }

    public List<ConceptResponse> findRecentConcepts(Long userId) {
        return conceptRepo.findRecentByUserId(userId, org.springframework.data.domain.PageRequest.of(0, 5)).stream()
                .map(ConceptResponse::from)
                .toList();
    }

    // Quick Notes
    @Transactional
    public TopicResponse findOrCreateQuickNotes(Long userId) {
        return topicRepo.findByUserIdAndName(userId, "Quick Notes")
                .map(t -> TopicResponse.from(t, earliestDueDate(t.getId())))
                .orElseGet(() -> create(userId, new TopicCreateRequest("Quick Notes", null, null)));
    }

    // Ownership checks
    public QuizTopic findOwnedTopic(Long userId, Long topicId) {
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

    // Helpers
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

    private List<QuizQuestionDto> deserializeQuestions(String json) {
        try {
            return objectMapper.readValue(json, new com.fasterxml.jackson.core.type.TypeReference<>() {});
        } catch (Exception e) {
            throw new IllegalStateException("Failed to deserialize cached questions");
        }
    }

    // Pre-generation
    @Transactional
    public void preGenerateQuiz(QuizConcept concept) {
        String topicName = concept.getTopic().getName();
        String content = concept.getContent();
        String pdfText = concept.getPdfText();
        boolean hasContent = content != null && !content.isBlank();
        boolean hasPdf = pdfText != null && !pdfText.isBlank();

        int count = calculateQuestionCount(content, pdfText);

        List<QuizQuestionDto> questions;
        if (hasContent || hasPdf) {
            questions = geminiService.generateQuestionsFromContent(
                    topicName, concept.getName(), content, pdfText, count);
        } else {
            String promptTopic = topicName + " — " + concept.getName();
            questions = geminiService.generateQuestions(promptTopic, count);
        }

        concept.setCachedQuestions(serializeQuestions(questions));
        conceptRepo.save(concept);
    }

    static int calculateQuestionCount(String content, String pdfText) {
        int length = 0;
        if (content != null) length += content.length();
        if (pdfText != null) length += pdfText.length();

        if (length < 500) return 3;
        if (length < 1500) return 5;
        if (length < 3000) return 7;
        return 10;
    }
}
