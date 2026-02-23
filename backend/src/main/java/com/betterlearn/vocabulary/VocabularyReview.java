package com.betterlearn.vocabulary;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "vocabulary_reviews")
public class VocabularyReview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "word_id", nullable = false)
    private VocabularyWord word;

    @Column(nullable = false)
    private int quality;

    @Column(name = "reviewed_at", nullable = false)
    private Instant reviewedAt = Instant.now();

    protected VocabularyReview() {}

    public VocabularyReview(VocabularyWord word, int quality) {
        this.word = word;
        this.quality = quality;
    }

    public Long getId() { return id; }
    public VocabularyWord getWord() { return word; }
    public int getQuality() { return quality; }
    public Instant getReviewedAt() { return reviewedAt; }
}
