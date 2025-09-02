import { useState, useEffect } from 'react';
import { apiClient, type Settings } from '../services/api';

export function Settings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiClient.getSettings();
      setSettings(data);
    } catch (err) {
      setError('Failed to fetch settings');
      console.error('Settings fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-800">{error}</div>
        <button
          onClick={fetchSettings}
          className="mt-2 text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!settings) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            System Settings
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Application configuration and system status
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button
            onClick={fetchSettings}
            className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md text-sm"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Application Information */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Application Information
          </h3>
        </div>
        <div className="px-6 py-4 space-y-4">
          <SettingRow label="Version" value={settings.version} />
          <SettingRow 
            label="Last Updated" 
            value={new Date(settings.lastUpdated).toLocaleString()} 
          />
        </div>
      </div>

      {/* CDR Configuration */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            CDR Socket Configuration
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Configure your 3CX system to send CDR data to this server
          </p>
        </div>
        <div className="px-6 py-4 space-y-4">
          <SettingRow label="Server IP" value={settings.cdr.ip} />
          <SettingRow label="CDR Port" value={settings.cdr.port.toString()} />
        </div>
        <div className="px-6 py-4 border-t border-gray-200 bg-blue-50">
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-2">3CX Configuration Instructions:</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Go to 3CX Management Console → Settings → Advanced → CDR</li>
              <li>Set Log type: <strong>Active Socket</strong></li>
              <li>Set CDR Socket IP: <strong>{settings.cdr.ip}</strong></li>
              <li>Set CDR Socket Port: <strong>{settings.cdr.port}</strong></li>
              <li>Set Delimiter: <strong>TAB</strong> (do not remove delimiters)</li>
              <li>Ensure required fields are included in the correct order</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Database Status */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Database Status
          </h3>
        </div>
        <div className="px-6 py-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              MongoDB Connection
            </span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              settings.mongo.connected 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {settings.mongo.connected ? '● Connected' : '● Disconnected'}
            </span>
          </div>
          <SettingRow 
            label="Total Call Records" 
            value={settings.mongo.callCount.toLocaleString()} 
          />
        </div>
      </div>

      {/* System Health */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            System Health
          </h3>
        </div>
        <div className="px-6 py-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-sm">✓</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">
                System Operational
              </p>
              <p className="text-sm text-gray-500">
                All services are running normally
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface SettingRowProps {
  label: string;
  value: string;
}

function SettingRow({ label, value }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <span className="text-sm text-gray-900 font-mono bg-gray-50 px-2 py-1 rounded">
        {value}
      </span>
    </div>
  );
}
