import { create } from 'zustand'

type StepState = {
  Step1: boolean
  Step2: boolean
  Step3: boolean
  patient_id: string
}

type StepStateSetters = {
  setStep1: (Step1: StepState['Step1']) => void
  setStep2: (Step2: StepState['Step2']) => void
  setStep3: (Step3: StepState['Step3']) => void
  setPatientId: (patient_id: StepState['patient_id']) => void
}

export const useStepState = create<StepState & StepStateSetters>((set) => ({
  Step1: false,
  Step2: false,
  Step3: false,
  patient_id: '',
  setStep1: (Step1) => set(() => ({ Step1: Step1 })),
  setStep2: (Step2) => set(() => ({ Step2: Step2 })),
  setStep3: (Step3) => set(() => ({ Step3: Step3 })),
  setPatientId: (patient_id) => set(() => ({ patient_id: patient_id })),
}))
