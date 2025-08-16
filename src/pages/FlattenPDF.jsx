import React from 'react'
import FileProcessor from '../components/FileProcessor.jsx'
import { PDFDocument } from 'pdf-lib'

// Simple flatten: render pages to images and re-embed, removing form fields/annotations
export default function FlattenPDF() {
  const handleFlatten = async (files) => {
    const results = []
    for (const f of files) {
      const file = f.file
      const buf = await file.arrayBuffer()
      // use image rasterization flatten from Compress page with moderate settings
      const { default: pdfjsLib } = await import('pdfjs-dist/build/pdf')
      const worker = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default
      pdfjsLib.GlobalWorkerOptions.workerSrc = worker

      const src = await pdfjsLib.getDocument({ data: buf }).promise
      const out = await PDFDocument.create()
      for (let i = 1; i <= src.numPages; i++) {
        const page = await src.getPage(i)
        const viewport = page.getViewport({ scale: 1.5 })
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        canvas.width = Math.max(1, Math.floor(viewport.width))
        canvas.height = Math.max(1, Math.floor(viewport.height))
        await page.render({ canvasContext: ctx, viewport }).promise
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
        const res = await fetch(dataUrl)
        const ab = await res.arrayBuffer()
        const jpg = await out.embedJpg(new Uint8Array(ab))
        const p = out.addPage([jpg.width, jpg.height])
        p.drawImage(jpg, { x: 0, y: 0, width: jpg.width, height: jpg.height })
      }
      const bytes = await out.save({ useObjectStreams: false })
      results.push({ file: new Blob([bytes], { type: 'application/pdf' }), name: 'flattened_' + file.name, type: 'pdf' })
    }
    if (results.length === 1) return results[0]
    return { type: 'multiple', files: results, name: 'flattened_pdfs.zip' }
  }

  return (
    <FileProcessor
      title="Flatten PDF"
      description="Flatten annotations and form fields by rasterizing each page."
      acceptedFileTypes=".pdf"
      maxFiles={10}
      onProcess={handleFlatten}
      processButtonText="Flatten"
      showPreview={true}
      multipleFiles={true}
    />
  )
}



