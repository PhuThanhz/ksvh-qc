package vn.ksvh.qc.media.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.model.S3Exception;
import vn.ksvh.qc.media.config.StorageProperties;

@Component
@RequiredArgsConstructor
class S3ObjectStore implements ObjectStore {

    private final S3Client s3;
    private final StorageProperties props;

    @Override
    public boolean exists(String key) {
        try {
            s3.headObject(b -> b.bucket(props.bucket()).key(key));
            return true;
        } catch (NoSuchKeyException e) {
            return false;
        } catch (S3Exception e) {
            if (e.statusCode() == 404) {
                return false;
            }
            throw e;
        }
    }
}
