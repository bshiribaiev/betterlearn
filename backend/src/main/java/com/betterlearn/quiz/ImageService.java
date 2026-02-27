package com.betterlearn.quiz;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.*;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.Set;
import java.util.UUID;

@Service
public class ImageService {

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("png", "jpg", "jpeg", "gif", "webp");

    private final Path uploadDir;

    public ImageService(@Value("${app.upload-dir:./uploads}") String uploadDir) {
        this.uploadDir = Path.of(uploadDir);
    }

    public String saveImage(Long conceptId, String originalFilename, byte[] bytes) {
        String ext = extractExtension(originalFilename);
        if (!ALLOWED_EXTENSIONS.contains(ext)) {
            throw new IllegalArgumentException("Unsupported image type: " + ext);
        }
        String filename = UUID.randomUUID() + "." + ext;
        try {
            Path dir = imagesDir(conceptId);
            Files.createDirectories(dir);
            Files.write(dir.resolve(filename), bytes);
            return filename;
        } catch (IOException e) {
            throw new IllegalStateException("Failed to save image: " + e.getMessage());
        }
    }

    public byte[] loadImage(Long conceptId, String filename) {
        try {
            return Files.readAllBytes(imagesDir(conceptId).resolve(filename));
        } catch (IOException e) {
            throw new IllegalArgumentException("Image not found");
        }
    }

    public void deleteAllImages(Long conceptId) {
        Path dir = imagesDir(conceptId);
        if (!Files.exists(dir)) return;
        try {
            Files.walkFileTree(dir, new SimpleFileVisitor<>() {
                @Override
                public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) throws IOException {
                    Files.delete(file);
                    return FileVisitResult.CONTINUE;
                }
                @Override
                public FileVisitResult postVisitDirectory(Path d, IOException exc) throws IOException {
                    Files.delete(d);
                    return FileVisitResult.CONTINUE;
                }
            });
        } catch (IOException e) {
            // ignore cleanup failures
        }
    }

    private Path imagesDir(Long conceptId) {
        return uploadDir.resolve("concepts").resolve(String.valueOf(conceptId)).resolve("images");
    }

    private String extractExtension(String filename) {
        if (filename == null) return "";
        int dot = filename.lastIndexOf('.');
        if (dot < 0) return "";
        return filename.substring(dot + 1).toLowerCase();
    }
}
