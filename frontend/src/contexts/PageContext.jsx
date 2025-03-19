import React, { createContext, useContext, useState } from 'react';

// Create the context
const PageContext = createContext();

// Create provider component
export function PageProvider({ children }) {
  const [currentWorkspace, setWorkspace] = useState(null);
  const [currentPage, setCurrentPage] = useState(null);
  
  // Add state for tracking real-time title updates
  const [activePageId, setActivePageId] = useState(null);
  const [activePageTitle, setActivePageTitle] = useState('');
  
  // Values to be provided to consumers
  const value = {
    workspace: currentWorkspace,
    setWorkspace,
    currentPage,
    setCurrentPage,
    
    // Real-time title update values
    activePageId,
    setActivePageId,
    activePageTitle,
    setActivePageTitle,
    
    // Helper method to update both the current page and title
    updateCurrentPage: (page) => {
      setCurrentPage(page);
      setActivePageId(page?.id);
      setActivePageTitle(page?.title || '');
    }
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