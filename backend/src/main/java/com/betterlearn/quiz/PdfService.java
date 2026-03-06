package com.betterlearn.quiz;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;

@Service
public class PdfService {

    private static final int MAX_TEXT_LENGTH = 50_000;

    private final S3Client s3;
    private final String bucket;

    public PdfService(S3Client s3, @Value("${aws.s3.bucket}") String bucket) {
        this.s3 = s3;
        this.bucket = bucket;
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
        s3.putObject(
                PutObjectRequest.builder().bucket(bucket).key(pdfKey(conceptId, filename)).build(),
                RequestBody.fromBytes(bytes));
    }

    public byte[] loadPdf(Long conceptId, String filename) {
        try {
            return s3.getObjectAsBytes(
                    GetObjectRequest.builder().bucket(bucket).key(pdfKey(conceptId, filename)).build()
            ).asByteArray();
        } catch (Exception e) {
            throw new IllegalArgumentException("PDF file not found");
        }
    }

    public void deletePdf(Long conceptId, String filename) {
        s3.deleteObject(
                DeleteObjectRequest.builder().bucket(bucket).key(pdfKey(conceptId, filename)).build());
    }

    private String pdfKey(Long conceptId, String filename) {
        return "concepts/" + conceptId + "/" + filename;
    }
}
