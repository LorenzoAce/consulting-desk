import React from 'react';
import { User, FolderArchive, Settings, LogOut, Moon, Sun } from 'lucide-react';

const Sidebar = ({ isOpen }) => {
  const menuItems = [
    { icon: User, label: 'Profilo', active: false },
    { icon: FolderArchive, label: 'Archivio Schede', active: false },
    { icon: Settings, label: 'Impostazioni', active: false },
  ];

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 hidden md:block z-10">
      <div className="flex flex-col h-full py-4">
        <nav className="flex-1 space-y-1 px-2">
          {menuItems.map((item) => (
            <button
              key={item.label}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                item.active
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
  );
};

const Header = ({ darkMode, toggleDarkMode }) => {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-20 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between h-full">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Consulting Desk Logo" className="h-10 w-auto object-contain" />
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-wide leading-none">
              CONSULTING DESK
            </h1>
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
          
          <button
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <LogOut className="h-5 w-5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

const Layout = ({ children, darkMode, toggleDarkMode }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      <Sidebar />
      
      <main className="pt-16 md:pl-64 min-h-screen transition-all duration-200">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
