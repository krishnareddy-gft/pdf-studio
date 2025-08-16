
import { PDFDocument, StandardFonts } from 'pdf-lib'

export async function mergePdfFiles(files) {
  const mergedPdf = await PDFDocument.create()

  for (const file of files) {
    const bytes = await file.arrayBuffer()
    const pdf = await PDFDocument.load(bytes)
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())
    copiedPages.forEach((p) => mergedPdf.addPage(p))
  }

  const mergedBytes = await mergedPdf.save()
  return new Blob([mergedBytes], { type: 'application/pdf' })
}

export async function imagesToPdf(files) {
  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

  for (const file of files) {
    const bytes = await file.arrayBuffer()
    const mime = file.type.toLowerCase()
    let img
    if (mime.includes('png')) {
      img = await pdfDoc.embedPng(bytes)
    } else {
      img = await pdfDoc.embedJpg(bytes)
    }
    const { width, height } = img

    // Fit to A4 while preserving aspect ratio
    const A4 = { w: 595.28, h: 841.89 }
    const scale = Math.min(A4.w / width, A4.h / height)
    const w = width * scale
    const h = height * scale
    const x = (A4.w - w) / 2
    const y = (A4.h - h) / 2

    const page = pdfDoc.addPage([A4.w, A4.h])
    page.drawImage(img, { x, y, width: w, height: h })
    page.drawText(file.name, { x: 24, y: 24, size: 10, font, color: undefined })
  }

  const pdfBytes = await pdfDoc.save()
  return new Blob([pdfBytes], { type: 'application/pdf' })
}
