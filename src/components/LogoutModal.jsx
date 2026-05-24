import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, X } from 'lucide-react';

const LogoutModal = ({ isOpen, onClose, onConfirm }) => {
  // Focus trap and ESC key listener
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop - DEBUG */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              console.log(" backpage clicked - target:", e.target);
              onClose();
            }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            style={{ zIndex: 40, pointerEvents: 'auto' }}
          />

          {/* Modal Container - Ensure Pointer Events */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-[#161616] border border-white/10 rounded-3xl overflow-hidden shadow-2xl shadow-black"
            style={{ 
              zIndex: 50, 
              position: 'relative',
              pointerEvents: 'auto'
            }}
          >
            {/* Shimmer/Premium Effect Background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />
              
              {/* Floating Particles */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    y: [0, -100],
                    x: [0, Math.sin(i) * 50],
                    opacity: [0, 0.3, 0],
                    scale: [0, 1, 0.5],
                  }}
                  transition={{
                    duration: 4 + Math.random() * 4,
                    repeat: Infinity,
                    delay: Math.random() * 5,
                    ease: "linear",
                  }}
                  className="absolute w-1 h-1 bg-primary rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    bottom: '-10%',
                  }}
                />
              ))}

              <motion.div
                animate={{
                  x: ['-100%', '100%'],
                  opacity: [0, 0.2, 0],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 w-full bg-gradient-to-r from-transparent via-primary/10 to-transparent skew-x-12"
              />
            </div>

            {/* Close Button - Functional Restore */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("❌ X BUTTON CLICKED - FUNCTIONAL");
                if (onClose && typeof onClose === 'function') {
                  onClose();
                }
              }}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'transparent',
                border: 'none',
                color: '#CCCCCC',
                fontSize: '24px',
                fontWeight: '400',
                opacity: '0.7',
                cursor: 'pointer',
                transition: 'color 150ms ease, opacity 150ms ease',
                padding: '8px',
                lineHeight: '1',
                zIndex: 1001,
                pointerEvents: 'auto'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#FFFFFF';
                e.currentTarget.style.opacity = '1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#CCCCCC';
                e.currentTarget.style.opacity = '0.7';
              }}
              className=""
              aria-label="Close modal"
            >
              ×
            </button>

            <div className="relative z-10 p-8 flex flex-col items-center text-center">
              {/* Icon Container */}
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 border border-primary/20">
                <LogOut className="w-8 h-8 text-primary" />
              </div>

              <h2 className="text-2xl font-black text-white mb-2 tracking-tight">
                Are you sure you want to log out?
              </h2>
              <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                You will need to log in again to access your account, your watch history, and your premium benefits.
              </p>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  className="flex-1 px-6 py-4 rounded-2xl bg-white/5 text-white font-bold text-sm uppercase tracking-widest hover:bg-white/10 transition-colors border border-white/5"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(255, 215, 0, 0.3)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onConfirm}
                  className="flex-1 px-6 py-4 rounded-2xl bg-primary text-black font-black text-sm uppercase tracking-widest hover:bg-primary-light transition-all shadow-lg shadow-primary/20"
                >
                  Log Out
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default LogoutModal;
