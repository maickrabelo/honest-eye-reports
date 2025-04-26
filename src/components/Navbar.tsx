
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const isLoggedIn = !!user;

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="audit-container">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-audit-primary rounded-md flex items-center justify-center">
                <span className="text-white font-semibold">HE</span>
              </div>
              <span className="text-xl font-bold text-audit-primary">Honest Eyes</span>
            </Link>
            
            {/* Display company logo if available */}
            {user?.role === 'company' && user?.companyLogo && (
              <div className="ml-6 flex items-center">
                <div className="h-10 w-px bg-gray-200 mx-4"></div>
                <img 
                  src={user.companyLogo} 
                  alt={user.companyName || 'Logo da empresa'} 
                  className="h-8 max-w-[120px] object-contain"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-destructive"></span>
                </Button>
                <div className="flex items-center gap-3">
                  <div className="hidden md:block text-sm text-right">
                    <div className="font-medium">{user.name}</div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-audit-accent flex items-center justify-center text-white">
                    {user.name.substring(0, 2).toUpperCase()}
                  </div>
                  <Button variant="ghost" onClick={handleLogout} className="hidden md:inline-flex">
                    Sair
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <Link to="/report">
                  <Button variant="outline">Fazer Denúncia</Button>
                </Link>
                <Link to="/login">
                  <Button>Entrar</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
