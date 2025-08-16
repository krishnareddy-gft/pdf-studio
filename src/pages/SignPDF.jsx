
import React, { useRef, useState, useEffect } from 'react'
import FileProcessor from '../components/FileProcessor.jsx'
import { PDFDocument } from 'pdf-lib'
import * as pdfjsLib from 'pdfjs-dist/build/pdf'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

export default function SignPDF() {
  const [signatureDataUrl, setSignatureDataUrl] = useState(null)
  const [isPadOpen, setIsPadOpen] = useState(false)
  const [placements, setPlacements] = useState([])
  const [map, setMap] = useState({ scale: 1, wPt: 0, hPt: 0 })

  const SignPad = ({ onSave, onClose }) => {
    const canvasRef = useRef(null)
    const [drawing, setDrawing] = useState(false)
    useEffect(() => {
      const cvs = canvasRef.current
      const ctx = cvs.getContext('2d')
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0,0,cvs.width,cvs.height)
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
      ctx.strokeStyle = '#111827'
    }, [])
    const getPos = (e) => {
      const rect = canvasRef.current.getBoundingClientRect()
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left
      const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top
      return { x, y }
    }
    const start = (e) => { setDrawing(true); const {x,y}=getPos(e); const ctx=canvasRef.current.getContext('2d'); ctx.beginPath(); ctx.moveTo(x,y) }
    const move = (e) => { if(!drawing) return; const {x,y}=getPos(e); const ctx=canvasRef.current.getContext('2d'); ctx.lineTo(x,y); ctx.stroke() }
    const end = () => setDrawing(false)
    const clear = () => { const ctx=canvasRef.current.getContext('2d'); ctx.fillStyle='#ffffff'; ctx.fillRect(0,0,canvasRef.current.width,canvasRef.current.height); ctx.fillStyle='#111827' }
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-4 space-y-3">
          <h3 className="text-lg font-semibold">Create Signature</h3>
          <canvas
            ref={canvasRef}
            width={600}
            height={200}
            className="w-full border border-gray-200 rounded"
            onMouseDown={start}
            onMouseMove={move}
            onMouseUp={end}
            onMouseLeave={end}
            onTouchStart={start}
            onTouchMove={move}
            onTouchEnd={end}
          />
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button onClick={clear} className="px-3 py-1 text-sm rounded border">Clear</button>
              <button onClick={() => onSave(canvasRef.current.toDataURL('image/png'))} className="px-3 py-1 text-sm rounded bg-blue-600 text-white">Save</button>
            </div>
            <button onClick={onClose} className="text-sm text-gray-600">Close</button>
          </div>
        </div>
      </div>
    )
  }

  // Interactive placement component
  const Placement = ({ files, signature, placements, setPlacements, onMap }) => {
    const wrapRef = useRef(null)
    const canvasRef = useRef(null)
    const [scale, setScale] = useState(1)
    const [pageSize, setPageSize] = useState({ wPt: 0, hPt: 0 })
    const [active, setActive] = useState(null)
    const dragging = useRef(null) // {idx, type:'move'|'resize', startX,startY, orig}

    useEffect(() => {
      const load = async () => {
        if (!files || files.length === 0) return
        const file = files[0].file
        const ab = await file.arrayBuffer()
        const pdf = await pdfjsLib.getDocument({ data: ab }).promise
        const page = await pdf.getPage(1)
        const containerW = wrapRef.current?.clientWidth || 800
        const viewport = page.getViewport({ scale: 1 })
        const renderScale = Math.min(containerW / viewport.width, 1.8)
        const scaled = page.getViewport({ scale: renderScale })
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        canvas.width = scaled.width
        canvas.height = scaled.height
        setScale(renderScale)
        setPageSize({ wPt: viewport.width, hPt: viewport.height })
        onMap && onMap({ scale: renderScale, wPt: viewport.width, hPt: viewport.height })
        await page.render({ canvasContext: ctx, viewport: scaled }).promise
      }
      load()
    }, [files])

    const addPlacement = () => {
      if (!signature) return
      setPlacements(prev => [...prev, { x: 40, y: 40, w: 160, h: 60 }])
    }
    const clearPlacement = () => setPlacements([])

    const onMouseDown = (e, idx, type='move') => {
      const rect = wrapRef.current.getBoundingClientRect()
      dragging.current = { idx, type, startX: e.clientX - rect.left, startY: e.clientY - rect.top, orig: { ...placements[idx] } }
      setActive(idx)
    }
    const onMouseMove = (e) => {
      if (!dragging.current) return
      const rect = wrapRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const dx = x - dragging.current.startX
      const dy = y - dragging.current.startY
      setPlacements(prev => prev.map((p, i) => {
        if (i !== dragging.current.idx) return p
        if (dragging.current.type === 'move') {
          return { ...p, x: Math.max(0, Math.min((canvasRef.current.width - p.w), dragging.current.orig.x + dx)), y: Math.max(0, Math.min((canvasRef.current.height - p.h), dragging.current.orig.y + dy)) }
        }
        // resize from bottom-right corner
        return { ...p, w: Math.max(30, dragging.current.orig.w + dx), h: Math.max(20, dragging.current.orig.h + dy) }
      }))
    }
    const onMouseUp = () => { dragging.current = null }

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 justify-center">
          <button onClick={addPlacement} className="px-3 py-1 rounded bg-blue-600 text-white text-sm">Add Signature</button>
          <button onClick={clearPlacement} className="px-3 py-1 rounded border text-sm">Clear All</button>
        </div>
        <div ref={wrapRef} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp} className="relative border rounded overflow-auto max-h-[70vh]">
          <canvas ref={canvasRef} className="block mx-auto" />
          {signature && placements.map((p, idx) => (
            <div key={idx} className={`absolute border ${active===idx?'border-blue-500':'border-transparent'}`} style={{ left:p.x, top:p.y, width:p.w, height:p.h }} onMouseDown={(e)=>onMouseDown(e, idx, 'move')}>
              <img src={signature} alt="sig" className="w-full h-full object-contain select-none pointer-events-none" />
              <div onMouseDown={(e)=>{e.stopPropagation(); onMouseDown(e, idx, 'resize')}} className="absolute right-0 bottom-0 w-3 h-3 bg-blue-600 rounded-sm cursor-se-resize"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const handleSignPDF = async (files) => {
    if (!signatureDataUrl) throw new Error('Please create a signature first')
    const [fileObj] = files
    const file = fileObj.file
    const ab = await file.arrayBuffer()
    const pdf = await PDFDocument.load(ab)
    const page = pdf.getPage(0)
    const pngBytes = await (await fetch(signatureDataUrl)).arrayBuffer()
    const png = await pdf.embedPng(pngBytes)

    // Map placements (px) -> PDF pts using scale/page size captured by Placement via custom event
    // For simplicity, read last stored mapping from window (set during Placement render)
    const mapping = map && map.wPt ? map : { scale: 1, wPt: page.getSize().width, hPt: page.getSize().height }
    const s = mapping.scale
    const pageHeightPt = mapping.hPt
    const places = placements || []
    places.forEach(p => {
      const wPt = p.w / s
      const hPt = p.h / s
      const xPt = p.x / s
      const yPt = pageHeightPt - (p.y + p.h) / s
      page.drawImage(png, { x: xPt, y: yPt, width: wPt, height: hPt })
    })

    const bytes = await pdf.save({ useObjectStreams: false })
    const blob = new Blob([bytes], { type: 'application/pdf' })
    return { file: blob, name: `signed_${file.name}`, type: 'pdf' }
  }

  return (
    <div className="space-y-3">
      {isPadOpen && (
        <SignPad onSave={(data) => { setSignatureDataUrl(data); setIsPadOpen(false) }} onClose={() => setIsPadOpen(false)} />
      )}
      <div className="flex items-center gap-2">
        <button onClick={() => setIsPadOpen(true)} className="px-3 py-1 rounded bg-blue-600 text-white text-sm">Create Signature</button>
        {signatureDataUrl && (
          <>
            <img src={signatureDataUrl} alt="signature" className="h-8 border rounded" />
            <button onClick={() => setSignatureDataUrl(null)} className="px-3 py-1 rounded border text-sm">Clear</button>
          </>
        )}
      </div>
      <FileProcessor
        title="eSign PDF"
        description="Upload a PDF, create a signature, then place, move, and resize it directly on the page."
        acceptedFileTypes=".pdf"
        maxFiles={1}
        onProcess={handleSignPDF}
        processButtonText="Sign & Apply"
        showPreview={true}
        multipleFiles={false}
        extraControls={({ files }) => (
          <div className="space-y-2">
            {signatureDataUrl ? (
              <Placement files={files} signature={signatureDataUrl} placements={placements} setPlacements={setPlacements} onMap={setMap} />
            ) : (
              <div className="text-center text-xs text-gray-600">Create a signature first.</div>
            )}
          </div>
        )}
      />
    </div>
  )
}
