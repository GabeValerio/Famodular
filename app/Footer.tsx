export function Footer() {
  return (
    <footer className="w-full bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Desktop View - Hidden on mobile */}
        <div className="hidden sm:block text-center">
          <p className="text-gray-500 text-sm">
            site designed and developed by{" "}
            <a 
              href="https://x.com/gabi_Valerio3/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-gray-900 hover:text-gray-700 transition-colors font-medium" 
            >
              Gabriel Valerio
            </a>
          </p>
        </div>

        {/* Mobile View - Hidden on desktop */}
        <div className="sm:hidden text-center space-y-1">
          <p className="text-gray-500 text-sm">
            site designed and developed by
          </p>
          <p>
            <a 
              href="https://x.com/gabi_Valerio3/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-gray-900 hover:text-gray-700 transition-colors text-sm font-medium" 
            >
              Gabriel Valerio
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
