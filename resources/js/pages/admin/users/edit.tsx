import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { formatBytes } from '@/lib/utils';
import { type BreadcrumbItem, type ManagedUser, type SharedData } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function EditUser({ user }: { user: ManagedUser }) {
    const { auth } = usePage<SharedData>().props;
    const isSelf = user.id === auth.user.id;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Users', href: '/admin/users' },
        { title: user.name, href: `/admin/users/${user.id}/edit` },
    ];

    const { data, setData, put, errors, processing } = useForm({
        name: user.name,
        email: user.email,
        is_admin: user.is_admin,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        put(route('admin.users.update', user.id));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${user.name}`} />

            <div className="p-4">
                <Heading
                    title="Edit user"
                    description={`Joined ${new Date(user.created_at).toLocaleDateString()} · ${user.uploads_count} file(s) · ${formatBytes(user.uploads_sum_size ?? 0)}`}
                />

                <form onSubmit={submit} className="max-w-xl space-y-6">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} required autoComplete="off" />
                        <InputError message={errors.name} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="email">Email address</Label>
                        <Input
                            id="email"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            required
                            autoComplete="off"
                        />
                        <p className="text-muted-foreground text-xs">Changing the email marks it as unverified.</p>
                        <InputError message={errors.email} />
                    </div>

                    <div className="grid gap-2">
                        <div className="flex items-start gap-3">
                            <Checkbox
                                id="is_admin"
                                checked={data.is_admin}
                                onCheckedChange={(checked) => setData('is_admin', checked === true)}
                                disabled={isSelf}
                                className="mt-0.5"
                            />
                            <div className="grid gap-1">
                                <Label htmlFor="is_admin">Administrator</Label>
                                <p className="text-muted-foreground text-sm">
                                    {isSelf
                                        ? 'You can’t remove your own admin access.'
                                        : 'Admins can see and manage every file and user, and open the admin panel.'}
                                </p>
                            </div>
                        </div>
                        <InputError message={errors.is_admin} />
                    </div>

                    <div className="flex items-center gap-4">
                        <Button disabled={processing}>Save changes</Button>
                        <Button variant="ghost" asChild>
                            <Link href={route('admin.users.index')}>Cancel</Link>
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
