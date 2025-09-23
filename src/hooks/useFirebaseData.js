import { useState, useEffect, useCallback } from 'react';
import { database } from '../services/firebase/database';
import { useAuth } from './useAuth';
import { useUserType } from './useUserType';

export const useFirebaseData = (collection, options = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { user } = useAuth();
  const { userType } = useUserType();
  
  const {
    limit = null,
    orderBy = 'createdAt',
    orderDirection = 'desc',
    where = [],
    realtime = true
  } = options;

  // Load data
  const loadData = useCallback(async () => {
    if (!user || !userType) return;

    try {
      setLoading(true);
      setError(null);
      
      const queryOptions = {
        limit,
        orderBy,
        orderDirection,
        where: [
          ...where,
          ['userType', '==', userType],
          ['userId', '==', user.uid]
        ]
      };

      if (realtime) {
        // Set up real-time listener
        const unsubscribe = database.onSnapshot(
          collection,
          queryOptions,
          (snapshot) => {
            setData(snapshot);
            setLoading(false);
          },
          (err) => {
            setError(err.message);
            setLoading(false);
          }
        );
        
        return unsubscribe;
      } else {
        // One-time fetch
        const result = await database.get(collection, queryOptions);
        setData(result);
      }
    } catch (err) {
      setError(err.message);
      console.error(`Error loading ${collection}:`, err);
    } finally {
      setLoading(false);
    }
  }, [user, userType, collection, limit, orderBy, orderDirection, where, realtime]);

  // Add document
  const addDocument = useCallback(async (documentData) => {
    if (!user || !userType) {
      throw new Error('User not authenticated');
    }

    try {
      const newDoc = await database.create(collection, {
        ...documentData,
        userType,
        userId: user.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      if (!realtime) {
        setData(prev => [newDoc, ...prev]);
      }
      
      return newDoc;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [user, userType, collection, realtime]);

  // Update document
  const updateDocument = useCallback(async (id, updates) => {
    if (!user || !userType) {
      throw new Error('User not authenticated');
    }

    try {
      const updatedDoc = await database.update(collection, id, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
      
      if (!realtime) {
        setData(prev => prev.map(item => 
          item.id === id ? { ...item, ...updatedDoc } : item
        ));
      }
      
      return updatedDoc;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [user, userType, collection, realtime]);

  // Delete document
  const deleteDocument = useCallback(async (id) => {
    if (!user || !userType) {
      throw new Error('User not authenticated');
    }

    try {
      await database.delete(collection, id);
      
      if (!realtime) {
        setData(prev => prev.filter(item => item.id !== id));
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [user, userType, collection, realtime]);

  // Get document by ID
  const getDocument = useCallback(async (id) => {
    try {
      return await database.getById(collection, id);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [collection]);

  useEffect(() => {
    const unsubscribe = loadData();
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [loadData]);

  return {
    data,
    loading,
    error,
    loadData,
    addDocument,
    updateDocument,
    deleteDocument,
    getDocument,
    refresh: loadData,
  };
};