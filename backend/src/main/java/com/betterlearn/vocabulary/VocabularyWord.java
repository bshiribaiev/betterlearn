package com.betterlearn.vocabulary;

import com.betterlearn.user.User;
import jakarta.persistence.*;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "vocabulary_words")
public class VocabularyWord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 200)
    private String word;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String definition;

    @Column(name = "easiness_factor", nullable = false)
    private double easinessFactor = 2.5;

    @Column(nullable = false)
    private int repetition = 0;

    @Column(name = "interval_days", nullable = false)
    private int intervalDays = 0;

    @Column(name = "next_review", nullable = false)
    private LocalDate nextReview = LocalDate.now();

    @Column(nullable = false, length = 20)
    private String status = "new";

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    protected VocabularyWord() {}

    public VocabularyWord(User user, String word, String definition) {
        this.user = user;
        this.word = word;
        this.definition = definition;
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public Long getId() { return id; }
    public User getUser() { return user; }
    public String getWord() { return word; }
    public String getDefinition() { return definition; }
    public double getEasinessFactor() { return easinessFactor; }
    public int getRepetition() { return repetition; }
    public int getIntervalDays() { return intervalDays; }
    public LocalDate getNextReview() { return nextReview; }
    public String getStatus() { return status; }

    public void setWord(String word) { this.word = word; }
    public void setDefinition(String definition) { this.definition = definition; }

    public void applySmResult(double ef, int rep, int interval, LocalDate next, String status) {
        this.easinessFactor = ef;
        this.repetition = rep;
        this.intervalDays = interval;
        this.nextReview = next;
        this.status = status;
    }
}
