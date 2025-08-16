
import React, { useState } from 'react'
import FileProcessor from '../components/FileProcessor.jsx'
import { PDFDocument } from 'pdf-lib'
import * as pdfjsLib from 'pdfjs-dist/build/pdf'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

export default function CompressPDF({ navigate }) {
  const [report, setReport] = useState(null)
  const [level, setLevel] = useState('medium') // low | medium | high

  const getSaveOptions = (lvl) => {
    switch (lvl) {
      case 'low':
        return { useObjectStreams: true, addDefaultPage: false, objectsPerTick: 10 }
      case 'high':
        return { useObjectStreams: false, addDefaultPage: false, objectsPerTick: 80 }
      case 'medium':
      default:
        return { useObjectStreams: false, addDefaultPage: false, objectsPerTick: 30 }
    }
  }

  const compressBestForLevel = async (pdfDoc, originalSize, chosen) => {
    const order = chosen === 'high' ? ['high', 'medium', 'low'] : chosen === 'medium' ? ['medium', 'low'] : ['low']
    let bestBytes = null
    for (const lvl of order) {
      try {
        const bytes = await pdfDoc.save(getSaveOptions(lvl))
        if (!bestBytes || bytes.length < bestBytes.length) bestBytes = bytes
      } catch (_) {
        // ignore and try next
      }
    }
    // Fallback to original if compression failed or larger
    if (!bestBytes || bestBytes.length >= originalSize) return null
    return bestBytes
  }

  const rasterizePdf = async (arrayBuffer, dpi = 110, jpegQuality = 0.7) => {
    // Render each page to canvas (pdf.js), embed as JPEG image into new PDF (pdf-lib)
    const src = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    const out = await PDFDocument.create()
    const scaleFromDpi = dpi / 72
    for (let i = 1; i <= src.numPages; i++) {
      const page = await src.getPage(i)
      const viewport = page.getViewport({ scale: scaleFromDpi })
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

  const handleCompressPDF = async (files) => {
    try {
      const results = []
      const reportRows = []
      
      // Process each PDF file
      for (const fileObj of files) {
        const file = fileObj.file
        
        // Load the PDF
        const arrayBuffer = await file.arrayBuffer()
        const pdfDoc = await PDFDocument.load(arrayBuffer)
        
        // Try structural compression
        let compressedBytes = await compressBestForLevel(pdfDoc, file.size, level)
        
        // If ineffective (<1% reduction), try rasterization (lossy) depending on level
        if (!compressedBytes || (file.size - compressedBytes.length) / file.size < 0.01) {
          let dpi = 110, quality = 0.7
          if (level === 'low') { dpi = 150; quality = 0.85 }
          if (level === 'high') { dpi = 96; quality = 0.6 }
          try {
            const rasterBytes = await rasterizePdf(arrayBuffer, dpi, quality)
            if (!compressedBytes || rasterBytes.length < compressedBytes.length) compressedBytes = rasterBytes
          } catch (_) {}
        }

        // Final fallback to original
        if (!compressedBytes) compressedBytes = new Uint8Array(arrayBuffer)
        
        // Create a blob from the compressed PDF
        const blob = new Blob([compressedBytes], { type: 'application/pdf' })
        reportRows.push({ name: file.name, original: file.size, compressed: blob.size })
        
        results.push({
          file: blob,
          name: `compressed_${file.name}`,
          type: 'pdf'
        })
      }
      
      setReport(reportRows)

      // Return single file or multiple files
      if (results.length === 1) {
        return { ...results[0], meta: { report: reportRows[0] } }
      } else {
        return {
          type: 'multiple',
          files: results,
          name: 'compressed_pdfs.zip',
          meta: { report: reportRows }
        }
      }
    } catch (error) {
      throw new Error('Failed to compress PDF: ' + error.message)
    }
  }

  return (
    <div className="space-y-4">
      <FileProcessor
        title="Compress PDF Files"
        description={report && report.length ?
          report.map(r => {
            const saved = r.original - r.compressed
            const pct = r.original ? Math.max(0, Math.round((saved / r.original) * 100)) : 0
            const fmt = (b) => (b/1024/1024).toFixed(2) + ' MB'
            return `${r.name}: ${fmt(r.original)} → ${fmt(r.compressed)} (−${pct}%)`
          }).join('\n')
          : "Reduce file size while maintaining quality. Pick Low/Medium/High below, then click Compress."
        }
        acceptedFileTypes=".pdf"
        maxFiles={10}
        onProcess={handleCompressPDF}
        processButtonText="Compress PDFs"
        showPreview={true}
        multipleFiles={true}
        extraControls={() => (
          <div className="flex items-center gap-3 justify-center">
            <span className="text-sm text-gray-700">Compression:</span>
            {['low','medium','high'].map(lvl => (
              <button
                key={lvl}
                onClick={() => setLevel(lvl)}
                className={`px-3 py-1 rounded border text-sm ${level===lvl ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
              >
                {lvl.charAt(0).toUpperCase()+lvl.slice(1)}
              </button>
            ))}
          </div>
        )}
      />
    </div>
  )
}
