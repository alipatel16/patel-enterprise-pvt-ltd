import React, { useState, useEffect } from 'react';
import UserTypeContext from './UserTypeContext';
import { USER_TYPES } from '../../utils/constants/appConstants';

export const UserTypeProvider = ({ children }) => {
  const [userType, setUserType] = useState(() => {
    return localStorage.getItem('userType') || USER_TYPES.ELECTRONICS;
  });

  useEffect(() => {
    localStorage.setItem('userType', userType);
  }, [userType]);

  const changeUserType = (newUserType) => {
    if (Object.values(USER_TYPES).includes(newUserType)) {
      setUserType(newUserType);
    }
  };

  const value = {
    userType,
    setUserType: changeUserType,
  };

  return (
    <UserTypeContext.Provider value={value}>
      {children}
    </UserTypeContext.Provider>
  );
};