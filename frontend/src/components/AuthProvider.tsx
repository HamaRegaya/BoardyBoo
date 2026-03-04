"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import axios from "axios";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  loginWithGoogle: async () => {},
  logout: async () => {},
  getToken: async () => null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      // If a user just logged in, sync their profile with our FastAPI backend
      if (currentUser) {
        try {
          const token = await currentUser.getIdToken();
          const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
          await axios.post(
            "http://localhost:8000/api/users/sync",
            { timezone: tz },
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          );
          console.log("[Auth] User synchronized with backend");
        } catch (error) {
          console.error("Failed to sync user with backend:", error);
        }
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      // Extract the Google OAuth access token for Calendar API access
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const googleAccessToken = credential?.accessToken;
      if (googleAccessToken && result.user) {
        try {
          const idToken = await result.user.getIdToken();
          const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
          await axios.post(
            "http://localhost:8000/api/users/sync",
            { google_access_token: googleAccessToken, timezone: tz },
            { headers: { Authorization: `Bearer ${idToken}` } }
          );
          console.log("[Auth] Google Calendar token sent to backend");
        } catch (err) {
          console.error("[Auth] Failed to sync Google token:", err);
        }
      }
      // onAuthStateChanged handles the rest
    } catch (error) {
      console.error("Error signing in with Google", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out", error);
      throw error;
    }
  };

  const getToken = async () => {
    if (!auth.currentUser) return null;
    return await auth.currentUser.getIdToken();
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
