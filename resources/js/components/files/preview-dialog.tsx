import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { formatBytes } from '@/lib/utils';
import { type Upload } from '@/types';
import { Download } from 'lucide-react';

interface PreviewDialogProps {
    upload: Upload | null;
    onClose: () => void;
}

/** Shows an image or PDF inline, with a download button. */
export default function PreviewDialog({ upload, onClose }: PreviewDialogProps) {
    return (
        <Dialog open={upload !== null} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="flex max-h-[90vh] flex-col gap-4 sm:max-w-4xl">
                {upload && (
                    <>
                        <div className="pr-8">
                            <DialogTitle className="truncate">{upload.title}</DialogTitle>
                            <DialogDescription className="truncate">
                                {upload.original_name} · {formatBytes(upload.size)}
                            </DialogDescription>
                        </div>

                        <div className="bg-muted flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-lg">
                            {upload.mime_type === 'application/pdf' ? (
                                <iframe src={route('files.preview', upload.id)} title={upload.title} className="h-[70vh] w-full" />
                            ) : (
                                <img src={route('files.preview', upload.id)} alt={upload.title} className="max-h-[70vh] w-auto object-contain" />
                            )}
                        </div>

                        <div className="flex justify-end">
                            <Button asChild>
                                <a href={route('files.download', upload.id)}>
                                    <Download />
                                    Download
                                </a>
                            </Button>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
