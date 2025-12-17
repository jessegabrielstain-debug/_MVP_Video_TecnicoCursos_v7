'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Settings, 
  Key, 
  Users, 
  Database, 
  Shield, 
  BarChart3, 
  LogOut,
  Menu,
  X,
  Home,
  Server,
  Bell
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [adminName, setAdminName] = useState('Administrador');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/admin/auth/verify', {
        credentials: 'include'
      });
      
      if (res.ok) {
        const data = await res.json();
        setIsAuthenticated(true);
        setAdminName(data.name || 'Administrador');
      } else {
        if (pathname !== '/admin/login') {
          router.push('/admin/login');
        }
      }
    } catch {
      if (pathname !== '/admin/login') {
        router.push('/admin/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  // Se está na página de login, renderiza só o children
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const menuItems = [
    { href: '/admin', icon: Home, label: 'Dashboard', exact: true },
    { href: '/admin/credentials', icon: Key, label: 'Credenciais & APIs' },
    { href: '/admin/environment', icon: Server, label: 'Variáveis de Ambiente' },
    { href: '/admin/users', icon: Users, label: 'Usuários' },
    { href: '/admin/database', icon: Database, label: 'Banco de Dados' },
    { href: '/admin/security', icon: Shield, label: 'Segurança' },
    { href: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
    { href: '/admin/settings', icon: Settings, label: 'Configurações' },
  ];

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Sidebar */}
      <aside 
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-gray-800 border-r border-gray-700 transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-700">
          {sidebarOpen && (
            <span className="text-xl font-bold text-white">
              <span className="text-blue-500">MVP</span> Admin
            </span>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-700 text-gray-400"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, item.exact);
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-4 py-3 mx-2 rounded-lg transition-colors ${
                  active 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <Icon size={20} />
                {sidebarOpen && (
                  <span className="ml-3">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Info */}
        <div className="border-t border-gray-700 p-4">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
              {adminName.charAt(0).toUpperCase()}
            </div>
            {sidebarOpen && (
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-white">{adminName}</p>
                <p className="text-xs text-gray-400">Super Admin</p>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <button
              onClick={handleLogout}
              className="mt-3 w-full flex items-center justify-center px-4 py-2 text-sm text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <LogOut size={16} className="mr-2" />
              Sair
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-6">
          <h1 className="text-xl font-semibold text-white">
            Painel Administrativo
          </h1>
          <div className="flex items-center space-x-4">
            <button className="p-2 rounded-lg hover:bg-gray-700 text-gray-400 relative">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="text-sm text-gray-400">
              MVP Video TécnicoCursos v7
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
