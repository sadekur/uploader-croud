import ConfirmDialog from '@/components/confirm-dialog';
import FlashMessage from '@/components/flash-message';
import Heading from '@/components/heading';
import Pagination from '@/components/pagination';
import SearchInput from '@/components/search-input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { formatBytes } from '@/lib/utils';
import { type BreadcrumbItem, type ManagedUser, type Paginated, type SharedData } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Users', href: '/admin/users' }];

interface UsersIndexProps {
    users: Paginated<ManagedUser>;
    filters: { search: string };
}

export default function UsersIndex({ users, filters }: UsersIndexProps) {
    const { auth, errors } = usePage<SharedData & { errors: Record<string, string> }>().props;
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);
    const userToDelete = users.data.find((user) => user.id === deleteId) ?? null;

    const deleteUser = () => {
        if (!userToDelete) return;

        router.delete(route('admin.users.destroy', userToDelete.id), {
            preserveScroll: true,
            onStart: () => setDeleting(true),
            onFinish: () => {
                setDeleting(false);
                setDeleteId(null);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Users" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <Heading title="Users" description="Manage accounts and who can access the admin panel" />

                <FlashMessage />
                {errors.user && (
                    <Alert variant="destructive">
                        <AlertDescription>{errors.user}</AlertDescription>
                    </Alert>
                )}

                <SearchInput value={filters.search} url={route('admin.users.index')} placeholder="Search by name or email" />

                <div className="border-sidebar-border/70 dark:border-sidebar-border rounded-xl border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead className="text-right">Files</TableHead>
                                <TableHead className="text-right">Storage</TableHead>
                                <TableHead>Joined</TableHead>
                                <TableHead className="text-right">
                                    <span className="sr-only">Actions</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.data.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-muted-foreground h-24 text-center">
                                        No users match your search.
                                    </TableCell>
                                </TableRow>
                            )}

                            {users.data.map((user) => {
                                const isSelf = user.id === auth.user.id;

                                return (
                                    <TableRow key={user.id}>
                                        <TableCell className="max-w-72">
                                            <div className="truncate font-medium">
                                                {user.name}
                                                {isSelf && <span className="text-muted-foreground font-normal"> (you)</span>}
                                            </div>
                                            <div className="text-muted-foreground truncate text-xs">
                                                {user.email}
                                                {!user.email_verified_at && ' · unverified'}
                                            </div>
                                        </TableCell>
                                        <TableCell>{user.is_admin ? <Badge>Admin</Badge> : <Badge variant="secondary">User</Badge>}</TableCell>
                                        <TableCell className="text-right tabular-nums">{user.uploads_count}</TableCell>
                                        <TableCell className="text-right whitespace-nowrap tabular-nums">
                                            {formatBytes(user.uploads_sum_size ?? 0)}
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap">{new Date(user.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="icon" asChild>
                                                    <Link href={route('admin.users.edit', user.id)} title="Edit">
                                                        <Pencil />
                                                        <span className="sr-only">Edit {user.name}</span>
                                                    </Link>
                                                </Button>
                                                {!isSelf && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive hover:text-destructive"
                                                        onClick={() => setDeleteId(user.id)}
                                                        title="Delete"
                                                    >
                                                        <Trash2 />
                                                        <span className="sr-only">Delete {user.name}</span>
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>

                <Pagination paginator={users} />
            </div>

            <ConfirmDialog
                open={userToDelete !== null}
                onOpenChange={(open) => !open && setDeleteId(null)}
                title={`Delete ${userToDelete?.name}?`}
                description={
                    <>
                        Their account will be permanently deleted and they will no longer be able to log in. Their {userToDelete?.uploads_count ?? 0}{' '}
                        file(s) are kept and will show as uploaded by a deleted user.
                    </>
                }
                confirmLabel="Delete user"
                onConfirm={deleteUser}
                processing={deleting}
            />
        </AppLayout>
    );
}
