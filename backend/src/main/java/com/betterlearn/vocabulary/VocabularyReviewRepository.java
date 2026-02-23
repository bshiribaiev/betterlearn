package com.betterlearn.vocabulary;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VocabularyReviewRepository extends JpaRepository<VocabularyReview, Long> {

    List<VocabularyReview> findByWordIdOrderByReviewedAtDesc(Long wordId);
}
