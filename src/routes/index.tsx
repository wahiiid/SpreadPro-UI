import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { LandingPage } from '@/components/LandingPage'

function LandingPageRoute() {
    const navigate = useNavigate()
    return <LandingPage onGetStarted={() => navigate({ to: '/campaigns' })} />
}

export const Route = createFileRoute('/')({
    component: LandingPageRoute,
}) 