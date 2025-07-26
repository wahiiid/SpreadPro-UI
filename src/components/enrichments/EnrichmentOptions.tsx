import React, { useState, useEffect } from 'react';
import { Settings, Mail, Globe, Target, Calculator, FileText, ChevronDown, ChevronUp, User } from 'lucide-react';
import { DataCleanOptions } from './DataCleanOptions';
import { DomainEnrichmentDisplay } from './DomainEnrichmentDisplay';

interface EnrichmentOption {
    id: string;
    title: string;
    description: string;
    icon: React.ComponentType<any>;
    enabled: boolean;
}

interface DomainEnrichmentConfig {
    llmModel: string;
    prompt: string;
}

interface EnrichmentOptionsProps {
    selectedOptions: string[];
    onOptionsChange: (options: string[]) => void;
    onOpenDomainModal: () => void;
    domainEnrichmentConfig: DomainEnrichmentConfig | null;
    onEditDomainConfig: () => void;
    completedOptions: string[];
    onCompletedOptionsChange: (options: string[]) => void;
    onOpenEnrichmentModal: (optionId: string) => void;
    enrichmentConfigs: Record<string, DomainEnrichmentConfig>;
}

export function EnrichmentOptions({
    selectedOptions,
    onOptionsChange,
    onOpenDomainModal,
    domainEnrichmentConfig,
    onEditDomainConfig,
    completedOptions,
    onCompletedOptionsChange,
    onOpenEnrichmentModal,
    enrichmentConfigs
}: EnrichmentOptionsProps) {
    const [expandedOptions, setExpandedOptions] = useState<string[]>([]);
    const [prevCompletedOptions, setPrevCompletedOptions] = useState<string[]>([]);

    // Auto-collapse enrichment options after completion
    useEffect(() => {
        // Check if a new option was just completed
        const newlyCompleted = completedOptions.filter(option => !prevCompletedOptions.includes(option));

        if (newlyCompleted.length > 0) {
            // Clear selected options and collapse after 2 seconds
            setTimeout(() => {
                onOptionsChange([]);
                setExpandedOptions([]);
            }, 2000);
        }

        setPrevCompletedOptions(completedOptions);
    }, [completedOptions, prevCompletedOptions, onOptionsChange]);

    const [enrichmentOptions] = useState<EnrichmentOption[]>([
        {
            id: 'data-clean',
            title: 'Data Clean',
            description: 'Remove special characters and company suffixes from data fields',
            icon: Settings,
            enabled: false
        },
        {
            id: 'job-title-enrichment',
            title: 'Job Title Enrichment',
            description: 'AI-powered enhancement and standardization of job titles and roles',
            icon: User,
            enabled: false
        },
        {
            id: 'domain-enrichment',
            title: 'Domain Enrichment',
            description: 'AI-powered discovery of company websites and domains',
            icon: Globe,
            enabled: false
        },
        {
            id: 'email-discovery',
            title: 'Email Discovery',
            description: 'Find email addresses for contacts using name and company information',
            icon: Mail,
            enabled: false
        },
        {
            id: 'product-service-discovery',
            title: 'Product and Service Discovery',
            description: 'Discover company products, services, and business offerings',
            icon: Target,
            enabled: false
        },
        {
            id: 'generate-use-cases',
            title: 'Generate Use Cases',
            description: 'Create specific use cases and value propositions for each company',
            icon: FileText,
            enabled: false
        },
        {
            id: 'email-generation',
            title: 'Email Generation',
            description: 'Generate personalized email generations for business metrics',
            icon: Calculator,
            enabled: false
        }
    ]);

    const handleOptionToggle = (optionId: string) => {
        const isCurrentlySelected = selectedOptions.includes(optionId);

        if (isCurrentlySelected) {
            // If deselecting, remove from selected and expanded
            onOptionsChange(selectedOptions.filter(id => id !== optionId));
            setExpandedOptions(prev => prev.filter(id => id !== optionId));
        } else {
            // If selecting, replace current selection with this one (single selection)
            onOptionsChange([optionId]);
            setExpandedOptions([optionId]);

            // Open appropriate modal for different enrichment types
            if (optionId === 'domain-enrichment') {
                onOpenDomainModal();
            } else if (['job-title-enrichment', 'product-service-discovery', 'generate-use-cases', 'email-generation'].includes(optionId)) {
                onOpenEnrichmentModal(optionId);
            }
            // Email Discovery doesn't need modal - it will be processed directly
        }
    };

    const toggleExpanded = (optionId: string) => {
        setExpandedOptions(prev =>
            prev.includes(optionId)
                ? prev.filter(id => id !== optionId)
                : [...prev, optionId]
        );
    };

    const handleResetCompleted = (optionId: string) => {
        const newCompletedOptions = completedOptions.filter(id => id !== optionId);
        onCompletedOptionsChange(newCompletedOptions);
    };

    const handleEditEnrichmentConfig = (optionId: string) => {
        onOpenEnrichmentModal(optionId);
    };

    return (
        <div className="space-y-4">
            {enrichmentOptions.map((option) => {
                const IconComponent = option.icon;
                const isSelected = selectedOptions.includes(option.id);
                const isExpanded = expandedOptions.includes(option.id);
                const isCompleted = completedOptions.includes(option.id);
                const hasExpandableContent = option.id === 'data-clean';
                const hasOtherSelection = selectedOptions.length > 0 && !isSelected;
                const hasDomainConfig = option.id === 'domain-enrichment' && domainEnrichmentConfig;
                const hasEnrichmentConfig = enrichmentConfigs[option.id];

                return (
                    <div
                        key={option.id}
                        className={`border rounded-lg transition-all ${isCompleted
                            ? 'border-green-500 bg-green-50'
                            : isSelected
                                ? 'border-indigo-500 bg-indigo-50'
                                : hasOtherSelection
                                    ? 'border-gray-200 bg-gray-50 opacity-50'
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                    >
                        <div
                            className={`p-4 ${hasOtherSelection ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                            onClick={() => !hasOtherSelection && handleOptionToggle(option.id)}
                        >
                            <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0">
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => !hasOtherSelection && handleOptionToggle(option.id)}
                                        disabled={hasOtherSelection}
                                        className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded disabled:opacity-50"
                                    />
                                </div>

                                <div className="flex-shrink-0 mt-0.5">
                                    <IconComponent
                                        size={20}
                                        className={
                                            isCompleted && !isSelected
                                                ? 'text-green-600'
                                                : isSelected
                                                    ? 'text-indigo-600'
                                                    : hasOtherSelection
                                                        ? 'text-gray-300'
                                                        : 'text-gray-400'
                                        }
                                    />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2">
                                        <h4 className={`text-sm font-medium ${isCompleted && !isSelected
                                            ? 'text-green-900'
                                            : isSelected
                                                ? 'text-indigo-900'
                                                : hasOtherSelection
                                                    ? 'text-gray-400'
                                                    : 'text-gray-900'
                                            }`}>
                                            {option.title}
                                        </h4>
                                        {isCompleted && (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                Completed
                                            </span>
                                        )}
                                        {isCompleted && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleResetCompleted(option.id);
                                                }}
                                                className="text-green-600 hover:text-green-800 text-xs"
                                            >
                                                Reset
                                            </button>
                                        )}
                                    </div>
                                    <p className={`text-sm ${isCompleted && !isSelected
                                        ? 'text-green-700'
                                        : isSelected
                                            ? 'text-indigo-700'
                                            : hasOtherSelection
                                                ? 'text-gray-400'
                                                : 'text-gray-500'
                                        }`}>
                                        {option.description}
                                    </p>
                                </div>

                                {hasExpandableContent && isSelected && (
                                    <div className="flex-shrink-0">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleExpanded(option.id);
                                            }}
                                            className="text-indigo-600 hover:text-indigo-800"
                                        >
                                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Expandable Content for Data Clean */}
                        {hasExpandableContent && isSelected && isExpanded && (
                            <div className="border-t border-indigo-200 px-4 pb-4">
                                <div className="mt-4">
                                    <DataCleanOptions />
                                </div>
                            </div>
                        )}

                        {/* Domain Enrichment Configuration Display */}
                        {option.id === 'domain-enrichment' && isSelected && hasDomainConfig && (
                            <div className="border-t border-indigo-200 px-4 pb-4">
                                <div className="mt-4">
                                    <DomainEnrichmentDisplay
                                        config={domainEnrichmentConfig}
                                        onEdit={onEditDomainConfig}
                                        enrichmentType={option.id}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Other Enrichment Configuration Display */}
                        {['job-title-enrichment', 'email-discovery', 'product-service-discovery', 'generate-use-cases', 'email-generation'].includes(option.id) && isSelected && hasEnrichmentConfig && (
                            <div className="border-t border-indigo-200 px-4 pb-4">
                                <div className="mt-4">
                                    <DomainEnrichmentDisplay
                                        config={hasEnrichmentConfig}
                                        onEdit={() => handleEditEnrichmentConfig(option.id)}
                                        enrichmentType={option.id}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
} 