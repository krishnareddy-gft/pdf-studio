import React, { useEffect, useRef, useState } from 'react'
import { PDFDocument } from 'pdf-lib'
import * as pdfjsLib from 'pdfjs-dist/build/pdf'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import JSZip from 'jszip'
import { Scissors, Upload, Download, X } from 'lucide-react'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

export default function SplitPDF() {
  const [file, setFile] = useState(null)
  const [numPages, setNumPages] = useState(0)
  const [pageThumbs, setPageThumbs] = useState([])
  const [splitAfter, setSplitAfter] = useState(new Set())
  const [busy, setBusy] = useState(false)
  const [partsPreview, setPartsPreview] = useState([])
  const inputRef = useRef(null)

  const onChoose = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.type !== 'application/pdf') {
      alert('Please select a PDF file')
      return
    }
    reset()
    setFile(f)
  }

  const reset = () => {
    setNumPages(0)
    setPageThumbs([])
    setSplitAfter(new Set())
    setPartsPreview([])
  }

  useEffect(() => {
    const renderThumbs = async () => {
      if (!file) return
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      setNumPages(pdf.numPages)
      const thumbs = []
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const viewport = page.getViewport({ scale: 1 })
        const maxW = 160
        const scale = maxW / viewport.width
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const vp = page.getViewport({ scale })
        canvas.width = vp.width
        canvas.height = vp.height
        await page.render({ canvasContext: ctx, viewport: vp }).promise
        thumbs.push(canvas.toDataURL('image/jpeg', 0.85))
      }
      setPageThumbs(thumbs)
    }
    renderThumbs().catch(console.error)
  }, [file])

  const toggleSplitAfter = (pageIndex) => {
    setSplitAfter(prev => {
      const next = new Set(prev)
      if (next.has(pageIndex)) next.delete(pageIndex)
      else next.add(pageIndex)
      return next
    })
  }

  const buildRanges = () => {
    // splitAfter stores indices (after page i). Build page ranges [start, end]
    const cuts = Array.from(splitAfter).sort((a,b)=>a-b)
    const ranges = []
    let start = 1
    for (const cut of cuts) {
      ranges.push([start, cut])
      start = cut + 1
    }
    ranges.push([start, numPages])
    return ranges
  }

  const generatePartThumb = async (bytes) => {
    const pdf = await pdfjsLib.getDocument({ data: bytes }).promise
    const page = await pdf.getPage(1)
    const viewport = page.getViewport({ scale: 1 })
    const scale = 180 / viewport.width
    const vp = page.getViewport({ scale })
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    canvas.width = vp.width
    canvas.height = vp.height
    await page.render({ canvasContext: ctx, viewport: vp }).promise
    return canvas.toDataURL('image/jpeg', 0.85)
  }

  const handleSplit = async () => {
    if (!file || numPages === 0) return
    setBusy(true)
    try {
      const ab = await file.arrayBuffer()
      const src = await PDFDocument.load(ab, { ignoreEncryption: true })
      const zip = new JSZip()
      const ranges = buildRanges()
      const previews = []

      for (let i = 0; i < ranges.length; i++) {
        const [start, end] = ranges[i]
        const out = await PDFDocument.create()
        const pages = await out.copyPages(src, Array.from({length: end-start+1}, (_,k)=>k+start-1))
        pages.forEach(p => out.addPage(p))
        const bytes = await out.save({ useObjectStreams: false })
        // Add as Blob to avoid zero-byte files across browsers/file systems
        const partBlob = new Blob([bytes], { type: 'application/pdf' })
        zip.file(`split_part_${i+1}.pdf`, partBlob)
        previews.push(await generatePartThumb(bytes))
      }

      const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'split_parts.zip'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setPartsPreview(previews)
    } catch (e) {
      console.error(e)
      alert('Failed to split PDF')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold text-gray-900">Split PDF</h1>
        <p className="text-gray-600">Place split points with the scissors. Each segment becomes a separate PDF.</p>
      </div>

      {!file && (
        <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-10 text-center">
          <Upload className="w-14 h-14 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-700 font-medium mb-2">Upload a PDF to begin</p>
          <button onClick={()=>inputRef.current?.click()} className="bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-700">Choose File</button>
          <input ref={inputRef} type="file" accept="application/pdf" className="hidden" onChange={onChoose} />
        </div>
      )}

      {file && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-gray-600">{file.name} • {numPages} pages</div>
            <div className="flex items-center gap-2">
              <button onClick={()=>setSplitAfter(new Set())} className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200">Clear splits</button>
              <button onClick={()=>{ const s=new Set(); for(let i=1;i<numPages;i++) s.add(i); setSplitAfter(s) }} className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200">Split every page</button>
              <button onClick={reset} className="px-3 py-1 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100 flex items-center gap-1"><X className="w-4 h-4"/>Remove</button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {pageThumbs.map((src, idx)=> (
              <div key={idx} className="relative bg-gray-50 rounded-lg p-3 border border-gray-200">
                <img src={src} alt={`Page ${idx+1}`} className="w-full h-auto rounded" />
                <div className="absolute top-2 left-2 text-xs px-2 py-0.5 bg-black/70 text-white rounded">Page {idx+1}</div>
                {idx < numPages-1 && (
                  <button
                    onClick={()=>toggleSplitAfter(idx+1)}
                    className={`absolute -right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full shadow border flex items-center justify-center ${splitAfter.has(idx+1) ? 'bg-red-500 text-white' : 'bg-white text-gray-700'} hover:scale-105`}
                    title={`Split after page ${idx+1}`}
                  >
                    <Scissors className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-6">
            <button onClick={handleSplit} disabled={busy || numPages===0} className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50">
              {busy ? 'Splitting…' : 'Split PDF'}
            </button>
          </div>
        </div>
      )}

      {partsPreview.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-green-800 font-semibold">Split Complete</p>
            <div className="text-sm text-green-700">Generated {partsPreview.length} files (downloaded as ZIP)</div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {partsPreview.map((src, i)=> (
              <div key={i} className="bg-white rounded-lg p-2 border border-gray-200 text-center">
                <img src={src} alt={`Part ${i+1}`} className="w-full h-32 object-contain" />
                <div className="text-xs text-gray-600 mt-1">part_{i+1}.pdf</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}


