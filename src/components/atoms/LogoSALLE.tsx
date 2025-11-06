import Image from 'next/image';
import { cn } from '@/lib/utils';
import { PlaceHolderImages } from '@/lib/placeholder-images';

type LogoSALLEProps = {
  className?: string;
};

const LogoSALLE = ({ className }: LogoSALLEProps) => {
  const logo = PlaceHolderImages.find(p => p.id === 'logo-salle');
  
  if (!logo) return <div className={cn('h-10 w-auto', className)} />;

  return (
    <div className={cn('relative h-10 w-32', className)}>
      <Image
        src={logo.imageUrl}
        alt="La Salle Logo"
        fill
        data-ai-hint={logo.imageHint}
        className="object-contain"
        style={{ fill: '#e10022' }}
      />
    </div>
  );
};

export default LogoSALLE;
