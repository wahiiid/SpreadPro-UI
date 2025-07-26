import React, { createContext, useContext, useState, ReactNode } from 'react';

// Frontend Configuration Types
export interface FrontendConfig {
    theme: 'light' | 'dark' | 'system';
    language: string;
    timezone: string;
    dateFormat: string;
    currency: string;
    notifications: {
        email: boolean;
        push: boolean;
        inApp: boolean;
    };
    ui: {
        compactMode: boolean;
        sidebarCollapsed: boolean;
        showTooltips: boolean;
    };
}

// Backend Configuration Types
export interface BackendConfig {
    apis: {
        prospeoApiKey: string;
        openaiApiKey: string;
        emailValidationService: string;
        dataEnrichmentService: string;
    };
    processing: {
        batchSize: number;
        maxRetries: number;
        timeoutMs: number;
        concurrentRequests: number;
    };
    storage: {
        dataRetentionDays: number;
        maxFileSize: number;
        allowedFileTypes: string[];
        encryptionEnabled: boolean;
    };
    security: {
        apiRateLimit: number;
        sessionTimeout: number;
        mfaEnabled: boolean;
        auditLogging: boolean;
    };
}

// Processing Configuration (existing)
export interface ProcessingConfig {
    specialCharacters: string[];
    companySuffixes: string[];
    columnsToDelete: string[];
    prospeoApiKey: string;
    openaiApiKey: string;
    selectedEnrichmentOptions?: string[];
    cleanDataConfig?: {
        selectedColumns: {
            specialCharacters: string[];
            companySuffixes: string[];
            deduplication: string[];
        };
        enableSpecialCharacters: boolean;
        enableCompanySuffixes: boolean;
        enableDeduplication: boolean;
    };
    // Store S3 paths for completed enrichments
    completedEnrichmentPaths?: {
        [enrichmentId: string]: string; // enrichmentId -> s3_path
    };
}

interface ConfigurationContextType {
    frontendConfig: FrontendConfig;
    backendConfig: BackendConfig;
    processingConfig: ProcessingConfig;
    updateFrontendConfig: (config: Partial<FrontendConfig>) => void;
    updateBackendConfig: (config: Partial<BackendConfig>) => void;
    updateProcessingConfig: (config: Partial<ProcessingConfig>) => void;
    resetToDefaults: () => void;
}

const defaultFrontendConfig: FrontendConfig = {
    theme: 'system',
    language: 'en-US',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    currency: 'USD',
    notifications: {
        email: true,
        push: true,
        inApp: true,
    },
    ui: {
        compactMode: false,
        sidebarCollapsed: false,
        showTooltips: true,
    },
};

const defaultBackendConfig: BackendConfig = {
    apis: {
        prospeoApiKey: '',
        openaiApiKey: '',
        emailValidationService: 'prospeo',
        dataEnrichmentService: 'openai',
    },
    processing: {
        batchSize: 100,
        maxRetries: 3,
        timeoutMs: 30000,
        concurrentRequests: 5,
    },
    storage: {
        dataRetentionDays: 30,
        maxFileSize: 50 * 1024 * 1024, // 50MB
        allowedFileTypes: ['csv', 'xlsx', 'json'],
        encryptionEnabled: true,
    },
    security: {
        apiRateLimit: 1000,
        sessionTimeout: 3600,
        mfaEnabled: false,
        auditLogging: true,
    },
};

const defaultProcessingConfig: ProcessingConfig = {
    specialCharacters: ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '-', '_', '=', '+'],
    companySuffixes: ['INC', 'LLC', 'CORP', 'LTD', 'CO', 'COMPANY', 'CORPORATION', 'LIMITED'],
    columnsToDelete: [],
    prospeoApiKey: '',
    openaiApiKey: '',
    selectedEnrichmentOptions: [],
};

const ConfigurationContext = createContext<ConfigurationContextType | undefined>(undefined);

export const useConfiguration = () => {
    const context = useContext(ConfigurationContext);
    if (context === undefined) {
        throw new Error('useConfiguration must be used within a ConfigurationProvider');
    }
    return context;
};

interface ConfigurationProviderProps {
    children: ReactNode;
}

export const ConfigurationProvider: React.FC<ConfigurationProviderProps> = ({ children }) => {
    const [frontendConfig, setFrontendConfig] = useState<FrontendConfig>(defaultFrontendConfig);
    const [backendConfig, setBackendConfig] = useState<BackendConfig>(defaultBackendConfig);
    const [processingConfig, setProcessingConfig] = useState<ProcessingConfig>(defaultProcessingConfig);

    const updateFrontendConfig = (config: Partial<FrontendConfig>) => {
        setFrontendConfig(prev => ({ ...prev, ...config }));
    };

    const updateBackendConfig = (config: Partial<BackendConfig>) => {
        setBackendConfig(prev => ({ ...prev, ...config }));
    };

    const updateProcessingConfig = (config: Partial<ProcessingConfig>) => {
        setProcessingConfig(prev => ({ ...prev, ...config }));
    };

    const resetToDefaults = () => {
        setFrontendConfig(defaultFrontendConfig);
        setBackendConfig(defaultBackendConfig);
        setProcessingConfig(defaultProcessingConfig);
    };

    const value: ConfigurationContextType = {
        frontendConfig,
        backendConfig,
        processingConfig,
        updateFrontendConfig,
        updateBackendConfig,
        updateProcessingConfig,
        resetToDefaults,
    };

    return (
        <ConfigurationContext.Provider value={value}>
            {children}
        </ConfigurationContext.Provider>
    );
}; 