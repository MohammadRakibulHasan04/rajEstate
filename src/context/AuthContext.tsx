import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { TourInquiry } from '../types/property';

/** Client-side allowlist; must mirror isAdmin() in firestore.rules. */
export const ADMIN_EMAILS = ['business.rifat04@gmail.com'];

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  adminChecking: boolean;
  savedPropertyIds: string[];
  signInWithGoogle: () => Promise<void>;
  logOut: () => Promise<void>;
  toggleSaveProperty: (propertyId: string) => Promise<boolean>;
  isPropertySaved: (propertyId: string) => boolean;
  submitInquiry: (inquiry: Omit<TourInquiry, 'id' | 'createdAt' | 'status'>) => Promise<boolean>;
  authError: string | null;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [savedPropertyIds, setSavedPropertyIds] = useState<string[]>(() => {
    try {
      const local = localStorage.getItem('aura_saved_properties');
      return local ? JSON.parse(local) : [];
    } catch {
      return [];
    }
  });
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminChecking, setAdminChecking] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setIsAdmin(false);
      setAdminChecking(false);
      return;
    }
    if (user.email && ADMIN_EMAILS.includes(user.email)) {
      setIsAdmin(true);
      setAdminChecking(false);
      return;
    }
    setAdminChecking(true);
    getDoc(doc(db, 'admins', user.uid))
      .then((snap) => setIsAdmin(snap.exists()))
      .catch(() => setIsAdmin(false))
      .finally(() => setAdminChecking(false));
  }, [user, loading]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        setDoc(
          userRef,
          {
            uid: currentUser.uid,
            email: currentUser.email || '',
            displayName: currentUser.displayName || 'Architectural Patron',
            role: currentUser.email && ADMIN_EMAILS.includes(currentUser.email) ? 'admin' : 'client',
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        ).catch((err) => {
          console.warn('User profile sync skipped/non-critical:', err);
        });
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    const savedColPath = `users/${user.uid}/saved`;
    const savedCol = collection(db, 'users', user.uid, 'saved');

    const unsubscribe = onSnapshot(
      savedCol,
      (snapshot) => {
        const ids = snapshot.docs.map((d) => d.id);
        setSavedPropertyIds(ids);
        localStorage.setItem('aura_saved_properties', JSON.stringify(ids));
      },
      (error) => {
        console.warn('Real-time saved properties sync error:', error);
        handleFirestoreError(error, OperationType.GET, savedColPath);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const signInWithGoogle = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google authentication failed';
      setAuthError(msg);
      throw err;
    }
  };

  const logOut = async () => {
    setAuthError(null);
    try {
      await signOut(auth);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign out failed';
      setAuthError(msg);
      throw err;
    }
  };

  const toggleSaveProperty = async (propertyId: string): Promise<boolean> => {
    const isCurrentlySaved = savedPropertyIds.includes(propertyId);
    const newSaved = isCurrentlySaved
      ? savedPropertyIds.filter((id) => id !== propertyId)
      : [...savedPropertyIds, propertyId];

    setSavedPropertyIds(newSaved);
    localStorage.setItem('aura_saved_properties', JSON.stringify(newSaved));

    if (user) {
      const docPath = `users/${user.uid}/saved/${propertyId}`;
      const savedDocRef = doc(db, 'users', user.uid, 'saved', propertyId);
      try {
        if (isCurrentlySaved) {
          await deleteDoc(savedDocRef);
        } else {
          await setDoc(savedDocRef, {
            propertyId,
            userId: user.uid,
            savedAt: new Date().toISOString(),
          });
        }
      } catch (err) {
        handleFirestoreError(err, isCurrentlySaved ? OperationType.DELETE : OperationType.WRITE, docPath);
      }
    }

    return !isCurrentlySaved;
  };

  const isPropertySaved = (propertyId: string) => {
    return savedPropertyIds.includes(propertyId);
  };

  const submitInquiry = async (
    inquiryData: Omit<TourInquiry, 'id' | 'createdAt' | 'status'>
  ): Promise<boolean> => {
    const colPath = 'inquiries';
    try {
      await addDoc(collection(db, colPath), {
        ...inquiryData,
        userId: user ? user.uid : 'guest',
        status: 'pending',
        createdAt: new Date().toISOString(),
        serverTimestamp: serverTimestamp(),
      });
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, colPath);
      return false;
    }
  };

  const clearAuthError = () => setAuthError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        adminChecking,
        savedPropertyIds,
        signInWithGoogle,
        logOut,
        toggleSaveProperty,
        isPropertySaved,
        submitInquiry,
        authError,
        clearAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
