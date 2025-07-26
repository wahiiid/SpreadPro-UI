import { LogOut } from 'lucide-react';
import { useAuthStore } from '../custom-hooks/auth-store';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Button } from './ui/button';
import { useNavigate } from '@tanstack/react-router';
import companyLogo from '../assets/company.png';

interface HeaderProps {
    title?: string;
    showSettings?: boolean;
    onSettingsClick?: () => void;
}

export function Header({ title = "SpreadPro" }: HeaderProps) {
    const { isAuthenticated, keycloak } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = () => {
        if (keycloak) {
            keycloak.logout();
        }
    };

    const getUserDisplayName = () => {
        // Try to get the full name from Keycloak token
        if (keycloak?.tokenParsed?.name) {
            console.log(keycloak.tokenParsed.name);
            return keycloak.tokenParsed.name;
        }

        // Fallback to preferred_username if name is not available
        if (keycloak?.tokenParsed?.preferred_username) {
            return keycloak.tokenParsed.preferred_username;
        }

        // If no name is available, use email username as last resort
        if (keycloak?.tokenParsed?.email) {
            return keycloak.tokenParsed.email.split('@')[0];
        }

        return import.meta.env.DEV ? 'Developer' : 'User';
    };

    const getUserInitials = () => {
        const name = getUserDisplayName();
        return name
            .split(' ')
            .map((word: string) => word.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <header className="px-6 py-4 bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                {/* Logo and Title */}
                <button
                    onClick={() => navigate({ to: '/campaigns' })}
                    className="flex items-center space-x-3 hover:opacity-80 transition-opacity duration-200"
                >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg">
                        <img src={companyLogo} alt="Company Logo" className="w-10 h-10" />
                    </div>
                    <div>
                        <span className="text-xl font-bold text-gray-900">{title}</span>

                    </div>
                </button>

                {/* User Section */}
                <div className="flex items-center space-x-4">
                    {isAuthenticated && keycloak ? (
                        <>

                            {/* User Dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        className="flex items-center space-x-3 px-3 py-2 hover:bg-gray-100 rounded-lg transition-all duration-200 ease-in-out hover:shadow-sm"
                                    >
                                        {/* User Avatar */}
                                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md transition-transform duration-200 ease-in-out hover:scale-105">
                                            {getUserInitials()}
                                        </div>

                                        {/* User Info */}
                                        <div className="flex flex-col items-start">
                                            <span className="text-sm font-medium text-gray-900">
                                                {getUserDisplayName()}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {keycloak.tokenParsed?.email || 'User Account'}
                                            </span>
                                        </div>
                                    </Button>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent align="end" className="w-56">
                                    <div className="px-3 py-2 border-b border-gray-100">
                                        <div className="text-sm font-medium text-gray-900">
                                            {getUserDisplayName()}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {keycloak.tokenParsed?.email || 'user@example.com'}
                                        </div>
                                    </div>

                                    <DropdownMenuItem
                                        className="flex items-center gap-2 px-3 py-2 text-red-600 focus:text-red-600 focus:bg-red-50"
                                        onClick={handleLogout}
                                    >
                                        <LogOut size={16} />
                                        Sign Out
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </>
                    ) : (
                        <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500">Not authenticated</span>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
} 