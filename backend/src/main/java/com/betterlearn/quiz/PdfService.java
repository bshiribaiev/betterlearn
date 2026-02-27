package com.betterlearn.quiz;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

@Service
public class PdfService {

    private static final int MAX_TEXT_LENGTH = 50_000;

    private final Path uploadDir;

    public PdfService(@Value("${app.upload-dir:./uploads}") String uploadDir) {
        this.uploadDir = Path.of(uploadDir);
    }

    public String extractText(byte[] pdfBytes) {
        try (PDDocument doc = PDDocument.load(pdfBytes)) {
            PDFTextStripper stripper = new PDFTextStripper();
            String text = stripper.getText(doc);
            if (text.length() > MAX_TEXT_LENGTH) {
                return text.substring(0, MAX_TEXT_LENGTH);
            }
            return text;
        } catch (IOException e) {
            throw new IllegalArgumentException("Failed to read PDF: " + e.getMessage());
        }
    }

    public void savePdf(Long conceptId, String filename, byte[] bytes) {
        try {
            Path dir = uploadDir.resolve("concepts").resolve(String.valueOf(conceptId));
            Files.createDirectories(dir);
            Files.write(dir.resolve(filename), bytes);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to save PDF: " + e.getMessage());
        }
    }

    public byte[] loadPdf(Long conceptId, String filename) {
        try {
            return Files.readAllBytes(
                    uploadDir.resolve("concepts").resolve(String.valueOf(conceptId)).resolve(filename));
        } catch (IOException e) {
            throw new IllegalArgumentException("PDF file not found");
        }
    }

    public void deletePdf(Long conceptId, String filename) {
        try {
            Path file = uploadDir.resolve("concepts").resolve(String.valueOf(conceptId)).resolve(filename);
            Files.deleteIfExists(file);
        } catch (IOException e) {
            // ignore delete failures
        }
    }
}
