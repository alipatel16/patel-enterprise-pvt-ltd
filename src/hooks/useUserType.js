import { useContext } from 'react';
import { UserTypeContext } from '../contexts/UserTypeContext/index';

export const useUserType = () => {
  const context = useContext(UserTypeContext);
  if (!context) {
    throw new Error('useUserType must be used within a UserTypeProvider');
  }
  return context;
};

export default useUserType;