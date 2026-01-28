import React, { useState } from 'react';
import { User, Users, FolderArchive, Settings, LogOut, Moon, Sun, PlusCircle, Building, Menu, X } from 'lucide-react';

const Sidebar = ({ currentView, onNavigate, isOpen, onClose }) => {
  const menuItems = [
    { icon: PlusCircle, label: 'Nuova Scheda', id: 'form' },
    { icon: FolderArchive, label: 'Archivio Schede', id: 'archive' },
    { icon: Building, label: 'CRM', id: 'crm' },
    { icon: Users, label: 'Gestione Consulenti', id: 'consultants' },
    { icon: Settings, label: 'Impostazioni', id: 'settings' },
  ];

  const handleNavigate = (id) => {
    onNavigate(id);
    onClose();
  };

  return (
    <>
      {/* Overlay background */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-30 transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full py-4">
          <nav className="flex-1 space-y-1 px-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
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

const Header = ({ darkMode, toggleDarkMode, onNavigate, isSidebarOpen, toggleSidebar }) => {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-20 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between h-full">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="p-2 -ml-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors focus:outline-none"
            aria-label="Toggle Menu"
          >
            {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          {/* Logo and Brand */}
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

  React.useEffect(() => {
    // Set initial state based on screen width
    if (window.innerWidth >= 768) {
      setIsSidebarOpen(true);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <Header 
        darkMode={darkMode} 
        toggleDarkMode={toggleDarkMode} 
        onNavigate={onNavigate}
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />
      <Sidebar 
        currentView={currentView} 
        onNavigate={onNavigate} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      <main className={`pt-16 min-h-screen transition-all duration-300 ${isSidebarOpen ? 'md:pl-64' : ''}`}>
        <div className={`${currentView === 'crm' ? 'w-full' : 'max-w-7xl'} mx-auto py-6 sm:px-6 lg:px-8`}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
