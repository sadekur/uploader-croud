import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatBytes } from '@/lib/utils';
import { type Upload } from '@/types';
import { Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

interface EditUploadFormProps {
    upload: Upload;
    /** Largest accepted file in kilobytes, matching the server-side rule. */
    maxFileSize: number;
    /** Where Cancel goes back to. */
    backUrl: string;
}

type EditUploadFormData = {
    title: string;
    description: string;
    file: File | null;
    _method: 'put';
};

export default function EditUploadForm({ upload, maxFileSize, backUrl }: EditUploadFormProps) {
    const { data, setData, post, errors, processing, progress } = useForm<EditUploadFormData>({
        title: upload.title,
        description: upload.description ?? '',
        file: null,
        // PHP only parses multipart bodies on POST, so the update is sent as a spoofed PUT.
        _method: 'put',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('files.update', upload.id), { forceFormData: true });
    };

    return (
        <form onSubmit={submit} className="max-w-xl space-y-6">
            <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>

                <Input id="title" value={data.title} onChange={(e) => setData('title', e.target.value)} required maxLength={255} />

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
                <Label htmlFor="file">Replace file</Label>

                <p className="text-muted-foreground text-sm">
                    Current file: <span className="text-foreground font-medium">{upload.original_name}</span> ({formatBytes(upload.size)}). Leave
                    empty to keep it.
                </p>

                <Input id="file" type="file" onChange={(e) => setData('file', e.target.files?.[0] ?? null)} />

                <p className="text-muted-foreground text-xs">Maximum size {formatBytes(maxFileSize * 1024)}.</p>

                <InputError message={errors.file} />
            </div>

            {progress && (
                <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                    <div className="bg-primary h-full transition-all" style={{ width: `${progress.percentage ?? 0}%` }} />
                </div>
            )}

            <div className="flex items-center gap-4">
                <Button disabled={processing}>Save changes</Button>

                <Button variant="ghost" asChild>
                    <Link href={backUrl}>Cancel</Link>
                </Button>
            </div>
        </form>
    );
}
