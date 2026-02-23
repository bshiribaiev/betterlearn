package com.betterlearn.quiz;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuizSessionRepository extends JpaRepository<QuizSession, Long> {

    List<QuizSession> findByTopicIdOrderByTakenAtDesc(Long topicId);

    List<QuizSession> findByConceptIdOrderByTakenAtDesc(Long conceptId);
}
