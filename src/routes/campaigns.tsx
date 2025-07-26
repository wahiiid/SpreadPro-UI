import { createFileRoute, useNavigate, Outlet, useLocation } from '@tanstack/react-router'
import { CampaignsList } from '@/components/CampaignsList'
import { useCampaignStore } from '@/stores/campaignStore'
import { useEffect } from 'react'

function CampaignsRoute() {
    const navigate = useNavigate()
    const location = useLocation()
    const { resetCampaign } = useCampaignStore()

    // Reset campaign store when navigating to campaigns list
    useEffect(() => {
        if (location.pathname === '/campaigns' || location.pathname === '/spreadpro/campaigns') {
            resetCampaign()
        }
    }, [location.pathname, resetCampaign])

    // If we're at exactly /campaigns (or /spreadpro/campaigns), show the campaigns list
    // If we're at /campaigns/new (or /spreadpro/campaigns/new), show the outlet
    if (location.pathname === '/campaigns' || location.pathname === '/spreadpro/campaigns') {
        return <CampaignsList onNewCampaign={() => navigate({ to: '/campaigns/new' })} />
    }

    // For child routes like /campaigns/new
    return <Outlet />
}

export const Route = createFileRoute('/campaigns')({
    component: CampaignsRoute,
}) 