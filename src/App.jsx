
import React, { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar.jsx'
import TopNav from './components/TopNav.jsx'
import Home from './pages/Home.jsx'
import MergePDF from './pages/MergePDF.jsx'
import ImageToPDF from './pages/ImageToPDF.jsx'
import PDFToImages from './pages/PDFToImages.jsx'
import CompressPDF from './pages/CompressPDF.jsx'
import SignPDF from './pages/SignPDF.jsx'
import OrganizePDF from './pages/OrganizePDF.jsx'
import SplitPDF from './pages/SplitPDF.jsx'
import ExtractPages from './pages/ExtractPages.jsx'
import PDFToWord from './pages/PDFToWord.jsx'
import WatermarkPDF from './pages/WatermarkPDF.jsx'
import OptimizePDF from './pages/OptimizePDF.jsx'
import HighlightPDF from './pages/HighlightPDF.jsx'

// Import or create placeholder components for new tools
const PlaceholderTool = ({ title, desc }) => (
  <div className="space-y-6">
    <div className="text-center space-y-4">
      <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
      <p className="text-lg text-gray-600 max-w-2xl mx-auto">{desc}</p>
    </div>
    
    <div className="bg-blue-50 rounded-xl p-8 text-center">
      <div className="text-6xl mb-4">🚧</div>
      <h2 className="text-xl font-semibold text-blue-900 mb-2">Coming Soon!</h2>
      <p className="text-blue-700">
        This tool is currently under development. We're working hard to bring you the best PDF experience!
      </p>
    </div>
  </div>
)

const routes = {
  home: Home,
  merge: MergePDF,
  imagetopdf: ImageToPDF,
  pdftoimages: PDFToImages,
  compress: CompressPDF,
  sign: SignPDF,
  organize: OrganizePDF,
  
  // Convert tools
  wordtopdf: () => <PlaceholderTool title="Word to PDF" desc="Convert Microsoft Word documents to PDF format" />,
  pdftoword: PDFToWord,
  
  // Organize tools
  split: SplitPDF,
  extract: ExtractPages,
  
  // Edit tools
  edittext: () => <PlaceholderTool title="Edit Text" desc="Modify text content in PDF documents" />, 
  addtext: () => <PlaceholderTool title="Add Text" desc="Insert new text blocks into PDF documents" />,
  highlight: HighlightPDF,
  
  // Compress tools
  ocr: () => <PlaceholderTool title="OCR PDF" desc="Extract text from image-based PDF documents" />,
  optimize: OptimizePDF,
  reduce: CompressPDF,
  
  // Security tools
  password: () => <PlaceholderTool title="Password Protect" desc="Add password security to PDF documents" />,
  encrypt: () => <PlaceholderTool title="Encrypt PDF" desc="Advanced PDF encryption options" />,
  watermark: WatermarkPDF,
  
  // Popular tools
  unlockpdf: () => <PlaceholderTool title="Unlock PDF" desc="Remove password protection and restrictions from PDF documents" />,
  lockpdf: () => <PlaceholderTool title="Lock PDF" desc="Add password protection and security restrictions to PDF files" />,
  repairpdf: () => <PlaceholderTool title="Repair PDF" desc="Fix corrupted or damaged PDF files to restore functionality" />
}

export default function App() {
  const [route, setRoute] = useState('home')
  const [isMobile, setIsMobile] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const Page = routes[route] || Home

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navigation Bar */}
      <TopNav onNavigate={setRoute} />
      
      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar 
          onNavigate={(newRoute) => {
            setRoute(newRoute)
            if (isMobile) setSidebarOpen(false)
          }} 
          active={route}
          isMobile={isMobile}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main Content */}
        <main className="flex-1 px-8 md:px-16 lg:px-28 py-4 lg:py-10 transition-all duration-300">
          <div className="max-w-5xl mx-auto">
            <Page navigate={setRoute} />
          </div>
        </main>

        {/* Mobile Overlay */}
        {isMobile && sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>
    </div>
  )
}
