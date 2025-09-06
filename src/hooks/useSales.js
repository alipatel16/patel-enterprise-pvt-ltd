import { useContext } from 'react';
import { SalesContext } from '../contexts/SalesContext/index';

export const useSales = () => {
  const context = useContext(SalesContext);
  if (!context) {
    throw new Error('useSales must be used within a SalesProvider');
  }
  return context;
};

export default useSales;