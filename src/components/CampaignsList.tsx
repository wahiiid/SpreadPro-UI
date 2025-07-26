import { Mail, Plus, TrendingUp, MoreVertical, Play, Pause, Edit, Trash2, Loader2, Ban, LogIn, Search, X, Download } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Header } from './Header';
import { NewCampaign } from './NewCampaign';
import { useCampaigns, useDeleteCampaign, useGetCampaignById, useViewDataset } from '../custom-hooks/query-hooks';
import { Campaign } from '../custom-hooks/query-types';
import { useAuthStore } from '../custom-hooks/auth-store';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import React from 'react';

interface CampaignsListProps {
  onNewCampaign: () => void;
}

export function CampaignsList({ onNewCampaign }: CampaignsListProps) {
  const navigate = useNavigate();
  const { isAuthenticated, keycloak } = useAuthStore();
  const { data: campaignsResponse, isLoading, error } = useCampaigns();
  const campaigns = campaignsResponse?.results || [];
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null);
  const [campaignToEdit, setCampaignToEdit] = useState<Campaign | null>(null);
  const [campaignToDownload, setCampaignToDownload] = useState<Campaign | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const deleteCampaignMutation = useDeleteCampaign();

  // Fetch campaign details for download
  const {
    data: campaignDetailsForDownload,
    isLoading: isLoadingCampaignDetails
  } = useGetCampaignById(campaignToDownload?.campaign_id || null);

  // Get the first dataset UUID for download
  const firstDatasetIdForDownload = campaignDetailsForDownload?.result?.dataset_uuids?.[0] || null;

  // Fetch dataset content for download
  const {
    data: datasetForDownload,
    isLoading: isLoadingDatasetForDownload
  } = useViewDataset(firstDatasetIdForDownload);

  // Filter campaigns based on search query
  const filteredCampaigns = useMemo(() => {
    if (!searchQuery.trim()) {
      return campaigns;
    }
    return campaigns.filter(campaign =>
      campaign.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [campaigns, searchQuery]);

  // Pagination configuration
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredCampaigns.length / itemsPerPage);

  // Get current page data
  const currentCampaigns = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredCampaigns.slice(startIndex, endIndex);
  }, [filteredCampaigns, currentPage]);

  // Reset to first page when campaigns change or search query changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filteredCampaigns.length, searchQuery]);

  // Handle download when dataset data is available
  React.useEffect(() => {
    if (campaignToDownload && datasetForDownload?.result?.content && !isLoadingDatasetForDownload) {
      handleDatasetDownload();
    }
  }, [campaignToDownload, datasetForDownload, isLoadingDatasetForDownload]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first page, last page, current page, and neighbors
      if (currentPage <= 3) {
        // Near the beginning
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        pages.push(1);
        pages.push('ellipsis');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // In the middle
        pages.push(1);
        pages.push('ellipsis');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  // Handle campaign deletion
  const handleDeleteCampaign = (campaign: Campaign) => {
    setCampaignToDelete(campaign);
  };

  // Handle campaign editing
  const handleEditCampaign = (campaign: Campaign) => {
    setCampaignToEdit(campaign);
  };

  // Handle campaign download
  const handleDownloadCampaign = (campaign: Campaign) => {
    setCampaignToDownload(campaign);
  };

  // Handle the actual dataset download
  const handleDatasetDownload = () => {
    if (!datasetForDownload?.result?.content || !campaignToDownload) {
      console.error('No dataset content available for download');
      return;
    }

    try {
      // Decode base64 content
      const binaryString = atob(datasetForDownload.result.content);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Determine MIME type based on dataset type
      let mimeType = 'application/octet-stream';
      let fileExtension = '';

      const datasetType = datasetForDownload.result.dataset_type?.toLowerCase();
      const datasetName = datasetForDownload.result.dataset_name?.toLowerCase() || '';

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

      // Generate filename based on campaign name and dataset type
      let fileName = datasetForDownload.result.dataset_name || campaignToDownload.name;
      if (!fileName.includes('.')) {
        fileName += fileExtension;
      }

      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);

      // Clean up the URL object
      URL.revokeObjectURL(url);

      toast.success('Dataset downloaded successfully', {
        description: `Dataset for "${campaignToDownload.name}" has been downloaded.`
      });

      console.log('Dataset download initiated successfully');
    } catch (error) {
      console.error('Error downloading dataset:', error);
      toast.error('Failed to download dataset', {
        description: 'An error occurred while downloading the dataset.'
      });
    } finally {
      // Reset the download state
      setCampaignToDownload(null);
    }
  };

  // Handle campaign viewing
  const handleViewCampaign = (campaign: Campaign) => {
    // Navigate to campaign details page using router
    navigate({ to: '/campaigns/$campaignId', params: { campaignId: campaign.campaign_id } });
  };

  // Confirm delete action
  const confirmDeleteCampaign = () => {
    if (!campaignToDelete) return;

    deleteCampaignMutation.mutate(campaignToDelete.campaign_id, {
      onSuccess: () => {
        toast.success('Campaign deleted successfully', {
          description: `Campaign "${campaignToDelete.name}" has been removed.`
        });
        setCampaignToDelete(null);
      },
      onError: (error: any) => {
        toast.error('Failed to delete campaign', {
          description: error.response?.data?.errorMessage || 'An unexpected error occurred'
        });
      }
    });
  };

  // Show authentication required state (only in production or when Keycloak is configured)
  if (!isAuthenticated || (!keycloak && !import.meta.env.DEV)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <LogIn className="text-blue-600" size={32} />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h3>
          <p className="text-gray-500 mb-6">Please log in to view your campaigns</p>
          <button
            onClick={() => keycloak?.login()}
            className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            <LogIn className="mr-2" size={20} />
            Log In
          </button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: Campaign['status']) => {
    switch (status) {
      case 'active':
        return <Play size={12} />;
      case 'inactive':
        return <Ban size={12} />;
      case 'paused':
        return <Pause size={12} />;
      case 'completed':
        return <TrendingUp size={12} />;
      case 'draft':
        return <Edit size={12} />;
      default:
        return null;
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4" size={48} />
          <p className="text-gray-600">Loading campaigns...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="text-red-600" size={32} />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading campaigns</h3>
          <p className="text-gray-500 mb-6">Please try again later</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100">
      <Header showSettings={true} onSettingsClick={() => {
        // Handle settings click - you can add your settings dialog logic here

      }} />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Campaigns</h1>
            <p className="text-gray-600">Manage and track your email marketing campaigns</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onNewCampaign}
              className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <Plus className="mr-2" size={20} />
              New Campaign
            </button>
          </div>
        </div>



        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {searchQuery ? 'Filtered Campaigns' : 'Total Campaigns'}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {searchQuery ? filteredCampaigns.length : campaigns.length}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Mail className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Campaigns</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(searchQuery ? filteredCampaigns : campaigns).filter(campaign => campaign.status === 'active').length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Play className="text-green-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search campaigns by name..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none transition-colors text-sm bg-white"
          />

          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100 mb-3"
              title="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="text-xs text-gray-600 text-center mb-2">
            {filteredCampaigns.length === 0
              ? 'No campaigns found'
              : `${filteredCampaigns.length} campaign${filteredCampaigns.length === 1 ? '' : 's'} found`
            }
          </p>
        )}

        {/* Campaigns Table */}
        <TooltipProvider>
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-col sm:flex-row gap-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {searchQuery ? `Search Results` : 'All Campaigns'}
              </h2>
              {totalPages > 1 && (
                <div className="flex items-center gap-4 flex-col sm:flex-row">
                  <span className="text-xs text-gray-400 text-center sm:text-left">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredCampaigns.length)} of {filteredCampaigns.length} campaigns
                  </span>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage > 1) setCurrentPage(currentPage - 1);
                          }}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>

                      {getPageNumbers().map((page, index) => (
                        <PaginationItem key={index}>
                          {page === 'ellipsis' ? (
                            <PaginationEllipsis />
                          ) : (
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                setCurrentPage(page as number);
                              }}
                              isActive={currentPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          )}
                        </PaginationItem>
                      ))}

                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                          }}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-60">
                      Campaign
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-80">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentCampaigns.length > 0 ? (
                    currentCampaigns.map((campaign) => (
                      <tr key={campaign.campaign_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <button
                              onClick={() => handleViewCampaign(campaign)}
                              className="text-sm font-medium text-blue-600 hover:text-blue-800 max-w-60 truncate text-left underline-offset-4 hover:underline transition-colors"
                              title={`View details for ${campaign.name}`}
                            >
                              {campaign.name}
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="text-sm text-gray-900 truncate max-w-lg cursor-auto" title={campaign.description}>
                                {campaign.description}
                              </div>
                            </TooltipTrigger>
                          </Tooltip>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                            {getStatusIcon(campaign.status)}
                            <span className="ml-1 capitalize">{campaign.status}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded">
                                <MoreVertical size={16} />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem className="flex items-center gap-2">
                                <button
                                  className="flex items-center gap-2 w-full text-left"
                                  onClick={() => {
                                    handleDownloadCampaign(campaign);
                                  }}
                                  disabled={isLoadingCampaignDetails || isLoadingDatasetForDownload}
                                >
                                  {(isLoadingCampaignDetails || isLoadingDatasetForDownload) && campaignToDownload?.campaign_id === campaign.campaign_id ? (
                                    <Loader2 className="animate-spin" size={14} />
                                  ) : (
                                    <Download size={14} />
                                  )}
                                  Download
                                </button>
                              </DropdownMenuItem>
                              <DropdownMenuItem className="flex items-center gap-2">
                                <button
                                  className="flex items-center gap-2 w-full text-left"
                                  onClick={() => {
                                    handleEditCampaign(campaign);
                                  }}
                                >
                                  <Edit size={14} />
                                  Edit
                                </button>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="flex items-center gap-2 text-red-600 focus:text-red-600"
                                onSelect={(e) => {
                                  e.preventDefault(); // Prevent dropdown from closing
                                  handleDeleteCampaign(campaign);
                                }}
                              >
                                <Trash2 size={14} />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center">
                          {searchQuery ? (
                            <>
                              <Search className="h-12 w-12 text-gray-400 mb-4" />
                              <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns found</h3>
                              <p className="text-gray-500 mb-4">
                                No campaigns match your search for "{searchQuery}".
                              </p>
                              <button
                                onClick={clearSearch}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                              >
                                Clear search to see all campaigns
                              </button>
                            </>
                          ) : (
                            <>
                              <Mail className="h-12 w-12 text-gray-400 mb-4" />
                              <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns on this page</h3>
                              <p className="text-gray-500">Try navigating to a different page or create a new campaign.</p>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TooltipProvider>

        {/* Delete Campaign Confirmation Dialog */}
        <Dialog
          open={!!campaignToDelete}
          onOpenChange={() => setCampaignToDelete(null)}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <DialogTitle className="text-xl font-semibold text-gray-900">
                Delete Campaign
              </DialogTitle>
              <DialogDescription className="text-gray-600 mt-2">
                Are you sure you want to delete <span className="font-medium text-gray-900">"{campaignToDelete?.name}"</span>?
                <br />
                <span className="text-sm text-gray-500 mt-1 block">
                  This action cannot be undone and will permanently remove the campaign and all associated data.
                </span>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setCampaignToDelete(null)}
                className="w-full sm:w-auto"
                disabled={deleteCampaignMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteCampaign}
                disabled={deleteCampaignMutation.isPending}
                className="w-full sm:w-auto"
              >
                {deleteCampaignMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Campaign
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Campaign Dialog */}
        <Dialog
          open={!!campaignToEdit}
          onOpenChange={() => setCampaignToEdit(null)}
        >
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <NewCampaign
              onFileUpload={() => { }} // Not used in edit mode
              editMode={true}
              campaignToEdit={campaignToEdit}
              onClose={() => setCampaignToEdit(null)}
            />
          </DialogContent>
        </Dialog>



        {/* Empty State (if no campaigns) */}
        {campaigns.length === 0 && !isLoading && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="text-gray-400" size={32} />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns yet</h3>
            <p className="text-gray-500 mb-6">Get started by creating your first data processing campaign</p>
            <button
              onClick={onNewCampaign}
              className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 w-fit text-white font-semibold rounded-lg transition-colors"
            >
              <Plus className="mr-2" size={20} />
              Create Campaign
            </button>
          </div>
        )}
      </div>
    </div>
  );
}