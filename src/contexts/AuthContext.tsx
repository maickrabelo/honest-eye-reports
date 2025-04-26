
import React, { createContext, useContext, useState, useEffect } from 'react';

type UserRole = 'company' | 'sst' | 'master' | null;

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyId?: string;
  companyName?: string;
  companyLogo?: string;
  sstId?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUserProfile: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for saved user in localStorage
    const savedUser = localStorage.getItem('honest_eyes_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // Mock login for demonstration
    setIsLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    let mockUser: User;
    
    // Mock different user roles based on email
    if (email.includes('company')) {
      mockUser = {
        id: '1',
        name: 'Empresa ABC',
        email: email,
        role: 'company',
        companyId: 'abc123',
        companyName: 'Empresa ABC Ltda.',
        companyLogo: '',
      };
    } else if (email.includes('sst')) {
      mockUser = {
        id: '2',
        name: 'Gestão SST',
        email: email,
        role: 'sst',
        sstId: 'sst456',
      };
    } else {
      mockUser = {
        id: '3',
        name: 'Admin Master',
        email: email,
        role: 'master',
      };
    }
    
    setUser(mockUser);
    localStorage.setItem('honest_eyes_user', JSON.stringify(mockUser));
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('honest_eyes_user');
  };

  const updateUserProfile = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('honest_eyes_user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
