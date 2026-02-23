package com.betterlearn.vocabulary;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface VocabularyRepository extends JpaRepository<VocabularyWord, Long> {

    @Query("SELECT w FROM VocabularyWord w WHERE w.user.id = :userId ORDER BY CASE WHEN w.nextReview <= CURRENT_DATE THEN 0 ELSE 1 END, w.nextReview ASC")
    List<VocabularyWord> findAllByUserId(Long userId);

    @Query("SELECT w FROM VocabularyWord w WHERE w.user.id = :userId AND w.nextReview <= CURRENT_DATE ORDER BY w.nextReview ASC")
    List<VocabularyWord> findDueByUserId(Long userId);

    boolean existsByUserIdAndWord(Long userId, String word);

    long countByUserIdAndStatus(Long userId, String status);
}
