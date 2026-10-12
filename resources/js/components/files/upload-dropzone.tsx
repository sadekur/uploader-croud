import { Button } from '@/components/ui/button';
import { cn, formatBytes } from '@/lib/utils';
import { CircleAlert, CircleCheck, FileUp, LoaderCircle, X } from 'lucide-react';
import { type DragEvent, useCallback, useEffect, useRef, useState } from 'react';

type Status = 'waiting' | 'uploading' | 'done' | 'error';

interface QueuedFile {
    id: number;
    file: File;
    status: Status;
    progress: number;
    error?: string;
}

/** Laravel sets this cookie on every response; sending it back passes CSRF checks. */
function xsrfToken(): string {
    const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/);
    return match ? decodeURIComponent(match[1]) : '';
}

/**
 * Upload one file with XMLHttpRequest, which (unlike fetch) reports upload progress.
 * Resolves on success and rejects with a readable message on failure.
 */
function uploadFile(file: File, onProgress: (percent: number) => void): Promise<void> {
    return new Promise((resolve, reject) => {
        const data = new FormData();
        data.append('file', file);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', route('files.store'));
        xhr.setRequestHeader('Accept', 'application/json');
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        xhr.setRequestHeader('X-XSRF-TOKEN', xsrfToken());

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                onProgress(Math.round((event.loaded / event.total) * 100));
            }
        };

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve();
                return;
            }

            if (xhr.status === 413) {
                reject('The file is larger than the server accepts.');
                return;
            }

            if (xhr.status === 419) {
                reject('Your session expired. Refresh the page and try again.');
                return;
            }

            try {
                const body = JSON.parse(xhr.responseText);
                reject(body.errors?.file?.[0] ?? body.message ?? 'Upload failed.');
            } catch {
                reject('Upload failed.');
            }
        };

        xhr.onerror = () => reject('Network error. Check your connection and try again.');
        xhr.send(data);
    });
}

interface UploadDropzoneProps {
    /** Largest accepted file in kilobytes, matching the server-side rule. */
    maxFileSize: number;
    /** Called once every queued file has finished, with how many succeeded. */
    onFinished?: (uploaded: number) => void;
}

export default function UploadDropzone({ maxFileSize, onFinished }: UploadDropzoneProps) {
    const [queue, setQueue] = useState<QueuedFile[]>([]);
    const [dragging, setDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const nextId = useRef(1);

    const update = useCallback(
        (id: number, changes: Partial<QueuedFile>) => setQueue((items) => items.map((item) => (item.id === id ? { ...item, ...changes } : item))),
        [],
    );

    const addFiles = (files: FileList | null) => {
        if (!files?.length) return;

        const added = Array.from(files).map(
            (file): QueuedFile =>
                file.size > maxFileSize * 1024
                    ? { id: nextId.current++, file, status: 'error', progress: 0, error: `Larger than ${formatBytes(maxFileSize * 1024)}.` }
                    : { id: nextId.current++, file, status: 'waiting', progress: 0 },
        );

        setQueue((items) => [...items, ...added]);
    };

    // Upload one file at a time: start the next waiting file whenever nothing is uploading.
    useEffect(() => {
        if (queue.some((item) => item.status === 'uploading')) return;

        const next = queue.find((item) => item.status === 'waiting');

        if (!next) return;

        update(next.id, { status: 'uploading' });

        uploadFile(next.file, (progress) => update(next.id, { progress }))
            .then(() => update(next.id, { status: 'done', progress: 100 }))
            .catch((error: string) => update(next.id, { status: 'error', error }));
    }, [queue, update]);

    const busy = queue.some((item) => item.status === 'waiting' || item.status === 'uploading');
    const uploaded = queue.filter((item) => item.status === 'done').length;

    // Tell the page when a batch completes so it can refresh its data.
    const wasBusy = useRef(false);
    useEffect(() => {
        if (wasBusy.current && !busy) {
            onFinished?.(uploaded);
        }
        wasBusy.current = busy;
    }, [busy, uploaded, onFinished]);

    const onDrop = (event: DragEvent) => {
        event.preventDefault();
        setDragging(false);
        addFiles(event.dataTransfer.files);
    };

    return (
        <div className="space-y-4">
            <div
                role="button"
                tabIndex={0}
                onClick={() => inputRef.current?.click()}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
                onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                className={cn(
                    'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-14 text-center transition-colors',
                    'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
                    dragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/40',
                )}
            >
                <span className="bg-muted flex size-12 items-center justify-center rounded-full">
                    <FileUp className="size-6" />
                </span>
                <div>
                    <p className="font-medium">Drop files here, or click to choose</p>
                    <p className="text-muted-foreground mt-1 text-sm">Any file type, up to {formatBytes(maxFileSize * 1024)} each</p>
                </div>
                <input
                    ref={inputRef}
                    type="file"
                    multiple
                    className="sr-only"
                    tabIndex={-1}
                    onChange={(e) => {
                        addFiles(e.target.files);
                        e.target.value = '';
                    }}
                />
            </div>

            {queue.length > 0 && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{busy ? 'Uploading…' : `${uploaded} of ${queue.length} uploaded`}</p>
                        {!busy && (
                            <Button variant="ghost" size="sm" onClick={() => setQueue([])}>
                                Clear list
                            </Button>
                        )}
                    </div>

                    <ul className="divide-y rounded-xl border">
                        {queue.map((item) => (
                            <li key={item.id} className="flex items-center gap-3 px-4 py-3">
                                <StatusIcon status={item.status} />
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-baseline justify-between gap-3">
                                        <p className="truncate text-sm font-medium">{item.file.name}</p>
                                        <span className="text-muted-foreground shrink-0 text-xs tabular-nums">{formatBytes(item.file.size)}</span>
                                    </div>
                                    {item.status === 'error' ? (
                                        <p className="text-destructive mt-1 text-xs">{item.error}</p>
                                    ) : (
                                        <div className="bg-muted mt-2 h-1.5 overflow-hidden rounded-full">
                                            <div
                                                className={cn('h-full transition-all', item.status === 'done' ? 'bg-green-600' : 'bg-primary')}
                                                style={{ width: `${item.progress}%` }}
                                            />
                                        </div>
                                    )}
                                </div>
                                {item.status === 'waiting' && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-8"
                                        onClick={() => setQueue((items) => items.filter((queued) => queued.id !== item.id))}
                                        title="Remove from queue"
                                    >
                                        <X />
                                        <span className="sr-only">Remove {item.file.name}</span>
                                    </Button>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

function StatusIcon({ status }: { status: Status }) {
    switch (status) {
        case 'uploading':
            return <LoaderCircle className="text-primary size-5 shrink-0 animate-spin" />;
        case 'done':
            return <CircleCheck className="size-5 shrink-0 text-green-600" />;
        case 'error':
            return <CircleAlert className="text-destructive size-5 shrink-0" />;
        default:
            return <FileUp className="text-muted-foreground size-5 shrink-0" />;
    }
}
