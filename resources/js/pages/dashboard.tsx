import FileThumbnail from '@/components/files/file-thumbnail';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { formatBytes } from '@/lib/utils';
import { type BreadcrumbItem, type SharedData, type Upload } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, CalendarDays, Files, HardDrive, Link2, type LucideIcon, Trash2, Upload as UploadIcon, Users } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

interface DashboardProps {
    stats: { files: number; storage: number; this_week: number; shared: number; trashed: number };
    recent: Upload[];
    /** Site-wide totals, only sent to admins. */
    site: { users: number; files: number; storage: number } | null;
}

function StatCard({ icon: Icon, label, value, href }: { icon: LucideIcon; label: string; value: string | number; href?: string }) {
    const body = (
        <>
            <div className="text-muted-foreground flex items-center justify-between text-sm">
                {label}
                <Icon className="size-4" />
            </div>
            <div className="mt-2 text-2xl font-semibold tabular-nums">{value}</div>
        </>
    );

    const className = 'border-sidebar-border/70 dark:border-sidebar-border bg-card rounded-xl border p-5';

    return href ? (
        <Link href={href} className={`${className} hover:bg-muted/50 transition-colors`}>
            {body}
        </Link>
    ) : (
        <div className={className}>{body}</div>
    );
}

export default function Dashboard({ stats, recent, site }: DashboardProps) {
    const { auth } = usePage<SharedData>().props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <Heading title={`Welcome back, ${auth.user.name.split(' ')[0]}`} description="Here's an overview of your files" />
                    <Button asChild>
                        <Link href={route('files.create')}>
                            <UploadIcon />
                            Upload files
                        </Link>
                    </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    <StatCard icon={Files} label="My files" value={stats.files} href={route('files.index')} />
                    <StatCard icon={HardDrive} label="Storage used" value={formatBytes(stats.storage)} />
                    <StatCard icon={CalendarDays} label="Uploaded this week" value={stats.this_week} />
                    <StatCard icon={Link2} label="Shared by link" value={stats.shared} />
                    <StatCard icon={Trash2} label="In trash" value={stats.trashed} href={route('files.trash')} />
                </div>

                {site && (
                    <section className="space-y-3" aria-labelledby="site-heading">
                        <h2 id="site-heading" className="text-muted-foreground text-sm font-medium">
                            Across the whole site
                        </h2>
                        <div className="grid gap-4 sm:grid-cols-3">
                            <StatCard icon={Users} label="Users" value={site.users} href={route('admin.users.index')} />
                            <StatCard icon={Files} label="Files" value={site.files} href={route('files.index', { scope: 'all' })} />
                            <StatCard icon={HardDrive} label="Storage used" value={formatBytes(site.storage)} />
                        </div>
                    </section>
                )}

                <section className="border-sidebar-border/70 dark:border-sidebar-border rounded-xl border" aria-labelledby="recent-heading">
                    <div className="flex items-center justify-between border-b px-5 py-4">
                        <h2 id="recent-heading" className="font-semibold">
                            Recent uploads
                        </h2>
                        {recent.length > 0 && (
                            <Button variant="ghost" size="sm" asChild>
                                <Link href={route('files.index')}>
                                    View all
                                    <ArrowRight />
                                </Link>
                            </Button>
                        )}
                    </div>

                    {recent.length === 0 ? (
                        <div className="text-muted-foreground space-y-3 px-5 py-10 text-center text-sm">
                            <p>You haven&rsquo;t uploaded anything yet.</p>
                            <Button size="sm" asChild>
                                <Link href={route('files.create')}>Upload your first file</Link>
                            </Button>
                        </div>
                    ) : (
                        <ul className="divide-y">
                            {recent.map((upload) => (
                                <li key={upload.id} className="flex items-center gap-3 px-5 py-3">
                                    <FileThumbnail upload={upload} />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium">{upload.title}</p>
                                        <p className="text-muted-foreground truncate text-xs">
                                            {upload.original_name} · {formatBytes(upload.size)}
                                        </p>
                                    </div>
                                    <span className="text-muted-foreground shrink-0 text-xs">{new Date(upload.created_at).toLocaleDateString()}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </AppLayout>
    );
}
