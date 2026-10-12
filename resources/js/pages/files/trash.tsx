import ConfirmDialog from '@/components/confirm-dialog';
import FileThumbnail from '@/components/files/file-thumbnail';
import ScopeSwitch from '@/components/files/scope-switch';
import FlashMessage from '@/components/flash-message';
import Heading from '@/components/heading';
import Pagination from '@/components/pagination';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { formatBytes } from '@/lib/utils';
import { type BreadcrumbItem, type FileScope, type Paginated, type SharedData, type Upload } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { RotateCcw, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface TrashProps {
    uploads: Paginated<Upload>;
    filters: { scope: FileScope };
    trashDays: number;
}

const DAY = 24 * 60 * 60 * 1000;

function daysLeft(deletedAt: string, trashDays: number): number {
    return Math.max(0, Math.ceil((new Date(deletedAt).getTime() + trashDays * DAY - Date.now()) / DAY));
}

export default function Trash({ uploads, filters, trashDays }: TrashProps) {
    const { auth } = usePage<SharedData>().props;
    const showAll = filters.scope === 'all';
    const scopeParams: Record<string, string> = showAll ? { scope: 'all' } : {};

    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [processing, setProcessing] = useState(false);
    const uploadToDelete = uploads.data.find((upload) => upload.id === deleteId) ?? null;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: showAll ? 'All files' : 'My files', href: route('files.index', scopeParams) },
        { title: 'Trash', href: route('files.trash', scopeParams) },
    ];

    const visitOptions = {
        preserveScroll: true,
        onStart: () => setProcessing(true),
        onFinish: () => setProcessing(false),
    };

    const restore = (upload: Upload) => router.patch(route('files.restore', upload.id), {}, visitOptions);

    const deleteForever = () => {
        if (!uploadToDelete) return;

        router.delete(route('files.force-delete', uploadToDelete.id), {
            ...visitOptions,
            onFinish: () => {
                setProcessing(false);
                setDeleteId(null);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Trash" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <Heading title="Trash" description={`Files here are deleted for good ${trashDays} days after they were trashed.`} />
                    {auth.user.is_admin && <ScopeSwitch scope={filters.scope} url={route('files.trash')} />}
                </div>

                <FlashMessage />

                <div className="border-sidebar-border/70 dark:border-sidebar-border rounded-xl border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>File</TableHead>
                                <TableHead className="text-right">Size</TableHead>
                                {showAll && <TableHead>Owner</TableHead>}
                                <TableHead>Deleted</TableHead>
                                <TableHead className="text-right">
                                    <span className="sr-only">Actions</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {uploads.data.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={showAll ? 5 : 4} className="text-muted-foreground h-32 text-center">
                                        The trash is empty.
                                    </TableCell>
                                </TableRow>
                            )}

                            {uploads.data.map((upload) => {
                                const remaining = daysLeft(upload.deleted_at!, trashDays);

                                return (
                                    <TableRow key={upload.id}>
                                        <TableCell className="max-w-80">
                                            <div className="flex items-center gap-3">
                                                <FileThumbnail upload={upload} showImage={false} />
                                                <div className="min-w-0">
                                                    <div className="truncate font-medium">{upload.title}</div>
                                                    <div className="text-muted-foreground truncate text-xs">{upload.original_name}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right whitespace-nowrap tabular-nums">{formatBytes(upload.size)}</TableCell>
                                        {showAll && (
                                            <TableCell>{upload.user?.name ?? <span className="text-muted-foreground">Deleted user</span>}</TableCell>
                                        )}
                                        <TableCell className="whitespace-nowrap">
                                            <div>{new Date(upload.deleted_at!).toLocaleDateString()}</div>
                                            <div className="text-muted-foreground text-xs">
                                                {remaining > 0 ? `Gone for good in ${remaining} day${remaining === 1 ? '' : 's'}` : 'Deleted at next cleanup'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex justify-end gap-2">
                                                <Button variant="outline" size="sm" onClick={() => restore(upload)} disabled={processing}>
                                                    <RotateCcw />
                                                    Restore
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() => setDeleteId(upload.id)}
                                                    disabled={processing}
                                                >
                                                    <Trash2 />
                                                    Delete forever
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>

                <Pagination paginator={uploads} />
            </div>

            <ConfirmDialog
                open={uploadToDelete !== null}
                onOpenChange={(open) => !open && setDeleteId(null)}
                title="Delete forever?"
                description={<>&ldquo;{uploadToDelete?.title}&rdquo; and its file will be permanently deleted. This cannot be undone.</>}
                confirmLabel="Delete forever"
                onConfirm={deleteForever}
                processing={processing}
            />
        </AppLayout>
    );
}
