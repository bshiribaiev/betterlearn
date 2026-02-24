package com.betterlearn.vocabulary;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;

public interface VocabularyRepository extends JpaRepository<VocabularyWord, Long> {

    @Query("SELECT w FROM VocabularyWord w WHERE w.topic.id = :topicId ORDER BY CASE WHEN w.nextReview <= CURRENT_DATE THEN 0 ELSE 1 END, w.nextReview ASC")
    List<VocabularyWord> findAllByTopicId(Long topicId);

    @Query("SELECT w FROM VocabularyWord w WHERE w.topic.id = :topicId AND w.nextReview <= CURRENT_DATE ORDER BY w.nextReview ASC")
    List<VocabularyWord> findDueByTopicId(Long topicId);

    @Query("SELECT MIN(w.nextReview) FROM VocabularyWord w WHERE w.topic.id = :topicId")
    LocalDate findEarliestNextReviewByTopicId(Long topicId);

    boolean existsByTopicIdAndWord(Long topicId, String word);

    @Query("SELECT w FROM VocabularyWord w WHERE w.topic.user.id = :userId AND w.nextReview <= CURRENT_DATE ORDER BY w.nextReview ASC")
    List<VocabularyWord> findDueByTopicUserId(Long userId);

    long countByTopicUserId(Long userId);

    long countByTopicUserIdAndStatus(Long userId, String status);
}
