import { LucideIcon } from 'lucide-react';

interface Step {
  id: number;
  title: string;
  icon: LucideIcon;
  description: string;
}

interface NavigationProps {
  steps: Step[];
  currentStep: number;
  onStepClick: (step: number) => void;
}

export function Navigation({ steps, currentStep, onStepClick }: NavigationProps) {
  const handleStepClick = (step: Step, isClickable: boolean) => {
    if (isClickable && onStepClick) {
      onStepClick(step.id);
    }
  };

  return (
    <div className="mb-8">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex justify-center">
          <div className="flex items-center" style={{ width: 'fit-content' }}>
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              // Allow navigation to completed steps and current step, but not future steps
              const isClickable = step.id <= currentStep;

              return (
                <div key={step.id} className="flex items-center">
                  <button
                    onClick={() => handleStepClick(step, isClickable)}
                    disabled={!isClickable}
                    title={
                      isActive
                        ? `Current step: ${step.title}`
                        : isCompleted
                          ? `Go back to ${step.title}`
                          : `${step.title} - Complete previous steps first`
                    }
                    className={`
                      flex items-center space-x-2 px-4 py-3 rounded-full font-medium transition-colors duration-200 whitespace-nowrap
                      ${isActive
                        ? 'bg-indigo-600 text-white shadow-lg cursor-default'
                        : isCompleted
                          ? 'bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer'
                          : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                      }
                    `}
                  >
                    <Icon size={16} />
                    <span className="hidden sm:inline">{step.title}</span>
                  </button>
                  {index < steps.length - 1 && (
                    <div className={`w-24 h-0.5 mx-4 transition-colors duration-200 ${isCompleted ? 'bg-green-300' : 'bg-gray-200'
                      }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}