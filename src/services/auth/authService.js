import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { ref, set, get, update } from 'firebase/database';
import { auth, database } from '../firebase/config';
import { getUsersPath } from '../../utils/helpers/firebasePathHelper';
import { USER_ROLES, USER_TYPES } from '../../utils/constants/appConstants';

class AuthService {
  /**
   * Sign in user with email and password
   * @param {string} email 
   * @param {string} password 
   * @returns {Promise<Object>}
   */
  async signIn(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Get user profile from database
      const userProfileRef = ref(database, getUsersPath(user.uid));
      const snapshot = await get(userProfileRef);
      
      if (!snapshot.exists()) {
        throw new Error('User profile not found. Please contact administrator.');
      }
      
      const userProfile = snapshot.val();
      
      return {
        uid: user.uid,
        email: user.email,
        ...userProfile
      };
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Create new user account
   * @param {Object} userData 
   * @returns {Promise<Object>}
   */
  async signUp(userData) {
    try {
      const { email, password, name, role, userType, phone } = userData;
      
      // Validate input
      this.validateSignUpData(userData);
      
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update user display name
      await updateProfile(user, {
        displayName: name
      });
      
      // Create user profile in database
      const userProfile = {
        uid: user.uid,
        email,
        name,
        role,
        userType,
        phone: phone || '',
        createdAt: new Date().toISOString(),
        isActive: true,
        lastLogin: new Date().toISOString()
      };
      
      const userProfileRef = ref(database, getUsersPath(user.uid));
      await set(userProfileRef, userProfile);
      
      return {
        uid: user.uid,
        email: user.email,
        ...userProfile
      };
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Sign out current user
   * @returns {Promise<void>}
   */
  async signOut() {
    try {
      await signOut(auth);
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Get current user
   * @returns {Promise<Object|null>}
   */
  async getCurrentUser() {
    return new Promise((resolve, reject) => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        unsubscribe();
        
        if (!user) {
          resolve(null);
          return;
        }
        
        try {
          const userProfileRef = ref(database, getUsersPath(user.uid));
          const snapshot = await get(userProfileRef);
          
          if (!snapshot.exists()) {
            resolve(null);
            return;
          }
          
          const userProfile = snapshot.val();
          resolve({
            uid: user.uid,
            email: user.email,
            ...userProfile
          });
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  /**
   * Update user profile
   * @param {string} userId 
   * @param {Object} updates 
   * @returns {Promise<void>}
   */
  async updateUserProfile(userId, updates) {
    try {
      const userProfileRef = ref(database, getUsersPath(userId));
      await update(userProfileRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Update last login timestamp
   * @param {string} userId 
   * @returns {Promise<void>}
   */
  async updateLastLogin(userId) {
    try {
      const userProfileRef = ref(database, getUsersPath(userId));
      await update(userProfileRef, {
        lastLogin: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to update last login:', error);
    }
  }

  /**
   * Subscribe to auth state changes
   * @param {Function} callback 
   * @returns {Function} unsubscribe function
   */
  onAuthStateChanged(callback) {
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        callback(null);
        return;
      }
      
      try {
        const userProfileRef = ref(database, getUsersPath(user.uid));
        const snapshot = await get(userProfileRef);
        
        if (!snapshot.exists()) {
          callback(null);
          return;
        }
        
        const userProfile = snapshot.val();
        const fullUser = {
          uid: user.uid,
          email: user.email,
          ...userProfile
        };
        
        // Update last login
        await this.updateLastLogin(user.uid);
        
        callback(fullUser);
      } catch (error) {
        console.error('Error fetching user profile:', error);
        callback(null);
      }
    });
  }

  /**
   * Validate sign up data
   * @param {Object} userData 
   */
  validateSignUpData(userData) {
    const { email, password, name, role, userType } = userData;
    
    if (!email || !password || !name || !role || !userType) {
      throw new Error('All required fields must be provided');
    }
    
    if (!Object.values(USER_ROLES).includes(role)) {
      throw new Error('Invalid user role');
    }
    
    if (!Object.values(USER_TYPES).includes(userType)) {
      throw new Error('Invalid user type');
    }
    
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }
  }

  /**
   * Handle authentication errors
   * @param {Error} error 
   * @returns {Error}
   */
  handleAuthError(error) {
    const errorMessages = {
      'auth/user-not-found': 'No user found with this email address.',
      'auth/wrong-password': 'Incorrect password.',
      'auth/email-already-in-use': 'Email address is already in use.',
      'auth/weak-password': 'Password is too weak.',
      'auth/invalid-email': 'Invalid email address.',
      'auth/too-many-requests': 'Too many failed login attempts. Please try again later.',
      'auth/network-request-failed': 'Network error. Please check your connection.'
    };
    
    const message = errorMessages[error.code] || error.message || 'An unexpected error occurred.';
    return new Error(message);
  }
}

export default new AuthService();