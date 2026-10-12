import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type Upload } from '@/types';
import { router } from '@inertiajs/react';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

const expiryOptions = [
    { value: '1', label: '1 day' },
    { value: '7', label: '7 days' },
    { value: '30', label: '30 days' },
    { value: 'never', label: 'Never' },
];

interface ShareDialogProps {
    upload: Upload | null;
    onClose: () => void;
}

/** Create, copy and turn off a file's public share link. */
export default function ShareDialog({ upload, onClose }: ShareDialogProps) {
    const [expiry, setExpiry] = useState('7');
    const [processing, setProcessing] = useState(false);
    const [copied, setCopied] = useState(false);

    const options = {
        preserveScroll: true,
        preserveState: true,
        onStart: () => setProcessing(true),
        onFinish: () => setProcessing(false),
    };

    const createLink = () => {
        if (!upload) return;

        router.post(route('files.share', upload.id), { expires_in_days: expiry === 'never' ? null : Number(expiry) }, options);
    };

    const turnOff = () => {
        if (!upload) return;

        router.delete(route('files.unshare', upload.id), options);
    };

    const copy = async () => {
        if (!upload?.share_url) return;

        await navigator.clipboard.writeText(upload.share_url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Dialog open={upload !== null} onOpenChange={(open) => !open && onClose()}>
            <DialogContent>
                <DialogTitle>Share &ldquo;{upload?.title}&rdquo;</DialogTitle>
                <DialogDescription>Anyone with the link can view and download this file without logging in.</DialogDescription>

                <div className="space-y-4">
                    {upload?.share_url && (
                        <>
                            <div className="flex gap-2">
                                <Input value={upload.share_url} readOnly onFocus={(e) => e.target.select()} aria-label="Share link" />
                                <Button variant="outline" size="icon" onClick={copy} title="Copy link">
                                    {copied ? <Check /> : <Copy />}
                                    <span className="sr-only">Copy link</span>
                                </Button>
                            </div>

                            <p className="text-muted-foreground text-sm">
                                {upload.share_expires_at
                                    ? `Expires ${new Date(upload.share_expires_at).toLocaleString()}.`
                                    : 'This link never expires.'}
                            </p>
                        </>
                    )}

                    <div className="grid gap-2">
                        <Label htmlFor="share-expiry">{upload?.share_url ? 'New link expires after' : 'Link expires after'}</Label>
                        <Select value={expiry} onValueChange={setExpiry}>
                            <SelectTrigger id="share-expiry">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {expiryOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {upload?.share_url && (
                            <p className="text-muted-foreground text-xs">A new link replaces the current one, which then stops working.</p>
                        )}
                    </div>

                    <div className="flex flex-wrap justify-between gap-2">
                        <Button onClick={createLink} disabled={processing}>
                            {upload?.share_url ? 'Create new link' : 'Create share link'}
                        </Button>
                        {upload?.share_url && (
                            <Button variant="destructive" onClick={turnOff} disabled={processing}>
                                Turn off sharing
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
