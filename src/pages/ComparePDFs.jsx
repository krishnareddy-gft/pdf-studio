import React, { useState } from 'react'
import FileProcessor from '../components/FileProcessor.jsx'
import * as pdfjsLib from 'pdfjs-dist/build/pdf'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

export default function ComparePDFs() {
  const [diffPages, setDiffPages] = useState([])

  const handleCompare = async (files) => {
    if (files.length !== 2) throw new Error('Upload exactly two PDFs to compare')
    const [a, b] = files.map(f => f.file)
    const [abuf, bbuf] = await Promise.all([a.arrayBuffer(), b.arrayBuffer()])
    const [adoc, bdoc] = await Promise.all([
      pdfjsLib.getDocument({ data: abuf }).promise,
      pdfjsLib.getDocument({ data: bbuf }).promise
    ])

    const maxPages = Math.max(adoc.numPages, bdoc.numPages)
    const diffs = []
    for (let i = 1; i <= maxPages; i++) {
      const [ap, bp] = await Promise.all([
        i <= adoc.numPages ? adoc.getPage(i) : null,
        i <= bdoc.numPages ? bdoc.getPage(i) : null
      ])
      if (!ap || !bp) { diffs.push(i); continue }
      const [ac, bc] = await Promise.all([ap.getTextContent(), bp.getTextContent()])
      const at = ac.items.map(it => it.str).join(' ')
      const bt = bc.items.map(it => it.str).join(' ')
      if (at !== bt) diffs.push(i)
    }
    setDiffPages(diffs)
    // Return no new file; preserve first file for convenience
    return { file: a, name: a.name, type: 'pdf', meta: { report: `Differences on pages: ${diffs.join(', ') || 'none'}` } }
  }

  return (
    <FileProcessor
      title="Compare PDFs"
      description={diffPages.length ? `Differences on pages: ${diffPages.join(', ')}` : 'Upload two PDFs to compare text differences by page.'}
      acceptedFileTypes=".pdf"
      maxFiles={2}
      onProcess={handleCompare}
      processButtonText="Compare"
      showPreview={true}
      multipleFiles={true}
    />
  )
}



