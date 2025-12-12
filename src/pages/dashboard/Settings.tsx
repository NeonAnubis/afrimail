import React from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Shield, Bell, Globe, Smartphone } from 'lucide-react';
import { DashboardLayout } from '../../components/layouts/DashboardLayout';

export const Settings: React.FC = () => {
  const settings = [
    {
      icon: Shield,
      title: 'Two-Factor Authentication',
      description: 'Add an extra layer of security to your account',
      status: 'Coming Soon',
    },
    {
      icon: Bell,
      title: 'Email Notifications',
      description: 'Manage your email notification preferences',
      status: 'Coming Soon',
    },
    {
      icon: Globe,
      title: 'Language & Region',
      description: 'Set your preferred language and timezone',
      status: 'Coming Soon',
    },
    {
      icon: Smartphone,
      title: 'Connected Devices',
      description: 'Manage devices connected to your account',
      status: 'Coming Soon',
    },
  ];

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600 mb-8">Manage your account settings and preferences</p>

        <div className="grid gap-4 max-w-2xl">
          {settings.map((setting, index) => {
            const Icon = setting.icon;
            return (
              <Card key={index}>
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <Icon className="w-6 h-6 text-blue-600 mt-1" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {setting.title}
                      </h3>
                      <p className="text-gray-600">{setting.description}</p>
                    </div>
                  </div>
                  <Badge variant="info">{setting.status}</Badge>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
};
