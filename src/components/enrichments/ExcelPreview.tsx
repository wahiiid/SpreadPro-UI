import { useState, useEffect } from 'react';
import { FileText, RefreshCw, Download, ChevronRight } from 'lucide-react';
import { useCampaignStore } from '@/stores/campaignStore';
import { useViewDataset } from '@/custom-hooks/query-hooks';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Box,
    Typography,
    Button,
    CircularProgress,
    Alert
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

// Utility function to parse XLSX files using SheetJS
function parseXLSXWithSheetJS(base64Content: string): any[] {
    try {
        console.log('Starting XLSX parsing with SheetJS...');

        // Decode base64 to binary
        const binaryString = atob(base64Content);
        console.log('Base64 decoded, binary length:', binaryString.length);

        // Convert binary string to Uint8Array
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        console.log('Converted to Uint8Array, length:', bytes.length);

        // Read the workbook
        const workbook = XLSX.read(bytes, { type: 'array' });
        console.log('Workbook read successfully, sheets:', workbook.SheetNames);

        // Get the first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        if (!worksheet) {
            console.error('No worksheet found in XLSX file');
            return [];
        }

        console.log('Worksheet found:', firstSheetName);

        // Convert worksheet to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1, // Use array format
            defval: '', // Default value for empty cells
            raw: false // Convert all values to strings
        });

        console.log('JSON data extracted, rows:', jsonData.length);

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

        console.log('Data conversion completed, rows:', data.length);
        return data;

    } catch (error) {
        console.error('Error in parseXLSXWithSheetJS:', error);
        console.error('Base64 content preview:', base64Content.substring(0, 100) + '...');
        return [];
    }
}

// Utility function to parse CSV, XLSX, and XLS files from base64 content

// Utility function to parse CSV content from string
function parseCSVContent(decodedContent: string): any[] {
    try {
        console.log('Starting CSV parsing...');
        console.log('Decoded content length:', decodedContent.length);
        console.log('Content preview:', decodedContent.substring(0, 200) + '...');

        // Handle different line endings and split into lines
        const lines = decodedContent.split(/\r?\n/).filter(line => line.trim() !== '');
        console.log('Lines after splitting:', lines.length);

        if (lines.length === 0) {
            console.warn('No lines found in CSV content');
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

        console.log('Detected delimiter:', delimiter);
        console.log('First line:', firstLine);

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
        console.log('Parsed header:', header);

        if (header.length === 0) {
            console.warn('No headers found in CSV');
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

        console.log('CSV parsing completed, rows:', data.length);
        return data;

    } catch (error) {
        console.error('Error parsing CSV content:', error);
        console.error('Decoded content preview:', decodedContent.substring(0, 200) + '...');
        return [];
    }
}

// Utility function to parse XLSX from base64 content

// Utility function to download the current dataset
const downloadCurrentDataset = (data: any[], filename: string, datasetType?: string) => {
    try {
        if (data.length === 0) {
            toast.error('No data to download');
            return;
        }

        const headers = Object.keys(data[0]);

        // Determine file format from filename or dataset type
        const isExcelFile = filename?.toLowerCase().endsWith('.xlsx') ||
            filename?.toLowerCase().endsWith('.xls') ||
            datasetType === 'xlsx';

        if (isExcelFile) {
            // Create XLSX file using SheetJS
            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

            // Generate binary string
            const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

            // Create blob and download
            const blob = new Blob([excelBuffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;

            // Preserve original extension or default to .xlsx
            const baseFilename = filename ? filename.replace(/\.[^/.]+$/, '') : 'dataset';
            link.download = `${baseFilename}.xlsx`;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success('Excel file downloaded successfully!', {
                description: `Saved as: ${link.download}`,
                duration: 3000,
            });
        } else {
            // Create CSV content
            let content = headers.join(',') + '\n';
            data.forEach(row => {
                content += headers.map(header => {
                    const value = row[header] || '';
                    // Escape special characters and wrap in quotes if needed
                    return /[,"\n]/.test(value)
                        ? `"${value.replace(/"/g, '""')}"`
                        : value;
                }).join(',') + '\n';
            });

            // Create blob and download
            const blob = new Blob([content], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;

            // Preserve original extension or default to .csv
            const baseFilename = filename ? filename.replace(/\.[^/.]+$/, '') : 'dataset';
            link.download = `${baseFilename}.csv`;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success('CSV file downloaded successfully!', {
                description: `Saved as: ${link.download}`,
                duration: 3000,
            });
        }
    } catch (error) {
        console.error('Download error:', error);
        toast.error('Failed to download file', {
            description: error instanceof Error ? error.message : 'An unexpected error occurred',
            duration: 3000,
        });
    }
};

export function ExcelPreview() {
    const [showAllRows, setShowAllRows] = useState(false);
    const [parsedData, setParsedData] = useState<any[]>([]);
    const [parsedColumns, setParsedColumns] = useState<string[]>([]);
    const [parseError, setParseError] = useState<string | null>(null);

    // Get state from Zustand store
    const {
        excelData,
        excelColumns,
        isLoadingExcel,
        fileName,
        createdDatasetId
    } = useCampaignStore();

    // Fetch dataset from API if dataset ID is available
    const { data: datasetResponse, isLoading: isLoadingDataset, error: datasetError, refetch, isFetching } = useViewDataset(createdDatasetId);

    // Calculate loading and refreshing states
    const isLoading = isLoadingExcel || isLoadingDataset;
    const isRefreshing = isFetching && !isLoadingDataset;

    // Handle data refresh notifications
    useEffect(() => {
        if (isRefreshing && createdDatasetId) {
            toast.info('Refreshing dataset preview...', {
                description: 'Loading updated data after processing operations.',
                duration: 3000,
            });
        }
    }, [isRefreshing, createdDatasetId]);

    // Update parsed data when API response changes
    useEffect(() => {
        if (datasetResponse?.result?.content) {
            setParseError(null); // Clear any previous errors

            console.log('Dataset response received:', {
                dataset_type: datasetResponse.result.dataset_type,
                dataset_name: datasetResponse.result.dataset_name,
                content_length: datasetResponse.result.content?.length || 0,
                encoding: datasetResponse.result.encoding
            });

            // Check if the dataset type is supported
            if (datasetResponse.result.dataset_type === 'csv' ||
                datasetResponse.result.dataset_type === 'xlsx' ||
                datasetResponse.result.dataset_name?.toLowerCase().endsWith('.csv') ||
                datasetResponse.result.dataset_name?.toLowerCase().endsWith('.xlsx')) {

                let parsed;
                let parseMethod = '';

                try {
                    if (datasetResponse.result.dataset_type === 'xlsx' ||
                        datasetResponse.result.dataset_name?.toLowerCase().endsWith('.xlsx')) {
                        console.log('Attempting to parse XLSX file with SheetJS...');
                        // For XLSX files, the base64 content is the actual binary file data
                        parsed = parseXLSXWithSheetJS(datasetResponse.result.content);
                        parseMethod = 'SheetJS XLSX';
                    } else {
                        console.log('Attempting to parse CSV file...');
                        // For CSV files, decode the base64 content to get the text
                        const decodedContent = atob(datasetResponse.result.content);
                        parsed = parseCSVContent(decodedContent);
                        parseMethod = 'CSV Parser';
                    }

                    console.log('Parse result:', {
                        method: parseMethod,
                        rows: parsed.length,
                        columns: parsed.length > 0 ? Object.keys(parsed[0]).length : 0,
                        firstRow: parsed.length > 0 ? parsed[0] : null
                    });

                    if (parsed.length > 0) {
                        setParsedData(parsed);
                        setParsedColumns(Object.keys(parsed[0]));
                    } else {
                        // Try fallback parsing methods
                        console.log('Primary parsing failed, trying fallback methods...');

                        if (datasetResponse.result.dataset_type === 'xlsx' ||
                            datasetResponse.result.dataset_name?.toLowerCase().endsWith('.xlsx')) {

                            // Try CSV fallback for XLSX (in case backend converted XLSX to CSV)
                            console.log('Trying CSV fallback for XLSX...');
                            const decodedContent = atob(datasetResponse.result.content);
                            const fallbackParsed = parseCSVContent(decodedContent);
                            if (fallbackParsed.length > 0) {
                                setParsedData(fallbackParsed);
                                setParsedColumns(Object.keys(fallbackParsed[0]));
                                parseMethod = 'CSV Fallback for XLSX';
                                return;
                            }
                        }

                        // Try JSON parsing (in case backend returns JSON data)
                        console.log('Trying JSON parsing...');
                        try {
                            const decodedContent = atob(datasetResponse.result.content);
                            const jsonData = JSON.parse(decodedContent);
                            if (Array.isArray(jsonData) && jsonData.length > 0) {
                                setParsedData(jsonData);
                                setParsedColumns(Object.keys(jsonData[0]));
                                parseMethod = 'JSON Parser';
                                return;
                            }
                        } catch (jsonError) {
                            console.log('JSON parsing failed:', jsonError);
                        }

                        // If all parsing methods failed
                        console.error('All parsing methods failed for dataset:', {
                            type: datasetResponse.result.dataset_type,
                            name: datasetResponse.result.dataset_name,
                            contentPreview: datasetResponse.result.content.substring(0, 100) + '...'
                        });

                        setParseError(`Failed to parse ${datasetResponse.result.dataset_type.toUpperCase()} data from the server. The backend might be sending data in an unexpected format. Please check the browser console for detailed error information.`);
                        setParsedData([]);
                        setParsedColumns([]);
                    }
                } catch (parseError) {
                    console.error('Error during parsing:', parseError);
                    setParseError(`Parsing error: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}. Please check the browser console for details.`);
                    setParsedData([]);
                    setParsedColumns([]);
                }
            } else {
                console.warn('Unsupported dataset type:', datasetResponse.result.dataset_type);
                setParseError(`Unsupported dataset type: ${datasetResponse.result.dataset_type}. Expected CSV or XLSX format.`);
                setParsedData([]);
                setParsedColumns([]);
            }
        }
    }, [datasetResponse, createdDatasetId]);

    // Use API data if available, otherwise fall back to stored data
    const actualData = parsedData.length > 0 ? parsedData : (excelData || []);
    const actualColumns = parsedColumns.length > 0 ? parsedColumns : (excelColumns.length > 0 ? excelColumns : (actualData.length > 0 ? Object.keys(actualData[0]) : []));

    const displayData = showAllRows ? actualData : actualData.slice(0, 6);

    const handleRefresh = () => {
        if (createdDatasetId) {
            refetch();
        }
    };

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
                <Typography variant="h6" sx={{ ml: 2 }}>
                    {isLoadingDataset ? 'Loading updated dataset...' : 'Processing Excel file...'}
                </Typography>
            </Box>
        );
    }

    if (datasetError) {
        return (
            <Alert severity="error" sx={{ mb: 2 }}>
                <Typography variant="body2">
                    Failed to load dataset: {datasetError instanceof Error ? datasetError.message : 'Unknown error'}
                </Typography>
                <Button
                    size="small"
                    onClick={handleRefresh}
                    sx={{ mt: 1 }}
                    startIcon={<RefreshCw size={16} />}
                >
                    Retry
                </Button>
            </Alert>
        );
    }

    // Show parse error but continue with fallback data
    if (parseError) {
        return (
            <div className="space-y-4">
                <Alert severity="warning" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                        <strong>Dataset parsing failed:</strong> {parseError}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                        Falling back to original uploaded data preview.
                    </Typography>
                    <Button
                        size="small"
                        onClick={handleRefresh}
                        sx={{ mt: 1 }}
                        startIcon={<RefreshCw size={16} />}
                    >
                        Retry API Data
                    </Button>
                </Alert>

                {/* Show original data if available */}
                {excelData && excelData.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <FileText className="text-gray-600" size={20} />
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Original File Preview</h3>
                                    <p className="text-sm text-gray-500">
                                        {fileName || 'Unknown file'} • {excelData.length} records, {excelColumns.length} columns
                                    </p>
                                </div>
                            </div>

                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={showAllRows ? <VisibilityOff /> : <Visibility />}
                                onClick={() => setShowAllRows(!showAllRows)}
                            >
                                {showAllRows ? 'Show Less' : 'Show All'}
                            </Button>
                        </div>

                        <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                            <Table stickyHeader size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', minWidth: 40 }}>
                                            #
                                        </TableCell>
                                        {excelColumns.map(column => (
                                            <TableCell
                                                key={column}
                                                sx={{
                                                    fontWeight: 'bold',
                                                    backgroundColor: '#f5f5f5',
                                                    minWidth: 120,
                                                    fontSize: '0.75rem'
                                                }}
                                            >
                                                {column}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {(showAllRows ? excelData : excelData.slice(0, 6)).map((row, index) => (
                                        <TableRow key={index} hover>
                                            <TableCell sx={{ fontWeight: 'medium', fontSize: '0.75rem' }}>
                                                {index + 1}
                                            </TableCell>
                                            {excelColumns.map(column => (
                                                <TableCell key={column} sx={{ fontSize: '0.75rem' }}>
                                                    <Box
                                                        sx={{
                                                            maxWidth: 150,
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap'
                                                        }}
                                                        title={row[column] || ''}
                                                    >
                                                        {row[column] || '-'}
                                                    </Box>
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </div>
                )}
            </div>
        );
    }

    if (actualData.length === 0) {
        return (
            <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2">
                    No data available to preview. Please upload a valid Excel file on the <b>Upload Data</b> tab.
                </Typography>
                {createdDatasetId && (
                    <Button
                        size="small"
                        onClick={handleRefresh}
                        sx={{ mt: 1 }}
                        startIcon={<RefreshCw size={16} />}
                    >
                        Refresh Data
                    </Button>
                )}
            </Alert>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <FileText className="text-gray-600" size={20} />
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                            <span>{createdDatasetId ? 'Updated Dataset Preview' : 'File Preview'}</span>
                            {isRefreshing && (
                                <div className="flex items-center space-x-1">
                                    <CircularProgress size={16} />
                                    <span className="text-sm font-normal text-blue-600">Refreshing...</span>
                                </div>
                            )}
                        </h3>
                        <p className="text-sm text-gray-500">
                            {datasetResponse?.result?.dataset_name || fileName || 'Unknown file'} • {actualData.length} records, {actualColumns.length} columns
                        </p>
                        {createdDatasetId && (
                            <p className="text-xs text-blue-600">

                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    {createdDatasetId && (
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={handleRefresh}
                            startIcon={<RefreshCw size={16} />}
                        >
                            Refresh
                        </Button>
                    )}

                    <Button
                        variant="outlined"
                        size="small"
                        onClick={() => downloadCurrentDataset(
                            actualData,
                            datasetResponse?.result?.dataset_name || fileName || 'dataset',
                            datasetResponse?.result?.dataset_type
                        )}
                        startIcon={<Download size={16} />}
                    >
                        Download
                    </Button>

                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={showAllRows ? <VisibilityOff /> : <Visibility />}
                        onClick={() => setShowAllRows(!showAllRows)}
                    >
                        {showAllRows ? 'Show Less' : 'Show All'}
                    </Button>
                </div>
            </div>

            {/* Data source indicator */}
            {createdDatasetId && (
                <Alert severity={isRefreshing ? "warning" : "info"} sx={{ mb: 2 }}>
                    <div className="flex items-center space-x-2">
                        {isRefreshing ? (
                            <CircularProgress size={16} />
                        ) : (
                            <ChevronRight size={16} />
                        )}
                        <Typography variant="body2">
                            {isRefreshing
                                ? 'Refreshing dataset preview with latest changes...'
                                : 'This preview shows the updated dataset from the server after processing operations.'
                            }
                        </Typography>
                    </div>
                </Alert>
            )}

            {/* Table */}
            <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', minWidth: 40 }}>
                                #
                            </TableCell>
                            {actualColumns.map(column => (
                                <TableCell
                                    key={column}
                                    sx={{
                                        fontWeight: 'bold',
                                        backgroundColor: '#f5f5f5',
                                        minWidth: 120,
                                        fontSize: '0.75rem'
                                    }}
                                >
                                    {column}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {displayData.map((row, index) => (
                            <TableRow key={index} hover>
                                <TableCell sx={{ fontWeight: 'medium', fontSize: '0.75rem' }}>
                                    {index + 1}
                                </TableCell>
                                {actualColumns.map(column => (
                                    <TableCell key={column} sx={{ fontSize: '0.75rem' }}>
                                        <Box
                                            sx={{
                                                maxWidth: 150,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}
                                            title={row[column] || ''}
                                        >
                                            {row[column] || '-'}
                                        </Box>
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Footer */}
            <div className="flex justify-between items-center text-sm text-gray-500">
                <span>
                    Showing {displayData.length} of {actualData.length} records
                </span>
                {!showAllRows && actualData.length > 6 && (
                    <span>
                        Click "Show All" to see the complete dataset
                    </span>
                )}
            </div>
        </div>
    );
} 