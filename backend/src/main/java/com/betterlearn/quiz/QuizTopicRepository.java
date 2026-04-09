package com.betterlearn.quiz;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface QuizTopicRepository extends JpaRepository<QuizTopic, Long> {

    Optional<QuizTopic> findByUserIdAndName(Long userId, String name);

    @Query("SELECT t FROM QuizTopic t WHERE t.user.id = :userId ORDER BY CASE WHEN t.nextReview <= :today THEN 0 ELSE 1 END, t.nextReview ASC")
    List<QuizTopic> findAllByUserId(Long userId, LocalDate today);

    @Query("SELECT DISTINCT t FROM QuizTopic t JOIN QuizConcept c ON c.topic = t WHERE t.user.id = :userId AND c.nextReview <= :today ORDER BY t.nextReview ASC")
    List<QuizTopic> findDueByUserId(Long userId, LocalDate today);

    boolean existsByUserIdAndName(Long userId, String name);

    long countByUserIdAndStatus(Long userId, String status);
}
