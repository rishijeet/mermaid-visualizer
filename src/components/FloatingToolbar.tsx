import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download as File,
  Download as Download,
  Maximize2,
  Sun,
  Moon,
  Settings,
  Zap,
  Grid3X3
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface FloatingToolbarProps {
  onExportSVG: () => void;
  onExportPNG: () => void;
  onFitToScreen: () => void;
  onAutoLayout: () => void;
  onToggleMinimap: () => void;
  showMinimap: boolean;
}

/**
 * Floating toolbar with export and view controls
 */
export const FloatingToolbar: React.FC<FloatingToolbarProps> = ({
  onExportSVG,
  onExportPNG,
  onFitToScreen,
  onAutoLayout,
  onToggleMinimap,
  showMinimap
}) => {
  const { isDark, toggleTheme } = useTheme();
  const [showExportMenu, setShowExportMenu] = useState(false);

  const toolbarVariants = {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  const buttonVariants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    hover: { scale: 1.05 },
    tap: { scale: 0.95 }
  };

  return (
    <motion.div
      className="floating-toolbar fixed top-6 left-1/2 transform -translate-x-1/2 z-50"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={toolbarVariants}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="glass rounded-2xl shadow-large border border-white/20 dark:border-gray-700/30 px-2 py-2">
        <div className="flex items-center space-x-1">
          {/* Export Button */}
          <div className="relative">
            <motion.button
              className="w-4 h-4 flex items-center space-x-2"
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={() => setShowExportMenu(!showExportMenu)}
            >
              <span>Export as PNG</span>
            </motion.button>

            <AnimatePresence>
              {showExportMenu && (
                <motion.div
                  className="absolute top-full left-0 mt-2 w-48 glass rounded-xl shadow-large border border-white/20 dark:border-gray-700/30 overflow-hidden"
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <button
                    className="w-full flex items-center space-x-2 px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => {
                      onExportSVG();
                      setShowExportMenu(false);
                    }}
                  >
                    <Download className="w-4 h-4" />
                    <span>Export as SVG</span>
                  </button>
                  <button
                    className="w-full flex items-center space-x-2 px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => {
                      onExportPNG();
                      setShowExportMenu(false);
                    }}
                  >
                    <Download className="w-4 h-4" />
                    <span>Export as PNG</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>

          {/* View Controls */}
          <motion.button
            className="p-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={onFitToScreen}
            title="Fit to Screen"
          >
            <Maximize2 className="w-4 h-4" />
          </motion.button>

          <motion.button
            className="p-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={onAutoLayout}
            title="Auto Layout"
          >
            <Zap className="w-4 h-4" />
          </motion.button>

          <motion.button
            className={`p-2 rounded-lg transition-colors ${
              showMinimap 
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={onToggleMinimap}
            title="Toggle Minimap"
          >
            <Grid3X3 className="w-4 h-4" />
          </motion.button>

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>

          {/* Theme Toggle */}
          <motion.button
            className="p-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={toggleTheme}
            title="Toggle Theme"
          >
            <AnimatePresence mode="wait">
              {isDark ? (
                <motion.div
                  key="moon"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Moon className="w-4 h-4" />
                </motion.div>
              ) : (
                <motion.div
                  key="sun"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Sun className="w-4 h-4" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Settings */}
          <motion.button
            className="p-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};
