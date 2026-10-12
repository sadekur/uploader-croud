import { Alert, AlertDescription } from '@/components/ui/alert';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { CircleCheck } from 'lucide-react';

export default function FlashMessage() {
    const { flash } = usePage<SharedData>().props;

    if (!flash.success) {
        return null;
    }

    return (
        <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200 [&>svg]:text-green-600">
            <CircleCheck className="size-4" />
            <AlertDescription>{flash.success}</AlertDescription>
        </Alert>
    );
}
