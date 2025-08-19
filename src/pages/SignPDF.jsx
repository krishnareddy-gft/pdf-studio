import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Upload, X, Plus, Download, Eye, FileText, Image, 
  Archive, CheckCircle, AlertCircle, Loader2, Trash2, Edit3,
  ChevronLeft, ChevronRight, Type, PenTool, Save, RotateCcw,
  Move, Maximize2, Minimize2, Settings, User, Image as ImageIcon
} from 'lucide-react'
import * as pdfjsLib from 'pdfjs-dist/build/pdf'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { PDFDocument, PDFPage, rgb, StandardFonts } from 'pdf-lib'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

export default function SignPDF({ navigate }) {
  const [pdfFile, setPdfFile] = useState(null)
  const [pdfDocument, setPdfDocument] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [scale, setScale] = useState(1.5)
  const [isLoading, setIsLoading] = useState(false)
  const [isPageLoading, setIsPageLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('sign') // 'sign' or 'edit'
  const [signatures, setSignatures] = useState([])
  const [selectedSignature, setSelectedSignature] = useState(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawingData, setDrawingData] = useState([])
  const [textElements, setTextElements] = useState([])
  const [selectedElement, setSelectedElement] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 })
  const [processedPdf, setProcessedPdf] = useState(null)
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0 })
  
  // Modal states
  const [showSignatureModal, setShowSignatureModal] = useState(false)
  const [showTextModal, setShowTextModal] = useState(false)
  const [signatureMode, setSignatureMode] = useState('draw') // 'draw' or 'upload'
  const [editingText, setEditingText] = useState('')
  const [editingFontSize, setEditingFontSize] = useState(16)
  const [editingFontFamily, setEditingFontFamily] = useState('helvetica')
  
  const canvasRef = useRef(null)
  const pdfContainerRef = useRef(null)
  const signatureCanvasRef = useRef(null)
  const fileInputRef = useRef(null)
  const signatureUploadRef = useRef(null)

  // Load PDF file
  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file || file.type !== 'application/pdf') {
      setError('Please select a valid PDF file')
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
      const arrayBuffer = await file.arrayBuffer()
      const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      
      setPdfFile(file)
      setPdfDocument(pdfDoc)
      setTotalPages(pdfDoc.numPages)
      setCurrentPage(1)
      setTextElements([])
      setDrawingData([])
      setSelectedElement(null)
      
      // Load first page immediately
      console.log('File uploaded, loading first page')
      await loadPage(1, arrayBuffer)
    } catch (err) {
      setError('Failed to load PDF: ' + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Track rendering state to prevent concurrent operations
  const renderingRef = useRef(false)
  const renderTaskRef = useRef(null)

  // Load specific page
  const loadPage = async (pageNum, arrayBuffer) => {
    if (!pdfDocument) return
    
    // Cancel any ongoing render operation
    if (renderTaskRef.current) {
      try {
        renderTaskRef.current.cancel()
      } catch (e) {
        // Ignore cancellation errors
      }
      renderTaskRef.current = null
    }
    
    // Prevent concurrent rendering
    if (renderingRef.current) {
      console.log('Rendering already in progress, skipping...')
      return
    }
    
    renderingRef.current = true
    setIsPageLoading(true)
    
    try {
      console.log('Loading page:', pageNum)
      const page = await pdfDocument.getPage(pageNum)
      const viewport = page.getViewport({ scale })
      
      const canvas = canvasRef.current
      if (!canvas) {
        console.error('Canvas ref not available')
        return
      }
      
      const context = canvas.getContext('2d')
      
      // Set canvas dimensions
      canvas.width = viewport.width
      canvas.height = viewport.height
      
      // Clear canvas first
      context.clearRect(0, 0, canvas.width, canvas.height)
      
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      }
      
      console.log('Rendering page with viewport:', { width: viewport.width, height: viewport.height })
      
      // Store the render task so we can cancel it if needed
      renderTaskRef.current = page.render(renderContext)
      await renderTaskRef.current.promise
      renderTaskRef.current = null
      
      console.log('Page rendered successfully')
      
      // Update container size
      if (pdfContainerRef.current) {
        pdfContainerRef.current.style.width = `${viewport.width}px`
        pdfContainerRef.current.style.height = `${viewport.height}px`
        console.log('Container size updated:', { width: viewport.width, height: viewport.height })
      }
    } catch (err) {
      if (err.name === 'RenderingCancelledException') {
        console.log('Rendering was cancelled')
      } else {
        console.error('Error loading page:', err)
        setError('Failed to load page: ' + err.message)
      }
    } finally {
      renderingRef.current = false
      setIsPageLoading(false)
    }
  }

  // Handle page navigation
  const goToPage = async (pageNum) => {
    if (pageNum >= 1 && pageNum <= totalPages) {
      console.log('Navigating to page:', pageNum)
      setCurrentPage(pageNum)
      await loadPage(pageNum)
    }
  }

  // Handle zoom
  const handleZoom = async (newScale) => {
    const clampedScale = Math.max(0.5, Math.min(3, newScale))
    console.log('Zooming to scale:', clampedScale)
    setScale(clampedScale)
    if (pdfDocument) {
      await loadPage(currentPage)
    }
  }

  // Signature drawing functions
  const startDrawing = (e) => {
    e.preventDefault()
    setIsDrawing(true)
    const rect = signatureCanvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    // Start a new stroke - add a gap marker to separate strokes
    setDrawingData(prev => [...prev, { x, y, type: 'start' }])
  }

  const draw = (e) => {
    e.preventDefault()
    if (!isDrawing) return
    
    const rect = signatureCanvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    setDrawingData(prev => [...prev, { x, y, type: 'draw' }])
  }

  const stopDrawing = (e) => {
    e.preventDefault()
    setIsDrawing(false)
  }

  // Handle touch events for better mobile support
  const handleTouchStart = (e) => {
    e.preventDefault()
    const touch = e.touches[0]
    const rect = signatureCanvasRef.current.getBoundingClientRect()
    const x = touch.clientX - rect.left
    const y = touch.clientY - rect.top
    
    setIsDrawing(true)
    // Start a new stroke by adding to existing data instead of replacing
    setDrawingData(prev => [...prev, { x, y, type: 'start' }])
  }

  const handleTouchMove = (e) => {
    e.preventDefault()
    if (!isDrawing) return
    
    const touch = e.touches[0]
    const rect = signatureCanvasRef.current.getBoundingClientRect()
    const x = touch.clientX - rect.left
    const y = touch.clientY - rect.top
    
    setDrawingData(prev => [...prev, { x, y, type: 'draw' }])
  }

  const handleTouchEnd = (e) => {
    e.preventDefault()
    setIsDrawing(false)
  }

  // Save signature
  const saveSignature = () => {
    if (drawingData.length < 2) return
    
    const canvas = signatureCanvasRef.current
    const dataURL = canvas.toDataURL()
    
    const newSignature = {
      id: Date.now(),
      name: `Signature ${signatures.length + 1}`,
      data: dataURL,
      timestamp: new Date().toISOString()
    }
    
    setSignatures(prev => [...prev, newSignature])
    setSelectedSignature(newSignature)
    clearSignatureCanvas()
    setShowSignatureModal(false)
  }

  // Upload signature
  const handleSignatureUpload = async (event) => {
    const file = event.target.files[0]
    if (!file || !file.type.startsWith('image/')) {
      setError('Please select a valid image file')
      return
    }

    try {
      const reader = new FileReader()
      reader.onload = (e) => {
        const newSignature = {
          id: Date.now(),
          name: file.name.replace(/\.[^/.]+$/, ''),
          data: e.target.result,
          timestamp: new Date().toISOString()
        }
        
        setSignatures(prev => [...prev, newSignature])
        setSelectedSignature(newSignature)
        setShowSignatureModal(false)
      }
      reader.readAsDataURL(file)
    } catch (err) {
      setError('Failed to upload signature: ' + err.message)
    }
  }

  // Clear signature canvas
  const clearSignatureCanvas = () => {
    setDrawingData([])
    const canvas = signatureCanvasRef.current
    if (canvas) {
      const context = canvas.getContext('2d')
      context.clearRect(0, 0, canvas.width, canvas.height)
    }
  }

  // Add text element
  const addTextElement = () => {
    if (!editingText.trim()) return
    
    // Calculate better dimensions for text box
    const minWidth = Math.max(200, editingText.length * editingFontSize * 0.6)
    const minHeight = Math.max(80, editingFontSize * 2)
    
    const newText = {
      id: Date.now(),
      type: 'text', // Add missing type property
      text: editingText,
      x: textPosition.x,
      y: textPosition.y,
      fontSize: editingFontSize,
      color: { r: 0, g: 0, b: 0 },
      font: editingFontFamily === 'helvetica' ? 'helvetica' : 
            editingFontFamily === 'times' ? 'times' : 
            'courier',
      width: minWidth,
      height: minHeight,
      page: currentPage // Track which page this element belongs to
    }
    
    console.log('Creating text element on page:', currentPage, newText)
    setTextElements(prev => [...prev, newText])
    setSelectedElement(newText)
    setEditingText('')
    setShowTextModal(false)
  }

  // Update text element
  const updateTextElement = (id, updates) => {
    setTextElements(prev => 
      prev.map(el => el.id === id ? { ...el, ...updates } : el)
    )
  }

  // Delete element
  const deleteElement = (id) => {
    setTextElements(prev => prev.filter(el => el.id !== id))
    setSelectedElement(null)
  }

  // Handle PDF click for placing elements
  const handlePdfClick = (e) => {
    if (activeTab === 'sign' && selectedSignature) {
      // Place signature
      const rect = pdfContainerRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      
      const newSignatureElement = {
        id: Date.now(),
        type: 'signature',
        x: x,
        y: y,
        width: 200,
        height: 100,
        data: selectedSignature.data,
        name: selectedSignature.name,
        page: currentPage // Track which page this element belongs to
      }
      
      console.log('Creating signature element on page:', currentPage, newSignatureElement)
      setTextElements(prev => [...prev, newSignatureElement])
      setSelectedElement(newSignatureElement)
      setSelectedSignature(null)
    } else if (activeTab === 'edit') {
      // Show text input popup at click position
      console.log('Edit tab active, opening text modal')
      const rect = pdfContainerRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      
      console.log('Click position:', { x, y, clientX: e.clientX, clientY: e.clientY, rect })
      setEditingText('')
      setTextPosition({ x, y })
      setShowTextModal(true)
      console.log('Text modal state set to true')
    }
  }

  // Drag and resize functionality
  const handleMouseDown = (e, element, action = 'drag') => {
    e.stopPropagation()
    
    if (action === 'drag') {
      setIsDragging(true)
      setSelectedElement(element)
      
      const rect = pdfContainerRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      
      setDragOffset({
        x: x - element.x,
        y: y - element.y
      })
    } else if (action === 'resize') {
      setIsResizing(true)
      setSelectedElement(element)
      
      const rect = pdfContainerRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      
      setResizeStart({
        x: x,
        y: y,
        width: element.width,
        height: element.height
      })
    }
  }

  const handleMouseMove = (e) => {
    if (!isDragging && !isResizing || !selectedElement) return
    
    const rect = pdfContainerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    if (isDragging) {
      const newX = x - dragOffset.x
      const newY = y - dragOffset.y
      
      updateTextElement(selectedElement.id, { x: newX, y: newY })
    } else if (isResizing) {
      const deltaX = x - resizeStart.x
      const deltaY = y - resizeStart.y
      
      const newWidth = Math.max(50, resizeStart.width + deltaX)
      const newHeight = Math.max(30, resizeStart.height + deltaY)
      
      updateTextElement(selectedElement.id, { 
        width: newWidth, 
        height: newHeight,
        fontSize: Math.max(8, Math.min(72, Math.round(newHeight * 0.6)))
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    setIsResizing(false)
  }

  // Process PDF with signatures and text
  const processPdf = async () => {
    if (!pdfFile || !textElements.length) {
      setError('Please add some content before processing')
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
      const arrayBuffer = await pdfFile.arrayBuffer()
      const pdfDoc = await PDFDocument.load(arrayBuffer)
      const pages = pdfDoc.getPages()
      
      // Group elements by page
      const elementsByPage = {}
      console.log('Processing elements:', textElements)
      textElements.forEach(element => {
        console.log(`Element ${element.id} (${element.type}) belongs to page ${element.page}`)
        if (!elementsByPage[element.page]) {
          elementsByPage[element.page] = []
        }
        elementsByPage[element.page].push(element)
      })
      console.log('Elements grouped by page:', elementsByPage)
      
      // Process each page that has elements
      for (const [pageNum, elements] of Object.entries(elementsByPage)) {
        const pageIndex = parseInt(pageNum) - 1
        if (pageIndex >= 0 && pageIndex < pages.length) {
          const page = pages[pageIndex]
          
          // Get PDF page dimensions
          const pdfWidth = page.getWidth()
          const pdfHeight = page.getHeight()
          
          // Get the PDF container dimensions (this is what we use for element positioning)
          const container = pdfContainerRef.current
          const containerRect = container.getBoundingClientRect()
          const containerWidth = containerRect.width
          const containerHeight = containerRect.height
          
          // Calculate scale factors to convert screen coordinates to PDF coordinates
          const scaleX = pdfWidth / containerWidth
          const scaleY = pdfHeight / containerHeight
          
          console.log('Coordinate conversion:', {
            pdf: { width: pdfWidth, height: pdfHeight },
            container: { width: containerWidth, height: containerHeight },
            canvas: { 
              width: canvasRef.current?.getBoundingClientRect().width,
              height: canvasRef.current?.getBoundingClientRect().height
            },
            scale: { scaleX, scaleY }
          })
          
          // Add elements to this specific page
          for (const element of elements) {
            console.log('Processing element:', element)
            if (element.type === 'text') {
              console.log('Processing text element:', element)
              // Embed the appropriate font based on the font name
              let font
              if (element.font === 'helvetica') {
                font = await pdfDoc.embedFont(StandardFonts.Helvetica)
              } else if (element.font === 'times') {
                font = await pdfDoc.embedFont(StandardFonts.TimesRoman)
              } else if (element.font === 'courier') {
                font = await pdfDoc.embedFont(StandardFonts.Courier)
              } else {
                font = await pdfDoc.embedFont(StandardFonts.Helvetica) // default
              }
              
              // Convert screen coordinates to PDF coordinates
              const pdfX = element.x * scaleX
              const pdfY = pdfHeight - (element.y * scaleY) - (element.fontSize * scaleY)
              
              console.log('Text coordinates:', { 
                original: { x: element.x, y: element.y, fontSize: element.fontSize },
                pdf: { x: pdfX, y: pdfY, size: element.fontSize * scaleY },
                scale: { scaleX, scaleY }
              })
              
              page.drawText(element.text, {
                x: pdfX,
                y: pdfY,
                size: element.fontSize * scaleY,
                color: rgb(element.color.r, element.color.g, element.color.b),
                font: font
              })
              console.log('Text drawn successfully')
            } else if (element.type === 'signature') {
              // Convert signature data to image and embed
              const response = await fetch(element.data)
              const imageBytes = await response.arrayBuffer()
              const image = await pdfDoc.embedPng(imageBytes)
              
              // Convert screen coordinates to PDF coordinates
              const pdfX = element.x * scaleX
              const pdfY = pdfHeight - (element.y * scaleY) - (element.height * scaleY)
              const pdfWidth = element.width * scaleX
              const pdfHeightImg = element.height * scaleY
              
              page.drawImage(image, {
                x: pdfX,
                y: pdfY,
                width: pdfWidth,
                height: pdfHeightImg
              })
            }
          }
        }
      }
      
      const processedBytes = await pdfDoc.save()
      const blob = new Blob([processedBytes], { type: 'application/pdf' })
      
      setProcessedPdf({
        file: blob,
        name: `signed_${pdfFile.name}`,
        type: 'pdf'
      })
    } catch (err) {
      setError('Failed to process PDF: ' + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Download processed PDF
  const downloadPdf = () => {
    if (!processedPdf) return
    
    const url = URL.createObjectURL(processedPdf.file)
    const a = document.createElement('a')
    a.href = url
    a.download = processedPdf.name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Clear all
  const clearAll = () => {
    setPdfFile(null)
    setPdfDocument(null)
    setCurrentPage(1)
    setTotalPages(0)
    setTextElements([])
    setDrawingData([])
    setSelectedElement(null)
    setProcessedPdf(null)
    setError(null)
    clearSignatureCanvas()
  }

  // Effects
  useEffect(() => {
    if (pdfDocument && currentPage > 0) {
      console.log('PDF document changed, loading initial page:', currentPage)
      loadPage(currentPage)
    }
  }, [pdfDocument, currentPage])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cancel any ongoing render operation
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel()
        } catch (e) {
          // Ignore cancellation errors
        }
        renderTaskRef.current = null
      }
      renderingRef.current = false
    }
  }, [])

  // Render signature canvas
  useEffect(() => {
    if (signatureCanvasRef.current) {
      const canvas = signatureCanvasRef.current
      const context = canvas.getContext('2d')
      
      // Set canvas size with device pixel ratio for crisp rendering
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      
      // Only resize if dimensions have changed
      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr
        canvas.height = rect.height * dpr
        
        // Scale the context to account for device pixel ratio
        context.scale(dpr, dpr)
        
        // Set canvas CSS size
        canvas.style.width = rect.width + 'px'
        canvas.style.height = rect.height + 'px'
      }
      
      // Clear canvas
      context.clearRect(0, 0, rect.width, rect.height)
      
      // Only draw if we have drawing data
      if (drawingData.length > 0) {
        // Draw signature with improved line quality
        context.strokeStyle = '#000'
        context.lineWidth = 2
        context.lineCap = 'round'
        context.lineJoin = 'round'
        context.imageSmoothingEnabled = true
        context.imageSmoothingQuality = 'high'
        
        // Draw separate strokes for disconnected writing
        let currentStroke = []
        
        for (let i = 0; i < drawingData.length; i++) {
          const point = drawingData[i]
          
          if (point.type === 'start') {
            // If we have a previous stroke, draw it
            if (currentStroke.length > 1) {
              context.beginPath()
              context.moveTo(currentStroke[0].x, currentStroke[0].y)
              for (let j = 1; j < currentStroke.length; j++) {
                context.lineTo(currentStroke[j].x, currentStroke[j].y)
              }
              context.stroke()
            }
            // Start a new stroke
            currentStroke = [point]
          } else if (point.type === 'draw') {
            // Add point to current stroke
            currentStroke.push(point)
          }
        }
        
        // Draw the last stroke if it exists
        if (currentStroke.length > 1) {
          context.beginPath()
          context.moveTo(currentStroke[0].x, currentStroke[0].y)
          for (let j = 1; j < currentStroke.length; j++) {
            context.lineTo(currentStroke[j].x, currentStroke[j].y)
          }
          context.stroke()
        }
      }
    }
  }, [drawingData])

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Single Card Container */}
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Card Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 text-white">
                  {/* eSign Heading */}
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold mb-2">eSign</h1>
            <p className="text-blue-100 text-lg">Digital PDF Signing & Editing Tool</p>
          </div>
          
          {/* Controls Row */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Left side - File info and editable filename */}
            <div className="flex items-center space-x-4">
              {pdfFile && (
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <FileText className="w-7 h-7 text-white" />
                  </div>
                  <div className="min-w-0">
                    <input
                      type="text"
                      value={pdfFile.name}
                      onChange={(e) => {
                        const newFile = new File([pdfFile], e.target.value, { type: pdfFile.type })
                        setPdfFile(newFile)
                      }}
                      className="font-semibold text-white bg-transparent border-b-2 border-transparent hover:border-white focus:border-white focus:outline-none px-2 py-1 min-w-[200px] text-lg placeholder-white placeholder-opacity-80"
                      placeholder="Enter filename..."
                    />
                    <p className="text-blue-100 text-sm mt-1">Page {currentPage} of {totalPages}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Center - Page navigation */}
            <div className="flex items-center space-x-3">
              {pdfFile && (
                <div className="flex items-center space-x-2 bg-white bg-opacity-20 rounded-lg p-1 backdrop-blur-sm">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="p-2 hover:bg-white hover:bg-opacity-30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-white"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-sm font-mono bg-white bg-opacity-90 text-gray-900 px-4 py-2 rounded-md shadow-sm">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="p-2 hover:bg-white hover:bg-opacity-30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-white"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            {/* Right side - Action buttons and zoom controls */}
            {/* Debug: Show current activeTab */}
            <div className="text-white text-sm bg-black bg-opacity-50 px-2 py-1 rounded mr-2">
              Tab: {activeTab}
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Sign Button */}
              <button
                onClick={() => {
                  console.log('Sign button clicked, setting activeTab to sign')
                  setActiveTab('sign')
                  setShowSignatureModal(true)
                }}
                className={`px-4 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === 'sign' 
                    ? 'bg-white text-blue-600 shadow-lg' 
                    : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30 backdrop-blur-sm'
                }`}
              >
                <PenTool className="w-4 h-4 inline mr-2" />
                Sign
              </button>

              {/* Edit Button */}
              <button
                onClick={() => {
                  console.log('Edit button clicked, setting activeTab to edit')
                  setActiveTab('edit')
                }}
                className={`px-4 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === 'edit' 
                    ? 'bg-white text-green-600 shadow-lg' 
                    : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30 backdrop-blur-sm'
                }`}
              >
                <Type className="w-4 h-4 inline mr-2" />
                Edit
              </button>

              {/* Saved signatures dropdown */}
              {signatures.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-blue-100">Saved:</span>
                  <select
                    value={selectedSignature?.id || ''}
                    onChange={(e) => {
                      const signature = signatures.find(s => s.id === parseInt(e.target.value))
                      setSelectedSignature(signature)
                      setActiveTab('sign')
                    }}
                    className="px-3 py-2 border border-white border-opacity-30 rounded-lg focus:ring-2 focus:ring-white focus:border-transparent w-40 text-sm bg-white bg-opacity-20 text-white backdrop-blur-sm"
                  >
                    <option value="" className="text-gray-900">Select Signature</option>
                    {signatures.map(signature => (
                      <option key={signature.id} value={signature.id} className="text-gray-900">
                        {signature.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Process PDF Button */}
              <button
                onClick={processPdf}
                disabled={isLoading || !textElements.length}
                className="px-4 py-2.5 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 inline mr-2" />
                    Process
                  </>
                )}
              </button>

              {/* Download Button */}
              {processedPdf && (
                <button
                  onClick={downloadPdf}
                  className="px-4 py-2.5 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-all duration-200 shadow-lg"
                >
                  <Download className="w-4 h-4 inline mr-2" />
                  Download
                </button>
              )}

              {/* Zoom controls */}
              <div className="flex items-center space-x-2 bg-white bg-opacity-20 rounded-lg p-1 backdrop-blur-sm">
                <button
                  onClick={() => handleZoom(scale - 0.1)}
                  className="p-2 hover:bg-white hover:bg-opacity-30 rounded-lg transition-colors text-white"
                  disabled={scale <= 0.5}
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
                <span className="text-sm font-mono bg-white bg-opacity-90 text-gray-900 px-3 py-2 rounded-md shadow-sm min-w-[60px] text-center">
                  {Math.round(scale * 100)}%
                </span>
                <button
                  onClick={() => handleZoom(scale + 0.1)}
                  className="p-2 hover:bg-white hover:bg-opacity-30 rounded-lg transition-colors text-white"
                  disabled={scale >= 3}
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card Body - PDF Content */}
      <div className="p-8">
        {!pdfFile ? (
          /* File Upload */
          <div className="text-center py-20">
            <Upload className="w-24 h-24 text-gray-400 mx-auto mb-6" />
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">Upload PDF to Get Started</h3>
            <p className="text-gray-600 mb-8">Select a PDF file to add signatures and text</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors"
            >
              Choose PDF File
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        ) : (
          /* PDF Preview - Full Width */
          <div className="flex justify-center">
            <div className="relative">
              {/* Loading Indicator */}
              {isPageLoading && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
                    <p className="text-gray-600">Loading page...</p>
                  </div>
                </div>
              )}
              
              {/* PDF Container */}
              <div
                ref={pdfContainerRef}
                className="relative bg-white shadow-lg cursor-crosshair"
                onClick={handlePdfClick}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
              >
                {/* PDF Canvas */}
                <canvas
                  ref={canvasRef}
                  className="block"
                />
                
                {/* Elements Overlay - Only show elements for current page */}
                {textElements
                  .filter(element => element.page === currentPage)
                  .map(element => (
                  <div
                    key={element.id}
                    className={`absolute ${
                      selectedElement?.id === element.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    style={{
                      left: element.x,
                      top: element.y,
                      width: element.width,
                      height: element.height
                    }}
                  >
                    {element.type === 'signature' ? (
                      <img
                        src={element.data}
                        alt="Signature"
                        className="w-full h-full object-contain"
                        draggable={false}
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center text-center select-none bg-white bg-opacity-90 border border-gray-300 rounded p-2 shadow-sm cursor-pointer hover:bg-opacity-95 transition-colors"
                        style={{
                          fontSize: element.fontSize,
                          color: `rgb(${element.color.r * 255}, ${element.color.g * 255}, ${element.color.b * 255})`
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingText(element.text)
                          setEditingFontSize(element.fontSize)
                          setEditingFontFamily(element.font || 'helvetica')
                          setShowTextModal(true)
                        }}
                      >
                        {element.text}
                      </div>
                    )}
                    
                    {/* Drag Handle */}
                    <div 
                      className="absolute -top-2 -left-2 w-6 h-6 bg-blue-500 cursor-move rounded shadow-lg"
                      onMouseDown={(e) => {
                        e.stopPropagation()
                        handleMouseDown(e, element, 'drag')
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    
                    {/* Resize Handle */}
                    <div 
                      className="absolute -bottom-2 -right-2 w-6 h-6 bg-green-500 cursor-se-resize rounded shadow-lg"
                      onMouseDown={(e) => {
                        e.stopPropagation()
                        handleMouseDown(e, element, 'resize')
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    
                    {/* Page Indicator */}
                    <div className="absolute -top-8 -left-8 bg-gray-600 text-white text-xs px-2 py-1 rounded shadow-lg">
                      P{element.page}
                    </div>
                    
                    {/* Delete Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteElement(element.id)
                      }}
                      className="absolute -top-8 -right-8 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-sm hover:bg-red-600 transition-colors shadow-lg z-10"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Signature Modal */}
      <AnimatePresence>
        {showSignatureModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-semibold text-gray-900">Create Signature</h3>
                <button
                  onClick={() => setShowSignatureModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              {/* Mode Selection */}
              <div className="flex space-x-2 mb-6">
                <button
                  onClick={() => setSignatureMode('draw')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    signatureMode === 'draw' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <PenTool className="w-4 h-4 inline mr-2" />
                  Draw Signature
                </button>
                <button
                  onClick={() => setSignatureMode('upload')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    signatureMode === 'upload' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <ImageIcon className="w-4 h-4 inline mr-2" />
                  Upload Image
                </button>
              </div>
              
              {/* Drawing Mode */}
              {signatureMode === 'draw' && (
                <div className="mb-6">
                  <div className="bg-white border-2 border-gray-300 rounded-lg p-4">
                    <canvas
                      ref={signatureCanvasRef}
                      className="w-full h-40 border border-gray-200 rounded cursor-crosshair"
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={handleTouchStart}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                    />
                  </div>
                  <div className="flex space-x-2 mt-2">
                    <button
                      onClick={clearSignatureCanvas}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <RotateCcw className="w-4 h-4 inline mr-2" />
                      Clear
                    </button>
                  </div>
                </div>
              )}
              
              {/* Upload Mode */}
              {signatureMode === 'upload' && (
                <div className="mb-6">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Upload your signature image</p>
                    <button
                      onClick={() => signatureUploadRef.current?.click()}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Choose Image
                    </button>
                    <input
                      ref={signatureUploadRef}
                      type="file"
                      accept="image/*"
                      onChange={handleSignatureUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowSignatureModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                {signatureMode === 'draw' && (
                  <button
                    onClick={saveSignature}
                    disabled={drawingData.length < 2}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Save className="w-4 h-4 inline mr-2" />
                    Save Signature
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Text Modal */}
      <AnimatePresence>
        {showTextModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-semibold text-gray-900">Add Text</h3>
                <button
                  onClick={() => setShowTextModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Text Content
                  </label>
                  <textarea
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                    placeholder="Enter your text here... You can resize this box by dragging the bottom-right corner"
                    autoFocus
                    rows={6}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Font Size
                    </label>
                    <select
                      value={editingFontSize}
                      onChange={(e) => setEditingFontSize(parseInt(e.target.value) || 16)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="12">12px</option>
                      <option value="14">14px</option>
                      <option value="16">16px</option>
                      <option value="18">18px</option>
                      <option value="20">20px</option>
                      <option value="24">24px</option>
                      <option value="28">28px</option>
                      <option value="32">32px</option>
                      <option value="36">36px</option>
                      <option value="48">48px</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Font Family
                    </label>
                    <select
                      value={editingFontFamily}
                      onChange={(e) => setEditingFontFamily(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="helvetica">Helvetica</option>
                      <option value="times">Times</option>
                      <option value="courier">Courier</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowTextModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addTextElement}
                  disabled={!editingText.trim()}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="w-4 h-4 inline mr-2" />
                  Add Text
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-4 right-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 z-50"
        >
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-700">{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-600"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* Processed PDF Download */}
      {processedPdf && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-4 right-4 p-6 bg-green-50 border border-green-200 rounded-lg shadow-lg"
        >
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <h3 className="text-lg font-semibold text-green-900">PDF Ready!</h3>
          </div>
          
          <p className="text-gray-600 mb-4">Your PDF has been processed successfully.</p>
          
          <div className="flex items-center gap-3">
            <button
              onClick={downloadPdf}
              className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
            
            <button
              onClick={() => setProcessedPdf(null)}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
