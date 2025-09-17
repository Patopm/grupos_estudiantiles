import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HeroSection() {
  return (
    <main className='px-6 py-16'>
      <div className='max-w-7xl mx-auto text-center'>
        <h1 className='text-5xl md:text-6xl font-bold mb-6'>
          Únete a Grupos Estudiantiles
          <span className='block text-primary'>en Tecmilenio</span>
        </h1>
        <p className='text-xl text-muted-foreground mb-8 max-w-3xl mx-auto'>
          Descubre grupos estudiantiles, participa en eventos increíbles y
          conecta con estudiantes que comparten tus intereses. Tu experiencia
          universitaria comienza aquí.
        </p>
        <div className='flex flex-col sm:flex-row gap-4 justify-center'>
          <Button size='lg' asChild>
            <Link href='/register'>Explorar Grupos</Link>
          </Button>
          <Button variant='outline' size='lg' asChild>
            <Link href='/login'>Iniciar Sesión</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
