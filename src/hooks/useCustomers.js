import { useContext } from 'react';
import { CustomerContext } from '../contexts/CustomerContext/index';

export const useCustomers = () => {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error('useCustomers must be used within a CustomerProvider');
  }
  return context;
};

export default useCustomers;