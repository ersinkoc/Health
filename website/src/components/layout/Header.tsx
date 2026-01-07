import { Github, Star, Package, Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { PACKAGE_NAME, GITHUB_REPO, NPM_PACKAGE } from '@/lib/constants';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/docs', label: 'Docs' },
  { href: '/api', label: 'API' },
  { href: '/examples', label: 'Examples' },
  { href: '/plugins', label: 'Plugins' },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[hsl(var(--border)/0.4)] bg-[hsl(var(--background)/0.95)] backdrop-blur supports-[backdrop-filter]:bg-[hsl(var(--background)/0.6)]">
      <div className="container mx-auto flex h-14 max-w-screen-2xl items-center px-4">
        {/* Logo */}
        <Link to="/" className="mr-6 flex items-center space-x-2">
          <Package className="h-6 w-6 text-[hsl(var(--primary))]" />
          <span className="font-bold">{PACKAGE_NAME}</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-sm">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'transition-colors',
                location.pathname.startsWith(item.href)
                  ? 'text-[hsl(var(--foreground))] font-medium'
                  : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex flex-1 items-center justify-end gap-2">
          {/* GitHub Star Button */}
          <a
            href={`https://github.com/${GITHUB_REPO}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))] transition-colors"
          >
            <Star className="h-4 w-4" />
            <span className="text-sm font-medium">Star</span>
          </a>

          {/* npm link */}
          <a
            href={`https://www.npmjs.com/package/${NPM_PACKAGE}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center justify-center rounded-md p-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
          >
            <Package className="h-5 w-5" />
          </a>

          {/* GitHub link */}
          <a
            href={`https://github.com/${GITHUB_REPO}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-md p-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
          >
            <Github className="h-5 w-5" />
          </a>

          {/* Theme toggle */}
          <ThemeToggle />

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <nav className="md:hidden border-t border-[hsl(var(--border))] bg-[hsl(var(--background))]">
          <div className="container mx-auto px-4 py-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'block py-2 px-3 rounded-md transition-colors',
                  location.pathname.startsWith(item.href)
                    ? 'bg-[hsl(var(--accent))] text-[hsl(var(--foreground))] font-medium'
                    : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))]'
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
