package com.betterlearn.quiz;

import com.betterlearn.user.User;
import jakarta.persistence.*;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "quiz_topics")
public class QuizTopic {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 300)
    private String name;

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

    @Column(name = "total_reviews", nullable = false)
    private int totalReviews = 0;

    @Column(name = "textbook_name", length = 300)
    private String textbookName;

    @Column(name = "textbook_url")
    private String textbookUrl;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    protected QuizTopic() {}

    public QuizTopic(User user, String name) {
        this.user = user;
        this.name = name;
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public void applySmResult(double ef, int rep, int interval, LocalDate next, String status) {
        this.easinessFactor = ef;
        this.repetition = rep;
        this.intervalDays = interval;
        this.nextReview = next;
        this.status = status;
        this.totalReviews++;
    }

    public Long getId() { return id; }
    public User getUser() { return user; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public double getEasinessFactor() { return easinessFactor; }
    public int getRepetition() { return repetition; }
    public int getIntervalDays() { return intervalDays; }
    public LocalDate getNextReview() { return nextReview; }
    public String getStatus() { return status; }
    public int getTotalReviews() { return totalReviews; }
    public String getTextbookName() { return textbookName; }
    public void setTextbookName(String textbookName) { this.textbookName = textbookName; }
    public String getTextbookUrl() { return textbookUrl; }
    public void setTextbookUrl(String textbookUrl) { this.textbookUrl = textbookUrl; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
