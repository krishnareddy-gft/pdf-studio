
import React from 'react'
import ToolCard from '../components/ToolCard.jsx'
import { 
  FileText, Images, Layers, Edit3, Scissors, ShieldCheck, Wrench,
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
        { key: 'pdftoword', title: 'PDF → Word', desc: 'Convert PDF to DOCX' },
        { key: 'exceltopdf', title: 'Excel → PDF', desc: 'Convert XLS/XLSX to PDF' },
        { key: 'ppttopdf', title: 'PowerPoint → PDF', desc: 'Convert PPT/PPTX to PDF' },
        { key: 'htmltopdf', title: 'HTML → PDF', desc: 'Convert web pages to PDF' },
        { key: 'texttopdf', title: 'Text → PDF', desc: 'Convert TXT files to PDF' }
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
        { key: 'organize', title: 'Reorder/Rotate', desc: 'Rearrange and rotate pages' },
        { key: 'extract', title: 'Extract Pages', desc: 'Extract specific pages' },
        { key: 'insert', title: 'Insert Pages', desc: 'Insert pages into PDF' },
        { key: 'delete', title: 'Delete Pages', desc: 'Remove unwanted pages' },
        { key: 'bookmarks', title: 'Add Bookmarks', desc: 'Create PDF bookmarks' },
        { key: 'outline', title: 'PDF Outline', desc: 'Generate table of contents' }
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
        { key: 'highlight', title: 'Highlight Text', desc: 'Highlight important text' },
        { key: 'underline', title: 'Underline Text', desc: 'Underline text content' },
        { key: 'strikethrough', title: 'Strike Text', desc: 'Strike through text' },
        { key: 'draw', title: 'Draw & Annotate', desc: 'Freehand drawing tools' },
        { key: 'editimages', title: 'Edit Images', desc: 'Modify PDF images' },
        { key: 'addimages', title: 'Add Images', desc: 'Insert images into PDF' }
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
        { key: 'reduce', title: 'Reduce Size', desc: 'Advanced compression options' },
        { key: 'quality', title: 'Quality Settings', desc: 'Customize compression settings' }
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
        { key: 'permissions', title: 'Set Permissions', desc: 'Control access rights' },
        { key: 'redact', title: 'Redact Content', desc: 'Remove sensitive information' },
        { key: 'certificate', title: 'Certificate Sign', desc: 'Certificate-based signing' }
      ]
    },
    {
      id: 'tools',
      title: 'More Tools',
      icon: Wrench,
      color: 'from-gray-500 to-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      tools: [
        { key: 'compare', title: 'Compare PDFs', desc: 'Find differences between PDFs' },
        { key: 'search', title: 'Search PDF', desc: 'Find text in PDF documents' },
        { key: 'forms', title: 'Fill Forms', desc: 'Complete PDF forms' },
        { key: 'flatten', title: 'Flatten PDF', desc: 'Make PDF uneditable' },
        { key: 'metadata', title: 'Edit Metadata', desc: 'Modify PDF information' },
        { key: 'repair', title: 'Repair PDF', desc: 'Fix corrupted PDF files' },
        { key: 'validate', title: 'Validate PDF', desc: 'Check PDF compliance' },
        { key: 'batch', title: 'Batch Process', desc: 'Process multiple files' }
      ]
    }
  ]

  // Popular tools selection - now with 8 tools
  const popularTools = [
    { key: 'imagetopdf', title: 'Image → PDF', desc: 'Convert JPG/PNG to PDF', category: 'convert' },
    { key: 'merge', title: 'Merge PDFs', desc: 'Combine multiple PDFs', category: 'organize' },
    { key: 'split', title: 'Split PDF', desc: 'Split PDF into multiple files', category: 'organize' },
    { key: 'pdftoword', title: 'PDF → Word', desc: 'Convert PDF to DOCX', category: 'convert' },
    { key: 'compress', title: 'Compress PDF', desc: 'Reduce file size while maintaining quality', category: 'compress' },
    { key: 'edittext', title: 'Edit Text', desc: 'Modify PDF text content', category: 'edit' },
    { key: 'highlight', title: 'Highlight Text', desc: 'Highlight important text', category: 'edit' },
    { key: 'sign', title: 'eSign PDF', desc: 'Add digital signatures', category: 'sign' }
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

      {/* All Categories */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-gray-900 text-center">Complete Tool Collection</h2>
        
        {categories.map(category => (
          <div key={category.id} className="space-y-3">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-gradient-to-r ${category.color} text-white`}>
                <category.icon className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">{category.title}</h3>
              <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent"></div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {category.tools.map(tool => (
                <ToolCard
                  key={tool.key}
                  title={tool.title}
                  desc={tool.desc}
                  onClick={() => navigate(tool.key)}
                  category={category.id}
                />
              ))}
            </div>
          </div>
        ))}
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
