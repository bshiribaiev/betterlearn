package com.betterlearn.common;

import java.time.LocalDate;
import java.time.ZoneId;

// Per-request user timezone, set by TimezoneFilter from the X-Timezone header.
// Falls back to JVM default zone when no request context is active (scheduled jobs, startup).
public final class UserClock {

    private static final ThreadLocal<ZoneId> ZONE = new ThreadLocal<>();

    private UserClock() {}

    public static void set(ZoneId zone) {
        ZONE.set(zone);
    }

    public static void clear() {
        ZONE.remove();
    }

    public static ZoneId zone() {
        ZoneId z = ZONE.get();
        return z != null ? z : ZoneId.systemDefault();
    }

    public static LocalDate today() {
        return LocalDate.now(zone());
    }
}
