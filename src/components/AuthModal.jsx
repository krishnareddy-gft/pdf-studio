import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import Login from './Login'
import Signup from './Signup'

export default function AuthModal({ isOpen, onClose }) {
  const [isLogin, setIsLogin] = useState(true)

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="relative"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute -top-4 -right-4 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors z-10"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>

          {isLogin ? (
            <Login
              onSwitchToSignup={() => setIsLogin(false)}
              onClose={onClose}
            />
          ) : (
            <Signup
              onSwitchToLogin={() => setIsLogin(true)}
              onClose={onClose}
            />
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
