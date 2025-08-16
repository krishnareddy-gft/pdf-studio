import React from 'react'
import FileProcessor from '../components/FileProcessor.jsx'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

export default function HTMLToPDF() {
  const stripHtml = (html) => {
    const tmp = document.createElement('div')
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || ''
  }

  const handleHtmlToPdf = async (files) => {
    const results = []
    for (const fileObj of files) {
      const file = fileObj.file
      const html = await file.text()
      const text = stripHtml(html)
      const pdf = await PDFDocument.create()
      const font = await pdf.embedFont(StandardFonts.Helvetica)

      const pageMargin = 36
      const fontSize = 12
      const lineHeight = fontSize * 1.4
      const pageWidth = 595.28
      const pageHeight = 841.89
      const maxLineWidth = pageWidth - pageMargin * 2

      const words = text.split(/(\s+)/)
      const lines = []
      let current = ''
      for (const token of words) {
        const test = current + token
        const width = font.widthOfTextAtSize(test, fontSize)
        if (token.includes('\n')) {
          const parts = test.split('\n')
          for (let i = 0; i < parts.length - 1; i++) lines.push(parts[i])
          current = parts[parts.length - 1]
        } else if (width > maxLineWidth) {
          if (current.trim().length > 0) lines.push(current.trimEnd())
          current = token.trimStart()
        } else {
          current = test
        }
      }
      if (current.length) lines.push(current.trimEnd())

      let page = pdf.addPage([pageWidth, pageHeight])
      let y = pageHeight - pageMargin
      for (const line of lines) {
        if (y - lineHeight < pageMargin) {
          page = pdf.addPage([pageWidth, pageHeight])
          y = pageHeight - pageMargin
        }
        page.drawText(line, { x: pageMargin, y: y - lineHeight, size: fontSize, font, color: rgb(0,0,0) })
        y -= lineHeight
      }

      const bytes = await pdf.save({ useObjectStreams: false })
      results.push({
        file: new Blob([bytes], { type: 'application/pdf' }),
        name: file.name.replace(/\.[^.]+$/, '') + '.pdf',
        type: 'pdf'
      })
    }

    if (results.length === 1) return results[0]
    return { type: 'multiple', files: results, name: 'html_to_pdf.zip' }
  }

  return (
    <FileProcessor
      title="HTML to PDF"
      description="Convert HTML files to PDF (basic text extraction)."
      acceptedFileTypes=".html,.htm"
      maxFiles={10}
      onProcess={handleHtmlToPdf}
      processButtonText="Convert to PDF"
      showPreview={true}
      multipleFiles={true}
    />
  )
}



