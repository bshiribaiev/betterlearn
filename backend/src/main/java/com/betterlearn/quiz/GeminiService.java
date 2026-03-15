package com.betterlearn.quiz;

import com.betterlearn.config.GeminiConfig;
import com.betterlearn.quiz.dto.ChatAskResponse;
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
                        "responseSchema", quizArraySchema(),
                        "temperature", 0.7
                )
        );

        JsonNode response = restTemplate.postForObject(url, request, JsonNode.class);
        String json = extractText(response);
        return parseQuestions(json);
    }

    private String buildPrompt(String topic, int count) {
        return """
                Generate %d multiple-choice questions about "%s".

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

                Requirements:
                - Generate exactly one question per term, covering ALL terms listed above
                - Each question must have exactly 4 answer choices
                - Questions should test understanding, not just definitions
                - All 4 options should be plausible
                """.formatted(count, terms.size(), topicName, String.join(", ", terms));

        String url = String.format(API_URL, config.getModel(), config.getApiKey());

        Map<String, Object> request = Map.of(
                "contents", List.of(Map.of(
                        "parts", List.of(Map.of("text", prompt))
                )),
                "generationConfig", Map.of(
                        "responseMimeType", "application/json",
                        "responseSchema", quizArraySchema(),
                        "temperature", 0.7
                )
        );

        JsonNode response = restTemplate.postForObject(url, request, JsonNode.class);
        String json = extractText(response);
        return parseQuestions(json);
    }

    public List<QuizQuestionDto> generateQuestionsFromContent(String topicName, String noteName,
                                                                String content, String pdfText, int count) {
        StringBuilder context = new StringBuilder();
        if (content != null && !content.isBlank()) {
            context.append("\n=== NOTES ===\n").append(content).append("\n=== END NOTES ===\n");
        }
        if (pdfText != null && !pdfText.isBlank()) {
            context.append("\n=== PDF CONTENT ===\n").append(pdfText).append("\n=== END PDF ===\n");
        }

        String prompt = """
                Generate %d multiple-choice questions based on the following material about "%s — %s".
                %s
                Return a JSON array where each element has:
                - "question": the question text
                - "options": array of exactly 4 answer choices
                - "correctIndex": 0-based index of the correct option
                - "explanation": brief explanation of why the correct answer is right

                Requirements:
                - Questions must be derived from the provided material
                - Questions should test understanding, not just memorization
                - All 4 options should be plausible
                - Vary difficulty from moderate to challenging
                - Return ONLY the JSON array, no other text
                """.formatted(count, topicName, noteName, context);

        String url = String.format(API_URL, config.getModel(), config.getApiKey());

        Map<String, Object> request = Map.of(
                "contents", List.of(Map.of(
                        "parts", List.of(Map.of("text", prompt))
                )),
                "generationConfig", Map.of(
                        "responseMimeType", "application/json",
                        "responseSchema", quizArraySchema(),
                        "temperature", 0.7
                )
        );

        JsonNode response = restTemplate.postForObject(url, request, JsonNode.class);
        String json = extractText(response);
        return parseQuestions(json);
    }

    public ChatAskResponse answerQuestion(String question) {
        String prompt = """
                Answer this learning question concisely in 1-3 sentences: "%s"

                Return JSON with:
                - "term": a 2-5 word label for the key concept
                - "definition": your concise answer
                """.formatted(question);

        String url = String.format(API_URL, config.getModel(), config.getApiKey());

        Map<String, Object> request = Map.of(
                "contents", List.of(Map.of(
                        "parts", List.of(Map.of("text", prompt))
                )),
                "generationConfig", Map.of(
                        "responseMimeType", "application/json",
                        "responseSchema", Map.of(
                                "type", "OBJECT",
                                "properties", Map.of(
                                        "term", Map.of("type", "STRING"),
                                        "definition", Map.of("type", "STRING")
                                ),
                                "required", List.of("term", "definition")
                        ),
                        "temperature", 0.3
                )
        );

        JsonNode response = restTemplate.postForObject(url, request, JsonNode.class);
        String json = extractText(response);
        try {
            JsonNode parsed = objectMapper.readTree(json);
            return new ChatAskResponse(
                    parsed.path("term").asText(),
                    parsed.path("definition").asText()
            );
        } catch (Exception e) {
            throw new IllegalStateException("Failed to parse chat response: " + e.getMessage());
        }
    }

    private Map<String, Object> quizArraySchema() {
        return Map.of(
                "type", "ARRAY",
                "items", Map.of(
                        "type", "OBJECT",
                        "properties", Map.of(
                                "question", Map.of("type", "STRING"),
                                "options", Map.of(
                                        "type", "ARRAY",
                                        "items", Map.of("type", "STRING"),
                                        "minItems", 4,
                                        "maxItems", 4
                                ),
                                "correctIndex", Map.of("type", "INTEGER"),
                                "explanation", Map.of("type", "STRING")
                        ),
                        "required", List.of("question", "options", "correctIndex", "explanation")
                )
        );
    }

    private List<QuizQuestionDto> parseQuestions(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            throw new IllegalStateException("Failed to parse Gemini response: " + e.getMessage());
        }
    }
}
