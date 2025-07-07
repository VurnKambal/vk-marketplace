'use client';

import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  Bell, 
  Shield, 
  Moon, 
  Globe, 
  CreditCard, 
  Download,
  Trash2,
  AlertTriangle
} from "lucide-react";
import { useState } from "react";

export default function SettingsPage() {
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    marketing: false
  });

  const [privacy, setPrivacy] = useState({
    profileVisible: true,
    showEmail: false,
    showPhone: false
  });

  const handleNotificationChange = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePrivacyChange = (key: keyof typeof privacy) => {
    setPrivacy(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />
      
      <div className="max-w-4xl mx-auto p-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-gray-500 to-gray-700 rounded-2xl flex items-center justify-center shadow-lg">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600">Manage your account preferences</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Notifications */}
          <Card className="border-0 shadow-xl rounded-3xl bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <Bell className="w-5 h-5 text-blue-600" />
                <span>Notifications</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Email Notifications</h4>
                  <p className="text-sm text-gray-500">Receive updates about your listings</p>
                </div>
                <button
                  onClick={() => handleNotificationChange('email')}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    notifications.email ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    notifications.email ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Push Notifications</h4>
                  <p className="text-sm text-gray-500">Get instant alerts on your device</p>
                </div>
                <button
                  onClick={() => handleNotificationChange('push')}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    notifications.push ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    notifications.push ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">SMS Notifications</h4>
                  <p className="text-sm text-gray-500">Receive text messages for urgent updates</p>
                </div>
                <button
                  onClick={() => handleNotificationChange('sms')}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    notifications.sms ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    notifications.sms ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Marketing Emails</h4>
                  <p className="text-sm text-gray-500">Tips, promotions, and marketplace updates</p>
                </div>
                <button
                  onClick={() => handleNotificationChange('marketing')}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    notifications.marketing ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    notifications.marketing ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Privacy */}
          <Card className="border-0 shadow-xl rounded-3xl bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-green-600" />
                <span>Privacy & Security</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Profile Visibility</h4>
                  <p className="text-sm text-gray-500">Allow others to see your profile</p>
                </div>
                <button
                  onClick={() => handlePrivacyChange('profileVisible')}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    privacy.profileVisible ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    privacy.profileVisible ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Show Email</h4>
                  <p className="text-sm text-gray-500">Display email on your public profile</p>
                </div>
                <button
                  onClick={() => handlePrivacyChange('showEmail')}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    privacy.showEmail ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    privacy.showEmail ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Show Phone</h4>
                  <p className="text-sm text-gray-500">Display phone number on listings</p>
                </div>
                <button
                  onClick={() => handlePrivacyChange('showPhone')}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    privacy.showPhone ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    privacy.showPhone ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Account Management */}
          <Card className="border-0 shadow-xl rounded-3xl bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <CreditCard className="w-5 h-5 text-purple-600" />
                <span>Account Management</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full justify-start" variant="outline">
                <Download className="w-4 h-4 mr-3" />
                Download Your Data
              </Button>
              
              <Button className="w-full justify-start" variant="outline">
                <Globe className="w-4 h-4 mr-3" />
                Change Language
              </Button>

              <Button className="w-full justify-start" variant="outline">
                <Moon className="w-4 h-4 mr-3" />
                Dark Mode
                <Badge variant="outline" className="ml-auto">Coming Soon</Badge>
              </Button>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-0 shadow-xl rounded-3xl bg-red-50/80 backdrop-blur-sm border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3 text-red-700">
                <AlertTriangle className="w-5 h-5" />
                <span>Danger Zone</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-red-100 rounded-2xl border border-red-200">
                <h4 className="font-medium text-red-900 mb-2">Delete Account</h4>
                <p className="text-sm text-red-700 mb-4">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <Button 
                  variant="destructive" 
                  className="bg-red-600 hover:bg-red-700"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                      // Handle account deletion
                      alert('Account deletion functionality would be implemented here');
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}