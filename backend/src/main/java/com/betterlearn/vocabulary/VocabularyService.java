package com.betterlearn.vocabulary;

import com.betterlearn.quiz.QuizTopic;
import com.betterlearn.spacedrepetition.Sm2Result;
import com.betterlearn.spacedrepetition.Sm2Service;
import com.betterlearn.vocabulary.dto.ReviewResponse;
import com.betterlearn.vocabulary.dto.WordCreateRequest;
import com.betterlearn.vocabulary.dto.WordResponse;
import com.betterlearn.vocabulary.dto.WordUpdateRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class VocabularyService {

    private final VocabularyRepository wordRepo;
    private final VocabularyReviewRepository reviewRepo;
    private final Sm2Service sm2Service;

    public VocabularyService(VocabularyRepository wordRepo,
                             VocabularyReviewRepository reviewRepo,
                             Sm2Service sm2Service) {
        this.wordRepo = wordRepo;
        this.reviewRepo = reviewRepo;
        this.sm2Service = sm2Service;
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
