import { Loader2 } from 'lucide-react';

interface LoadingScreenProps {
    message?: string;
}

export function LoadingScreen({ message = 'Loading...' }: LoadingScreenProps) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 flex items-center justify-center">
            <div className="text-center">
                <Loader2 className="animate-spin mx-auto mb-4" size={48} />
                <p className="text-gray-600">{message}</p>
            </div>
        </div>
    );
} 