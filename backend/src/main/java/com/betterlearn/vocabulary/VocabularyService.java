package com.betterlearn.vocabulary;

import com.betterlearn.quiz.GeminiService;
import com.betterlearn.quiz.QuizTopic;
import com.betterlearn.quiz.dto.QuizQuestionDto;
import com.betterlearn.spacedrepetition.Sm2Result;
import com.betterlearn.spacedrepetition.Sm2Service;
import com.betterlearn.vocabulary.dto.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class VocabularyService {

    private final VocabularyRepository wordRepo;
    private final VocabularyReviewRepository reviewRepo;
    private final VocabDateLabelRepository labelRepo;
    private final Sm2Service sm2Service;
    private final GeminiService geminiService;

    public VocabularyService(VocabularyRepository wordRepo,
                             VocabularyReviewRepository reviewRepo,
                             VocabDateLabelRepository labelRepo,
                             Sm2Service sm2Service,
                             GeminiService geminiService) {
        this.wordRepo = wordRepo;
        this.reviewRepo = reviewRepo;
        this.labelRepo = labelRepo;
        this.sm2Service = sm2Service;
        this.geminiService = geminiService;
    }

    public List<WordResponse> findByTopic(Long topicId) {
        return wordRepo.findAllByTopicId(topicId).stream()
                .map(WordResponse::from)
                .toList();
    }

    @Transactional
    public WordResponse create(QuizTopic topic, WordCreateRequest request) {
        if (wordRepo.existsByTopicIdAndWord(topic.getId(), request.word().trim())) {
            throw new IllegalArgumentException("Word already tracked: " + request.word());
        }
        VocabularyWord word = new VocabularyWord(topic, request.word().trim(), null);
        return WordResponse.from(wordRepo.save(word));
    }

    @Transactional
    public WordResponse update(Long userId, Long wordId, WordUpdateRequest request) {
        VocabularyWord word = findOwnedWord(userId, wordId);
        if (request.word() != null) word.setWord(request.word());
        if (request.definition() != null) word.setDefinition(request.definition());
        return WordResponse.from(wordRepo.save(word));
    }

    @Transactional
    public void delete(Long userId, Long wordId) {
        VocabularyWord word = findOwnedWord(userId, wordId);
        wordRepo.delete(word);
    }

    @Transactional
    public WordResponse submitReview(Long userId, Long wordId, int quality) {
        VocabularyWord word = findOwnedWord(userId, wordId);

        Sm2Result result = sm2Service.calculate(
                word.getEasinessFactor(),
                word.getRepetition(),
                word.getIntervalDays(),
                quality
        );

        word.applySmResult(
                result.easinessFactor(),
                result.repetition(),
                result.intervalDays(),
                result.nextReview(),
                deriveStatus(quality)
        );

        reviewRepo.save(new VocabularyReview(word, quality));
        return WordResponse.from(wordRepo.save(word));
    }

    static String deriveStatus(int quality) {
        if (quality <= 2) return "learning";
        if (quality <= 3) return "review";
        return "mastered";
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> getHistory(Long userId, Long wordId) {
        findOwnedWord(userId, wordId);
        return reviewRepo.findByWordIdOrderByReviewedAtDesc(wordId).stream()
                .map(ReviewResponse::from)
                .toList();
    }

    // --- Grouped view ---

    @Transactional(readOnly = true)
    public List<WordGroupResponse> findByTopicGrouped(Long topicId) {
        List<VocabularyWord> allWords = wordRepo.findAllByTopicId(topicId);
        Map<LocalDate, List<VocabularyWord>> byDate = allWords.stream()
                .collect(Collectors.groupingBy(
                        w -> w.getCreatedAt().atZone(ZoneId.systemDefault()).toLocalDate(),
                        LinkedHashMap::new,
                        Collectors.toList()
                ));

        Map<LocalDate, String> labels = labelRepo.findByTopicId(topicId).stream()
                .collect(Collectors.toMap(VocabDateLabel::getAddedDate, VocabDateLabel::getLabel));

        List<WordGroupResponse> groups = new ArrayList<>();
        for (var entry : byDate.entrySet()) {
            LocalDate date = entry.getKey();
            List<VocabularyWord> words = entry.getValue();
            long dueCount = words.stream().filter(w -> !w.getNextReview().isAfter(LocalDate.now())).count();
            groups.add(new WordGroupResponse(
                    date,
                    labels.get(date),
                    words.size(),
                    (int) dueCount,
                    words.stream().map(WordResponse::from).toList()
            ));
        }

        groups.sort(Comparator.comparing(WordGroupResponse::addedDate).reversed());
        return groups;
    }

    @Transactional
    public String generateGroupLabel(QuizTopic topic, LocalDate date) {
        Optional<VocabDateLabel> existing = labelRepo.findByTopicIdAndAddedDate(topic.getId(), date);
        if (existing.isPresent()) return existing.get().getLabel();

        List<VocabularyWord> words = wordRepo.findAllByTopicId(topic.getId()).stream()
                .filter(w -> w.getCreatedAt().atZone(ZoneId.systemDefault()).toLocalDate().equals(date))
                .toList();

        if (words.isEmpty()) throw new IllegalArgumentException("No words for this date");

        List<String> termNames = words.stream().map(VocabularyWord::getWord).toList();
        String label = geminiService.generateGroupLabel(topic.getName(), termNames);

        if (label.length() > 100) label = label.substring(0, 100);
        labelRepo.save(new VocabDateLabel(topic, date, label));
        return label;
    }

    // --- Term quiz ---

    @Transactional(readOnly = true)
    public List<QuizQuestionDto> generateTermQuiz(Long topicId, LocalDate date, Integer count) {
        List<VocabularyWord> words = wordRepo.findAllByTopicId(topicId).stream()
                .filter(w -> date == null || w.getCreatedAt().atZone(ZoneId.systemDefault()).toLocalDate().equals(date))
                .toList();

        if (words.isEmpty()) throw new IllegalArgumentException("No words found");

        List<String> termNames = words.stream().map(VocabularyWord::getWord).toList();
        int questionCount = count != null ? Math.min(count, termNames.size()) : termNames.size();
        return geminiService.generateTermQuiz(
                words.get(0).getTopic().getName(), termNames, questionCount);
    }

    @Transactional
    public TermQuizResultResponse submitTermQuiz(Long userId, Long topicId, LocalDate date,
                                                  List<QuizQuestionDto> questions, List<Integer> answers) {
        List<VocabularyWord> words = wordRepo.findAllByTopicId(topicId).stream()
                .filter(w -> date == null || w.getCreatedAt().atZone(ZoneId.systemDefault()).toLocalDate().equals(date))
                .filter(w -> w.getTopic().getUser().getId().equals(userId))
                .toList();

        int correct = 0;
        for (int i = 0; i < questions.size(); i++) {
            if (answers.get(i) == questions.get(i).correctIndex()) correct++;
        }

        int total = questions.size();
        int quality = mapScoreToQuality(correct, total);

        for (VocabularyWord word : words) {
            Sm2Result result = sm2Service.calculate(
                    word.getEasinessFactor(), word.getRepetition(),
                    word.getIntervalDays(), quality);
            word.applySmResult(result.easinessFactor(), result.repetition(),
                    result.intervalDays(), result.nextReview(), deriveStatus(quality));
            wordRepo.save(word);
            reviewRepo.save(new VocabularyReview(word, quality));
        }

        return new TermQuizResultResponse(total, correct, quality);
    }

    private static int mapScoreToQuality(int correct, int total) {
        double pct = 100.0 * correct / total;
        if (pct >= 90) return 5;
        if (pct >= 80) return 4;
        if (pct >= 70) return 3;
        if (pct >= 60) return 2;
        if (pct >= 40) return 1;
        return 0;
    }

    // --- Dashboard queries ---

    public List<WordResponse> findDueForUser(Long userId) {
        return wordRepo.findDueByTopicUserId(userId).stream()
                .map(WordResponse::from)
                .toList();
    }

    public long countForUser(Long userId) {
        return wordRepo.countByTopicUserId(userId);
    }

    public long countByStatusForUser(Long userId, String status) {
        return wordRepo.countByTopicUserIdAndStatus(userId, status);
    }

    // --- Ownership ---

    private VocabularyWord findOwnedWord(Long userId, Long wordId) {
        VocabularyWord word = wordRepo.findById(wordId)
                .orElseThrow(() -> new IllegalArgumentException("Word not found"));
        if (!word.getTopic().getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Word not found");
        }
        return word;
    }
}
