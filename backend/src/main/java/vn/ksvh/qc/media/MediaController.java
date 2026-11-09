package vn.ksvh.qc.media;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import vn.ksvh.qc.media.dto.PresignUploadRequest;
import vn.ksvh.qc.media.dto.PresignUploadResponse;

@RestController
@RequestMapping("/api/media")
@RequiredArgsConstructor
public class MediaController {

    private final MediaService mediaService;

    @PostMapping("/presign-upload")
    public PresignUploadResponse presignUpload(@Valid @RequestBody PresignUploadRequest req,
                                               @AuthenticationPrincipal Jwt jwt) {
        return mediaService.presignUpload(req, jwt.getSubject());
    }
}
