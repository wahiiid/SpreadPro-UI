import { useState, useEffect } from 'react';
import { X, User, Mail, Globe, Target, Calculator, FileText, AlertCircle, Loader2, Edit3 } from 'lucide-react';
import { useLLMModels, useDefaultPrompts } from '@/custom-hooks/query-hooks';
import { toast } from 'sonner';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface EnrichmentConfig {
    llmModel: string;
    prompt: string;
}

interface EnrichmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (config: EnrichmentConfig) => void;
    existingConfig?: EnrichmentConfig;
    enrichmentType: string;
    title: string;
}

export function EnrichmentModal({
    isOpen,
    onClose,
    onSave,
    existingConfig,
    enrichmentType,
    title
}: EnrichmentModalProps) {
    const [config, setConfig] = useState<EnrichmentConfig>({
        llmModel: '',
        prompt: ''
    });
    const [isVisible, setIsVisible] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [isEditingPrompt, setIsEditingPrompt] = useState(false);
    const [, setOriginalSelectedPrompt] = useState('');

    // Map frontend enrichment types to backend enrichment types
    const enrichmentTypeMapping: Record<string, string> = {
        'domain-enrichment': 'domain_enrichment',
        'job-title-enrichment': 'Normalizing_Job_Titles',
        'email-discovery': 'email_generation',
        'product-service-discovery': 'company_analysis',
        'generate-use-cases': 'use_case_generation',
        'email-generation': 'email_generation' // Email Generation uses special API
    };

    const backendEnrichmentType = enrichmentTypeMapping[enrichmentType] || enrichmentType;

    // Email Generation only uses prompts, no LLM model selection
    const isEmailGeneration = enrichmentType === 'email-generation';

    // Fetch LLM models and prompts from backend
    // Only fetch LLM models for non-email generation enrichments
    const {
        data: llmModelsData,
        isLoading: isLoadingModels,
        error: modelsError
    } = useLLMModels(backendEnrichmentType);

    const {
        data: promptsData,
        isLoading: isLoadingPrompts,
        error: promptsError
    } = useDefaultPrompts(backendEnrichmentType);

    // Skip LLM model loading and errors for email generation
    const actualIsLoadingModels = isEmailGeneration ? false : isLoadingModels;
    const actualModelsError = isEmailGeneration ? null : modelsError;

    // Icon mapping for different enrichment types
    const iconMap: Record<string, React.ComponentType<any>> = {
        'domain-enrichment': Globe,
        'job-title-enrichment': User,
        'email-discovery': Mail,
        'product-service-discovery': Target,
        'generate-use-cases': FileText,
        'email-generation': Calculator
    };

    const IconComponent = iconMap[enrichmentType] || User;

    // Get available prompts and models
    const availableModels = llmModelsData?.results?.model_names || [];
    const availablePrompts = promptsData?.results || [];
    const isLoading = actualIsLoadingModels || isLoadingPrompts;

    // Handle modal visibility and animations
    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            // Small delay to trigger entrance animation
            setTimeout(() => setIsAnimating(true), 10);
        } else {
            setIsAnimating(false);
            // Delay hiding to allow exit animation to complete
            const timer = setTimeout(() => setIsVisible(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    // Initialize config from existing config if provided
    useEffect(() => {
        if (existingConfig) {
            setConfig(existingConfig);
            setOriginalSelectedPrompt(existingConfig.prompt);
            setIsEditingPrompt(false);
        } else {
            // Reset config when modal opens for new enrichment
            setConfig({
                llmModel: '',
                prompt: ''
            });
            setOriginalSelectedPrompt('');
            setIsEditingPrompt(false);
        }
    }, [existingConfig, isOpen]);

    // Set prompt from backend when prompts are loaded
    useEffect(() => {
        if (availablePrompts.length > 0 && !existingConfig) {
            const firstPrompt = availablePrompts[0].prompt_text;
            setConfig(prev => ({
                ...prev,
                prompt: firstPrompt,
                // For email generation, we don't need an LLM model
                llmModel: isEmailGeneration ? 'N/A' : prev.llmModel
            }));
            setOriginalSelectedPrompt(firstPrompt);
        }
    }, [availablePrompts, existingConfig, isEmailGeneration]);

    // Show error toast for API errors (skip for email generation)
    useEffect(() => {
        if (actualModelsError) {
            toast.error('Failed to load LLM models', {
                description: 'Please try again or contact support if the issue persists.',
                duration: 5000,
            });
        }
    }, [actualModelsError]);

    useEffect(() => {
        if (promptsError) {
            toast.error('Failed to load default prompts', {
                description: 'You can still enter a custom prompt manually.',
                duration: 5000,
            });
        }
    }, [promptsError]);


    const handlePromptEdit = (value: string) => {
        setConfig(prev => ({ ...prev, prompt: value }));
        setIsEditingPrompt(true);
    };

    const handleSave = () => {
        // For email generation, only prompt is required
        if (isEmailGeneration) {
            if (!config.prompt) {
                toast.error('Please provide a prompt', {
                    description: 'Email generation requires a prompt to generate templates.',
                    duration: 4000,
                });
                return;
            }

            // Save config with a placeholder LLM model for email generation
            onSave({
                ...config,
                llmModel: 'N/A' // Email generation doesn't use LLM models
            });
        } else {
            // For other enrichments, both LLM model and prompt are required
            if (!config.llmModel || !config.prompt) {
                toast.error('Please fill in all required fields', {
                    description: 'Make sure to select an LLM model and provide a prompt.',
                    duration: 4000,
                });
                return;
            }
            onSave(config);
        }
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!isVisible) return null;

    return (
        <div
            className={`fixed inset-0 z-[60] flex items-center justify-center p-4 transition-all duration-300 ${isAnimating ? 'bg-black bg-opacity-50' : 'bg-transparent'
                }`}
            onClick={handleBackdropClick}
        >
            <div
                className={`bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col transition-all duration-300 relative z-[70] ${isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
                    }`}
                onClick={e => e.stopPropagation()}
            >
                {/* Header - Fixed */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 rounded-t-xl flex-shrink-0">
                    <div className="flex items-center space-x-3">
                        <IconComponent className="text-indigo-600" size={24} />
                        <h2 className="text-xl font-semibold text-gray-900">Setup {title}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-full"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto">
                    <div className="p-6 space-y-6">
                        {/* Loading State */}
                        {isLoading && (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="animate-spin text-indigo-600 mr-3" size={24} />
                                <span className="text-gray-600">Loading configuration options...</span>
                            </div>
                        )}

                        {!isLoading && (
                            <>
                                {/* LLM Model Selection - Only show for non-email generation enrichments */}
                                {!isEmailGeneration && (
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            LLM Model
                                            <span className="text-red-500 ml-1">*</span>
                                        </label>
                                        {actualModelsError ? (
                                            <div className="space-y-3">
                                                <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-lg">
                                                    <AlertCircle className="text-red-500 mr-3 flex-shrink-0" size={16} />
                                                    <span className="text-sm text-red-700">Failed to load models. Please try again.</span>
                                                </div>
                                                {process.env.NODE_ENV === 'development' && (
                                                    <div className="p-3 bg-red-100 border border-red-300 rounded-lg text-xs text-red-800">
                                                        <strong>Error Details:</strong> {actualModelsError?.message || 'Unknown error'}
                                                        <br />
                                                        <strong>Enrichment Type:</strong> {backendEnrichmentType}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <Select
                                                value={config.llmModel}
                                                onValueChange={(value) => setConfig(prev => ({ ...prev, llmModel: value }))}
                                            >
                                                <SelectTrigger className="w-full h-11 px-4 border border-gray-300 hover:border-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200">
                                                    <SelectValue placeholder="Select a model" />
                                                </SelectTrigger>
                                                <SelectContent className="max-h-60 z-[100] bg-white border border-gray-200 shadow-lg animate-in fade-in-0 zoom-in-95 duration-200">
                                                    {availableModels.map(model => (
                                                        <SelectItem key={model} value={model} className="cursor-pointer transition-colors duration-150 bg-white hover:bg-gray-50">
                                                            {model}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    </div>
                                )}

                                {/* Prompt Display and Editor */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Prompt
                                        <span className="text-red-500 ml-1">*</span>
                                    </label>
                                    {promptsError ? (
                                        <div className="space-y-3">
                                            <div className="flex items-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                                <AlertCircle className="text-yellow-500 mr-3 flex-shrink-0" size={16} />
                                                <span className="text-sm text-yellow-700">Failed to load default prompts. You can enter a custom prompt below.</span>
                                            </div>
                                            <textarea
                                                value={config.prompt}
                                                onChange={(e) => handlePromptEdit(e.target.value)}
                                                placeholder={`Enter the prompt for ${title.toLowerCase()}...`}
                                                rows={4}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg hover:border-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors outline-none resize-none"
                                                required
                                            />
                                        </div>
                                    ) : availablePrompts.length > 0 ? (
                                        <div className="space-y-3">
                                            {/* Display the first prompt from backend */}
                                            {availablePrompts[0] && (
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-end">
                                                        <button
                                                            type="button"
                                                            onClick={() => setIsEditingPrompt(!isEditingPrompt)}
                                                            className="flex items-center text-sm text-indigo-600 hover:text-indigo-700 transition-colors"
                                                        >
                                                            <Edit3 size={14} className="mr-1" />
                                                            {isEditingPrompt ? 'Save Prompt' : 'Edit Prompt'}
                                                        </button>
                                                    </div>

                                                    {isEditingPrompt ? (
                                                        <textarea
                                                            value={config.prompt}
                                                            onChange={(e) => handlePromptEdit(e.target.value)}
                                                            placeholder={`Edit the prompt for ${title.toLowerCase()}...`}
                                                            rows={8}
                                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg hover:border-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors outline-none resize-none"
                                                            required
                                                        />
                                                    ) : (
                                                        <div className="p-4 bg-sky-50 border border-sky-200 rounded-lg max-h-52 overflow-y-auto">
                                                            <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                                                                {config.prompt || availablePrompts[0].prompt_text}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="flex items-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                                <AlertCircle className="text-blue-500 mr-3 flex-shrink-0" size={16} />
                                                <span className="text-sm text-blue-700">No default prompts available. Please enter a custom prompt.</span>
                                            </div>
                                            <textarea
                                                value={config.prompt}
                                                onChange={(e) => handlePromptEdit(e.target.value)}
                                                placeholder={`Enter the prompt for ${title.toLowerCase()}...`}
                                                rows={4}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg hover:border-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors outline-none resize-none"
                                                required
                                            />
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Footer - Fixed */}
                <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 rounded-b-xl flex-shrink-0 bg-gray-50/50">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 hover:border-gray-400 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isLoading || (isEmailGeneration ? !config.prompt : (!config.llmModel || !config.prompt))}
                        className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors shadow-sm"
                    >
                        {isLoading ? (
                            <div className="flex items-center">
                                <Loader2 className="animate-spin mr-2" size={16} />
                                Loading...
                            </div>
                        ) : (
                            'Save Configuration'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
} 