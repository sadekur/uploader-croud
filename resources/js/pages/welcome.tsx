import AppLogoIcon from '@/components/app-logo-icon';
import { Button } from '@/components/ui/button';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, Eye, FileUp, Link2, LockKeyhole, type LucideIcon, ShieldCheck, Trash2 } from 'lucide-react';

const features: { icon: LucideIcon; title: string; description: string }[] = [
    {
        icon: FileUp,
        title: 'Drag-and-drop uploads',
        description: 'Drop several files at once and watch each one upload with its own progress bar. Up to 10 MB per file.',
    },
    {
        icon: Eye,
        title: 'Instant previews',
        description: 'See image thumbnails in your file list, and open images and PDFs right in the browser.',
    },
    {
        icon: Link2,
        title: 'Share by link',
        description: 'Send anyone a download link, set it to expire after 1, 7 or 30 days, and turn it off at any time.',
    },
    {
        icon: LockKeyhole,
        title: 'Private by default',
        description: 'Files are stored outside the public web folder. Only you, admins and people with your link can reach them.',
    },
    {
        icon: Trash2,
        title: 'Recoverable trash',
        description: 'Deleted something by mistake? Restore it from the trash any time in the next 30 days.',
    },
    {
        icon: ShieldCheck,
        title: 'Admin panel',
        description: 'Administrators can see every file, manage users, and grant or remove admin access.',
    },
];

const steps = [
    { title: 'Create an account', description: 'Register in a few seconds. Your files are private to you from the start.' },
    { title: 'Upload', description: 'Drag files onto the upload page. Each file is titled after its name, and you can rename it later.' },
    { title: 'Preview and share', description: 'Open files in the browser, download them, or create a share link for someone else.' },
];

export default function Welcome() {
    const { auth, name } = usePage<SharedData>().props;

    const primaryAction = auth.user
        ? { label: 'Go to my files', href: route('files.index') }
        : { label: 'Create an account', href: route('register') };

    return (
        <>
            <Head title="Welcome" />

            <div className="bg-background text-foreground flex min-h-screen flex-col">
                <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
                    <Link href="/" className="flex items-center gap-2 font-semibold">
                        <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-md">
                            <AppLogoIcon className="size-5 fill-current" />
                        </span>
                        {name}
                    </Link>

                    <nav className="flex items-center gap-2">
                        {auth.user ? (
                            <Button variant="outline" asChild>
                                <Link href={route('dashboard')}>Dashboard</Link>
                            </Button>
                        ) : (
                            <>
                                <Button variant="ghost" asChild>
                                    <Link href={route('login')}>Log in</Link>
                                </Button>
                                <Button variant="outline" asChild>
                                    <Link href={route('register')}>Register</Link>
                                </Button>
                            </>
                        )}
                    </nav>
                </header>

                <main className="flex-1">
                    <section className="mx-auto max-w-6xl px-4 pt-12 pb-16 text-center sm:px-6 lg:pt-24">
                        <p className="text-muted-foreground mb-4 text-sm font-medium tracking-wide uppercase">File management</p>
                        <h1 className="mx-auto max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
                            Upload, preview and share your files in one place
                        </h1>
                        <p className="text-muted-foreground mx-auto mt-5 max-w-2xl text-lg text-pretty">
                            {name} keeps your documents, images and other files in private storage. Preview them in the browser, and share them with a
                            link that expires when you want it to.
                        </p>

                        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                            <Button size="lg" asChild>
                                <Link href={primaryAction.href}>
                                    {primaryAction.label}
                                    <ArrowRight />
                                </Link>
                            </Button>
                            {!auth.user && (
                                <Button size="lg" variant="outline" asChild>
                                    <Link href={route('login')}>Log in</Link>
                                </Button>
                            )}
                        </div>
                    </section>

                    <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6" aria-labelledby="features-heading">
                        <h2 id="features-heading" className="sr-only">
                            Features
                        </h2>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {features.map((feature) => (
                                <div key={feature.title} className="bg-card text-card-foreground rounded-xl border p-6">
                                    <span className="bg-muted mb-4 flex size-10 items-center justify-center rounded-lg">
                                        <feature.icon className="size-5" />
                                    </span>
                                    <h3 className="font-semibold">{feature.title}</h3>
                                    <p className="text-muted-foreground mt-2 text-sm">{feature.description}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="bg-muted/40 border-y" aria-labelledby="steps-heading">
                        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
                            <h2 id="steps-heading" className="text-2xl font-semibold tracking-tight">
                                How it works
                            </h2>
                            <ol className="mt-8 grid gap-8 sm:grid-cols-3">
                                {steps.map((step, index) => (
                                    <li key={step.title} className="flex gap-4">
                                        <span className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
                                            {index + 1}
                                        </span>
                                        <div>
                                            <h3 className="font-semibold">{step.title}</h3>
                                            <p className="text-muted-foreground mt-1 text-sm">{step.description}</p>
                                        </div>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    </section>
                </main>

                <footer className="text-muted-foreground mx-auto w-full max-w-6xl px-4 py-6 text-sm sm:px-6">
                    &copy; {new Date().getFullYear()} {name}
                </footer>
            </div>
        </>
    );
}
