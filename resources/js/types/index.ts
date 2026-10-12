import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    url: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    flash: { success: string | null };
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    is_admin: boolean;
    created_at: string;
    updated_at: string;
    [key: string]: unknown; // This allows for additional properties...
}

export interface Upload {
    id: number;
    user_id: number | null;
    user: Pick<User, 'id' | 'name'> | null;
    title: string;
    description: string | null;
    original_name: string;
    mime_type: string | null;
    size: number;
    /** True for images and PDFs, which can be shown inline. */
    previewable: boolean;
    /** Public link, or null when the file isn't shared or the link expired. */
    share_url: string | null;
    share_expires_at: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}

/** A user as listed in the admin panel, with their upload totals. */
export interface ManagedUser extends User {
    uploads_count: number;
    uploads_sum_size: number | null;
}

/** Scope filter on file lists: the user's own files, or everyone's (admins only). */
export type FileScope = 'mine' | 'all';

export interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

/** Shape of a Laravel LengthAwarePaginator serialized to JSON. */
export interface Paginated<T> {
    data: T[];
    links: PaginationLink[];
    current_page: number;
    last_page: number;
    per_page: number;
    from: number | null;
    to: number | null;
    total: number;
}
