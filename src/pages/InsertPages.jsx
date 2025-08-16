import React, { useState } from 'react'
import FileProcessor from '../components/FileProcessor.jsx'
import { PDFDocument } from 'pdf-lib'

export default function InsertPages() {
  const [position, setPosition] = useState('end') // 'start' | 'end' | 'after'
  const [afterPage, setAfterPage] = useState(0)

  const handleInsert = async (files) => {
    if (files.length < 2) throw new Error('Upload base PDF first, then pages to insert.')

    const base = files[0].file
    const inserts = files.slice(1).map(f => f.file)

    const baseBytes = await base.arrayBuffer()
    const baseDoc = await PDFDocument.load(baseBytes)

    const newDoc = await PDFDocument.create()

    const basePageIndices = baseDoc.getPageIndices()
    const afterIndex = position === 'start' ? -1 : position === 'end' ? basePageIndices.length - 1 : Math.min(Math.max(0, afterPage - 1), basePageIndices.length - 1)

    // copy pages before insertion point
    if (afterIndex >= 0) {
      const before = await newDoc.copyPages(baseDoc, basePageIndices.slice(0, afterIndex + 1))
      before.forEach(p => newDoc.addPage(p))
    }

    // add inserts
    for (const ins of inserts) {
      const ib = await ins.arrayBuffer()
      const idoc = await PDFDocument.load(ib, { ignoreEncryption: true })
      const pages = await newDoc.copyPages(idoc, idoc.getPageIndices())
      pages.forEach(p => newDoc.addPage(p))
    }

    // copy remaining base pages
    const start = afterIndex + 1
    if (start < basePageIndices.length) {
      const rest = await newDoc.copyPages(baseDoc, basePageIndices.slice(start))
      rest.forEach(p => newDoc.addPage(p))
    }

    const bytes = await newDoc.save({ useObjectStreams: false })
    return { file: new Blob([bytes], { type: 'application/pdf' }), name: 'inserted_' + files[0].name, type: 'pdf' }
  }

  return (
    <FileProcessor
      title="Insert Pages"
      description="Upload base PDF first, then PDFs to insert. Choose where to insert."
      acceptedFileTypes=".pdf"
      maxFiles={20}
      onProcess={handleInsert}
      processButtonText="Insert Pages"
      showPreview={true}
      multipleFiles={true}
      extraControls={() => (
        <div className="flex flex-wrap items-center justify-center gap-3">
          <span className="text-sm text-gray-700">Insert position:</span>
          <select value={position} onChange={e=>setPosition(e.target.value)} className="border rounded px-2 py-1 text-sm">
            <option value="start">Start</option>
            <option value="end">End</option>
            <option value="after">After page…</option>
          </select>
          {position === 'after' && (
            <input type="number" min={1} value={afterPage} onChange={e=>setAfterPage(parseInt(e.target.value||'1',10))} className="border rounded px-2 py-1 w-24 text-sm" placeholder="Page #" />
          )}
        </div>
      )}
    />
  )
}



