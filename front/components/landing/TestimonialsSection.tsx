import { Card, CardContent } from '@/components/ui/card';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQuoteLeft, faStar } from '@fortawesome/free-solid-svg-icons';

interface Testimonial {
  id: string;
  name: string;
  program: string;
  group: string;
  content: string;
  rating: number;
  avatar?: string;
}

// TODO: Replace with actual testimonials from the database
const testimonials: Testimonial[] = [
  {
    id: '1',
    name: 'María González',
    program: 'Ingeniería en Sistemas',
    group: 'Club de Robótica',
    content:
      'Participar en el Club de Robótica ha sido una experiencia transformadora. He desarrollado habilidades técnicas increíbles y he hecho amigos para toda la vida.',
    rating: 5,
  },
  {
    id: '2',
    name: 'Carlos Rodríguez',
    program: 'Administración de Empresas',
    group: 'Grupo de Emprendimiento',
    content:
      'El Grupo de Emprendimiento me ayudó a convertir mi idea en un proyecto real. Los mentores y el apoyo de mis compañeros fueron fundamentales.',
    rating: 5,
  },
  {
    id: '3',
    name: 'Ana Martínez',
    program: 'Comunicación',
    group: 'Club de Debate',
    content:
      'Mis habilidades de comunicación mejoraron enormemente. Ahora me siento más segura presentando proyectos y participando en discusiones académicas.',
    rating: 5,
  },
  {
    id: '4',
    name: 'Diego López',
    program: 'Psicología',
    group: 'Grupo de Voluntariado',
    content:
      'El voluntariado me ha dado perspectiva sobre el impacto social. Es increíble cómo podemos generar cambios positivos trabajando en equipo.',
    rating: 5,
  },
];

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <Card className='h-full border-none shadow-md hover:shadow-lg transition-shadow'>
      <CardContent className='p-6'>
        <div className='flex items-start gap-4 mb-4'>
          <div className='w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0'>
            <FontAwesomeIcon
              icon={faQuoteLeft}
              className='w-5 h-5 text-primary'
            />
          </div>
          <div className='flex-1'>
            <div className='flex items-center gap-1 mb-2'>
              {[...Array(testimonial.rating)].map((_, i) => (
                <FontAwesomeIcon
                  key={i}
                  icon={faStar}
                  className='w-4 h-4 text-yellow-400'
                />
              ))}
            </div>
          </div>
        </div>

        <p className='text-muted-foreground mb-6 leading-relaxed'>
          &quot;{testimonial.content}&quot;
        </p>

        <div className='border-t pt-4'>
          <div className='font-semibold text-foreground'>
            {testimonial.name}
          </div>
          <div className='text-sm text-muted-foreground'>
            {testimonial.program}
          </div>
          <div className='text-sm text-primary font-medium'>
            {testimonial.group}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TestimonialsSection() {
  return (
    <section className='px-6 py-16 bg-background'>
      <div className='max-w-7xl mx-auto'>
        <div className='text-center mb-12'>
          <h2 className='text-3xl md:text-4xl font-bold mb-4'>
            Lo que Dicen Nuestros Estudiantes
          </h2>
          <p className='text-xl text-muted-foreground max-w-3xl mx-auto'>
            Conoce las experiencias reales de estudiantes que han transformado
            su vida universitaria a través de los grupos estudiantiles.
          </p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
          {testimonials.map(testimonial => (
            <TestimonialCard key={testimonial.id} testimonial={testimonial} />
          ))}
        </div>
      </div>
    </section>
  );
}
