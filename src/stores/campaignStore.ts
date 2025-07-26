import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import * as XLSX from 'xlsx'

export interface CampaignInfo {
  name: string
  description: string
}

export interface CampaignData {
  campaignInfo: CampaignInfo
  fileName: string | null
  uploadedData: any[] | null
  columnsToDelete: string[]
  columnsToDeleteText: string
  currentStep: number
  createdCampaignId: string | null
  createdDatasetId: string | null
  uploadedFile: File | null
  // Add Excel-specific data
  excelData: any[] | null
  excelColumns: string[]
  isLoadingExcel: boolean
}

interface CampaignStore extends CampaignData {
  // Actions
  setCampaignInfo: (info: CampaignInfo) => void
  setFileName: (fileName: string) => void
  setUploadedData: (data: any[]) => void
  setColumnsToDelete: (columns: string[]) => void
  setColumnsToDeleteText: (text: string) => void
  setCurrentStep: (step: number) => void
  setCreatedCampaign: (campaignId: string, datasetId: string) => void
  setUploadedFile: (file: File | null) => void
  // Add Excel-specific actions
  parseExcelFile: (file: File) => Promise<void>
  setExcelData: (data: any[], columns: string[]) => void
  resetCampaign: () => void
  startNewCampaign: () => void
}

export const useCampaignStore = create<CampaignStore>()(
  persist(
    (set, get) => ({
      // Initial state
      campaignInfo: {
        name: '',
        description: ''
      },
      fileName: null,
      uploadedData: null,
      columnsToDelete: [],
      columnsToDeleteText: '',
      currentStep: 0,
  createdCampaignId: null,
  createdDatasetId: null,
  uploadedFile: null,
  // Add Excel-specific state
  excelData: null,
  excelColumns: [],
  isLoadingExcel: false,

      // Actions
      setCampaignInfo: (info) => set({ campaignInfo: info }),
      
      setFileName: (fileName) => set({ fileName }),
      
      setUploadedData: (data) => set({ uploadedData: data }),
      
      setColumnsToDelete: (columns) => set({ columnsToDelete: columns }),
      
      setColumnsToDeleteText: (text) => set({ columnsToDeleteText: text }),
      
      setCurrentStep: (step) => set({ currentStep: step }),
  
  setCreatedCampaign: (campaignId, datasetId) => set({ 
    createdCampaignId: campaignId, 
    createdDatasetId: datasetId 
  }),

  setUploadedFile: (file) => set({ uploadedFile: file }),

  // Add Excel/CSV parsing function
  parseExcelFile: async (file: File) => {
    set({ isLoadingExcel: true });
    
    try {
      let workbook: XLSX.WorkBook;
      
      if (file.type.includes('csv')) {
        // Handle CSV files
        const text = await file.text();
        workbook = XLSX.read(text, { type: 'string' });
      } else {
        // Handle Excel files
        const arrayBuffer = await file.arrayBuffer();
        workbook = XLSX.read(arrayBuffer, { type: 'array' });
      }
      
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Convert to JSON with header row
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (jsonData.length > 0) {
        // First row contains headers
        const headers = jsonData[0] as string[];
        // Rest of the rows contain data
        const dataRows = jsonData.slice(1);
        
        // Convert to object format
        const formattedData = dataRows.map((row: unknown) => {
          const rowArray = row as any[];
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header] = rowArray[index] || '';
          });
          return obj;
        });
        
        set({ 
          excelData: formattedData,
          excelColumns: headers,
          uploadedData: formattedData,
          isLoadingExcel: false
        });
      }
    } catch (error) {
      console.error('Error parsing file:', error);
      set({ isLoadingExcel: false });
      throw error;
    }
  },

  setExcelData: (data, columns) => set({ 
    excelData: data, 
    excelColumns: columns,
    uploadedData: data
  }),
      
      resetCampaign: () => set({
        campaignInfo: { name: '', description: '' },
        fileName: null,
        uploadedData: null,
        columnsToDelete: [],
        columnsToDeleteText: '',
    currentStep: 0,
    createdCampaignId: null,
    createdDatasetId: null,
    uploadedFile: null,
    excelData: null,
    excelColumns: [],
    isLoadingExcel: false
      }),

      // Add new function to start fresh campaign
      startNewCampaign: () => {
        // Clear all state
        set({
          campaignInfo: { name: '', description: '' },
          fileName: null,
          uploadedData: null,
          columnsToDelete: [],
          columnsToDeleteText: '',
          currentStep: 0,
          createdCampaignId: null,
          createdDatasetId: null,
          uploadedFile: null,
          excelData: null,
          excelColumns: [],
          isLoadingExcel: false
        });
        
        // Clear localStorage/sessionStorage for this store
        localStorage.removeItem('campaign-store');
        sessionStorage.removeItem('campaign-store');
      }
    }),
    {
      name: 'campaign-store',
      // Only persist essential data, not temporary states
      partialize: (state) => ({
        campaignInfo: state.campaignInfo,
        fileName: state.fileName,
        currentStep: state.currentStep,
        createdCampaignId: state.createdCampaignId,
        createdDatasetId: state.createdDatasetId,
        columnsToDeleteText: state.columnsToDeleteText,
        excelColumns: state.excelColumns
      }),
    }
  )
) 