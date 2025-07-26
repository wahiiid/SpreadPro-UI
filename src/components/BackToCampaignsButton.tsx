import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft, AlertTriangle, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface BackToCampaignsButtonProps {
    className?: string;
    variant?: 'primary' | 'secondary';
    showWarning?: boolean;
    warningTitle?: string;
    warningMessage?: string;
}

export function BackToCampaignsButton({
    className = "",
    variant = "secondary",
    showWarning = true,
    warningTitle = "Leave Campaign Creation?",
    warningMessage = "Are you sure you want to go back to campaigns? Any unsaved progress will be lost."
}: BackToCampaignsButtonProps) {
    const navigate = useNavigate();
    const [showWarningDialog, setShowWarningDialog] = useState(false);

    const handleBackClick = () => {
        if (showWarning) {
            setShowWarningDialog(true);
        } else {
            navigate({ to: '/campaigns' });
        }
    };

    const handleConfirmBack = () => {
        setShowWarningDialog(false);
        navigate({ to: '/campaigns' });
    };

    const handleCancelBack = () => {
        setShowWarningDialog(false);
    };

    const baseClasses = "flex items-center space-x-2 px-6 py-3 font-medium rounded-lg transition-all duration-200 transform hover:scale-105";
    const variantClasses = variant === 'primary'
        ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl"
        : "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 hover:border-gray-400";

    return (
        <>
            <button
                onClick={handleBackClick}
                className={`${baseClasses} ${variantClasses} ${className}`}
            >
                <ArrowLeft size={20} />
                <span>Back to Campaigns</span>
            </button>

            {/* Warning Dialog */}
            <Dialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader className="text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 mb-4">
                            <AlertTriangle className="h-6 w-6 text-orange-600" />
                        </div>
                        <DialogTitle className="text-xl font-semibold text-gray-900">
                            {warningTitle}
                        </DialogTitle>
                        <DialogDescription className="text-gray-600 mt-2">
                            {warningMessage}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-6">
                        <Button
                            variant="outline"
                            onClick={handleCancelBack}
                            className="w-full sm:w-auto"
                        >
                            <X className="mr-2 h-4 w-4" />
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleConfirmBack}
                            className="w-full sm:w-auto"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Yes, Go Back
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
} 