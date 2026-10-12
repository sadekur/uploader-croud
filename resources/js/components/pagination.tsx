import { Button } from '@/components/ui/button';
import { type Paginated } from '@/types';
import { Link } from '@inertiajs/react';

/** Page links and a "Showing x to y of z" summary for a Laravel paginator. */
export default function Pagination({ paginator }: { paginator: Paginated<unknown> }) {
    if (paginator.last_page <= 1) {
        return null;
    }

    return (
        <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-muted-foreground text-sm">
                Showing {paginator.from} to {paginator.to} of {paginator.total}
            </p>

            <nav className="flex flex-wrap gap-1" aria-label="Pagination">
                {paginator.links.map((link, index) => {
                    const label = link.label.replace('&laquo;', '«').replace('&raquo;', '»');

                    return link.url ? (
                        <Button key={index} variant={link.active ? 'default' : 'outline'} size="sm" asChild>
                            <Link href={link.url} preserveScroll preserveState aria-current={link.active ? 'page' : undefined}>
                                {label}
                            </Link>
                        </Button>
                    ) : (
                        <Button key={index} variant="outline" size="sm" disabled>
                            {label}
                        </Button>
                    );
                })}
            </nav>
        </div>
    );
}
