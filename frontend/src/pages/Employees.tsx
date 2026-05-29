import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useDebounce } from '../hooks/useDebounce';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Loader2,
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
  FileText
} from 'lucide-react';

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
        <div className="h-[40vh] flex flex-col items-center justify-center space-y-4">
          <Loader2 size={36} className="animate-spin text-indigo-400" />
          <p className="text-sm text-slate-400">Loading directory listings...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-start space-x-3">
          <AlertCircle size={22} className="shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-rose-300">Connection Error</h3>
            <p className="text-sm mt-0.5">Could not fetch employee list. Please ensure the backend is running and you have sufficient permissions.</p>
          </div>
        </div>
      ) : employees.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl glass-panel space-y-4">
          <div className="p-4 bg-slate-950/40 rounded-full border border-white/5 text-indigo-400">
            <User size={36} className="opacity-60" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-200">No Employees Found</h3>
            <p className="text-sm text-slate-400 max-w-sm mt-1 mx-auto">
              We couldn't find any staff profiles matching the active filters or search terms.
            </p>
          </div>
          {(search || department || role || status) && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm font-semibold text-indigo-300 hover:text-white hover:bg-indigo-500/10 border border-indigo-500/20 hover:border-indigo-500/30 rounded-xl transition-all"
            >
              Clear All Filters
            </button>
          )}
        </div>
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
                    <td className="px-6 py-4 text-slate-300">{emp.department}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${getRoleBadgeStyle(emp.role)}`}>
                        {emp.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-200">
                      ${emp.salary.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadgeStyle(emp.status)}`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${emp.status.toUpperCase() === 'ACTIVE' ? 'bg-emerald-400' : 'bg-slate-400'}`} />
                        {emp.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-1">
                      <button
                        onClick={() => handleViewClick(emp)}
                        title="View Profile"
                        className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-white/5 rounded-lg transition-colors border border-transparent hover:border-white/5 inline-flex items-center"
                      >
                        <Eye size={16} />
                      </button>

                      {canModify && (
                        <button
                          onClick={() => handleEditClick(emp)}
                          title="Edit Profile"
                          className="p-2 text-slate-400 hover:text-amber-400 hover:bg-white/5 rounded-lg transition-colors border border-transparent hover:border-white/5 inline-flex items-center"
                        >
                          <Edit size={16} />
                        </button>
                      )}

                      {canDelete && (
                        <button
                          onClick={() => handleDeleteClick(emp.id)}
                          title="Delete Employee"
                          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors border border-transparent hover:border-rose-500/5 inline-flex items-center"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Grid View (for mobile / tablet screens) */}
          <div className="lg:hidden p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {employees.map((emp) => (
              <div
                key={emp.id}
                className="p-5 rounded-xl border border-white/5 bg-slate-900/30 hover:border-indigo-500/30 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
                        {emp.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-base">{emp.name}</h4>
                        <span className="text-xs font-semibold text-slate-400">#EMP{String(emp.id).padStart(3, '0')}</span>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadgeStyle(emp.status)}`}>
                      {emp.status}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-slate-300">
                    <p className="flex items-center text-xs text-slate-400">
                      <Mail size={14} className="mr-2 text-slate-400 shrink-0" />
                      <span className="truncate">{emp.email}</span>
                    </p>
                    <p className="flex items-center">
                      <Briefcase size={14} className="mr-2 text-indigo-400 shrink-0" />
                      <span>{emp.department}</span>
                    </p>
                    <p className="flex items-center">
                      <Shield size={14} className="mr-2 text-amber-400 shrink-0" />
                      <span className={`px-2 py-0.5 rounded text-xs font-bold border ${getRoleBadgeStyle(emp.role)}`}>{emp.role}</span>
                    </p>
                    <p className="flex items-center">
                      <DollarSign size={14} className="mr-2 text-emerald-400 shrink-0" />
                      <span className="font-medium">${emp.salary.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </p>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-white/5 flex justify-end space-x-2">
                  <button
                    onClick={() => handleViewClick(emp)}
                    className="px-3 py-1.5 rounded-lg border border-white/5 hover:border-white/10 text-xs text-slate-300 hover:text-white hover:bg-white/5 transition-all flex items-center gap-1.5"
                  >
                    <Eye size={14} />
                    View
                  </button>

                  {canModify && (
                    <button
                      onClick={() => handleEditClick(emp)}
                      className="px-3 py-1.5 rounded-lg border border-amber-500/10 hover:border-amber-500/20 text-xs text-amber-400 hover:bg-amber-500/10 transition-all flex items-center gap-1.5"
                    >
                      <Edit size={14} />
                      Edit
                    </button>
                  )}

                  {canDelete && (
                    <button
                      onClick={() => handleDeleteClick(emp.id)}
                      className="px-3 py-1.5 rounded-lg border border-rose-500/10 hover:border-rose-500/20 text-xs text-rose-400 hover:bg-rose-500/10 transition-all flex items-center gap-1.5"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-slate-950/20 border-t border-white/5 gap-4">
            <p className="text-xs text-slate-400">
              Showing <span className="font-semibold text-slate-200">{total === 0 ? 0 : (page - 1) * limit + 1}</span> to{' '}
              <span className="font-semibold text-slate-200">{Math.min(page * limit, total)}</span> of{' '}
              <span className="font-semibold text-slate-200">{total}</span> records
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-950/40 hover:bg-slate-900 text-slate-300 border border-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((prev) => Math.min(prev + 1, Math.ceil(total / limit)))}
                disabled={page >= Math.ceil(total / limit)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-950/40 hover:bg-slate-900 text-slate-300 border border-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* dialog modal for ADD or EDIT Employee */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg rounded-2xl glass-panel relative border border-white/10 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                  <User size={18} />
                </div>
                <h3 className="text-xl font-bold text-white">
                  {modalMode === 'add' ? 'Add Employee Profile' : 'Edit Employee Profile'}
                </h3>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2.5 rounded-xl text-sm glass-input ${errors.name ? 'border-rose-500/50 focus:border-rose-500' : ''}`}
                  placeholder="e.g. Rachel Green"
                />
                {errors.name && (
                  <p className="text-rose-400 text-xs mt-1.5 flex items-center">
                    <AlertCircle size={12} className="mr-1 shrink-0" />
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Email Address <span className="text-rose-400">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2.5 rounded-xl text-sm glass-input ${errors.email ? 'border-rose-500/50 focus:border-rose-500' : ''}`}
                  placeholder="e.g. rachel.green@company.com"
                />
                {errors.email && (
                  <p className="text-rose-400 text-xs mt-1.5 flex items-center">
                    <AlertCircle size={12} className="mr-1 shrink-0" />
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password (Only for Create Profile) */}
              {modalMode === 'add' && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Password <span className="text-slate-400 text-[10px] lowercase">(Optional - defaults to 'welcome123')</span>
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 rounded-xl text-sm glass-input ${errors.password ? 'border-rose-500/50 focus:border-rose-500' : ''}`}
                    placeholder="Enter customized password"
                  />
                  {errors.password && (
                    <p className="text-rose-400 text-xs mt-1.5 flex items-center">
                      <AlertCircle size={12} className="mr-1 shrink-0" />
                      {errors.password}
                    </p>
                  )}
                </div>
              )}

              {/* Department & Role Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Department <span className="text-rose-400">*</span>
                  </label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 rounded-xl text-sm glass-input"
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

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Role <span className="text-rose-400">*</span>
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 rounded-xl text-sm glass-input"
                  >
                    <option value="EMPLOYEE">EMPLOYEE</option>
                    <option value="MANAGER">MANAGER</option>
                    <option value="HR">HR</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
              </div>

              {/* Salary & Status Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Salary (USD) <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 text-sm">$</span>
                    <input
                      type="number"
                      name="salary"
                      value={formData.salary}
                      onChange={handleInputChange}
                      className={`w-full pl-7 pr-4 py-2.5 rounded-xl text-sm glass-input ${errors.salary ? 'border-rose-500/50 focus:border-rose-500' : ''}`}
                      placeholder="e.g. 75000"
                    />
                  </div>
                  {errors.salary && (
                    <p className="text-rose-400 text-xs mt-1.5 flex items-center">
                      <AlertCircle size={12} className="mr-1 shrink-0" />
                      {errors.salary}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Status <span className="text-rose-400">*</span>
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 rounded-xl text-sm glass-input"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-white/5 flex items-center justify-end space-x-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:text-white border border-transparent hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex items-center justify-center px-6 py-2.5 rounded-xl text-sm font-semibold text-white glass-button disabled:opacity-50"
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 size={16} className="animate-spin mr-2" />
                  )}
                  {modalMode === 'add' ? 'Save Profile' : 'Update Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* complete modal profile details */}
      {isProfileModalOpen && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg rounded-2xl glass-panel relative border border-white/10 overflow-hidden">
            {/* Upper Color Band representing role styling */}
            <div className={`h-24 w-full bg-gradient-to-r ${
              selectedEmployee.role.toUpperCase() === 'ADMIN'
                ? 'from-rose-500/30 to-indigo-500/10'
                : selectedEmployee.role.toUpperCase() === 'HR'
                ? 'from-pink-500/30 to-indigo-500/10'
                : selectedEmployee.role.toUpperCase() === 'MANAGER'
                ? 'from-amber-500/30 to-indigo-500/10'
                : 'from-indigo-600/30 to-indigo-500/10'
            }`} />

            {/* Profile Avatar & Primary Info */}
            <div className="px-6 pb-6 relative">
              <div className="absolute -top-12 left-6 h-20 w-20 rounded-2xl bg-slate-900 border-2 border-indigo-500 text-indigo-400 flex items-center justify-center font-bold text-3xl shadow-xl">
                {selectedEmployee.name.charAt(0)}
              </div>

              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="absolute top-4 right-6 p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors border border-transparent"
              >
                <X size={18} />
              </button>

              <div className="pt-10">
                <div className="flex flex-wrap items-baseline gap-2">
                  <h3 className="text-2xl font-bold text-white">{selectedEmployee.name}</h3>
                  <span className="text-xs font-semibold text-slate-400">#EMP{String(selectedEmployee.id).padStart(3, '0')}</span>
                </div>
                <p className="text-sm text-slate-400 mt-1">{selectedEmployee.email}</p>
              </div>

              {/* Badges Row */}
              <div className="flex gap-2.5 mt-4 pt-4 border-t border-white/5">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${getRoleBadgeStyle(selectedEmployee.role)}`}>
                  <Shield size={12} className="mr-1.5" />
                  {selectedEmployee.role}
                </span>

                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${getStatusBadgeStyle(selectedEmployee.status)}`}>
                  <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${selectedEmployee.status.toUpperCase() === 'ACTIVE' ? 'bg-emerald-400' : 'bg-slate-400'}`} />
                  {selectedEmployee.status}
                </span>
              </div>

              {/* Comprehensive Metadata Profile Tabs */}
              <div className="mt-6 space-y-4">
                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Administrative Assignment</h4>
                
                <div className="grid grid-cols-2 gap-4 p-4 rounded-xl border border-white/5 bg-slate-950/20">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">Department</span>
                    <p className="text-sm font-semibold text-white mt-0.5">{selectedEmployee.department}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">Annual Salary</span>
                    <p className="text-sm font-bold text-emerald-400 mt-0.5">
                      ${selectedEmployee.salary.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest pt-2">Simulated Metadata</h4>

                <div className="space-y-3">
                  <div className="flex items-center text-sm text-slate-300">
                    <Phone size={14} className="mr-3 text-slate-400 shrink-0" />
                    <span>+1 (555) 019-2834</span>
                  </div>
                  <div className="flex items-center text-sm text-slate-300">
                    <MapPin size={14} className="mr-3 text-slate-400 shrink-0" />
                    <span>New York HQ, Room 402</span>
                  </div>
                  <div className="flex items-center text-sm text-slate-300">
                    <Calendar size={14} className="mr-3 text-slate-400 shrink-0" />
                    <span>Joined Dec 12, 2023 (Simulated)</span>
                  </div>
                </div>

                <div className="p-3 bg-indigo-500/5 rounded-xl border border-indigo-500/10 text-xs text-indigo-300/90 flex gap-2.5 items-start">
                  <Info size={14} className="shrink-0 mt-0.5" />
                  <p>
                    All modifications to this employee's security credentials, check-in schedules, and leaves are logged under the global system audit log.
                  </p>
                </div>
              </div>

              {/* Action Controls */}
              <div className="mt-6 pt-4 border-t border-white/5 flex gap-3 justify-end">
                <button
                  onClick={() => setIsProfileModalOpen(false)}
                  className="px-5 py-2 text-sm font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5"
                >
                  Close
                </button>

                {canModify && (
                  <button
                    onClick={() => {
                      setIsProfileModalOpen(false);
                      handleEditClick(selectedEmployee);
                    }}
                    className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all border border-indigo-500/30 flex items-center"
                  >
                    <Edit size={14} className="mr-2" />
                    Edit Profile
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl glass-panel relative border border-white/10 p-6 space-y-4">
            <div className="flex items-start space-x-3.5">
              <div className="p-3 bg-rose-500/10 rounded-xl text-rose-400 shrink-0">
                <Trash2 size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Decommission Employee Profile</h3>
                <p className="text-sm text-slate-400 mt-1">
                  Are you absolutely sure you want to permanently delete this employee? This will purge all associated attendance check-ins and leaves immediately. This action is irreversible.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                disabled={isDeleting}
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                disabled={isDeleting}
                onClick={confirmDelete}
                className="px-5 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-all border border-rose-500/20 flex items-center"
              >
                {isDeleting && <Loader2 size={14} className="animate-spin mr-1.5" />}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
