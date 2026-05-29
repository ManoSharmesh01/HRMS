import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import {
  Users,
  Calendar,
  Clock,
  TrendingUp,
  ClipboardList,
  AlertCircle,
  Loader2,
  Bell
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
    timestamp: string;
  }>;
  upcomingEvents?: Array<{
    id: number;
    title: string;
    date: string;
    type: string;
  }>;
}

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
      color: 'from-blue-500/10 to-blue-500/5 text-blue-400 border-blue-500/20'
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

  return (
    <div className='space-y-8'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight text-white'>Consolidated Telemetry</h1>
        <p className='text-sm text-slate-400 mt-1'>Real-time HR analytics and activities snapshot</p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className={`p-6 rounded-2xl border bg-gradient-to-br ${stat.color} shadow-glass-sm transition-all duration-300 hover:scale-[1.02]`}
            >
              <div className='flex items-center justify-between'>
                <span className='text-sm font-semibold tracking-wide text-slate-400 uppercase'>{stat.name}</span>
                <div className='p-2.5 rounded-xl bg-white/5 border border-white/5'>
                  <Icon size={20} />
                </div>
              </div>
              <div className='mt-4 flex items-baseline'>
                <span className='text-3xl font-extrabold text-white tracking-tight'>{stat.value}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
        <div className='p-6 rounded-2xl glass-panel flex flex-col h-[400px]'>
          <div className='flex items-center justify-between pb-4 border-b border-white/5 mb-4'>
            <h3 className='font-bold text-white tracking-tight flex items-center'>
              <TrendingUp size={18} className='mr-2 text-indigo-400' />
              Recent Activities Logs
            </h3>
            <span className='text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-semibold uppercase'>Real-Time</span>
          </div>

          <div className='flex-1 overflow-y-auto space-y-4 pr-1'>
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
                    <p className='text-sm font-medium text-slate-100'>{act.message}</p>
                    <div className='flex items-center space-x-2 mt-1 text-xs text-slate-400'>
                      <span className='font-semibold uppercase tracking-wider text-indigo-400'>{act.module}</span>
                      <span>•</span>
                      <span>{new Date(act.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className='p-6 rounded-2xl glass-panel flex flex-col h-[400px]'>
          <div className='flex items-center justify-between pb-4 border-b border-white/5 mb-4'>
            <h3 className='font-bold text-white tracking-tight flex items-center'>
              <Calendar size={18} className='mr-2 text-indigo-400' />
              Upcoming Events Calendar
            </h3>
          </div>

          <div className='flex-1 overflow-y-auto space-y-4 pr-1'>
            {(!data?.upcomingEvents || data.upcomingEvents.length === 0) ? (
              <div className='h-full flex items-center justify-center text-slate-500 text-sm font-medium'>
                No upcoming events scheduled
              </div>
            ) : (
              data.upcomingEvents.map((event) => (
                <div key={event.id} className='flex items-start justify-between p-4 rounded-xl bg-white/5 border border-white/5 transition-all hover:bg-white/10'>
                  <div className='space-y-1'>
                    <h4 className='text-sm font-bold text-slate-100'>{event.title}</h4>
                    <p className='text-xs text-slate-400'>{new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                  <span className='text-xs px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 font-semibold capitalize'>
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