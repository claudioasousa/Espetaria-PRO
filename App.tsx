
import React, { useState } from 'react';
import { AppProvider } from './store';
import Layout from './components/Layout';
import AdminModule from './modules/AdminModule';
import WaiterModule from './modules/WaiterModule';
import KitchenModule from './modules/KitchenModule';
import FinanceModule from './modules/FinanceModule';
import { Module } from './types';

const MainApp: React.FC = () => {
  const [currentModule, setCurrentModule] = useState<Module>('ADMIN');

  const renderModule = () => {
    switch (currentModule) {
      case 'ADMIN': return <AdminModule />;
      case 'WAITER': return <WaiterModule />;
      case 'KITCHEN': return <KitchenModule />;
      case 'FINANCE': return <FinanceModule />;
      default: return <AdminModule />;
    }
  };

  return (
    <Layout currentModule={currentModule} onModuleChange={setCurrentModule}>
      {renderModule()}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
};

export default App;
