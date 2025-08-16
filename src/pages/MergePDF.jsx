
import React from 'react'
import FileProcessor from '../components/FileProcessor.jsx'
import { PDFDocument } from 'pdf-lib'

export default function MergePDF({ navigate }) {
  const handleMergePDFs = async (files) => {
    try {
      // Create a new PDF document
      const mergedPdf = await PDFDocument.create()
      
      // Process each PDF file
      for (const fileObj of files) {
        const file = fileObj.file
        const arrayBuffer = await file.arrayBuffer()
        const pdf = await PDFDocument.load(arrayBuffer)
        
        // Copy all pages from the current PDF
        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())
        
        // Add each page to the merged PDF
        pages.forEach((page) => {
          mergedPdf.addPage(page)
        })
      }
      
      // Generate the merged PDF
      const mergedPdfBytes = await mergedPdf.save()
      
      // Create a blob from the merged PDF
      const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' })
      
      // Generate a preview thumbnail for the processed file
      let preview = null
      try {
        const pdfjsLib = await import('pdfjs-dist')
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
        
        const pdf = await pdfjsLib.getDocument({ data: mergedPdfBytes }).promise
        const page = await pdf.getPage(1)
        
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        const viewport = page.getViewport({ scale: 1 })
        const scale = Math.min(128 / viewport.width, 96 / viewport.height)
        const scaledViewport = page.getViewport({ scale })
        
        canvas.width = 128
        canvas.height = 96
        
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, 128, 96)
        
        const offsetX = (128 - scaledViewport.width) / 2
        const offsetY = (96 - scaledViewport.height) / 2
        
        await page.render({
          canvasContext: ctx,
          viewport: scaledViewport,
          transform: [1, 0, 0, 1, offsetX, offsetY]
        }).promise
        
        preview = canvas.toDataURL('image/jpeg', 0.9)
      } catch (error) {
        console.log('Could not generate output preview:', error)
      }
      
      return {
        file: blob,
        name: 'merged_document.pdf',
        type: 'pdf',
        preview: preview
      }
    } catch (error) {
      throw new Error('Failed to merge PDF files: ' + error.message)
    }
  }

  return (
    <FileProcessor
      title="Merge PDF Files"
      description="Combine multiple PDF documents into a single file. Drag to reorder before merging."
      acceptedFileTypes=".pdf"
      maxFiles={20}
      onProcess={handleMergePDFs}
      processButtonText="Merge PDFs"
      showPreview={true}
      multipleFiles={true}
      enableReorder={true}
      extraControls={({ files }) => (
        <div className="text-center text-xs text-gray-600">Tip: Drag & drop cards to arrange order before merging.</div>
      )}
    />
  )
}
