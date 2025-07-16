"use client";

import React, { useState } from 'react';
import { CaseWithRelations, User } from '@/lib/types';
import { X, Plus, Trash2, Search, UserPlus, Users as UsersIcon, Mail, Shield, Award, Briefcase, GraduationCap, Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { getInitials, cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface TeamManagementModalProps {
  case_: CaseWithRelations;
  availableUsers: User[];
  onClose: () => void;
  onAddMember: (userId: string, role: string) => Promise<void>;
  onRemoveMember: (userId: string) => Promise<void>;
}

const roles = [
  { 
    value: 'Abogado Principal', 
    label: 'Abogado Principal', 
    color: 'bg-orange-50 text-orange-700 border-orange-200',
    icon: <Shield className="w-4 h-4" />,
    description: 'Responsable principal del caso'
  },
  { 
    value: 'Abogado Asociado', 
    label: 'Abogado Asociado', 
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: <Award className="w-4 h-4" />,
    description: 'Abogado de apoyo especializado'
  },
  { 
    value: 'Asistente Legal', 
    label: 'Asistente Legal', 
    color: 'bg-green-50 text-green-700 border-green-200',
    icon: <Briefcase className="w-4 h-4" />,
    description: 'Apoyo en tareas legales administrativas'
  },
  { 
    value: 'Consultor', 
    label: 'Consultor', 
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    icon: <UsersIcon className="w-4 h-4" />,
    description: 'Asesor externo especializado'
  },
  { 
    value: 'Pasante', 
    label: 'Pasante', 
    color: 'bg-gray-50 text-gray-700 border-gray-200',
    icon: <GraduationCap className="w-4 h-4" />,
    description: 'Estudiante en formación'
  },
];

export const TeamManagementModal: React.FC<TeamManagementModalProps> = ({
  case_,
  availableUsers,
  onClose,
  onAddMember,
  onRemoveMember
}) => {
  const [userPopoverOpen, setUserPopoverOpen] = useState(false);
  const [rolePopoverOpen, setRolePopoverOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [localTeamMembers, setLocalTeamMembers] = useState(case_.teamMembers || []);
  const { toast } = useToast();

  // Actualizar la lista local cuando cambie el caso
  React.useEffect(() => {
    setLocalTeamMembers(case_.teamMembers || []);
  }, [case_.teamMembers]);

  const assignedUserIds = localTeamMembers.map(member => member.userId);
  const unassignedUsers = availableUsers.filter(user => !assignedUserIds.includes(user.id));

  const handleAddMember = async () => {
    if (!selectedUser || !selectedRole) {
      toast({
        title: "Error",
        description: "Selecciona un usuario y un rol",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      // Actualizar la lista local inmediatamente para feedback visual instantáneo
      const newMember = {
        userId: selectedUser.id,
        roleInCase: selectedRole,
        user: selectedUser
      };
      setLocalTeamMembers(prev => [...prev, newMember]);
      
      // Llamar a la función del padre
      await onAddMember(selectedUser.id, selectedRole);
      
      // Limpiar selecciones
      setSelectedUser(null);
      setSelectedRole('');
      setUserPopoverOpen(false);
      setRolePopoverOpen(false);
      
      toast({
        title: "¡Éxito!",
        description: `${selectedUser.firstName} ${selectedUser.lastName} ha sido añadido al equipo`,
        variant: "success"
      });
    } catch (error) {
      // Revertir el cambio local si hay error
      setLocalTeamMembers(case_.teamMembers || []);
      toast({
        title: "Error",
        description: "No se pudo añadir el miembro al equipo",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string, userName: string) => {
    if (window.confirm(`¿Está seguro de quitar a ${userName} del equipo?`)) {
      try {
        // Actualizar la lista local inmediatamente
        setLocalTeamMembers(prev => prev.filter(member => member.userId !== userId));
        
        // Llamar a la función del padre
        await onRemoveMember(userId);
        
        toast({
          title: "Miembro removido",
          description: `${userName} ha sido removido del equipo`,
          variant: "success"
        });
      } catch (error) {
        // Revertir el cambio local si hay error
        setLocalTeamMembers(case_.teamMembers || []);
        toast({
          title: "Error",
          description: "No se pudo remover el miembro del equipo",
          variant: "destructive"
        });
      }
    }
  };

  const getRoleConfig = (role: string) => {
    return roles.find(r => r.value === role) || roles[4]; // Default to last role
  };

  return (
    <div className="fixed inset-0 bg-gray-900/90 backdrop-blur-xl flex items-center justify-center p-4 z-50 animate-in fade-in-0 duration-500">
      <div className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden border border-gray-200/50 relative">
        
        {/* Decorative gradient header */}
        <div className="h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600" />
        
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8 border-b border-gray-200/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-2xl shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <UsersIcon className="h-10 w-10 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-1">
                  Gestión de Equipo Legal
                </h2>
                <p className="text-gray-600 text-lg">
                  {case_.caseName}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                    {localTeamMembers.length} miembro{localTeamMembers.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-gray-500 hover:bg-white/50 rounded-full transition-all duration-200 hover:scale-110"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(95vh-300px)] bg-gradient-to-br from-gray-50/50 to-white">
          <div className="p-8 space-y-8">
            
            {/* Add New Member Section */}
            <section className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200/50 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
                  <UserPlus className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Añadir Nuevo Miembro</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* User Selection */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    Seleccionar Usuario
                  </label>
                  <Popover open={userPopoverOpen} onOpenChange={setUserPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={userPopoverOpen}
                        className="w-full justify-between h-14 border-2 border-gray-200 hover:border-orange-300 transition-all duration-200"
                        disabled={unassignedUsers.length === 0}
                      >
                        <div className="flex items-center gap-3">
                          {selectedUser ? (
                            <>
                              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                {getInitials(`${selectedUser.firstName} ${selectedUser.lastName}`)}
                              </div>
                              <span className="font-medium">{selectedUser.firstName} {selectedUser.lastName}</span>
                            </>
                          ) : (
                            <>
                              <Search className="h-5 w-5 text-gray-400" />
                              <span className="text-gray-500">Seleccionar usuario...</span>
                            </>
                          )}
                        </div>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0 border-2 border-gray-200 rounded-xl shadow-xl">
                      <Command>
                        <CommandInput placeholder="Buscar usuario..." />
                        <CommandList>
                          <CommandEmpty>No se encontraron usuarios disponibles.</CommandEmpty>
                          <CommandGroup>
                            {unassignedUsers.map((user) => (
                              <CommandItem
                                key={user.id}
                                value={`${user.firstName} ${user.lastName}`}
                                onSelect={() => {
                                  setSelectedUser(user);
                                  setUserPopoverOpen(false);
                                }}
                                className="flex items-center space-x-4 p-4 hover:bg-orange-50 rounded-lg cursor-pointer"
                              >
                                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                  {getInitials(`${user.firstName} ${user.lastName}`)}
                                </div>
                                <div className="flex-1">
                                  <div className="font-semibold text-gray-900">{user.firstName} {user.lastName}</div>
                                  <div className="text-sm text-gray-500 flex items-center gap-1">
                                    <Mail className="w-3 h-3" />
                                    {user.email}
                                  </div>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Role Selection - Ahora con Popover Searchable */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    Rol en el Caso
                  </label>
                  <Popover open={rolePopoverOpen} onOpenChange={setRolePopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={rolePopoverOpen}
                        className="w-full justify-between h-14 border-2 border-gray-200 hover:border-orange-300 transition-all duration-200"
                        disabled={!selectedUser}
                      >
                        <div className="flex items-center gap-3">
                          {selectedRole ? (
                            <>
                              {React.cloneElement(roles.find(r => r.value === selectedRole)?.icon || <Briefcase className="h-5 w-5" />, { 
                                className: "h-5 w-5 text-gray-600"
                              })}
                              <span className="font-medium">{roles.find(r => r.value === selectedRole)?.label}</span>
                            </>
                          ) : (
                            <>
                              <Briefcase className="h-5 w-5 text-gray-400" />
                              <span className="text-gray-500">Seleccionar rol...</span>
                            </>
                          )}
                        </div>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0 border-2 border-gray-200 rounded-xl shadow-xl">
                      <Command>
                        <CommandInput placeholder="Buscar rol..." />
                        <CommandList>
                          <CommandEmpty>No se encontraron roles.</CommandEmpty>
                          <CommandGroup>
                            {roles.map((role) => (
                              <CommandItem
                                key={role.value}
                                value={role.label}
                                onSelect={() => {
                                  setSelectedRole(role.value);
                                  setRolePopoverOpen(false);
                                }}
                                className="flex items-center space-x-4 p-4 hover:bg-orange-50 rounded-lg cursor-pointer"
                              >
                                <Check className={cn("h-4 w-4", selectedRole === role.value ? "opacity-100 text-orange-500" : "opacity-0")} />
                                <div className="flex items-center gap-3 flex-1">
                                  {React.cloneElement(role.icon, { className: "h-5 w-5 text-gray-600" })}
                                  <div>
                                    <p className="font-medium">{role.label}</p>
                                    <p className="text-xs text-gray-500">{role.description}</p>
                                  </div>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {selectedRole && (
                    <p className="mt-2 text-sm text-gray-600">
                      {roles.find(r => r.value === selectedRole)?.description}
                    </p>
                  )}
                </div>

                {/* Add Button */}
                <div className="flex items-end">
                  <Button
                    onClick={handleAddMember}
                    disabled={!selectedUser || !selectedRole || loading}
                    className="w-full h-14 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-orange-500/25 hover:scale-105 active:scale-95"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    {loading ? 'Añadiendo...' : 'Añadir al Equipo'}
                  </Button>
                </div>
              </div>

              {unassignedUsers.length === 0 && (
                <div className="mt-6 text-center p-6 bg-white/50 rounded-xl border-2 border-dashed border-gray-300">
                  <UsersIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-600 font-medium">Todos los usuarios disponibles ya están asignados a este caso</p>
                </div>
              )}
            </section>

            {/* Current Team Members */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                  <UsersIcon className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  Equipo Actual ({localTeamMembers.length} miembro{localTeamMembers.length !== 1 ? 's' : ''})
                </h3>
              </div>

              {localTeamMembers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {localTeamMembers.map((member) => {
                    const user = member.user;
                    if (!user) return null;

                    const roleConfig = getRoleConfig(member.roleInCase);

                    return (
                      <div 
                        key={member.userId} 
                        className="bg-white rounded-2xl p-6 border-2 border-gray-200/50 hover:shadow-lg transition-all duration-300 group hover:border-blue-300/50 transform hover:-translate-y-1"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 text-white rounded-2xl flex items-center justify-center font-bold text-xl shadow-lg group-hover:scale-110 transition-transform duration-200">
                              {getInitials(`${user.firstName} ${user.lastName}`)}
                            </div>
                            <div>
                              <h4 className="font-bold text-lg text-gray-900">
                                {user.firstName} {user.lastName}
                              </h4>
                              <div className="flex items-center gap-1 text-gray-500 mb-2">
                                <Mail className="w-4 h-4" />
                                <span className="text-sm">{user.email}</span>
                              </div>
                              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold border-2 ${roleConfig.color}`}>
                                {roleConfig.icon}
                                <span>{member.roleInCase}</span>
                              </div>
                            </div>
                          </div>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveMember(member.userId, `${user.firstName} ${user.lastName}`)}
                            className="text-red-600 hover:text-red-700 hover:border-red-300 hover:bg-red-50 transition-all duration-200 hover:scale-105"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Remover
                          </Button>
                        </div>
                        
                        <div className="text-sm text-gray-600">
                          <p>{roleConfig.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-300">
                  <UsersIcon className="h-20 w-20 mx-auto mb-4 text-gray-400" />
                  <h4 className="text-xl font-bold text-gray-600 mb-2">No hay miembros en el equipo</h4>
                  <p className="text-gray-500 mb-6">Añade el primer miembro para empezar a colaborar en este caso</p>
                  {unassignedUsers.length > 0 && (
                    <Button
                      onClick={() => setUserPopoverOpen(true)}
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Añadir Primer Miembro
                    </Button>
                  )}
                </div>
              )}
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200/50 px-8 py-6 bg-gradient-to-r from-gray-50/50 to-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              <strong>{localTeamMembers.length}</strong> miembro{localTeamMembers.length !== 1 ? 's' : ''} en el equipo
            </span>
            <span className="text-sm text-gray-600">
              <strong>{unassignedUsers.length}</strong> usuario{unassignedUsers.length !== 1 ? 's' : ''} disponible{unassignedUsers.length !== 1 ? 's' : ''}
            </span>
          </div>
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="hover:bg-gray-100 transition-all duration-200 hover:scale-105"
          >
            Finalizar Gestión
          </Button>
        </div>
      </div>
    </div>
  );
};