import { Input } from '@/components/ui/input';
import { router } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SearchInputProps {
    /** The search term the server last applied. */
    value: string;
    /** URL to reload with the new search term. */
    url: string;
    /** Other query parameters to keep, such as the current scope. */
    params?: Record<string, string>;
    placeholder?: string;
}

/** Search box that reloads the page a moment after the user stops typing. */
export default function SearchInput({ value, url, params = {}, placeholder = 'Search' }: SearchInputProps) {
    const [search, setSearch] = useState(value);
    const paramsKey = JSON.stringify(params);

    useEffect(() => {
        const term = search.trim();

        if (term === value) {
            return;
        }

        const timeout = setTimeout(() => {
            router.get(url, { ...JSON.parse(paramsKey), ...(term ? { search: term } : {}) }, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        }, 300);

        return () => clearTimeout(timeout);
    }, [search, value, url, paramsKey]);

    return (
        <div className="relative w-full max-w-sm">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={placeholder}
                className="pl-9"
                aria-label={placeholder}
            />
        </div>
    );
}
