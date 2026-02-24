package com.betterlearn.vocabulary;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface VocabDateLabelRepository extends JpaRepository<VocabDateLabel, Long> {

    List<VocabDateLabel> findByTopicId(Long topicId);

    Optional<VocabDateLabel> findByTopicIdAndAddedDate(Long topicId, LocalDate addedDate);
}
