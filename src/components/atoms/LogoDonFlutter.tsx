"use client";
import Image from 'next/image';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { PlaceHolderImages } from '@/lib/placeholder-images';

type LogoDonFlutterProps = {
  className?: string;
};

const LogoDonFlutter = ({ className }: LogoDonFlutterProps) => {
  const logo = PlaceHolderImages.find(p => p.id === 'logo-don-flutter');

  if (!logo) return <div className={cn('h-10 w-10', className)} />;

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 20, ease: 'linear' }}
      className={cn('relative h-10 w-10', className)}
    >
      <Image 
        src={logo.imageUrl} 
        alt="Don Flutter Logo" 
        fill
        data-ai-hint={logo.imageHint}
        className="object-contain"
      />
    </motion.div>
  );
};

export default LogoDonFlutter;
