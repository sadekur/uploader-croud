import UploadForm from '@/components/admin/upload-form';
import Heading from '@/components/heading';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Uploads',
        href: '/admin/uploads',
    },
    {
        title: 'New upload',
        href: '/admin/uploads/create',
    },
];

export default function CreateUpload({ maxFileSize }: { maxFileSize: number }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="New upload" />

            <div className="p-4">
                <Heading title="New upload" description="Add a file to the library" />

                <UploadForm maxFileSize={maxFileSize} />
            </div>
        </AppLayout>
    );
}
