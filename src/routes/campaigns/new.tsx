import { Header } from '@/components/Header'
import { createFileRoute, Outlet } from '@tanstack/react-router'

function NewCampaignLayout() {

    return (
        <div className="min-h-screen">
            {/* Header */}
            <Header showSettings={true} onSettingsClick={() => {
            }} />

            <div className="container mx-auto px-4 py-8">
                <div className="max-w-7xl mx-auto">
                    {/* Render child routes */}
                    <Outlet />
                </div>
            </div>
        </div>
    )
}

export const Route = createFileRoute('/campaigns/new')({
    component: NewCampaignLayout,
}) 