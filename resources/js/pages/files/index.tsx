import ConfirmDialog from '@/components/confirm-dialog';
import FileThumbnail from '@/components/files/file-thumbnail';
import PreviewDialog from '@/components/files/preview-dialog';
import ScopeSwitch from '@/components/files/scope-switch';
import ShareDialog from '@/components/files/share-dialog';
import FlashMessage from '@/components/flash-message';
import Heading from '@/components/heading';
import Pagination from '@/components/pagination';
import SearchInput from '@/components/search-input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { formatBytes } from '@/lib/utils';
import { type BreadcrumbItem, type FileScope, type Paginated, type SharedData, type Upload } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Download, Eye, Link2, MoreHorizontal, Pencil, Trash2, Upload as UploadIcon } from 'lucide-react';
import { useState } from 'react';

interface FilesIndexProps {
    uploads: Paginated<Upload>;
    filters: { search: string; scope: FileScope };
}

export default function FilesIndex({ uploads, filters }: FilesIndexProps) {
    const { auth } = usePage<SharedData>().props;
    const showAll = filters.scope === 'all';
    const title = showAll ? 'All files' : 'My files';

    // Keep IDs rather than objects so dialogs show fresh data after the page reloads.
    const [previewId, setPreviewId] = useState<number | null>(null);
    const [shareId, setShareId] = useState<number | null>(null);
    const [trashId, setTrashId] = useState<number | null>(null);
    const [trashing, setTrashing] = useState(false);

    const find = (id: number | null) => uploads.data.find((upload) => upload.id === id) ?? null;
    const uploadToTrash = find(trashId);

    const breadcrumbs: BreadcrumbItem[] = [{ title, href: showAll ? '/files?scope=all' : '/files' }];
    const scopeParams: Record<string, string> = showAll ? { scope: 'all' } : {};

    const moveToTrash = () => {
        if (!uploadToTrash) return;

        router.delete(route('files.destroy', uploadToTrash.id), {
            preserveScroll: true,
            onStart: () => setTrashing(true),
            onFinish: () => {
                setTrashing(false);
                setTrashId(null);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={title} />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <Heading
                        title={title}
                        description={showAll ? 'Every file uploaded by every user' : 'Upload, preview, share and manage your files'}
                    />

                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" asChild>
                            <Link href={route('files.trash', scopeParams)}>
                                <Trash2 />
                                Trash
                            </Link>
                        </Button>
                        <Button asChild>
                            <Link href={route('files.create')}>
                                <UploadIcon />
                                Upload files
                            </Link>
                        </Button>
                    </div>
                </div>

                <FlashMessage />

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <SearchInput value={filters.search} url={route('files.index')} params={scopeParams} placeholder="Search by title or file name" />
                    {auth.user.is_admin && <ScopeSwitch scope={filters.scope} url={route('files.index')} />}
                </div>

                <div className="border-sidebar-border/70 dark:border-sidebar-border rounded-xl border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>File</TableHead>
                                <TableHead className="text-right">Size</TableHead>
                                {showAll && <TableHead>Owner</TableHead>}
                                <TableHead>Uploaded</TableHead>
                                <TableHead className="text-right">
                                    <span className="sr-only">Actions</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {uploads.data.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={showAll ? 5 : 4} className="text-muted-foreground h-32 text-center">
                                        {filters.search ? (
                                            'No files match your search.'
                                        ) : (
                                            <div className="space-y-3">
                                                <p>No files yet.</p>
                                                <Button size="sm" asChild>
                                                    <Link href={route('files.create')}>Upload your first file</Link>
                                                </Button>
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            )}

                            {uploads.data.map((upload) => (
                                <TableRow key={upload.id}>
                                    <TableCell className="max-w-80">
                                        <div className="flex items-center gap-3">
                                            {upload.previewable ? (
                                                <button type="button" onClick={() => setPreviewId(upload.id)} title="Preview" className="rounded-md">
                                                    <FileThumbnail upload={upload} />
                                                </button>
                                            ) : (
                                                <FileThumbnail upload={upload} />
                                            )}
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="truncate font-medium">{upload.title}</span>
                                                    {upload.share_url && (
                                                        <Badge variant="secondary" className="shrink-0 gap-1">
                                                            <Link2 className="size-3" />
                                                            Shared
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="text-muted-foreground truncate text-xs">{upload.original_name}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right whitespace-nowrap tabular-nums">{formatBytes(upload.size)}</TableCell>
                                    {showAll && (
                                        <TableCell>{upload.user?.name ?? <span className="text-muted-foreground">Deleted user</span>}</TableCell>
                                    )}
                                    <TableCell className="whitespace-nowrap">{new Date(upload.created_at).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <div className="flex justify-end gap-1">
                                            <Button variant="ghost" size="icon" asChild>
                                                {/* A plain anchor: the response is a file, not an Inertia page. */}
                                                <a href={route('files.download', upload.id)} title="Download">
                                                    <Download />
                                                    <span className="sr-only">Download {upload.title}</span>
                                                </a>
                                            </Button>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" title="More actions">
                                                        <MoreHorizontal />
                                                        <span className="sr-only">More actions for {upload.title}</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    {upload.previewable && (
                                                        <DropdownMenuItem onSelect={() => setPreviewId(upload.id)}>
                                                            <Eye />
                                                            Preview
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem onSelect={() => setShareId(upload.id)}>
                                                        <Link2 />
                                                        {upload.share_url ? 'Manage share link' : 'Share'}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={route('files.edit', upload.id)}>
                                                            <Pencil />
                                                            Edit
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onSelect={() => setTrashId(upload.id)} className="text-destructive focus:text-destructive">
                                                        <Trash2 className="text-destructive" />
                                                        Move to trash
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                <Pagination paginator={uploads} />
            </div>

            <PreviewDialog upload={find(previewId)} onClose={() => setPreviewId(null)} />
            <ShareDialog upload={find(shareId)} onClose={() => setShareId(null)} />
            <ConfirmDialog
                open={uploadToTrash !== null}
                onOpenChange={(open) => !open && setTrashId(null)}
                title="Move to trash?"
                description={
                    <>
                        &ldquo;{uploadToTrash?.title}&rdquo; will be moved to the trash. You can restore it from there, or it will be deleted for good after
                        30 days. Its share link stops working while it&rsquo;s in the trash.
                    </>
                }
                confirmLabel="Move to trash"
                onConfirm={moveToTrash}
                processing={trashing}
            />
        </AppLayout>
    );
}
