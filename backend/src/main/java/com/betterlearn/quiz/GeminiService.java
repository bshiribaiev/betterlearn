package com.betterlearn.quiz;

import com.betterlearn.config.GeminiConfig;
import com.betterlearn.quiz.dto.QuizQuestionDto;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
public class GeminiService {

    private static final String API_URL = "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s";

    private final RestTemplate restTemplate;
    private final GeminiConfig config;
    private final ObjectMapper objectMapper;

    public GeminiService(RestTemplate geminiRestTemplate, GeminiConfig config, ObjectMapper objectMapper) {
        this.restTemplate = geminiRestTemplate;
        this.config = config;
        this.objectMapper = objectMapper;
    }

    public List<QuizQuestionDto> generateQuestions(String topic, int count) {
        String prompt = buildPrompt(topic, count);
        String url = String.format(API_URL, config.getModel(), config.getApiKey());

        Map<String, Object> request = Map.of(
                "contents", List.of(Map.of(
                        "parts", List.of(Map.of("text", prompt))
                )),
                "generationConfig", Map.of(
                        "responseMimeType", "application/json",
                        "temperature", 0.7
                )
        );

        JsonNode response = restTemplate.postForObject(url, request, JsonNode.class);
        String json = extractText(response);
        return parseQuestions(json);
    }

    private String buildPrompt(String topic, int count) {
        return """
                Generate %d multiple-choice questions about "%s" for a system design / software engineering quiz.

                Return a JSON array where each element has:
                - "question": the question text
                - "options": array of exactly 4 answer choices
                - "correctIndex": 0-based index of the correct option
                - "explanation": brief explanation of why the correct answer is right

                Requirements:
                - Questions should test understanding, not just memorization
                - All 4 options should be plausible
                - Vary difficulty from moderate to challenging
                - Return ONLY the JSON array, no other text
                """.formatted(count, topic);
    }

    private String extractText(JsonNode response) {
        return response
                .path("candidates").get(0)
                .path("content")
                .path("parts").get(0)
                .path("text").asText();
    }

    public String generateGroupLabel(String topicName, List<String> terms) {
        String prompt = """
                Given the topic "%s" and these terms: %s

                Generate a 2-3 word label that summarizes the theme of these terms.
                Return ONLY the label text, nothing else. No quotes, no punctuation.
                """.formatted(topicName, String.join(", ", terms));

        String url = String.format(API_URL, config.getModel(), config.getApiKey());

        Map<String, Object> request = Map.of(
                "contents", List.of(Map.of(
                        "parts", List.of(Map.of("text", prompt))
                )),
                "generationConfig", Map.of(
                        "temperature", 0.3
                )
        );

        JsonNode response = restTemplate.postForObject(url, request, JsonNode.class);
        return extractText(response).trim();
    }

    public List<QuizQuestionDto> generateTermQuiz(String topicName, List<String> terms, int count) {
        String prompt = """
                Generate exactly %d multiple-choice questions testing knowledge of these %d terms from the topic "%s":
                %s

                Return a JSON array where each element has:
                - "question": a question testing understanding of one specific term
                - "options": array of exactly 4 answer choices
                - "correctIndex": 0-based index of the correct option
                - "explanation": brief explanation of the correct answer

                Requirements:
                - Generate exactly one question per term, covering ALL terms listed above
                - Questions should test understanding, not just definitions
                - All 4 options should be plausible
                - Return ONLY the JSON array, no other text
                """.formatted(count, terms.size(), topicName, String.join(", ", terms));

        String url = String.format(API_URL, config.getModel(), config.getApiKey());

        Map<String, Object> request = Map.of(
                "contents", List.of(Map.of(
                        "parts", List.of(Map.of("text", prompt))
                )),
                "generationConfig", Map.of(
                        "responseMimeType", "application/json",
                        "temperature", 0.7
                )
        );

        JsonNode response = restTemplate.postForObject(url, request, JsonNode.class);
        String json = extractText(response);
        return parseQuestions(json);
    }

    private List<QuizQuestionDto> parseQuestions(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            throw new IllegalStateException("Failed to parse Gemini response: " + e.getMessage());
        }
    }
}
