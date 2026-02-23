package com.betterlearn.spacedrepetition;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class Sm2ServiceTest {

    private Sm2Service sm2Service;

    @BeforeEach
    void setUp() {
        sm2Service = new Sm2Service();
    }

    @Test
    void firstCorrectReview_intervalsOneDay() {
        Sm2Result result = sm2Service.calculate(2.5, 0, 0, 3);
        assertEquals(1, result.repetition());
        assertEquals(1, result.intervalDays());
        assertEquals("learning", result.status());
    }

    @Test
    void secondCorrectReview_intervalsSixDays() {
        Sm2Result result = sm2Service.calculate(2.5, 1, 1, 3);
        assertEquals(2, result.repetition());
        assertEquals(6, result.intervalDays());
        assertEquals("learning", result.status());
    }

    @Test
    void thirdCorrectReview_usesEfMultiplier() {
        Sm2Result result = sm2Service.calculate(2.5, 2, 6, 4);
        assertEquals(3, result.repetition());
        assertEquals(15, result.intervalDays());
        assertEquals("review", result.status());
    }

    @Test
    void easyReview_increasesEf() {
        Sm2Result result = sm2Service.calculate(2.5, 2, 6, 5);
        assertTrue(result.easinessFactor() > 2.5);
    }

    @Test
    void failedReview_resetsToLearning() {
        Sm2Result result = sm2Service.calculate(2.5, 5, 30, 1);
        assertEquals(0, result.repetition());
        assertEquals(1, result.intervalDays());
        assertEquals("learning", result.status());
    }

    @Test
    void efFloor_neverBelow1point3() {
        Sm2Result result = sm2Service.calculate(1.3, 0, 1, 0);
        assertTrue(result.easinessFactor() >= 1.3);
    }

    @Test
    void masteredStatus_atTwentyOneDays() {
        Sm2Result result = sm2Service.calculate(2.5, 3, 15, 5);
        assertTrue(result.intervalDays() >= 21);
        assertEquals("mastered", result.status());
    }

    @Test
    void invalidQuality_throws() {
        assertThrows(IllegalArgumentException.class,
                () -> sm2Service.calculate(2.5, 0, 0, 6));
        assertThrows(IllegalArgumentException.class,
                () -> sm2Service.calculate(2.5, 0, 0, -1));
    }
}
