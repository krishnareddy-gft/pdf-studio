
import React from 'react'
import FileProcessor from '../components/FileProcessor.jsx'
import { PDFDocument } from 'pdf-lib'

export default function ImageToPDF({ navigate }) {
  const handleImageToPDF = async (files) => {
    try {
      // Create a new PDF document
      const pdfDoc = await PDFDocument.create()
      
      // Process each image file
      for (const fileObj of files) {
        const file = fileObj.file
        
        // Convert image to base64
        const arrayBuffer = await file.arrayBuffer()
        const uint8Array = new Uint8Array(arrayBuffer)
        
        // Embed the image in the PDF
        let image
        if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
          image = await pdfDoc.embedJpg(uint8Array)
        } else if (file.type === 'image/png') {
          image = await pdfDoc.embedPng(uint8Array)
        } else {
          throw new Error(`Unsupported image type: ${file.type}`)
        }
        
        // Get image dimensions
        const { width, height } = image.scale(1)
        
        // Create a page with the image dimensions
        const page = pdfDoc.addPage([width, height])
        
        // Draw the image on the page
        page.drawImage(image, {
          x: 0,
          y: 0,
          width: width,
          height: height,
        })
      }
      
      // Generate the PDF
      const pdfBytes = await pdfDoc.save()
      
      // Create a blob from the PDF
      const blob = new Blob([pdfBytes], { type: 'application/pdf' })
      
      return {
        file: blob,
        name: files.length === 1 ? 'converted_image.pdf' : 'converted_images.pdf',
        type: 'pdf'
      }
    } catch (error) {
      throw new Error('Failed to convert images to PDF: ' + error.message)
    }
  }

  return (
    <FileProcessor
      title="Convert Images to PDF"
      description="Transform your JPG, PNG, and other image files into a professional PDF document. Each image will be on its own page."
      acceptedFileTypes="image/*"
      maxFiles={50}
      onProcess={handleImageToPDF}
      processButtonText="Convert to PDF"
      showPreview={true}
      multipleFiles={true}
    />
  )
}
