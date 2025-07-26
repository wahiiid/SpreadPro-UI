import { useState, useRef, useEffect } from 'react';
import { Settings, Trash2, Plus, X, ChevronDown, RefreshCw, Search } from 'lucide-react';
import { useConfiguration } from '@/contexts/ConfigurationContext';
import { useCampaignStore } from '@/stores/campaignStore';
import { useGetAllColumns } from '@/custom-hooks/query-hooks';

export function DataCleanOptions() {
    const { processingConfig, updateProcessingConfig } = useConfiguration();
    const { createdCampaignId, createdDatasetId } = useCampaignStore();
    const [newSpecialChar, setNewSpecialChar] = useState('');
    const [newSuffix, setNewSuffix] = useState('');
    const [showSpecialCharColumns, setShowSpecialCharColumns] = useState(false);
    const [showSuffixColumns, setShowSuffixColumns] = useState(false);
    const [showDeduplicationColumns, setShowDeduplicationColumns] = useState(false);

    // Search states for each dropdown
    const [specialCharSearch, setSpecialCharSearch] = useState('');
    const [suffixSearch, setSuffixSearch] = useState('');
    const [deduplicationSearch, setDeduplicationSearch] = useState('');

    // Refs for click outside detection
    const specialCharDropdownRef = useRef<HTMLDivElement>(null);
    const suffixDropdownRef = useRef<HTMLDivElement>(null);
    const deduplicationDropdownRef = useRef<HTMLDivElement>(null);

    // Get all columns from API
    const {
        data: columnsResponse,
        isLoading: isLoadingColumns,
        error: columnsError,
        refetch: refetchColumns
    } = useGetAllColumns(createdCampaignId, createdDatasetId);

    // Use API columns if available, otherwise fall back to local columns
    const availableColumns = columnsResponse?.results

    // Initialize clean data config if not exists
    const cleanDataConfig = processingConfig.cleanDataConfig || {
        selectedColumns: {
            specialCharacters: [],
            companySuffixes: [],
            deduplication: []
        },
        enableSpecialCharacters: false,
        enableCompanySuffixes: false,
        enableDeduplication: false
    };

    // Click outside handlers
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (specialCharDropdownRef.current && !specialCharDropdownRef.current.contains(event.target as Node)) {
                setShowSpecialCharColumns(false);
                setSpecialCharSearch('');
            }
            if (suffixDropdownRef.current && !suffixDropdownRef.current.contains(event.target as Node)) {
                setShowSuffixColumns(false);
                setSuffixSearch('');
            }
            if (deduplicationDropdownRef.current && !deduplicationDropdownRef.current.contains(event.target as Node)) {
                setShowDeduplicationColumns(false);
                setDeduplicationSearch('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Filter columns based on search
    const filterColumns = (columns: string[], searchTerm: string) => {
        if (!searchTerm) return columns;
        return columns.filter(column =>
            column.toLowerCase().includes(searchTerm.toLowerCase())
        );
    };

    const updateCleanDataConfig = (updates: any) => {
        updateProcessingConfig({
            cleanDataConfig: {
                ...cleanDataConfig,
                ...updates
            }
        });
    };

    const addSpecialCharacter = () => {
        if (newSpecialChar && !processingConfig.specialCharacters.includes(newSpecialChar)) {
            updateProcessingConfig({
                specialCharacters: [...processingConfig.specialCharacters, newSpecialChar]
            });
            setNewSpecialChar('');
        }
    };

    const removeSpecialCharacter = (char: string) => {
        updateProcessingConfig({
            specialCharacters: processingConfig.specialCharacters.filter(c => c !== char)
        });
    };

    const addSuffix = () => {
        if (newSuffix && !processingConfig.companySuffixes.includes(newSuffix.toUpperCase())) {
            updateProcessingConfig({
                companySuffixes: [...processingConfig.companySuffixes, newSuffix.toUpperCase()]
            });
            setNewSuffix('');
        }
    };

    const removeSuffix = (suffix: string) => {
        updateProcessingConfig({
            companySuffixes: processingConfig.companySuffixes.filter(s => s !== suffix)
        });
    };

    const handleColumnToggle = (type: 'specialCharacters' | 'companySuffixes' | 'deduplication', column: string) => {
        const currentColumns = cleanDataConfig.selectedColumns[type];
        const updatedColumns = currentColumns.includes(column)
            ? currentColumns.filter(col => col !== column)
            : [...currentColumns, column];

        updateCleanDataConfig({
            selectedColumns: {
                ...cleanDataConfig.selectedColumns,
                [type]: updatedColumns
            }
        });
    };

    const handleEnableToggle = (type: 'enableSpecialCharacters' | 'enableCompanySuffixes' | 'enableDeduplication') => {
        updateCleanDataConfig({
            [type]: !cleanDataConfig[type]
        });
    };

    const getColumnDisplayText = (columns: string[]) => {
        if (columns.length === 0) return 'Select columns';
        if (columns.length === 1) return columns[0];
        return `${columns.length} columns selected`;
    };

    // Show loading state
    if (isLoadingColumns) {
        return (
            <div className="space-y-6">
                <div>
                    <h4 className="text-base font-medium text-gray-900 mb-2">Data Cleaning Options</h4>
                    <p className="text-sm text-gray-600">
                        Configure which data cleaning operations to perform and select the columns to apply them to.
                    </p>
                </div>
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mr-3"></div>
                    <span className="text-gray-600">Loading dataset columns...</span>
                </div>
            </div>
        );
    }

    // Show error state
    if (columnsError) {
        return (
            <div className="space-y-6">
                <div>
                    <h4 className="text-base font-medium text-gray-900 mb-2">Data Cleaning Options</h4>
                    <p className="text-sm text-gray-600">
                        Configure which data cleaning operations to perform and select the columns to apply them to.
                    </p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                        <div className="text-red-600">
                            <RefreshCw size={16} />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm text-red-700">
                                Failed to load dataset columns: {columnsError instanceof Error ? columnsError.message : 'Unknown error'}
                            </p>
                            <button
                                onClick={() => refetchColumns()}
                                className="text-sm text-red-600 hover:text-red-800 underline mt-1"
                            >
                                Retry loading columns
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="text-base font-medium text-gray-900 mb-2">Data Cleaning Options</h4>
                    <p className="text-sm text-gray-600">
                        Configure which data cleaning operations to perform and select the columns to apply them to.

                    </p>
                </div>
                {columnsResponse?.results && (
                    <button
                        onClick={() => refetchColumns()}
                        className="flex items-center space-x-1 px-2 py-1 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 rounded border border-blue-200 transition-colors"
                        title="Refresh columns from server"
                    >
                        <RefreshCw size={12} />
                        <span>Refresh</span>
                    </button>
                )}
            </div>

            {/* Special Characters Removal */}
            <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            checked={cleanDataConfig.enableSpecialCharacters}
                            onChange={() => handleEnableToggle('enableSpecialCharacters')}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <Settings className="text-gray-600" size={16} />
                        <h5 className="text-sm font-medium text-gray-900">Remove Special Characters</h5>
                    </div>
                </div>

                {cleanDataConfig.enableSpecialCharacters && (
                    <div className="space-y-3">
                        <p className="text-xs text-gray-600">
                            Remove these characters from selected columns:
                        </p>

                        {/* Special Characters List */}
                        <div className="flex flex-wrap gap-1">
                            {processingConfig.specialCharacters.map(char => (
                                <span
                                    key={char}
                                    className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded"
                                >
                                    {char}
                                    <button
                                        onClick={() => removeSpecialCharacter(char)}
                                        className="ml-1 text-red-600 hover:text-red-800"
                                    >
                                        <X size={10} />
                                    </button>
                                </span>
                            ))}
                        </div>

                        {/* Add Special Character */}
                        <div className="flex space-x-2">
                            <input
                                type="text"
                                value={newSpecialChar}
                                onChange={(e) => setNewSpecialChar(e.target.value)}
                                placeholder="Add character"
                                maxLength={1}
                                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            <button
                                onClick={addSpecialCharacter}
                                className="px-2 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
                            >
                                <Plus size={12} />
                            </button>
                        </div>

                        {/* Column Selection */}
                        <div ref={specialCharDropdownRef} className="relative">
                            <button
                                onClick={() => setShowSpecialCharColumns(!showSpecialCharColumns)}
                                className="flex items-center justify-between w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded hover:bg-gray-100"
                            >
                                <span>{getColumnDisplayText(cleanDataConfig.selectedColumns.specialCharacters)}</span>
                                <ChevronDown className={`transform transition-transform ${showSpecialCharColumns ? 'rotate-180' : ''}`} size={14} />
                            </button>

                            {showSpecialCharColumns && (
                                <div className="absolute z-10 mt-2 w-full max-h-64 overflow-hidden border border-gray-200 rounded bg-white shadow-lg">
                                    {/* Search Input */}
                                    <div className="p-2 border-b border-gray-200">
                                        <div className="relative">
                                            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
                                            <input
                                                type="text"
                                                value={specialCharSearch}
                                                onChange={(e) => setSpecialCharSearch(e.target.value)}
                                                placeholder="Search columns..."
                                                className="w-full pl-8 pr-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                                autoFocus
                                            />
                                        </div>
                                    </div>

                                    {/* Filtered Column List */}
                                    <div className="max-h-48 overflow-y-auto">
                                        {filterColumns(availableColumns || [], specialCharSearch).map(column => (
                                            <label key={column} className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={cleanDataConfig.selectedColumns.specialCharacters.includes(column)}
                                                    onChange={() => handleColumnToggle('specialCharacters', column)}
                                                    className="h-3 w-3 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mr-2"
                                                />
                                                <span className="text-xs text-gray-900">{column}</span>
                                            </label>
                                        ))}
                                        {filterColumns(availableColumns || [], specialCharSearch).length === 0 && (
                                            <div className="px-3 py-2 text-xs text-gray-500">
                                                No columns found matching "{specialCharSearch}"
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Company Suffixes Removal */}
            <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            checked={cleanDataConfig.enableCompanySuffixes}
                            onChange={() => handleEnableToggle('enableCompanySuffixes')}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <Trash2 className="text-gray-600" size={16} />
                        <h5 className="text-sm font-medium text-gray-900">Remove Company Suffixes</h5>
                    </div>
                </div>

                {cleanDataConfig.enableCompanySuffixes && (
                    <div className="space-y-3">
                        <p className="text-xs text-gray-600">
                            Remove these suffixes from selected columns:
                        </p>

                        {/* Company Suffixes List */}
                        <div className="flex flex-wrap gap-1">
                            {processingConfig.companySuffixes.map(suffix => (
                                <span
                                    key={suffix}
                                    className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded"
                                >
                                    {suffix}
                                    <button
                                        onClick={() => removeSuffix(suffix)}
                                        className="ml-1 text-orange-600 hover:text-orange-800"
                                    >
                                        <X size={10} />
                                    </button>
                                </span>
                            ))}
                        </div>

                        {/* Add Company Suffix */}
                        <div className="flex space-x-2">
                            <input
                                type="text"
                                value={newSuffix}
                                onChange={(e) => setNewSuffix(e.target.value)}
                                placeholder="Add suffix"
                                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            <button
                                onClick={addSuffix}
                                className="px-2 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
                            >
                                <Plus size={12} />
                            </button>
                        </div>

                        {/* Column Selection */}
                        <div ref={suffixDropdownRef} className="relative">
                            <button
                                onClick={() => setShowSuffixColumns(!showSuffixColumns)}
                                className="flex items-center justify-between w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded hover:bg-gray-100"
                            >
                                <span>{getColumnDisplayText(cleanDataConfig.selectedColumns.companySuffixes)}</span>
                                <ChevronDown className={`transform transition-transform ${showSuffixColumns ? 'rotate-180' : ''}`} size={14} />
                            </button>

                            {showSuffixColumns && (
                                <div className="absolute z-10 mt-2 w-full max-h-64 overflow-hidden border border-gray-200 rounded bg-white shadow-lg">
                                    {/* Search Input */}
                                    <div className="p-2 border-b border-gray-200">
                                        <div className="relative">
                                            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
                                            <input
                                                type="text"
                                                value={suffixSearch}
                                                onChange={(e) => setSuffixSearch(e.target.value)}
                                                placeholder="Search columns..."
                                                className="w-full pl-8 pr-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                                autoFocus
                                            />
                                        </div>
                                    </div>

                                    {/* Filtered Column List */}
                                    <div className="max-h-48 overflow-y-auto">
                                        {filterColumns(availableColumns || [], suffixSearch).map(column => (
                                            <label key={column} className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={cleanDataConfig.selectedColumns.companySuffixes.includes(column)}
                                                    onChange={() => handleColumnToggle('companySuffixes', column)}
                                                    className="h-3 w-3 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mr-2"
                                                />
                                                <span className="text-xs text-gray-900">{column}</span>
                                            </label>
                                        ))}
                                        {filterColumns(availableColumns || [], suffixSearch).length === 0 && (
                                            <div className="px-3 py-2 text-xs text-gray-500">
                                                No columns found matching "{suffixSearch}"
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Deduplication */}
            <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            checked={cleanDataConfig.enableDeduplication}
                            onChange={() => handleEnableToggle('enableDeduplication')}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <Trash2 className="text-gray-600" size={16} />
                        <h5 className="text-sm font-medium text-gray-900">Remove Duplicates</h5>
                    </div>
                </div>

                {cleanDataConfig.enableDeduplication && (
                    <div className="space-y-3">
                        <p className="text-xs text-gray-600">
                            Remove duplicate entries based on selected columns:
                        </p>

                        {/* Column Selection */}
                        <div ref={deduplicationDropdownRef} className="relative">
                            <button
                                onClick={() => setShowDeduplicationColumns(!showDeduplicationColumns)}
                                className="flex items-center justify-between w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded hover:bg-gray-100"
                            >
                                <span>{getColumnDisplayText(cleanDataConfig.selectedColumns.deduplication)}</span>
                                <ChevronDown className={`transform transition-transform ${showDeduplicationColumns ? 'rotate-180' : ''}`} size={14} />
                            </button>

                            {showDeduplicationColumns && (
                                <div className="absolute z-10 mt-2 w-full max-h-64 overflow-hidden border border-gray-200 rounded bg-white shadow-lg">
                                    {/* Search Input */}
                                    <div className="p-2 border-b border-gray-200">
                                        <div className="relative">
                                            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
                                            <input
                                                type="text"
                                                value={deduplicationSearch}
                                                onChange={(e) => setDeduplicationSearch(e.target.value)}
                                                placeholder="Search columns..."
                                                className="w-full pl-8 pr-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                                autoFocus
                                            />
                                        </div>
                                    </div>

                                    {/* Filtered Column List */}
                                    <div className="max-h-48 overflow-y-auto">
                                        {filterColumns(availableColumns || [], deduplicationSearch).map(column => (
                                            <label key={column} className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={cleanDataConfig.selectedColumns.deduplication.includes(column)}
                                                    onChange={() => handleColumnToggle('deduplication', column)}
                                                    className="h-3 w-3 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mr-2"
                                                />
                                                <span className="text-xs text-gray-900">{column}</span>
                                            </label>
                                        ))}
                                        {filterColumns(availableColumns || [], deduplicationSearch).length === 0 && (
                                            <div className="px-3 py-2 text-xs text-gray-500">
                                                No columns found matching "{deduplicationSearch}"
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
} 