import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { exportToCSV } from '../utils/csvUtils';
import {
  Clock,
  UserCheck,
  UserMinus,
  AlertCircle,
  Calendar,
  CheckCircle,
  TrendingUp,
  RefreshCw,
  Search,
  Sparkles,
  Download,
  History
} from 'lucide-react';
import { KPISkeleton, TableSkeleton, Button, Card, Badge } from '../components/common';
import ErrorBanner from '../components/common/ErrorBanner';
import EmptyState from '../components/common/EmptyState';

interface AttendanceRecord {
  id: number;
  employeeId: number;
  date: string;
  checkIn: string;
  checkOut: string | null;
  status: string;
  totalHours: number | null;
}

interface TodayResponse {
  checkedIn: boolean;
  checkedOut: boolean;
  record: AttendanceRecord | null;
}

export default function Attendance() {
  const queryClient = useQueryClient();
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [elapsedText, setElapsedText] = useState<string>('00h 00m 00s');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Keep current real time updated every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch today's check-in status
  const { data: todayData, isLoading: todayLoading, isError: todayError, refetch: refetchToday } = useQuery<TodayResponse>({
    queryKey: ['attendanceToday'],
    queryFn: async () => {
      const response = await api.get('/attendance/today');
      return response.data;
    }
  });

  // Fetch personal check-in history
  const { data: historyData, isLoading: historyLoading, isError: historyError, refetch: refetchHistory } = useQuery<AttendanceRecord[]>({
    queryKey: ['attendanceHistory'],
    queryFn: async () => {
      const response = await api.get('/attendance/history');
      return response.data;
    }
  });

  // Real-time elapsed duration timer helper (runs when checked in but not checked out)
  useEffect(() => {
    if (todayData?.checkedIn && todayData.record && !todayData.checkedOut) {
      const checkInTime = new Date(todayData.record.checkIn).getTime();

      const calculateElapsed = () => {
        const now = new Date().getTime();
        const diffMs = Math.max(0, now - checkInTime);

        const totalSecs = Math.floor(diffMs / 1000);
        const hours = Math.floor(totalSecs / 3600);
        const minutes = Math.floor((totalSecs % 3600) / 60);
        const seconds = totalSecs % 60;

        const pad = (num: number) => String(num).padStart(2, '0');
        setElapsedText(`${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`);
      };

      calculateElapsed();
      const interval = setInterval(calculateElapsed, 1000);
      return () => clearInterval(interval);
    } else if (todayData?.checkedIn && todayData.record?.checkIn && todayData.record?.checkOut) {
      // Checked out - calculate total static elapsed time
      const checkInTime = new Date(todayData.record.checkIn).getTime();
      const checkOutTime = new Date(todayData.record.checkOut).getTime();
      const diffMs = Math.max(0, checkOutTime - checkInTime);
      const totalSecs = Math.floor(diffMs / 1000);
      const hours = Math.floor(totalSecs / 3600);
      const minutes = Math.floor((totalSecs % 3600) / 60);
      const seconds = totalSecs % 60;
      const pad = (num: number) => String(num).padStart(2, '0');
      setElapsedText(`${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`);
    } else {
      setElapsedText('00h 00m 00s');
    }
  }, [todayData]);

  // Check-In Mutation
  const checkInMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/attendance/check-in');
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['attendanceToday'] });
      queryClient.invalidateQueries({ queryKey: ['attendanceHistory'] });
      setNotification({
        message: `Successfully checked in at ${new Date(data.checkIn).toLocaleTimeString()}${data.status === 'Late' ? ' (Marked Late)' : ''}!`,
        type: 'success'
      });
      setTimeout(() => setNotification(null), 5000);
    },
    onError: (error: any) => {
      const errMsg = error.response?.data?.error || 'Failed to check in. Please try again.';
      setNotification({
        message: errMsg,
        type: 'error'
      });
      setTimeout(() => setNotification(null), 5000);
    }
  });

  // Check-Out Mutation
  const checkOutMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/attendance/check-out');
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['attendanceToday'] });
      queryClient.invalidateQueries({ queryKey: ['attendanceHistory'] });
      setNotification({
        message: `Successfully checked out! Worked total of ${data.totalHours ?? 0} hours.`,
        type: 'success'
      });
      setTimeout(() => setNotification(null), 5000);
    },
    onError: (error: any) => {
      const errMsg = error.response?.data?.error || 'Failed to check out. Please try again.';
      setNotification({
        message: errMsg,
        type: 'error'
      });
      setTimeout(() => setNotification(null), 5000);
    }
  });

  const handleCheckIn = () => {
    checkInMutation.mutate();
  };

  const handleCheckOut = () => {
    checkOutMutation.mutate();
  };

  const forceRefetch = () => {
    refetchToday();
    refetchHistory();
  };

  // Filter history records based on search query and status filter
  const filteredHistory = (historyData || []).filter((record) => {
    // Filter by status
    if (statusFilter !== 'ALL') {
      const matchStatus = record.status?.toUpperCase() === statusFilter.toUpperCase();
      if (!matchStatus) return false;
    }

    // Filter by date string
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      const dateStr = new Date(record.date).toLocaleDateString().toLowerCase();
      const checkInStr = new Date(record.checkIn).toLocaleTimeString().toLowerCase();
      const checkOutStr = record.checkOut ? new Date(record.checkOut).toLocaleTimeString().toLowerCase() : 'active';
      const statusStr = record.status?.toLowerCase() || '';

      return (
        dateStr.includes(query) ||
        checkInStr.includes(query) ||
        checkOutStr.includes(query) ||
        statusStr.includes(query)
      );
    }

    return true;
  });

  const handleExport = () => {
    const headers = [
      { label: 'Date', key: 'date' },
      { label: 'Check In', key: 'checkIn' },
      { label: 'Check Out', key: 'checkOut' },
      { label: 'Status', key: 'status' },
      { label: 'Total Hours', key: 'totalHours' }
    ];

    const formattedData = filteredHistory.map(record => ({
      ...record,
      date: new Date(record.date).toLocaleDateString(),
      checkIn: new Date(record.checkIn).toLocaleTimeString(),
      checkOut: record.checkOut ? new Date(record.checkOut).toLocaleTimeString() : 'Active',
      totalHours: record.totalHours ?? '--'
    }));

    exportToCSV(formattedData, headers, 'Attendance_History');
  };

  // Compute metrics from history
  const totalDays = historyData?.length || 0;
  const lateDays = historyData?.filter((r) => r.status?.toUpperCase() === 'LATE').length || 0;
  const totalWorkedHours = historyData?.reduce((sum, r) => sum + (r.totalHours || 0), 0) || 0;
  const averageHours = totalDays > 0 ? (totalWorkedHours / totalDays).toFixed(2) : '0';

  const isCheckingIn = checkInMutation.isPending;
  const isCheckingOut = checkOutMutation.isPending;

  if (todayError || historyError) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <ErrorBanner 
          message="Unable to load attendance synchronization data. Please check your network connectivity."
          onRetry={forceRefetch}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
              <Clock size={24} />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white font-sans">
              Attendance Workspace
            </h1>
          </div>
          <p className="mt-2 text-slate-400 max-w-xl text-sm leading-relaxed">
            Monitor active work shifts, record daily check-ins/check-outs, and review chronological history.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-semibold text-indigo-300 hover:text-white bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 transition-all duration-200"
          >
            <Download size={14} className="mr-2" />
            Export Logs
          </button>
          <button
            onClick={forceRefetch}
            className="flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-semibold text-indigo-300 hover:text-white bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 transition-all duration-200"
          >
            <RefreshCw size={14} className="mr-2" />
            Refresh Stats
          </button>
        </div>
      </div>

      {/* Notifications banner */}
      {notification && (
        <div
          className={`p-4 rounded-xl border flex items-start space-x-3 transition-all duration-300 ${
            notification.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400 shadow-emerald-500/5'
              : 'bg-rose-500/10 border-rose-500/25 text-rose-400 shadow-rose-500/5'
          } shadow-lg`}
        >
          {notification.type === 'success' ? (
            <CheckCircle size={20} className="shrink-0 mt-0.5 text-emerald-400" />
          ) : (
            <AlertCircle size={20} className="shrink-0 mt-0.5 text-rose-400" />
          )}
          <div className="flex-1">
            <p className="text-sm font-semibold">{notification.message}</p>
          </div>
        </div>
      )}

      {/* Grid of Workspaces */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Active Clock Controls widget (Left/Top 5 cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-6">
          <Card className="bg-slate-900/60 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[360px]" noPadding>
            {/* Background glowing circle */}
            <div className="absolute top-0 right-0 w-44 h-44 bg-indigo-500/10 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none" />

            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <Sparkles size={12} className="text-indigo-400" />
                  Active Session
                </span>
                <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                  todayData?.checkedOut
                    ? 'bg-slate-500/10 text-slate-400 border border-white/5'
                    : todayData?.checkedIn
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}>
                  {todayLoading ? 'Syncing...' : todayData?.checkedOut
                    ? 'Completed Today'
                    : todayData?.checkedIn
                    ? 'Currently Logged In'
                    : 'Not Logged In'}
                </span>
              </div>

              {/* Digital Wall Clock */}
              <div className="text-center py-6">
                <p className="text-sm font-semibold text-slate-400">Current Time</p>
                <p className="text-4xl font-black tracking-widest text-white mt-1 select-none font-mono">
                  {currentTime.toLocaleTimeString()}
                </p>
                <p className="text-xs text-indigo-300/80 font-medium mt-1">
                  {currentTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>

              {/* Shift Duration Counter */}
              <div className="p-4 rounded-xl bg-slate-950/40 border border-white/5 text-center">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                  {todayData?.checkedOut ? 'Total Worked Shift Time' : 'Elapsed Shift Duration'}
                </p>
                <p className="text-3xl font-extrabold text-indigo-300 mt-2 tracking-tight font-mono">
                  {elapsedText}
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="relative z-10 pt-6 mt-4 border-t border-white/5 flex gap-4 px-6 pb-6">
              {!todayData?.checkedIn ? (
                <Button
                  onClick={handleCheckIn}
                  isLoading={isCheckingIn}
                  disabled={todayLoading}
                  className="flex-1"
                  leftIcon={<UserCheck size={16} />}
                >
                  Clock In Now
                </Button>
              ) : !todayData?.checkedOut ? (
                <Button
                  onClick={handleCheckOut}
                  isLoading={isCheckingOut}
                  disabled={todayLoading}
                  variant="danger"
                  className="flex-1"
                  leftIcon={<UserMinus size={16} />}
                >
                  Clock Out Now
                </Button>
              ) : (
                <Button
                  disabled
                  variant="secondary"
                  className="flex-1 cursor-not-allowed"
                  leftIcon={<CheckCircle className="text-slate-500" size={16} />}
                >
                  Shift Closed Today
                </Button>
              )}
            </div>
          </Card>
        </div>

        {/* Status Panels (Right 7 cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-6">
          {historyLoading ? <KPISkeleton /> : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Status Panel: Today's Status */}
              <Card className="flex items-start space-x-4 p-5" noPadding>
                <div className={`p-3 rounded-xl ${
                  todayData?.checkedIn
                    ? todayData.record?.status === 'Late'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                    : 'bg-slate-500/10 text-slate-400 border border-white/5'
                }`}>
                  <UserCheck size={20} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Today's Status</p>
                  <p className="text-lg font-bold text-white mt-1">
                    {todayLoading
                      ? 'Loading...'
                      : todayData?.checkedIn
                      ? todayData.record?.status === 'Late'
                        ? 'Present (Late)'
                        : 'Present (On-Time)'
                      : 'Not Checked-In'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {todayData?.checkedIn ? 'Your shift status for today' : 'No attendance record registered yet'}
                  </p>
                </div>
              </Card>

              {/* Status Panel: Worked Hours (Total/Avg) */}
              <div className="glass-panel p-5 rounded-2xl border border-white/5 bg-slate-900/40 flex items-start space-x-4">
                <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/25">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average Shift Hours</p>
                  <p className="text-lg font-bold text-white mt-1">
                    {averageHours} hrs
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Across {totalDays} registered work days
                  </p>
                </div>
              </div>

              {/* Status Panel: First Check-In */}
              <div className="glass-panel p-5 rounded-2xl border border-white/5 bg-slate-900/40 flex items-start space-x-4">
                <div className="p-3 bg-violet-500/10 text-violet-400 rounded-xl border border-violet-500/25">
                  <Calendar size={20} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Check-In Time</p>
                  <p className="text-lg font-bold text-white mt-1">
                    {todayData?.record?.checkIn
                      ? new Date(todayData.record.checkIn).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
                      : '--:--'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {todayData?.record?.checkIn ? 'Check-in timestamp recorded' : 'Waiting for clock-in'}
                  </p>
                </div>
              </div>

              {/* Status Panel: Lateness Days */}
              <div className="glass-panel p-5 rounded-2xl border border-white/5 bg-slate-900/40 flex items-start space-x-4">
                <div className={`p-3 rounded-xl ${
                  lateDays > 0 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                }`}>
                  <AlertCircle size={20} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Lateness Rate</p>
                  <p className="text-lg font-bold text-white mt-1">
                    {totalDays > 0 ? ((lateDays / totalDays) * 100).toFixed(0) : 0}% 
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {lateDays} out of {totalDays} shifts marked late
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* Guidelines info card */}
          <div className="p-5 rounded-2xl border border-indigo-500/10 bg-indigo-500/5 text-indigo-300 text-xs flex items-start space-x-3 leading-relaxed">
            <AlertCircle size={18} className="shrink-0 text-indigo-400" />
            <div>
              <p className="font-bold text-indigo-200">Company Attendance Policy</p>
              <p className="mt-1 text-slate-400">
                Core office hours begin at <strong className="text-indigo-200">9:00 AM</strong>. Check-ins recorded after this time will automatically be marked with a <span className="text-amber-400 font-bold italic">Late</span> status. Ensure you clock out before leaving the premises to finalize your daily shift duration telemetry.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* History Table Workspace */}
      <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-950/20">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <History size={18} className="text-indigo-400" />
              Attendance Logs History
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Chronological record of your work sessions and shift status.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors w-44"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
            >
              <option value="ALL">All Status</option>
              <option value="PRESENT">Present</option>
              <option value="LATE">Late</option>
            </select>
          </div>
        </div>

        {historyLoading ? <TableSkeleton rows={6} /> : filteredHistory.length === 0 ? (
          <div className="py-20">
            <EmptyState 
              title="No attendance logs found"
              description="Your chronological work session history is currently empty or no records match your filters."
              icon={Calendar}
              onClear={searchQuery || statusFilter !== 'ALL' ? () => { setSearchQuery(''); setStatusFilter('ALL'); } : undefined}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5">
                  <th className="px-6 py-4">Date Index</th>
                  <th className="px-6 py-4">Status Matrix</th>
                  <th className="px-6 py-4">Check-In</th>
                  <th className="px-6 py-4">Check-Out</th>
                  <th className="px-6 py-4">Shift Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredHistory.map((record) => (
                  <tr key={record.id} className="text-sm hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-200">{new Date(record.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      <p className="text-[10px] text-slate-500">{new Date(record.date).toLocaleDateString(undefined, { weekday: 'long' })}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-md border ${
                        record.status?.toUpperCase() === 'LATE'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}>
                        {record.status?.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-mono">
                      {new Date(record.checkIn).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-mono">
                      {record.checkOut 
                        ? new Date(record.checkOut).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                        : <span className="text-emerald-400/80 italic">Active Session</span>}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-extrabold text-indigo-300">
                        {record.totalHours ? `${record.totalHours.toFixed(2)} hrs` : '--'}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
