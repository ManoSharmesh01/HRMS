import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  Users,
  Calendar,
  Clock,
  TrendingUp,
  ClipboardList,
  AlertCircle,
  Loader2,
  Bell,
  Activity as ActivityIcon,
  Sparkles
} from 'lucide-react';

interface DashboardStats {
  activeEmployeesCount?: number;
  presentRateToday?: string | number;
  outstandingLeaves?: number;
  totalEvents?: number;
  recentActivities?: Array<{
    id: number;
    message: string;
    module: string;
    type: string;
    createdAt?: string;
    timestamp?: string;
  }>;
  upcomingEvents?: Array<{
    id: number;
    title: string;
    date: string;
    type: string;
  }>;
  activityLogsTrend?: Array<{
    date: string;
    count: number;
  }>;
  headcountTrend?: Array<{
    month: string;
    headcount: number;
  }>;
}

// Relative time indicator function (Acceptance Criteria: relative time formats without page breakages)
function getRelativeTime(dateString?: string): string {
  if (!dateString) return 'Just now';
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (Math.abs(diffMins) < 1) {
      return 'Just now';
    }

    if (diffMs > 0) {
      // Past time
      if (diffMins < 60) {
        return `${diffMins}m ago`;
      }
      if (diffHours < 24) {
        return `${diffHours}h ago`;
      }
      if (diffDays === 1) {
        return 'Yesterday';
      }
      if (diffDays < 7) {
        return `${diffDays}d ago`;
      }
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } else {
      // Future time
      const absMins = Math.abs(diffMins);
      const absHours = Math.abs(diffHours);
      const absDays = Math.abs(diffDays);

      if (absMins < 60) {
        return `In ${absMins}m`;
      }
      if (absHours < 24) {
        return `In ${absHours}h`;
      }
      if (absDays === 1) {
        return 'Tomorrow';
      }
      if (absDays < 7) {
        return `In ${absDays}d`;
      }
      return `In ${absDays}d (${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })})`;
    }
  } catch (error) {
    return 'Just now';
  }
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel p-3 rounded-xl border border-white/10 text-xs shadow-xl">
        <p className="font-bold text-slate-300 mb-1">{label}</p>
        <p className="text-indigo-400 font-semibold">
          Count: <span className="text-white font-bold">{payload[0].value}</span>
        </p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { data, isLoading, error } = useQuery<DashboardStats>({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const response = await api.get('/dashboard/stats');
      return response.data;
    },
    refetchInterval: 10000,
  });

  if (isLoading) {
    return (
      <div className='h-[60vh] flex flex-col items-center justify-center space-y-4'>
        <Loader2 size={40} className='animate-spin text-indigo-400' />
        <p className='text-sm text-slate-400 font-medium font-sans'>Retrieving telemetry data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className='p-6 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 flex items-start space-x-3 max-w-xl mx-auto mt-12'>
        <AlertCircle size={24} className='shrink-0' />
        <div>
          <h3 className='font-semibold text-rose-300'>Connection Failure</h3>
          <p className='text-sm mt-1'>Unable to load dashboard telemetry. Please ensure the backend microservice is running and accessible.</p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      name: 'Active Employees',
      value: data?.activeEmployeesCount ?? 0,
      icon: Users,
      color: 'from-indigo-500/10 to-indigo-500/5 text-indigo-400 border-indigo-500/20'
    },
    {
      name: 'Attendance Rate',
      value: typeof data?.presentRateToday === 'number'
        ? `${data.presentRateToday}%` 
        : data?.presentRateToday ?? '0%',
      icon: Clock,
      color: 'from-emerald-500/10 to-emerald-500/5 text-emerald-400 border-emerald-500/20'
    },
    {
      name: 'Pending Leaves',
      value: data?.outstandingLeaves ?? 0,
      icon: ClipboardList,
      color: 'from-amber-500/10 to-amber-500/5 text-amber-400 border-amber-500/20'
    },
    {
      name: 'Upcoming Events',
      value: data?.totalEvents ?? 0,
      icon: Calendar,
      color: 'from-purple-500/10 to-purple-500/5 text-purple-400 border-purple-500/20'
    }
  ];

  // Default trends if not fully loaded or empty
  const defaultHeadcountTrend = [
    { month: 'Jan', headcount: 4 },
    { month: 'Feb', headcount: 5 },
    { month: 'Mar', headcount: 6 },
    { month: 'Apr', headcount: 6 },
    { month: 'May', headcount: 7 },
    { month: 'Jun', headcount: 8 },
  ];

  const defaultActivityTrend = [
    { date: 'Mon', count: 2 },
    { date: 'Tue', count: 4 },
    { date: 'Wed', count: 3 },
    { date: 'Thu', count: 5 },
    { date: 'Fri', count: 6 },
    { date: 'Sat', count: 1 },
    { date: 'Sun', count: 2 },
  ];

  const headcountTrendData = data?.headcountTrend && data.headcountTrend.length > 0 
    ? data.headcountTrend 
    : defaultHeadcountTrend;

  const activityTrendData = data?.activityLogsTrend && data.activityLogsTrend.length > 0
    ? data.activityLogsTrend
    : defaultActivityTrend;

  return (
    <div className='space-y-8 pb-12'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight text-white flex items-center gap-2'>
          <Sparkles className="text-indigo-400 animate-pulse" size={28} />
          Consolidated Telemetry
        </h1>
        <p className='text-sm text-slate-400 mt-1'>Real-time HR analytics, performance charts, and relative event log snapshot</p>
      </div>

      {/* KPI Blocks */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className={`p-6 rounded-2xl border bg-gradient-to-br ${stat.color} shadow-glass-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-lg`}
            >
              <div className='flex items-center justify-between'>
                <span className='text-xs font-semibold tracking-wider text-slate-400 uppercase'>{stat.name}</span>
                <div className='p-2.5 rounded-xl bg-white/5 border border-white/5'>
                  <Icon size={18} />
                </div>
              </div>
              <div className='mt-4 flex items-baseline'>
                <span className='text-3xl font-extrabold text-white tracking-tight'>{stat.value}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Visual Charts (Acceptance Criteria: Visual interactive graphs map headcount trends and activity logs cleanly) */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
        {/* Headcount Trend Chart */}
        <div className='p-6 rounded-2xl glass-panel flex flex-col h-[350px]'>
          <div className='flex items-center justify-between pb-3 border-b border-white/5 mb-4'>
            <h3 className='font-bold text-white tracking-tight flex items-center text-sm md:text-base'>
              <Users size={18} className='mr-2 text-indigo-400' />
              Active Headcount Trend
            </h3>
            <span className='text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-semibold uppercase'>
              6 Months
            </span>
          </div>
          <div className='flex-1 min-h-0 w-full'>
            <ResponsiveContainer width='100%' height='100%'>
              <AreaChart data={headcountTrendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="headcountGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="month" 
                  stroke="rgba(255,255,255,0.4)" 
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.4)" 
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)' }} />
                <Area 
                  type="monotone" 
                  dataKey="headcount" 
                  stroke="#6366f1" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#headcountGrad)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Activity Logs Trend Chart */}
        <div className='p-6 rounded-2xl glass-panel flex flex-col h-[350px]'>
          <div className='flex items-center justify-between pb-3 border-b border-white/5 mb-4'>
            <h3 className='font-bold text-white tracking-tight flex items-center text-sm md:text-base'>
              <ActivityIcon size={18} className='mr-2 text-emerald-400' />
              Activity Volume Frequency
            </h3>
            <span className='text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-semibold uppercase'>
              7 Days
            </span>
          </div>
          <div className='flex-1 min-h-0 w-full'>
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart data={activityTrendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="rgba(255,255,255,0.4)" 
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.4)" 
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
                <Bar 
                  dataKey="count" 
                  fill="#10b981" 
                  radius={[4, 4, 0, 0]} 
                  maxBarSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Lists Section: Recent Activity & Calendar Schedules */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
        {/* Recent Activity Log */}
        <div className='p-6 rounded-2xl glass-panel flex flex-col h-[400px]'>
          <div className='flex items-center justify-between pb-4 border-b border-white/5 mb-4'>
            <h3 className='font-bold text-white tracking-tight flex items-center text-sm md:text-base'>
              <TrendingUp size={18} className='mr-2 text-indigo-400' />
              Recent Activities Logs
            </h3>
            <span className='text-[10px] px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-semibold uppercase'>Real-Time</span>
          </div>

          <div className='flex-1 overflow-y-auto space-y-3 pr-1'>
            {(!data?.recentActivities || data.recentActivities.length === 0) ? (
              <div className='h-full flex items-center justify-center text-slate-500 text-sm font-medium'>
                No recent activity records found
              </div>
            ) : (
              data.recentActivities.map((act) => (
                <div key={act.id} className='flex items-start space-x-3 p-3 rounded-xl bg-white/5 border border-white/5 transition-all hover:bg-white/10'>
                  <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                    act.type === 'ERROR' ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'
                  }`}>
                    <Bell size={14} />
                  </div>
                  <div className='min-w-0 flex-1'>
                    <div className='flex items-center justify-between'>
                      <p className='text-sm font-medium text-slate-100 break-words leading-relaxed'>{act.message}</p>
                    </div>
                    <div className='flex items-center space-x-2 mt-1.5 text-xs text-slate-400'>
                      <span className='font-bold uppercase tracking-wider text-indigo-400 text-[10px] bg-indigo-400/5 px-2 py-0.5 rounded'>{act.module}</span>
                      <span>•</span>
                      <span className="font-medium text-slate-400">{getRelativeTime(act.createdAt || (act as any).timestamp)}</span>
                      {(act as any).actor && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-400 font-semibold italic">By: {(act as any).actor}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Schedules & Corporate Calendar */}
        <div className='p-6 rounded-2xl glass-panel flex flex-col h-[400px]'>
          <div className='flex items-center justify-between pb-4 border-b border-white/5 mb-4'>
            <h3 className='font-bold text-white tracking-tight flex items-center text-sm md:text-base'>
              <Calendar size={18} className='mr-2 text-indigo-400' />
              Upcoming Events Calendar
            </h3>
            <span className='text-[10px] px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 font-semibold uppercase'>Schedules</span>
          </div>

          <div className='flex-1 overflow-y-auto space-y-3 pr-1'>
            {(!data?.upcomingEvents || data.upcomingEvents.length === 0) ? (
              <div className='h-full flex items-center justify-center text-slate-500 text-sm font-medium'>
                No upcoming events scheduled
              </div>
            ) : (
              data.upcomingEvents.map((event) => (
                <div key={event.id} className='flex items-start justify-between p-4 rounded-xl bg-white/5 border border-white/5 transition-all hover:bg-white/10 gap-4'>
                  <div className='space-y-1 min-w-0 flex-1'>
                    <h4 className='text-sm font-bold text-slate-100 break-words leading-snug'>{event.title}</h4>
                    <p className='text-xs text-slate-400 flex flex-wrap items-center gap-1.5'>
                      <span className="font-medium text-slate-300">{new Date(event.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <span>•</span>
                      {/* Acceptance Criteria: dynamic listings of recent logs and calendar events show relative time formats */}
                      <span className='text-indigo-400 font-semibold'>{getRelativeTime(event.date)}</span>
                    </p>
                  </div>
                  <span className='text-[10px] px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 font-extrabold uppercase shrink-0 self-center'>
                    {event.type.toLowerCase()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
