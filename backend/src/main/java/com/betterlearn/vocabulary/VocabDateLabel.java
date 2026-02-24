package com.betterlearn.vocabulary;

import com.betterlearn.quiz.QuizTopic;
import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(name = "vocab_date_labels")
public class VocabDateLabel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "topic_id", nullable = false)
    private QuizTopic topic;

    @Column(name = "added_date", nullable = false)
    private LocalDate addedDate;

    @Column(nullable = false, length = 100)
    private String label;

    protected VocabDateLabel() {}

    public VocabDateLabel(QuizTopic topic, LocalDate addedDate, String label) {
        this.topic = topic;
        this.addedDate = addedDate;
        this.label = label;
    }

    public Long getId() { return id; }
    public QuizTopic getTopic() { return topic; }
    public LocalDate getAddedDate() { return addedDate; }
    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }
}
