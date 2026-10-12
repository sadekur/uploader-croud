import AppLogoIcon from '@/components/app-logo-icon';
import FileThumbnail from '@/components/files/file-thumbnail';
import { Button } from '@/components/ui/button';
import { formatBytes } from '@/lib/utils';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { Download } from 'lucide-react';

interface SharedFile {
    title: string;
    description: string | null;
    original_name: string;
    mime_type: string | null;
    size: number;
    previewable: boolean;
    created_at: string;
    expires_at: string | null;
    owner: string | null;
}

/** Public page for a file shared by link. Visitors don't need an account. */
export default function SharedFilePage({ file, token }: { file: SharedFile; token: string }) {
    const { name } = usePage<SharedData>().props;
    const previewUrl = route('shared.preview', token);
    const isImage = file.previewable && file.mime_type?.startsWith('image/');
    const isPdf = file.previewable && file.mime_type === 'application/pdf';

    return (
        <>
            <Head title={file.title}>
                {/* Shared links are private by intent; keep them out of search engines. */}
                <meta name="robots" content="noindex" />
            </Head>

            <div className="bg-muted/40 text-foreground flex min-h-screen flex-col items-center px-4 py-10">
                <Link href="/" className="mb-8 flex items-center gap-2 font-semibold">
                    <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-md">
                        <AppLogoIcon className="size-5 fill-current" />
                    </span>
                    {name}
                </Link>

                <main className="bg-card text-card-foreground w-full max-w-2xl overflow-hidden rounded-xl border shadow-sm">
                    {isImage && (
                        <div className="bg-muted flex justify-center">
                            <img src={previewUrl} alt={file.title} className="max-h-[60vh] w-auto object-contain" />
                        </div>
                    )}
                    {isPdf && <iframe src={previewUrl} title={file.title} className="bg-muted h-[60vh] w-full" />}

                    <div className="space-y-5 p-6">
                        <div className="flex items-start gap-4">
                            {!isImage && <FileThumbnail upload={{ id: 0, mime_type: file.mime_type, previewable: false }} className="size-12" />}
                            <div className="min-w-0">
                                <h1 className="text-xl font-semibold break-words">{file.title}</h1>
                                <p className="text-muted-foreground text-sm break-all">
                                    {file.original_name} · {formatBytes(file.size)}
                                </p>
                            </div>
                        </div>

                        {file.description && <p className="text-sm whitespace-pre-line">{file.description}</p>}

                        <p className="text-muted-foreground text-sm">
                            Shared by {file.owner ?? 'a former user'} · uploaded {new Date(file.created_at).toLocaleDateString()}
                            {file.expires_at && <> · link expires {new Date(file.expires_at).toLocaleString()}</>}
                        </p>

                        <Button size="lg" className="w-full sm:w-auto" asChild>
                            <a href={route('shared.download', token)}>
                                <Download />
                                Download
                            </a>
                        </Button>
                    </div>
                </main>
            </div>
        </>
    );
}
