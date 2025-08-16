import React, { useState } from 'react'
import FileProcessor from '../components/FileProcessor.jsx'
import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib'

export default function WatermarkPDF() {
  const [text, setText] = useState('CONFIDENTIAL')
  const [opacity, setOpacity] = useState(0.2)
  const [size, setSize] = useState(48)

  const handleWatermark = async (files) => {
    const results = []
    for (const f of files) {
      const file = f.file
      const buf = await file.arrayBuffer()
      const doc = await PDFDocument.load(buf, { ignoreEncryption: true })
      const font = await doc.embedFont(StandardFonts.HelveticaBold)

      const color = rgb(1, 0, 0)
      for (const page of doc.getPages()) {
        const { width, height } = page.getSize()
        const textWidth = font.widthOfTextAtSize(text, size)
        page.drawText(text, {
          x: (width - textWidth) / 2,
          y: height / 2,
          size,
          font,
          color,
          opacity,
          rotate: degrees(-30)
        })
      }

      const bytes = await doc.save({ useObjectStreams: false })
      results.push({ file: new Blob([bytes], { type: 'application/pdf' }), name: 'watermarked_' + file.name, type: 'pdf' })
    }

    if (results.length === 1) return results[0]
    return { type: 'multiple', files: results, name: 'watermarked_pdfs.zip' }
  }

  return (
    <FileProcessor
      title="Add Watermark"
      description="Add a diagonal text watermark to each page."
      acceptedFileTypes=".pdf"
      maxFiles={20}
      onProcess={handleWatermark}
      processButtonText="Add Watermark"
      showPreview={true}
      multipleFiles={true}
      extraControls={() => (
        <div className="flex flex-wrap items-center justify-center gap-3">
          <input value={text} onChange={e=>setText(e.target.value)} className="border rounded px-2 py-1 text-sm w-64" placeholder="Watermark text" />
          <label className="text-sm text-gray-700">Opacity
            <input type="range" min={0.05} max={0.9} step={0.05} value={opacity} onChange={e=>setOpacity(parseFloat(e.target.value))} className="ml-2 align-middle" />
          </label>
          <label className="text-sm text-gray-700">Size
            <input type="number" min={8} max={144} value={size} onChange={e=>setSize(parseInt(e.target.value||'12',10))} className="ml-2 border rounded px-2 py-1 w-20 text-sm" />
          </label>
        </div>
      )}
    />
  )
}



