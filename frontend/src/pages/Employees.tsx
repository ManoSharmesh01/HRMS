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
  FileText,
  Download
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
                          title="Edit Employee"
                          className="p-2 text-slate-400 hover:text-amber-400 hover:bg-white/5 rounded-lg transition-colors border border-transparent hover:border-white/5 inline-flex items-center"
                        >
                          <Edit size={16} />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => handleDeleteClick(emp.id)}
                          title="Delete Employee"
                          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-white/5 rounded-lg transition-colors border border-transparent hover:border-white/5 inline-flex items-center"
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

          {/* Grid View (for smaller screens) */}
          <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-px bg-white/5">
            {employees.map((emp) => (
              <div key={emp.id} className="p-6 bg-slate-900 flex flex-col space-y-4 hover:bg-slate-800/80 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-lg">
                      {emp.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-white">{emp.name}</h4>
                      <p className="text-xs text-slate-400">{emp.email}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeStyle(emp.status)}`}>
                    {emp.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Department</p>
                    <p className="text-sm text-slate-300">{emp.department}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Role</p>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${getRoleBadgeStyle(emp.role)}`}>
                      {emp.role}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4">
                  <p className="text-lg font-bold text-white">${emp.salary.toLocaleString()}</p>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleViewClick(emp)}
                      className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-white/5 rounded-lg transition-all border border-white/5"
                    >
                      <Eye size={18} />
                    </button>
                    {canModify && (
                      <button
                        onClick={() => handleEditClick(emp)}
                        className="p-2 text-slate-400 hover:text-amber-400 hover:bg-white/5 rounded-lg transition-all border border-white/5"
                      >
                        <Edit size={18} />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => handleDeleteClick(emp.id)}
                        className="p-2 text-slate-400 hover:text-rose-400 hover:bg-white/5 rounded-lg transition-all border border-white/5"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Footer */}
          <div className="px-6 py-4 bg-slate-950/20 border-t border-white/5 flex items-center justify-between">
            <p className="text-xs text-slate-400 font-medium">
              Showing <span className="text-slate-200">{employees.length}</span> of <span className="text-slate-200">{total}</span> staff profiles
            </p>
            <div className="flex items-center space-x-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(prev => prev - 1)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-white/5 border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Previous
              </button>
              <div className="flex items-center space-x-1 mx-2">
                {Array.from({ length: Math.ceil(total / limit) }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                      page === i + 1
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                        : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button
                disabled={page >= Math.ceil(total / limit)}
                onClick={() => setPage(prev => prev + 1)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-white/5 border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal (Add/Edit) */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-slideUp">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-slate-950/20">
              <h3 className="text-xl font-bold text-white flex items-center">
                <div className="p-2 bg-indigo-500/10 rounded-lg mr-3 text-indigo-400">
                  {modalMode === 'add' ? <Plus size={20} /> : <Edit size={20} />}
                </div>
                {modalMode === 'add' ? 'Onboard New Staff Member' : `Update Profile: ${selectedEmployee?.name}`}
              </h3>
              <button onClick={() => setIsFormModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
                    <User size={14} className="mr-1.5" /> Full Legal Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. John Doe"
                    className={`w-full px-4 py-2.5 rounded-xl text-sm glass-input ${
                      errors.name ? 'border-rose-500/50 focus:border-rose-500' : ''
                    }`}
                  />
                  {errors.name && <p className="text-[10px] font-bold text-rose-400 mt-1">{errors.name}</p>}
                </div>

                {/* Email Address */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
                    <Mail size={14} className="mr-1.5" /> Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="j.doe@company.com"
                    className={`w-full px-4 py-2.5 rounded-xl text-sm glass-input ${
                      errors.email ? 'border-rose-500/50 focus:border-rose-500' : ''
                    }`}
                  />
                  {errors.email && <p className="text-[10px] font-bold text-rose-400 mt-1">{errors.email}</p>}
                </div>

                {/* Temporary Password (only for Add) */}
                {modalMode === 'add' && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
                      <Shield size={14} className="mr-1.5" /> Portal Password
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Minimum 6 characters"
                      className={`w-full px-4 py-2.5 rounded-xl text-sm glass-input ${
                        errors.password ? 'border-rose-500/50 focus:border-rose-500' : ''
                      }`}
                    />
                    {errors.password && <p className="text-[10px] font-bold text-rose-400 mt-1">{errors.password}</p>}
                    <p className="text-[10px] text-slate-500 italic">User can change this after first login.</p>
                  </div>
                )}

                {/* System Role */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
                    <Shield size={14} className="mr-1.5" /> Access Role
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-xl text-sm glass-input"
                  >
                    <option value="EMPLOYEE">EMPLOYEE</option>
                    <option value="MANAGER">MANAGER</option>
                    <option value="HR">HR</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                  {errors.role && <p className="text-[10px] font-bold text-rose-400 mt-1">{errors.role}</p>}
                </div>

                {/* Department */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
                    <Briefcase size={14} className="mr-1.5" /> Department Unit
                  </label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-xl text-sm glass-input"
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
                  {errors.department && <p className="text-[10px] font-bold text-rose-400 mt-1">{errors.department}</p>}
                </div>

                {/* Salary */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
                    <DollarSign size={14} className="mr-1.5" /> Annual Salary ($)
                  </label>
                  <input
                    type="number"
                    name="salary"
                    value={formData.salary}
                    onChange={handleInputChange}
                    placeholder="e.g. 85000"
                    className={`w-full px-4 py-2.5 rounded-xl text-sm glass-input ${
                      errors.salary ? 'border-rose-500/50 focus:border-rose-500' : ''
                    }`}
                  />
                  {errors.salary && <p className="text-[10px] font-bold text-rose-400 mt-1">{errors.salary}</p>}
                </div>

                {/* Employment Status */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
                    <Info size={14} className="mr-1.5" /> Account Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-xl text-sm glass-input"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:text-white transition-colors hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-8 py-2.5 rounded-xl text-sm font-bold text-white glass-button flex items-center disabled:opacity-50"
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 size={16} className="animate-spin mr-2" />
                  )}
                  {modalMode === 'add' ? 'Execute Onboarding' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Profile Detail View Modal */}
      {isProfileModalOpen && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-scaleIn">
            <div className="h-32 bg-gradient-to-r from-indigo-600 to-violet-600 relative">
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors"
              >
                <X size={20} />
              </button>
              <div className="absolute -bottom-12 left-8 p-1.5 bg-slate-900 rounded-2xl border border-white/10">
                <div className="h-24 w-24 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-3xl font-black shadow-2xl">
                  {selectedEmployee.name.charAt(0)}
                </div>
              </div>
            </div>

            <div className="pt-16 px-8 pb-8 space-y-8">
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-3xl font-black text-white tracking-tight">{selectedEmployee.name}</h3>
                    <p className="text-indigo-400 font-bold flex items-center mt-1 uppercase tracking-widest text-xs">
                      <Briefcase size={14} className="mr-1.5" /> {selectedEmployee.role} • {selectedEmployee.department}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadgeStyle(selectedEmployee.status)}`}>
                    {selectedEmployee.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Contact Intelligence</h4>
                  <div className="space-y-3">
                    <div className="flex items-center text-slate-300 group cursor-pointer">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center mr-3 text-slate-400 group-hover:text-indigo-400 group-hover:bg-indigo-500/10 transition-all">
                        <Mail size={16} />
                      </div>
                      <span className="text-sm font-medium">{selectedEmployee.email}</span>
                    </div>
                    <div className="flex items-center text-slate-300 group cursor-pointer">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center mr-3 text-slate-400 group-hover:text-indigo-400 group-hover:bg-indigo-500/10 transition-all">
                        <Phone size={16} />
                      </div>
                      <span className="text-sm font-medium">+1 (555) 012-3456</span>
                    </div>
                    <div className="flex items-center text-slate-300 group cursor-pointer">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center mr-3 text-slate-400 group-hover:text-indigo-400 group-hover:bg-indigo-500/10 transition-all">
                        <MapPin size={16} />
                      </div>
                      <span className="text-sm font-medium">San Francisco, CA HQ</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Employment Metrics</h4>
                  <div className="space-y-3">
                    <div className="flex items-center text-slate-300 group">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center mr-3 text-slate-400">
                        <DollarSign size={16} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Annual Remuneration</p>
                        <span className="text-sm font-bold text-white">${selectedEmployee.salary.toLocaleString()} USD</span>
                      </div>
                    </div>
                    <div className="flex items-center text-slate-300 group">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center mr-3 text-slate-400">
                        <Calendar size={16} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Employment Since</p>
                        <span className="text-sm font-bold text-white">January 12, 2023</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-white/5 flex justify-end gap-3">
                <button
                  onClick={() => setIsProfileModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:text-white transition-all"
                >
                  Close Profile
                </button>
                {canModify && (
                  <button
                    onClick={() => {
                      setIsProfileModalOpen(false);
                      handleEditClick(selectedEmployee);
                    }}
                    className="px-6 py-2.5 rounded-xl text-sm font-bold text-white glass-button"
                  >
                    Edit Profile
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border border-rose-500/20 rounded-2xl shadow-2xl overflow-hidden p-6 text-center animate-slideUp">
            <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
              <Trash2 size={28} />
            </div>
            <h3 className="text-xl font-bold text-white">Confirm Deletion</h3>
            <p className="text-sm text-slate-400 mt-2">
              Are you sure you want to remove this staff profile? This action is irreversible and will revoke all system access immediately.
            </p>
            <div className="mt-8 flex items-center justify-center space-x-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:text-white transition-colors"
              >
                Keep Profile
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-8 py-2.5 rounded-xl text-sm font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 flex items-center"
              >
                {isDeleting && <Loader2 size={16} className="animate-spin mr-2" />}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
