import React, { useState } from 'react'
import FileProcessor from '../components/FileProcessor.jsx'
import { PDFDocument } from 'pdf-lib'

function parsePages(input) {
  const set = new Set()
  const parts = (input || '').split(',').map(s=>s.trim()).filter(Boolean)
  for (const p of parts) {
    if (p.includes('-')) {
      const [a,b] = p.split('-').map(n=>parseInt(n,10))
      if (!isNaN(a) && !isNaN(b)) for (let i=Math.min(a,b); i<=Math.max(a,b); i++) set.add(i)
    } else {
      const n = parseInt(p,10)
      if (!isNaN(n)) set.add(n)
    }
  }
  return set
}

export default function DeletePages() {
  const [pages, setPages] = useState('')

  const handleDelete = async (files) => {
    if (files.length !== 1) throw new Error('Upload exactly one PDF')
    const src = files[0].file
    const buf = await src.arrayBuffer()
    const doc = await PDFDocument.load(buf, { ignoreEncryption: true })
    const toRemove = parsePages(pages)
    const out = await PDFDocument.create()
    const keep = doc.getPageIndices().filter(i => !toRemove.has(i+1))
    const copied = await out.copyPages(doc, keep)
    copied.forEach(p => out.addPage(p))
    const bytes = await out.save({ useObjectStreams: false })
    return { file: new Blob([bytes], { type: 'application/pdf' }), name: 'deleted_' + files[0].name, type: 'pdf' }
  }

  return (
    <FileProcessor
      title="Delete Pages"
      description="Remove pages by listing numbers or ranges (e.g., 1,3,5-8)."
      acceptedFileTypes=".pdf"
      maxFiles={1}
      onProcess={handleDelete}
      processButtonText="Delete Pages"
      showPreview={true}
      multipleFiles={false}
      extraControls={() => (
        <div className="flex items-center justify-center gap-3">
          <span className="text-sm text-gray-700">Pages to delete:</span>
          <input value={pages} onChange={e=>setPages(e.target.value)} className="border rounded px-2 py-1 text-sm w-64" placeholder="e.g., 1,2,5-7" />
        </div>
      )}
    />
  )
}



