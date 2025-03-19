import React, { createContext, useContext, useState } from 'react';

// Create the context
const PageContext = createContext();

// Create provider component
export function PageProvider({ children }) {
  const [currentWorkspace, setWorkspace] = useState(null);
  const [currentPage, setCurrentPage] = useState(null);
  
  // Values to be provided to consumers
  const value = {
    workspace: currentWorkspace,
    setWorkspace,
    currentPage,
    setCurrentPage,
  };

  return (
    <PageContext.Provider value={value}>
      {children}
    </PageContext.Provider>
  );
}

// Custom hook for consuming the context
export function usePage() {
  const context = useContext(PageContext);
  if (context === undefined) {
    throw new Error('usePage must be used within a PageProvider');
  }
  return context;
} 