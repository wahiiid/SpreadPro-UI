import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Eye, FileText, Trash2, AlertCircle, RefreshCw, Info, Download } from 'lucide-react';
import { toast } from 'sonner';
import { useCampaignStore } from '@/stores/campaignStore';
import { useRemoveColumns, useGetAllColumns, useViewDataset } from '../custom-hooks/query-hooks';
import * as XLSX from 'xlsx';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Tooltip
} from '@mui/material';
import { Visibility, VisibilityOff, Delete } from '@mui/icons-material';

interface DataPreviewProps {
  data: any[];
  fileName: string;
  onNext: (columnsToDelete: string[], columnsToDeleteText: string) => void;
  onBack: () => void;
  backButtonText?: string;
  nextButtonText?: string;
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

export function DataPreview({
  data,
  fileName,
  onNext,
  onBack,
  backButtonText = "Back to Upload",
  nextButtonText = "Continue to Data Enrichment"
}: DataPreviewProps) {
  const [showAllRows, setShowAllRows] = useState(false);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [parsedColumns, setParsedColumns] = useState<string[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);

  // Get state from Zustand store
  const {
    columnsToDeleteText,
    setColumnsToDeleteText,
    excelData,
    excelColumns,
    isLoadingExcel,
    createdCampaignId,
    createdDatasetId
  } = useCampaignStore();

  // Remove columns mutation
  const removeColumnsMutation = useRemoveColumns();

  // Get all columns from API
  const {
    data: columnsResponse,
    isLoading: isLoadingColumns,
    error: columnsError,
    refetch: refetchColumns
  } = useGetAllColumns(createdCampaignId, createdDatasetId);

  // Fetch dataset from API if dataset ID is available
  const {
    data: datasetResponse,
    isLoading: isLoadingDataset,
    error: datasetError,
    refetch: refetchDataset
  } = useViewDataset(createdDatasetId);

  // Reset columnsToDeleteText when component mounts to prevent stale data
  useEffect(() => {
    setColumnsToDeleteText('');
  }, []);

  // Refetch APIs when component mounts or when returning to preview page
  useEffect(() => {
    if (createdCampaignId && createdDatasetId) {
      // Refetch both APIs to get fresh data
      refetchColumns();
      refetchDataset();
    }
  }, [createdCampaignId, createdDatasetId, refetchColumns, refetchDataset]);

  // Parse data when API response changes
  useEffect(() => {
    if (datasetResponse?.result?.content) {
      setParseError(null); // Clear any previous errors

      console.log('Dataset response received in DataPreview:', {
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

        try {
          if (datasetResponse.result.dataset_type === 'xlsx' ||
            datasetResponse.result.dataset_name?.toLowerCase().endsWith('.xlsx')) {

            // For XLSX files, the base64 content is the actual binary file data
            parsed = parseXLSXWithSheetJS(datasetResponse.result.content);
          } else {
            console.log('DataPreview: Attempting to parse CSV file...');
            // For CSV files, decode the base64 content to get the text
            const decodedContent = atob(datasetResponse.result.content);
            parsed = parseCSVContent(decodedContent);
          }

          console.log('DataPreview: Parse result:', {
            rows: parsed.length,
            columns: parsed.length > 0 ? Object.keys(parsed[0]).length : 0,
            firstRow: parsed.length > 0 ? parsed[0] : null
          });

          if (parsed.length > 0) {
            setParsedData(parsed);
            setParsedColumns(Object.keys(parsed[0]));
          } else {
            // Try fallback parsing methods
            console.log('DataPreview: Primary parsing failed, trying fallback methods...');

            if (datasetResponse.result.dataset_type === 'xlsx' ||
              datasetResponse.result.dataset_name?.toLowerCase().endsWith('.xlsx')) {

              // Try CSV fallback for XLSX (in case backend converted XLSX to CSV)
              console.log('DataPreview: Trying CSV fallback for XLSX...');
              const decodedContent = atob(datasetResponse.result.content);
              const fallbackParsed = parseCSVContent(decodedContent);
              if (fallbackParsed.length > 0) {
                setParsedData(fallbackParsed);
                setParsedColumns(Object.keys(fallbackParsed[0]));
                return;
              }
            }

            // Try JSON parsing (in case backend returns JSON data)
            console.log('DataPreview: Trying JSON parsing...');
            try {
              const decodedContent = atob(datasetResponse.result.content);
              const jsonData = JSON.parse(decodedContent);
              if (Array.isArray(jsonData) && jsonData.length > 0) {
                setParsedData(jsonData);
                setParsedColumns(Object.keys(jsonData[0]));
                return;
              }
            } catch (jsonError) {
              console.log('DataPreview: JSON parsing failed:', jsonError);
            }

            setParseError(`Failed to parse ${datasetResponse.result.dataset_type.toUpperCase()} data from the server.`);
            setParsedData([]);
            setParsedColumns([]);
          }
        } catch (parseError) {
          console.error('DataPreview: Error during parsing:', parseError);
          setParseError(`Parsing error: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}. Please check the browser console for details.`);
          setParsedData([]);
          setParsedColumns([]);
        }
      } else {
        console.warn('DataPreview: Unsupported dataset type:', datasetResponse.result.dataset_type);
        setParseError(`Unsupported dataset type: ${datasetResponse.result.dataset_type}. Expected CSV or XLSX format.`);
        setParsedData([]);
        setParsedColumns([]);
      }
    }
  }, [datasetResponse]);

  // Use API data if available, otherwise fall back to stored data
  const actualData = parsedData.length > 0 ? parsedData : (excelData || data || []);

  // Helper function to clean and filter column names
  const cleanColumns = (columns: string[]): string[] => {
    return columns
      .filter(col => col !== null && col !== undefined) // Remove null/undefined
      .map(col => String(col).trim()) // Convert to string and trim whitespace
      .filter(col => col.length > 0) // Remove empty strings
      .filter((col, index, arr) => arr.indexOf(col) === index); // Remove duplicates
  };

  let rawColumns: string[] = [];
  if (parsedColumns.length > 0) {
    rawColumns = parsedColumns;
  } else if (columnsResponse?.results) {
    rawColumns = columnsResponse.results;
  } else if (excelColumns.length > 0) {
    rawColumns = excelColumns;
  } else if (actualData.length > 0) {
    rawColumns = Object.keys(actualData[0]);
  }

  const actualColumns = cleanColumns(rawColumns);

  const displayData = showAllRows ? actualData : actualData.slice(0, 10);

  // Calculate loading and refreshing states
  const isLoading = isLoadingExcel || isLoadingDataset || isLoadingColumns;
  const isRefreshing = datasetResponse && (isLoadingDataset || isLoadingColumns);

  const handleNext = async () => {
    // Parse the comma-separated list of columns to delete
    const columnsToDeleteArray = columnsToDeleteText
      .split(',')
      .map(col => col.trim())
      .filter(col => col.length > 0);

    // If there are columns to delete and we have the required IDs, call the API
    if (columnsToDeleteArray.length > 0 && createdCampaignId && createdDatasetId) {
      try {
        await removeColumnsMutation.mutateAsync({
          campaign_uuid: createdCampaignId,
          columns_to_remove: columnsToDeleteArray,
          dataset_uuid: createdDatasetId
        });

        toast.success(`Successfully removed ${columnsToDeleteArray.length} column(s) from the dataset!`, {
          duration: 5000,
        });

        // Refetch the dataset to get updated data
        await refetchDataset();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to remove columns';
        toast.error('Failed to remove columns', {
          description: errorMessage,
          duration: 5000,
        });
        return; // Don't proceed to next step if API call failed
      }
    } else if (columnsToDeleteArray.length === 0) {
      // No columns to delete, just show a message and proceed
      toast.info('No columns selected for removal. Proceeded to data enrichment.', {
        duration: 3000,
      });
    }

    // Reset the columns to delete text before proceeding to next step
    setColumnsToDeleteText('');

    // Always proceed to next step regardless of whether columns were deleted
    onNext(columnsToDeleteArray, columnsToDeleteText);
  };

  // Handle dataset download
  const handleDownloadDataset = () => {
    if (!datasetResponse?.result?.content) {
      toast.error('No dataset content available for download');
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
      let downloadFileName = datasetResponse.result.dataset_name || fileName;
      if (!downloadFileName.includes('.')) {
        downloadFileName += fileExtension;
      }

      anchor.download = downloadFileName;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);

      // Clean up the URL object
      URL.revokeObjectURL(url);

      toast.success('Dataset downloaded successfully', {
        description: `File "${downloadFileName}" has been downloaded.`
      });

      console.log('Dataset download initiated successfully');
    } catch (error) {
      console.error('Error downloading dataset:', error);
      toast.error('Failed to download dataset', {
        description: 'An error occurred while downloading the dataset.'
      });
    }
  };

  // Get columns that will be deleted based on text input
  const columnsToDeleteArray = columnsToDeleteText
    .split(',')
    .map(col => col.trim())
    .filter(col => col.length > 0);

  // Handle clicking on column names
  const handleColumnClick = (columnName: string) => {
    const currentColumns = columnsToDeleteText
      .split(',')
      .map(col => col.trim())
      .filter(col => col.length > 0);

    if (currentColumns.includes(columnName)) {
      // Remove column if already in list
      const updatedColumns = currentColumns.filter(col => col !== columnName);
      setColumnsToDeleteText(updatedColumns.join(', '));
    } else {
      // Add column to list
      const updatedColumns = [...currentColumns, columnName];
      setColumnsToDeleteText(updatedColumns.join(', '));
    }
  };

  // Filter columns for display
  const displayColumns = actualColumns.filter(col => !columnsToDeleteArray.includes(col));

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          {isLoadingDataset ? 'Loading dataset from server...' : isLoadingColumns ? 'Loading dataset columns...' : 'Processing Excel file...'}
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
          onClick={() => refetchDataset()}
          sx={{ mt: 1 }}
          startIcon={<RefreshCw size={16} />}
        >
          Retry
        </Button>
      </Alert>
    );
  }

  if (columnsError) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        <Typography variant="body2">
          Failed to load dataset columns: {columnsError instanceof Error ? columnsError.message : 'Unknown error'}
        </Typography>
        <Button
          size="small"
          onClick={() => refetchColumns()}
          sx={{ mt: 1 }}
          startIcon={<RefreshCw size={16} />}
        >
          Retry
        </Button>
      </Alert>
    );
  }

  if (parseError) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        <Typography variant="body2">
          {parseError}
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
    );
  }

  if (actualData.length === 0) {
    return (
      <Alert severity="warning">
        No data available to preview. Please upload a valid Excel file.
      </Alert>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Preview & Column Selection</h2>
        <p className="text-gray-600 mb-4">
          Review your Excel file data and specify which columns to exclude from processing
        </p>

        <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
          <FileText className="text-gray-600" size={20} />
          <div className="flex-1">
            <button
              onClick={handleDownloadDataset}
              disabled={!datasetResponse?.result?.content}
              className="font-medium text-blue-600 hover:text-blue-800 disabled:text-gray-900 disabled:cursor-not-allowed underline-offset-4 hover:underline transition-colors text-left"
              title="Click to download the dataset"
            >
              <div className="flex items-center space-x-1">
                <span>{fileName}</span>
                {datasetResponse?.result?.content && (
                  <Download size={16} className="opacity-60" />
                )}
              </div>
            </button>
            <p className="text-sm text-gray-600">
              {actualData.length} records, {actualColumns.length} columns
            </p>
          </div>
          {datasetResponse?.result && (
            <Button
              size="small"
              onClick={() => refetchDataset()}
              startIcon={<RefreshCw size={16} />}
              disabled={isRefreshing}
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh Dataset'}
            </Button>
          )}
        </div>
      </div>

      {/* Available Columns Display */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Columns</h3>
        <p className="text-sm text-gray-600 mb-3">
          Click on column names to add/remove them from the deletion list

        </p>
        <Card>
          <CardContent>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {actualColumns.map(column => (
                <Chip
                  key={column}
                  label={column}
                  onClick={() => handleColumnClick(column)}
                  color={columnsToDeleteArray.includes(column) ? "error" : "primary"}
                  variant={columnsToDeleteArray.includes(column) ? "filled" : "outlined"}
                  deleteIcon={columnsToDeleteArray.includes(column) ? <Delete /> : undefined}
                  sx={{
                    textDecoration: columnsToDeleteArray.includes(column) ? 'line-through' : 'none',
                    cursor: 'pointer'
                  }}
                />
              ))}
            </Box>
          </CardContent>
        </Card>
      </div>

      {/* Column Deletion Input */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-3">
          <Trash2 className="text-gray-600" size={20} />
          <h3 className="text-lg font-semibold text-gray-900">Columns to Delete</h3>
        </div>

        {columnsToDeleteArray.length === 0 ? (
          // Empty state message
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <div className="flex flex-col items-center justify-center space-y-2">
              <Info className="text-gray-400" size={24} />
              <p className="text-gray-500 text-sm font-bold">
                No columns selected to delete
              </p>
              <p className="text-gray-400 text-xs">
                Click on column names above to select columns for deletion
              </p>
            </div>
          </div>
        ) : (
          // Selected columns display
          <div className="space-y-3">
            {(!createdCampaignId || !createdDatasetId) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center space-x-2">
                <div className="text-blue-600">
                  <AlertCircle size={16} />
                </div>
                <p className="text-sm text-blue-700">
                  Column removal will be processed locally. To remove columns from the server, please create a campaign first.
                </p>
              </div>
            )}

            <div className={`rounded-lg p-4 ${removeColumnsMutation.isPending
              ? 'bg-blue-50 border border-blue-200'
              : 'bg-amber-50 border border-amber-200'
              }`}>
              <div className="flex items-center space-x-2 mb-2">
                {removeColumnsMutation.isPending ? (
                  <div className="animate-spin">
                    <RefreshCw size={16} className="text-blue-600" />
                  </div>
                ) : (
                  <AlertCircle size={16} className="text-amber-600" />
                )}
                <p className="text-sm font-medium text-gray-900">
                  {removeColumnsMutation.isPending
                    ? `Removing ${columnsToDeleteArray.length} column(s)...`
                    : `${columnsToDeleteArray.length} column(s) will be deleted:`
                  }
                </p>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {columnsToDeleteArray.map(col => (
                  <span
                    key={col}
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${removeColumnsMutation.isPending
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-amber-100 text-amber-800'
                      }`}
                  >
                    {col}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Data Summary with Material UI Cards */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card sx={{ minHeight: 'auto' }}>
          <CardContent sx={{ py: 2, px: 3 }}>
            <Box display="flex" alignItems="center" gap={2}>
              <FileText className="text-blue-600" size={20} />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Total Records
                </Typography>
                <Typography variant="h6" fontWeight="bold" color="primary">
                  {actualData.length}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ minHeight: 'auto' }}>
          <CardContent sx={{ py: 2, px: 3 }}>
            <Box display="flex" alignItems="center" gap={2}>
              <Eye className="text-green-600" size={20} />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Columns Remaining
                </Typography>
                <Typography variant="h6" fontWeight="bold" color="success.main">
                  {displayColumns.length}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ minHeight: 'auto' }}>
          <CardContent sx={{ py: 2, px: 3 }}>
            <Box display="flex" alignItems="center" gap={2}>
              <Trash2 className="text-red-600" size={20} />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Columns to Delete
                </Typography>
                <Typography variant="h6" fontWeight="bold" color="error.main">
                  {columnsToDeleteArray.length}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </div>

      {/* File Preview with Material UI */}
      <div className="mb-6">
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" component="h3">
            File Preview
          </Typography>
          <Button
            variant="outlined"
            startIcon={showAllRows ? <VisibilityOff /> : <Visibility />}
            onClick={() => setShowAllRows(!showAllRows)}
          >
            {showAllRows ? 'Show Less' : 'Show All Rows'}
          </Button>
        </Box>

        <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
                  #
                </TableCell>
                {displayColumns.map(column => (
                  <TableCell
                    key={column}
                    sx={{
                      fontWeight: 'bold',
                      backgroundColor: '#f5f5f5',
                      minWidth: 120
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={1}>
                      <span>{column}</span>
                      {columnsToDeleteArray.includes(column) && (
                        <Tooltip title="This column will be deleted">
                          <Delete color="error" fontSize="small" />
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {displayData.map((row, index) => (
                <TableRow key={index} hover>
                  <TableCell sx={{ fontWeight: 'medium' }}>
                    {index + 1}
                  </TableCell>
                  {displayColumns.map(column => (
                    <TableCell key={column}>
                      <Box
                        sx={{
                          maxWidth: 200,
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

        <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
          <Typography variant="body2" color="text.secondary">
            Showing {displayData.length} of {actualData.length} records
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Displaying {displayColumns.length} of {actualColumns.length} columns
          </Typography>
        </Box>

        {!showAllRows && actualData.length > 10 && (
          <Typography variant="body2" color="text.secondary" textAlign="center" mt={2}>
            Click "Show All Rows" to see the complete dataset
          </Typography>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
        >
          <ArrowLeft size={16} />
          <span>{backButtonText}</span>
        </button>

        <button
          onClick={handleNext}
          disabled={removeColumnsMutation.isPending}
          className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          {removeColumnsMutation.isPending ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Removing Columns...</span>
            </>
          ) : (
            <>
              <span>{nextButtonText}</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}