import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  Globe,
  FileText,
  LogOut,
  Menu,
  X,
  Shield,
  HardDrive,
  Ticket,
  Mail,
  Activity,
  Megaphone,
  UserCog,
  Layers,
  Tag,
  Clock,
  TrendingUp,
  Server,
} from 'lucide-react';
import { Button } from '../ui/Button';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const menuItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/users', icon: Users, label: 'Users' },
    { path: '/admin/groups', icon: Tag, label: 'User Groups' },
    { path: '/admin/templates', icon: Layers, label: 'User Templates' },
    { path: '/admin/admins', icon: UserCog, label: 'Admin Management' },
    { path: '/admin/storage', icon: HardDrive, label: 'Storage & Quota' },
    { path: '/admin/sending-limits', icon: TrendingUp, label: 'Sending Limits' },
    { path: '/admin/activity', icon: Activity, label: 'User Activity' },
    { path: '/admin/scheduled-actions', icon: Clock, label: 'Scheduled Actions' },
    { path: '/admin/support', icon: Ticket, label: 'Support Center' },
    { path: '/admin/aliases', icon: Mail, label: 'Email Aliases' },
    { path: '/admin/announcements', icon: Megaphone, label: 'Announcements' },
    { path: '/admin/domains', icon: Globe, label: 'Domains' },
    { path: '/admin/mailcow', icon: Server, label: 'Mail Server' },
    { path: '/admin/audit-logs', icon: FileText, label: 'Audit Logs' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-gray-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden p-2 rounded-md text-gray-300 hover:bg-gray-800"
              >
                {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <Shield className="w-8 h-8 text-blue-400" />
              <h1 className="text-xl font-bold">Admin Portal</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-300">
                {'email' in user! && user.email}
              </span>
              <Button variant="secondary" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        <aside
          className={`
            fixed lg:sticky top-0 left-0 h-screen w-64 bg-gray-900 text-white shadow-md z-40 transition-transform
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
        >
          <nav className="mt-8 px-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                    ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-800'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};
