package com.betterlearn.leetcode;

import com.betterlearn.user.User;
import jakarta.persistence.*;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "leetcode_problems")
public class LeetcodeProblem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 500)
    private String url;

    @Column(nullable = false, length = 300)
    private String title;

    private String notes;

    @Column(name = "first_attempted", nullable = false)
    private LocalDate firstAttempted = LocalDate.now();

    @Column(name = "easiness_factor", nullable = false)
    private double easinessFactor = 2.5;

    @Column(nullable = false)
    private int repetition = 0;

    @Column(name = "interval_days", nullable = false)
    private int intervalDays = 0;

    @Column(name = "next_review", nullable = false)
    private LocalDate nextReview = LocalDate.now().plusDays(1);

    @Column(nullable = false, length = 20)
    private String status = "new";

    @Column(nullable = false, length = 10)
    private String confidence = "none";

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    protected LeetcodeProblem() {}

    public LeetcodeProblem(User user, String url, String title, String notes, String confidence) {
        this.user = user;
        this.url = url;
        this.title = title;
        this.notes = notes;
        this.confidence = confidence;
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public Long getId() { return id; }
    public User getUser() { return user; }
    public String getUrl() { return url; }
    public String getTitle() { return title; }
    public String getNotes() { return notes; }
    public LocalDate getFirstAttempted() { return firstAttempted; }
    public double getEasinessFactor() { return easinessFactor; }
    public int getRepetition() { return repetition; }
    public int getIntervalDays() { return intervalDays; }
    public void setIntervalDays(int intervalDays) { this.intervalDays = intervalDays; }
    public LocalDate getNextReview() { return nextReview; }
    public void setNextReview(LocalDate nextReview) { this.nextReview = nextReview; }
    public String getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }

    public void setTitle(String title) { this.title = title; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getConfidence() { return confidence; }
    public void setConfidence(String confidence) { this.confidence = confidence; }

    public void applySmResult(double ef, int rep, int interval, LocalDate next, String status) {
        this.easinessFactor = ef;
        this.repetition = rep;
        this.intervalDays = interval;
        this.nextReview = next;
        this.status = status;
    }
}
