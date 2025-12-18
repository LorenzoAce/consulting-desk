import React, { useState } from 'react';
import { User, FolderArchive, Settings, LogOut, Moon, Sun, PlusCircle, Building, Menu, X } from 'lucide-react';

const Sidebar = ({ currentView, onNavigate, isOpen, onClose }) => {
  const menuItems = [
    { icon: PlusCircle, label: 'Nuova Scheda', id: 'form' },
    { icon: User, label: 'Profilo', id: 'profile' },
    { icon: FolderArchive, label: 'Archivio Schede', id: 'archive' },
    { icon: Settings, label: 'Impostazioni', id: 'settings' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 md:hidden"
          onClick={onClose}
        ></div>
      )}

      <aside className={`
        fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-30 transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full py-4">
          <nav className="flex-1 space-y-1 px-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  onClose(); // Close sidebar on mobile when item clicked
                }}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                  currentView === item.id
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
};

const Header = ({ darkMode, toggleDarkMode, onNavigate, toggleSidebar }) => {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-20 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between h-full">
        {/* Left: Menu Button & Logo */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="p-2 -ml-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            aria-label="Open sidebar"
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div 
            className="flex items-center gap-3 cursor-pointer" 
            onClick={() => onNavigate('form')}
          >
            <div className="flex items-center justify-center h-10 w-10 overflow-hidden">
              <img src="/logo.png" alt="Logo" className="h-full w-full object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-wide leading-none hidden sm:block">
                CONSULTING DESK
              </h1>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-wide leading-none sm:hidden">
                CD
              </h1>
            </div>
          </div>
        </div>


        {/* Right Actions */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleDarkMode}
            className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            aria-label="Toggle Dark Mode"
          >
            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </header>
  );
};

const Layout = ({ children, darkMode, toggleDarkMode, currentView, onNavigate }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <Header 
        darkMode={darkMode} 
        toggleDarkMode={toggleDarkMode} 
        onNavigate={onNavigate} 
        toggleSidebar={toggleSidebar}
      />
      <Sidebar 
        currentView={currentView} 
        onNavigate={onNavigate} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
      />
      
      <main className={`pt-16 min-h-screen transition-all duration-300 ${isSidebarOpen ? 'md:pl-64' : ''}`}>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 p-4">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
