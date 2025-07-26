import React, { useState, useCallback, useEffect } from 'react';
import { Upload, FileText, AlertCircle, Loader2, Edit3 } from 'lucide-react';
import { toast } from 'sonner';
import { useCampaignStore } from '@/stores/campaignStore';
import { useCreateCampaign, useEditCampaign, useViewDataset } from '../custom-hooks/query-hooks';
import { GetCampaignByIdResponse, Campaign } from '../custom-hooks/query-types';

interface FileUploadProps {
  onFileUpload: (data: any[], filename: string, campaignInfo: any) => void;
  editMode?: boolean;
  campaignToEdit?: Campaign | null;
  onClose?: () => void;
  isLoadingExistingData?: boolean;
  existingCampaignData?: GetCampaignByIdResponse;
  onContinueWithExistingData?: () => void;
}

export function NewCampaign({
  onFileUpload,
  editMode = false,
  campaignToEdit = null,
  onClose,
  isLoadingExistingData = false,
  existingCampaignData,
  onContinueWithExistingData
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string>('');

  // Get state from Zustand store
  const {
    campaignInfo,
    setCampaignInfo,
    setCreatedCampaign,
    setUploadedData,
    setFileName,
    setCurrentStep,
    uploadedFile,
    setUploadedFile,
    createdCampaignId,
    isLoadingExcel,
    startNewCampaign
  } = useCampaignStore();

  // Create campaign mutation
  const createCampaignMutation = useCreateCampaign();

  // Edit campaign mutation
  const editCampaignMutation = useEditCampaign();

  // Get the first dataset UUID from existing campaign data
  const firstDatasetUuid = existingCampaignData?.result?.dataset_uuids?.[0] || null;

  // Fetch dataset details to get the file name
  const {
    data: existingDatasetData,
    isLoading: isLoadingDatasetDetails
  } = useViewDataset(firstDatasetUuid);

  // Clear state when starting a new campaign (not in edit mode)
  // Only clear if there's no existing campaign data in the store
  useEffect(() => {
    if (!editMode && !campaignToEdit && !createdCampaignId) {
      startNewCampaign();
    }
  }, [editMode, campaignToEdit, createdCampaignId, startNewCampaign]);

  useEffect(() => {
    if (editMode && campaignToEdit) {
      setCampaignInfo({
        name: campaignToEdit.name,
        description: campaignToEdit.description || ''
      });
      // Set a dummy file for display purposes (since file upload is under development)
      setUploadedFile(new File([''], campaignToEdit.name + '_data.csv', { type: 'text/csv' }));
    }
  }, [editMode, campaignToEdit, setCampaignInfo, setUploadedFile]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFile = async (file: File) => {
    setError('');

    try {
      // Validate file extension
      const allowedExtensions = ['.csv', '.xlsx'];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      if (!allowedExtensions.includes(fileExtension)) {
        throw new Error(`Invalid file type. Only ${allowedExtensions.join(' and ')} files are allowed.`);
      }

      // Validate file type
      const validTypes = ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
      if (!validTypes.includes(file.type)) {
        throw new Error(`Invalid file format. Please ensure your file is a valid CSV or Excel (.xlsx) file.`);
      }

      // Validate file size (50MB limit)
      const maxSize = 50 * 1024 * 1024; // 50MB in bytes
      if (file.size > maxSize) {
        const sizeMB = Math.round(file.size / (1024 * 1024));
        throw new Error(`File size (${sizeMB}MB) exceeds the 50MB limit. Please upload a smaller file.`);
      }

      setUploadedFile(file);

      // Parse Excel/CSV file
      if (file.type.includes('sheet') || file.type.includes('excel') || file.type.includes('csv')) {
        await useCampaignStore.getState().parseExcelFile(file);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file');
      setUploadedFile(null);
    }
  };

  const handleCreateCampaign = async () => {
    if (!campaignInfo.name.trim()) {
      setError('Please enter a campaign name');
      return;
    }

    if (!uploadedFile) {
      setError('Please upload a file first');
      return;
    }

    try {
      const result = await createCampaignMutation.mutateAsync({
        campaign_name: campaignInfo.name,
        campaign_description: campaignInfo.description || undefined,
        dataset: uploadedFile
      });

      // Show success toast
      toast.success(`Campaign "${campaignInfo.name}" has been created successfully!`, {
        duration: 5000,
      });

      // Store the created campaign data for the next step
      const campaignId = result.results[0]?.campaign_id;
      const datasetId = result.results[1]?.dataset_id;

      if (campaignId && datasetId) {
        setCreatedCampaign(campaignId, datasetId);
      }

      // Set the required data for the preview step
      setFileName(uploadedFile.name);
      setUploadedData([]); // We'll populate this with actual data when you provide the API
      setCurrentStep(1); // Move to preview step

      // Call the callback with the created campaign data to navigate to preview
      onFileUpload([], uploadedFile.name, campaignInfo);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create campaign';
      setError(errorMessage);

      // Show error toast
      toast.error('Failed to create campaign', {
        description: errorMessage,
        duration: 5000,
      });
    }
  };

  const handleEditCampaign = async () => {
    if (!campaignInfo.name.trim()) {
      setError('Please enter a campaign name');
      return;
    }

    if (!campaignToEdit) {
      setError('No campaign to edit');
      return;
    }

    try {
      await editCampaignMutation.mutateAsync({
        campaignUuid: campaignToEdit.campaign_id,
        data: {
          campaign_name: campaignInfo.name,
          campaign_description: campaignInfo.description || undefined,
        }
      });

      // Show success toast
      toast.success(`Campaign "${campaignInfo.name}" has been updated successfully!`, {
        duration: 5000,
      });

      // Close the modal if onClose is provided
      if (onClose) {
        onClose();
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update campaign';
      setError(errorMessage);

      // Show error toast
      toast.error('Failed to update campaign', {
        description: errorMessage,
        duration: 5000,
      });
    }
  };

  return (
    <div className="text-center">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-2">
          {editMode ? (
            <>
              <Edit3 className="h-6 w-6 text-blue-600" />
              Edit Campaign
            </>
          ) : createdCampaignId ? (
            'Continue Campaign'
          ) : (
            'Create New Campaign'
          )}
        </h2>
        <p className="text-gray-600 mb-6">
          {editMode
            ? 'Update your campaign details and information'
            : createdCampaignId
              ? 'Continue with your existing campaign or upload a new file'
              : 'Set up your campaign details and upload your contact data file'
          }
        </p>

        {isLoadingExistingData && (
          <div className="mb-4 flex items-center justify-center py-2">
            <Loader2 className="animate-spin mr-2" size={20} />
            <span className="text-gray-600">Loading existing campaign data...</span>
          </div>
        )}
      </div>

      {/* Campaign Information Form */}
      <div className="mb-8 max-w-2xl mx-auto">
        <div className={`${createdCampaignId && !editMode ? 'bg-green-50 border-2 border-green-200' : 'bg-gray-50'} p-6 rounded-xl space-y-6`}>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 text-left">Campaign Information</h3>
            {createdCampaignId && !editMode && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                ✓ Campaign Created
              </span>
            )}
            {editMode && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                <Edit3 className="h-4 w-4 mr-1" />
                Edit Mode
              </span>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
              Campaign Name
              <span className="text-xs text-red-500"> * </span>
            </label>
            <input
              type="text"
              value={campaignInfo.name}
              onChange={(e) => setCampaignInfo({ ...campaignInfo, name: e.target.value })}
              placeholder="Enter campaign name (e.g., Q1 Product Launch)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
              Campaign Description
            </label>
            <textarea
              value={campaignInfo.description}
              onChange={(e) => setCampaignInfo({ ...campaignInfo, description: e.target.value })}
              placeholder="Describe your campaign goals and target audience..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
            />
          </div>
        </div>
      </div>

      {/* Existing Data Section - Show when coming from CampaignDetails */}
      {existingCampaignData?.result && createdCampaignId && !editMode && (
        <div className="mb-8 max-w-2xl mx-auto">
          <div className="bg-blue-50 border-2 border-blue-200 p-6 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-blue-900 text-left">Dataset :</h3>

            </div>

            {existingDatasetData?.result?.dataset_name && (
              <div className="mb-2 p-1.5 bg-white rounded-lg border border-blue-200">
                <div className="flex items-center space-x-2">
                  <FileText className="text-blue-600" size={16} />
                  <span className="text-blue-700">{existingDatasetData.result.dataset_name}</span>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
              <button
                onClick={onContinueWithExistingData}
                disabled={isLoadingDatasetDetails}
                className="w-fit flex items-center justify-center mt-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
              >
                {isLoadingDatasetDetails ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={16} />
                    Loading...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2" size={16} />
                    Continue with Existing Data
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File Upload Section */}
      <div
        className={`
          relative border-2 border-dashed rounded-xl p-12 transition-all duration-200
          ${dragActive && !editMode
            ? 'border-indigo-400 bg-indigo-50'
            : editMode
              ? 'border-gray-300 bg-gray-50'
              : 'border-gray-300 hover:border-gray-400'
          }
          ${(createCampaignMutation.isPending || editCampaignMutation.isPending || isLoadingExcel) ? 'opacity-50 pointer-events-none' : ''}
        `}
        onDragEnter={!editMode ? handleDrag : undefined}
        onDragLeave={!editMode ? handleDrag : undefined}
        onDragOver={!editMode ? handleDrag : undefined}
        onDrop={!editMode ? handleDrop : undefined}
      >
        {!editMode && (
          <input
            type="file"
            accept=".csv,.xlsx"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={createCampaignMutation.isPending || isLoadingExcel}
          />
        )}

        <div className="flex flex-col items-center space-y-4">
          <div className={`
              p-4 rounded-full transition-colors duration-200
              ${dragActive && !editMode ? 'bg-indigo-100' : editMode ? 'bg-blue-100' : 'bg-gray-100'}
            `}>
            {editMode ? (
              <FileText size={48} className="text-blue-600" />
            ) : (
              <Upload size={48} className={dragActive ? 'text-indigo-600' : 'text-gray-400'} />
            )}
          </div>

          <div>
            <p className="text-lg font-medium text-gray-900 mb-2">
              {editMode
                ? `Current file: ${uploadedFile?.name || 'No file attached'}`
                : createCampaignMutation.isPending
                  ? 'Creating campaign...'
                  : isLoadingExcel
                    ? 'Processing Excel file...'
                    : uploadedFile
                      ? `File uploaded: ${uploadedFile.name}`
                      : 'Drop your file here or click to browse'
              }
            </p>
            <p className="text-sm text-gray-500">
              {editMode
                ? 'File upload feature is under development'
                : 'Supports CSV and Excel (.xlsx) files up to 50MB'
              }
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
          <AlertCircle size={20} className="text-red-600" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* Action Button */}
      {(uploadedFile || editMode) && (
        <div className="mt-6 space-y-3 flex flex-col items-center">
          {editMode ? (
            // Edit Campaign button
            <div className="flex gap-3">
              <button
                onClick={handleEditCampaign}
                disabled={!campaignInfo.name.trim() || editCampaignMutation.isPending}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center"
              >
                {editCampaignMutation.isPending ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={20} />
                    Updating Campaign...
                  </>
                ) : (
                  <>
                    <Edit3 className="mr-2" size={20} />
                    Update Campaign
                  </>
                )}
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="px-8 py-3 bg-gray-300 hover:bg-gray-400 text-black font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          ) : createdCampaignId ? (
            <>
              {/* Continue to Preview button (campaign already created) */}
              <button
                onClick={() => {
                  setCurrentStep(1);
                  onFileUpload([], uploadedFile?.name || '', campaignInfo);
                }}
                className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white w-fit font-medium rounded-lg transition-colors flex items-center justify-center"
              >
                Continue to Preview
              </button>

              {/* Start New Campaign button */}
              <button
                onClick={() => {
                  startNewCampaign();
                  setError('');
                }}
                className="w-fit px-8 py-3 bg-gray-300 hover:bg-gray-400 text-black font-medium rounded-lg transition-colors flex items-center justify-center"
              >
                Start New Campaign
              </button>
            </>
          ) : (
            // Create Campaign button (new campaign)
            <button
              onClick={handleCreateCampaign}
              disabled={!campaignInfo.name.trim() || createCampaignMutation.isPending}
              className="w-fit px-8 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center"
            >
              {createCampaignMutation.isPending ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={20} />
                  Creating Campaign...
                </>
              ) : (
                'Create Campaign'
              )}
            </button>
          )}
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 p-6 rounded-lg">
          <FileText className="text-blue-600 mb-3" size={24} />
          <h3 className="font-semibold text-gray-900 mb-2">Supported Formats</h3>
          <p className="text-sm text-gray-600">CSV and Excel (.xlsx) files only</p>
        </div>

        <div className="bg-green-50 p-6 rounded-lg">
          <Upload className="text-green-600 mb-3" size={24} />
          <h3 className="font-semibold text-gray-900 mb-2">Required Data</h3>
          <p className="text-sm text-gray-600">Contact info, company names, LinkedIn URLs</p>
        </div>

        <div className="bg-purple-50 p-6 rounded-lg">
          <AlertCircle className="text-purple-600 mb-3" size={24} />
          <h3 className="font-semibold text-gray-900 mb-2">Data Privacy</h3>
          <p className="text-sm text-gray-600">All data processed securely and not stored</p>
        </div>
      </div>
    </div>
  );
}