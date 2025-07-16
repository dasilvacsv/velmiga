"use client";

import React, { useState, useEffect } from 'react';
import {
  Users, Plus, Edit, Trash2, Search, Filter, UserCheck, Key, MoreVertical,
  AlertTriangle, Activity, Mail, ChevronDown, ChevronRight, List, FileText,
  ArrowRight, Clock, User, Calendar, CheckCircle, XCircle, AlertCircle,
  Briefcase, Target, MessageSquare, History, Settings, Eye, EyeOff
} from 'lucide-react';

// Mock the server actions since we don't have the actual implementation
import {
  getUsersWithStats,
  createUser,
  updateUser,
  deleteUser,
  changeUserPassword,
  getUserTasks,
  getUserMovements,
  getUserCasesWithTasks,
  type UserWithStats
} from '../actions';

interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'SOCIO' | 'ABOGADO' | 'ASISTENTE' | 'ADMIN';
}

interface UserDetails {
  tasks: Awaited<ReturnType<typeof getUserTasks>>;
  movements: Awaited<ReturnType<typeof getUserMovements>>;
  cases: Awaited<ReturnType<typeof getUserCasesWithTasks>>;
}

export function UserManagement() {
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithStats | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'ABOGADO'
  });
  const [newPassword, setNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados para la tabla expandible
  const [expandedUserIds, setExpandedUserIds] = useState<string[]>([]);
  const [userDetailsMap, setUserDetailsMap] = useState<Record<string, UserDetails>>({});
  const [loadingDetails, setLoadingDetails] = useState<Record<string, boolean>>({});
  const [expandedCaseIds, setExpandedCaseIds] = useState<string[]>([]);
  const [expandedTaskDescriptions, setExpandedTaskDescriptions] = useState<string[]>([]);


  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const usersData = await getUsersWithStats();
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
      showToast('Error al cargar usuarios', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const toastElement = document.createElement('div');
    toastElement.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300 ${
      type === 'success' ? 'bg-green-500 text-white' :
      type === 'error' ? 'bg-red-500 text-white' :
      'bg-gray-700 text-white' // Usamos gris oscuro para info por defecto
    }`;
    toastElement.textContent = message;
    document.body.appendChild(toastElement);

    setTimeout(() => {
      toastElement.remove();
    }, 3000);
  };

  const handleCreateUser = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      showToast('Todos los campos son obligatorios', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createUser(formData);
      if (result.success) {
        showToast('Usuario creado exitosamente', 'success');
        setShowCreateModal(false);
        setFormData({ firstName: '', lastName: '', email: '', password: '', role: 'ABOGADO' });
        loadUsers();
      } else {
        showToast(result.error || 'Error al crear usuario', 'error');
      }
    } catch (error) {
      showToast('Error inesperado al crear usuario', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser || !formData.firstName || !formData.lastName || !formData.email) {
      showToast('Todos los campos son obligatorios', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await updateUser(selectedUser.id, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        role: formData.role
      });

      if (result.success) {
        showToast('Usuario actualizado exitosamente', 'success');
        setShowEditModal(false);
        setSelectedUser(null);
        loadUsers();
      } else {
        showToast(result.error || 'Error al actualizar usuario', 'error');
      }
    } catch (error) {
      showToast('Error inesperado al actualizar usuario', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (user: UserWithStats) => {
    const confirmed = window.confirm(
      `¿Estás seguro de que deseas eliminar a "${user.firstName} ${user.lastName}"? Esta acción no se puede deshacer.`
    );

    if (confirmed) {
      try {
        const result = await deleteUser(user.id);
        if (result.success) {
          showToast('Usuario eliminado exitosamente', 'success');
          loadUsers();
        } else {
          showToast(result.error || 'Error al eliminar usuario', 'error');
        }
      } catch (error) {
        showToast('Error inesperado al eliminar usuario', 'error');
      }
    }
  };

  const handleChangePassword = async () => {
    if (!selectedUser || !newPassword) {
      showToast('La nueva contraseña es obligatoria', 'error');
      return;
    }

    if (newPassword.length < 6) {
      showToast('La contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await changeUserPassword(selectedUser.id, newPassword);
      if (result.success) {
        showToast('Contraseña cambiada exitosamente', 'success');
        setShowPasswordModal(false);
        setNewPassword('');
        setSelectedUser(null);
      } else {
        showToast(result.error || 'Error al cambiar contraseña', 'error');
      }
    } catch (error) {
      showToast('Error inesperado al cambiar contraseña', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (user: UserWithStats) => {
    setSelectedUser(user);
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: '',
      role: user.role as any
    });
    setShowEditModal(true);
  };

  const openPasswordModal = (user: UserWithStats) => {
    setSelectedUser(user);
    setNewPassword('');
    setShowPasswordModal(true);
  };

  const getRoleColor = (role: string) => {
    // Colores de rol ligeramente más intensos para contrastar
    switch (role) {
      case 'ADMIN': return 'bg-red-400 text-red-900';
      case 'SOCIO': return 'bg-yellow-400 text-yellow-900'; // Dorado más fuerte para Socio
      case 'ABOGADO': return 'bg-blue-400 text-blue-900';
      case 'ASISTENTE': return 'bg-gray-400 text-gray-900';
      default: return 'bg-gray-400 text-gray-900';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Administrador';
      case 'SOCIO': return 'Socio';
      case 'ABOGADO': return 'Abogado';
      case 'ASISTENTE': return 'Asistente';
      default: return role;
    }
  };

  const toggleUserDetails = async (userId: string) => {
    if (expandedUserIds.includes(userId)) {
      setExpandedUserIds(expandedUserIds.filter(id => id !== userId));
      return;
    }

    setExpandedUserIds([...expandedUserIds, userId]);

    if (!userDetailsMap.hasOwnProperty(userId)) {
      setLoadingDetails({ ...loadingDetails, [userId]: true });
      try {
        const [tasks, movements, cases] = await Promise.all([
          getUserTasks(userId),
          getUserMovements(userId),
          getUserCasesWithTasks(userId)
        ]);

        setUserDetailsMap(prev => ({
          ...prev,
          [`${userId}`]: { tasks, movements, cases }
        }));
      } catch (error) {
        console.error('Error loading user details:', error);
        showToast('Error al cargar detalles del usuario', 'error');
      } finally {
        setLoadingDetails({ ...loadingDetails, [userId]: false });
      }
    }
  };

  const toggleCaseDetails = (caseId: string) => {
    if (expandedCaseIds.includes(caseId)) {
      setExpandedCaseIds(expandedCaseIds.filter(id => id !== caseId));
    } else {
      setExpandedCaseIds([...expandedCaseIds, caseId]);
    }
  };

  const toggleTaskDescription = (taskId: string) => {
    setExpandedTaskDescriptions(prev =>
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };

  const getStatusColor = (status: string) => {
    // Colores de estado más vivos y legibles
    switch (status) {
      case 'ACTIVO': return 'bg-green-400 text-green-900';
      case 'EN_REVISION': return 'bg-orange-400 text-orange-900'; // Naranja más vibrante
      case 'APROBADA': return 'bg-amber-500 text-white'; // Dorado para Aprobada
      case 'CERRADO': return 'bg-gray-400 text-gray-900';
      case 'EN_ESPERA': return 'bg-yellow-400 text-yellow-900';
      case 'ARCHIVADO': return 'bg-slate-400 text-slate-900';
      default: return 'bg-gray-400 text-gray-900';
    }
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatRelativeTime = (date: Date | string) => {
    const now = new Date();
    const targetDate = new Date(date);
    const diffTime = now.getTime() - targetDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
    return `Hace ${Math.floor(diffDays / 30)} meses`;
  };

  const truncateText = (text: string, maxLength: number = 50) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            {/* Loader en tonos grises con un toque dorado */}
            <div className="w-20 h-20 border-4 border-gray-200 rounded-full animate-spin border-t-amber-500 mx-auto mb-4"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-amber-300 rounded-full animate-ping mx-auto"></div>
          </div>
          <div className="text-gray-700 font-semibold text-lg">Cargando usuarios...</div>
          <div className="text-gray-500 text-sm mt-2">Preparando el sistema de gestión</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="p-4 bg-white rounded-2xl shadow-sm border border-gray-200">
                  <Users className="h-10 w-10 text-gray-700" />
                </div>
                {/* Punto de actividad en verde fuerte */}
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-800">
                  Gestión de Usuarios
                </h1>
                <p className="text-gray-600 text-lg mt-2">
                  Administra el equipo y controla el acceso al sistema
                </p>
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                    <UserCheck className="h-4 w-4" />
                    {filteredUsers.length} usuarios activos
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                    <Activity className="h-4 w-4" />
                    Sistema operativo
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-3 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105" // Botón principal en dorado
            >
              <Plus className="h-5 w-5" />
              Nuevo Usuario
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <Search className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar usuarios por nombre, apellido o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent transition-all duration-200 text-gray-800 placeholder-gray-500" // Foco en dorado claro
                />
              </div>
              <div className="relative">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent transition-all duration-200 min-w-48 text-gray-800" // Foco en dorado claro
                >
                  <option value="ALL">Todos los roles</option>
                  <option value="ADMIN">Administradores</option>
                  <option value="SOCIO">Socios</option>
                  <option value="ABOGADO">Abogados</option>
                  <option value="ASISTENTE">Asistentes</option>
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <Filter className="h-5 w-5" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        {filteredUsers.length > 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider w-10">
                    {/* Espacio para el icono de expansión */}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Rol
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Casos
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Tareas
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Última actividad
                  </th>
                  <th scope="col" className="relative px-6 py-3 w-20">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <React.Fragment key={user.id}>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleUserDetails(user.id)}
                          className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-200 transition-all duration-200 text-amber-500" // Icono de expansión en dorado
                        >
                          {expandedUserIds.includes(user.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-700 font-medium text-sm">
                            {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleColor(user.role)}`}>
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-700">
                          {user.casesCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-700">
                          {user.tasksCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.lastActivity ? (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <span>{formatRelativeTime(user.lastActivity)}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">Nunca</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="relative">
                          <button
                            onClick={() => setSelectedUser(selectedUser?.id === user.id ? null : user)}
                            className="text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-300 rounded-md" // Foco en dorado claro
                          >
                            <MoreVertical className="h-5 w-5" />
                          </button>

                          {selectedUser?.id === user.id && (
                            <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                              <div className="py-1">
                                <button
                                  onClick={() => openEditModal(user)}
                                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                >
                                  <Edit className="h-4 w-4 inline-block mr-2 text-amber-600" /> {/* Ícono de Editar en dorado */}
                                  Editar Usuario
                                </button>
                                <button
                                  onClick={() => openPasswordModal(user)}
                                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                >
                                  <Key className="h-4 w-4 inline-block mr-2 text-gray-600" />
                                  Cambiar Contraseña
                                </button>
                                <hr className="my-1 border-gray-100" />
                                <button
                                  onClick={() => handleDeleteUser(user)}
                                  className="block px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                                >
                                  <Trash2 className="h-4 w-4 inline-block mr-2" />
                                  Eliminar Usuario
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedUserIds.includes(user.id) && (
                      <tr>
                        <td colSpan={7} className="p-0">
                          <div className="p-6 bg-gray-50 border-t border-gray-100">
                            {loadingDetails.hasOwnProperty(user.id) && loadingDetails[`${user.id}`] ? (
                              <div className="flex items-center justify-center py-6">
                                <div className="w-6 h-6 border-2 border-gray-200 rounded-full animate-spin border-t-gray-600 mr-3"></div>
                                <span className="text-gray-700">Cargando detalles...</span>
                              </div>
                            ) : userDetailsMap.hasOwnProperty(user.id) ? (
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Tareas Asignadas */}
                                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                                  <div className="flex items-center gap-2 mb-4">
                                    <div className="p-2 bg-gray-100 rounded-md text-amber-500"> {/* Icono de lista en dorado */}
                                      <List className="h-5 w-5" />
                                    </div>
                                    <div>
                                      <h3 className="font-semibold text-gray-800">Tareas Asignadas</h3>
                                      <p className="text-sm text-gray-500">{userDetailsMap[`${user.id}`].tasks.length} tareas</p>
                                    </div>
                                  </div>

                                  <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                                    {userDetailsMap[`${user.id}`].tasks.length === 0 ? (
                                      <div className="text-center py-4">
                                        <Target className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                                        <p className="text-gray-500 text-sm">No hay tareas asignadas</p>
                                      </div>
                                    ) : (
                                      userDetailsMap[`${user.id}`].tasks.map((task) => (
                                        <div key={task.id} className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors border border-gray-100">
                                          <div className="flex justify-between items-center mb-1">
                                            <span className="font-medium text-gray-800 text-sm flex-1 truncate">
                                              {truncateText(task.title, 30)}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                                              {task.status}
                                            </span>
                                          </div>
                                          <p className="text-xs text-gray-600 mb-2">{truncateText(task.description, 70)}</p>
                                          <div className="flex items-center gap-1 text-xs text-gray-500">
                                            <Briefcase className="h-3 w-3" />
                                            <span>{truncateText(task.caseName, 20)}</span>
                                          </div>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </div>

                                {/* Casos Asignados */}
                                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                                  <div className="flex items-center gap-2 mb-4">
                                    <div className="p-2 bg-gray-100 rounded-md text-amber-500"> {/* Icono de archivo en dorado */}
                                      <FileText className="h-5 w-5" />
                                    </div>
                                    <div>
                                      <h3 className="font-semibold text-gray-800">Casos Asignados</h3>
                                      <p className="text-sm text-gray-500">{userDetailsMap[`${user.id}`].cases.length} casos</p>
                                    </div>
                                  </div>
                                  <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                                    {userDetailsMap[`${user.id}`].cases.length === 0 ? (
                                      <div className="text-center py-4">
                                        <FileText className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                                        <p className="text-gray-500 text-sm">No hay casos asignados</p>
                                      </div>
                                    ) : (
                                      userDetailsMap[`${user.id}`].cases.map((caseItem) => (
                                        <div key={caseItem.id} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                          <div className="flex justify-between items-center">
                                            <span className="font-medium text-gray-800 text-sm truncate flex-1">
                                              {truncateText(caseItem.caseName, 25)}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(caseItem.status)}`}>
                                              {caseItem.status}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                            <Target className="h-3 w-3" />
                                            <span>{caseItem.tasks.length} tareas</span>
                                          </div>

                                          {/* Tareas en este caso - Expandible */}
                                          {expandedCaseIds.includes(caseItem.id) && caseItem.tasks.length > 0 && (
                                            <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                                              {caseItem.tasks.map((task) => (
                                                <div key={task.id} className="bg-white rounded-md p-2 border border-gray-200">
                                                  <div className="flex justify-between items-center">
                                                    <span className="text-xs font-medium text-gray-800 flex-1">
                                                      {truncateText(task.title || task.description, 30)}
                                                    </span>
                                                    <span className={`px-1.5 py-0.5 rounded-full text-xs ${getStatusColor(task.status)}`}>
                                                      {task.status}
                                                    </span>
                                                  </div>
                                                  {task.description && (
                                                    <div className="mt-1 text-xs text-gray-600">
                                                      {expandedTaskDescriptions.includes(task.id) ? (
                                                        <p>{task.description}</p>
                                                      ) : (
                                                        <p>{truncateText(task.description, 60)}</p>
                                                      )}
                                                      {task.description.length > 60 && (
                                                        <button
                                                          onClick={(e) => { e.stopPropagation(); toggleTaskDescription(task.id); }}
                                                          className="text-amber-600 hover:underline mt-0.5 block" // "Ver más" en dorado
                                                        >
                                                          {expandedTaskDescriptions.includes(task.id) ? 'Ver menos' : 'Ver más'}
                                                        </button>
                                                      )}
                                                    </div>
                                                  )}
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                          {/* Botón para expandir/contraer todas las tareas de este caso */}
                                          {caseItem.tasks.length > 0 && (
                                              <button
                                                  onClick={(e) => { e.stopPropagation(); toggleCaseDetails(caseItem.id); }}
                                                  className="text-xs text-amber-600 hover:underline mt-2 block w-full text-center" // Botón de caso en dorado
                                              >
                                                  {expandedCaseIds.includes(caseItem.id) ? 'Ocultar tareas del caso' : 'Ver todas las tareas del caso'}
                                              </button>
                                          )}
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </div>

                                {/* Historial de Movimientos */}
                                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                                  <div className="flex items-center gap-2 mb-4">
                                    <div className="p-2 bg-gray-100 rounded-md text-amber-500"> {/* Icono de historial en dorado */}
                                      <History className="h-5 w-5" />
                                    </div>
                                    <div>
                                      <h3 className="font-semibold text-gray-800">Historial</h3>
                                      <p className="text-sm text-gray-500">{userDetailsMap[`${user.id}`].movements.length} movimientos</p>
                                    </div>
                                  </div>
                                  <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                                    {userDetailsMap[`${user.id}`].movements.length === 0 ? (
                                      <div className="text-center py-4">
                                        <Activity className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                                        <p className="text-gray-500 text-sm">No hay actividad reciente</p>
                                      </div>
                                    ) : (
                                      userDetailsMap[`${user.id}`].movements.map((movement) => (
                                        <div key={movement.id} className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors border border-gray-100">
                                          <div className="flex justify-between items-start mb-1">
                                            <span className="font-medium text-gray-800 text-sm flex-1 truncate">
                                              {truncateText(movement.title, 30)}
                                            </span>
                                            <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                                              {formatDate(movement.createdAt)}
                                            </span>
                                          </div>
                                          <p className="text-xs text-gray-600">
                                            {truncateText(movement.description, 60)}
                                          </p>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-6 text-red-500">
                                <AlertTriangle className="h-10 w-10 mx-auto mb-2" />
                                <p>Error al cargar los detalles del usuario</p>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-gray-200 rounded-3xl mx-auto mb-6 flex items-center justify-center">
                <Users className="h-12 w-12 text-gray-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">
                No se encontraron usuarios
              </h3>
              <p className="text-gray-600 mb-8">
                {searchTerm || roleFilter !== 'ALL'
                  ? 'Intenta ajustar los filtros de búsqueda para encontrar usuarios'
                  : 'Comienza creando el primer usuario del sistema'
                }
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200" // Botón de estado vacío en dorado
              >
                <Plus className="h-5 w-5" />
                Crear Primer Usuario
              </button>
            </div>
          </div>
        )}

        {/* Create User Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800">Crear Nuevo Usuario</h2>
                <p className="text-gray-600 mt-1">Completa la información para crear una nueva cuenta</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
                    <input
                      type="text"
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-300 text-gray-800 placeholder-gray-500" // Foco en dorado claro
                      placeholder="Nombre"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">Apellido</label>
                    <input
                      type="text"
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-300 text-gray-800 placeholder-gray-500" // Foco en dorado claro
                      placeholder="Apellido"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-300 text-gray-800 placeholder-gray-500" // Foco en dorado claro
                    placeholder="email@ejemplo.com"
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
                  <input
                      type="password"
                      id="password"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-300 text-gray-800 placeholder-gray-500" // Foco en dorado claro
                      placeholder="Contraseña segura"
                  />
                </div>
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">Rol</label>
                  <select
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as any }))}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-300 text-gray-800" // Foco en dorado claro
                  >
                    <option value="ASISTENTE">Asistente</option>
                    <option value="ABOGADO">Abogado</option>
                    <option value="SOCIO">Socio</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 flex gap-3">
                <button
                  onClick={handleCreateUser}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50"
                >
                  {isSubmitting ? 'Creando...' : 'Crear Usuario'}
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all duration-200"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800">Editar Usuario</h2>
                <p className="text-gray-600 mt-1">Actualiza la información del usuario</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="editFirstName" className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
                    <input
                      type="text"
                      id="editFirstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-300 text-gray-800 placeholder-gray-500" // Foco en dorado claro
                      placeholder="Nombre"
                    />
                  </div>
                  <div>
                    <label htmlFor="editLastName" className="block text-sm font-medium text-gray-700 mb-2">Apellido</label>
                    <input
                      type="text"
                      id="editLastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-300 text-gray-800 placeholder-gray-500" // Foco en dorado claro
                      placeholder="Apellido"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="editEmail" className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    id="editEmail"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-300 text-gray-800 placeholder-gray-500" // Foco en dorado claro
                    placeholder="email@ejemplo.com"
                  />
                </div>
                <div>
                  <label htmlFor="editRole" className="block text-sm font-medium text-gray-700 mb-2">Rol</label>
                  <select
                    id="editRole"
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as any }))}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-300 text-gray-800" // Foco en dorado claro
                  >
                    <option value="ASISTENTE">Asistente</option>
                    <option value="ABOGADO">Abogado</option>
                    <option value="SOCIO">Socio</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 flex gap-3">
                <button
                  onClick={handleUpdateUser}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50"
                >
                  {isSubmitting ? 'Actualizando...' : 'Actualizar Usuario'}
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all duration-200"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Change Password Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800">Cambiar Contraseña</h2>
                <p className="text-gray-600 mt-1">
                  Nueva contraseña para {selectedUser?.firstName} {selectedUser?.lastName}
                </p>
              </div>
              <div className="p-6">
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">Nueva Contraseña</label>
                  <input
                    type="password"
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-300 text-gray-800 placeholder-gray-500" // Foco en dorado claro
                    placeholder="Nueva contraseña segura"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    La contraseña debe tener al menos 6 caracteres.
                  </p>
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 flex gap-3">
                <button
                  onClick={handleChangePassword}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50"
                >
                  {isSubmitting ? 'Cambiando...' : 'Cambiar Contraseña'}
                </button>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all duration-200"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}