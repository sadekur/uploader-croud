import FlashMessage from '@/components/flash-message';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { cn, formatBytes } from '@/lib/utils';
import { type BreadcrumbItem, type Paginated, type Upload } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Download, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Uploads',
        href: '/admin/uploads',
    },
];

interface UploadsIndexProps {
    uploads: Paginated<Upload>;
    filters: { search: string };
}

export default function UploadsIndex({ uploads, filters }: UploadsIndexProps) {
    const [search, setSearch] = useState(filters.search);
    const [uploadToDelete, setUploadToDelete] = useState<Upload | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Re-query the server a moment after the user stops typing.
    useEffect(() => {
        const term = search.trim();

        if (term === filters.search) {
            return;
        }

        const timeout = setTimeout(() => {
            router.get(route('admin.uploads.index'), term ? { search: term } : {}, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        }, 300);

        return () => clearTimeout(timeout);
    }, [search, filters.search]);

    const deleteUpload = () => {
        if (!uploadToDelete) {
            return;
        }

        router.delete(route('admin.uploads.destroy', uploadToDelete.id), {
            preserveScroll: true,
            onStart: () => setDeleting(true),
            onFinish: () => {
                setDeleting(false);
                setUploadToDelete(null);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Uploads" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <Heading title="Uploads" description="Manage every file uploaded to the application" />

                    <Button asChild>
                        <Link href={route('admin.uploads.create')}>
                            <Plus />
                            New upload
                        </Link>
                    </Button>
                </div>

                <FlashMessage />

                <div className="relative max-w-sm">
                    <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                    <Input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by title or file name"
                        className="pl-9"
                        aria-label="Search uploads"
                    />
                </div>

                <div className="border-sidebar-border/70 dark:border-sidebar-border rounded-xl border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>File</TableHead>
                                <TableHead className="text-right">Size</TableHead>
                                <TableHead>Uploaded by</TableHead>
                                <TableHead>Uploaded</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {uploads.data.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-muted-foreground h-24 text-center">
                                        {filters.search ? 'No uploads match your search.' : 'No uploads yet.'}
                                    </TableCell>
                                </TableRow>
                            )}

                            {uploads.data.map((upload) => (
                                <TableRow key={upload.id}>
                                    <TableCell className="max-w-64">
                                        <div className="truncate font-medium">{upload.title}</div>
                                        {upload.description && (
                                            <div className="text-muted-foreground truncate text-xs">{upload.description}</div>
                                        )}
                                    </TableCell>
                                    <TableCell className="max-w-48">
                                        <div className="truncate">{upload.original_name}</div>
                                        <div className="text-muted-foreground text-xs">{upload.mime_type ?? 'Unknown type'}</div>
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums">{formatBytes(upload.size)}</TableCell>
                                    <TableCell>{upload.user?.name ?? <span className="text-muted-foreground">Deleted user</span>}</TableCell>
                                    <TableCell className="whitespace-nowrap">{new Date(upload.created_at).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <div className="flex justify-end gap-1">
                                            <Button variant="ghost" size="icon" asChild>
                                                {/* A plain anchor: the response is a file, not an Inertia page. */}
                                                <a href={route('admin.uploads.download', upload.id)} title="Download">
                                                    <Download />
                                                    <span className="sr-only">Download {upload.title}</span>
                                                </a>
                                            </Button>
                                            <Button variant="ghost" size="icon" asChild>
                                                <Link href={route('admin.uploads.edit', upload.id)} title="Edit">
                                                    <Pencil />
                                                    <span className="sr-only">Edit {upload.title}</span>
                                                </Link>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:text-destructive"
                                                onClick={() => setUploadToDelete(upload)}
                                                title="Delete"
                                            >
                                                <Trash2 />
                                                <span className="sr-only">Delete {upload.title}</span>
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {uploads.last_page > 1 && (
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <p className="text-muted-foreground text-sm">
                            Showing {uploads.from} to {uploads.to} of {uploads.total}
                        </p>

                        <nav className="flex flex-wrap gap-1" aria-label="Pagination">
                            {uploads.links.map((link, index) => {
                                const label = link.label.replace('&laquo;', '«').replace('&raquo;', '»');

                                return link.url ? (
                                    <Button key={index} variant={link.active ? 'default' : 'outline'} size="sm" asChild>
                                        <Link href={link.url} preserveScroll preserveState>
                                            {label}
                                        </Link>
                                    </Button>
                                ) : (
                                    <Button key={index} variant="outline" size="sm" disabled className={cn(link.active && 'font-semibold')}>
                                        {label}
                                    </Button>
                                );
                            })}
                        </nav>
                    </div>
                )}
            </div>

            <Dialog open={uploadToDelete !== null} onOpenChange={(open) => !open && setUploadToDelete(null)}>
                <DialogContent>
                    <DialogTitle>Delete this upload?</DialogTitle>
                    <DialogDescription>
                        &ldquo;{uploadToDelete?.title}&rdquo; and its file ({uploadToDelete?.original_name}) will be permanently deleted. This cannot be
                        undone.
                    </DialogDescription>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="secondary">Cancel</Button>
                        </DialogClose>
                        <Button variant="destructive" disabled={deleting} onClick={deleteUpload}>
                            Delete upload
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
