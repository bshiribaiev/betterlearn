package com.betterlearn.quiz;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface QuizTopicRepository extends JpaRepository<QuizTopic, Long> {

    @Query("SELECT t FROM QuizTopic t WHERE t.user.id = :userId ORDER BY CASE WHEN t.nextReview <= CURRENT_DATE THEN 0 ELSE 1 END, t.nextReview ASC")
    List<QuizTopic> findAllByUserId(Long userId);

    @Query("SELECT DISTINCT t FROM QuizTopic t JOIN QuizConcept c ON c.topic = t WHERE t.user.id = :userId AND c.nextReview <= CURRENT_DATE ORDER BY t.nextReview ASC")
    List<QuizTopic> findDueByUserId(Long userId);

    boolean existsByUserIdAndName(Long userId, String name);

    long countByUserIdAndStatus(Long userId, String status);
}
