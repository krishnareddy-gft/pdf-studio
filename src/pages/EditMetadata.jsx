import React, { useState } from 'react'
import FileProcessor from '../components/FileProcessor.jsx'
import { PDFDocument } from 'pdf-lib'

export default function EditMetadata() {
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [subject, setSubject] = useState('')
  const [keywords, setKeywords] = useState('')

  const handleMeta = async (files) => {
    const results = []
    for (const f of files) {
      const file = f.file
      const buf = await file.arrayBuffer()
      const doc = await PDFDocument.load(buf, { ignoreEncryption: true })
      if (title) doc.setTitle(title)
      if (author) doc.setAuthor(author)
      if (subject) doc.setSubject(subject)
      if (keywords) doc.setKeywords(keywords.split(',').map(s=>s.trim()).filter(Boolean))
      const bytes = await doc.save({ useObjectStreams: false })
      results.push({ file: new Blob([bytes], { type: 'application/pdf' }), name: 'meta_' + file.name, type: 'pdf' })
    }
    if (results.length === 1) return results[0]
    return { type: 'multiple', files: results, name: 'metadata_pdfs.zip' }
  }

  return (
    <FileProcessor
      title="Edit Metadata"
      description="Update title, author, subject and keywords."
      acceptedFileTypes=".pdf"
      maxFiles={20}
      onProcess={handleMeta}
      processButtonText="Apply Metadata"
      showPreview={true}
      multipleFiles={true}
      extraControls={() => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input value={title} onChange={e=>setTitle(e.target.value)} className="border rounded px-2 py-1 text-sm" placeholder="Title" />
          <input value={author} onChange={e=>setAuthor(e.target.value)} className="border rounded px-2 py-1 text-sm" placeholder="Author" />
          <input value={subject} onChange={e=>setSubject(e.target.value)} className="border rounded px-2 py-1 text-sm" placeholder="Subject" />
          <input value={keywords} onChange={e=>setKeywords(e.target.value)} className="border rounded px-2 py-1 text-sm" placeholder="Keywords (comma-separated)" />
        </div>
      )}
    />
  )
}



