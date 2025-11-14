import { useLocation } from "wouter";
import { useEffect, useState } from "react";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar se existe token de autenticação no localStorage
    const token = localStorage.getItem('auth_token');
    
    if (token) {
      setIsAuthenticated(true);
    } else {
      setLocation("/login");
    }
    
    setLoading(false);
  }, [setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
