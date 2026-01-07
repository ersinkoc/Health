import { Hero } from '@/components/home/Hero';
import { Features } from '@/components/home/Features';
import { QuickStart } from '@/components/home/QuickStart';
import { Endpoints } from '@/components/home/Endpoints';

export function Home() {
  return (
    <>
      <Hero />
      <Features />
      <QuickStart />
      <Endpoints />
    </>
  );
}
