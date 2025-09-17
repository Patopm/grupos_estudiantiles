'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers,
  faCalendarAlt,
  faArrowRight,
} from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';

interface Group {
  id: string;
  name: string;
  description: string;
  category: string;
  memberCount: number;
  image?: string;
  upcomingEvents: number;
}

// TODO: Replace with actual groups from the database
const mockGroups: Group[] = [
  {
    id: '1',
    name: 'Club de Robótica',
    description:
      'Diseña y construye robots innovadores. Participa en competencias nacionales.',
    category: 'Tecnología',
    memberCount: 45,
    upcomingEvents: 3,
    image: '/api/placeholder/300/200',
  },
  {
    id: '2',
    name: 'Grupo de Emprendimiento',
    description:
      'Desarrolla tu idea de negocio con mentores expertos y otros emprendedores.',
    category: 'Negocios',
    memberCount: 67,
    upcomingEvents: 2,
    image: '/api/placeholder/300/200',
  },
  {
    id: '3',
    name: 'Club de Debate',
    description:
      'Mejora tus habilidades de oratoria y participa en debates universitarios.',
    category: 'Académico',
    memberCount: 32,
    upcomingEvents: 4,
    image: '/api/placeholder/300/200',
  },
  {
    id: '4',
    name: 'Grupo de Voluntariado',
    description:
      'Contribuye a tu comunidad a través de proyectos de impacto social.',
    category: 'Social',
    memberCount: 89,
    upcomingEvents: 5,
    image: '/api/placeholder/300/200',
  },
  {
    id: '5',
    name: 'Club de Fotografía',
    description:
      'Captura momentos únicos y aprende técnicas avanzadas de fotografía.',
    category: 'Arte',
    memberCount: 28,
    upcomingEvents: 1,
    image: '/api/placeholder/300/200',
  },
  {
    id: '6',
    name: 'Grupo de Sustentabilidad',
    description:
      'Promueve prácticas ecológicas y proyectos de desarrollo sostenible.',
    category: 'Ambiental',
    memberCount: 54,
    upcomingEvents: 3,
    image: '/api/placeholder/300/200',
  },
];

function GroupCard({ group }: { group: Group }) {
  return (
    <Card className='overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:scale-105 border-none shadow-md'>
      <div className='h-48 bg-gradient-to-br from-primary/10 to-primary/20 relative overflow-hidden'>
        <div className='absolute inset-0 bg-gradient-to-t from-black/20 to-transparent' />
        <div className='absolute top-4 left-4'>
          <span className='bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium'>
            {group.category}
          </span>
        </div>
      </div>
      <CardContent className='p-6'>
        <h3 className='text-xl font-bold mb-2 text-foreground'>{group.name}</h3>
        <p className='text-muted-foreground mb-4 line-clamp-2'>
          {group.description}
        </p>

        <div className='flex items-center justify-between mb-4 text-sm text-muted-foreground'>
          <div className='flex items-center gap-1'>
            <FontAwesomeIcon icon={faUsers} className='w-4 h-4' />
            <span>{group.memberCount} miembros</span>
          </div>
          <div className='flex items-center gap-1'>
            <FontAwesomeIcon icon={faCalendarAlt} className='w-4 h-4' />
            <span>{group.upcomingEvents} eventos</span>
          </div>
        </div>

        <Button asChild className='w-full group'>
          <Link href={`/groups/${group.id}`}>
            Ver Detalles
            <FontAwesomeIcon
              icon={faArrowRight}
              className='w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform'
            />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default function GroupsCarousel() {
  return (
    <section className='px-6 py-16 bg-background'>
      <div className='max-w-7xl mx-auto'>
        <div className='text-center mb-12'>
          <h2 className='text-3xl md:text-4xl font-bold mb-4'>
            Grupos Estudiantiles Activos
          </h2>
          <p className='text-xl text-muted-foreground max-w-3xl mx-auto'>
            Descubre una amplia variedad de grupos estudiantiles donde podrás
            desarrollar tus habilidades, hacer nuevos amigos y vivir
            experiencias únicas.
          </p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12'>
          {mockGroups.map(group => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>

        <div className='text-center'>
          <Button size='lg' variant='outline' asChild>
            <Link href='/groups'>
              Ver Todos los Grupos
              <FontAwesomeIcon icon={faArrowRight} className='w-4 h-4 ml-2' />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
