import AppLogoIcon from '@/components/app-logo-icon';
import { Button } from '@/components/ui/button';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, FileUp, LockKeyhole, type LucideIcon, Search, ShieldCheck } from 'lucide-react';

const features: { icon: LucideIcon; title: string; description: string }[] = [
    {
        icon: FileUp,
        title: 'Upload with progress',
        description: 'Add files up to 10 MB with a title and notes, and watch the upload progress as it goes.',
    },
    {
        icon: LockKeyhole,
        title: 'Private storage',
        description: 'Files are stored outside the public web folder. They can only be downloaded through the app.',
    },
    {
        icon: Search,
        title: 'Find files fast',
        description: 'Search by title or file name, and page through the whole library from one table.',
    },
    {
        icon: ShieldCheck,
        title: 'Admin controls',
        description: 'Administrators can rename, replace and delete files. Everyone else is kept out of the admin panel.',
    },
];

const steps = [
    { title: 'Sign in', description: 'Log in with your account. An administrator can grant you access to the admin panel.' },
    { title: 'Upload', description: 'Choose a file, give it a title and an optional description, and save it.' },
    { title: 'Manage', description: 'Download, edit or replace files any time. Deleting one also removes it from storage.' },
];

export default function Welcome() {
    const { auth, name } = usePage<SharedData>().props;

    const primaryAction = auth.user
        ? auth.user.is_admin
            ? { label: 'Manage uploads', href: route('admin.uploads.index') }
            : { label: 'Go to dashboard', href: route('dashboard') }
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
                            Upload, organize and share your files in one place
                        </h1>
                        <p className="text-muted-foreground mx-auto mt-5 max-w-2xl text-lg text-pretty">
                            {name} keeps your documents, images and other files in private storage, with an admin panel for managing every upload.
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
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
