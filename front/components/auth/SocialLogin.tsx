import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle, faGithub } from '@fortawesome/free-brands-svg-icons';

export default function SocialLogin() {
  return (
    <div className='space-y-6'>
      <div className='relative'>
        <div className='absolute inset-0 flex items-center'>
          <div className='w-full border-t' />
        </div>
        <div className='relative flex justify-center text-sm'>
          <span className='px-2 bg-background text-muted-foreground'>
            Or continue with
          </span>
        </div>
      </div>

      <div className='grid grid-cols-2 gap-3'>
        <Button variant='outline' type='button' className='w-full'>
          <FontAwesomeIcon icon={faGoogle} className='mr-2 h-4 w-4' />
          Google
        </Button>

        <Button variant='outline' type='button' className='w-full'>
          <FontAwesomeIcon icon={faGithub} className='mr-2 h-4 w-4' />
          GitHub
        </Button>
      </div>
    </div>
  );
}
