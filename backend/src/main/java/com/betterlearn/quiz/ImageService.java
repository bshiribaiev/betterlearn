package com.betterlearn.quiz;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Request;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.util.Set;
import java.util.UUID;

@Service
public class ImageService {

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("png", "jpg", "jpeg", "gif", "webp");

    private final S3Client s3;
    private final String bucket;

    public ImageService(S3Client s3, @Value("${aws.s3.bucket}") String bucket) {
        this.s3 = s3;
        this.bucket = bucket;
    }

    public String saveImage(Long conceptId, String originalFilename, byte[] bytes) {
        String ext = extractExtension(originalFilename);
        if (!ALLOWED_EXTENSIONS.contains(ext)) {
            throw new IllegalArgumentException("Unsupported image type: " + ext);
        }
        String filename = UUID.randomUUID() + "." + ext;
        String key = imageKey(conceptId, filename);

        s3.putObject(
                PutObjectRequest.builder().bucket(bucket).key(key).build(),
                RequestBody.fromBytes(bytes));
        return filename;
    }

    public byte[] loadImage(Long conceptId, String filename) {
        try {
            return s3.getObjectAsBytes(
                    GetObjectRequest.builder().bucket(bucket).key(imageKey(conceptId, filename)).build()
            ).asByteArray();
        } catch (Exception e) {
            throw new IllegalArgumentException("Image not found");
        }
    }

    public void deleteAllImages(Long conceptId) {
        String prefix = "concepts/" + conceptId + "/images/";
        var listing = s3.listObjectsV2(
                ListObjectsV2Request.builder().bucket(bucket).prefix(prefix).build());
        listing.contents().forEach(obj ->
                s3.deleteObject(DeleteObjectRequest.builder().bucket(bucket).key(obj.key()).build()));
    }

    private String imageKey(Long conceptId, String filename) {
        return "concepts/" + conceptId + "/images/" + filename;
    }

    private String extractExtension(String filename) {
        if (filename == null) return "";
        int dot = filename.lastIndexOf('.');
        if (dot < 0) return "";
        return filename.substring(dot + 1).toLowerCase();
    }
}
