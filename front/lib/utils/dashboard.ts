import { User } from '@/lib/auth';

/**
 * Get the dashboard URL based on user role
 */
export function getDashboardUrl(user: User | null): string {
  if (!user) return '/dashboard/student';

  switch (user.role) {
    case 'admin':
      return '/dashboard/admin';
    case 'president':
      return '/dashboard/president';
    case 'student':
    default:
      return '/dashboard/student';
  }
}

/**
 * Get dashboard title based on user role
 */
export function getDashboardTitle(user: User | null): string {
  if (!user) return 'Dashboard Estudiante';

  switch (user.role) {
    case 'admin':
      return 'Dashboard Administrador';
    case 'president':
      return 'Dashboard Presidente';
    case 'student':
    default:
      return 'Dashboard Estudiante';
  }
}

/**
 * Get user role display name
 */
export function getRoleDisplayName(role: string): string {
  const roleMap: Record<string, string> = {
    admin: 'Administrador',
    president: 'Presidente',
    student: 'Estudiante',
  };

  return roleMap[role] || 'Usuario';
}

/**
 * Check if user has specific permissions
 */
export function hasPermission(user: User | null, permission: string): boolean {
  if (!user) return false;

  const permissions: Record<string, string[]> = {
    admin: ['manage_users', 'manage_groups', 'manage_events', 'view_reports'],
    president: ['manage_group', 'create_events', 'manage_members'],
    student: ['join_groups', 'attend_events'],
  };

  return permissions[user.role]?.includes(permission) || false;
}

/**
 * Get navigation items based on user role
 */
export function getNavigationItems(user: User | null) {
  const baseItems = [
    { href: '/profile', label: 'Mi Perfil', icon: 'faUser' },
    { href: '/notifications', label: 'Notificaciones', icon: 'faBell' },
    { href: '/profile/security', label: 'Seguridad', icon: 'faShield' },
    { href: '/settings', label: 'Configuración', icon: 'faCog' },
  ];

  // Add role-specific items
  const roleSpecificItems: Record<
    string,
    Array<{ href: string; label: string; icon: string }>
  > = {
    admin: [
      { href: '/admin/users', label: 'Gestionar Usuarios', icon: 'faUsers' },
      { href: '/admin/reports', label: 'Reportes', icon: 'faChartBar' },
    ],
    president: [
      { href: '/president/group', label: 'Mi Grupo', icon: 'faUsers' },
      { href: '/president/events', label: 'Mis Eventos', icon: 'faCalendar' },
    ],
    student: [
      { href: '/student/groups', label: 'Mis Grupos', icon: 'faUsers' },
      { href: '/student/events', label: 'Mis Eventos', icon: 'faCalendar' },
    ],
  };

  const roleItems = user ? roleSpecificItems[user.role] || [] : [];
  return [...baseItems, ...roleItems];
}
