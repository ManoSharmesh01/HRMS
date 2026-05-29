import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import {
  Clock,
  UserCheck,
  UserMinus,
  AlertCircle,
  Calendar,
  History,
  CheckCircle,
  TrendingUp,
  RefreshCw,
  Search,
  Filter,
  ArrowRight,
  Sparkles
} from 'lucide-react';

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
  const { data: todayData, isLoading: todayLoading, refetch: refetchToday } = useQuery<TodayResponse>({
    queryKey: ['attendanceToday'],
    queryFn: async () => {
      const response = await api.get('/attendance/today');
      return response.data;
    }
  });

  // Fetch personal check-in history
  const { data: historyData, isLoading: historyLoading, refetch: refetchHistory } = useQuery<AttendanceRecord[]>({
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

  // Compute metrics from history
  const totalDays = historyData?.length || 0;
  const lateDays = historyData?.filter((r) => r.status?.toUpperCase() === 'LATE').length || 0;
  const totalWorkedHours = historyData?.reduce((sum, r) => sum + (r.totalHours || 0), 0) || 0;
  const averageHours = totalDays > 0 ? (totalWorkedHours / totalDays).toFixed(2) : '0';

  const isCheckingIn = checkInMutation.isPending;
  const isCheckingOut = checkOutMutation.isPending;

  return (
    <div className="space-y-8 animate-fade-in">
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

        <button
          onClick={forceRefetch}
          className="flex items-center justify-center self-start md:self-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-indigo-300 hover:text-white bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 transition-all duration-200"
        >
          <RefreshCw size={14} className="mr-2" />
          Refresh Stats
        </button>
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
          <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-slate-900/60 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[360px]">
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
                  {todayData?.checkedOut
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
            <div className="relative z-10 pt-6 mt-4 border-t border-white/5 flex gap-4">
              {!todayData?.checkedIn ? (
                <button
                  onClick={handleCheckIn}
                  disabled={isCheckingIn || todayLoading}
                  className="flex-1 flex items-center justify-center py-3.5 px-4 rounded-xl text-sm font-bold bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/50 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-200"
                >
                  {isCheckingIn ? (
                    <RefreshCw className="animate-spin mr-2" size={16} />
                  ) : (
                    <UserCheck className="mr-2" size={16} />
                  )}
                  Clock In Now
                </button>
              ) : !todayData?.checkedOut ? (
                <button
                  onClick={handleCheckOut}
                  disabled={isCheckingOut || todayLoading}
                  className="flex-1 flex items-center justify-center py-3.5 px-4 rounded-xl text-sm font-bold bg-rose-500 hover:bg-rose-600 disabled:bg-rose-500/50 text-white shadow-lg shadow-rose-500/20 hover:shadow-rose-500/30 transition-all duration-200"
                >
                  {isCheckingOut ? (
                    <RefreshCw className="animate-spin mr-2" size={16} />
                  ) : (
                    <UserMinus className="mr-2" size={16} />
                  )}
                  Clock Out Now
                </button>
              ) : (
                <button
                  disabled
                  className="flex-1 flex items-center justify-center py-3.5 px-4 rounded-xl text-sm font-bold bg-white/5 border border-white/10 text-slate-400 cursor-not-allowed"
                >
                  <CheckCircle className="mr-2 text-slate-500" size={16} />
                  Shift Closed Today
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Status Panels (Right 7 cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Status Panel: Today's Status */}
            <div className="glass-panel p-5 rounded-2xl border border-white/5 bg-slate-900/40 flex items-start space-x-4">
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
            </div>

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

          {/* Guidelines info card */}
          <div className="p-5 rounded-2xl border border-indigo-500/10 bg-indigo-500/5 text-indigo-300 text-xs flex items-start space-x-3 leading-relaxed">
            <AlertCircle size={18} className="shrink-0 text-indigo-400" />
            <div>
              <p className="font-bold text-indigo-200">Company Attendance Policy</p>
              <p className="mt-1 text-slate-400">
                Core office hours begin at <strong className="text-indigo-200">9:00 AM</strong>. Check-ins recorded after this time will automatically be marked with a <span className="text-amber-400 font-bold">Late</span> status. Please remember to clock out when wrapping up your shift to guarantee correct calculation of your total billable work hours.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* History Log Section */}
      <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-slate-900/40 shadow-xl space-y-6">
        
        {/* Header and Filters */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
              <History size={18} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Chronological Tracking History</h2>
              <p className="text-xs text-slate-400 mt-0.5">Chronological record of your personal clock-in and clock-out cycles.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search history..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-xl text-xs bg-slate-950/50 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-44 transition-all duration-200"
              />
            </div>

            {/* Filter Dropdown */}
            <div className="flex items-center space-x-2">
              <Filter size={14} className="text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl text-xs bg-slate-950/50 border border-white/10 text-white focus:outline-none focus:border-indigo-500 transition-all duration-200"
              >
                <option value="ALL">All Statuses</option>
                <option value="PRESENT">On Time</option>
                <option value="LATE">Late</option>
              </select>
            </div>
          </div>
        </div>

        {/* History Grid (Chronological Table) */}
        <div className="overflow-x-auto">
          {historyLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
              <p className="text-slate-400 text-sm mt-3 font-medium">Retrieving history logs...</p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-16 rounded-xl border border-dashed border-white/5 bg-slate-950/10">
              <History size={40} className="mx-auto text-slate-600 mb-3" />
              <p className="text-slate-400 font-semibold text-sm">No historical log records matching filters</p>
              <p className="text-xs text-slate-500 mt-1">Try resetting your status filters or search parameters.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Clock In</th>
                  <th className="py-3.5 px-4">Clock Out</th>
                  <th className="py-3.5 px-4">Duration</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300 text-sm">
                {filteredHistory.map((record) => {
                  const checkInDate = new Date(record.checkIn);
                  const isLate = record.status?.toUpperCase() === 'LATE';

                  return (
                    <tr
                      key={record.id}
                      className="hover:bg-white/5 transition-colors duration-150"
                    >
                      {/* Date */}
                      <td className="py-4 px-4 font-medium text-slate-200">
                        {checkInDate.toLocaleDateString(undefined, {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>

                      {/* Clock In */}
                      <td className="py-4 px-4 font-mono text-xs">
                        <div className="flex items-center space-x-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          <span>
                            {checkInDate.toLocaleTimeString(undefined, {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            })}
                          </span>
                        </div>
                      </td>

                      {/* Clock Out */}
                      <td className="py-4 px-4 font-mono text-xs">
                        {record.checkOut ? (
                          <div className="flex items-center space-x-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                            <span>
                              {new Date(record.checkOut).toLocaleTimeString(undefined, {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit'
                              })}
                            </span>
                          </div>
                        ) : (
                          <span className="text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 text-[10px] animate-pulse">
                            ACTIVE SHIFT
                          </span>
                        )}
                      </td>

                      {/* Duration */}
                      <td className="py-4 px-4 font-semibold text-slate-400">
                        {record.totalHours !== null ? (
                          `${record.totalHours.toFixed(2)} hrs`
                        ) : (
                          <div className="flex items-center text-xs text-indigo-400">
                            <span>Calculating...</span>
                          </div>
                        )}
                      </td>

                      {/* Status + Lateness Indicator */}
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold ${
                            isLate
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/25'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                          }`}
                        >
                          {isLate ? 'LATE' : 'ON TIME'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Small footer metric summary */}
        <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 gap-2">
          <div>
            Showing <strong className="text-slate-300">{filteredHistory.length}</strong> of{' '}
            <strong className="text-slate-300">{totalDays}</strong> total sessions
          </div>
          <div className="flex items-center space-x-4">
            <span className="flex items-center">
              <span className="h-2 w-2 rounded-full bg-emerald-500 mr-1.5" />
              On Time sessions: {totalDays - lateDays}
            </span>
            <span className="flex items-center">
              <span className="h-2 w-2 rounded-full bg-rose-500 mr-1.5" />
              Late sessions: {lateDays}
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}