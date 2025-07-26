

interface DomainEnrichmentConfig {
    llmModel: string;
    prompt: string;
}

interface DomainEnrichmentDisplayProps {
    config: DomainEnrichmentConfig;
    onEdit: () => void;
    enrichmentType?: string; // Optional parameter to identify the enrichment type
}

export function DomainEnrichmentDisplay({ config, onEdit, enrichmentType }: DomainEnrichmentDisplayProps) {
    // Check if this is Email Generation enrichment type
    const isEmailGeneration = enrichmentType === 'email-generation';

    return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">


            {/* Configuration Details */}
            <div className="space-y-3">
                {/* Only show LLM Model for non-email generation enrichments */}
                {!isEmailGeneration && (
                    <div>
                        <span className="text-xs font-medium text-blue-800">LLM Model:</span>
                        <p className="text-sm text-blue-900 mt-1">{config.llmModel}</p>
                    </div>
                )}

                <div>
                    <span className="text-xs font-medium text-blue-800">Prompt:</span>
                    <p className="text-sm text-blue-900 mt-1 bg-white p-1 rounded-md overflow-y-auto max-h-40 whitespace-pre-wrap">{config.prompt}</p>
                </div>
            </div>

            {/* Edit Button */}
            <div className="pt-2">
                <button
                    onClick={onEdit}
                    className="text-indigo-700 hover:text-indigo-500 border-b border-indigo-700 text-sm font-medium transition-colors duration-200"
                >
                    Edit Configuration
                </button>
            </div>
        </div>
    );
} 