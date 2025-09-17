import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Navigation() {
  return (
    <nav className='px-6 py-4'>
      <div className='max-w-7xl mx-auto flex justify-between items-center'>
        <div className='text-2xl font-bold text-primary'>EventHub</div>
        <div className='flex gap-4'>
          <Button variant='ghost' asChild>
            <Link href='/login'>Login</Link>
          </Button>
          <Button asChild>
            <Link href='/register'>Get Started</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}
