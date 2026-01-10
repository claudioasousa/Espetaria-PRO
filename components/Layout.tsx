
import React from 'react';
import { Module } from '../types';

interface LayoutProps {
  currentModule: Module;
  onModuleChange: (module: Module) => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ currentModule, onModuleChange, children }) => {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar / Bottom Nav for Mobile */}
      <nav className="bg-gray-900 text-white w-full md:w-64 flex-shrink-0 flex flex-row md:flex-col justify-between md:justify-start sticky top-0 z-50 md:h-screen">
        <div className="p-4 md:p-6 flex items-center gap-3">
          <div className="bg-orange-500 p-2 rounded-lg">
            <i className="fas fa-fire-alt text-xl"></i>
          </div>
          <h1 className="text-xl font-bold tracking-tight hidden md:block">Espetaria Pro</h1>
        </div>

        <div className="flex flex-row md:flex-col flex-grow md:mt-6 px-2 md:px-4">
          <button 
            onClick={() => onModuleChange('ADMIN')}
            className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-3 p-3 rounded-lg transition-all ${currentModule === 'ADMIN' ? 'bg-orange-500 text-white' : 'hover:bg-gray-800 text-gray-400'}`}
          >
            <i className="fas fa-chart-line"></i>
            <span className="text-xs md:text-base font-medium">Admin</span>
          </button>
          
          <button 
            onClick={() => onModuleChange('WAITER')}
            className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-3 p-3 rounded-lg transition-all ${currentModule === 'WAITER' ? 'bg-orange-500 text-white' : 'hover:bg-gray-800 text-gray-400'}`}
          >
            <i className="fas fa-user-tie"></i>
            <span className="text-xs md:text-base font-medium">Garçom</span>
          </button>
          
          <button 
            onClick={() => onModuleChange('KITCHEN')}
            className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-3 p-3 rounded-lg transition-all ${currentModule === 'KITCHEN' ? 'bg-orange-500 text-white' : 'hover:bg-gray-800 text-gray-400'}`}
          >
            <i className="fas fa-utensils"></i>
            <span className="text-xs md:text-base font-medium">Cozinha</span>
          </button>
        </div>

        <div className="hidden md:block p-6 mt-auto text-gray-500 text-xs">
          v2.1.0 © 2024
        </div>
      </nav>

      <main className="flex-grow p-4 md:p-8 overflow-y-auto bg-gray-50">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
