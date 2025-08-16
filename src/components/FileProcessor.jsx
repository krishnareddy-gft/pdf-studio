import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Upload, X, Plus, Download, Eye, FileText, Image, 
  Archive, CheckCircle, AlertCircle, Loader2, Trash2, Edit3
} from 'lucide-react'
import * as pdfjsLib from 'pdfjs-dist/build/pdf'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

export default function FileProcessor({ 
  title, 
  description, 
  acceptedFileTypes = "*", 
  maxFiles = 10,
  onProcess,
  processButtonText = "Process Files",
  showPreview = true,
  multipleFiles = true,
  extraControls = null,
  enableReorder = false
 }) {
  const [files, setFiles] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [processedFile, setProcessedFile] = useState(null)
  const [error, setError] = useState(null)
  const [previewLoading, setPreviewLoading] = useState({})
  const [customFilename, setCustomFilename] = useState('')
  const [isEditingFilename, setIsEditingFilename] = useState(false)
  const fileInputRef = useRef(null)
  const [outputPdfUrl, setOutputPdfUrl] = useState(null)

  // If a processed PDF doesn't have a preview yet, generate one
  useEffect(() => {
    const generateOutputPreview = async () => {
      if (processedFile && processedFile.type === 'pdf' && processedFile.file && !processedFile.preview) {
        try {
          const thumbUrl = await generatePdfThumbnail(processedFile.file, 320, 240)
          setProcessedFile(prev => ({ ...prev, preview: thumbUrl }))
        } catch (e) {
          console.warn('Failed to generate processed PDF preview:', e)
        }
      }
    }
    generateOutputPreview()
  }, [processedFile])

  // Maintain an object URL to embed PDF if no image preview is present
  useEffect(() => {
    if (processedFile && processedFile.type === 'pdf' && processedFile.file) {
      const url = URL.createObjectURL(processedFile.file)
      setOutputPdfUrl(url)
      return () => {
        URL.revokeObjectURL(url)
      }
    }
    setOutputPdfUrl(null)
  }, [processedFile])

  const handleFileSelect = (event) => {
    const selectedFiles = Array.from(event.target.files)
    const newFiles = selectedFiles.map(file => ({
      id: Date.now() + Math.random(),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      preview: null
    }))
    
    if (multipleFiles) {
      setFiles(prev => [...prev, ...newFiles].slice(0, maxFiles))
    } else {
      setFiles(newFiles.slice(0, 1))
    }
    setError(null)
    
    // Generate previews for the new files
    newFiles.forEach(generateFilePreview)
  }

  const generateFilePreview = async (fileObj) => {
    try {
      if (fileObj.type.startsWith('image/')) {
        // Image preview - simple and reliable
        fileObj.preview = URL.createObjectURL(fileObj.file)
        setFiles(prev => [...prev]) // Trigger re-render
      } else if (fileObj.type === 'application/pdf') {
        setPreviewLoading(prev => ({ ...prev, [fileObj.id]: true }))
        try {
          const thumbUrl = await generatePdfThumbnail(fileObj.file, 200, 150)
          fileObj.preview = thumbUrl
        } catch (e) {
          console.error('Failed to render PDF thumbnail:', e)
          fileObj.preview = 'pdf-icon'
        } finally {
          setPreviewLoading(prev => ({ ...prev, [fileObj.id]: false }))
          setFiles(prev => [...prev])
        }
      }
    } catch (error) {
      console.error('Error generating preview:', error)
      fileObj.preview = 'error'
      setPreviewLoading(prev => ({ ...prev, [fileObj.id]: false }))
    }
  }

  // Create a robust PDF thumbnail using PDF.js with devicePixelRatio for crispness
  const generatePdfThumbnail = async (blob, targetWidth = 200, targetHeight = 150) => {
    const arrayBuffer = await blob.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    const page = await pdf.getPage(1)

    const baseViewport = page.getViewport({ scale: 1 })
    const scaleToFit = Math.min(targetWidth / baseViewport.width, targetHeight / baseViewport.height)
    const renderViewport = page.getViewport({ scale: scaleToFit })

    const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1))

    // Render onto a page-sized offscreen canvas first
    const pageCanvas = document.createElement('canvas')
    const pageCtx = pageCanvas.getContext('2d')
    const pageW = Math.max(1, Math.floor(renderViewport.width * dpr))
    const pageH = Math.max(1, Math.floor(renderViewport.height * dpr))
    pageCanvas.width = pageW
    pageCanvas.height = pageH
    await page.render({ canvasContext: pageCtx, viewport: renderViewport, transform: [dpr, 0, 0, dpr, 0, 0] }).promise

    // Draw into a fixed-size thumbnail canvas, centered
    const thumbCanvas = document.createElement('canvas')
    const thumbCtx = thumbCanvas.getContext('2d')
    const tw = Math.max(1, Math.floor(targetWidth * dpr))
    const th = Math.max(1, Math.floor(targetHeight * dpr))
    thumbCanvas.width = tw
    thumbCanvas.height = th

    thumbCtx.fillStyle = '#ffffff'
    thumbCtx.fillRect(0, 0, tw, th)

    const drawW = pageW
    const drawH = pageH
    const offsetX = Math.floor((tw - drawW) / 2)
    const offsetY = Math.floor((th - drawH) / 2)
    thumbCtx.imageSmoothingEnabled = true
    thumbCtx.imageSmoothingQuality = 'high'
    thumbCtx.drawImage(pageCanvas, offsetX, offsetY, drawW, drawH)

    return thumbCanvas.toDataURL('image/jpeg', 0.9)
  }

  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
    setProcessedFile(null)
    setPreviewLoading(prev => {
      const newState = { ...prev }
      delete newState[fileId]
      return newState
    })
  }

  const addMoreFiles = () => {
    fileInputRef.current?.click()
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return Image
    if (fileType.includes('pdf')) return FileText
    return FileText
  }

  const renderFilePreview = (fileObj) => {
    console.log('Rendering preview for file:', fileObj.name, 'Preview:', fileObj.preview, 'Type:', fileObj.type)
    
    if (previewLoading[fileObj.id]) {
      console.log('Showing loading state for:', fileObj.name)
      return (
        <div className="w-full h-32 bg-gray-200 rounded-lg mb-3 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      )
    }

    if (fileObj.preview === 'pdf-icon') {
      console.log('Showing PDF icon for:', fileObj.name)
      return (
        <div className="w-full h-32 bg-gray-200 rounded-lg mb-3 flex items-center justify-center">
          <FileText className="w-12 h-12 text-gray-400" />
        </div>
      )
    } else if (fileObj.preview === 'error') {
      console.log('Showing error state for:', fileObj.name)
      return (
        <div className="w-full h-32 bg-red-100 rounded-lg mb-3 flex items-center justify-center">
          <AlertCircle className="w-12 h-12 text-red-400" />
        </div>
      )
    } else if (fileObj.preview === 'react-pdf-preview') {
      console.log('Showing React PDF preview for:', fileObj.name)
      return (
        <div className="w-full h-32 bg-white rounded-lg mb-3 border border-gray-200 relative overflow-hidden">
          {/* PDF Document Icon */}
          <div className="absolute top-3 left-3 w-24 h-16 bg-red-500 rounded relative">
            {/* White corner fold */}
            <div className="absolute top-0 right-0 w-4 h-4 bg-white transform rotate-45 origin-top-right"></div>
            
            {/* PDF Text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white text-xs font-bold">PDF</span>
            </div>
          </div>
          
          {/* Preview Text */}
          <div className="absolute top-6 left-32 text-xs font-medium text-gray-700">
            Preview
          </div>
          
          {/* Filename */}
          <div className="absolute bottom-8 left-3 text-xs font-medium text-gray-900 truncate max-w-32">
            {fileObj.name.substring(0, 25)}
          </div>
          
          {/* Page Indicator */}
          <div className="absolute bottom-3 left-3 text-xs text-gray-500">
            Page 1
          </div>
          
          {/* Content Lines */}
          <div className="absolute bottom-2 left-32 right-3 space-y-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-0.5 bg-gray-200"></div>
            ))}
          </div>
        </div>
      )
    } else if (fileObj.preview && fileObj.type.startsWith('image/')) {
      console.log('Showing image preview for:', fileObj.name)
      return (
        <div className="w-full h-32 bg-gray-200 rounded-lg mb-3 overflow-hidden">
          <img 
            src={fileObj.preview} 
            alt={fileObj.name}
            className="w-full h-full object-contain bg-white"
          />
        </div>
      )
    } else if (fileObj.preview && fileObj.type === 'application/pdf') {
      console.log('Showing PDF preview for:', fileObj.name, 'Preview data:', fileObj.preview.substring(0, 50) + '...')
      return (
        <div className="w-full h-32 bg-gray-200 rounded-lg mb-3 overflow-hidden">
          <img 
            src={fileObj.preview} 
            alt={fileObj.name}
            className="w-full h-full object-contain bg-white"
            onError={(e) => console.error('Image failed to load:', e)}
            onLoad={() => console.log('Image loaded successfully for:', fileObj.name)}
          />
        </div>
      )
    } else {
      console.log('Showing default icon for:', fileObj.name, 'No preview available')
      const FileIcon = getFileIcon(fileObj.type)
      return (
        <div className="w-full h-32 bg-gray-200 rounded-lg mb-3 flex items-center justify-center">
          <FileIcon className="w-12 h-12 text-gray-400" />
        </div>
      )
    }
  }

  const handleProcess = async () => {
    if (files.length === 0) {
      setError('Please upload at least one file')
      return
    }

    setIsProcessing(true)
    setError(null)
    
    try {
      const result = await onProcess(files)
      // If single PDF result, attach preview thumbnail
      if (result && result.type === 'pdf' && result.file instanceof Blob) {
        try {
          const thumbUrl = await generatePdfThumbnail(result.file, 256, 192)
          result.preview = thumbUrl
        } catch (e) {
          console.warn('Could not generate output PDF preview:', e)
        }
      }
      setProcessedFile(result)
      // Set default custom filename based on the processed file
      if (result && result.name) {
        const nameWithoutExt = result.name.replace(/\.[^/.]+$/, '')
        const extension = result.name.match(/\.[^/.]+$/)?.[0] || ''
        setCustomFilename(nameWithoutExt)
      }
    } catch (err) {
      setError(err.message || 'An error occurred while processing files')
    } finally {
      setIsProcessing(false)
    }
  }

  const getFileExtension = (filename) => {
    const match = filename.match(/\.[^/.]+$/)
    return match ? match[0] : ''
  }

  const handleDownload = () => {
    if (!processedFile) return

    if (processedFile.type === 'multiple' || processedFile.files?.length > 1) {
      // Create zip for multiple files
      createAndDownloadZip(processedFile.files)
    } else {
      // Download single file with custom filename
      const filename = customFilename.trim() ? `${customFilename.trim()}${getFileExtension(processedFile.name)}` : processedFile.name
      downloadFile(processedFile.file, filename)
    }
  }

  const createAndDownloadZip = async (files) => {
    try {
      const JSZip = (await import('jszip')).default
      const zip = new JSZip()
      
      files.forEach((file, index) => {
        zip.file(file.name, file)
      })
      
      const content = await zip.generateAsync({ type: 'blob' })
      const zipFilename = customFilename.trim() ? `${customFilename.trim()}.zip` : 'processed_files.zip'
      downloadFile(content, zipFilename)
    } catch (err) {
      console.error('Error creating zip:', err)
      setError('Error creating zip file')
    }
  }

  const downloadFile = (file, filename) => {
    const url = URL.createObjectURL(file)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const clearAll = () => {
    setFiles([])
    setProcessedFile(null)
    setError(null)
    setPreviewLoading({})
    setCustomFilename('')
    setIsEditingFilename(false)
  }

  const renderOutputPreview = () => {
    if (!processedFile) return null

    if (processedFile.type === 'multiple' || processedFile.files?.length > 1) {
      return (
        <div className="bg-white rounded-lg p-4 mb-4">
          <div className="text-center py-8">
            <Archive className="w-16 h-16 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">Multiple files processed successfully</p>
            <p className="text-sm text-gray-500 mt-1">Ready for ZIP download</p>
          </div>
        </div>
      )
    } else if (processedFile.type === 'pdf') {
      // Enhanced PDF output preview with actual content
      return (
        <div className="bg-white rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-700 font-medium">Preview of merged PDF</p>
            {outputPdfUrl && (
              <a
                href={outputPdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 text-sm hover:underline"
              >
                Open in new tab
              </a>
            )}
          </div>

          {processedFile.preview ? (
            <div className="w-full mb-4 bg-gray-100 rounded-lg overflow-hidden" style={{ height: '70vh' }}>
              <img 
                src={processedFile.preview} 
                alt="Processed PDF"
                className="w-full h-full object-contain bg-white"
              />
            </div>
          ) : outputPdfUrl ? (
            <div className="w-full mb-4 rounded-lg overflow-hidden border border-gray-200" style={{ height: '70vh' }}>
              <iframe title="pdf-preview" src={outputPdfUrl} className="w-full h-full" />
            </div>
          ) : (
            // Fallback to PDF icon
            <div className="w-32 h-24 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="w-24 h-16 bg-red-500 rounded relative">
                <div className="absolute top-0 right-0 w-4 h-4 bg-white transform rotate-45 origin-top-right"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">PDF</span>
                </div>
              </div>
            </div>
          )}

          <p className="text-gray-600 font-medium">PDF processed successfully</p>
          <p className="text-sm text-gray-500 mt-1">Ready for download</p>
          <p className="text-xs text-gray-400 mt-2">File: {processedFile.name}</p>
        </div>
      )
    } else if (processedFile.type === 'image') {
      return (
        <div className="bg-white rounded-lg p-4 mb-4">
          <img 
            src={URL.createObjectURL(processedFile.file)} 
            alt="Processed result"
            className="max-w-full h-auto rounded-lg mx-auto"
          />
        </div>
      )
    } else {
      return (
        <div className="bg-white rounded-lg p-4 mb-4">
          <div className="text-center py-8">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">File processed successfully</p>
            <p className="text-sm text-gray-500 mt-1">Ready for download</p>
          </div>
        </div>
      )
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
        <p className="text-gray-600">{description}</p>
      </div>

      {/* Main Processing Box */}
      <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-6 transition-all duration-300 hover:border-blue-400">
        
        {/* File Upload Area */}
        {files.length === 0 && (
          <div className="text-center py-12">
            <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload your files</h3>
            <p className="text-gray-600 mb-6">Drag and drop files here or click to browse</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Choose Files
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple={multipleFiles}
              accept={acceptedFileTypes}
              onChange={handleFileSelect}
              className="hidden"
            />
            
            
          </div>
        )}

        {/* Uploaded Files Display */}
        {files.length > 0 && (
          <div className="space-y-4">
            {/* Files Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {files.map((file, index) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200 relative group"
                  draggable={enableReorder}
                  onDragStart={(e)=>{ if(!enableReorder) return; e.dataTransfer.setData('text/plain', String(index)) }}
                  onDragOver={(e)=>{ if(!enableReorder) return; e.preventDefault() }}
                  onDrop={(e)=>{ if(!enableReorder) return; e.preventDefault(); const from = Number(e.dataTransfer.getData('text/plain')); const to = index; if(Number.isNaN(from) || from===to) return; setFiles(prev=>{ const arr=[...prev]; const [moved]=arr.splice(from,1); arr.splice(to,0,moved); return arr; }) }}
                >
                  {/* File Preview */}
                  {renderFilePreview(file)}
                  
                  {/* File Info */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900 text-sm truncate" title={file.name}>
                      {file.name}
                    </h4>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                  
                  {/* Remove Button */}
                  <button
                    onClick={() => removeFile(file.id)}
                    className="absolute top-2 right-2 p-1 bg-red-100 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </div>

            {/* Extra Controls (e.g., compression level) */}
            {extraControls && (
              <div className="pt-2">
                {extraControls({ files, setFiles })}
              </div>
            )}

            {/* Add More Files Button */}
            {multipleFiles && files.length < maxFiles && (
              <div className="text-center">
                <button
                  onClick={addMoreFiles}
                  className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add More Files
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={acceptedFileTypes}
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            )}

            {/* Process Button */}
            <div className="text-center pt-4">
              <button
                onClick={handleProcess}
                disabled={isProcessing}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    {processButtonText}
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-700">{error}</span>
          </motion.div>
        )}

        {/* Processed File Preview */}
        {processedFile && showPreview && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-6 bg-green-50 border border-green-200 rounded-lg"
          >
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <h3 className="text-lg font-semibold text-green-900">Processing Complete!</h3>
            </div>
            
            {/* Output Preview Content */}
            {renderOutputPreview()}

            {/* Report / Meta */}
            {processedFile?.meta?.report && (
              <div className="mt-3 mb-2">
                <h4 className="font-semibold text-sm text-gray-800 mb-1">Details</h4>
                <div className="text-xs text-gray-700 space-y-1">
                  {(Array.isArray(processedFile.meta.report) ? processedFile.meta.report : [processedFile.meta.report]).map((r,idx)=>{
                    const saved = (r.original ?? 0) - (r.compressed ?? 0)
                    const pct = r.original ? Math.max(0, Math.round((saved / r.original) * 100)) : 0
                    const fmt = (b) => (b/1024/1024).toFixed(2) + ' MB'
                    return (
                      <div key={idx}>{r.name}: {fmt(r.original)} → {fmt(r.compressed)} (−{pct}%)</div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Download Button */}
            <div className="flex items-center gap-3">
              {/* Filename Editor */}
              <div className="flex items-center gap-2">
                {isEditingFilename ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={customFilename}
                      onChange={(e) => setCustomFilename(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter filename"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setIsEditingFilename(false)
                        } else if (e.key === 'Escape') {
                          setIsEditingFilename(false)
                          setCustomFilename(processedFile.name.replace(/\.[^/.]+$/, ''))
                        }
                      }}
                      onBlur={() => setIsEditingFilename(false)}
                    />
                    <button
                      onClick={() => setIsEditingFilename(false)}
                      className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      ✓
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsEditingFilename(true)}
                    className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Edit filename"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span className="text-xs">
                      {customFilename.trim() ? `${customFilename.trim()}${getFileExtension(processedFile.name)}` : processedFile.name}
                    </span>
                  </button>
                )}
              </div>

              <button
                onClick={handleDownload}
                className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                {processedFile.type === 'multiple' || processedFile.files?.length > 1 ? 
                  (customFilename.trim() ? `Download ${customFilename.trim()}.zip` : 'Download ZIP') : 
                  'Download File'}
              </button>
              
              <button
                onClick={clearAll}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
