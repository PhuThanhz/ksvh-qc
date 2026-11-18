package vn.ksvh.qc.report.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.ksvh.qc.report.service.pdf.PdfInspectionExporter;
import vn.ksvh.qc.report.service.pdf.PdfM4AlertExporter;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PdfExportService {

    private final PdfInspectionExporter inspectionExporter;
    private final PdfM4AlertExporter m4AlertExporter;

    public byte[] generateInspectionPdf(Long inspectionId) {
        return inspectionExporter.generateInspectionPdf(inspectionId);
    }

    public byte[] generateM4AlertPdf(Long findingId) {
        return m4AlertExporter.generateM4AlertPdf(findingId);
    }
}
