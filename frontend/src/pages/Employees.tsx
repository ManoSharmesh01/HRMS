import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useDebounce } from '../hooks/useDebounce';
import { exportToCSV } from '../utils/csvUtils';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  X,
  User,
  Mail,
  Shield,
  Briefcase,
  DollarSign,
  Info,
  AlertCircle,
  Phone,
  MapPin,
  Calendar,
  CheckCircle,
  FileText,
  Download,
  Loader2
} from 'lucide-react';
import { TableSkeleton, Button, Modal, Input, Badge, Card } from '../components/common';
import ErrorBanner from '../components/common/ErrorBanner';
import EmptyState from '../components/common/EmptyState';

interface Employee {
  id: number;
  name: string;
  email: string;
  role: string;
  department: string;
  salary: number;
  status: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  role?: string;
  department?: string;
  salary?: string;
  password?: string;
}

export default function Employees() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');

  // Modal State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');

  // Delete Confirmation State
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'EMPLOYEE',
    department: 'Engineering',
    salary: '',
    status: 'ACTIVE'
  });
  const [errors, setErrors] = useState<FormErrors>({});

  // Auth permissions
  const canModify = currentUser?.role === 'ADMIN' || currentUser?.role === 'HR';
  const canDelete = currentUser?.role === 'ADMIN';

  const [page, setPage] = useState(1);
  const limit = 8;

  const debouncedSearch = useDebounce(search, 400);

  // Reset page to 1 when filters or search change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, department, role, status]);

  // React Query fetch employees
  const { data: employeeData, isLoading, error, refetch } = useQuery<{ data: Employee[]; total: number }>({
    queryKey: ['employees', { search: debouncedSearch, department, role, status, page, limit }],
    queryFn: async () => {
      const params: any = {
        page,
        limit,
      };
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      if (department) params.department = department;
      if (role) params.role = role;
      if (status) params.status = status;

      const response = await api.get('/employees', { params });
      return response.data;
    }
  });

  const employees = employeeData?.data || [];
  const total = employeeData?.total || 0;

  const handleExport = () => {
    const headers = [
      { label: 'ID', key: 'id' },
      { label: 'Name', key: 'name' },
      { label: 'Email', key: 'email' },
      { label: 'Department', key: 'department' },
      { label: 'Role', key: 'role' },
      { label: 'Salary', key: 'salary' },
      { label: 'Status', key: 'status' }
    ];
    exportToCSV(employees, headers, 'Employee_Data');
  };

  // Mutate create
  const createMutation = useMutation({
    mutationFn: async (newEmployee: any) => {
      return await api.post('/employees', newEmployee);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setIsFormModalOpen(false);
      resetForm();
    }
  });

  // Mutate edit
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await api.put(`/employees/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setIsFormModalOpen(false);
      resetForm();
    }
  });

  // Real-time local validation handler
  const validateField = (name: string, value: string) => {
    let err = '';
    if (name === 'name') {
      if (!value.trim()) err = 'Name is required';
      else if (value.trim().length < 2) err = 'Name must be at least 2 characters';
    }
    if (name === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!value.trim()) err = 'Email is required';
      else if (!emailRegex.test(value.trim())) err = 'Please enter a valid email address';
    }
    if (name === 'role') {
      if (!value) err = 'Role is required';
    }
    if (name === 'department') {
      if (!value.trim()) err = 'Department is required';
    }
    if (name === 'salary') {
      if (!value) err = 'Salary is required';
      else if (isNaN(Number(value)) || Number(value) < 0) err = 'Salary must be a non-negative number';
    }
    if (name === 'password' && modalMode === 'add') {
      if (value && value.length < 6) err = 'Password must be at least 6 characters';
    }

    setErrors(prev => ({
      ...prev,
      [name]: err ? err : undefined
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'EMPLOYEE',
      department: 'Engineering',
      salary: '',
      status: 'ACTIVE'
    });
    setErrors({});
    setSelectedEmployee(null);
  };

  const handleAddClick = () => {
    setModalMode('add');
    resetForm();
    setIsFormModalOpen(true);
  };

  const handleEditClick = (emp: Employee) => {
    setModalMode('edit');
    setSelectedEmployee(emp);
    setFormData({
      name: emp.name,
      email: emp.email,
      password: '',
      role: emp.role,
      department: emp.department,
      salary: String(emp.salary),
      status: emp.status
    });
    setErrors({});
    setIsFormModalOpen(true);
  };

  const handleViewClick = (emp: Employee) => {
    setSelectedEmployee(emp);
    setIsProfileModalOpen(true);
  };

  const handleDeleteClick = (id: number) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/employees/${deleteConfirmId}`);
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setDeleteConfirmId(null);
    } catch (err) {
      console.error('Failed to delete employee:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Trigger validation for all fields
    const currentErrors: FormErrors = {};
    if (!formData.name.trim()) currentErrors.name = 'Name is required';
    else if (formData.name.trim().length < 2) currentErrors.name = 'Name must be at least 2 characters';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) currentErrors.email = 'Email is required';
    else if (!emailRegex.test(formData.email.trim())) currentErrors.email = 'Please enter a valid email address';

    if (!formData.role) currentErrors.role = 'Role is required';
    if (!formData.department.trim()) currentErrors.department = 'Department is required';

    if (!formData.salary) currentErrors.salary = 'Salary is required';
    else if (isNaN(Number(formData.salary)) || Number(formData.salary) < 0) currentErrors.salary = 'Salary must be a non-negative number';

    if (modalMode === 'add' && formData.password && formData.password.length < 6) {
      currentErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(currentErrors);

    if (Object.keys(currentErrors).some(key => currentErrors[key as keyof FormErrors])) {
      return; // Stop form submission if there are validation errors
    }

    const payload: any = {
      name: formData.name,
      email: formData.email,
      role: formData.role,
      department: formData.department,
      salary: Number(formData.salary),
      status: formData.status
    };

    if (modalMode === 'add') {
      if (formData.password) payload.password = formData.password;
      createMutation.mutate(payload);
    } else {
      if (selectedEmployee) {
        updateMutation.mutate({ id: selectedEmployee.id, data: payload });
      }
    }
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role.toUpperCase()) {
      case 'ADMIN':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'HR':
        return 'bg-pink-500/10 text-pink-400 border-pink-500/20';
      case 'MANAGER':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default:
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    return status.toUpperCase() === 'ACTIVE'
      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      : 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  };

  const clearFilters = () => {
    setSearch('');
    setDepartment('');
    setRole('');
    setStatus('');
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 rounded-2xl glass-panel relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
            Employee Directory
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Map staff lists, configure custom profiles, and execute operational controls.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="flex items-center justify-center px-4 py-3 rounded-xl font-semibold text-indigo-300 hover:text-white bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 transition-all duration-200"
          >
            <Download size={18} className="mr-2" />
            Export CSV
          </button>
          {canModify && (
            <button
              onClick={handleAddClick}
              className="flex items-center justify-center px-5 py-3 rounded-xl font-semibold text-white glass-button shrink-0"
            >
              <Plus size={18} className="mr-2" />
              Add Employee
            </button>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      <div className="p-5 rounded-2xl glass-panel grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
        {/* Search */}
        <div className="relative md:col-span-2">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
            <Search size={18} />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm glass-input"
          />
        </div>

        {/* Department Filter */}
        <div>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl text-sm glass-input"
          >
            <option value="">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="Product">Product</option>
            <option value="Design">Design</option>
            <option value="Sales">Sales</option>
            <option value="Marketing">Marketing</option>
            <option value="HR">HR</option>
            <option value="Finance">Finance</option>
            <option value="Operations">Operations</option>
          </select>
        </div>

        {/* Role Filter */}
        <div>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl text-sm glass-input"
          >
            <option value="">All Roles</option>
            <option value="ADMIN">ADMIN</option>
            <option value="HR">HR</option>
            <option value="MANAGER">MANAGER</option>
            <option value="EMPLOYEE">EMPLOYEE</option>
          </select>
        </div>

        {/* Status Filter / Clear Button */}
        <div className="flex gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="flex-1 px-3 py-2.5 rounded-xl text-sm glass-input"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>

          {(search || department || role || status) && (
            <button
              onClick={clearFilters}
              title="Clear Filters"
              className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 border border-white/10 transition-all flex items-center justify-center shrink-0"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Main Employee List */}
      {isLoading ? (
        <TableSkeleton rows={limit} />
      ) : error ? (
        <ErrorBanner 
          message="Could not fetch employee list. Please ensure the backend is running and you have sufficient permissions."
          onRetry={() => refetch()}
        />
      ) : employees.length === 0 ? (
        <EmptyState 
          title="No Employees Found"
          description="We couldn't find any staff profiles matching the active filters or search terms."
          icon={User}
          onClear={(search || department || role || status) ? clearFilters : undefined}
        />
      ) : (
        /* Grid and Table Containers */
        <div className="glass-panel rounded-2xl overflow-hidden border border-white/5">
          {/* Table View (for larger screens) */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-slate-950/20 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Staff Member</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Salary</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm text-slate-300">
                {employees.map((emp) => (
                  <tr
                    key={emp.id}
                    className="hover:bg-white/5 transition-colors duration-150 group"
                  >
                    <td className="px-6 py-4 text-xs font-semibold text-slate-400">
                      #EMP{String(emp.id).padStart(3, '0')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
                          {emp.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-white group-hover:text-indigo-200 transition-colors">
                            {emp.name}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">{emp.department}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${getRoleBadgeStyle(emp.role)}`}>
                        {emp.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-indigo-300">${emp.salary.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${getStatusBadgeStyle(emp.status)}`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleViewClick(emp)}
                          className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                          title="View Profile"
                        >
                          <Eye size={16} />
                        </button>
                        {canModify && (
                          <button
                            onClick={() => handleEditClick(emp)}
                            className="p-2 text-indigo-400 hover:text-white hover:bg-indigo-500/20 rounded-lg transition-colors"
                            title="Edit Employee"
                          >
                            <Edit size={16} />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDeleteClick(emp.id)}
                            className="p-2 text-rose-400 hover:text-white hover:bg-rose-500/20 rounded-lg transition-colors"
                            title="Delete Employee"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile View (Grid Cards) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden p-4">
            {employees.map((emp) => (
              <div
                key={emp.id}
                className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-lg">
                      {emp.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-white">{emp.name}</p>
                      <p className="text-xs text-slate-400">{emp.email}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${getStatusBadgeStyle(emp.status)}`}>
                    {emp.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-white/5">
                    <p className="text-slate-500 uppercase font-bold text-[9px]">Department</p>
                    <p className="text-slate-200 mt-0.5">{emp.department}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-white/5">
                    <p className="text-slate-500 uppercase font-bold text-[9px]">Role</p>
                    <p className="text-slate-200 mt-0.5">{emp.role}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <p className="font-mono text-indigo-300">${emp.salary.toLocaleString()}</p>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleViewClick(emp)}
                      className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors"
                    >
                      <Eye size={16} />
                    </button>
                    {canModify && (
                      <button
                        onClick={() => handleEditClick(emp)}
                        className="p-2 text-indigo-400 hover:text-white rounded-lg transition-colors"
                      >
                        <Edit size={16} />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => handleDeleteClick(emp.id)}
                        className="p-2 text-rose-400 hover:text-white rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Footer */}
          <div className="px-6 py-4 bg-slate-950/20 border-t border-white/5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <p className="text-xs text-slate-400">
              Showing <span className="text-white font-bold">{employees.length}</span> of <span className="text-white font-bold">{total}</span> total staff entries
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg text-xs font-bold border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-50 transition-all"
              >
                Previous
              </button>
              <div className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                Page {page}
              </div>
              <button
                disabled={page * limit >= total}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-50 transition-all"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALS RENDERED BELOW (UNCHANGED) */}
      {/* Form Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={modalMode === 'add' ? 'Register New Employee' : 'Edit Staff Profile'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsFormModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={(e) => handleSubmit(e as any)}
              isLoading={createMutation.isPending || updateMutation.isPending}
              leftIcon={<CheckCircle size={18} />}
            >
              {modalMode === 'add' ? 'Confirm Registration' : 'Save Changes'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              error={errors.name}
              leftIcon={<User size={18} />}
              placeholder="e.g. John Doe"
            />

            <Input
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              error={errors.email}
              leftIcon={<Mail size={18} />}
              placeholder="john@company.com"
            />

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Role</label>
              <div className="relative">
                <Shield className="absolute left-3 top-2.5 text-slate-500" size={18} />
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-2 rounded-xl text-sm glass-input border-white/10"
                >
                  <option value="ADMIN">ADMIN</option>
                  <option value="HR">HR</option>
                  <option value="MANAGER">MANAGER</option>
                  <option value="EMPLOYEE">EMPLOYEE</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Department</label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-2.5 text-slate-500" size={18} />
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-2 rounded-xl text-sm glass-input border-white/10"
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Product">Product</option>
                  <option value="Design">Design</option>
                  <option value="Sales">Sales</option>
                  <option value="Marketing">Marketing</option>
                  <option value="HR">HR</option>
                  <option value="Finance">Finance</option>
                  <option value="Operations">Operations</option>
                </select>
              </div>
            </div>

            <Input
              label="Salary (Annual USD)"
              name="salary"
              type="number"
              value={formData.salary}
              onChange={handleInputChange}
              error={errors.salary}
              leftIcon={<DollarSign size={18} />}
              placeholder="75000"
            />

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Account Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-xl text-sm glass-input border-white/10"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          </div>

          {modalMode === 'add' && (
            <Input
              label="Initial Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              error={errors.password}
              helperText="Required for new employees to sign in initially."
              placeholder="••••••••"
            />
          )}
        </form>
      </Modal>

      {/* Profile Modal */}
      {isProfileModalOpen && selectedEmployee && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-slideUp">
            {/* Profile Header Background */}
            <div className="h-32 bg-gradient-to-r from-indigo-600 to-violet-700 relative">
               <button 
                onClick={() => setIsProfileModalOpen(false)} 
                className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-all"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="px-8 pb-8">
              {/* Avatar Overlap */}
              <div className="relative -mt-12 mb-6">
                <div className="h-24 w-24 rounded-3xl bg-slate-900 p-1.5 border border-white/10 shadow-2xl">
                  <div className="h-full w-full rounded-2xl bg-indigo-500 flex items-center justify-center text-3xl font-black text-white">
                    {selectedEmployee.name.charAt(0)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                  <div>
                    <h3 className="text-2xl font-black text-white tracking-tight">{selectedEmployee.name}</h3>
                    <p className="text-slate-400 font-medium flex items-center mt-1">
                      <Mail size={14} className="mr-2 text-indigo-400" />
                      {selectedEmployee.email}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Department</p>
                      <div className="flex items-center text-slate-100 font-semibold">
                        <Briefcase size={16} className="mr-2 text-indigo-400" />
                        {selectedEmployee.department}
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Annual Salary</p>
                      <div className="flex items-center text-emerald-400 font-bold">
                        <DollarSign size={16} className="mr-1" />
                        {selectedEmployee.salary.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center">
                      <Info size={14} className="mr-2" />
                      Operational Overview
                    </h4>
                    <div className="p-5 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 text-xs text-slate-400 leading-relaxed">
                      This employee is currently <span className="text-indigo-300 font-bold underline underline-offset-4">{selectedEmployee.status.toLowerCase()}</span> within the system. 
                      Access levels are restricted based on the <span className="text-white font-bold">{selectedEmployee.role}</span> role configuration. 
                      Last profile reconciliation was performed recently.
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="p-5 rounded-2xl bg-slate-950/40 border border-white/5 space-y-4">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Security & Role</p>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">System Role</span>
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border ${getRoleBadgeStyle(selectedEmployee.role)}`}>
                          {selectedEmployee.role}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">Status</span>
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border ${getStatusBadgeStyle(selectedEmployee.status)}`}>
                          {selectedEmployee.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <button className="w-full py-2.5 rounded-xl text-xs font-bold bg-white text-slate-900 hover:bg-slate-200 transition-all flex items-center justify-center">
                      <FileText size={14} className="mr-2" />
                      Download Full Dossier
                    </button>
                    {canModify && (
                      <button 
                        onClick={() => { setIsProfileModalOpen(false); handleEditClick(selectedEmployee); }}
                        className="w-full py-2.5 rounded-xl text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all"
                      >
                        Modify Professional Details
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        title="Confirm Deletion"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteConfirmId(null)}>
              Keep Profile
            </Button>
            <Button
              variant="danger"
              onClick={confirmDelete}
              isLoading={isDeleting}
            >
              Delete Permanently
            </Button>
          </>
        }
      >
        <div className="text-center">
          <div className="h-16 w-16 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} />
          </div>
          <p className="text-sm text-slate-400">
            Are you absolutely sure you want to remove this employee? This action is irreversible and will delete all associated records.
          </p>
        </div>
      </Modal>
    </div>
  );
}
