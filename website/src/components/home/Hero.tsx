import { Link } from 'react-router-dom';
import { ArrowRight, Github, Zap } from 'lucide-react';
import { InstallTabs } from '@/components/common/InstallTabs';
import { PACKAGE_NAME, GITHUB_REPO, DESCRIPTION } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function Hero() {
  return (
    <section className="relative py-20 md:py-32 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(var(--primary)/0.1)] via-transparent to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[hsl(var(--primary)/0.15)] rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--muted))] text-sm mb-6">
            <Zap className="w-4 h-4 text-[hsl(var(--primary))]" />
            <span className="text-[hsl(var(--muted-foreground))]">Zero Dependencies</span>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            <span className="text-[hsl(var(--primary))]">{PACKAGE_NAME}</span>
            <br />
            <span className="text-[hsl(var(--foreground))]">Health Check Server</span>
          </h1>

          {/* Description */}
          <p className="text-lg md:text-xl text-[hsl(var(--muted-foreground))] mb-8 text-balance">
            {DESCRIPTION}
          </p>

          {/* Install command */}
          <div className="max-w-md mx-auto mb-8">
            <InstallTabs />
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/docs"
              className={cn(
                'inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium',
                'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]',
                'hover:bg-[hsl(var(--primary)/0.9)] transition-colors'
              )}
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href={`https://github.com/${GITHUB_REPO}`}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium',
                'border border-[hsl(var(--border))] bg-[hsl(var(--background))]',
                'hover:bg-[hsl(var(--accent))] transition-colors'
              )}
            >
              <Github className="w-4 h-4" />
              View on GitHub
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
