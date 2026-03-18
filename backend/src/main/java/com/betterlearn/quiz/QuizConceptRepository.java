package com.betterlearn.quiz;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface QuizConceptRepository extends JpaRepository<QuizConcept, Long> {

    @Query("SELECT c FROM QuizConcept c JOIN FETCH c.topic WHERE c.topic.id = :topicId ORDER BY CASE WHEN c.nextReview <= CURRENT_DATE THEN 0 ELSE 1 END, c.nextReview ASC")
    List<QuizConcept> findByTopicId(Long topicId);

    @Query("SELECT c FROM QuizConcept c JOIN FETCH c.topic WHERE c.topic.user.id = :userId AND c.nextReview <= CURRENT_DATE ORDER BY c.nextReview ASC")
    List<QuizConcept> findDueByUserId(Long userId);

    @Query("SELECT MIN(c.nextReview) FROM QuizConcept c WHERE c.topic.id = :topicId")
    LocalDate findEarliestNextReviewByTopicId(Long topicId);

    @Query("SELECT c FROM QuizConcept c JOIN FETCH c.topic WHERE c.nextReview <= CURRENT_DATE AND c.cachedQuestions IS NULL AND (c.content IS NOT NULL OR c.pdfText IS NOT NULL)")
    List<QuizConcept> findDueWithoutCachedQuestions();

    @Query("SELECT c FROM QuizConcept c JOIN FETCH c.topic WHERE c.topic.user.id = :userId ORDER BY c.updatedAt DESC")
    List<QuizConcept> findRecentByUserId(Long userId, Pageable pageable);

    @Query("SELECT c FROM QuizConcept c JOIN FETCH c.topic WHERE c.topic.user.id = :userId ORDER BY c.updatedAt DESC")
    List<QuizConcept> findAllByUserId(Long userId);

    Optional<QuizConcept> findByTopicIdAndName(Long topicId, String name);

    boolean existsByTopicIdAndName(Long topicId, String name);

    long countByTopicUserId(Long userId);

    long countByTopicUserIdAndStatus(Long userId, String status);
}
