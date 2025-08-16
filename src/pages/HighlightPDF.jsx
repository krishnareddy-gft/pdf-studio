import React, { useEffect, useRef, useState } from 'react'
import FileProcessor from '../components/FileProcessor.jsx'
import { PDFDocument, rgb } from 'pdf-lib'
import * as pdfjsLib from 'pdfjs-dist/build/pdf'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

export default function HighlightPDF() {
  const [pageIndex, setPageIndex] = useState(0)
  const [numPages, setNumPages] = useState(0)
  const [scale, setScale] = useState(1)
  const [pageSizePt, setPageSizePt] = useState({ w: 0, h: 0 })
  const [color, setColor] = useState('#fff176') // soft yellow
  const [opacity, setOpacity] = useState(0.35)
  const [highlightsByPage, setHighlightsByPage] = useState({}) // { [pageIndex]: [{x,y,w,h,color,opacity}] }
  const [isRendering, setIsRendering] = useState(false)
  const wrapRef = useRef(null)
  const canvasRef = useRef(null)
  const drag = useRef(null) // {startX,startY,x,y,w,h}
  const currentRenderTask = useRef(null) // Track current render task

  const renderPage = async (fileObj) => {
    if (!fileObj || !wrapRef.current || !canvasRef.current) {
      console.log('Missing refs:', { fileObj: !!fileObj, wrapRef: !!wrapRef.current, canvasRef: !!canvasRef.current })
      return
    }
    
    // Cancel any ongoing render task
    if (currentRenderTask.current) {
      console.log('Cancelling previous render task')
      currentRenderTask.current.cancel()
      currentRenderTask.current = null
    }
    
    setIsRendering(true)
    try {
      console.log('Starting PDF render for:', fileObj.name)
      const file = fileObj.file
      const ab = await file.arrayBuffer()
      console.log('File loaded, size:', ab.byteLength)
      
      const pdf = await pdfjsLib.getDocument({ data: ab }).promise
      console.log('PDF loaded, pages:', pdf.numPages)
      setNumPages(pdf.numPages)
      
      const page = await pdf.getPage(pageIndex + 1)
      console.log('Page loaded:', pageIndex + 1)
      
      const viewport = page.getViewport({ scale: 1 })
      console.log('Original viewport:', viewport.width, 'x', viewport.height)
      
      const containerW = wrapRef.current.clientWidth || 900
      console.log('Container width:', containerW)
      
      const renderScale = Math.min(containerW / viewport.width, 2.0)
      console.log('Render scale:', renderScale)
      
      const scaled = page.getViewport({ scale: renderScale })
      console.log('Scaled viewport:', scaled.width, 'x', scaled.height)
      
      const canvas = canvasRef.current
      
      // Create a fresh canvas context to avoid any state issues
      const ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: false })
      
      // Set canvas dimensions with proper scaling
      const canvasWidth = Math.max(1, Math.floor(scaled.width))
      const canvasHeight = Math.max(1, Math.floor(scaled.height))
      
      console.log('Setting canvas dimensions:', canvasWidth, 'x', canvasHeight)
      canvas.width = canvasWidth
      canvas.height = canvasHeight
      
      // Set canvas CSS dimensions for proper display
      canvas.style.width = `${scaled.width}px`
      canvas.style.height = `${scaled.height}px`
      
      setScale(renderScale)
      setPageSizePt({ w: viewport.width, h: viewport.height })
      
      // Clear canvas and set white background
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      console.log('Starting page render...')
      
      // Try rendering to an offscreen canvas first, then copy to display canvas
      try {
        const offscreenCanvas = document.createElement('canvas')
        const offscreenCtx = offscreenCanvas.getContext('2d', { alpha: false })
        offscreenCanvas.width = canvasWidth
        offscreenCanvas.height = canvasHeight
        
        // Set white background on offscreen canvas
        offscreenCtx.fillStyle = '#ffffff'
        offscreenCtx.fillRect(0, 0, canvasWidth, canvasHeight)
        
        console.log('Rendering to offscreen canvas...')
        const renderTask = page.render({ 
          canvasContext: offscreenCtx, 
          viewport: scaled
        })
        
        currentRenderTask.current = renderTask
        await renderTask.promise
        
        // Copy from offscreen to display canvas
        ctx.drawImage(offscreenCanvas, 0, 0)
        console.log('Offscreen render successful, copied to display canvas')
        
      } catch (offscreenError) {
        console.log('Offscreen render failed, trying direct render:', offscreenError)
        
        // Fallback to direct render
        const renderTask = page.render({ 
          canvasContext: ctx, 
          viewport: scaled
        })
        
        currentRenderTask.current = renderTask
        await renderTask.promise
      }
      
      console.log('Page render completed successfully')
      currentRenderTask.current = null
      
    } catch (err) {
      console.error('PDF render failed:', err)
      console.error('Error details:', {
        name: err.name,
        message: err.message,
        stack: err.stack
      })
      currentRenderTask.current = null
      
      // Show error state on canvas
      if (canvasRef.current) {
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        const width = canvas.width || 400
        const height = canvas.height || 300
        
        ctx.clearRect(0, 0, width, height)
        ctx.fillStyle = '#f3f4f6'
        ctx.fillRect(0, 0, width, height)
        ctx.fillStyle = '#6b7280'
        ctx.font = '16px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('Failed to render PDF', width / 2, height / 2 - 10)
        ctx.fillText(err.message || 'Unknown error', width / 2, height / 2 + 20)
        ctx.fillText('Check console for details', width / 2, height / 2 + 40)
      }
    } finally {
      setIsRendering(false)
    }
  }

  // Cleanup render task on unmount
  useEffect(() => {
    return () => {
      if (currentRenderTask.current) {
        currentRenderTask.current.cancel()
      }
    }
  }, [])

  const Toolbar = ({ files }) => (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-700">Color:</span>
        {['#fff176','#a5f3fc','#bbf7d0','#fbcfe8','#fde68a'].map(c => (
          <button key={c} onClick={()=>setColor(c)} className="w-6 h-6 rounded border" style={{ backgroundColor: c, outline: color===c? '2px solid #2563eb':'none' }} />
        ))}
        <span className="ml-4 text-xs text-gray-700">Opacity:</span>
        <input type="range" min={0.15} max={0.8} step={0.05} value={opacity} onChange={e=>setOpacity(parseFloat(e.target.value))} />
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => {
          setHighlightsByPage(prev => ({ ...prev, [pageIndex]: (prev[pageIndex]||[]).slice(0, -1) }))
        }} className="px-3 py-1 rounded border text-xs">Undo</button>
        <button onClick={() => {
          setHighlightsByPage(prev => ({ ...prev, [pageIndex]: [] }))
        }} className="px-3 py-1 rounded border text-xs">Clear Page</button>
        <div className="ml-4 flex items-center gap-2">
          <button disabled={pageIndex<=0} onClick={()=>setPageIndex(i=>Math.max(0,i-1))} className="px-2 py-1 rounded border text-xs disabled:opacity-50">Prev</button>
          <span className="text-xs text-gray-600">Page {pageIndex+1} / {Math.max(1,numPages)}</span>
          <button disabled={pageIndex>=numPages-1} onClick={()=>setPageIndex(i=>Math.min(numPages-1, i+1))} className="px-2 py-1 rounded border text-xs disabled:opacity-50">Next</button>
        </div>
      </div>
    </div>
  )

  const Viewer = ({ files }) => {
    const fileObj = files && files[0]

    useEffect(() => {
      if (fileObj) {
        renderPage(fileObj)
      }
    }, [fileObj, pageIndex])

    // Handle container resize
    useEffect(() => {
      if (!wrapRef.current) return
      
      const handleResize = () => {
        if (fileObj) {
          renderPage(fileObj)
        }
      }
      
      const resizeObserver = new ResizeObserver(handleResize)
      resizeObserver.observe(wrapRef.current)
      
      return () => resizeObserver.disconnect()
    }, [fileObj])

    const begin = (e) => {
      if (!canvasRef.current) return
      e.preventDefault()
      const rect = canvasRef.current.getBoundingClientRect()
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left
      const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top
      drag.current = { startX: x, startY: y, x, y, w: 0, h: 0 }
    }
    
    const move = (e) => {
      if (!drag.current || !canvasRef.current) return
      e.preventDefault()
      const rect = canvasRef.current.getBoundingClientRect()
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left
      const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top
      const w = x - drag.current.startX
      const h = y - drag.current.startY
      drag.current = { ...drag.current, x: Math.min(x, drag.current.startX), y: Math.min(y, drag.current.startY), w: Math.abs(w), h: Math.abs(h) }
      
      // Remove existing temp highlight
      wrapRef.current?.querySelector('#hl-temp')?.remove()
      
      // Create new temp highlight
      const box = document.createElement('div')
      box.id = 'hl-temp'
      box.style.position = 'absolute'
      box.style.left = `${drag.current.x}px`
      box.style.top = `${drag.current.y}px`
      box.style.width = `${drag.current.w}px`
      box.style.height = `${drag.current.h}px`
      box.style.background = color
      box.style.opacity = String(opacity)
      box.style.pointerEvents = 'none'
      box.style.borderRadius = '2px'
      box.style.zIndex = '10'
      wrapRef.current?.appendChild(box)
    }
    
    const end = () => {
      if (!drag.current) return
      wrapRef.current?.querySelector('#hl-temp')?.remove()
      if (drag.current.w > 5 && drag.current.h > 5) {
        setHighlightsByPage(prev => ({
          ...prev,
          [pageIndex]: [ ...(prev[pageIndex]||[]), { x: drag.current.x, y: drag.current.y, w: drag.current.w, h: drag.current.h, color, opacity } ]
        }))
      }
      drag.current = null
    }

    const overlays = (highlightsByPage[pageIndex] || []).map((hl, idx) => (
      <div 
        key={idx} 
        className="absolute rounded pointer-events-none" 
        style={{ 
          left: hl.x, 
          top: hl.y, 
          width: hl.w, 
          height: hl.h, 
          background: hl.color, 
          opacity: hl.opacity,
          zIndex: 5
        }} 
      />
    ))

    return (
      <div>
        <Toolbar files={files} />
        <div 
          ref={wrapRef} 
          className="relative border rounded overflow-hidden bg-gray-50" 
          style={{ height: '75vh' }}
          onMouseDown={begin} 
          onMouseMove={move} 
          onMouseUp={end} 
          onMouseLeave={end}
          onTouchStart={begin} 
          onTouchMove={move} 
          onTouchEnd={end}
        >
          {isRendering && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 z-20">
              <div className="text-gray-600">Rendering...</div>
            </div>
          )}
          <canvas 
            ref={canvasRef} 
            className="block mx-auto cursor-crosshair" 
            style={{ 
              maxWidth: '100%', 
              height: 'auto',
              display: 'block',
              margin: '0 auto'
            }}
          />
          {overlays}
        </div>
      </div>
    )
  }

  const handleApplyHighlights = async (files) => {
    const fileObj = files[0]
    if (!fileObj) throw new Error('Upload one PDF')
    const file = fileObj.file
    const ab = await file.arrayBuffer()
    const doc = await PDFDocument.load(ab, { ignoreEncryption: true })

    const rgbFromHex = (hex) => {
      const h = hex.replace('#','')
      const r = parseInt(h.substring(0,2),16)/255
      const g = parseInt(h.substring(2,4),16)/255
      const b = parseInt(h.substring(4,6),16)/255
      return rgb(r,g,b)
    }

    const hlColor = (c) => rgbFromHex(c)

    for (let i = 0; i < doc.getPageCount(); i++) {
      const page = doc.getPage(i)
      const items = highlightsByPage[i] || []
      if (!items.length) continue
      const pageHeightPt = pageSizePt.h || page.getSize().height
      for (const it of items) {
        const xPt = it.x / scale
        const yPt = pageHeightPt - (it.y + it.h) / scale
        const wPt = it.w / scale
        const hPt = it.h / scale
        page.drawRectangle({ x: xPt, y: yPt, width: wPt, height: hPt, color: hlColor(it.color), opacity: it.opacity })
      }
    }

    const bytes = await doc.save({ useObjectStreams: false })
    return { file: new Blob([bytes], { type: 'application/pdf' }), name: 'highlighted_' + file.name, type: 'pdf' }
  }

  return (
    <FileProcessor
      title="Highlight Text"
      description="Draw highlight boxes directly on the PDF preview. Use the toolbar above the preview."
      acceptedFileTypes=".pdf"
      maxFiles={1}
      onProcess={handleApplyHighlights}
      processButtonText="Apply Highlights"
      showPreview={true}
      multipleFiles={false}
      extraControls={({ files }) => (
        files && files.length ? <Viewer files={files} /> : <div className="text-center text-xs text-gray-600">Upload a PDF to start highlighting.</div>
      )}
    />
  )
}


