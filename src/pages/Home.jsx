
import React from 'react'
import ToolCard from '../components/ToolCard.jsx'
import { 
  FileText, Images, Layers, Edit3, Scissors, ShieldCheck,
  ArrowRight, Star, Zap, Shield, Palette, Clock
} from 'lucide-react'

export default function Home({ navigate }) {
  const categories = [
    {
      id: 'convert',
      title: 'Convert',
      icon: Images,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      tools: [
        { key: 'imagetopdf', title: 'Image → PDF', desc: 'Convert JPG/PNG to PDF' },
        { key: 'pdftoimages', title: 'PDF → Images', desc: 'Export PDF as PNG/JPG' },
        { key: 'wordtopdf', title: 'Word → PDF', desc: 'Convert DOC/DOCX to PDF' },
        { key: 'pdftoword', title: 'PDF → Word', desc: 'Convert PDF to DOCX' }
      ]
    },
    {
      id: 'organize',
      title: 'Organize',
      icon: Layers,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      tools: [
        { key: 'merge', title: 'Merge PDFs', desc: 'Combine multiple PDFs' },
        { key: 'split', title: 'Split PDF', desc: 'Split PDF into multiple files' },
        { key: 'extract', title: 'Extract Pages', desc: 'Extract specific pages' }
      ]
    },
    {
      id: 'edit',
      title: 'Edit',
      icon: Edit3,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      tools: [
        { key: 'edittext', title: 'Edit Text', desc: 'Modify PDF text content' },
        { key: 'addtext', title: 'Add Text', desc: 'Insert new text blocks' },
        { key: 'highlight', title: 'Highlight Text', desc: 'Highlight important text' }
      ]
    },
    {
      id: 'compress',
      title: 'Compress & OCR',
      icon: Scissors,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      tools: [
        { key: 'compress', title: 'Compress PDF', desc: 'Reduce file size while maintaining quality' },
        { key: 'ocr', title: 'OCR PDF', desc: 'Extract text from images' },
        { key: 'optimize', title: 'Optimize PDF', desc: 'Improve PDF quality' },
        { key: 'reduce', title: 'Reduce Size', desc: 'Advanced compression options' }
      ]
    },
    {
      id: 'sign',
      title: 'Sign & Security',
      icon: ShieldCheck,
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      tools: [
        { key: 'sign', title: 'eSign PDF', desc: 'Add digital signatures' },
        { key: 'password', title: 'Password Protect', desc: 'Add password security' },
        { key: 'watermark', title: 'Add Watermark', desc: 'Brand your documents' },
        { key: 'encrypt', title: 'Encrypt PDF', desc: 'Advanced encryption' },
        { key: 'lockpdf', title: 'Lock PDF', desc: 'Add password protection' },
        { key: 'unlockpdf', title: 'Unlock PDF', desc: 'Remove password protection' }
      ]
    },
    {
      id: 'tools',
      title: 'Tools & Maintenance',
      icon: Clock,
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      tools: [
        { key: 'repairpdf', title: 'Repair PDF', desc: 'Fix corrupted or damaged files' },
        { key: 'organize', title: 'Reorder/Rotate', desc: 'Rearrange and rotate pages' }
      ]
    },

  ]

  // Popular tools selection - first 4 must be: Merge, Compress, Split, eSign
  const popularTools = [
    // Top 4 most important tools (must be first)
    { key: 'merge', title: 'Merge PDFs', desc: 'Combine multiple PDFs', category: 'organize' },
    { key: 'compress', title: 'Compress PDF', desc: 'Reduce file size while maintaining quality', category: 'compress' },
    { key: 'split', title: 'Split PDF', desc: 'Split PDF into multiple files', category: 'organize' },
    { key: 'sign', title: 'eSign PDF', desc: 'Add digital signatures', category: 'sign' },
    
    // Second 4 tools: Edit Text, Highlight Text, Image to PDF, Word to PDF
    { key: 'edittext', title: 'Edit Text', desc: 'Modify PDF text content', category: 'edit' },
    { key: 'highlight', title: 'Highlight Text', desc: 'Highlight important text', category: 'edit' },
    { key: 'imagetopdf', title: 'Image → PDF', desc: 'Convert JPG/PNG to PDF', category: 'convert' },
    { key: 'wordtopdf', title: 'Word → PDF', desc: 'Convert DOC/DOCX to PDF', category: 'convert' },
    
    // Additional popular tools
    { key: 'pdftoword', title: 'PDF → Word', desc: 'Convert PDF to DOCX', category: 'convert' },
    { key: 'unlockpdf', title: 'Unlock PDF', desc: 'Remove password protection', category: 'security' },
    { key: 'lockpdf', title: 'Lock PDF', desc: 'Add password security', category: 'security' },
    { key: 'repairpdf', title: 'Repair PDF', desc: 'Fix corrupted files', category: 'tools' }
  ]

  return (
    <div className="space-y-5">
      {/* Smaller, tighter Welcome Section (no badge, zero top padding) */}
      <div className="text-center space-y-3 pt-0 pb-2">
        <h1 className="text-xl lg:text-3xl font-bold text-gray-900">
          Welcome to <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">PDF HelpDesk</span>
        </h1>
        <p className="text-sm text-gray-600 max-w-xl mx-auto leading-relaxed">
          Transform, edit, and manage your PDF documents with our comprehensive suite of professional tools.
        </p>
        <div className="text-sm text-gray-500">
          Developed by <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-bold text-lg">Lokanex</span>
        </div>
        <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-green-500" />
            Privacy First
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-blue-500" />
            Lightning Fast
          </div>
          <div className="flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-purple-500" />
            Beautiful Design
          </div>
        </div>
      </div>

      {/* Popular Tools Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-500" />
            Popular Tools
          </h2>
          <div className="text-sm text-gray-500">Most used by our users</div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {popularTools.map(tool => (
            <ToolCard
              key={tool.key}
              title={tool.title}
              desc={tool.desc}
              onClick={() => navigate(tool.key)}
              category={tool.category}
            />
          ))}
        </div>
      </div>



      {/* Features Section */}
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Why Choose PDF HelpDesk?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Privacy First</h3>
              <p className="text-gray-600 text-sm">Your files never leave your device. All processing happens locally.</p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Zap className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Lightning Fast</h3>
              <p className="text-gray-600 text-sm">Optimized algorithms ensure quick processing of your documents.</p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                <Palette className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Beautiful Design</h3>
              <p className="text-gray-600 text-sm">Modern, intuitive interface designed for the best user experience.</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="text-center space-y-3">
        <h3 className="text-xl font-bold text-gray-900">Ready to Get Started?</h3>
        <p className="text-gray-600">Choose any tool above and start working with your PDFs today.</p>
        <button
          onClick={() => navigate('merge')}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
        >
          Try Merge PDFs
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
