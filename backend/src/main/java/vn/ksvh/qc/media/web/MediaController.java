package vn.ksvh.qc.media.web;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.ksvh.qc.media.dto.PresignUploadRequest;
import vn.ksvh.qc.media.dto.PresignUploadResponse;
import vn.ksvh.qc.media.service.MediaService;
import vn.ksvh.qc.security.CurrentUser;
import vn.ksvh.qc.security.permission.PermissionCodes;
import vn.ksvh.qc.shared.web.ApiPaths;

@RestController
@RequestMapping(ApiPaths.V1 + "/media")
@RequiredArgsConstructor
public class MediaController {

    private final MediaService mediaService;

    @PostMapping("/presign-upload")
    @PreAuthorize("hasAuthority('" + PermissionCodes.MEDIA_UPLOAD + "')")
    public PresignUploadResponse presignUpload(@Valid @RequestBody PresignUploadRequest req,
                                               @AuthenticationPrincipal Jwt jwt) {
        return mediaService.presignUpload(req, CurrentUser.from(jwt).id());
    }
}
