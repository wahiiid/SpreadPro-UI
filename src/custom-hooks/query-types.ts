// Campaign API Types
export interface Campaign {
  campaign_id: string;
  description: string;
  name: string;
  status: 'active' | 'paused' | 'completed' | 'draft' | 'inactive';
}

export interface CampaignsResponse {
  results: Campaign[];
  statusCode: number;
  statusMessage: string;
}

// LLM Models API Types
export interface LLMModelsResponse {
  statusCode: number;
  statusMessage: string;
  results: {
    enrichment_type: string;
    model_names: string[];
  };
}

// Default Prompts API Types
export interface DefaultPrompt {
  prompt_id: string;
  enrichment_type: string;
  prompt_text: string;
}

export interface DefaultPromptsResponse {
  statusCode: number;
  statusMessage: string;
  results: DefaultPrompt[];
}

// Create Campaign Types
export interface CreateCampaignRequest {
  campaign_name: string;
  campaign_description?: string;
  dataset: File;
}

export interface CreateCampaignResponse {
  results: {
    campaign_id: string;
    dataset_id: string;
  }[];
  statusCode: number;
  statusMessage: string;
}

// Remove Columns Types
export interface RemoveColumnsRequest {
  campaign_uuid: string;
  columns_to_remove: string[];
  dataset_uuid: string;
}

export interface RemoveColumnsResponse {
  results: {
    message: string;
  };
  statusCode: number;
  statusMessage: string;
}

// Dataset View Types
export interface DatasetViewResponse {
  result: {
    dataset_name: string;
    dataset_type: string;
    content: string;
    encoding: string;
  };
  statusCode: number;
  statusMessage: string;
}

export interface ApiError {
  errorMessage?: string;
  statusCode: number;
  statusMessage: string;
  detail?: Array<{
    loc: string[];
    msg: string;
    type: string;
  }>;
}

// API Configuration - USER_ID is now obtained from Keycloak userInfo

// Clean Data Types
export interface CleanDataFix {
  column: string[];
  fix_type: 'remove_special_characters' | 'remove_company_suffix' | 'deduplicate';
  options?: {
    characters?: string[];
    suffixes?: string[];
  };
}

export interface CleanDataRequest {
  campaign_uuid: string;
  dataset_uuid: string;
  fixes: CleanDataFix[];
}

export interface CleanDataResponse {
  results: {
    message: string;
    s3_path: string;
  };
  statusCode: number;
  statusMessage: string;
}

// Delete Campaign Types
export interface DeleteCampaignResponse {
  results: {
    message: string;
  };
  statusCode: number;
  statusMessage: string;
}

// Edit Campaign Types
export interface EditCampaignRequest {
  campaign_name: string;
  campaign_description?: string;
}

export interface EditCampaignResponse {
  results: {
    message: string;
  };
  statusCode: number;
  statusMessage: string;
}

// LLM Enrichment API Types
export interface EnrichmentResult {
  confidence_score: number;
  input_values: Record<string, any>;
  row_index: number;
  status: 'success' | 'error' | 'pending';
  [key: string]: any; // For dynamic column names from the response
}

export interface LLMEnrichmentRequest {
  dataset_uuid: string;
  enrichment_type: string;
  llm: string;
  prompt: string;
  model_params?: {
    max_tokens?: number;
    temperature?: number;
    [key: string]: any;
  };
  row_limit?: number;
}

export interface LLMEnrichmentResponse {
  result: {
    dataset_id: string;
    base64_url: string;
    message: string;
  };
  statusCode: number;
  statusMessage: string;
}

// Email Discovery API Types
export interface EmailDiscoveryRequest {
  dataset_uuid: string;
}

export interface EmailDiscoveryResponse {
  download_url: string;
  statusCode: number;
  statusMessage: string;
}

// Email Generation API Types
export interface EmailGenerationRequest {
  dataset_uuid: string;
  enrichment_type: "email_generation";
  prompt: string;
}

export interface EmailGenerationResponse {
  results: Array<{
    base64_url: string;
  }>;
  statusCode: number;
  statusMessage: string;
}

// Get All Columns API Types
export interface GetAllColumnsResponse {
  results: string[];
  statusCode: number;
  statusMessage: string;
}

// Get campaign by ID types
export interface GetCampaignByIdResponse {
  result: {
    campaign_name: string;
    campaign_description: string;
    dataset_uuids: string[];
  };
  statusCode: number;
  statusMessage: string;
}
