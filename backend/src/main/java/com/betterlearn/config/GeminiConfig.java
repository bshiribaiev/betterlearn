package com.betterlearn.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
@ConfigurationProperties(prefix = "app.gemini")
public class GeminiConfig {

    private String apiKey;
    private String model = "gemini-2.5-flash";

    @Bean
    RestTemplate geminiRestTemplate() {
        return new RestTemplate();
    }

    public String getApiKey() { return apiKey; }
    public void setApiKey(String apiKey) { this.apiKey = apiKey; }
    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }
}
