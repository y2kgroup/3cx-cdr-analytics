import { useState, useEffect } from 'react';
import { format, subDays } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { apiClient, KPIs, AreaCode } from '../services/api';

export function Dashboard() {
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [areaCodesData, setAreaCodesData] = useState<AreaCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    from: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    to: format(new Date(), 'yyyy-MM-dd')
  });

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [kpisData, areaCodesData] = await Promise.all([
        apiClient.getKPIs(dateRange.from, dateRange.to),
        apiClient.getTopAreaCodes(dateRange.from, dateRange.to, 10)
      ]);

      setKpis(kpisData);
      setAreaCodesData(areaCodesData);
    } catch (err) {
      setError('Failed to fetch dashboard data');
      console.error('Dashboard data fetch error:', err);
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
          onClick={fetchData}
          className="mt-2 text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Call Analytics Dashboard
          </h2>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <label htmlFor="from" className="text-sm font-medium text-gray-700">
              From:
            </label>
            <input
              type="date"
              id="from"
              value={dateRange.from}
              onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
            <label htmlFor="to" className="text-sm font-medium text-gray-700">
              To:
            </label>
            <input
              type="date"
              id="to"
              value={dateRange.to}
              onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <button
            onClick={fetchData}
            className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md text-sm"
          >
            Refresh Data
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {kpis && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="Total Calls"
            value={kpis.totalCalls}
            color="blue"
          />
          <KPICard
            title="Incoming Calls"
            value={kpis.incoming}
            color="green"
          />
          <KPICard
            title="Outgoing Calls"
            value={kpis.outgoing}
            color="purple"
          />
          <KPICard
            title="Talk Time (min)"
            value={kpis.talkTimeMin}
            color="orange"
          />
        </div>
      )}

      {/* Area Codes Chart */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Top 10 Area Codes
        </h3>
        {areaCodesData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={areaCodesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="areaCode" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="calls" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-gray-500 text-center py-8">
            No area code data available
          </div>
        )}
      </div>
    </div>
  );
}

interface KPICardProps {
  title: string;
  value: number;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

function KPICard({ title, value, color }: KPICardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    green: 'bg-green-50 border-green-200 text-green-800',
    purple: 'bg-purple-50 border-purple-200 text-purple-800',
    orange: 'bg-orange-50 border-orange-200 text-orange-800',
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-3xl font-bold text-gray-900">
            {value.toLocaleString()}
          </p>
        </div>
        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg border ${colorClasses[color]}`}>
          <span className="text-xl font-bold">{value > 0 ? '📞' : '—'}</span>
        </div>
      </div>
    </div>
  );
}
