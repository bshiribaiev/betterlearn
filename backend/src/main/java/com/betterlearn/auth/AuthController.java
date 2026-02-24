package com.betterlearn.auth;

import com.betterlearn.auth.dto.AuthResponse;
import com.betterlearn.auth.dto.LoginRequest;
import com.betterlearn.auth.dto.RegisterRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final GoogleAuthService googleAuthService;

    @Value("${app.google.frontend-callback:http://localhost:4200/auth/callback}")
    private String frontendCallback;

    public AuthController(AuthService authService, GoogleAuthService googleAuthService) {
        this.authService = authService;
        this.googleAuthService = googleAuthService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/me")
    public AuthResponse.UserInfo me(@RequestAttribute("userId") Long userId) {
        return authService.getCurrentUser(userId);
    }

    @GetMapping("/google")
    public void redirectToGoogle(HttpServletResponse response) throws IOException {
        response.sendRedirect(googleAuthService.buildAuthorizationUrl());
    }

    @GetMapping("/google/callback")
    public void googleCallback(@RequestParam("code") String code, HttpServletResponse response) throws IOException {
        GoogleAuthService.GoogleUserInfo googleUser = googleAuthService.exchangeCodeForUserInfo(code);
        AuthResponse authResponse = authService.loginWithGoogle(googleUser.email(), googleUser.name());
        response.sendRedirect(frontendCallback + "?token=" + authResponse.token());
    }
}
