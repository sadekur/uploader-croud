import EditUploadForm from '@/components/files/edit-upload-form';
import Heading from '@/components/heading';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData, type Upload } from '@/types';
import { Head, usePage } from '@inertiajs/react';

export default function EditFile({ upload, maxFileSize }: { upload: Upload; maxFileSize: number }) {
    const { auth } = usePage<SharedData>().props;

    // Admins editing someone else's file came from the "All files" list.
    const ownFile = upload.user_id === auth.user.id;
    const listUrl = ownFile ? route('files.index') : route('files.index', { scope: 'all' });

    const breadcrumbs: BreadcrumbItem[] = [
        { title: ownFile ? 'My files' : 'All files', href: listUrl },
        { title: upload.title, href: route('files.edit', upload.id) },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${upload.title}`} />

            <div className="p-4">
                <Heading
                    title="Edit file"
                    description={ownFile ? 'Change the details or replace the file' : `Uploaded by ${upload.user?.name ?? 'a deleted user'}`}
                />

                <EditUploadForm upload={upload} maxFileSize={maxFileSize} backUrl={listUrl} />
            </div>
        </AppLayout>
    );
}
