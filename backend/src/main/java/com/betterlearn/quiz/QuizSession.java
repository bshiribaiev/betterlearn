package com.betterlearn.quiz;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "quiz_sessions")
public class QuizSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "topic_id", nullable = false)
    private QuizTopic topic;

    @Column(name = "total_questions", nullable = false)
    private int totalQuestions;

    @Column(name = "correct_answers", nullable = false)
    private int correctAnswers;

    @Column(nullable = false)
    private int quality;

    @Column(name = "questions_json", nullable = false, columnDefinition = "jsonb")
    private String questionsJson;

    @Column(name = "taken_at", nullable = false, updatable = false)
    private Instant takenAt = Instant.now();

    protected QuizSession() {}

    public QuizSession(QuizTopic topic, int totalQuestions, int correctAnswers,
                       int quality, String questionsJson) {
        this.topic = topic;
        this.totalQuestions = totalQuestions;
        this.correctAnswers = correctAnswers;
        this.quality = quality;
        this.questionsJson = questionsJson;
    }

    public Long getId() { return id; }
    public QuizTopic getTopic() { return topic; }
    public int getTotalQuestions() { return totalQuestions; }
    public int getCorrectAnswers() { return correctAnswers; }
    public int getQuality() { return quality; }
    public String getQuestionsJson() { return questionsJson; }
    public Instant getTakenAt() { return takenAt; }
}
