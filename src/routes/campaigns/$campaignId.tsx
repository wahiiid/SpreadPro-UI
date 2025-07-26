import { createFileRoute } from '@tanstack/react-router'
import { CampaignDetails } from '@/components/CampaignDetails'

export const Route = createFileRoute('/campaigns/$campaignId')({
    component: CampaignDetailsPage,
})

function CampaignDetailsPage() {
    const { campaignId } = Route.useParams()

    return <CampaignDetails campaignId={campaignId} />
} 