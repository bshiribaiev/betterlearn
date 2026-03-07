package com.betterlearn.quiz;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "quiz_concepts")
public class QuizConcept {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "topic_id", nullable = false)
    private QuizTopic topic;

    @Column(nullable = false, length = 300)
    private String name;

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

    @Column(name = "total_reviews", nullable = false)
    private int totalReviews = 0;

    @Column(name = "last_reviewed")
    private LocalDate lastReviewed;

    @Column(columnDefinition = "TEXT")
    private String content;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private String terms;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "cached_questions", columnDefinition = "jsonb")
    private String cachedQuestions;

    @Column(columnDefinition = "TEXT")
    private String pdfText;

    @Column(name = "pdf_filename", length = 300)
    private String pdfFilename;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    protected QuizConcept() {}

    public QuizConcept(QuizTopic topic, String name) {
        this.topic = topic;
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
        this.lastReviewed = LocalDate.now();
    }

    public Long getId() { return id; }
    public QuizTopic getTopic() { return topic; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getTerms() { return terms; }
    public void setTerms(String terms) { this.terms = terms; }
    public String getPdfText() { return pdfText; }
    public void setPdfText(String pdfText) { this.pdfText = pdfText; }
    public String getPdfFilename() { return pdfFilename; }
    public void setPdfFilename(String pdfFilename) { this.pdfFilename = pdfFilename; }
    public double getEasinessFactor() { return easinessFactor; }
    public int getRepetition() { return repetition; }
    public int getIntervalDays() { return intervalDays; }
    public LocalDate getNextReview() { return nextReview; }
    public void setNextReview(LocalDate nextReview) { this.nextReview = nextReview; }
    public String getStatus() { return status; }
    public int getTotalReviews() { return totalReviews; }
    public LocalDate getLastReviewed() { return lastReviewed; }
    public String getCachedQuestions() { return cachedQuestions; }
    public void setCachedQuestions(String cachedQuestions) { this.cachedQuestions = cachedQuestions; }
}
