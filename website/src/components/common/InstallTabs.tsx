import { useState } from 'react';
import { CopyButton } from './CopyButton';
import { cn } from '@/lib/utils';
import { PACKAGE_NAME } from '@/lib/constants';

type PackageManager = 'npm' | 'yarn' | 'pnpm' | 'bun';

const commands: Record<PackageManager, string> = {
  npm: `npm install ${PACKAGE_NAME}`,
  yarn: `yarn add ${PACKAGE_NAME}`,
  pnpm: `pnpm add ${PACKAGE_NAME}`,
  bun: `bun add ${PACKAGE_NAME}`,
};

export function InstallTabs() {
  const [selected, setSelected] = useState<PackageManager>('npm');

  return (
    <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.5)]">
        {(Object.keys(commands) as PackageManager[]).map((pm) => (
          <button
            key={pm}
            onClick={() => setSelected(pm)}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors',
              selected === pm
                ? 'bg-[hsl(var(--background))] text-[hsl(var(--foreground))] border-b-2 border-[hsl(var(--primary))]'
                : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
            )}
          >
            {pm}
          </button>
        ))}
      </div>

      {/* Command */}
      <div className="flex items-center justify-between p-4">
        <code className="text-sm font-mono text-[hsl(var(--foreground))]">
          {commands[selected]}
        </code>
        <CopyButton text={commands[selected]} />
      </div>
    </div>
  );
}
