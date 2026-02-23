package com.betterlearn.leetcode;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "leetcode_reviews")
public class LeetcodeReview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "problem_id", nullable = false)
    private LeetcodeProblem problem;

    @Column(nullable = false)
    private int quality;

    @Column(name = "reviewed_at", nullable = false)
    private Instant reviewedAt = Instant.now();

    protected LeetcodeReview() {}

    public LeetcodeReview(LeetcodeProblem problem, int quality) {
        this.problem = problem;
        this.quality = quality;
    }

    public Long getId() { return id; }
    public LeetcodeProblem getProblem() { return problem; }
    public int getQuality() { return quality; }
    public Instant getReviewedAt() { return reviewedAt; }
}
