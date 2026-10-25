package com.bookstore.bookstore.controller;

import com.bookstore.bookstore.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

// Exposes public registration and login endpoints without returning user records.
@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public MessageResponse register(@RequestBody AuthRequest request) {
        authService.register(request.username(), request.password());
        return new MessageResponse("User registered");
    }

    @PostMapping("/login")
    public TokenResponse login(@RequestBody AuthRequest request) {
        String token = authService.login(request.username(), request.password());
        return new TokenResponse(token, "Bearer", authService.getTokenExpirationSeconds());
    }

    public record AuthRequest(String username, String password) {
    }

    public record MessageResponse(String message) {
    }

    public record TokenResponse(String token, String tokenType, long expiresIn) {
    }
}
