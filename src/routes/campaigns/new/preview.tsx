import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { DataPreview } from '@/components/DataPreview'
import { Navigation } from '@/components/Navigation'
import { CampaignHeader } from '@/components/CampaignHeader'
import { Upload, Settings, Database } from 'lucide-react'
import { useCampaignStore } from '@/stores/campaignStore'

function PreviewStep() {
  const navigate = useNavigate()
  const {
    campaignInfo,
    uploadedData,
    fileName,
    excelData,
    excelColumns,
    setColumnsToDelete,
    setColumnsToDeleteText,
    setCurrentStep,
    createdCampaignId
  } = useCampaignStore()

  const steps = [
    { id: 0, title: 'Upload Data', icon: Upload, description: 'Upload your CSV or Excel file' },
    { id: 1, title: 'Preview & Select', icon: Database, description: 'Review data and select columns' },
    { id: 2, title: 'Data Enrichment', icon: Settings, description: 'Setup enrichment options and preview data' }
  ]

  const handleDataPreview = (selectedColumns: string[], columnsToDeleteText: string) => {
    // Update store with selected columns and deletion text
    setColumnsToDelete(selectedColumns)
    setColumnsToDeleteText(columnsToDeleteText)
    setCurrentStep(2) // Move to enrichments step

    // Navigate to enrichments step
    navigate({ to: '/campaigns/new/enrichments' })
  }

  const handleBack = () => {
    // Set current step back to upload
    setCurrentStep(0)
    navigate({ to: '/campaigns/new' })
  }

  const handleStepClick = (step: number) => {
    if (step === 0) {
      handleBack()
    } else if (step === 1) {
      // Already on preview step
      return
    } else if (step === 2) {
      // Navigate to enrichments (only if data is available)
      setCurrentStep(2)
      navigate({ to: '/campaigns/new/enrichments' })
    }
  }

  // Check if we have data (either from new upload or existing campaign)
  const hasData = (uploadedData && uploadedData.length > 0) || (excelData && excelData.length > 0)
  const hasFileName = fileName && fileName.trim() !== ''

  // If no data and no campaign ID, redirect back to upload
  if (!hasData && !createdCampaignId) {
    navigate({ to: '/campaigns/new' })
    return null
  }

  // Get data statistics for header
  const recordsCount = excelData?.length || uploadedData?.length || 0;
  const columnsCount = excelColumns?.length || 0;

  return (
    <>
      {/* Campaign header */}
      <CampaignHeader
        campaignName={campaignInfo?.name || 'Campaign'}
        campaignDescription={campaignInfo?.description || 'Campaign description'}
        recordsCount={recordsCount}
        columnsCount={columnsCount}
        backButtonWarningTitle="Leave Data Preview?"
        backButtonWarningMessage="Are you sure you want to go back to campaigns? Your uploaded data and column selections will be lost."
      />

      <Navigation
        steps={steps}
        currentStep={1}
        onStepClick={handleStepClick}
      />

      <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
        <DataPreview
          data={excelData && excelData.length > 0 ? excelData : (uploadedData || [])}
          fileName={fileName || 'dataset'}
          onNext={handleDataPreview}
          onBack={handleBack}
        />
      </div>

      <div className="text-center text-gray-500 text-sm">
        <p>Secure data processing • API-powered enrichment • Export ready results</p>
      </div>
    </>
  )
}

export const Route = createFileRoute('/campaigns/new/preview')({
  component: PreviewStep,
})
