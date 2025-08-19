import React, { useEffect, useRef, useState, useCallback } from 'react'
import * as pdfjsLib from 'pdfjs-dist/build/pdf'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

export default function SignPDF() {
  // PDF State
  const [pdfFile, setPdfFile] = useState(null)
  const [pdfDocument, setPdfDocument] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [numPages, setNumPages] = useState(0)
  const [scale, setScale] = useState(2.0) // Default to 200% zoom
  const [pageDimensions, setPageDimensions] = useState({ width: 0, height: 0 })
  const [isRendering, setIsRendering] = useState(false)
  const [allPages, setAllPages] = useState([])
  const [totalHeight, setTotalHeight] = useState(0)
  
  // UI State
  const [mode, setMode] = useState('view') // 'view', 'sign', 'fill'
  const [showSignaturePad, setShowSignaturePad] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  
  // Signature State
  const [signatures, setSignatures] = useState([])
  const [selectedSignature, setSelectedSignature] = useState(null)
  const [signaturePadData, setSignaturePadData] = useState('')
  
  // Text/Fill State
  const [textElements, setTextElements] = useState([])
  const [selectedTextElement, setSelectedTextElement] = useState(null)
  const [editingElement, setEditingElement] = useState(null)
  const [fontSize, setFontSize] = useState(11)
  const [fontFamily, setFontFamily] = useState('Arial')
  
  // Refs
  const canvasRef = useRef(null)
  const signaturePadRef = useRef(null)
  const fileInputRef = useRef(null)
  const containerRef = useRef(null)
  
  // Font options
  const fontOptions = [
    { value: 'Arial', label: 'Arial' },
    { value: 'Helvetica', label: 'Helvetica' },
    { value: 'Times New Roman', label: 'Times New Roman' },
    { value: 'Courier New', label: 'Courier New' },
    { value: 'Georgia', label: 'Georgia' },
    { value: 'Verdana', label: 'Verdana' }
  ]

  // Load PDF file
  const handleFileUpload = useCallback(async (file) => {
    if (!file || file.type !== 'application/pdf') return
    
    try {
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      
      setPdfFile(file)
      setPdfDocument(pdf)
      setNumPages(pdf.numPages)
      setCurrentPage(1)
      
      // Reset states
      setTextElements([])
      setSelectedTextElement(null)
      setSelectedSignature(null)
      setMode('view')
      
      // Render all pages for continuous scrolling
      await renderAllPages(pdf)
    } catch (error) {
      console.error('Error loading PDF:', error)
      alert('Error loading PDF file')
    }
  }, [])
  
  // Render all pages for continuous scrolling
  const renderAllPages = useCallback(async (pdf) => {
    if (!pdf) return
    
    setIsRendering(true)
    
    try {
      const pages = []
      let totalHeight = 0
      
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum)
        
        // Get container dimensions for optimal scaling
        const container = containerRef.current
        if (!container) continue
        
        const containerWidth = container.clientWidth - 32
        const containerHeight = container.clientHeight - 32
        
        // Calculate optimal scale to fit the page in the container
        const pageViewport = page.getViewport({ scale: 1.0 })
        const scaleX = containerWidth / pageViewport.width
        const scaleY = containerHeight / pageViewport.height
        const optimalScale = Math.min(scaleX, scaleY, 1.5)
        
        // Apply user zoom on top of optimal scale
        const finalScale = optimalScale * scale
        
        const viewport = page.getViewport({ scale: finalScale })
        
        // Create canvas for this page
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')
        
        // Set canvas dimensions with high DPI for crisp rendering
        const devicePixelRatio = window.devicePixelRatio || 1
        canvas.width = viewport.width * devicePixelRatio
        canvas.height = viewport.height * devicePixelRatio
        
        // Set CSS dimensions
        canvas.style.width = `${viewport.width}px`
        canvas.style.height = `${viewport.height}px`
        
        // Scale the context to account for device pixel ratio
        context.scale(devicePixelRatio, devicePixelRatio)
        
        const renderContext = {
          canvasContext: context,
          viewport: viewport
        }
        
        await page.render(renderContext).promise
        
        // Convert to data URL and store
        const dataURL = canvas.toDataURL()
        
        pages.push({
          pageNum,
          canvas: dataURL,
          width: viewport.width,
          height: viewport.height,
          y: totalHeight,
          scale: finalScale
        })
        
        totalHeight += viewport.height + 40 // Add more spacing between pages
        
        // Clean up canvas to prevent memory leaks and reuse issues
        canvas.width = 0
        canvas.height = 0
      }
      
      setAllPages(pages)
      setTotalHeight(totalHeight)
    } catch (error) {
      console.error('Error rendering all pages:', error)
    } finally {
      setIsRendering(false)
    }
  }, [scale])

  // Render PDF page
  const renderPage = useCallback(async () => {
    if (!pdfDocument || !canvasRef.current) return
    
    setIsRendering(true)
    
    try {
      const page = await pdfDocument.getPage(currentPage)
      
      // Get container dimensions for optimal scaling
      const container = containerRef.current
      if (!container) return
      
      const containerWidth = container.clientWidth - 32 // Account for padding (p-4 = 16px * 2)
      const containerHeight = container.clientHeight - 32
      
      // Calculate optimal scale to fit the page in the container
      const pageViewport = page.getViewport({ scale: 1.0 })
      const scaleX = containerWidth / pageViewport.width
      const scaleY = containerHeight / pageViewport.height
      const optimalScale = Math.min(scaleX, scaleY, 1.5) // Reduced to allow more zoom control
      
      // Apply user zoom on top of optimal scale
      const finalScale = optimalScale * scale
      
      const viewport = page.getViewport({ scale: finalScale })
      
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')
      
      // Set canvas dimensions with high DPI for crisp rendering
      const devicePixelRatio = window.devicePixelRatio || 1
      canvas.width = viewport.width * devicePixelRatio
      canvas.height = viewport.height * devicePixelRatio
      
      // Set CSS dimensions
      canvas.style.width = `${viewport.width}px`
      canvas.style.height = `${viewport.height}px`
      
      // Scale the context to account for device pixel ratio
      context.scale(devicePixelRatio, devicePixelRatio)
      
      setPageDimensions({
        width: viewport.width,
        height: viewport.height
      })
      
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      }
      
      await page.render(renderContext).promise
    } catch (error) {
      console.error('Error rendering page:', error)
    } finally {
      setIsRendering(false)
    }
  }, [pdfDocument, currentPage, scale])

  // Handle canvas click for placing elements
  const handleCanvasClick = useCallback((event) => {
    console.log('Canvas click triggered, editingElement:', editingElement, 'mode:', mode)
    
    // If we're editing an element, don't place new elements
    if (editingElement) {
      console.log('Currently editing element, cannot place new elements')
      return
    }
    
    if (mode === 'view') return
    
    const container = event.currentTarget
    const rect = container.getBoundingClientRect()
    const scrollTop = container.scrollTop || 0
    
    // Calculate actual click position relative to the container
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top + scrollTop
    
    // Determine which page was clicked based on y position
    let clickedPage = 1
    let pageOffset = 0
    let pageScale = 1
    
    for (let i = allPages.length - 1; i >= 0; i--) {
      if (y >= allPages[i].y) {
        clickedPage = allPages[i].pageNum
        pageOffset = allPages[i].y
        pageScale = allPages[i].scale
        break
      }
    }
    
    // Calculate position relative to the clicked page in normalized coordinates
    // This ensures consistent positioning regardless of zoom level
    const relativeX = (x - 16) / pageScale // Subtract padding and normalize
    const relativeY = (y - pageOffset - 16) / pageScale // Subtract padding and page offset, normalize
    
    console.log('Click coordinates:', { x, y, clickedPage, relativeX, relativeY, pageScale })
    
    if (mode === 'sign' && selectedSignature) {
      // Add signature with size matching the actual signature
      const newSignature = {
        id: Date.now(),
        type: 'signature',
        page: clickedPage,
        x: relativeX - selectedSignature.width / 2,
        y: relativeY - selectedSignature.height / 2,
        width: selectedSignature.width,
        height: selectedSignature.height,
        data: selectedSignature.data
      }
      
      console.log('Adding new signature:', newSignature)
      setTextElements(prev => {
        const updated = [...prev, newSignature]
        console.log('Text elements after adding signature:', updated)
        return updated
      })
      setMode('view')
      setSelectedSignature(null)
      
      // For signatures, we don't need editing state - they're saved immediately
      console.log('Signature added and saved immediately')
    } else if (mode === 'fill') {
      // Add text element with size matching text
      const newTextElement = {
        id: Date.now(),
        type: 'text',
        page: clickedPage,
        x: relativeX,
        y: relativeY,
        width: 80, // Smaller initial width
        height: 20, // Smaller initial height
        text: 'Click to edit',
        fontSize: 11,
        fontFamily: fontFamily
      }
      
      console.log('Adding new text element:', newTextElement)
      setTextElements(prev => [...prev, newTextElement])
      setSelectedTextElement(newTextElement)
      setEditingElement(newTextElement)
      // Don't change mode to 'view' for new text elements - keep it as 'fill' so save button shows
      // setMode('view')
    }
  }, [mode, selectedSignature, allPages, fontFamily, editingElement])

  // Mouse state for drag and resize
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, elementId: null })
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0, elementId: null })

  // Handle mouse down for dragging
  const handleMouseDown = useCallback((e, elementId, action = 'drag') => {
    e.stopPropagation()
    
    if (action === 'drag') {
      const element = textElements.find(el => el.id === elementId)
      if (element) {
        
        setIsDragging(true)
        setDragStart({
          x: e.clientX,
          y: e.clientY,
          elementId
        })
      }
    } else if (action === 'resize') {
      setIsResizing(true)
      const element = textElements.find(el => el.id === elementId)
      if (element) {
        setResizeStart({
          x: e.clientX,
          y: e.clientY,
          width: element.width,
          height: element.height,
          elementId
        })
      }
    }
  }, [textElements])

  // Handle mouse move for dragging and resizing
  const handleMouseMove = useCallback((e) => {
    if (!isDragging && !isResizing) return
    
    const container = containerRef.current
    if (!container) return
    
    const rect = container.getBoundingClientRect()
    const scrollTop = container.scrollTop || 0
    
    if (isDragging && dragStart.elementId) {
      // Handle dragging with simplified logic that works on all pages
      const element = textElements.find(el => el.id === dragStart.elementId)
      if (!element) return
      
      // Get the current page the element is on
      const currentPage = allPages.find(p => p.pageNum === element.page)
      if (!currentPage) return
      
      // Use the page's actual scale for coordinate calculations
      const pageScale = currentPage.scale
      const deltaX = (e.clientX - dragStart.x) / pageScale
      const deltaY = (e.clientY - dragStart.y) / pageScale
      
      setTextElements(prev => prev.map(el => {
        if (el.id === dragStart.elementId) {
          // Calculate new position relative to the current page
          const newX = el.x + deltaX
          const newY = el.y + deltaY
          
          // Get page dimensions in PDF coordinates (original PDF size)
          const pageWidth = currentPage.width / pageScale
          const pageHeight = currentPage.height / pageScale
          
          // Clamp position within current page bounds
          const clampedY = Math.max(0, Math.min(pageHeight - el.height, newY))
          const clampedX = Math.max(0, Math.min(pageWidth - el.width, newX))
          
          return { ...el, x: clampedX, y: clampedY, page: el.page }
        }
        return el
      }))
      
      setDragStart(prev => ({ ...prev, x: e.clientX, y: e.clientY }))
    }
    
    if (isResizing && resizeStart.elementId) {
      // Handle resizing
      const element = textElements.find(el => el.id === resizeStart.elementId)
      if (!element) return
      
      // Get the current page the element is on
      const currentPage = allPages.find(p => p.pageNum === element.page)
      if (!currentPage) return
      
      // Use the page's actual scale for coordinate calculations
      const pageScale = currentPage.scale
      const deltaX = (e.clientX - resizeStart.x) / pageScale
      const deltaY = (e.clientY - resizeStart.y) / pageScale
      
      const newWidth = Math.max(50, resizeStart.width + deltaX)
      const newHeight = Math.max(30, resizeStart.height + deltaY)
      
      setTextElements(prev => prev.map(el => {
        if (el.id === resizeStart.elementId) {
          const newElement = { ...el, width: newWidth, height: newHeight }
          
          // For text elements, update font size based on height
          if (el.type === 'text') {
            const newFontSize = Math.max(8, Math.min(72, Math.round(newHeight * 0.6)))
            newElement.fontSize = newFontSize
            
            // Update header font size if this element is selected
            if (selectedTextElement?.id === el.id) {
              setFontSize(newFontSize)
            }
          }
          
          return newElement
        }
        return el
      }))
    }
  }, [isDragging, isResizing, dragStart, resizeStart, allPages, selectedTextElement, textElements])

  // Handle mouse up to stop dragging/resizing
  const handleMouseUp = useCallback(() => {
    if (isDragging && dragStart.elementId) {
      // Log the final position of the dragged element
      const element = textElements.find(el => el.id === dragStart.elementId)
      if (element) {
        
      }
    }
    
    setIsDragging(false)
    setIsResizing(false)
    
    setDragStart({ x: 0, y: 0, elementId: null })
    setResizeStart({ x: 0, y: 0, width: 0, height: 0, elementId: null })
  }, [isDragging, dragStart, textElements])

  // Handle drag over (for compatibility)
  const handleDragOver = useCallback((event) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  // Handle text element selection and editing
  const handleTextElementClick = useCallback((element) => {
    if (element.type === 'text') {
      setSelectedTextElement(element)
      setEditingElement(element)
      setMode('fill')
      setFontSize(element.fontSize)
      setFontFamily(element.fontFamily)
    }
  }, [])

  // Handle text input change
  const handleTextChange = useCallback((elementId, newText) => {
    console.log('Text change triggered:', { elementId, newText })
    
    setTextElements(prev => {
      const updated = prev.map(element => {
        if (element.id === elementId) {
          const updatedElement = { ...element, text: newText }
          
          // Auto-resize text element based on content
          if (element.type === 'text') {
            const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
            ctx.font = `${element.fontSize}px ${element.fontFamily}`
            const textMetrics = ctx.measureText(newText)
            
            // Calculate new dimensions with some padding
            const newWidth = Math.max(80, textMetrics.width + 20)
            const newHeight = Math.max(20, element.fontSize + 10)
            
            updatedElement.width = newWidth
            updatedElement.height = newHeight
          }
          
          console.log('Updated element:', updatedElement)
          return updatedElement
        }
        return element
      })
      console.log('All text elements after update:', updated)
      return updated
    })
    
    // Also update the editing element state
    setEditingElement(prev => {
      if (prev && prev.id === elementId) {
        const updated = { ...prev, text: newText }
        console.log('Updated editing element:', updated)
        return updated
      }
      return prev
    })
    }, [])

  // Handle text element resize
  const handleTextResize = useCallback((elementId, newWidth, newHeight) => {
    setTextElements(prev => prev.map(element => {
      if (element.id === elementId) {
        const updatedElement = { ...element, width: newWidth, height: newHeight }
        
        // For text elements, update font size based on height
        if (element.type === 'text') {
          const newFontSize = Math.max(8, Math.min(72, Math.round(newHeight * 0.6)))
          updatedElement.fontSize = newFontSize
          
          // Update header font size if this element is selected
          if (selectedTextElement?.id === element.id) {
            setFontSize(newFontSize)
          }
        }
        
        return updatedElement
      }
      return element
    }))
  }, [selectedTextElement])

  // Remove element
  const removeElement = useCallback((elementId) => {
    setTextElements(prev => prev.filter(element => element.id !== elementId))
    if (selectedTextElement?.id === elementId) {
      setSelectedTextElement(null)
    }
  }, [selectedTextElement])

  // Create signature from pad
  const createSignature = useCallback(() => {
    if (!signaturePadData) return
    
    const newSignature = {
      id: Date.now(),
      name: `Signature ${signatures.length + 1}`,
      data: signaturePadData,
      width: 120,
      height: 50
    }
    
    setSignatures(prev => [...prev, newSignature])
    setShowSignaturePad(false)
    setSignaturePadData('')
  }, [signaturePadData, signatures.length])

  // Upload signature file
  const handleSignatureUpload = useCallback(async (event) => {
    const file = event.target.files[0]
    if (!file || !file.type.startsWith('image/')) return
    
    try {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          // Calculate appropriate size for signature (max 120x50)
          const maxWidth = 120
          const maxHeight = 50
          let finalWidth = img.width
          let finalHeight = img.height
          
          if (img.width > maxWidth || img.height > maxHeight) {
            const ratio = Math.min(maxWidth / img.width, maxHeight / img.height)
            finalWidth = Math.round(img.width * ratio)
            finalHeight = Math.round(img.height * ratio)
          }
          
          const newSignature = {
            id: Date.now(),
            name: file.name.replace(/\.[^/.]+$/, ''),
            data: e.target.result,
            width: finalWidth,
            height: finalHeight
          }
          
          setSignatures(prev => [...prev, newSignature])
          setShowUploadModal(false)
        }
        img.src = e.target.result
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Error uploading signature:', error)
      alert('Error uploading signature file')
    }
  }, [])

  // Helper function to convert viewer coordinates to PDF coordinates
  const convertViewerToPdfCoordinates = useCallback((element, pageNum) => {
    // Find the page info
    const page = allPages.find(p => p.pageNum === pageNum)
    if (!page) return element
    
    // Get the original PDF dimensions from the loaded PDF
    const originalPage = pdfDocument?.getPage(pageNum - 1)
    if (!originalPage) return element
    
    // Calculate the scale factor between viewer and original PDF
    const viewerWidth = page.width
    const viewerHeight = page.height
    
    // Get original PDF dimensions (these are in points, 72 points = 1 inch)
    const originalWidth = originalPage.getViewport({ scale: 1.0 }).width
    const originalHeight = originalPage.getViewport({ scale: 1.0 }).height
    
    // Calculate scale factors
    const scaleX = originalWidth / viewerWidth
    const scaleY = originalHeight / viewerHeight
    
    // Convert coordinates
    const convertedElement = {
      ...element,
      x: element.x * scaleX,
      y: element.y * scaleY,
      width: element.width * scaleX,
      height: element.height * scaleY,
      fontSize: element.type === 'text' ? element.fontSize * scaleX : element.fontSize
    }
    
    console.log('Coordinate conversion:', {
      original: element,
      converted: convertedElement,
      scaleX,
      scaleY,
      originalWidth,
      originalHeight,
      viewerWidth,
      viewerHeight
    })
    
    return convertedElement
  }, [allPages, pdfDocument])

  // Helper function to normalize coordinates for consistent positioning
  const normalizeCoordinates = useCallback((x, y, pageNum) => {
    const page = allPages.find(p => p.pageNum === pageNum)
    if (!page) return { x, y }
    
    // Normalize coordinates to be independent of zoom level
    // This ensures consistent positioning across different zoom levels
    const normalizedX = x / page.scale
    const normalizedY = y / page.scale
    
    return { x: normalizedX, y: normalizedY }
  }, [allPages])

  // Export signed PDF
  const exportPDF = useCallback(async () => {
    if (!pdfFile || !pdfDocument) return
    
    console.log('Starting export, textElements:', textElements)
    
    // Validate coordinates before export to ensure consistency
    validateElementCoordinates()
    
    try {
      const pdfBytes = await pdfFile.arrayBuffer()
      const pdfDoc = await PDFDocument.load(pdfBytes)
      
      // Process all pages
      for (let pageNum = 1; pageNum <= pdfDoc.getPageCount(); pageNum++) {
        const page = pdfDoc.getPage(pageNum - 1)
        const { width, height } = page.getSize()
        
        // Get elements for this page
        const pageElements = textElements.filter(element => element.page === pageNum)
        console.log(`Page ${pageNum} elements:`, pageElements)
        
        // Process elements sequentially to avoid async issues
        for (const element of pageElements) {
          console.log(`Processing element on page ${pageNum}:`, element)
          
          // Convert coordinates from viewer space to PDF space
          const convertedElement = convertViewerToPdfCoordinates(element, pageNum)
          
          if (element.type === 'signature') {
            try {
              const imageBytes = await fetch(element.data).then(res => res.arrayBuffer())
              const image = await pdfDoc.embedPng(imageBytes)
              
              // Use converted coordinates
              const xPdf = convertedElement.x
              const yPdf = convertedElement.y
              const wPdf = convertedElement.width
              const hPdf = convertedElement.height

              console.log(`Drawing signature on page ${pageNum}:`, { xPdf, yPdf, wPdf, hPdf })

              page.drawImage(image, {
                x: xPdf,
                y: height - yPdf - hPdf,
                width: wPdf,
                height: hPdf
              })
            } catch (error) {
              console.error('Error embedding signature:', error)
            }
          } else if (element.type === 'text') {
            try {
              const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
              
              // Use converted coordinates
              const xPdf = convertedElement.x
              const yPdf = convertedElement.y
              const sizePdf = convertedElement.fontSize

              console.log(`Drawing text on page ${pageNum}:`, { xPdf, yPdf, sizePdf })

              page.drawText(element.text, {
                x: xPdf,
                y: height - yPdf - sizePdf,
                size: sizePdf,
                font: font,
                color: rgb(0, 0, 0)
              })
            } catch (error) {
              console.error('Error drawing text:', error)
            }
          }
        }
      }
      
      console.log('Export completed successfully')
      const modifiedPdfBytes = await pdfDoc.save()
      const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = url
      a.download = `signed_${pdfFile.name}`
      a.click()
      
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting PDF:', error)
      alert('Error exporting PDF')
    }
  }, [pdfFile, pdfDocument, textElements, convertViewerToPdfCoordinates, validateElementCoordinates])

  // Clear signature pad
  const clearSignaturePad = useCallback(() => {
    if (signaturePadRef.current) {
      const ctx = signaturePadRef.current.getContext('2d')
      ctx.clearRect(0, 0, signaturePadRef.current.width, signaturePadRef.current.height)
      setSignaturePadData('')
    }
  }, [])

  // Handle signature pad drawing
  const handleSignaturePadMouseDown = useCallback((event) => {
    const canvas = signaturePadRef.current
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    
    ctx.beginPath()
    ctx.moveTo(event.clientX - rect.left, event.clientY - rect.top)
    ctx.lineWidth = 3
    ctx.strokeStyle = '#000'
    ctx.lineCap = 'round'
    
    canvas.isDrawing = true
    canvas.lastX = event.clientX - rect.left
    canvas.lastY = event.clientY - rect.top
  }, [])

  const handleSignaturePadMouseMove = useCallback((event) => {
    const canvas = signaturePadRef.current
    if (!canvas.isDrawing) return
    
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    
    ctx.lineTo(x, y)
    ctx.stroke()
    
    canvas.lastX = x
    canvas.lastY = y
  }, [])

  const handleSignaturePadMouseUp = useCallback(() => {
    const canvas = signaturePadRef.current
    if (canvas.isDrawing) {
      canvas.isDrawing = false
      setSignaturePadData(canvas.toDataURL())
    }
  }, [])

  // Effects
  useEffect(() => {
      renderPage()
  }, [renderPage])

  useEffect(() => {
    if (pdfDocument) {
      renderPage()
    }
  }, [pdfDocument, currentPage, scale, renderPage])

  // Re-render all pages when scale changes
  useEffect(() => {
    if (pdfDocument && allPages.length > 0) {
      renderAllPages(pdfDocument)
    }
  }, [scale, pdfDocument, renderAllPages])

  // Ensure consistent positioning when zoom changes
  useEffect(() => {
    // When zoom changes, we need to ensure elements maintain their relative positions
    // The coordinate system is already normalized, so no additional conversion is needed
    console.log('Zoom level changed to:', scale, 'Elements will maintain their positions')
  }, [scale])

  // Function to validate and fix coordinate consistency
  const validateElementCoordinates = useCallback(() => {
    console.log('Validating element coordinates...')
    
    const validatedElements = textElements.map(element => {
      const page = allPages.find(p => p.pageNum === element.page)
      if (!page) return element
      
      // Ensure coordinates are within page bounds
      const maxX = page.width / page.scale - element.width
      const maxY = page.height / page.scale - element.height
      
      const validatedElement = {
        ...element,
        x: Math.max(0, Math.min(maxX, element.x)),
        y: Math.max(0, Math.min(maxY, element.y))
      }
      
      if (validatedElement.x !== element.x || validatedElement.y !== element.y) {
        console.log('Fixed coordinates for element:', element.id, {
          from: { x: element.x, y: element.y },
          to: { x: validatedElement.x, y: validatedElement.y }
        })
      }
      
      return validatedElement
    })
    
    if (JSON.stringify(validatedElements) !== JSON.stringify(textElements)) {
      setTextElements(validatedElements)
      console.log('Element coordinates validated and updated')
    }
  }, [textElements, allPages])

  // Add global mouse event listeners for drag and resize
  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  // Handle container resize
  useEffect(() => {
    if (!containerRef.current) return
    
    const resizeObserver = new ResizeObserver(() => {
      if (pdfDocument) {
        renderPage()
      }
    })
    
    resizeObserver.observe(containerRef.current)
    
    return () => {
      resizeObserver.disconnect()
    }
  }, [pdfDocument, renderPage])

  // File drop handlers
  const handleFileDrop = useCallback((event) => {
    event.preventDefault()
    setIsDragging(false)
    
    const files = Array.from(event.dataTransfer.files)
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }, [handleFileUpload])

  const handleFileDragOver = useCallback((event) => {
    event.preventDefault()
    setIsDragging(true)
  }, [])

  const handleFileDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  if (!pdfFile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">Sign & Fill PDF</h1>
            <p className="text-xl text-gray-600">Upload your PDF to add signatures, fill forms, and more</p>
          </div>
          
          <div
            className={`border-3 border-dashed rounded-2xl p-16 text-center transition-all duration-300 ${
              isDragging 
                ? 'border-blue-500 bg-blue-50 scale-105' 
                : 'border-gray-300 bg-white hover:border-gray-400'
            }`}
            onDrop={handleFileDrop}
            onDragOver={handleFileDragOver}
            onDragLeave={handleFileDragLeave}
          >
            <div className="max-w-md mx-auto">
              <div className="mx-auto h-20 w-20 text-gray-400 mb-6">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
          </div>
          
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">Drop your PDF here</h3>
              <p className="text-gray-600 mb-8">or click to browse files</p>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={(e) => handleFileUpload(e.target.files[0])}
                className="hidden"
              />
              
            <button 
                onClick={() => fileInputRef.current?.click()}
                className="px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors duration-200 shadow-lg hover:shadow-xl"
              >
                Choose PDF File
            </button>
              
              <p className="text-sm text-gray-500 mt-4">PDF files up to 10MB</p>
          </div>
        </div>
          </div>
                </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              {/* File Info */}
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
              </div>
                <div>
                  <h2 className="font-semibold text-gray-900">{pdfFile.name}</h2>
                  <p className="text-sm text-gray-500">Page {currentPage} of {numPages}</p>
                </div>
            </div>
            


              {/* Zoom Controls */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setScale(prev => Math.max(0.5, prev - 0.2))}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                  </svg>
                </button>
                
                <span className="text-sm font-medium text-gray-700 w-16 text-center">
                  {Math.round(scale * 100)}%
                </span>
                
                  <button
                  onClick={() => setScale(prev => Math.min(4, prev + 0.2))}
                  className="p-2 rounded-lg hover:bg-gray-100"
                  >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                </svg>
                  </button>
                
                  <button
                  onClick={() => setScale(2)}
                  className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                  Reset to 200%
                  </button>
          </div>
        </div>
        
            {/* Action Buttons */}
            <div className="flex items-center space-x-4">
              {/* Sign Mode */}
                      <button 
                onClick={() => setMode(mode === 'sign' ? 'view' : 'sign')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  mode === 'sign'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Sign PDF
            </button>

              {/* Fill Mode */}
          <button 
                onClick={() => setMode(mode === 'fill' ? 'view' : 'fill')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  mode === 'fill'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Fill PDF
          </button>

              {/* Export */}
              <button
                onClick={exportPDF}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                Export PDF
              </button>

              {/* Debug: Validate Coordinates */}
              <button
                onClick={validateElementCoordinates}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 transition-colors text-sm"
                title="Validate and fix element coordinates"
              >
                Fix Positions
              </button>

              {/* Debug: Show Coordinate Info */}
              <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                Zoom: {Math.round(scale * 100)}% | Elements: {textElements.length}
              </div>
        </div>
      </div>

          {/* Mode-specific controls */}
          {mode === 'sign' && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-700">Signature:</span>
                
                {/* Signature Dropdown */}
                <div className="relative">
                  <select
                    value={selectedSignature?.id || ''}
                    onChange={(e) => {
                      const signature = signatures.find(s => s.id === parseInt(e.target.value))
                      setSelectedSignature(signature)
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select signature</option>
                    {signatures.map(signature => (
                      <option key={signature.id} value={signature.id}>
                        {signature.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Create Signature Button */}
                <button
                  onClick={() => setShowSignaturePad(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Sign
                </button>

                {/* Upload Signature Button */}
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Upload Sign
                </button>
              </div>
            </div>
          )}

          {mode === 'fill' && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-700">Text Options:</span>
                
                {/* Font Family */}
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {fontOptions.map(font => (
                    <option key={font.value} value={font.value}>{font.label}</option>
                  ))}
                </select>

                {/* Font Size */}
                <input
                  type="number"
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value) || 14)}
                  min="8"
                  max="72"
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                
                <span className="text-sm text-gray-500">px</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="h-[calc(100vh-120px)]">
        {/* PDF Viewer - Full Width */}
        <div 
          ref={containerRef}
          className="h-full bg-gray-100 overflow-auto p-4"
        >
          <div className="flex justify-center items-start w-full">
            <div className="relative bg-white shadow-lg rounded-lg overflow-hidden w-full max-w-6xl">
              {isRendering && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Rendering PDF...</p>
                  </div>
                </div>
              )}
              
              {/* Continuous PDF View */}
              <div 
                className="relative"
                style={{ height: `${totalHeight}px` }}
                onClick={handleCanvasClick}
              >
                {allPages.map((page, index) => (
                  <div
                    key={page.pageNum}
                    className="absolute left-0 right-0"
                    style={{ 
                      top: `${page.y}px`,
                      width: '100%',
                      height: `${page.height}px`
                    }}
                  >
                                         <img
                       src={page.canvas}
                       alt={`Page ${page.pageNum}`}
                       className="w-full h-full object-contain"
                       style={{ cursor: mode === 'view' ? 'default' : 'crosshair' }}
                     />
                     
                                         {/* Page number indicator */}
                    <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm font-medium">
                      Page {page.pageNum}
                    </div>
                    
                    
                     
                     {/* Page border indicator */}
                     <div className="absolute inset-0 border-2 border-transparent hover:border-blue-200 transition-colors pointer-events-none"></div>
                     
                     {/* Page break line */}
                     {page.pageNum < numPages && (
                       <div className="absolute -bottom-5 left-0 right-0 h-1 bg-gray-300"></div>
                     )}
                     
                     {/* Page separator with shadow */}
                     {page.pageNum < numPages && (
                       <div className="absolute -bottom-20 left-0 right-0 h-16 bg-gradient-to-b from-gray-100 to-transparent"></div>
                     )}
                  </div>
                ))}
              </div>
              
              {/* Text Elements Overlay */}
              {textElements.map(element => {
                // Find the page this element belongs to
                const page = allPages.find(p => p.pageNum === element.page)
                if (!page) return null
                
                return (
                  <div
                    key={element.id}
                    data-element-id={element.id}
                    className="absolute border-2 border-blue-500 bg-blue-50 bg-opacity-30"
                    style={{
                      left: element.x * page.scale + 16, // Add padding offset
                      top: page.y + element.y * page.scale + 16, // Add padding offset
                      width: element.width * page.scale,
                      height: element.height * page.scale,
                      cursor: 'move'
                    }}
                    onMouseDown={(e) => handleMouseDown(e, element.id, 'drag')}
                    onClick={() => handleTextElementClick(element)}
                    onDoubleClick={() => {
                      if (element.type === 'text') {
                        setEditingElement(element)
                        setSelectedTextElement(element)
                        setMode('fill')
                        setFontSize(element.fontSize)
                        setFontFamily(element.fontFamily)
                      }
                    }}
                  >
                    {element.type === 'signature' && (
                      <img
                        src={element.data}
                        alt="Signature"
                        className="w-full h-full object-contain"
                      />
                    )}
                    
                    {element.type === 'text' && (
                      <div className="w-full h-full flex items-center justify-center">
                        {editingElement?.id === element.id ? (
                          <input
                            type="text"
                            value={editingElement.text}
                            onChange={(e) => handleTextChange(element.id, e.target.value)}
                            className="w-full h-full bg-transparent border-none outline-none text-center"
                            style={{ 
                              fontSize: `${element.fontSize * page.scale}px`,
                              fontFamily: element.fontFamily
                            }}
                            autoFocus
                          />
                        ) : (
                          <span
                            className="text-center select-none"
                            style={{ 
                              fontSize: `${element.fontSize * page.scale}px`,
                              fontFamily: element.fontFamily
                            }}
                          >
                            {element.text}
                          </span>
                        )}
                      </div>
                    )}
                    
                    {/* Save Button - Show when editing or when it's a new text element */}
                    {(editingElement?.id === element.id || (element.type === 'text' && mode === 'fill')) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          console.log('Save button clicked for element:', element)
                          console.log('Current editingElement:', editingElement)
                          
                          // Save the element
                          const elementToSave = editingElement || element
                          console.log('Element to save:', elementToSave)
                          
                          setTextElements(prev => {
                            const updated = prev.map(el => 
                              el.id === elementToSave.id ? elementToSave : el
                            )
                            console.log('Updated text elements after save:', updated)
                            return updated
                          })
                          setEditingElement(null)
                          setSelectedTextElement(null)
                          setMode('view')
                          console.log('Element saved, edit mode exited')
                        }}
                        className="absolute -top-8 left-0 px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors"
                      >
                        Save
                      </button>
                    )}
                    
                    {/* Drag Handle */}
                    <div 
                      className="absolute -top-1 -left-1 w-4 h-4 bg-blue-500 cursor-move"
                      onMouseDown={(e) => handleMouseDown(e, element.id, 'drag')}
                    />
                    
                    {/* Remove Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeElement(element.id)
                      }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                    >
                      ×
                    </button>
                    
                    {/* Resize Handle */}
                    <div 
                      className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 cursor-se-resize"
                      onMouseDown={(e) => handleMouseDown(e, element.id, 'resize')}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Signature Pad Modal */}
      {showSignaturePad && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold text-gray-900">Create Signature</h3>
              <button
                onClick={() => setShowSignaturePad(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              </div>
            
            <div className="mb-6">
              <canvas
                ref={signaturePadRef}
                width={600}
                height={200}
                className="w-full border-2 border-gray-300 rounded-lg cursor-crosshair"
                onMouseDown={handleSignaturePadMouseDown}
                onMouseMove={handleSignaturePadMouseMove}
                onMouseUp={handleSignaturePadMouseUp}
                onMouseLeave={handleSignaturePadMouseUp}
              />
            </div>
            
            <div className="flex items-center justify-between">
                  <button 
                onClick={clearSignaturePad}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                Clear
                  </button>
              
              <div className="flex space-x-3">
                  <button 
                  onClick={() => setShowSignaturePad(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                  Cancel
                  </button>
                
                <button
                  onClick={createSignature}
                  disabled={!signaturePadData}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Save Signature
                </button>
              </div>
                </div>
                </div>
                </div>
              )}

      {/* Upload Signature Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold text-gray-900">Upload Signature</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
          </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select PNG or JPG file
              </label>
                <input
                  type="file"
                accept="image/*"
                onChange={handleSignatureUpload}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              </div>
          </div>
        </div>
      )}
    </div>
  )
}
