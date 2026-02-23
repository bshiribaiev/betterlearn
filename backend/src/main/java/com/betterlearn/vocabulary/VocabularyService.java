package com.betterlearn.vocabulary;

import com.betterlearn.spacedrepetition.Sm2Result;
import com.betterlearn.spacedrepetition.Sm2Service;
import com.betterlearn.user.User;
import com.betterlearn.user.UserRepository;
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
    private final UserRepository userRepo;
    private final Sm2Service sm2Service;

    public VocabularyService(VocabularyRepository wordRepo,
                             VocabularyReviewRepository reviewRepo,
                             UserRepository userRepo,
                             Sm2Service sm2Service) {
        this.wordRepo = wordRepo;
        this.reviewRepo = reviewRepo;
        this.userRepo = userRepo;
        this.sm2Service = sm2Service;
    }

    public List<WordResponse> findAll(Long userId) {
        return wordRepo.findAllByUserId(userId).stream()
                .map(WordResponse::from)
                .toList();
    }

    public List<WordResponse> findDue(Long userId) {
        return wordRepo.findDueByUserId(userId).stream()
                .map(WordResponse::from)
                .toList();
    }

    @Transactional
    public WordResponse create(Long userId, WordCreateRequest request) {
        if (wordRepo.existsByUserIdAndWord(userId, request.word().trim())) {
            throw new IllegalArgumentException("Word already tracked: " + request.word());
        }

        User user = userRepo.getReferenceById(userId);
        VocabularyWord word = new VocabularyWord(user, request.word().trim(), null);
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

    public List<ReviewResponse> getHistory(Long userId, Long wordId) {
        findOwnedWord(userId, wordId);
        return reviewRepo.findByWordIdOrderByReviewedAtDesc(wordId).stream()
                .map(ReviewResponse::from)
                .toList();
    }

    private VocabularyWord findOwnedWord(Long userId, Long wordId) {
        VocabularyWord word = wordRepo.findById(wordId)
                .orElseThrow(() -> new IllegalArgumentException("Word not found"));

        if (!word.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Word not found");
        }
        return word;
    }
}
