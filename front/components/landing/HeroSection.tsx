import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HeroSection() {
  return (
    <main className='px-6 py-16'>
      <div className='max-w-7xl mx-auto text-center'>
        <h1 className='text-5xl md:text-6xl font-bold mb-6'>
          Manage Your Events
          <span className='block text-primary'>Effortlessly</span>
        </h1>
        <p className='text-xl text-muted-foreground mb-8 max-w-3xl mx-auto'>
          Create, organize, and manage events with ease. Connect with students,
          track attendance, and make every event memorable.
        </p>
        <div className='flex flex-col sm:flex-row gap-4 justify-center'>
          <Button size='lg' asChild>
            <Link href='/register'>Start Creating Events</Link>
          </Button>
          <Button variant='outline' size='lg' asChild>
            <Link href='/login'>Sign In</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
