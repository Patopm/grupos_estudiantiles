'use client';

import React from 'react';
import GroupCard from './GroupCard';
import { Group, GroupStatistics } from '@/lib/api/groups';

// Demo data for testing the enhanced GroupCard
const demoGroups: Group[] = [
  {
    group_id: '1',
    name: 'Club de Programación',
    description:
      'Un grupo para estudiantes apasionados por la programación y el desarrollo de software. Organizamos talleres, hackathons y proyectos colaborativos.',
    image: '/demo-group-1.jpg',
    president_name: 'Ana García',
    president_id: 1,
    category: 'Tecnológico',
    member_count: 15,
    max_members: 20,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    is_member: false,
    membership_status: undefined,
  },
  {
    group_id: '2',
    name: 'Grupo de Estudio Matemáticas',
    description:
      'Grupo dedicado al estudio colaborativo de matemáticas avanzadas.',
    president_name: 'Carlos López',
    president_id: 2,
    category: 'Académico',
    member_count: 18,
    max_members: 20,
    is_active: true,
    created_at: '2024-01-15T00:00:00Z',
    is_member: true,
    membership_status: 'active',
  },
  {
    group_id: '3',
    name: 'Club de Fútbol Universitario',
    description: 'Equipo de fútbol para estudiantes universitarios.',
    president_name: 'María Rodríguez',
    president_id: 3,
    category: 'Deportivo',
    member_count: 25,
    max_members: 25,
    is_active: true,
    created_at: '2024-02-01T00:00:00Z',
    is_member: false,
    membership_status: undefined,
  },
  {
    group_id: '4',
    name: 'Sociedad de Debate',
    description:
      'Grupo para practicar y mejorar habilidades de debate y oratoria.',
    president_name: 'Luis Martínez',
    president_id: 4,
    category: 'Cultural',
    member_count: 8,
    max_members: 15,
    is_active: true,
    created_at: '2024-02-15T00:00:00Z',
    is_member: false,
    membership_status: 'pending',
  },
];

const demoStatistics: Record<string, GroupStatistics> = {
  '1': {
    totalMembers: 15,
    activeMembers: 14,
    upcomingEvents: 3,
    totalEvents: 8,
    membershipGrowth: 12,
    eventAttendanceRate: 85,
  },
  '2': {
    totalMembers: 18,
    activeMembers: 17,
    upcomingEvents: 2,
    totalEvents: 12,
    membershipGrowth: 8,
    eventAttendanceRate: 92,
  },
  '3': {
    totalMembers: 25,
    activeMembers: 23,
    upcomingEvents: 1,
    totalEvents: 15,
    membershipGrowth: 5,
    eventAttendanceRate: 78,
  },
  '4': {
    totalMembers: 8,
    activeMembers: 8,
    upcomingEvents: 4,
    totalEvents: 6,
    membershipGrowth: 25,
    eventAttendanceRate: 95,
  },
};

export default function GroupCardDemo() {
  const handleJoin = (groupId: string) => {
    console.log('Join group:', groupId);
    alert(`Solicitud enviada para unirse al grupo ${groupId}`);
  };

  const handleLeave = (groupId: string) => {
    console.log('Leave group:', groupId);
    alert(`Saliendo del grupo ${groupId}`);
  };

  const handleView = (groupId: string) => {
    console.log('View group:', groupId);
    alert(`Viendo detalles del grupo ${groupId}`);
  };

  const handleManage = (groupId: string) => {
    console.log('Manage group:', groupId);
    alert(`Gestionando grupo ${groupId}`);
  };

  return (
    <div className='p-8 space-y-8 bg-background min-h-screen'>
      <div className='max-w-6xl mx-auto'>
        <h1 className='text-3xl font-bold mb-8'>Enhanced GroupCard Demo</h1>

        <div className='space-y-8'>
          <section>
            <h2 className='text-2xl font-semibold mb-4'>Default Variant</h2>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {demoGroups.map(group => (
                <GroupCard
                  key={group.group_id}
                  group={group}
                  variant='default'
                  showStatistics={true}
                  statistics={demoStatistics[group.group_id]}
                  onJoin={handleJoin}
                  onLeave={handleLeave}
                  onView={handleView}
                  onManage={handleManage}
                />
              ))}
            </div>
          </section>

          <section>
            <h2 className='text-2xl font-semibold mb-4'>Compact Variant</h2>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              {demoGroups.map(group => (
                <GroupCard
                  key={`compact-${group.group_id}`}
                  group={group}
                  variant='compact'
                  showStatistics={true}
                  statistics={demoStatistics[group.group_id]}
                  onJoin={handleJoin}
                  onLeave={handleLeave}
                  onView={handleView}
                  onManage={handleManage}
                />
              ))}
            </div>
          </section>

          <section>
            <h2 className='text-2xl font-semibold mb-4'>Without Actions</h2>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {demoGroups.slice(0, 2).map(group => (
                <GroupCard
                  key={`no-actions-${group.group_id}`}
                  group={group}
                  variant='default'
                  showActions={false}
                  showStatistics={true}
                  statistics={demoStatistics[group.group_id]}
                />
              ))}
            </div>
          </section>

          <section>
            <h2 className='text-2xl font-semibold mb-4'>Without Statistics</h2>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {demoGroups.slice(0, 2).map(group => (
                <GroupCard
                  key={`no-stats-${group.group_id}`}
                  group={group}
                  variant='default'
                  showStatistics={false}
                  onJoin={handleJoin}
                  onLeave={handleLeave}
                  onView={handleView}
                  onManage={handleManage}
                />
              ))}
            </div>
          </section>
        </div>

        <div className='mt-12 p-6 bg-muted rounded-lg'>
          <h3 className='text-lg font-semibold mb-4'>
            Enhanced Features Demonstrated:
          </h3>
          <ul className='space-y-2 text-sm'>
            <li>
              ✅ <strong>Member count display with visual progress bars</strong>{' '}
              - Shows capacity percentage and status
            </li>
            <li>
              ✅ <strong>Enhanced status indicators</strong> - Active, pending,
              full, and inactive states with appropriate colors
            </li>
            <li>
              ✅ <strong>Quick action buttons</strong> - Join, leave, view, and
              manage with loading states
            </li>
            <li>
              ✅ <strong>Improved accessibility</strong> - ARIA labels, keyboard
              navigation, screen reader support
            </li>
            <li>
              ✅ <strong>Mobile touch optimization</strong> - 44px minimum touch
              targets, hover effects
            </li>
            <li>
              ✅ <strong>Group statistics display</strong> - Active members,
              upcoming events, growth metrics
            </li>
            <li>
              ✅ <strong>Live status announcements</strong> - Screen reader
              feedback for actions
            </li>
            <li>
              ✅ <strong>Enhanced visual feedback</strong> - Progress bars,
              color coding, animations
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
