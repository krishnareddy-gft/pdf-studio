import React, { useState } from 'react'
import FileProcessor from '../components/FileProcessor.jsx'
import { PDFDocument } from 'pdf-lib'
import * as pdfjsLib from 'pdfjs-dist/build/pdf'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

export default function OptimizePDF() {
  const [aggressive, setAggressive] = useState(false)

  const rasterizePdf = async (arrayBuffer, dpi = 110, jpegQuality = 0.7) => {
    const src = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    const out = await PDFDocument.create()
    const scale = dpi / 72
    for (let i = 1; i <= src.numPages; i++) {
      const page = await src.getPage(i)
      const viewport = page.getViewport({ scale })
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      canvas.width = Math.max(1, Math.floor(viewport.width))
      canvas.height = Math.max(1, Math.floor(viewport.height))
      await page.render({ canvasContext: ctx, viewport }).promise
      const dataUrl = canvas.toDataURL('image/jpeg', jpegQuality)
      const res = await fetch(dataUrl)
      const buf = await res.arrayBuffer()
      const jpg = await out.embedJpg(new Uint8Array(buf))
      const p = out.addPage([jpg.width, jpg.height])
      p.drawImage(jpg, { x: 0, y: 0, width: jpg.width, height: jpg.height })
    }
    return await out.save({ useObjectStreams: false })
  }

  const handleOptimize = async (files) => {
    const results = []
    for (const f of files) {
      const file = f.file
      const buf = await file.arrayBuffer()
      let bytes
      try {
        const doc = await PDFDocument.load(buf, { ignoreEncryption: true })
        bytes = await doc.save({ useObjectStreams: false })
      } catch (_) {
        bytes = new Uint8Array(buf)
      }
      if (aggressive) {
        try {
          const alt = await rasterizePdf(bytes, 110, 0.7)
          if (alt && alt.length < bytes.length) bytes = alt
        } catch (_) {}
      }
      results.push({ file: new Blob([bytes], { type: 'application/pdf' }), name: 'optimized_' + file.name, type: 'pdf' })
    }
    if (results.length === 1) return results[0]
    return { type: 'multiple', files: results, name: 'optimized_pdfs.zip' }
  }

  return (
    <FileProcessor
      title="Optimize PDF"
      description="Quickly optimize PDFs; optionally use an aggressive image-based pass."
      acceptedFileTypes=".pdf"
      maxFiles={20}
      onProcess={handleOptimize}
      processButtonText="Optimize"
      showPreview={true}
      multipleFiles={true}
      extraControls={() => (
        <label className="text-sm text-gray-700 flex items-center justify-center gap-2">
          <input type="checkbox" checked={aggressive} onChange={e=>setAggressive(e.target.checked)} /> Aggressive
        </label>
      )}
    />
  )
}



