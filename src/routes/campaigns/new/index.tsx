import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { NewCampaign } from '@/components/NewCampaign'
import { Navigation } from '@/components/Navigation'
import { BackToCampaignsButton } from '@/components/BackToCampaignsButton'
import { Upload, Settings, Database } from 'lucide-react'
import { useCampaignStore } from '@/stores/campaignStore'
import { useGetCampaignById } from '@/custom-hooks/query-hooks'
import { useEffect } from 'react'

function UploadStep() {
    const navigate = useNavigate()
    const {
        setUploadedData,
        setCurrentStep,
        createdCampaignId,
        setCampaignInfo,
        setFileName,
        campaignInfo
    } = useCampaignStore()

    // Fetch existing campaign data if coming from campaign details
    const {
        data: existingCampaignData,
        isLoading: isLoadingExistingCampaign
    } = useGetCampaignById(createdCampaignId)

    // Pre-populate form with existing campaign data when available
    useEffect(() => {
        if (existingCampaignData?.result && createdCampaignId) {
            // Only set campaign info if it's not already set (to avoid overwriting user changes)
            if (!campaignInfo.name && !campaignInfo.description) {
                setCampaignInfo({
                    name: existingCampaignData.result.campaign_name,
                    description: existingCampaignData.result.campaign_description
                })
            }

            // Set filename based on campaign name if not already set
            const generatedFileName = `${existingCampaignData.result.campaign_name.toLowerCase().replace(/\s+/g, '_')}_data`
            setFileName(generatedFileName)
        }
    }, [existingCampaignData, createdCampaignId, campaignInfo, setCampaignInfo, setFileName])

    // Function to continue with existing data
    const handleContinueWithExistingData = () => {
        if (!createdCampaignId || !existingCampaignData?.result) return

        // Set current step to preview
        setCurrentStep(1)

        // Navigate directly to preview step
        navigate({ to: '/campaigns/new/preview' })
    }

    const steps = [
        { id: 0, title: 'Upload Data', icon: Upload, description: 'Upload your CSV or Excel file' },
        { id: 1, title: 'Preview & Select', icon: Database, description: 'Review data and select columns' },
        { id: 2, title: 'Data Enrichment', icon: Settings, description: 'Setup enrichment options and preview data' }
    ]

    const handleFileUpload = (data: any[], _filename: string, _campaignData: any) => {
        // Store data in Zustand store
        setUploadedData(data)
        setCurrentStep(1) // Move to preview step

        // Navigate to preview step
        navigate({ to: '/campaigns/new/preview' })
    }

    return (
        <>
            {/* Header for upload step */}
            <div className="flex justify-between items-center mb-6">
                <BackToCampaignsButton
                    warningTitle="Leave Campaign Creation?"
                    warningMessage="Are you sure you want to go back to campaigns? Any data you've entered will be lost."
                />
            </div>

            <Navigation
                steps={steps}
                currentStep={0}
                onStepClick={(step) => {
                    if (step === 0) return // Already on upload step
                    if (step === 1 && createdCampaignId && existingCampaignData?.result) {
                        // Navigate to preview if we have existing campaign data
                        handleContinueWithExistingData()
                    } else if (step === 1 && campaignInfo.name) {
                        // Navigate to preview if we have uploaded data
                        setCurrentStep(1)
                        navigate({ to: '/campaigns/new/preview' })
                    }
                    // For enrichments step, it will be handled in preview component
                }}
            />

            <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
                <NewCampaign
                    onFileUpload={handleFileUpload}
                    isLoadingExistingData={isLoadingExistingCampaign}
                    existingCampaignData={existingCampaignData}
                    onContinueWithExistingData={handleContinueWithExistingData}
                />
            </div>

            <div className="text-center text-gray-500 text-sm">
                <p>Secure data processing • API-powered enrichment • Export ready results</p>
            </div>
        </>
    )
}

export const Route = createFileRoute('/campaigns/new/')({
    component: UploadStep,
}) 