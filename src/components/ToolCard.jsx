
import React from 'react'
import { motion } from 'framer-motion'
import { 
  Star, ArrowRight, FileText, Images, Layers, Edit3, Scissors, ShieldCheck, Wrench,
  FileImage, FileText as FileTextIcon, FileSpreadsheet, Globe, Type,
  Merge, Split, RotateCcw, BookOpen, List, PenTool, Image, Plus, Highlighter, 
  Underline, Strikethrough, PenLine, Eye, Search, FileCheck, Lock, 
  Palette, EyeOff, FileSearch, FormInput, Shield, FileX, Settings, 
  ClipboardList, FileCode, Presentation, Zap
} from 'lucide-react'

// Tool-specific icons mapping
const toolIcons = {
  // Convert tools
  imagetopdf: FileImage,
  pdftoimages: Images,
  wordtopdf: FileTextIcon,
  pdftoword: FileTextIcon,
  exceltopdf: FileSpreadsheet,
  pdftoexcel: FileSpreadsheet,
  ppttopdf: Presentation,
  pdftoppt: Presentation,
  htmltopdf: Globe,
  texttopdf: Type,
  
  // Organize tools
  merge: Merge,
  split: Split,
  organize: RotateCcw,
  extract: BookOpen,
  insert: Plus,
  delete: FileX,
  bookmarks: BookOpen,
  outline: List,
  
  // Edit tools
  edittext: PenTool,
  editimages: Image,
  addtext: Plus,
  addimages: Image,
  highlight: Highlighter,
  underline: Underline,
  strikethrough: Strikethrough,
  draw: PenLine,
  
  // Compress tools
  compress: Zap,
  ocr: Eye,
  optimize: Search,
  reduce: Zap,
  quality: Settings,
  
  // Security tools
  sign: FileCheck,
  certificate: Shield,
  password: Lock,
  encrypt: Lock,
  permissions: Shield,
  watermark: Palette,
  redact: EyeOff,
  
  // Utility tools
  compare: Search,
  search: FileSearch,
  forms: ClipboardList,
  flatten: FileCheck,
  metadata: FileCode,
  repair: Wrench,
  validate: FileCheck,
  batch: Wrench,
  
  // Default
  home: FileText
}

const categoryColors = {
  convert: 'from-blue-500 to-blue-600',
  organize: 'from-green-500 to-green-600',
  edit: 'from-purple-500 to-purple-600',
  compress: 'from-orange-500 to-orange-600',
  sign: 'from-red-500 to-red-600',
  tools: 'from-gray-500 to-gray-600'
}

export default function ToolCard({ title, desc, onClick, disabled = false, category = null }) {
  // Create a key for the tool by cleaning the title
  const toolKey = title.toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[→]/g, '')
    .replace(/[()]/g, '')
    .replace(/[&]/g, '')
    .replace(/[+]/g, '')
    .replace(/[.]/g, '')
    .replace(/[\/]/g, '')
    .replace(/[\\]/g, '')
    .replace(/[|]/g, '')
    .replace(/[?]/g, '')
    .replace(/[*]/g, '')
    .replace(/[<]/g, '')
    .replace(/[>]/g, '')
    .replace(/[:]/g, '')
    .replace(/["]/g, '')
    .replace(/[']/g, '')
    .replace(/[`]/g, '')
    .replace(/[~]/g, '')
    .replace(/[!]/g, '')
    .replace(/[@]/g, '')
    .replace(/[#]/g, '')
    .replace(/[$]/g, '')
    .replace(/[%]/g, '')
    .replace(/[\^]/g, '')
    .replace(/[&]/g, '')
    .replace(/[*]/g, '')
    .replace(/[(]/g, '')
    .replace(/[)]/g, '')
    .replace(/[-]/g, '')
    .replace(/[_]/g, '')
    .replace(/[=]/g, '')
    .replace(/[+]/g, '')
    .replace(/[[]/g, '')
    .replace(/[\]]/g, '')
    .replace(/[{]/g, '')
    .replace(/[}]/g, '')
    .replace(/[|]/g, '')
    .replace(/[\\]/g, '')
    .replace(/[:]/g, '')
    .replace(/[;]/g, '')
    .replace(/["]/g, '')
    .replace(/[']/g, '')
    .replace(/[<]/g, '')
    .replace(/[>]/g, '')
    .replace(/[,]/g, '')
    .replace(/[.]/g, '')
    .replace(/[/]/g, '')
    .replace(/[?]/g, '')

  const ToolIcon = toolIcons[toolKey] || FileText
  const categoryColor = category ? categoryColors[category] : 'from-gray-500 to-gray-600'

  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`group relative bg-white rounded-lg border border-gray-200 cursor-pointer transition-all duration-300 overflow-hidden ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg hover:border-gray-300'
      }`}
      onClick={disabled ? undefined : onClick}
    >
      {/* Category Icon Background */}
      <div className={`absolute top-0 right-0 w-12 h-12 bg-gradient-to-br ${categoryColor} opacity-10 rounded-bl-full transition-opacity duration-300 group-hover:opacity-20`} />

      <div className="p-4 relative z-10">
        {/* Header with Icon on Left */}
        <div className="flex items-center gap-3 mb-3">
          <div className={`p-2 rounded-lg bg-gradient-to-r ${categoryColor} text-white shadow-md flex-shrink-0`}>
            <ToolIcon className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-200 leading-tight">
              {title}
            </h3>
            <p className="text-xs text-gray-600 leading-tight mt-1">
              {desc}
            </p>
          </div>
          <motion.div
            className="text-gray-400 group-hover:text-blue-500 transition-colors duration-200 flex-shrink-0"
            initial={{ x: 0 }}
            whileHover={{ x: 2 }}
          >
            <ArrowRight className="w-4 h-4" />
          </motion.div>
        </div>

        {/* Hover Effect Border */}
        <div className={`absolute inset-0 rounded-lg border-2 border-transparent bg-gradient-to-r ${categoryColor} opacity-0 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none`} />
      </div>

      {/* Bottom Accent */}
      <div className={`h-0.5 bg-gradient-to-r ${categoryColor} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`} />
    </motion.div>
  )
}
