package com.betterlearn.spacedrepetition;

import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
public class Sm2Service {

    public Sm2Result calculate(double easinessFactor, int repetition,
                               int intervalDays, int quality) {
        if (quality < 0 || quality > 5) {
            throw new IllegalArgumentException("Quality must be 0-5, got: " + quality);
        }

        double newEf = easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
        newEf = Math.max(1.3, newEf);

        int newRepetition;
        int newInterval;

        if (quality < 3) {
            newRepetition = 0;
            newInterval = 1;
        } else {
            newRepetition = repetition + 1;
            newInterval = switch (newRepetition) {
                case 1 -> 1;
                case 2 -> 6;
                default -> (int) Math.round(intervalDays * newEf);
            };
        }

        LocalDate nextReview = LocalDate.now().plusDays(newInterval);
        String status = deriveStatus(newRepetition, newInterval);

        return new Sm2Result(newEf, newRepetition, newInterval, nextReview, status);
    }

    private String deriveStatus(int repetition, int interval) {
        if (repetition == 0) return "learning";
        if (interval >= 21) return "mastered";
        if (interval >= 7) return "review";
        return "learning";
    }
}
