import { cn } from '@/lib/utils';
import { type FileScope } from '@/types';
import { Link } from '@inertiajs/react';

/** Lets admins switch a file list between their own files and everyone's. */
export default function ScopeSwitch({ scope, url }: { scope: FileScope; url: string }) {
    const options: { value: FileScope; label: string; href: string }[] = [
        { value: 'mine', label: 'My files', href: url },
        { value: 'all', label: 'All users', href: `${url}?scope=all` },
    ];

    return (
        <div className="bg-muted inline-flex rounded-lg p-1" role="group" aria-label="Whose files to show">
            {options.map((option) => (
                <Link
                    key={option.value}
                    href={option.href}
                    preserveScroll
                    aria-current={scope === option.value ? 'page' : undefined}
                    className={cn(
                        'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                        scope === option.value ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                    )}
                >
                    {option.label}
                </Link>
            ))}
        </div>
    );
}
