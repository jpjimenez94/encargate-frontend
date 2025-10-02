// useAuth Hook - Manejo de autenticación
import { useState, useEffect, createContext, useContext } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  role?: 'client' | 'provider';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Fallback para cuando no hay contexto
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
      // Cargar usuario desde localStorage si existe
      if (typeof window !== 'undefined') {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          try {
            setUser(JSON.parse(savedUser));
          } catch (error) {
            console.error('Error parsing saved user:', error);
          }
        }
      }
    }, []);

    const login = async (email: string, password: string): Promise<boolean> => {
      setIsLoading(true);
      try {
        // Mock login - en producción esto sería una llamada real al API
        const mockUser: User = {
          id: '1',
          name: 'Usuario Test',
          email: email,
          role: 'client'
        };
        
        setUser(mockUser);
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(mockUser));
        }
        return true;
      } catch (error) {
        console.error('Login error:', error);
        return false;
      } finally {
        setIsLoading(false);
      }
    };

    const logout = () => {
      setUser(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
      }
    };

    return { user, login, logout, isLoading };
  }
  return context;
}
