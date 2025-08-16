import React, { useEffect, useRef, useState } from 'react'
import { PDFDocument } from 'pdf-lib'
import * as pdfjsLib from 'pdfjs-dist/build/pdf'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { Upload, CheckSquare, Square, Download, X } from 'lucide-react'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

export default function ExtractPages() {
  const [file, setFile] = useState(null)
  const [numPages, setNumPages] = useState(0)
  const [thumbs, setThumbs] = useState([])
  const [selected, setSelected] = useState(new Set())
  const [busy, setBusy] = useState(false)
  const inputRef = useRef(null)

  const onChoose = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.type !== 'application/pdf') {
      alert('Please select a PDF file')
      return
    }
    setFile(f)
    setSelected(new Set())
    setThumbs([])
    setNumPages(0)
  }

  useEffect(() => {
    const render = async () => {
      if (!file) return
      const ab = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: ab }).promise
      setNumPages(pdf.numPages)
      const list = []
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const viewport = page.getViewport({ scale: 1 })
        const scale = 160 / viewport.width
        const vp = page.getViewport({ scale })
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        canvas.width = vp.width
        canvas.height = vp.height
        await page.render({ canvasContext: ctx, viewport: vp }).promise
        list.push(canvas.toDataURL('image/jpeg', 0.85))
      }
      setThumbs(list)
    }
    render().catch(console.error)
  }, [file])

  const toggle = (i) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  const selectAll = () => {
    const s = new Set()
    for (let i = 1; i <= numPages; i++) s.add(i)
    setSelected(s)
  }

  const clear = () => setSelected(new Set())

  const handleExtract = async () => {
    if (!file || selected.size === 0) return
    setBusy(true)
    try {
      const ab = await file.arrayBuffer()
      const src = await PDFDocument.load(ab, { ignoreEncryption: true })
      const out = await PDFDocument.create()
      const indices = Array.from(selected).sort((a,b)=>a-b).map(p => p-1)
      const pages = await out.copyPages(src, indices)
      pages.forEach(p => out.addPage(p))
      const bytes = await out.save({ useObjectStreams: false })
      const blob = new Blob([bytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'extracted_pages.pdf'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error(e)
      alert('Failed to extract pages')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold text-gray-900">Extract Pages</h1>
        <p className="text-gray-600">Select pages to export into a new PDF.</p>
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
              <button onClick={selectAll} className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200">Select all</button>
              <button onClick={clear} className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200">Clear</button>
              <button onClick={()=>{setFile(null); setThumbs([]); setSelected(new Set());}} className="px-3 py-1 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100 flex items-center gap-1"><X className="w-4 h-4"/>Remove</button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {thumbs.map((src, idx)=>{
              const page = idx+1
              const isSel = selected.has(page)
              return (
                <button key={idx} onClick={()=>toggle(page)} className={`relative bg-gray-50 rounded-lg p-3 border transition ${isSel ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'}`}>
                  <img src={src} alt={`Page ${page}`} className="w-full h-auto rounded" />
                  <div className="absolute top-2 left-2 text-xs px-2 py-0.5 bg-black/70 text-white rounded">Page {page}</div>
                  <div className="absolute top-2 right-2 bg-white/90 rounded p-1">{isSel ? <CheckSquare className="w-4 h-4 text-blue-600"/> : <Square className="w-4 h-4 text-gray-500"/>}</div>
                </button>
              )
            })}
          </div>

          <div className="text-center mt-6">
            <button onClick={handleExtract} disabled={busy || selected.size===0} className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50">
              {busy ? 'Extracting…' : (<><Download className="w-4 h-4"/> Export selected pages</>)}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}


