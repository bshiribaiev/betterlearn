package com.betterlearn.common;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.ZoneId;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class TimezoneFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {
        String tz = request.getHeader("X-Timezone");
        if (tz != null && !tz.isBlank()) {
            try {
                UserClock.set(ZoneId.of(tz));
            } catch (Exception ignored) {
                // Invalid zone ID — fall back to system default
            }
        }
        try {
            filterChain.doFilter(request, response);
        } finally {
            UserClock.clear();
        }
    }
}
