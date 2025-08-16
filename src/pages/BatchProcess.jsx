import React from 'react'
import FileProcessor from '../components/FileProcessor.jsx'
import { PDFDocument } from 'pdf-lib'

// Simple batch: re-save PDFs to normalize structure
export default function BatchProcess() {
  const handleBatch = async (files) => {
    const results = []
    for (const f of files) {
      const file = f.file
      const buf = await file.arrayBuffer()
      const doc = await PDFDocument.load(buf, { ignoreEncryption: true })
      const bytes = await doc.save({ useObjectStreams: false })
      results.push({ file: new Blob([bytes], { type: 'application/pdf' }), name: 'processed_' + file.name, type: 'pdf' })
    }
    if (results.length === 1) return results[0]
    return { type: 'multiple', files: results, name: 'batch_processed.zip' }
  }

  return (
    <FileProcessor
      title="Batch Process"
      description="Apply a quick normalization pass to many PDFs at once."
      acceptedFileTypes=".pdf"
      maxFiles={50}
      onProcess={handleBatch}
      processButtonText="Run Batch"
      showPreview={true}
      multipleFiles={true}
    />
  )
}



