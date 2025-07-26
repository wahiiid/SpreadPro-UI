import { Database, Columns3 } from 'lucide-react';
import { BackToCampaignsButton } from './BackToCampaignsButton';

interface CampaignHeaderProps {
    campaignName: string;
    campaignDescription: string;
    recordsCount: number;
    columnsCount: number;
    showBackButton?: boolean;
    backButtonWarningTitle?: string;
    backButtonWarningMessage?: string;
}

export function CampaignHeader({
    campaignName,
    campaignDescription,
    recordsCount,
    columnsCount,
    showBackButton = true,
    backButtonWarningTitle = "Leave Campaign?",
    backButtonWarningMessage = "Are you sure you want to go back to campaigns? Your progress will be lost."
}: CampaignHeaderProps) {
    return (
        <div className="mb-8">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <div className="flex justify-between items-start">
                    {/* Left side - Campaign info */}
                    <div className="flex-1 mr-8">
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">
                            {campaignName || 'Campaign'}
                        </h1>
                        <p className="text-lg text-gray-600 leading-relaxed">
                            {campaignDescription || 'Campaign description'}
                        </p>
                    </div>

                    {/* Right side - Stats and Back button */}
                    <div className="flex items-center space-x-6">
                        {/* Stats */}
                        <div className="flex items-center space-x-6">
                            {/* Records */}
                            <div className="text-center">
                                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-2">
                                    <Database className="w-6 h-6 text-blue-600" />
                                </div>
                                <div className="text-2xl font-bold text-gray-900">{recordsCount.toLocaleString()}</div>
                                <div className="text-sm text-gray-500">Records</div>
                            </div>

                            {/* Columns */}
                            <div className="text-center">
                                <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-2">
                                    <Columns3 className="w-6 h-6 text-green-600" />
                                </div>
                                <div className="text-2xl font-bold text-gray-900">{columnsCount}</div>
                                <div className="text-sm text-gray-500">Columns</div>
                            </div>

                        </div>

                        {/* Back Button */}
                        {showBackButton && (
                            <div className="ml-6 pl-6 border-l border-gray-200">
                                <BackToCampaignsButton
                                    warningTitle={backButtonWarningTitle}
                                    warningMessage={backButtonWarningMessage}
                                    variant="secondary"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
} 