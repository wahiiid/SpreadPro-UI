import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Header } from './Header';
import { CampaignHeader } from './CampaignHeader';
import { useGetCampaignById, useViewDataset } from '../custom-hooks/query-hooks';
import { useCampaignStore } from '@/stores/campaignStore';
import { ArrowLeft, FileText, Eye, Loader2, AlertCircle, RefreshCw, Download } from 'lucide-react';
import { Alert, Button, Typography } from '@mui/material';
import * as XLSX from 'xlsx';

interface CampaignDetailsProps {
    campaignId: string;
    onClose?: () => void;
}

// Utility function to parse XLSX files using SheetJS
function parseXLSXWithSheetJS(base64Content: string): any[] {
    try {
        // Decode base64 to binary
        const binaryString = atob(base64Content);

        // Convert binary string to Uint8Array
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        // Read the workbook
        const workbook = XLSX.read(bytes, { type: 'array' });

        // Get the first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        if (!worksheet) {
            console.error('No worksheet found in XLSX file');
            return [];
        }

        // Convert worksheet to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1, // Use array format
            defval: '', // Default value for empty cells
            raw: false // Convert all values to strings
        });

        if (jsonData.length === 0) {
            console.warn('No data found in XLSX file');
            return [];
        }

        // Convert array format to object format with headers
        const headers = jsonData[0] as string[];
        const data = [];

        for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i] as any[];
            const rowObj: any = {};

            headers.forEach((header, index) => {
                rowObj[header] = row[index] || '';
            });

            data.push(rowObj);
        }

        return data;
    } catch (error) {
        console.error('Error parsing XLSX with SheetJS:', error);
        return [];
    }
}

// Utility function to parse CSV content from string
function parseCSVContent(decodedContent: string): any[] {
    try {
        // Handle different line endings and split into lines
        const lines = decodedContent.split(/\r?\n/).filter(line => line.trim() !== '');

        if (lines.length === 0) {
            return [];
        }

        // Detect delimiter (comma, semicolon, tab)
        const firstLine = lines[0];
        let delimiter = ',';
        if (firstLine.includes(';') && firstLine.split(';').length > firstLine.split(',').length) {
            delimiter = ';';
        } else if (firstLine.includes('\t') && firstLine.split('\t').length > firstLine.split(',').length) {
            delimiter = '\t';
        }

        // Enhanced CSV parser that handles quoted values and different delimiters
        const parseCSVLine = (line: string): string[] => {
            if (!line) return [];

            const result: string[] = [];
            let current = '';
            let inQuotes = false;
            let i = 0;

            while (i < line.length) {
                const char = line[i];

                if (char === '"') {
                    // Handle escaped quotes
                    if (i + 1 < line.length && line[i + 1] === '"') {
                        current += '"';
                        i += 2;
                        continue;
                    }
                    inQuotes = !inQuotes;
                } else if (char === delimiter && !inQuotes) {
                    result.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
                i++;
            }

            // Add the last field
            result.push(current.trim());

            return result.map(field => field.replace(/^"|"$/g, ''));
        };

        // Parse header
        const header = parseCSVLine(lines[0]);

        if (header.length === 0) {
            return [];
        }

        // Parse data rows
        const data = [];
        for (let i = 1; i < Math.min(lines.length, 1000); i++) { // Limit to 1000 rows for performance
            const values = parseCSVLine(lines[i]);
            if (values.length === 0) continue;

            const row: any = {};
            header.forEach((col, index) => {
                row[col] = values[index] || '';
            });
            data.push(row);
        }

        return data;
    } catch (error) {
        console.error('Error parsing CSV content:', error);
        return [];
    }
}

export function CampaignDetails({ campaignId, onClose }: CampaignDetailsProps) {
    const navigate = useNavigate();
    const [showAllRows, setShowAllRows] = useState(false);

    // Campaign store for data sharing
    const {
        setCreatedCampaign,
        setCampaignInfo,
        setExcelData,
        setFileName
    } = useCampaignStore();

    // Fetch campaign data
    const {
        data: campaignData,
        isLoading: isLoadingCampaign,
        error: campaignError,
        refetch: refetchCampaign
    } = useGetCampaignById(campaignId);

    // Get the first dataset UUID (assuming we want to show the first dataset)
    const firstDatasetId = campaignData?.result?.dataset_uuids?.[0] || null;

    // Fetch dataset data
    const {
        data: datasetResponse,
        isLoading: isLoadingDataset,
        error: datasetError,
        refetch: refetchDataset
    } = useViewDataset(firstDatasetId);

    const handleBackToCampaigns = () => {
        if (onClose) {
            onClose();
        } else {
            navigate({ to: '/campaigns' });
        }
    };

    const handleDownloadDataset = () => {
        if (!datasetResponse?.result?.content) {
            console.error('No dataset content available for download');
            return;
        }

        try {
            // Decode base64 content
            const binaryString = atob(datasetResponse.result.content);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            // Determine MIME type based on dataset type
            let mimeType = 'application/octet-stream';
            let fileExtension = '';

            const datasetType = datasetResponse.result.dataset_type?.toLowerCase();
            const datasetName = datasetResponse.result.dataset_name?.toLowerCase() || '';

            if (datasetType === 'xlsx' || datasetName.endsWith('.xlsx')) {
                mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                fileExtension = '.xlsx';
            } else if (datasetType === 'csv' || datasetName.endsWith('.csv')) {
                mimeType = 'text/csv';
                fileExtension = '.csv';
            } else if (datasetName.endsWith('.xls')) {
                mimeType = 'application/vnd.ms-excel';
                fileExtension = '.xls';
            }

            // Create blob and download
            const blob = new Blob([bytes], { type: mimeType });
            const url = URL.createObjectURL(blob);

            // Create temporary anchor element for download
            const anchor = document.createElement('a');
            anchor.href = url;

            // Generate filename
            let fileName = datasetResponse.result.dataset_name || 'dataset';
            if (!fileName.includes('.')) {
                fileName += fileExtension;
            }

            anchor.download = fileName;
            document.body.appendChild(anchor);
            anchor.click();
            document.body.removeChild(anchor);

            // Clean up the URL object
            URL.revokeObjectURL(url);

            console.log('Dataset download initiated successfully');
        } catch (error) {
            console.error('Error downloading dataset:', error);
            // You could add a toast notification here if you have one
        }
    };

    const handleProceedToEnrichment = () => {
        // Check if we have all required data
        if (!campaignData?.result || !firstDatasetId || parsedData.length === 0) {
            console.error('Missing required data for navigation:', {
                campaignData: !!campaignData?.result,
                firstDatasetId: !!firstDatasetId,
                parsedDataLength: parsedData.length
            });
            return;
        }

        // Set the campaign data in the store for the preview page
        // Set campaign and dataset IDs
        setCreatedCampaign(campaignId, firstDatasetId);

        // Set campaign info
        setCampaignInfo({
            name: campaignData.result.campaign_name,
            description: campaignData.result.campaign_description
        });

        // Set the parsed data and columns
        setExcelData(parsedData, actualColumns);

        // Set a filename based on campaign name
        const fileName = `${campaignData.result.campaign_name.toLowerCase().replace(/\s+/g, '_')}_data.${datasetResponse?.result?.dataset_type || 'csv'}`;
        setFileName(fileName);

        // Navigate to preview & select page
        navigate({ to: '/campaigns/new/preview' });
    };

    // Parse dataset data
    const parsedData = (() => {
        if (!datasetResponse?.result?.content) return [];

        try {
            if (datasetResponse.result.dataset_type === 'xlsx' ||
                datasetResponse.result.dataset_name?.toLowerCase().endsWith('.xlsx')) {
                return parseXLSXWithSheetJS(datasetResponse.result.content);
            } else {
                const decodedContent = atob(datasetResponse.result.content);
                return parseCSVContent(decodedContent);
            }
        } catch (error) {
            console.error('Error parsing dataset:', error);
            return [];
        }
    })();

    const actualColumns = parsedData.length > 0 ? Object.keys(parsedData[0]) : [];
    const displayData = showAllRows ? parsedData : parsedData.slice(0, 10);

    // Calculate stats
    const recordsCount = parsedData.length;
    const columnsCount = actualColumns.length;

    // Loading states
    if (isLoadingCampaign || isLoadingDataset) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="animate-spin mx-auto mb-4" size={48} />
                    <p className="text-gray-600">Loading campaign details...</p>
                </div>
            </div>
        );
    }

    // Error states
    if (campaignError) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="mx-auto mb-4 text-red-600" size={48} />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading campaign</h3>
                    <p className="text-gray-500 mb-6">
                        {campaignError instanceof Error ? campaignError.message : 'Failed to load campaign details'}
                    </p>
                    <div className="space-x-4">
                        <button
                            onClick={() => refetchCampaign()}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                        >
                            <RefreshCw className="mr-2" size={16} />
                            Retry
                        </button>
                        <button
                            onClick={handleBackToCampaigns}
                            className="inline-flex items-center px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg"
                        >
                            Back to Campaigns
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!campaignData?.result) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 flex items-center justify-center">
                <div className="text-center">
                    <FileText className="mx-auto mb-4 text-gray-400" size={48} />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Campaign not found</h3>
                    <p className="text-gray-500 mb-6">The requested campaign could not be found.</p>
                    <button
                        onClick={handleBackToCampaigns}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                    >
                        Back to Campaigns
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100">
            {/* Header */}
            <Header />

            {/* Header with Campaign Info */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-auto">
                <div className="py-4">
                    <CampaignHeader
                        campaignName={campaignData.result.campaign_name}
                        campaignDescription={campaignData.result.campaign_description}
                        recordsCount={recordsCount}
                        columnsCount={columnsCount}
                        showBackButton={false}
                        backButtonWarningTitle="Leave Campaign Details?"
                        backButtonWarningMessage="Are you sure you want to go back to the campaigns list?"
                    />

                    {/* File Preview Section */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-2">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Dataset Preview</h2>
                            <p className="text-gray-600">
                                Review the data associated with this campaign
                            </p>
                        </div>

                        {datasetError && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                <Typography variant="body2">
                                    Failed to load dataset: {datasetError instanceof Error ? datasetError.message : 'Unknown error'}
                                </Typography>
                                <Button
                                    size="small"
                                    onClick={() => refetchDataset()}
                                    sx={{ mt: 1 }}
                                    startIcon={<RefreshCw size={16} />}
                                >
                                    Retry
                                </Button>
                            </Alert>
                        )}

                        {parsedData.length === 0 ? (
                            <Alert severity="warning">
                                No data available to preview. The dataset may be empty or there was an error loading it.
                            </Alert>
                        ) : (
                            <>
                                {/* Data Summary */}
                                <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-blue-50 rounded-lg p-4">
                                        <div className="flex items-center space-x-3">
                                            <FileText className="text-blue-600" size={20} />
                                            <div>
                                                <p className="text-sm text-blue-600 font-medium">Total Records</p>
                                                <p className="text-2xl font-bold text-blue-900">{recordsCount}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-green-50 rounded-lg p-4">
                                        <div className="flex items-center space-x-3">
                                            <Eye className="text-green-600" size={20} />
                                            <div>
                                                <p className="text-sm text-green-600 font-medium">Total Columns</p>
                                                <p className="text-2xl font-bold text-green-900">{columnsCount}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Excel Preview */}
                                <div className="mb-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-semibold text-gray-900">Data Preview</h3>
                                        <div className="flex items-center space-x-3">
                                            <button
                                                onClick={handleDownloadDataset}
                                                disabled={!datasetResponse?.result?.content || isLoadingDataset}
                                                className="flex items-center space-x-2 px-3 py-1 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-400 disabled:cursor-not-allowed text-blue-500 rounded text-sm transition-colors"
                                            >
                                                {isLoadingDataset ? (
                                                    <Loader2 className="animate-spin" size={14} />
                                                ) : (
                                                    <Download size={14} />
                                                )}
                                                <span>Download</span>
                                            </button>
                                            <button
                                                onClick={() => setShowAllRows(!showAllRows)}
                                                className="flex items-center space-x-2 px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm transition-colors"
                                            >
                                                <Eye size={16} color='black' />
                                                <span>{showAllRows ? 'Show Less' : 'Show All Rows'}</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        #
                                                    </th>
                                                    {actualColumns.map(column => (
                                                        <th
                                                            key={column}
                                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                        >
                                                            {column}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {displayData.map((row, index) => (
                                                    <tr key={index} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                            {index + 1}
                                                        </td>
                                                        {actualColumns.map(column => (
                                                            <td
                                                                key={column}
                                                                className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                                                                style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                                                title={row[column] || ''}
                                                            >
                                                                {row[column] || '-'}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="mt-4 flex justify-between items-center text-sm text-gray-500">
                                        <span>Showing {displayData.length} of {recordsCount} records</span>
                                        <span>Displaying {columnsCount} columns</span>
                                    </div>

                                    {!showAllRows && recordsCount > 10 && (
                                        <p className="text-center text-sm text-gray-500 mt-2">
                                            Click "Show All Rows" to see the complete dataset
                                        </p>
                                    )}
                                </div>

                                {/* Navigation Buttons */}
                                <div className="flex justify-between">
                                    <button
                                        onClick={handleBackToCampaigns}
                                        className="flex items-center space-x-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                                    >
                                        <ArrowLeft size={16} />
                                        <span>Back to Campaigns</span>
                                    </button>

                                    <button
                                        onClick={handleProceedToEnrichment}
                                        disabled={!campaignData?.result || !firstDatasetId || parsedData.length === 0}
                                        className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                                    >
                                        <span>Proceed to Data Cleanup and Enrichment</span>
                                        <ArrowLeft size={16} className="rotate-180" />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
} 