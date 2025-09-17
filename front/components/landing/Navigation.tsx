import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Navigation() {
  return (
    <nav className='px-6 py-4 sticky top-0 z-50 bg-background'>
      <div className='max-w-7xl mx-auto flex justify-between items-center'>
        <div className='text-2xl font-bold text-primary'>
          Grupos Estudiantiles
        </div>
        <div className='flex gap-4'>
          <Button variant='ghost' asChild>
            <Link href='/login'>Iniciar Sesión</Link>
          </Button>
          <Button asChild>
            <Link href='/register'>Registrarse</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}
