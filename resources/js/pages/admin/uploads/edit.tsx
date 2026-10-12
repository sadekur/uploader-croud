import UploadForm from '@/components/admin/upload-form';
import Heading from '@/components/heading';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Upload } from '@/types';
import { Head } from '@inertiajs/react';

export default function EditUpload({ upload, maxFileSize }: { upload: Upload; maxFileSize: number }) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Uploads',
            href: '/admin/uploads',
        },
        {
            title: upload.title,
            href: `/admin/uploads/${upload.id}/edit`,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${upload.title}`} />

            <div className="p-4">
                <Heading title="Edit upload" description={`Uploaded by ${upload.user?.name ?? 'a deleted user'}`} />

                <UploadForm upload={upload} maxFileSize={maxFileSize} />
            </div>
        </AppLayout>
    );
}
