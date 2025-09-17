import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers,
  faCalendarAlt,
  faUserGraduate,
  faTrophy,
} from '@fortawesome/free-solid-svg-icons';

interface StatItemProps {
  icon: React.ReactNode;
  number: string;
  label: string;
  description: string;
}

function StatItem({ icon, number, label, description }: StatItemProps) {
  return (
    <div className='text-center'>
      <div className='w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4'>
        {icon}
      </div>
      <div className='text-4xl font-bold text-primary mb-2'>{number}</div>
      <div className='text-lg font-semibold text-foreground mb-1'>{label}</div>
      <div className='text-sm text-muted-foreground'>{description}</div>
    </div>
  );
}

export default function StatsSection() {
  return (
    <section className='px-6 py-16 bg-primary/5'>
      <div className='max-w-7xl mx-auto'>
        <div className='text-center mb-12'>
          <h2 className='text-3xl md:text-4xl font-bold mb-4'>
            Nuestra Comunidad en Números
          </h2>
          <p className='text-xl text-muted-foreground max-w-3xl mx-auto'>
            Una comunidad vibrante de estudiantes comprometidos con el
            crecimiento personal y académico a través de la participación
            activa.
          </p>
        </div>

        <div className='grid grid-cols-2 md:grid-cols-4 gap-8'>
          <StatItem
            icon={
              <FontAwesomeIcon
                icon={faUsers}
                className='w-8 h-8 text-primary'
              />
            }
            number='45+'
            label='Grupos Activos'
            description='Diversas categorías y enfoques'
          />
          <StatItem
            icon={
              <FontAwesomeIcon
                icon={faUserGraduate}
                className='w-8 h-8 text-primary'
              />
            }
            number='1,200+'
            label='Estudiantes Activos'
            description='Participando regularmente'
          />
          <StatItem
            icon={
              <FontAwesomeIcon
                icon={faCalendarAlt}
                className='w-8 h-8 text-primary'
              />
            }
            number='150+'
            label='Eventos Realizados'
            description='En este semestre'
          />
          <StatItem
            icon={
              <FontAwesomeIcon
                icon={faTrophy}
                className='w-8 h-8 text-primary'
              />
            }
            number='25+'
            label='Logros Obtenidos'
            description='Reconocimientos y premios'
          />
        </div>
      </div>
    </section>
  );
}
