import React, { createContext, useContext, useState } from 'react';

const SavedContext = createContext();

export const SavedProvider = ({ children }) => {

  const [isSave, setIsSave] = useState(null);
  // const [userId, setUserId] = useState(null);

  return (
    <SavedContext.Provider value={{ isSave,setIsSave }}>
      {children}
    </SavedContext.Provider>
  );
};

export const useSavedModal = () => useContext(SavedContext);
