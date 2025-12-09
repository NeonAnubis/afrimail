'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Shield,
  Users,
  Globe,
  Mail,
  Activity,
  HardDrive,
  LifeBuoy,
  Megaphone,
  FileText,
  UserCog,
  Tag,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  Clock,
  Gauge,
} from 'lucide-react';
import { ApiClient } from '@/lib/api';

interface AdminLayoutProps {
  children: React.ReactNode;
  admin?: {
    email: string;
    name: string;
  };
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, admin }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    { icon: Users, label: 'Users', path: '/admin/users' },
    { icon: Tag, label: 'Groups', path: '/admin/groups' },
    { icon: FileText, label: 'Templates', path: '/admin/templates' },
    { icon: Globe, label: 'Domains', path: '/admin/domains' },
    { icon: Mail, label: 'Aliases', path: '/admin/aliases' },
    { icon: HardDrive, label: 'Storage', path: '/admin/storage' },
    { icon: Gauge, label: 'Sending Limits', path: '/admin/sending-limits' },
    { icon: Activity, label: 'Activity', path: '/admin/activity' },
    { icon: Clock, label: 'Scheduled', path: '/admin/scheduled-actions' },
    { icon: LifeBuoy, label: 'Support', path: '/admin/support' },
    { icon: Megaphone, label: 'Announcements', path: '/admin/announcements' },
    { icon: UserCog, label: 'Admins', path: '/admin/admins' },
    { icon: FileText, label: 'Audit Logs', path: '/admin/audit-logs' },
  ];

  const handleLogout = async () => {
    try {
      await ApiClient.post('/auth/logout', {});
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout failed:', error);
      router.push('/admin/login');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile Header */}
      <div className="lg:hidden bg-gray-900 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-blue-400" />
          <span className="font-bold text-xl">Admin Portal</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 hover:bg-gray-800 rounded-lg"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-gray-900 px-4 py-4 max-h-96 overflow-y-auto">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-gray-800 rounded-lg"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </nav>
        </div>
      )}

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 bg-gray-900 min-h-screen">
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <Shield className="w-10 h-10 text-blue-400" />
              <div>
                <h1 className="font-bold text-xl text-white">AfriMail</h1>
                <p className="text-sm text-gray-400">Admin Portal</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium text-sm">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-gray-700">
            {admin && (
              <div className="mb-4 px-4">
                <p className="text-sm font-medium text-white">{admin.name}</p>
                <p className="text-xs text-gray-400 truncate">{admin.email}</p>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-gray-800 rounded-lg"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
};
