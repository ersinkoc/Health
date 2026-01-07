import { Copy, Check } from 'lucide-react';
import { useClipboard } from '@/hooks/useClipboard';
import { cn } from '@/lib/utils';

interface CopyButtonProps {
  text: string;
  className?: string;
}

export function CopyButton({ text, className }: CopyButtonProps) {
  const { copied, copy } = useClipboard();

  return (
    <button
      onClick={() => copy(text)}
      className={cn(
        'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs',
        'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]',
        'hover:bg-[hsl(var(--accent))] transition-colors',
        className
      )}
      aria-label="Copy code"
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-green-500" />
          <span className="text-green-500">Copied!</span>
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5" />
          <span>Copy</span>
        </>
      )}
    </button>
  );
}
