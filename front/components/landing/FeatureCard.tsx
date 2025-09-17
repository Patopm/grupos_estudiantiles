import { Card, CardContent } from '@/components/ui/card';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export default function FeatureCard({
  icon,
  title,
  description,
}: FeatureCardProps) {
  return (
    <Card className='text-center p-6 border-none shadow-md hover:shadow-lg transition-shadow'>
      <CardContent className='pt-6'>
        <div className='w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4'>
          {icon}
        </div>
        <h3 className='text-xl font-semibold mb-2'>{title}</h3>
        <p className='text-muted-foreground'>{description}</p>
      </CardContent>
    </Card>
  );
}
