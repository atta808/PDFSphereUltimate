import * as PDFLib from '@adnsistemas/pdf-lib';
import * as FileSystem from 'expo-file-system';
import { FileModel } from '../../models/FileModel';

/**
 * Service for editing PDFs: merge, split, rotate, delete pages, reorder pages.
 */
export class PDFEditingService {
  /**
   * Merge multiple PDFs into one.
   * @param filePaths Array of local file URIs.
   * @param outputFileName Name for the merged PDF.
   * @returns URI of the merged PDF.
   */
  async mergePDFs(filePaths: string[], outputFileName: string = 'Merged.pdf'): Promise<string> {
    const mergedPdf = await PDFLib.PDFDocument.create();
    for (const path of filePaths) {
      const fileBytes = await FileSystem.readAsStringAsync(path, { encoding: "base64" });
      const pdfDoc = await PDFLib.PDFDocument.load(fileBytes, { ignoreEncryption: true });
      const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
      pages.forEach(page => mergedPdf.addPage(page));
    }
    const pdfBytes = await mergedPdf.saveAsBase64();
    const outputPath = `${FileSystem.Paths.document?.uri || ""}${outputFileName}`;
    await FileSystem.writeAsStringAsync(outputPath, pdfBytes, { encoding: "base64" });
    return outputPath;
  }

  /**
   * Split a PDF into multiple files.
   * @param filePath Path to the source PDF.
   * @param splits Array of page ranges, e.g., [{ start: 1, end: 3 }, { start: 4, end: 5 }].
   * @param outputBaseName Base name for the output files.
   * @returns Array of URIs of the split PDFs.
   */
  async splitPDF(filePath: string, splits: { start: number; end: number }[], outputBaseName: string = 'Split'): Promise<string[]> {
    const fileBytes = await FileSystem.readAsStringAsync(filePath, { encoding: "base64" });
    const sourcePdf = await PDFLib.PDFDocument.load(fileBytes, { ignoreEncryption: true });
    const outputPaths: string[] = [];

    for (let i = 0; i < splits.length; i++) {
      const { start, end } = splits[i];
      const newPdf = await PDFLib.PDFDocument.create();
      const pageIndices = Array.from({ length: end - start + 1 }, (_, idx) => start - 1 + idx);
      const pages = await newPdf.copyPages(sourcePdf, pageIndices);
      pages.forEach(page => newPdf.addPage(page));
      const pdfBytes = await newPdf.saveAsBase64();
      const outputPath = `${FileSystem.Paths.document?.uri || ""}${outputBaseName}_${i + 1}.pdf`;
      await FileSystem.writeAsStringAsync(outputPath, pdfBytes, { encoding: "base64" });
      outputPaths.push(outputPath);
    }
    return outputPaths;
  }

  /**
   * Rotate pages in a PDF.
   * @param filePath Path to the source PDF.
   * @param pageNumbers Array of page numbers to rotate (1-indexed). If empty, rotate all pages.
   * @param degrees Rotation angle: 90, 180, 270.
   * @param outputFileName Name for the rotated PDF.
   * @returns URI of the rotated PDF.
   */
  async rotatePDF(filePath: string, pageNumbers: number[], degrees: 90 | 180 | 270, outputFileName: string = 'Rotated.pdf'): Promise<string> {
    const fileBytes = await FileSystem.readAsStringAsync(filePath, { encoding: "base64" });
    const pdfDoc = await PDFLib.PDFDocument.load(fileBytes, { ignoreEncryption: true });
    const pages = pdfDoc.getPages();
    const indices = pageNumbers.length === 0 ? pages.map((_, idx) => idx) : pageNumbers.map(n => n - 1);
    for (const idx of indices) {
      if (idx >= 0 && idx < pages.length) {
        pages[idx].setRotation(PDFLib.degrees(degrees));
      }
    }
    const pdfBytes = await pdfDoc.saveAsBase64();
    const outputPath = `${FileSystem.Paths.document?.uri || ""}${outputFileName}`;
    await FileSystem.writeAsStringAsync(outputPath, pdfBytes, { encoding: "base64" });
    return outputPath;
  }

  /**
   * Delete pages from a PDF.
   * @param filePath Path to the source PDF.
   * @param pageNumbers Array of page numbers to delete (1-indexed).
   * @param outputFileName Name for the resulting PDF.
   * @returns URI of the PDF with pages removed.
   */
  async deletePages(filePath: string, pageNumbers: number[], outputFileName: string = 'Deleted.pdf'): Promise<string> {
    const fileBytes = await FileSystem.readAsStringAsync(filePath, { encoding: "base64" });
    const pdfDoc = await PDFLib.PDFDocument.load(fileBytes, { ignoreEncryption: true });
    const totalPages = pdfDoc.getPageCount();
    const deleteIndices = pageNumbers.map(n => n - 1).filter(i => i >= 0 && i < totalPages).sort((a, b) => b - a);
    for (const idx of deleteIndices) {
      pdfDoc.removePage(idx);
    }
    const pdfBytes = await pdfDoc.saveAsBase64();
    const outputPath = `${FileSystem.Paths.document?.uri || ""}${outputFileName}`;
    await FileSystem.writeAsStringAsync(outputPath, pdfBytes, { encoding: "base64" });
    return outputPath;
  }

  /**
   * Reorder pages in a PDF.
   * @param filePath Path to the source PDF.
   * @param newOrder Array of page numbers (1-indexed) in the desired order.
   * @param outputFileName Name for the reordered PDF.
   * @returns URI of the reordered PDF.
   */
  async reorderPages(filePath: string, newOrder: number[], outputFileName: string = 'Reordered.pdf'): Promise<string> {
    const fileBytes = await FileSystem.readAsStringAsync(filePath, { encoding: "base64" });
    const sourcePdf = await PDFLib.PDFDocument.load(fileBytes, { ignoreEncryption: true });
    const newPdf = await PDFLib.PDFDocument.create();
    const pageIndices = newOrder.map(n => n - 1);
    const pages = await newPdf.copyPages(sourcePdf, pageIndices);
    pages.forEach(page => newPdf.addPage(page));
    const pdfBytes = await newPdf.saveAsBase64();
    const outputPath = `${FileSystem.Paths.document?.uri || ""}${outputFileName}`;
    await FileSystem.writeAsStringAsync(outputPath, pdfBytes, { encoding: "base64" });
    return outputPath;
  }
}