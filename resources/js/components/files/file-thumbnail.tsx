import { cn } from '@/lib/utils';
import { type Upload } from '@/types';
import { File, FileArchive, FileAudio, FileImage, FileText, FileVideo, type LucideIcon } from 'lucide-react';

function iconFor(mimeType: string | null): LucideIcon {
    if (!mimeType) return File;
    if (mimeType.startsWith('image/')) return FileImage;
    if (mimeType.startsWith('video/')) return FileVideo;
    if (mimeType.startsWith('audio/')) return FileAudio;
    if (mimeType === 'application/pdf' || mimeType.startsWith('text/')) return FileText;
    if (/zip|rar|7z|tar|gzip/.test(mimeType)) return FileArchive;
    return File;
}

interface FileThumbnailProps {
    upload: Pick<Upload, 'id' | 'mime_type' | 'previewable'>;
    /** Load the real image. Off for trashed files, whose preview URL no longer works. */
    showImage?: boolean;
    className?: string;
}

/** A small image thumbnail for images, or an icon matching the file type. */
export default function FileThumbnail({ upload, showImage = true, className }: FileThumbnailProps) {
    const isImage = showImage && upload.previewable && upload.mime_type?.startsWith('image/');
    const Icon = iconFor(upload.mime_type);

    return (
        <div className={cn('bg-muted flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md', className)}>
            {isImage ? (
                <img src={route('files.preview', upload.id)} alt="" loading="lazy" className="size-full object-cover" />
            ) : (
                <Icon className="text-muted-foreground size-5" />
            )}
        </div>
    );
}
