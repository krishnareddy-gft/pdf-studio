import React, { useState } from 'react'
import FileProcessor from '../components/FileProcessor.jsx'
import * as pdfjsLib from 'pdfjs-dist/build/pdf'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

export default function SearchPDF() {
  const [query, setQuery] = useState('')
  const [matches, setMatches] = useState([])

  const handleSearch = async (files) => {
    if (!query.trim()) throw new Error('Enter a search query')
    const f = files[0]?.file
    if (!f) throw new Error('Upload one PDF to search')

    const buf = await f.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise
    const results = []
    const lower = query.toLowerCase()

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      const text = content.items.map(it => it.str).join(' ')
      if (text.toLowerCase().includes(lower)) results.push(i)
    }

    setMatches(results)
    // This tool doesn’t output a file; we just display results and return the original file for download convenience
    return { file: f, name: f.name, type: 'pdf', meta: { report: `Found on pages: ${results.join(', ') || 'none'}` } }
  }

  return (
    <FileProcessor
      title="Search PDF"
      description={matches.length ? `Found on pages: ${matches.join(', ')}` : 'Find where text appears inside your PDF.'}
      acceptedFileTypes=".pdf"
      maxFiles={1}
      onProcess={handleSearch}
      processButtonText="Search"
      showPreview={true}
      multipleFiles={false}
      extraControls={() => (
        <div className="flex items-center justify-center gap-3">
          <input value={query} onChange={e=>setQuery(e.target.value)} className="border rounded px-2 py-1 text-sm w-64" placeholder="Search text" />
        </div>
      )}
    />
  )
}



