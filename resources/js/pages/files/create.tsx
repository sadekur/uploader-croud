import UploadDropzone from '@/components/files/upload-dropzone';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'My files', href: '/files' },
    { title: 'Upload files', href: '/files/create' },
];

export default function CreateFiles({ maxFileSize }: { maxFileSize: number }) {
    const [uploaded, setUploaded] = useState(0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Upload files" />

            <div className="max-w-3xl space-y-6 p-4">
                <Heading
                    title="Upload files"
                    description="Add one file or many at once. Each file is titled after its name. You can rename it afterwards."
                />

                <UploadDropzone maxFileSize={maxFileSize} onFinished={(count) => setUploaded((total) => total + count)} />

                {uploaded > 0 && (
                    <Button asChild>
                        <Link href={route('files.index')}>
                            Go to my files
                            <ArrowRight />
                        </Link>
                    </Button>
                )}
            </div>
        </AppLayout>
    );
}
