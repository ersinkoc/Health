import { Link, Outlet, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const sidebarItems = [
  {
    title: 'Getting Started',
    items: [
      { href: '/docs', label: 'Introduction' },
      { href: '/docs/installation', label: 'Installation' },
      { href: '/docs/quick-start', label: 'Quick Start' },
    ],
  },
  {
    title: 'Core Concepts',
    items: [
      { href: '/docs/health-checks', label: 'Health Checks' },
      { href: '/docs/probes', label: 'Kubernetes Probes' },
      { href: '/docs/scoring', label: 'Health Scoring' },
    ],
  },
  {
    title: 'Advanced',
    items: [
      { href: '/docs/plugins', label: 'Plugin System' },
      { href: '/docs/cli', label: 'CLI Usage' },
      { href: '/docs/configuration', label: 'Configuration' },
    ],
  },
];

export function Docs() {
  const location = useLocation();

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex gap-10">
        {/* Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0">
          <nav className="sticky top-24 space-y-6">
            {sidebarItems.map((section) => (
              <div key={section.title}>
                <h4 className="font-semibold mb-2 text-[hsl(var(--foreground))]">
                  {section.title}
                </h4>
                <ul className="space-y-1">
                  {section.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        to={item.href}
                        className={cn(
                          'block py-1.5 px-3 rounded-md text-sm transition-colors',
                          location.pathname === item.href
                            ? 'bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] font-medium'
                            : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]'
                        )}
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
