import { createRootRoute, Outlet } from '@tanstack/react-router'

export const Route = createRootRoute({
    component: () => (
        <>
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
                <Outlet />
            </div>
            {/* <TanStackRouterDevtools /> */}
        </>
    ),
}) 