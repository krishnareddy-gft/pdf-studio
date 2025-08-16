import React from 'react'
import FileProcessor from '../components/FileProcessor.jsx'
import * as pdfjsLib from 'pdfjs-dist/build/pdf'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { Document, Packer, Paragraph, TextRun } from 'docx'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

export default function PDFToWord() {
  const extractParagraphs = async (pdf) => {
    const paras = []
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      // naive text join; keeps basic spaces
      const joined = content.items.map(it => it.str).join(' ')
      // split by long gaps to simulate lines/paragraphs
      const lines = joined.split(/\s{2,}/).filter(Boolean)
      lines.forEach(l => paras.push(l))
      if (i !== pdf.numPages) paras.push('')
    }
    return paras
  }

  const buildDocx = async (paraStrings) => {
    const children = paraStrings.map(s => new Paragraph({ children: [new TextRun(s)] }))
    const doc = new Document({ sections: [{ properties: {}, children: children.length ? children : [new Paragraph('')] }] })
    return Packer.toBlob(doc)
  }

  const handlePdfToWord = async (files) => {
    const input = files[0].file
    const ab = await input.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: ab }).promise
    const paraStrings = await extractParagraphs(pdf)
    const blob = await buildDocx(paraStrings)
    const name = input.name.replace(/\.pdf$/i, '.docx')
    return { file: blob, name, type: 'docx' }
  }

  return (
    <FileProcessor
      title="PDF to Word (Basic)"
      description="Extracts plain text into a DOCX. Layout, images and tables are not preserved."
      acceptedFileTypes=".pdf"
      maxFiles={1}
      onProcess={handlePdfToWord}
      processButtonText="Convert to Word"
      showPreview={false}
      multipleFiles={false}
    />
  )
}


