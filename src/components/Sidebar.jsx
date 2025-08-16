
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Layers, Images, Scissors, Edit3, ShieldCheck, Wrench, 
  FileText, Split, RotateCcw, Search, Download, Upload,
  X, Home, FileCheck, Palette, Lock, Eye, Settings
} from 'lucide-react'

const categories = [
  {
    key: 'home',
    label: 'Home',
    icon: Home,
    items: [
      { key: 'home', label: 'Dashboard', desc: 'All tools overview' }
    ]
  },
  {
    key: 'convert',
    label: 'Convert',
    icon: Images,
    items: [
      { key: 'imagetopdf', label: 'Image → PDF', desc: 'Convert JPG/PNG to PDF' },
      { key: 'pdftoimages', label: 'PDF → Images', desc: 'Export PDF as PNG/JPG' },
      { key: 'wordtopdf', label: 'Word → PDF', desc: 'Convert DOC/DOCX to PDF' },
      { key: 'pdftoword', label: 'PDF → Word', desc: 'Convert PDF to DOCX' },
      { key: 'exceltopdf', label: 'Excel → PDF', desc: 'Convert XLS/XLSX to PDF' },
      { key: 'pdftoexcel', label: 'PDF → Excel', desc: 'Convert PDF to XLSX' },
      { key: 'ppttopdf', label: 'PowerPoint → PDF', desc: 'Convert PPT/PPTX to PDF' },
      { key: 'pdftoppt', label: 'PDF → PowerPoint', desc: 'Convert PDF to PPTX' },
      { key: 'htmltopdf', label: 'HTML → PDF', desc: 'Convert web pages to PDF' },
      { key: 'texttopdf', label: 'Text → PDF', desc: 'Convert TXT files to PDF' }
    ]
  },
  {
    key: 'organize',
    label: 'Organize',
    icon: Layers,
    items: [
      { key: 'merge', label: 'Merge PDFs', desc: 'Combine multiple PDFs' },
      { key: 'split', label: 'Split PDF', desc: 'Split PDF into multiple files' },
      { key: 'organize', label: 'Reorder/Rotate', desc: 'Rearrange and rotate pages' },
      { key: 'extract', label: 'Extract Pages', desc: 'Extract specific pages' },
      { key: 'insert', label: 'Insert Pages', desc: 'Insert pages into PDF' },
      { key: 'delete', label: 'Delete Pages', desc: 'Remove unwanted pages' },
      { key: 'bookmarks', label: 'Add Bookmarks', desc: 'Create PDF bookmarks' },
      { key: 'outline', label: 'PDF Outline', desc: 'Generate table of contents' }
    ]
  },
  {
    key: 'edit',
    label: 'Edit',
    icon: Edit3,
    items: [
      { key: 'edittext', label: 'Edit Text', desc: 'Modify PDF text content' },
      { key: 'editimages', label: 'Edit Images', desc: 'Modify PDF images' },
      { key: 'addtext', label: 'Add Text', desc: 'Insert new text blocks' },
      { key: 'addimages', label: 'Add Images', desc: 'Insert images into PDF' },
      { key: 'highlight', label: 'Highlight Text', desc: 'Highlight important text' },
      { key: 'underline', label: 'Underline Text', desc: 'Underline text content' },
      { key: 'strikethrough', label: 'Strike Text', desc: 'Strike through text' },
      { key: 'draw', label: 'Draw & Annotate', desc: 'Freehand drawing tools' }
    ]
  },
  {
    key: 'compress',
    label: 'Compress & OCR',
    icon: Scissors,
    items: [
      { key: 'compress', label: 'Compress PDF', desc: 'Reduce file size' },
      { key: 'ocr', label: 'OCR PDF', desc: 'Extract text from images' },
      { key: 'optimize', label: 'Optimize PDF', desc: 'Improve PDF quality' },
      { key: 'reduce', label: 'Reduce Size', desc: 'Advanced compression' },
      { key: 'quality', label: 'Quality Settings', desc: 'Customize compression' }
    ]
  },
  {
    key: 'sign',
    label: 'Sign & Security',
    icon: ShieldCheck,
    items: [
      { key: 'sign', label: 'eSign PDF', desc: 'Digital signatures' },
      { key: 'certificate', label: 'Certificate Sign', desc: 'Certificate-based signing' },
      { key: 'password', label: 'Password Protect', desc: 'Add password security' },
      { key: 'encrypt', label: 'Encrypt PDF', desc: 'Advanced encryption' },
      { key: 'permissions', label: 'Set Permissions', desc: 'Control access rights' },
      { key: 'watermark', label: 'Add Watermark', desc: 'Brand your documents' },
      { key: 'redact', label: 'Redact Content', desc: 'Remove sensitive info' }
    ]
  },
  {
    key: 'tools',
    label: 'More Tools',
    icon: Wrench,
    items: [
      { key: 'compare', label: 'Compare PDFs', desc: 'Find differences' },
      { key: 'search', label: 'Search PDF', desc: 'Find text in PDF' },
      { key: 'forms', label: 'Fill Forms', desc: 'Complete PDF forms' },
      { key: 'flatten', label: 'Flatten PDF', desc: 'Make uneditable' },
      { key: 'metadata', label: 'Edit Metadata', desc: 'Modify PDF info' },
      { key: 'repair', label: 'Repair PDF', desc: 'Fix corrupted files' },
      { key: 'validate', label: 'Validate PDF', desc: 'Check PDF compliance' },
      { key: 'batch', label: 'Batch Process', desc: 'Process multiple files' }
    ]
  }
]

export default function Sidebar({ onNavigate, active, isMobile, isOpen, onClose }) {
  const [openCategory, setOpenCategory] = useState('home')

  // Mobile sidebar
  if (isMobile) {
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-white to-gray-50 border-r border-zinc-200 z-50 shadow-2xl"
          >
            <div className="p-3 overflow-y-auto h-full">
              {categories.map(cat => (
                <div key={cat.key} className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-800 text-sm">{cat.label}</h3>
                  </div>
                  <nav className="flex flex-col gap-1">
                    {cat.items.map(item => (
                      <button
                        key={item.key}
                        onClick={() => onNavigate(item.key)}
                        className={`text-left px-2 py-1.5 rounded-lg hover:bg-blue-50 transition ${
                          active === item.key ? 'bg-blue-100 text-blue-700 border-l-2 border-blue-600' : 'hover:text-blue-600'
                        }`}
                      >
                        <div className="font-medium text-xs">{item.label}</div>
                        <div className="text-xs text-gray-500">{item.desc}</div>
                      </button>
                    ))}
                  </nav>
                </div>
              ))}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    )
  }

  // Desktop sidebar - Much thinner with compact layout
  return (
    <aside className="h-screen sticky top-0 w-48 bg-gradient-to-b from-white to-gray-50 border-r border-zinc-200 overflow-y-auto">
      <div className="p-3">
        {categories.map(cat => (
          <div key={cat.key} className="mb-4">
            {/* Category Header */}
            {cat.key === 'home' ? (
              // Home category - no dropdown, direct navigation
              <button
                onClick={() => onNavigate('home')}
                className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-blue-50 transition-colors mb-2"
              >
                <div className={`p-1.5 rounded-md ${active === 'home' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                  <cat.icon className="w-3.5 h-3.5" />
                </div>
                <span className="font-semibold text-gray-800 text-xs">{cat.label}</span>
              </button>
            ) : (
              // Other categories - with dropdown functionality
              <>
                <button
                  onClick={() => setOpenCategory(openCategory === cat.key ? null : cat.key)}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-blue-50 transition-colors mb-2"
                >
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-md ${openCategory === cat.key ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                      <cat.icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-semibold text-gray-800 text-xs">{cat.label}</span>
                  </div>
                  <div className={`transform transition-transform duration-200 ${openCategory === cat.key ? 'rotate-180' : ''}`}>
                    <svg className="w-2.5 h-2.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                
                {/* Category Items */}
                <AnimatePresence>
                  {openCategory === cat.key && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <nav className="flex flex-col gap-1 pl-6">
                        {cat.items.map(item => (
                          <button
                            key={item.key}
                            onClick={() => onNavigate(item.key)}
                            className={`text-left px-2 py-1.5 rounded-md hover:bg-blue-50 transition-colors ${
                              active === item.key ? 'bg-blue-100 text-blue-700 border-l-2 border-blue-600' : 'hover:text-blue-600'
                            }`}
                          >
                            <div className="font-medium text-xs leading-tight">{item.label}</div>
                            <div className="text-xs text-gray-500 mt-0.5 leading-tight">{item.desc}</div>
                          </button>
                        ))}
                      </nav>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </div>
        ))}
      </div>
    </aside>
  )
}
