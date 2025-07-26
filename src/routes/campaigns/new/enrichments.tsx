import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Navigation } from '@/components/Navigation'
import { FloatingSettings } from '@/components/FloatingSettings'
import { ExcelPreview } from '@/components/enrichments/ExcelPreview'
import { EnrichmentOptions } from '@/components/enrichments/EnrichmentOptions'
import { EnrichmentModal } from '@/components/enrichments/EnrichmentModal'
import { CompletedEnrichments } from '@/components/enrichments/CompletedEnrichments'
import { CampaignHeader } from '@/components/CampaignHeader'
import { Upload, Settings, Database, CheckCircle, X, AlertCircle } from 'lucide-react'
import { useConfiguration } from '@/contexts/ConfigurationContext'
import { useCampaignStore } from '@/stores/campaignStore'
import { useCleanData, useLLMEnrichment, useEmailDiscovery, useEmailGeneration, useViewDataset } from '@/custom-hooks/query-hooks'
import { CleanDataRequest, CleanDataFix, LLMEnrichmentRequest, EmailDiscoveryRequest, EmailGenerationRequest } from '@/custom-hooks/query-types'
import { useState } from 'react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface DomainEnrichmentConfig {
    llmModel: string;
    prompt: string;
}

function EnrichmentsStep() {
    const navigate = useNavigate()
    const { processingConfig, updateProcessingConfig } = useConfiguration()
    const { campaignInfo, setCurrentStep, createdCampaignId, createdDatasetId, excelData, excelColumns, uploadedData } = useCampaignStore()
    const [selectedEnrichmentOptions, setSelectedEnrichmentOptions] = useState<string[]>([])
    const [completedEnrichmentOptions, setCompletedEnrichmentOptions] = useState<string[]>([])
    const [hiddenCompletedOptions, setHiddenCompletedOptions] = useState<string[]>([])
    const [domainEnrichmentConfig, setDomainEnrichmentConfig] = useState<DomainEnrichmentConfig | null>(null)
    const [enrichmentConfigs, setEnrichmentConfigs] = useState<Record<string, DomainEnrichmentConfig>>({})

    // Unified modal state
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [currentEnrichmentType, setCurrentEnrichmentType] = useState<string>('')

    // Confirmation dialog state
    const [showCompletionDialog, setShowCompletionDialog] = useState(false)

    // Error message state for displaying backend errors prominently
    const [errorMessage, setErrorMessage] = useState<string>('')
    const [errorTitle, setErrorTitle] = useState<string>('')

    // Clean data mutation
    const cleanDataMutation = useCleanData()

    // LLM Enrichment mutation
    const llmEnrichmentMutation = useLLMEnrichment()

    // Email Discovery mutation
    const emailDiscoveryMutation = useEmailDiscovery()

    // Email Generation mutation
    const emailGenerationMutation = useEmailGeneration()

    // Get dataset refetch function
    const { refetch: refetchDataset } = useViewDataset(createdDatasetId);

    const steps = [
        { id: 0, title: 'Upload Data', icon: Upload, description: 'Upload your CSV or Excel file' },
        { id: 1, title: 'Preview & Select', icon: Database, description: 'Review data and select columns' },
        { id: 2, title: 'Data Enrichment', icon: Settings, description: 'Setup enrichment options and preview data' }
    ]

    const handleContinueToFinalProcessing = () => {
        // Show confirmation dialog
        setShowCompletionDialog(true)
    }

    const handleConfirmCompletion = () => {
        setShowCompletionDialog(false)

        // Update processing config with selected enrichment options
        updateProcessingConfig({
            ...processingConfig,
            selectedEnrichmentOptions
        })
        setCurrentStep(2) // Stay on enrichment step

        // Navigate to campaigns list (final step)
        navigate({ to: '/campaigns' })
    }

    const handleCancelCompletion = () => {
        setShowCompletionDialog(false)
    }

    const handleBack = () => {
        navigate({ to: '/campaigns/new/preview' })
    }

    const handleOpenDomainModal = () => {
        setCurrentEnrichmentType('domain-enrichment')
        setIsModalOpen(true)
    }

    const handleCloseModal = () => {
        setIsModalOpen(false)
        setCurrentEnrichmentType('')
    }

    const handleSaveConfig = (config: DomainEnrichmentConfig) => {
        if (currentEnrichmentType === 'domain-enrichment') {
            setDomainEnrichmentConfig(config)
        } else {
            setEnrichmentConfigs(prev => ({
                ...prev,
                [currentEnrichmentType]: config
            }))
        }
        setIsModalOpen(false)
        setCurrentEnrichmentType('')
    }

    const handleEditDomainConfig = () => {
        setCurrentEnrichmentType('domain-enrichment')
        setIsModalOpen(true)
    }

    const handleOpenEnrichmentModal = (enrichmentType: string) => {
        setCurrentEnrichmentType(enrichmentType)
        setIsModalOpen(true)
    }

    const getEnrichmentTitle = (enrichmentType: string) => {
        const titleMap: Record<string, string> = {
            'job-title-enrichment': 'Job Title Enrichment',
            'email-discovery': 'Email Discovery',
            'product-service-discovery': 'Product and Service Discovery',
            'generate-use-cases': 'Generate Use Cases',
            'email-generation': 'Email Generation',
            'domain-enrichment': 'Domain Enrichment'
        }
        return titleMap[enrichmentType] || enrichmentType
    }

    const getCurrentConfig = () => {
        if (currentEnrichmentType === 'domain-enrichment') {
            return domainEnrichmentConfig || undefined
        } else {
            return enrichmentConfigs[currentEnrichmentType] || undefined
        }
    }


    const handleHideCompletedEnrichment = (optionId: string) => {
        // Just hide the completed enrichment from display without affecting the actual state
        setHiddenCompletedOptions(prev => [...prev, optionId]);
    }

    const handleDataCleanProcess = async () => {
        try {
            // Clear any existing error messages
            setErrorMessage('')
            setErrorTitle('')

            if (!createdCampaignId || !createdDatasetId) {
                toast.error('Campaign ID or Dataset ID is missing');
                return;
            }

            const cleanDataConfig = processingConfig.cleanDataConfig;
            if (!cleanDataConfig) {
                toast.error('No clean data configuration found');
                return;
            }

            // Build the fixes array based on configuration
            const fixes: CleanDataFix[] = [];

            // Add special characters fix
            if (cleanDataConfig.enableSpecialCharacters && cleanDataConfig.selectedColumns.specialCharacters.length > 0) {
                fixes.push({
                    column: cleanDataConfig.selectedColumns.specialCharacters,
                    fix_type: 'remove_special_characters',
                    options: {
                        characters: processingConfig.specialCharacters
                    }
                });
            }

            // Add company suffixes fix
            if (cleanDataConfig.enableCompanySuffixes && cleanDataConfig.selectedColumns.companySuffixes.length > 0) {
                fixes.push({
                    column: cleanDataConfig.selectedColumns.companySuffixes,
                    fix_type: 'remove_company_suffix',
                    options: {
                        suffixes: processingConfig.companySuffixes
                    }
                });
            }

            // Add deduplication fix
            if (cleanDataConfig.enableDeduplication && cleanDataConfig.selectedColumns.deduplication.length > 0) {
                fixes.push({
                    column: cleanDataConfig.selectedColumns.deduplication,
                    fix_type: 'deduplicate'
                });
            }

            if (fixes.length === 0) {
                toast.error('Please select at least one cleaning option and column');
                return;
            }

            const cleanDataRequest: CleanDataRequest = {
                campaign_uuid: createdCampaignId,
                dataset_uuid: createdDatasetId,
                fixes: fixes
            };

            const response = await cleanDataMutation.mutateAsync(cleanDataRequest);

            toast.success('Data cleaned successfully!', {
                description: `File saved to: ${response.results.s3_path}. Preview will refresh automatically.`,
                duration: 5000,
            });

            // Store the S3 path for this enrichment
            const currentPaths = processingConfig.completedEnrichmentPaths || {};
            updateProcessingConfig({
                completedEnrichmentPaths: {
                    ...currentPaths,
                    'data-clean': response.results.s3_path
                }
            });

            // Mark as completed
            const newCompletedOptions = [...completedEnrichmentOptions, 'data-clean'];
            setCompletedEnrichmentOptions(newCompletedOptions);

        } catch (error: any) {
            console.error('Error cleaning data:', error);

            let backendErrorMessage = 'An unexpected error occurred';

            // Check for nested error structure first
            if (error.response?.data?.detail?.errorMessage) {
                backendErrorMessage = error.response.data.detail.errorMessage;
            } else if (error.response?.data?.errorMessage) {
                backendErrorMessage = error.response.data.errorMessage;
            } else if (error.response?.data?.detail?.statusMessage) {
                backendErrorMessage = error.response.data.detail.statusMessage;
            } else if (error.response?.data?.statusMessage) {
                backendErrorMessage = error.response.data.statusMessage;
            } else if (error.message) {
                backendErrorMessage = error.message;
            }

            // Set error state for page display
            setErrorTitle('Data Clean Failed');
            setErrorMessage(backendErrorMessage);

            toast.error('Failed to clean data', {
                description: backendErrorMessage,
                duration: 5000,
            });
        }
    };

    const handleProcessEnrichment = async () => {
        // Clear any existing error messages at the start of processing
        setErrorMessage('')
        setErrorTitle('')

        if (selectedEnrichmentOptions.includes('data-clean')) {
            await handleDataCleanProcess();
        } else if (selectedEnrichmentOptions.includes('email-discovery')) {
            // Special handling for Email Discovery - no modal needed
            await handleEmailDiscoveryProcess();
        } else if (selectedEnrichmentOptions.includes('email-generation')) {
            // Special handling for Email Generation - uses different API
            await handleEmailGenerationProcess();
        } else {
            // Process LLM-based enrichments
            for (const enrichmentType of selectedEnrichmentOptions) {
                if (enrichmentType !== 'data-clean' && enrichmentType !== 'email-discovery' && enrichmentType !== 'email-generation') {
                    await handleLLMEnrichmentProcess(enrichmentType);
                }
            }
        }
    };

    const handleEmailDiscoveryProcess = async () => {
        try {
            // Clear any existing error messages
            setErrorMessage('')
            setErrorTitle('')

            if (!createdDatasetId) {
                toast.error('Dataset ID is missing');
                return;
            }

            toast.info('Starting Email Discovery...', {
                description: 'This may take a few minutes depending on the dataset size.',
                duration: 3000,
            });

            const emailDiscoveryRequest: EmailDiscoveryRequest = {
                dataset_uuid: createdDatasetId
            };

            const response = await emailDiscoveryMutation.mutateAsync(emailDiscoveryRequest);

            if (response.statusCode === 200) {
                toast.success('Email Discovery completed successfully!', {
                    description: `Download URL: ${response.download_url}`,
                    duration: 5000,
                });

                // Mark as completed
                const newCompletedOptions = [...completedEnrichmentOptions, 'email-discovery'];
                setCompletedEnrichmentOptions(newCompletedOptions);
            } else {
                toast.error('Email Discovery failed', {
                    description: response.statusMessage || 'An unexpected error occurred',
                    duration: 5000,
                });
            }

        } catch (error: any) {
            let backendErrorMessage = 'An unexpected error occurred';

            // Check for nested error structure first
            if (error.response?.data?.detail?.errorMessage) {
                backendErrorMessage = error.response.data.detail.errorMessage;
            } else if (error.response?.data?.errorMessage) {
                backendErrorMessage = error.response.data.errorMessage;
            } else if (error.response?.data?.detail?.statusMessage) {
                backendErrorMessage = error.response.data.detail.statusMessage;
            } else if (error.response?.data?.statusMessage) {
                backendErrorMessage = error.response.data.statusMessage;
            } else if (error.message) {
                backendErrorMessage = error.message;
            }

            // Set error state for page display
            setErrorTitle('Email Discovery Failed');
            setErrorMessage(backendErrorMessage);

            toast.error('Failed to process Email Discovery', {
                description: backendErrorMessage,
                duration: 5000,
            });
        }
    };

    const handleEmailGenerationProcess = async () => {
        try {
            // Clear any existing error messages
            setErrorMessage('')
            setErrorTitle('')

            if (!createdDatasetId) {
                toast.error('Dataset ID is missing');
                return;
            }

            // Get email generation configuration
            const config = enrichmentConfigs['email-generation'];
            if (!config?.prompt) {
                toast.error('Email Generation configuration missing', {
                    description: 'Please configure the email generation prompt first.',
                    duration: 5000,
                });
                return;
            }

            toast.info('Starting Email Generation...', {
                description: 'This may take a few minutes depending on the dataset size.',
                duration: 3000,
            });

            const emailGenerationRequest: EmailGenerationRequest = {
                dataset_uuid: createdDatasetId,
                enrichment_type: 'email_generation',
                prompt: config.prompt
            };

            const response = await emailGenerationMutation.mutateAsync(emailGenerationRequest);

            if (response.statusCode === 200) {
                // Refetch the dataset to get updated data
                try {
                    await refetchDataset();

                    toast.success('Email Generation completed successfully!', {
                        description: response.statusMessage || 'Email templates have been generated and added to your dataset.',
                        duration: 5000,
                    });

                    // Mark as completed
                    const newCompletedOptions = [...completedEnrichmentOptions, 'email-generation'];
                    setCompletedEnrichmentOptions(newCompletedOptions);

                } catch (refetchError) {
                    console.error('Error refetching dataset:', refetchError);
                    toast.warning('Email Generation completed but failed to refresh dataset', {
                        description: 'The generation was successful, but there was an issue refreshing the data. Please refresh the page manually.',
                        duration: 5000,
                    });
                }
            } else {
                toast.error('Email Generation failed', {
                    description: response.statusMessage || 'An unexpected error occurred',
                    duration: 5000,
                });
            }

        } catch (error: any) {
            let backendErrorMessage = 'An unexpected error occurred';
            let errorTitle = 'Email Generation Failed';

            // Check for nested error structure first
            if (error.response?.data?.detail?.errorMessage) {
                backendErrorMessage = error.response.data.detail.errorMessage;
            } else if (error.response?.data?.errorMessage) {
                backendErrorMessage = error.response.data.errorMessage;
            } else if (error.response?.data?.detail?.statusMessage) {
                backendErrorMessage = error.response.data.detail.statusMessage;
            } else if (error.response?.data?.statusMessage) {
                backendErrorMessage = error.response.data.statusMessage;
            } else if (error.message) {
                backendErrorMessage = error.message;
            }

            // Handle specific error for missing columns (check both nested and direct structure)
            if (error.response?.data?.detail?.missing_columns) {
                const missingColumns = error.response.data.detail.missing_columns.join(', ');
                backendErrorMessage = `Missing required columns: ${missingColumns}`;
                errorTitle = 'Missing Required Columns';
            } else if (error.response?.data?.missing_columns) {
                const missingColumns = error.response.data.missing_columns.join(', ');
                backendErrorMessage = `Missing required columns: ${missingColumns}`;
                errorTitle = 'Missing Required Columns';
            }

            // Check for HTTP 400 errors which often indicate validation issues
            if (error.response?.status === 400) {
                if (!errorTitle.includes('Missing Required Columns')) {
                    errorTitle = 'Validation Error';
                }
            }

            // Set error state for page display
            setErrorTitle(errorTitle);
            setErrorMessage(backendErrorMessage);

            toast.error(errorTitle, {
                description: backendErrorMessage,
                duration: 7000, // Longer duration for validation errors
            });
        }
    };

    const handleLLMEnrichmentProcess = async (enrichmentType: string) => {
        // Get configuration based on enrichment type (moved outside try block for error handling)
        let config: DomainEnrichmentConfig | undefined;
        if (enrichmentType === 'domain-enrichment') {
            config = domainEnrichmentConfig || undefined;
        } else {
            config = enrichmentConfigs[enrichmentType];
        }

        try {
            // Clear any existing error messages
            setErrorMessage('')
            setErrorTitle('')

            if (!createdCampaignId || !createdDatasetId) {
                toast.error('Campaign ID or Dataset ID is missing');
                return;
            }

            if (!config) {
                toast.error(`No configuration found for ${getEnrichmentTitle(enrichmentType)}`);
                return;
            }

            // Validate required fields
            if (!config.llmModel || !config.prompt) {
                toast.error(`Incomplete configuration for ${getEnrichmentTitle(enrichmentType)}`);
                return;
            }

            // Map frontend enrichment types to backend enrichment types
            const enrichmentTypeMapping: Record<string, string> = {
                'domain-enrichment': 'domain_enrichment',
                'job-title-enrichment': 'Normalizing_Job_Titles',
                'email-discovery': 'email_generation',
                'product-service-discovery': 'company_analysis',
                'generate-use-cases': 'use_case_generation'
                // Note: 'email-generation' (Email Generation) uses a different API endpoint
            };

            const backendEnrichmentType = enrichmentTypeMapping[enrichmentType] || enrichmentType;

            const enrichmentRequest: LLMEnrichmentRequest = {
                dataset_uuid: createdDatasetId,
                enrichment_type: backendEnrichmentType,
                llm: config.llmModel,
                prompt: config.prompt
                // model_params and row_limit are optional and not sent from frontend
            };

            toast.info(`Starting ${getEnrichmentTitle(enrichmentType)}...`, {
                description: 'This may take a few minutes depending on the dataset size.',
                duration: 3000,
            });

            const response = await llmEnrichmentMutation.mutateAsync(enrichmentRequest);

            // Handle new response structure
            if (response.result && response.result.base64_url) {
                // The enrichment was successful, now refresh the dataset
                try {
                    // Refetch the dataset to get the updated data
                    await refetchDataset();

                    toast.success(`${getEnrichmentTitle(enrichmentType)} completed successfully!`, {
                        description: response.result.message || 'Dataset has been enriched and updated.',
                        duration: 5000,
                    });

                } catch (refetchError) {
                    console.error('Error refetching dataset:', refetchError);
                    toast.warning(`${getEnrichmentTitle(enrichmentType)} completed but failed to refresh dataset`, {
                        description: 'The enrichment was successful, but there was an issue refreshing the data. Please refresh the page manually.',
                        duration: 5000,
                    });
                }
            } else {
                // Fallback for old response structure or error handling
                toast.warning(`${getEnrichmentTitle(enrichmentType)} completed`, {
                    description: response.result?.message || 'Enrichment process completed.',
                    duration: 5000,
                });
            }

            // Mark as completed
            const newCompletedOptions = [...completedEnrichmentOptions, enrichmentType];
            setCompletedEnrichmentOptions(newCompletedOptions);

        } catch (error: any) {
            let backendErrorMessage = 'An unexpected error occurred';
            let errorTitle = `${getEnrichmentTitle(enrichmentType)} Failed`;

            // Check for nested error structure first
            if (error.response?.data?.detail?.errorMessage) {
                backendErrorMessage = error.response.data.detail.errorMessage;
            } else if (error.response?.data?.errorMessage) {
                backendErrorMessage = error.response.data.errorMessage;
            } else if (error.response?.data?.detail?.statusMessage) {
                backendErrorMessage = error.response.data.detail.statusMessage;
            } else if (error.response?.data?.statusMessage) {
                backendErrorMessage = error.response.data.statusMessage;
            } else if (error.message) {
                backendErrorMessage = error.message;
            }

            // Check for specific LLM model validation errors
            const errorMessageLower = backendErrorMessage.toLowerCase();
            if (errorMessageLower.includes('llm') || errorMessageLower.includes('model') || errorMessageLower.includes('unsupported')) {
                errorTitle = 'LLM Model Not Supported';
                if (!backendErrorMessage.includes('LLM') && !backendErrorMessage.includes('model')) {
                    const modelName = config?.llmModel || 'selected model';
                    backendErrorMessage = `The selected LLM model "${modelName}" is not supported for this enrichment type. Please select a different model.`;
                }
            }

            // Check for HTTP 400 errors which often indicate validation issues
            if (error.response?.status === 400) {
                if (!errorTitle.includes('LLM Model')) {
                    errorTitle = 'Validation Error';
                }
            }

            // Set error state for page display
            setErrorTitle(errorTitle);
            setErrorMessage(backendErrorMessage);

            toast.error(errorTitle, {
                description: backendErrorMessage,
                duration: 7000, // Longer duration for validation errors
            });
        }
    };

    const getSubmitButtonText = () => {
        if (cleanDataMutation.isPending || llmEnrichmentMutation.isPending || emailDiscoveryMutation.isPending || emailGenerationMutation.isPending) {
            return 'Processing...';
        }
        if (selectedEnrichmentOptions.includes('data-clean')) {
            return 'Process Data Clean';
        }
        if (selectedEnrichmentOptions.includes('email-discovery')) {
            return 'Process Email Discovery';
        }
        if (selectedEnrichmentOptions.includes('email-generation')) {
            return 'Process Email Generation';
        }
        if (selectedEnrichmentOptions.length > 0) {
            const enrichmentType = selectedEnrichmentOptions[0];
            return `Process ${getEnrichmentTitle(enrichmentType)}`;
        }
        return 'Process Data';
    };

    const isSubmitDisabled = () => {
        if (cleanDataMutation.isPending || llmEnrichmentMutation.isPending || emailDiscoveryMutation.isPending || emailGenerationMutation.isPending) return true;
        if (selectedEnrichmentOptions.length === 0) return true;

        // Check if any selected enrichment is already completed (except data-clean and email-discovery)
        for (const option of selectedEnrichmentOptions) {
            if (option !== 'data-clean' && completedEnrichmentOptions.includes(option)) {
                return true; // Disable if any non-exempt enrichment is already completed
            }
        }

        // Email Discovery doesn't need configuration, so it's always enabled when selected
        if (selectedEnrichmentOptions.includes('email-discovery')) {
            return false;
        }

        // Email Generation needs prompt configuration
        if (selectedEnrichmentOptions.includes('email-generation')) {
            const config = enrichmentConfigs['email-generation'];
            return !config?.prompt;
        }

        // Check if any LLM enrichment is selected but missing config
        for (const option of selectedEnrichmentOptions) {
            if (option === 'data-clean' || option === 'email-discovery' || option === 'email-generation') continue; // Skip special handling options

            if (option === 'domain-enrichment') {
                // Check domain enrichment config specifically
                if (!domainEnrichmentConfig) {
                    return true;
                }
            } else {
                // Check other enrichment configs
                if (!enrichmentConfigs[option]) {
                    return true;
                }
            }
        }

        if (selectedEnrichmentOptions.includes('data-clean')) {
            const cleanDataConfig = processingConfig.cleanDataConfig;
            if (!cleanDataConfig) return true;

            const hasAnyEnabledOption = cleanDataConfig.enableSpecialCharacters ||
                cleanDataConfig.enableCompanySuffixes ||
                cleanDataConfig.enableDeduplication;

            const hasSelectedColumns = cleanDataConfig.selectedColumns.specialCharacters.length > 0 ||
                cleanDataConfig.selectedColumns.companySuffixes.length > 0 ||
                cleanDataConfig.selectedColumns.deduplication.length > 0;

            return !hasAnyEnabledOption || !hasSelectedColumns;
        }
        return false;
    };

    return (
        <>
            {/* Floating Settings */}
            <FloatingSettings
                showSubmitButton={selectedEnrichmentOptions.length > 0}
                submitButtonText={getSubmitButtonText()}
                isSubmitDisabled={isSubmitDisabled()}
                onSubmit={handleProcessEnrichment}
                isSubmitLoading={cleanDataMutation.isPending || llmEnrichmentMutation.isPending || emailDiscoveryMutation.isPending || emailGenerationMutation.isPending}
            >
                <EnrichmentOptions
                    selectedOptions={selectedEnrichmentOptions}
                    onOptionsChange={setSelectedEnrichmentOptions}
                    onOpenDomainModal={handleOpenDomainModal}
                    domainEnrichmentConfig={domainEnrichmentConfig}
                    onEditDomainConfig={handleEditDomainConfig}
                    completedOptions={completedEnrichmentOptions}
                    onCompletedOptionsChange={setCompletedEnrichmentOptions}
                    onOpenEnrichmentModal={handleOpenEnrichmentModal}
                    enrichmentConfigs={enrichmentConfigs}
                />
            </FloatingSettings>

            {/* Unified Enrichment Modal - Rendered at root level */}
            <EnrichmentModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveConfig}
                existingConfig={getCurrentConfig()}
                enrichmentType={currentEnrichmentType}
                title={getEnrichmentTitle(currentEnrichmentType)}
            />

            {/* Completion Confirmation Dialog */}
            <Dialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader className="text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-4">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                        <DialogTitle className="text-xl font-semibold text-gray-900">
                            Complete Enrichment Process?
                        </DialogTitle>
                        <DialogDescription className="text-gray-600 mt-2">
                            Are you sure you want to complete the enrichment process? This will finalize your campaign and redirect you to the campaigns list.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-6">
                        <Button
                            variant="outline"
                            onClick={handleCancelCompletion}
                            className="w-full sm:w-auto"
                        >
                            <X className="mr-2 h-4 w-4" />
                            Cancel
                        </Button>
                        <Button
                            variant="default"
                            onClick={handleConfirmCompletion}
                            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700"
                        >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Complete Processing
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Main Content */}

            {/* Header */}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="py-1">
                    {/* Campaign header */}
                    <CampaignHeader
                        campaignName={campaignInfo?.name || 'Campaign'}
                        campaignDescription={campaignInfo?.description || 'Campaign description'}
                        recordsCount={excelData?.length || uploadedData?.length || 0}
                        columnsCount={excelColumns?.length || 0}

                        backButtonWarningTitle="Leave Data Enrichment?"
                        backButtonWarningMessage="Are you sure you want to go back to campaigns? Your enrichment configurations and any processed data will be lost."
                    />

                    <Navigation
                        steps={steps}
                        currentStep={2}
                        onStepClick={(step) => {
                            if (step === 0) {
                                // Save current state before navigating
                                updateProcessingConfig({
                                    ...processingConfig,
                                    selectedEnrichmentOptions
                                });
                                navigate({ to: '/campaigns/new' })
                            } else if (step === 1) {
                                // Save current state before navigating
                                updateProcessingConfig({
                                    ...processingConfig,
                                    selectedEnrichmentOptions
                                });
                                navigate({ to: '/campaigns/new/preview' })
                            } else if (step === 2) {
                                return // Already on enrichments step
                            }
                        }}
                    />
                </div>
            </div>


            {/* Main Content Area */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Data Enrichment</h2>
                    <p className="text-gray-600">
                        Setup enrichment options and preview your data before processing
                    </p>
                </div>

                {/* Error Message Display */}
                {errorMessage && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                            <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                            <div className="flex-1">
                                <h3 className="text-sm font-medium text-red-800 mb-1">
                                    {errorTitle}
                                </h3>
                                <p className="text-sm text-red-700">
                                    {errorMessage}
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setErrorMessage('')
                                    setErrorTitle('')
                                }}
                                className="text-red-400 hover:text-red-600 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Completed Enrichments Section */}
                <CompletedEnrichments
                    completedOptions={completedEnrichmentOptions.filter(option => !hiddenCompletedOptions.includes(option))}
                    onRemove={handleHideCompletedEnrichment}
                />

                {/* Excel Preview */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <ExcelPreview />
                </div>

                {/* Bottom Navigation */}
                <div className="mt-8 flex justify-between items-center">
                    <button
                        onClick={handleBack}
                        className="flex items-center space-x-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                    >
                        <span>← Back to Preview</span>
                    </button>

                    <div className="flex items-center space-x-4">

                        <button
                            onClick={handleContinueToFinalProcessing}
                            className="flex items-center space-x-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                        >
                            <span>
                                Complete the  Final Processing
                                {completedEnrichmentOptions.length > 0 && ` (${completedEnrichmentOptions.length} enrichments completed)`}
                            </span>
                        </button>
                    </div>
                </div>
            </div>

        </>
    )
}

export const Route = createFileRoute('/campaigns/new/enrichments')({
    component: EnrichmentsStep,
}) 