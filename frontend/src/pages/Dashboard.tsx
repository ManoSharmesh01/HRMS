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
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import {
  Users,
  Calendar,
  Clock,
  TrendingUp,
  ClipboardList,
  Bell,
  Activity as ActivityIcon,
  Sparkles,
  PieChart as PieChartIcon,
  BarChart3,
  RefreshCcw
} from 'lucide-react';
import { KPISkeleton, ChartSkeleton, ListSkeleton } from '../components/common/Skeleton';
import ErrorBanner from '../components/common/ErrorBanner';
import EmptyState from '../components/common/EmptyState';
import { useTheme } from '../context/ThemeContext';

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
    actor?: string;
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
}

interface DashboardCharts {
  departmentHeadcount: Array<{ name: string; value: number }>;
  attendanceTrend: Array<{ month: string; percentage: number }>;
  leaveDistribution: Array<{ type: string; count: number }>;
}

// Relative time indicator function
function getRelativeTime(dateString?: string): string {
  if (!dateString) return 'Just now';
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (Math.abs(diffMins) < 1) return 'Just now';

    if (diffMs > 0) {
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } else {
      const absMins = Math.abs(diffMins);
      const absHours = Math.abs(diffHours);
      const absDays = Math.abs(diffDays);
      if (absMins < 60) return `In ${absMins}m`;
      if (absHours < 24) return `In ${absHours}h`;
      if (absDays === 1) return 'Tomorrow';
      if (absDays < 7) return `In ${absDays}d`;
      return `In ${absDays}d (${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })})`;
    }
  } catch (error) {
    return 'Just now';
  }
}

const CustomTooltip = ({ active, payload, label, theme }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel p-3 rounded-xl border border-black/5 dark:border-white/10 text-xs shadow-xl">
        <p className={`font-bold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'} mb-1`}>{label || payload[0].payload.name || payload[0].payload.type}</p>
        <p className="text-indigo-600 dark:text-indigo-400 font-semibold">
          {payload[0].name || 'Value'}: <span className={`${theme === 'dark' ? 'text-white' : 'text-slate-900'} font-bold`}>{payload[0].value}{payload[0].unit || ''}</span>
        </p>
      </div>
    );
  }
  return null;
};

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function Dashboard() {
  const { theme } = useTheme();
  const { data: stats, isLoading: statsLoading, error: statsError, refetch: refetchStats, isFetching: statsFetching } = useQuery<DashboardStats>({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const response = await api.get('/dashboard/stats');
      return response.data;
    },
    refetchInterval: 15000,
  });

  const { data: charts, isLoading: chartsLoading, error: chartsError, refetch: refetchCharts } = useQuery<DashboardCharts>({
    queryKey: ['dashboardCharts'],
    queryFn: async () => {
      const response = await api.get('/dashboard/charts');
      return response.data;
    },
    refetchInterval: 60000,
  });

  const handleRetry = () => {
    refetchStats();
    refetchCharts();
  };

  if (statsError || chartsError) {
    return (
      <div className='flex items-center justify-center min-h-[60vh]'>
        <ErrorBanner 
          message="Unable to load dashboard telemetry. Please ensure the backend microservice is running and accessible."
          onRetry={handleRetry}
        />
      </div>
    );
  }

  const kpis = [
    {
      name: 'Active Employees',
      value: stats?.activeEmployeesCount ?? 0,
      icon: Users,
      color: 'from-indigo-500/10 to-indigo-500/5 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
    },
    {
      name: 'Attendance Rate',
      value: stats?.presentRateToday ?? '92%',
      icon: Clock,
      color: 'from-emerald-500/10 to-emerald-500/5 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
    },
    {
      name: 'Pending Leaves',
      value: stats?.outstandingLeaves ?? 0,
      icon: ClipboardList,
      color: 'from-amber-500/10 to-amber-500/5 text-amber-600 dark:text-amber-400 border-amber-500/20'
    },
    {
      name: 'Upcoming Events',
      value: stats?.totalEvents ?? 0,
      icon: Calendar,
      color: 'from-purple-500/10 to-purple-500/5 text-purple-600 dark:text-purple-400 border-purple-500/20'
    }
  ];

  const chartStroke = theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  const chartText = theme === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';

  return (
    <div className='space-y-8 pb-12 animate-fade-in'>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className='text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2'>
            <Sparkles className="text-indigo-500 dark:text-indigo-400 animate-pulse" size={28} />
            Consolidated Telemetry
          </h1>
          <p className='text-sm text-slate-500 dark:text-slate-400 mt-1'>Real-time HR analytics, performance charts, and relative event log snapshot</p>
        </div>
        <button 
          onClick={() => refetchStats()}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/10 transition-all"
        >
          <RefreshCcw size={14} className={statsFetching ? 'animate-spin' : ''} />
          Refresh Data
        </button>
      </div>

      {/* KPI Blocks */}
      {statsLoading ? (
        <KPISkeleton />
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
          {kpis.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                className={`p-6 rounded-2xl border bg-gradient-to-br ${stat.color} shadow-glass-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-lg`}
              >
                <div className='flex items-center justify-between'>
                  <span className='text-xs font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase'>{stat.name}</span>
                  <div className='p-2.5 rounded-xl bg-white/50 dark:bg-white/5 border border-black/5 dark:border-white/5'>
                    <Icon size={18} />
                  </div>
                </div>
                <div className='mt-4 flex items-baseline'>
                  <span className='text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight'>{stat.value}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Visual Charts Row 1: Trends */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
        {chartsLoading ? <ChartSkeleton /> : (
          <div className='p-6 rounded-2xl glass-panel flex flex-col h-[350px]'>
            <div className='flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/5 mb-4'>
              <h3 className='font-bold text-slate-900 dark:text-white tracking-tight flex items-center text-sm md:text-base'>
                <BarChart3 size={18} className='mr-2 text-indigo-500 dark:text-indigo-400' />
                Monthly Attendance Trend
              </h3>
              <span className='text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-300 font-semibold uppercase'>
                6 Months (%)
              </span>
            </div>
            <div className='flex-1 min-h-0 w-full'>
              <ResponsiveContainer width='100%' height='100%'>
                <AreaChart data={charts?.attendanceTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="attendanceGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartStroke} vertical={false} />
                  <XAxis dataKey="month" stroke={chartText} fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke={chartText} fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} unit="%" />
                  <Tooltip content={<CustomTooltip theme={theme} />} cursor={{ stroke: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
                  <Area type="monotone" dataKey="percentage" name="Attendance" unit="%" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#attendanceGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {statsLoading ? <ChartSkeleton /> : (
          <div className='p-6 rounded-2xl glass-panel flex flex-col h-[350px]'>
            <div className='flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/5 mb-4'>
              <h3 className='font-bold text-slate-900 dark:text-white tracking-tight flex items-center text-sm md:text-base'>
                <ActivityIcon size={18} className='mr-2 text-emerald-500 dark:text-emerald-400' />
                Activity Volume Frequency
              </h3>
              <span className='text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-semibold uppercase'>
                7 Days
              </span>
            </div>
            <div className='flex-1 min-h-0 w-full'>
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart data={stats?.activityLogsTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartStroke} vertical={false} />
                  <XAxis dataKey="date" stroke={chartText} fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke={chartText} fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip theme={theme} />} cursor={{ fill: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' }} />
                  <Bar dataKey="count" name="Activity" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Visual Charts Row 2: Distributions */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
        {chartsLoading ? <ChartSkeleton /> : (
          <div className='p-6 rounded-2xl glass-panel flex flex-col h-[350px]'>
            <div className='flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/5 mb-4'>
              <h3 className='font-bold text-slate-900 dark:text-white tracking-tight flex items-center text-sm md:text-base'>
                <PieChartIcon size={18} className='mr-2 text-amber-500 dark:text-amber-400' />
                Department Headcount Distribution
              </h3>
              <span className='text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-300 font-semibold uppercase'>
                Current
              </span>
            </div>
            <div className='flex-1 min-h-0 w-full'>
              <ResponsiveContainer width='100%' height='100%'>
                <PieChart>
                  <Pie
                    data={charts?.departmentHeadcount || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    nameKey="name"
                    stroke={theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
                  >
                    {charts?.departmentHeadcount?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip theme={theme} />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {chartsLoading ? <ChartSkeleton /> : (
          <div className='p-6 rounded-2xl glass-panel flex flex-col h-[350px]'>
            <div className='flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/5 mb-4'>
              <h3 className='font-bold text-slate-900 dark:text-white tracking-tight flex items-center text-sm md:text-base'>
                <ClipboardList size={18} className='mr-2 text-purple-500 dark:text-purple-400' />
                Leave Type Distribution
              </h3>
              <span className='text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-300 font-semibold uppercase'>
                All Time
              </span>
            </div>
            <div className='flex-1 min-h-0 w-full'>
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart data={charts?.leaveDistribution} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartStroke} horizontal={true} vertical={false} />
                  <XAxis type="number" stroke={chartText} fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis dataKey="type" type="category" stroke={chartText} fontSize={10} tickLine={false} axisLine={false} width={80} />
                  <Tooltip content={<CustomTooltip theme={theme} />} />
                  <Bar dataKey="count" name="Leaves" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Lists Section: Recent Activity & Calendar Schedules */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
        {/* Recent Activity Log */}
        <div className='p-6 rounded-2xl glass-panel flex flex-col h-[400px]'>
          <div className='flex items-center justify-between pb-4 border-b border-black/5 dark:border-white/5 mb-4'>
            <h3 className='font-bold text-slate-900 dark:text-white tracking-tight flex items-center text-sm md:text-base'>
              <TrendingUp size={18} className='mr-2 text-indigo-500 dark:text-indigo-400' />
              Audit Trail & Mutation Logs
            </h3>
            <span className='text-[10px] px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-300 font-semibold uppercase'>Real-Time</span>
          </div>

          <div className='flex-1 overflow-y-auto space-y-3 pr-1'>
            {statsLoading ? <ListSkeleton items={5} /> : (!stats?.recentActivities || stats.recentActivities.length === 0) ? (
              <div className='h-full flex items-center justify-center'>
                <EmptyState 
                  title="No recent activity"
                  description="There are no activity logs recorded in the system yet."
                  icon={ActivityIcon}
                />
              </div>
            ) : (
              stats.recentActivities.map((act) => (
                <div key={act.id} className='flex items-start space-x-3 p-3 rounded-xl bg-white/50 dark:bg-white/5 border border-black/5 dark:border-white/5 transition-all hover:bg-white/10'>
                  <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                    act.type === 'ERROR' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  }`}>
                    <Bell size={14} />
                  </div>
                  <div className='min-w-0 flex-1'>
                    <div className='flex items-center justify-between'>
                      <p className='text-sm font-medium text-slate-900 dark:text-slate-100 break-words leading-relaxed'>{act.message}</p>
                    </div>
                    <div className='flex items-center space-x-2 mt-1.5 text-xs text-slate-500 dark:text-slate-400'>
                      <span className='font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 text-[10px] bg-indigo-400/5 px-2 py-0.5 rounded'>{act.module}</span>
                      <span>•</span>
                      <span className="font-medium text-slate-500 dark:text-slate-400">{getRelativeTime(act.createdAt || (act as any).timestamp)}</span>
                      {act.actor && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold italic truncate">By: {act.actor}</span>
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
          <div className='flex items-center justify-between pb-4 border-b border-black/5 dark:border-white/5 mb-4'>
            <h3 className='font-bold text-slate-900 dark:text-white tracking-tight flex items-center text-sm md:text-base'>
              <Calendar size={18} className='mr-2 text-indigo-500 dark:text-indigo-400' />
              Upcoming Events Calendar
            </h3>
            <span className='text-[10px] px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-300 font-semibold uppercase'>Schedules</span>
          </div>

          <div className='flex-1 overflow-y-auto space-y-3 pr-1'>
            {statsLoading ? <ListSkeleton items={5} /> : (!stats?.upcomingEvents || stats.upcomingEvents.length === 0) ? (
              <div className='h-full flex items-center justify-center'>
                <EmptyState 
                  title="No upcoming events"
                  description="The corporate calendar is currently empty. Check back later for updates."
                  icon={Calendar}
                />
              </div>
            ) : (
              stats.upcomingEvents.map((event) => (
                <div key={event.id} className='flex items-start justify-between p-4 rounded-xl bg-white/50 dark:bg-white/5 border border-black/5 dark:border-white/5 transition-all hover:bg-white/10 gap-4'>
                  <div className='space-y-1 min-w-0 flex-1'>
                    <h4 className='text-sm font-bold text-slate-900 dark:text-slate-100 break-words leading-snug'>{event.title}</h4>
                    <p className='text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-1.5'>
                      <span className="font-medium text-slate-600 dark:text-slate-300">{new Date(event.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <span>•</span>
                      <span className='text-indigo-600 dark:text-indigo-400 font-semibold'>{getRelativeTime(event.date)}</span>
                    </p>
                  </div>
                  <span className='text-[10px] px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-300 font-extrabold uppercase shrink-0 self-center'>
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