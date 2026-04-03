import React, { createContext, useContext, ReactNode } from 'react';
import { TherapyState } from '../types';
import { useTherapySession } from '../hooks/useTherapySession';

export type TherapySessionContextType = ReturnType<typeof useTherapySession>;

export const TherapySessionContext = createContext<TherapySessionContextType | null>(null);

export function TherapySessionProvider({ children, initialState }: { children: ReactNode; initialState?: TherapyState }) {
  const session = useTherapySession(initialState);
  return (
    <TherapySessionContext.Provider value={session}>
      {children}
    </TherapySessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(TherapySessionContext);
  if (!context) {
    throw new Error('useSession must be used within <TherapySessionProvider>');
  }
  return context;
}
