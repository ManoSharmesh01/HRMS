import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { exportToCSV } from '../utils/csvUtils';
import {
  Calendar,
  Plus,
  Check,
  X,
  Clock,
  CheckCircle,
  XCircle,
  ClipboardList,
  Sparkles,
  Download,
  Loader2
} from 'lucide-react';
import { KPISkeleton, TableSkeleton, Button, Modal, Card, Input, Badge } from '../components/common';
import ErrorBanner from '../components/common/ErrorBanner';
import EmptyState from '../components/common/EmptyState';

interface LeaveRequest {
  id: number;
  employeeId: number;
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  employee?: {
    id: number;
    name: string;
    email: string;
    role: string;
    department: string;
  };
}

interface LeaveBalance {
  category: string;
  allowance: number;
  used: number;
  remaining: number;
  color: string;
}

export default function Leaves() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Search & Status filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  // Submit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    category: 'Annual Leave',
    startDate: '',
    endDate: '',
    justification: ''
  });
  const [validationError, setValidationError] = useState<string | null>(null);

  // Check roles
  const isApprover = user?.role === 'ADMIN' || user?.role === 'HR' || user?.role === 'MANAGER';

  // React Query: Fetch leaves
  const { data: leaves = [], isLoading, error, refetch } = useQuery<LeaveRequest[]>({
    queryKey: ['leaves'],
    queryFn: async () => {
      const response = await api.get('/leaves');
      return response.data;
    }
  });

  // React Query: Create Leave Request
  const createLeaveMutation = useMutation({
    mutationFn: async (newLeave: any) => {
      return await api.post('/leaves', newLeave);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      setIsModalOpen(false);
      setFormData({
        category: 'Annual Leave',
        startDate: '',
        endDate: '',
        justification: ''
      });
      setValidationError(null);
    }
  });

  // React Query: Update Leave Status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return await api.patch(`/leaves/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    }
  });

  // Helpers to calculate durations
  const calculateDays = (startStr: string, endStr: string) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    
    const diffTime = end.getTime() - start.getTime();
    if (diffTime < 0) return 0;
    
    // Calculate full days, adding 1 to make it inclusive
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Compute Balances
  // Allowances are hardcoded, but we subtract actual approved leave days of this employee
  const computeBalances = (): LeaveBalance[] => {
    const defaultBalances = [
      { category: 'Annual Leave', allowance: 15, used: 0, remaining: 15, color: 'from-indigo-500/10 to-indigo-500/5 text-indigo-400 border-indigo-500/20' },
      { category: 'Sick Leave', allowance: 10, used: 0, remaining: 10, color: 'from-emerald-500/10 to-emerald-500/5 text-emerald-400 border-emerald-500/20' },
      { category: 'Casual Leave', allowance: 7, used: 0, remaining: 7, color: 'from-amber-500/10 to-amber-500/5 text-amber-400 border-amber-500/20' },
    ];

    if (!user) return defaultBalances;

    // Filter approved leaves for the current logged in user
    const userApprovedLeaves = leaves.filter(
      (leave) => leave.employeeId === user.id && (leave.status === 'APPROVED' || leave.status === 'ACCEPTED')
    );

    return defaultBalances.map((bal) => {
      const leavesForCategory = userApprovedLeaves.filter(
        (l) => l.type.toLowerCase() === bal.category.toLowerCase()
      );
      
      const usedDays = leavesForCategory.reduce((sum, current) => {
        return sum + calculateDays(current.startDate, current.endDate);
      }, 0);

      const remaining = Math.max(0, bal.allowance - usedDays);
      return {
        ...bal,
        used: usedDays,
        remaining
      };
    });
  };

  const balances = computeBalances();

  // Handle Request Submission
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const { category, startDate, endDate, justification } = formData;

    if (!category || !startDate || !endDate || !justification.trim()) {
      setValidationError('Please fill in all required fields.');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      setValidationError('Please specify valid start and end dates.');
      return;
    }

    if (start.getTime() >= end.getTime()) {
      setValidationError('Start date must be earlier than the end date.');
      return;
    }

    createLeaveMutation.mutate({
      category,
      startDate,
      endDate,
      justification
    });
  };

  // Handle Approvals
  const handleUpdateStatus = (id: number, status: 'APPROVED' | 'REJECTED') => {
    updateStatusMutation.mutate({ id, status });
  };

  // Filter Leave requests
  const filteredLeaves = leaves.filter((leave) => {
    const matchesStatus = statusFilter === 'ALL' || leave.status === statusFilter;
    const matchesType = typeFilter === 'ALL' || leave.type.toLowerCase() === typeFilter.toLowerCase();
    return matchesStatus && matchesType;
  });

  const handleExport = () => {
    const headers = [
      { label: 'Employee Name', key: 'employee.name' },
      { label: 'Department', key: 'employee.department' },
      { label: 'Category', key: 'type' },
      { label: 'Start Date', key: 'startDate' },
      { label: 'End Date', key: 'endDate' },
      { label: 'Days', key: 'days' },
      { label: 'Reason', key: 'reason' },
      { label: 'Status', key: 'status' }
    ];

    const formattedData = filteredLeaves.map(leave => ({
      ...leave,
      startDate: new Date(leave.startDate).toLocaleDateString(),
      endDate: new Date(leave.endDate).toLocaleDateString(),
      days: calculateDays(leave.startDate, leave.endDate),
      'employee.name': leave.employee?.name || `Employee #${leave.employeeId}`,
      'employee.department': leave.employee?.department || 'N/A'
    }));

    exportToCSV(formattedData, headers, 'Leave_Register');
  };

  // Helpers for Status Badges
  const getStatusBadge = (status: string) => {
    const normalized = status.toUpperCase();
    switch (normalized) {
      case 'APPROVED':
      case 'ACCEPTED':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <CheckCircle size={12} className="mr-1" />
            Approved
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 border border-rose-500/20 text-rose-400">
            <XCircle size={12} className="mr-1" />
            Rejected
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Clock size={12} className="mr-1" />
            Pending
          </span>
        );
    }
  };

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <ErrorBanner 
          message="Unable to load leave submissions. Please retry shortly."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <Sparkles className="text-indigo-400 animate-pulse" size={28} />
            Leave Requests Overview
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Submit leave requests, check your allowances, and manage outstanding matrices.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={handleExport}
            leftIcon={<Download size={18} />}
          >
            Export CSV
          </Button>
          <Button
            onClick={() => setIsModalOpen(true)}
            leftIcon={<Plus size={18} />}
          >
            Apply For Leave
          </Button>
        </div>
      </div>

      {/* Balance Cards */}
      <div>
        <h2 className="text-lg font-bold text-slate-100 tracking-tight mb-4 flex items-center">
          <ClipboardList size={18} className="mr-2 text-indigo-400" />
          Your Annual Allowances & Balance
        </h2>
        {isLoading ? <KPISkeleton /> : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {balances.map((bal, idx) => (
              <Card
                key={idx}
                className={`bg-gradient-to-br ${bal.color} shadow-glass-sm transition-all duration-300 hover:scale-[1.02]`}
                noPadding
              >
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                      {bal.category}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-slate-300">
                      Total: {bal.allowance} Days
                    </span>
                  </div>
                  <div className="mt-4 flex justify-between items-baseline">
                    <div>
                      <span className="text-3xl font-extrabold text-white tracking-tight">
                        {bal.remaining}
                      </span>
                      <span className="text-xs text-slate-400 ml-1">days remaining</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-slate-300 block">{bal.used} used</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Filters and Matrix list */}
      <div className="glass-panel rounded-2xl p-6 border border-white/5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-white/5 mb-6">
          <div>
            <h3 className="font-bold text-white tracking-tight">
              Leave Matrix Board
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Showing {filteredLeaves.length} leave application records.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Status Filter */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Filter Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-40 bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Filter Category
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-40 bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="ALL">All Categories</option>
                <option value="Annual Leave">Annual Leave</option>
                <option value="Sick Leave">Sick Leave</option>
                <option value="Casual Leave">Casual Leave</option>
                <option value="Maternity Leave">Maternity Leave</option>
                <option value="Paternity Leave">Paternity Leave</option>
                <option value="Unpaid Leave">Unpaid Leave</option>
              </select>
            </div>
          </div>
        </div>

        {/* Leaves Table */}
        {isLoading ? (
          <TableSkeleton rows={6} />
        ) : filteredLeaves.length === 0 ? (
          <div className="py-20">
            <EmptyState 
              title="No leave requests found"
              description="No leave requests match the selected filters or there are no submissions yet in the ledger."
              icon={Calendar}
              onClear={statusFilter !== 'ALL' || typeFilter !== 'ALL' ? () => { setStatusFilter('ALL'); setTypeFilter('ALL'); } : undefined}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Days</th>
                  <th className="py-3 px-4">Reason / Justification</th>
                  <th className="py-3 px-4">Status</th>
                  {isApprover && <th className="py-3 px-4 text-right">Actions Matrix</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredLeaves.map((leave) => {
                  const daysCount = calculateDays(leave.startDate, leave.endDate);
                  const isPending = leave.status.toUpperCase() === 'PENDING';
                  return (
                    <tr
                      key={leave.id}
                      className="text-sm hover:bg-white/5 transition-colors duration-150 group"
                    >
                      <td className="py-4 px-4 font-semibold text-slate-100">
                        {leave.employee?.name || `Employee #${leave.employeeId}`}
                        <span className="block text-xs text-slate-400 font-normal">
                          {leave.employee?.department || 'Department N/A'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-300 font-medium">
                        {leave.type}
                      </td>
                      <td className="py-4 px-4 text-slate-300 text-xs font-mono">
                        {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                      </td>
                      <td className="py-4 px-4 text-slate-100 font-bold">
                        {daysCount} {daysCount === 1 ? 'day' : 'days'}
                      </td>
                      <td className="py-4 px-4 text-slate-300 max-w-xs truncate" title={leave.reason}>
                        {leave.reason}
                      </td>
                      <td className="py-4 px-4">
                        {getStatusBadge(leave.status)}
                      </td>
                      {isApprover && (
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {isPending ? (
                              <>
                                <button
                                  onClick={() => handleUpdateStatus(leave.id, 'APPROVED')}
                                  disabled={updateStatusMutation.isPending}
                                  className="inline-flex items-center justify-center px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50 transition-colors"
                                  title="Approve Leave"
                                >
                                  <Check size={14} className="mr-1" />
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus(leave.id, 'REJECTED')}
                                  disabled={updateStatusMutation.isPending}
                                  className="inline-flex items-center justify-center px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 disabled:opacity-50 transition-colors"
                                  title="Reject Leave"
                                >
                                  <X size={14} className="mr-1" />
                                  Reject
                                </button>
                              </>
                            ) : (
                              <span className="text-xs text-slate-500 font-medium italic">
                                Actioned
                              </span>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Submission Modal Form */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Submit Leave Request"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Discard
            </Button>
            <Button
              onClick={(e) => handleFormSubmit(e as any)}
              isLoading={createLeaveMutation.isPending}
              leftIcon={<Check size={18} />}
            >
              Send Request
            </Button>
          </>
        }
      >
        <form onSubmit={handleFormSubmit} className="space-y-5">
          {validationError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold flex items-center">
              <XCircle size={16} className="mr-2 shrink-0" />
              {validationError}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Leave Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
            >
              <option value="Annual Leave">Annual Leave</option>
              <option value="Sick Leave">Sick Leave</option>
              <option value="Casual Leave">Casual Leave</option>
              <option value="Maternity Leave">Maternity Leave</option>
              <option value="Paternity Leave">Paternity Leave</option>
              <option value="Unpaid Leave">Unpaid Leave</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            />
            <Input
              label="End Date"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Reason / Justification
            </label>
            <textarea
              rows={3}
              value={formData.justification}
              onChange={(e) => setFormData({ ...formData, justification: e.target.value })}
              placeholder="Provide a brief explanation for your leave request..."
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none"
            ></textarea>
          </div>
        </form>
      </Modal>
    </div>
  );
}
