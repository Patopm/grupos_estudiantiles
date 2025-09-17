import FeatureCard from './FeatureCard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers,
  faCalendarAlt,
  faHandshake,
  faGraduationCap,
  faTrophy,
  faNetworkWired,
} from '@fortawesome/free-solid-svg-icons';

export default function FeaturesSection() {
  return (
    <section className='px-6 py-16 bg-muted/30'>
      <div className='max-w-7xl mx-auto'>
        <div className='text-center mb-12'>
          <h2 className='text-3xl md:text-4xl font-bold mb-4'>
            ¿Por Qué Unirte a Grupos Estudiantiles?
          </h2>
          <p className='text-xl text-muted-foreground max-w-3xl mx-auto'>
            Descubre todas las oportunidades que te esperan al formar parte de
            nuestra comunidad estudiantil activa y diversa.
          </p>
        </div>
        <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-8'>
          <FeatureCard
            icon={
              <FontAwesomeIcon
                icon={faUsers}
                className='w-8 h-8 text-primary'
              />
            }
            title='Comunidad Diversa'
            description='Conecta con estudiantes de diferentes carreras y semestres que comparten tus intereses.'
          />
          <FeatureCard
            icon={
              <FontAwesomeIcon
                icon={faCalendarAlt}
                className='w-8 h-8 text-primary'
              />
            }
            title='Eventos Increíbles'
            description='Participa en workshops, conferencias, competencias y actividades sociales únicas.'
          />
          <FeatureCard
            icon={
              <FontAwesomeIcon
                icon={faGraduationCap}
                className='w-8 h-8 text-primary'
              />
            }
            title='Desarrollo de Habilidades'
            description='Desarrolla competencias técnicas, de liderazgo y trabajo en equipo.'
          />
          <FeatureCard
            icon={
              <FontAwesomeIcon
                icon={faHandshake}
                className='w-8 h-8 text-primary'
              />
            }
            title='Gestión Sencilla'
            description='Solicita ingreso, gestiona tu participación y mantente al día fácilmente.'
          />
          <FeatureCard
            icon={
              <FontAwesomeIcon
                icon={faNetworkWired}
                className='w-8 h-8 text-primary'
              />
            }
            title='Red de Contactos'
            description='Construye relaciones profesionales y personales que durarán toda la vida.'
          />
          <FeatureCard
            icon={
              <FontAwesomeIcon
                icon={faTrophy}
                className='w-8 h-8 text-primary'
              />
            }
            title='Reconocimientos'
            description='Obtén certificados y reconocimientos por tu participación activa.'
          />
        </div>
      </div>
    </section>
  );
}
