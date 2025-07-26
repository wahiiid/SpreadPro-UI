import React, { useState } from 'react';
import { Settings, Globe, Mail, Target, FileText, Calculator, Download, CheckCircle, X, Loader2, User } from 'lucide-react';
import { useViewDataset } from '@/custom-hooks/query-hooks';
import { useCampaignStore } from '@/stores/campaignStore';
import { toast } from 'sonner';

interface CompletedEnrichment {
    id: string;
    title: string;
    description: string;
    icon: React.ComponentType<any>;
    completedAt?: Date;
}

interface CompletedEnrichmentsProps {
    completedOptions: string[];
    onRemove: (optionId: string) => void;
}

// Utility function to convert base64 to blob and download file
const downloadFileFromBase64 = (base64Content: string, filename: string, datasetType: string) => {
    try {
        // Create blob from base64 content
        const byteCharacters = atob(base64Content);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);

        // Determine MIME type based on dataset type
        let mimeType = 'text/csv';
        if (datasetType === 'xlsx') {
            mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        } else if (datasetType !== 'csv') {
            mimeType = 'application/octet-stream';
        }

        const blob = new Blob([byteArray], { type: mimeType });

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        return true;
    } catch (error) {
        console.error('Error downloading file:', error);
        return false;
    }
};

export function CompletedEnrichments({ completedOptions, onRemove }: CompletedEnrichmentsProps) {
    const [downloadingOptions, setDownloadingOptions] = useState<string[]>([]);
    const { createdDatasetId } = useCampaignStore();

    // Get dataset info for downloading
    const { data: datasetResponse } = useViewDataset(createdDatasetId);

    // Handle download for a specific enrichment option
    const handleDownload = async (optionId: string) => {
        if (!createdDatasetId) {
            toast.error('No dataset ID available for download');
            return;
        }

        try {
            // Add to downloading state
            setDownloadingOptions(prev => [...prev, optionId]);

            toast.info(`Preparing ${optionId} file for download...`, {
                description: 'Fetching latest data from server.',
                duration: 3000,
            });

            // Get the latest dataset data
            const response = datasetResponse;

            if (!response?.result?.content) {
                toast.error('No data available for download', {
                    description: 'Please ensure the dataset has been processed and try refreshing the page.',
                    duration: 5000,
                });
                return;
            }

            // Generate filename
            const timestamp = new Date().toISOString().split('T')[0];
            const filename = `${optionId}-processed-${timestamp}.${response.result.dataset_type || 'csv'}`;

            // Download the file
            const success = downloadFileFromBase64(
                response.result.content,
                filename,
                response.result.dataset_type || 'csv'
            );

            if (success) {
                toast.success(`${optionId} file downloaded successfully!`, {
                    description: `File saved as: ${filename}`,
                    duration: 5000,
                });
            } else {
                toast.error('Failed to download file', {
                    description: 'Error occurred while creating the download.',
                    duration: 5000,
                });
            }

        } catch (error) {
            console.error('Download error:', error);
            toast.error('Failed to download file', {
                description: error instanceof Error ? error.message : 'An unexpected error occurred.',
                duration: 5000,
            });
        } finally {
            // Remove from downloading state
            setDownloadingOptions(prev => prev.filter(id => id !== optionId));
        }
    };
    const enrichmentOptionsMap: Record<string, CompletedEnrichment> = {
        'data-clean': {
            id: 'data-clean',
            title: 'Data Clean',
            description: 'Remove special characters and company suffixes from data fields',
            icon: Settings,
        },
        'job-title-enrichment': {
            id: 'job-title-enrichment',
            title: 'Job Title Enrichment',
            description: 'AI-powered enhancement and standardization of job titles and roles',
            icon: User,
        },
        'domain-enrichment': {
            id: 'domain-enrichment',
            title: 'Domain Enrichment',
            description: 'AI-powered discovery of company websites and domains',
            icon: Globe,
        },
        'email-discovery': {
            id: 'email-discovery',
            title: 'Email Discovery',
            description: 'Find email addresses for contacts using name and company information',
            icon: Mail,
        },
        'product-service-discovery': {
            id: 'product-service-discovery',
            title: 'Product and Service Discovery',
            description: 'Discover company products, services, and business offerings',
            icon: Target,
        },
        'generate-use-cases': {
            id: 'generate-use-cases',
            title: 'Generate Use Cases',
            description: 'Create specific use cases and value propositions for each company',
            icon: FileText,
        },
        'email-generation': {
            id: 'email-generation',
            title: 'Email Generation',
            description: 'Generate personalized email generations for business metrics',
            icon: Calculator,
        }
    };

    if (completedOptions.length === 0) {
        return null;
    }

    return (
        <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Completed Enrichments</h3>
            <div className="space-y-3">
                {completedOptions.map((optionId) => {
                    const option = enrichmentOptionsMap[optionId];
                    if (!option) return null;

                    const IconComponent = option.icon;
                    const isDownloading = downloadingOptions.includes(optionId);

                    return (
                        <div
                            key={optionId}
                            className="bg-green-50 border border-green-200 rounded-lg p-4 transition-all duration-200 hover:shadow-sm"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="flex-shrink-0">
                                        <CheckCircle className="text-green-600" size={20} />
                                    </div>
                                    <div className="flex-shrink-0">
                                        <IconComponent className="text-green-600" size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-medium text-green-900">
                                            {option.title}
                                        </h4>
                                        <p className="text-sm text-green-700">
                                            {option.description}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        ✓ Completed
                                    </span>
                                    <button
                                        onClick={() => handleDownload(optionId)}
                                        disabled={isDownloading}
                                        className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 ${isDownloading
                                            ? 'bg-gray-400 text-white cursor-not-allowed'
                                            : 'bg-green-600 hover:bg-green-700 text-white'
                                            }`}
                                    >
                                        {isDownloading ? (
                                            <>
                                                <Loader2 size={14} className="mr-1 animate-spin" />
                                                Downloading...
                                            </>
                                        ) : (
                                            <>
                                                <Download size={14} className="mr-1" />
                                                Download
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => onRemove(optionId)}
                                        className="inline-flex items-center text-red-600 hover:text-red-700"
                                        title="Remove from completed enrichments"
                                    >
                                        <X size={14} className="mr-1" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
} 