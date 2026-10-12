import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatBytes } from '@/lib/utils';
import { type Upload } from '@/types';
import { Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

interface UploadFormProps {
    /** The upload being edited. Leave out to create a new one. */
    upload?: Upload;
    /** Largest accepted file in kilobytes, matching the server-side rule. */
    maxFileSize: number;
}

type UploadFormData = {
    title: string;
    description: string;
    file: File | null;
    _method?: 'put';
};

export default function UploadForm({ upload, maxFileSize }: UploadFormProps) {
    const isEditing = upload !== undefined;

    const { data, setData, post, errors, processing, progress } = useForm<UploadFormData>({
        title: upload?.title ?? '',
        description: upload?.description ?? '',
        file: null,
        // PHP only parses multipart bodies on POST, so updates are sent as a spoofed PUT.
        ...(isEditing ? { _method: 'put' as const } : {}),
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(isEditing ? route('admin.uploads.update', upload.id) : route('admin.uploads.store'), {
            forceFormData: true,
        });
    };

    return (
        <form onSubmit={submit} className="max-w-xl space-y-6">
            <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>

                <Input
                    id="title"
                    value={data.title}
                    onChange={(e) => setData('title', e.target.value)}
                    required
                    maxLength={255}
                    placeholder="Quarterly report"
                />

                <InputError message={errors.title} />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>

                <Textarea
                    id="description"
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                    rows={4}
                    placeholder="Optional notes about this file"
                />

                <InputError message={errors.description} />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="file">{isEditing ? 'Replace file' : 'File'}</Label>

                {isEditing && (
                    <p className="text-muted-foreground text-sm">
                        Current file: <span className="text-foreground font-medium">{upload.original_name}</span> ({formatBytes(upload.size)}). Leave
                        empty to keep it.
                    </p>
                )}

                <Input id="file" type="file" onChange={(e) => setData('file', e.target.files?.[0] ?? null)} required={!isEditing} />

                <p className="text-muted-foreground text-xs">Maximum size {formatBytes(maxFileSize * 1024)}.</p>

                <InputError message={errors.file} />
            </div>

            {progress && (
                <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                    <div className="bg-primary h-full transition-all" style={{ width: `${progress.percentage ?? 0}%` }} />
                </div>
            )}

            <div className="flex items-center gap-4">
                <Button disabled={processing}>{isEditing ? 'Save changes' : 'Upload'}</Button>

                <Button variant="ghost" asChild>
                    <Link href={route('admin.uploads.index')}>Cancel</Link>
                </Button>
            </div>
        </form>
    );
}
