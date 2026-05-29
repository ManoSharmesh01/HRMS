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
  Loader2,
  Lock
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
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      case 'HR':
        return 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20';
      case 'MANAGER':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      default:
        return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    return status.toUpperCase() === 'ACTIVE'
      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
      : 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20';
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 rounded-2xl glass-panel relative overflow-hidden bg-white dark:bg-slate-900/40">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:bg-gradient-to-r dark:from-white dark:via-indigo-200 dark:to-indigo-400 dark:bg-clip-text dark:text-transparent">
            Employee Directory
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Map staff lists, configure custom profiles, and execute operational controls.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="flex items-center justify-center px-4 py-3 rounded-xl font-semibold text-indigo-600 dark:text-indigo-300 hover:text-indigo-700 dark:hover:text-white bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 transition-all duration-200"
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
      <div className="p-5 rounded-2xl glass-panel grid grid-cols-1 md:grid-cols-5 gap-4 items-center bg-white dark:bg-slate-900/40 border border-black/5 dark:border-white/5">
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
              className="p-2.5 rounded-xl text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 border border-black/5 dark:border-white/10 transition-all flex items-center justify-center shrink-0"
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
        <div className="glass-panel rounded-2xl overflow-hidden border border-black/5 dark:border-white/5 bg-white dark:bg-slate-900/40">
          {/* Table View (for larger screens) */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-black/5 dark:border-white/5 bg-slate-50 dark:bg-slate-950/20 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Staff Member</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Salary</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5 text-sm text-slate-700 dark:text-slate-300">
                {employees.map((emp) => (
                  <tr
                    key={emp.id}
                    className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors duration-150 group"
                  >
                    <td className="px-6 py-4 text-xs font-semibold text-slate-400 dark:text-slate-500">
                      #EMP{String(emp.id).padStart(3, '0')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
                          {emp.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-200 transition-colors">
                            {emp.name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">{emp.department}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${getRoleBadgeStyle(emp.role)}`}>
                        {emp.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-indigo-600 dark:text-indigo-300 font-semibold">${emp.salary.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${getStatusBadgeStyle(emp.status)}`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleViewClick(emp)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                          title="View Profile"
                        >
                          <Eye size={16} />
                        </button>
                        {canModify && (
                          <button
                            onClick={() => handleEditClick(emp)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                            title="Edit Employee"
                          >
                            <Edit size={16} />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDeleteClick(emp.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-black/5 dark:hover:bg-white/5 transition-all"
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

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-black/5 dark:border-white/5 bg-slate-50 dark:bg-slate-950/20 flex items-center justify-between">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Showing <span className="text-slate-900 dark:text-white">{employees.length}</span> of <span className="text-slate-900 dark:text-white">{total}</span> members
            </p>
            <div className="flex items-center space-x-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 border border-black/5 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-50 transition-all"
              >
                Previous
              </button>
              <button
                disabled={page * limit >= total}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 border border-black/5 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-50 transition-all"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={modalMode === 'add' ? 'Add New Employee' : 'Edit Employee Profile'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsFormModalOpen(false)}>Cancel</Button>
            <Button
              onClick={(e) => handleSubmit(e as any)}
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              {modalMode === 'add' ? 'Create Account' : 'Save Changes'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              error={errors.name}
              placeholder="e.g. John Doe"
              leftIcon={<User size={18} />}
              required
            />
            <Input
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              error={errors.email}
              placeholder="john@company.com"
              leftIcon={<Mail size={18} />}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">
                Department
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-slate-900/50 border border-black/10 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all"
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

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">
                Role Access
              </label>
              <div className="relative">
                <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-slate-900/50 border border-black/10 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all"
                >
                  <option value="ADMIN">ADMIN</option>
                  <option value="HR">HR</option>
                  <option value="MANAGER">MANAGER</option>
                  <option value="EMPLOYEE">EMPLOYEE</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Base Salary ($)"
              name="salary"
              type="number"
              value={formData.salary}
              onChange={handleInputChange}
              error={errors.salary}
              placeholder="e.g. 75000"
              leftIcon={<DollarSign size={18} />}
              required
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">
                Employment Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-900/50 border border-black/10 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all"
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
              placeholder="Min. 6 characters"
              leftIcon={<Lock size={18} />}
              helperText="Employee can change this after first login"
            />
          )}
        </form>
      </Modal>

      {/* Profile Detail Modal */}
      <Modal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        title="Employee Profile Snapshot"
        size="lg"
      >
        {selectedEmployee && (
          <div className="space-y-8">
            {/* Profile Header */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
              <div className="h-24 w-24 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-3xl shrink-0">
                {selectedEmployee.name.charAt(0)}
              </div>
              <div className="text-center sm:text-left">
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{selectedEmployee.name}</h3>
                <p className="text-slate-500 dark:text-slate-400 font-medium flex items-center justify-center sm:justify-start gap-1.5">
                  <Mail size={14} /> {selectedEmployee.email}
                </p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
                  <Badge variant="primary">{selectedEmployee.role}</Badge>
                  <Badge variant={selectedEmployee.status === 'ACTIVE' ? 'success' : 'ghost'}>
                    {selectedEmployee.status}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-slate-50 dark:bg-slate-950/20 border-black/5 dark:border-white/5" noPadding>
                <div className="p-4 flex items-center space-x-3">
                  <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-600 dark:text-indigo-400">
                    <Briefcase size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Department</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedEmployee.department}</p>
                  </div>
                </div>
              </Card>

              <Card className="bg-slate-50 dark:bg-slate-950/20 border-black/5 dark:border-white/5" noPadding>
                <div className="p-4 flex items-center space-x-3">
                  <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-600 dark:text-emerald-400">
                    <DollarSign size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Compensation</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">${selectedEmployee.salary.toLocaleString()} / year</p>
                  </div>
                </div>
              </Card>

              <Card className="bg-slate-50 dark:bg-slate-950/20 border-black/5 dark:border-white/5" noPadding>
                <div className="p-4 flex items-center space-x-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg text-purple-600 dark:text-purple-400">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Joined Date</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">Dec 12, 2023</p>
                  </div>
                </div>
              </Card>

              <Card className="bg-slate-50 dark:bg-slate-950/20 border-black/5 dark:border-white/5" noPadding>
                <div className="p-4 flex items-center space-x-3">
                  <div className="p-2 bg-amber-500/10 rounded-lg text-amber-600 dark:text-amber-400">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Location</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">San Francisco, HQ</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
              <p className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider mb-3">Operational Logs</p>
              <div className="space-y-3">
                <div className="flex items-center text-xs text-slate-600 dark:text-slate-400">
                  <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 mr-2" />
                  <span className="font-semibold mr-2">Today, 09:42 AM:</span> Clock-in telemetry recorded (On-Time)
                </div>
                <div className="flex items-center text-xs text-slate-600 dark:text-slate-400">
                  <div className="h-1.5 w-1.5 rounded-full bg-slate-400 mr-2" />
                  <span className="font-semibold mr-2">Yesterday:</span> Worked 8.5 hours total shift duration
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-black/5 dark:border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-scale-in">
            <div className="p-3 bg-rose-500/10 rounded-2xl text-rose-600 dark:text-rose-400 w-fit mb-4">
              <AlertCircle size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Terminate Profile?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              Are you sure you want to delete this staff record? This action will permanently remove all associated telemetry and is <span className="text-rose-600 dark:text-rose-400 font-bold">irreversible</span>.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
              >
                Discard
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 transition-all shadow-lg shadow-rose-500/20 flex items-center justify-center"
              >
                {isDeleting ? <Loader2 size={16} className="animate-spin" /> : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}