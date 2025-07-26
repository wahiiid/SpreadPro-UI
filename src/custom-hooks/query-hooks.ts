import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios, { AxiosResponse } from 'axios';
import { CampaignsResponse, CreateCampaignRequest, CreateCampaignResponse, RemoveColumnsRequest, RemoveColumnsResponse, CleanDataRequest, CleanDataResponse, DeleteCampaignResponse, EditCampaignRequest, EditCampaignResponse, DatasetViewResponse, LLMModelsResponse, DefaultPromptsResponse, LLMEnrichmentRequest, LLMEnrichmentResponse, GetAllColumnsResponse, EmailDiscoveryRequest, EmailDiscoveryResponse, EmailGenerationRequest, EmailGenerationResponse, GetCampaignByIdResponse } from './query-types';
import { useAuthStore } from './auth-store';

const URL = import.meta.env.VITE_API_BASE_URL || 'https://spreadpro.nablainfotech.com';

// Fetch campaigns for a user
async function fetchCampaigns(userId: string, token: string): Promise<CampaignsResponse> {
  const res: AxiosResponse<CampaignsResponse> = await axios.get(
    `${URL}/campaigns/${userId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return res.data;
}

// React Query hook for fetching campaigns
export const useCampaigns = () => {
  const keycloak = useAuthStore((state) => state.keycloak);
  const userInfo = useAuthStore((state) => state.userInfo);
  const token = keycloak?.token;
  const isToken = keycloak?.token === undefined ? false : true;
  const isDev = import.meta.env.DEV;
  const userId = userInfo?.id;

  return useQuery({
    queryKey: ['campaigns', userId],
    queryFn: () => fetchCampaigns(userId!, token!),
    enabled: (isDev || !!isToken) && !!userId,
    staleTime: 0, // Always refetch when mounted
    gcTime: 0, // Don't cache the data
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window regains focus
    retry: 3,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

// Fetch LLM models for enrichment type
async function fetchLLMModels(enrichmentType: string, token: string): Promise<LLMModelsResponse> {
  const encodedType = encodeURIComponent(enrichmentType);
  const url = `${URL}/llm/available-models/${encodedType}`;


  const res: AxiosResponse<LLMModelsResponse> = await axios.get(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
}

// React Query hook for fetching LLM models
export const useLLMModels = (enrichmentType: string) => {
  const keycloak = useAuthStore((state) => state.keycloak);
  const token = keycloak?.token;
  const isToken = keycloak?.token === undefined ? false : true;
  const isDev = import.meta.env.DEV;

  return useQuery({
    queryKey: ['llm-models', enrichmentType],
    queryFn: async () => {
     
      try {
        const result = await fetchLLMModels(enrichmentType, token!);
      
        return result;
      } catch (error: any) {
        console.error('LLM models API error:', error);
        if (error.response) {
          console.error('Error response:', error.response.data);
          console.error('Error status:', error.response.status);
        }
        throw error;
      }
    },
    enabled: (isDev || !!isToken) && !!enrichmentType,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
};

// Fetch default prompts for enrichment type
async function fetchDefaultPrompts(enrichmentType: string, token: string): Promise<DefaultPromptsResponse> {
  const res: AxiosResponse<DefaultPromptsResponse> = await axios.get(
    `${URL}/default-prompt/${encodeURIComponent(enrichmentType)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return res.data;
}

// React Query hook for fetching default prompts
export const useDefaultPrompts = (enrichmentType: string) => {
  const keycloak = useAuthStore((state) => state.keycloak);
  const token = keycloak?.token;
  const isToken = keycloak?.token === undefined ? false : true;
  const isDev = import.meta.env.DEV;

  return useQuery({
    queryKey: ['default-prompts', enrichmentType],
    queryFn: () => fetchDefaultPrompts(enrichmentType, token!),
    enabled: (isDev || !!isToken) && !!enrichmentType,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
};

// Create campaign API call
async function createCampaign(data: CreateCampaignRequest, userId: string, token: string): Promise<CreateCampaignResponse> {
  const formData = new FormData();
  formData.append('user_id', userId);
  formData.append('campaign_name', data.campaign_name);
  if (data.campaign_description) {
    formData.append('campaign_description', data.campaign_description);
  }
  formData.append('dataset', data.dataset);

  const res: AxiosResponse<CreateCampaignResponse> = await axios.post(
    `${URL}/campaigns`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return res.data;
}

// React Query hook for creating campaigns
export const useCreateCampaign = () => {
  const queryClient = useQueryClient();
  const keycloak = useAuthStore((state) => state.keycloak);
  const userInfo = useAuthStore((state) => state.userInfo);
  const token = keycloak?.token;
  const userId = userInfo?.id;

  return useMutation({
    mutationFn: (data: CreateCampaignRequest) => createCampaign(data, userId!, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
};

// Remove columns API call
async function removeColumns(data: RemoveColumnsRequest, token: string): Promise<RemoveColumnsResponse> {
  const res: AxiosResponse<RemoveColumnsResponse> = await axios.post(
    `${URL}/remove-columns`,
    data,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return res.data;
}

// React Query hook for removing columns
export const useRemoveColumns = () => {
  const queryClient = useQueryClient();
  const keycloak = useAuthStore((state) => state.keycloak);
  const token = keycloak?.token;

  return useMutation({
    mutationFn: (data: RemoveColumnsRequest) => removeColumns(data, token!),
    onSuccess: (_, variables) => {
      // Invalidate the dataset cache to trigger a refetch of updated data
      queryClient.invalidateQueries({ queryKey: ['dataset', variables.dataset_uuid] });
    },
  });
};

// View dataset API call
async function viewDataset(datasetId: string, token: string): Promise<DatasetViewResponse> {
  const res: AxiosResponse<DatasetViewResponse> = await axios.get(
    `${URL}/datasets/view/${datasetId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return res.data;
  
}

// React Query hook for viewing dataset
export const useViewDataset = (datasetId: string | null) => {
  const keycloak = useAuthStore((state) => state.keycloak);
  const token = keycloak?.token;
  const isToken = keycloak?.token === undefined ? false : true;
  const isDev = import.meta.env.DEV;

  return useQuery({
    queryKey: ['dataset', datasetId],
    queryFn: () => viewDataset(datasetId!, token!),
    enabled: (isDev || !!isToken) && !!datasetId && datasetId.trim() !== '',
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
};

// Clean data API call
async function cleanData(data: CleanDataRequest, token: string): Promise<CleanDataResponse> {
  const res: AxiosResponse<CleanDataResponse> = await axios.post(
    `${URL}/clean-data`,
    data,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return res.data;
}

// React Query hook for cleaning data
export const useCleanData = () => {
  const queryClient = useQueryClient();
  const keycloak = useAuthStore((state) => state.keycloak);
  const token = keycloak?.token;

  return useMutation({
    mutationFn: (data: CleanDataRequest) => cleanData(data, token!),
    onSuccess: (_response, variables) => {
      // Invalidate the dataset cache to trigger a refetch of updated data
      queryClient.invalidateQueries({ queryKey: ['dataset', variables.dataset_uuid] });
      
      // Also invalidate any related campaign data
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      
    },
  });
};

// Download processed data API call
async function downloadProcessedData(campaignId: string, processType: string, token: string): Promise<Blob> {
  const res: AxiosResponse<Blob> = await axios.get(
    `${URL}/download/${campaignId}/${processType}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      responseType: 'blob',
    }
  );
  return res.data;
}

// React Query hook for downloading processed data
export const useDownloadProcessedData = () => {
  const keycloak = useAuthStore((state) => state.keycloak);
  const token = keycloak?.token;

  return useMutation({
    mutationFn: ({ campaignId, processType }: { campaignId: string; processType: string }) => 
      downloadProcessedData(campaignId, processType, token!),
  });
};

// Download file from S3 API call
async function downloadFromS3(s3Path: string, token: string): Promise<Blob> {
  const res: AxiosResponse<Blob> = await axios.get(
    `${URL}/download-s3`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        s3_path: s3Path
      },
      responseType: 'blob',
    }
  );
  return res.data;
}

// React Query hook for downloading files from S3
export const useDownloadFromS3 = () => {
  const keycloak = useAuthStore((state) => state.keycloak);
  const token = keycloak?.token;

  return useMutation({
    mutationFn: (s3Path: string) => downloadFromS3(s3Path, token!),
  });
};

// Delete campaign API call
async function deleteCampaign(campaignUuid: string, token: string): Promise<DeleteCampaignResponse> {
  const res: AxiosResponse<DeleteCampaignResponse> = await axios.delete(
    `${URL}/campaigns/${campaignUuid}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return res.data;
}

// React Query hook for deleting a campaign
export const useDeleteCampaign = () => {
  const queryClient = useQueryClient();
  const keycloak = useAuthStore((state) => state.keycloak);
  const token = keycloak?.token;

  return useMutation({
    mutationFn: (campaignUuid: string) => deleteCampaign(campaignUuid, token!),
    onSuccess: () => {
      // Invalidate and refetch campaigns list after successful deletion
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
};

// Edit campaign API call
async function editCampaign(campaignUuid: string, data: EditCampaignRequest, userId: string, token: string): Promise<EditCampaignResponse> {
  const requestData = {
    ...data,
    user_id: userId
  };
  
  const res: AxiosResponse<EditCampaignResponse> = await axios.patch(
    `${URL}/campaigns/${campaignUuid}`,
    requestData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return res.data;
}

// React Query hook for editing a campaign
export const useEditCampaign = () => {
  const queryClient = useQueryClient();
  const keycloak = useAuthStore((state) => state.keycloak);
  const userInfo = useAuthStore((state) => state.userInfo);
  const token = keycloak?.token;
  const userId = userInfo?.id;

  return useMutation({
    mutationFn: ({ campaignUuid, data }: { campaignUuid: string; data: EditCampaignRequest }) => 
      editCampaign(campaignUuid, data, userId!, token!),
    onSuccess: () => {
      // Invalidate and refetch campaigns list after successful edit
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
};

// LLM Enrichment API call
async function enrichDatasetWithLLM(data: LLMEnrichmentRequest, token: string): Promise<LLMEnrichmentResponse> {
  const res: AxiosResponse<LLMEnrichmentResponse> = await axios.post(
    `${URL}/llm/enrich-dataset`,
    data,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return res.data;
}

// React Query hook for LLM enrichment
export const useLLMEnrichment = () => {
  const queryClient = useQueryClient();
  const keycloak = useAuthStore((state) => state.keycloak);
  const token = keycloak?.token;

  return useMutation({
    mutationFn: (data: LLMEnrichmentRequest) => enrichDatasetWithLLM(data, token!),
    onSuccess: (_response, variables) => {
      // Invalidate the dataset cache to trigger a refetch of updated data
      queryClient.invalidateQueries({ queryKey: ['dataset', variables.dataset_uuid] });
      
      // Also invalidate any related campaign data
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
};

// Email Discovery API call
async function findEmail(data: EmailDiscoveryRequest, token: string): Promise<EmailDiscoveryResponse> {
  const res: AxiosResponse<EmailDiscoveryResponse> = await axios.post(
    `${URL}/find-email`,
    data,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return res.data;
}

// React Query hook for email discovery
export const useEmailDiscovery = () => {
  const queryClient = useQueryClient();
  const keycloak = useAuthStore((state) => state.keycloak);
  const token = keycloak?.token;

  return useMutation({
    mutationFn: (data: EmailDiscoveryRequest) => findEmail(data, token!),
    onSuccess: (_response, variables) => {
      // Invalidate the dataset cache to trigger a refetch of updated data
      queryClient.invalidateQueries({ queryKey: ['dataset', variables.dataset_uuid] });
      
      // Also invalidate any related campaign data
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
};

// Email Generation API call
async function generateEmailTemplates(data: EmailGenerationRequest, token: string): Promise<EmailGenerationResponse> {
  const res: AxiosResponse<EmailGenerationResponse> = await axios.post(
    `${URL}/generate-email-templates`,
    data,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return res.data;
}

// React Query hook for email generation
export const useEmailGeneration = () => {
  const queryClient = useQueryClient();
  const keycloak = useAuthStore((state) => state.keycloak);
  const token = keycloak?.token;

  return useMutation({
    mutationFn: (data: EmailGenerationRequest) => generateEmailTemplates(data, token!),
    onSuccess: (_response, variables) => {
      // Invalidate the dataset cache to trigger a refetch of updated data
      queryClient.invalidateQueries({ queryKey: ['dataset', variables.dataset_uuid] });
      
      // Also invalidate any related campaign data
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
};

// Get all columns API call
async function getAllColumns(campaignUuid: string, datasetUuid: string, token: string): Promise<GetAllColumnsResponse> {
  const res: AxiosResponse<GetAllColumnsResponse> = await axios.get(
    `${URL}/datasets/${campaignUuid}/${datasetUuid}/columns`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return res.data;
}

// React Query hook for getting all columns
export const useGetAllColumns = (campaignUuid: string | null, datasetUuid: string | null) => {
  const keycloak = useAuthStore((state) => state.keycloak);
  const token = keycloak?.token;
  const isToken = keycloak?.token === undefined ? false : true;
  const isDev = import.meta.env.DEV;

  return useQuery({
    queryKey: ['dataset-columns', campaignUuid, datasetUuid],
    queryFn: () => getAllColumns(campaignUuid!, datasetUuid!, token!),
    enabled: (isDev || !!isToken) && !!campaignUuid && !!datasetUuid,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
};

// Get campaign by ID API call
async function getCampaignById(campaignId: string, token: string): Promise<GetCampaignByIdResponse> {
  const res: AxiosResponse<GetCampaignByIdResponse> = await axios.get(
    `${URL}/campaigns/by-id/${campaignId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return res.data;
}

// React Query hook for getting campaign by ID
export const useGetCampaignById = (campaignId: string | null) => {
  const keycloak = useAuthStore((state) => state.keycloak);
  const token = keycloak?.token;
  const isToken = keycloak?.token === undefined ? false : true;
  const isDev = import.meta.env.DEV;

  return useQuery({
    queryKey: ['campaign-by-id', campaignId],
    queryFn: () => getCampaignById(campaignId!, token!),
    enabled: (isDev || !!isToken) && !!campaignId && campaignId.trim() !== '',
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
};
