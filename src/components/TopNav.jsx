import React, { useState } from 'react'
import { 
  Bell, User, Settings, LogOut, 
  ChevronDown, Menu, X
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function TopNav({ onNavigate, onOpenAuth }) {
  const { currentUser, logout } = useAuth()
  const [isAccountOpen, setIsAccountOpen] = useState(false)
  const [logoOk, setLogoOk] = useState(true)

  const handleLogout = async () => {
    try {
      await logout()
      setIsAccountOpen(false)
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Left Section - Brand */}
        <div className="flex items-center gap-4">
          {/* Brand */}
          <button 
            onClick={() => onNavigate && onNavigate('home')}
            className="flex items-center gap-2 hover:opacity-80 hover:scale-105 transition-all duration-200 cursor-pointer group"
            title="Go to Dashboard"
          >
            {/* If /brand-logo.png is present in /public it will be used. Otherwise fallback to CSS logomark */}
            {logoOk ? (
              <img
                src="/brand-logo.png"
                alt="PDF HelpDesk Logo"
                className="w-8 h-8 rounded-md object-contain"
                onError={() => setLogoOk(false)}
              />
            ) : (
              <div className="relative w-7 h-7">
                <div className="absolute inset-0 rotate-45 bg-gradient-to-br from-blue-600 to-purple-600 rounded"></div>
                <div className="absolute inset-1 rotate-45 bg-white/10 rounded"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold tracking-wider">PDF</span>
                </div>
              </div>
            )}
            <span className="text-lg font-bold text-gray-900">PDF HelpDesk</span>
          </button>
        </div>

        {/* Center Section - Spacer */}
        <div className="flex-1"></div>

        {/* Right Section - Actions & Account */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            <>
              {/* Notifications */}
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </button>

              {/* Account Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsAccountOpen(!isAccountOpen)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-gray-700">
                    {currentUser.displayName || currentUser.email}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isAccountOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Account Dropdown Menu */}
                {isAccountOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">
                        {currentUser.displayName || 'User'}
                      </p>
                      <p className="text-xs text-gray-500">{currentUser.email}</p>
                    </div>
                    
                    <div className="py-1">
                      <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Profile
                      </button>
                      <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Settings
                      </button>
                      <button 
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Login/Signup Buttons */
            <div className="flex items-center gap-3">
              <button
                onClick={() => onOpenAuth && onOpenAuth()}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => onOpenAuth && onOpenAuth()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
              >
                Get Started
              </button>
            </div>
          )}
        </div>
      </div>


    </nav>
  )
}
