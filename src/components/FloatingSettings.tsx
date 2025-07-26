import React, { useState, useEffect } from 'react';
import { X, Maximize2 } from 'lucide-react';

interface FloatingSettingsProps {
    children: React.ReactNode;
    showSubmitButton?: boolean;
    submitButtonText?: string;
    isSubmitDisabled?: boolean;
    onSubmit?: () => void;
    isSubmitLoading?: boolean;
}

export function FloatingSettings({
    children,
    showSubmitButton = false,
    submitButtonText = 'Apply Changes',
    isSubmitDisabled = false,
    onSubmit,
    isSubmitLoading = false
}: FloatingSettingsProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    // Handle opening animation
    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
        } else {
            // Delay hiding to allow close animation to complete
            const timer = setTimeout(() => setIsVisible(false), 400);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    const handleOpen = () => {
        setIsOpen(true);
    };

    const handleClose = () => {
        setIsOpen(false);
    };

    const handleSubmit = () => {
        if (onSubmit && !isSubmitDisabled && !isSubmitLoading) {
            onSubmit();
        }
    };

    return (
        <>
            {/* Floating Settings Button - Vertical Tab */}
            <button
                onClick={handleOpen}
                className="fixed right-0 top-1/2 transform -translate-y-1/2 z-40 bg-gray-500/25 text-black shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 border-l border-t border-b border-gray-200 rounded-l-lg"
                style={{
                    width: '55px',
                    height: '160px',
                    writingMode: 'vertical-rl',
                    textOrientation: 'mixed'
                }}
                aria-label="Open Enrichments Settings"
            >
                <div className="flex flex-row items-center justify-center h-full gap-2">
                    <Maximize2 size={16} className="text-black" />
                    <span className="text-sm font-medium tracking-wider text-black">
                        ENRICHMENTS
                    </span>
                </div>
            </button>

            {/* Settings Panel Overlay */}
            {isVisible && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    {/* Background overlay */}
                    <div
                        className={`absolute inset-0 bg-black transition-all duration-400 ease-in-out ${isOpen ? 'opacity-50 backdrop-blur-sm' : 'opacity-0'
                            }`}
                        onClick={handleClose}
                    />

                    {/* Settings Panel */}
                    <div className={`relative bg-white w-[480px] h-full shadow-2xl overflow-hidden transform transition-all duration-400 ease-out flex flex-col ${isOpen ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-full opacity-0 scale-95'
                        }`}>
                        {/* Header */}
                        <div className="sticky top-0 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                            <div className="flex items-center space-x-3">
                                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                                <h2 className="text-lg font-semibold text-gray-900">Enrichment Options</h2>
                            </div>
                            <button
                                onClick={handleClose}
                                className="text-gray-400 hover:text-gray-600 transition-all duration-200 hover:scale-110 hover:rotate-90 p-1 rounded-full hover:bg-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto">
                            <div className={`p-6 ${showSubmitButton ? 'pb-4' : 'pb-6'} transition-all duration-500 ease-out ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                                }`} style={{
                                    transitionDelay: isOpen ? '200ms' : '0ms'
                                }}>
                                {children}
                            </div>
                        </div>

                        {/* Sticky Submit Button - Only show when options are selected */}
                        {showSubmitButton && (
                            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 z-10">
                                <div className={`transition-all duration-500 ease-out ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                                    }`} style={{
                                        transitionDelay: isOpen ? '300ms' : '0ms'
                                    }}>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={isSubmitDisabled || isSubmitLoading}
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 hover:scale-[1.02] hover:transition-all hover:shadow-md active:scale-[0.98] disabled:hover:scale-100 disabled:hover:shadow-none disabled:hover:text-gray-200"
                                    >
                                        {isSubmitLoading ? (
                                            <div className="flex items-center justify-center space-x-2">
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                <span>Processing...</span>
                                            </div>
                                        ) : (
                                            submitButtonText
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
} 