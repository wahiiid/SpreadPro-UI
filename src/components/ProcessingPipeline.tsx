import React, { useState, useEffect } from 'react';
import { ArrowLeft, Play, CheckCircle, AlertCircle, Loader } from 'lucide-react';

interface ProcessingConfig {
  specialCharacters: string[];
  companySuffixes: string[];
  columnsToDelete: string[];
  prospeoApiKey: string;
  openaiApiKey: string;
}

interface ProcessedData {
  originalData: any[];
  processedData: any[];
  statistics: {
    totalRecords: number;
    duplicatesRemoved: number;
    emailsEnriched: number;
    domainsGenerated: number;
  };
}

interface ProcessingPipelineProps {
  data: any[];
  config: ProcessingConfig;
  onComplete: (result: ProcessedData) => void;
  onBack: () => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
}

interface ProcessingStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
}

export function ProcessingPipeline({
  data,
  config,
  onComplete,
  onBack,
  isProcessing,
  setIsProcessing
}: ProcessingPipelineProps) {
  const [steps, setSteps] = useState<ProcessingStep[]>([
    {
      id: 'clean-data',
      title: 'Data Cleaning',
      description: 'Removing special characters and company suffixes',
      status: 'pending',
      progress: 0
    },
    {
      id: 'remove-duplicates',
      title: 'Duplicate Removal',
      description: 'Removing duplicate entries based on',
      status: 'pending',
      progress: 0
    },
    {
      id: 'generate-domains',
      title: 'Domain Generation',
      description: 'AI-powered company domain discovery',
      status: 'pending',
      progress: 0
    },
    {
      id: 'email-enrichment',
      title: 'Email Enrichment',
      description: 'Finding email addresses using Prospeo API',
      status: 'pending',
      progress: 0
    },
    {
      id: 'company-analysis',
      title: 'Company Analysis',
      description: 'AI-powered company insights and analysis',
      status: 'pending',
      progress: 0
    },
    {
      id: 'use-cases',
      title: 'Use Case Generation',
      description: 'Creating specific use cases for each company',
      status: 'pending',
      progress: 0
    },
    {
      id: 'email-content',
      title: 'Email Content Creation',
      description: 'Generating personalized email content',
      status: 'pending',
      progress: 0
    }
  ]);

  const updateStep = (id: string, status: ProcessingStep['status'], progress: number) => {
    setSteps(prev => prev.map(step =>
      step.id === id ? { ...step, status, progress } : step
    ));
  };

  const startProcessing = async () => {
    setIsProcessing(true);
    let processedData = [...data];

    // Remove unwanted columns
    processedData = processedData.map(row => {
      const newRow = { ...row };
      config.columnsToDelete.forEach(col => {
        delete newRow[col];
      });
      return newRow;
    });

    try {
      // Step 1: Data Cleaning
      updateStep('clean-data', 'processing', 0);
      await simulateDelay(2000);

      processedData = processedData.map(row => {
        const cleanedRow = { ...row };

        // Clean First Name and Last Name
        if (cleanedRow['First Name']) {
          config.specialCharacters.forEach(char => {
            cleanedRow['First Name'] = cleanedRow['First Name'].replace(new RegExp(`\\${char}`, 'g'), '');
          });
        }
        if (cleanedRow['Last Name']) {
          config.specialCharacters.forEach(char => {
            cleanedRow['Last Name'] = cleanedRow['Last Name'].replace(new RegExp(`\\${char}`, 'g'), '');
          });
        }

        // Clean Company Name
        if (cleanedRow['Company Name']) {
          let companyName = cleanedRow['Company Name'];
          config.companySuffixes.forEach(suffix => {
            const regex = new RegExp(`\\b${suffix}\\b`, 'gi');
            companyName = companyName.replace(regex, '').trim();
          });
          cleanedRow['Company Name'] = companyName;
        }

        return cleanedRow;
      });

      updateStep('clean-data', 'completed', 100);

      // Step 2: Remove Duplicates
      updateStep('remove-duplicates', 'processing', 0);
      await simulateDelay(1500);

      const uniqueData: any[] = [];
      const seenUrls = new Set();
      let duplicatesRemoved = 0;

      processedData.forEach(row => {
        const linkedinUrl = row['LinkedIn URL'] || '';
        if (!seenUrls.has(linkedinUrl) || !linkedinUrl) {
          seenUrls.add(linkedinUrl);
          uniqueData.push(row);
        } else {
          duplicatesRemoved++;
        }
      });

      processedData = uniqueData;
      updateStep('remove-duplicates', 'completed', 100);

      // Step 3: Generate Domains
      updateStep('generate-domains', 'processing', 0);
      await simulateDelay(3000);

      let domainsGenerated = 0;
      processedData = processedData.map(row => {
        if (!row['Company Domain'] && row['Company Name']) {
          // Simulate AI domain generation
          const domain = row['Company Name'].toLowerCase()
            .replace(/\s+/g, '')
            .replace(/[^a-z0-9]/g, '') + '.com';
          row['Company Domain'] = domain;
          domainsGenerated++;
        }
        return row;
      });

      updateStep('generate-domains', 'completed', 100);

      // Step 4: Email Enrichment
      updateStep('email-enrichment', 'processing', 0);
      await simulateDelay(4000);

      let emailsEnriched = 0;
      processedData = processedData.map(row => {
        if (!row['Email'] && row['First Name'] && row['Last Name'] && row['Company Domain']) {
          // Simulate email discovery
          const email = `${row['First Name'].toLowerCase()}.${row['Last Name'].toLowerCase()}@${row['Company Domain']}`;
          row['Email'] = email;
          row['MX Provider'] = 'Google Workspace';
          row['EmailID'] = `email_${Math.random().toString(36).substr(2, 9)}`;
          emailsEnriched++;
        }
        return row;
      });

      updateStep('email-enrichment', 'completed', 100);

      // Step 5: Company Analysis
      updateStep('company-analysis', 'processing', 0);
      await simulateDelay(3500);

      processedData = processedData.map(row => {
        if (row['Company Name']) {
          row['Company Analysis'] = `${row['Company Name']} is a dynamic company operating in their sector with strong market presence. They show potential for growth and innovation in their industry vertical.`;
          row['Company Confidence Score'] = Math.floor(Math.random() * 30) + 70; // 70-100
        }
        return row;
      });

      updateStep('company-analysis', 'completed', 100);

      // Step 6: Use Cases
      updateStep('use-cases', 'processing', 0);
      await simulateDelay(4500);

      const useCases = [
        'Customer acquisition optimization',
        'Digital transformation consulting',
        'Process automation solutions',
        'Data analytics implementation',
        'Marketing campaign optimization',
        'Sales funnel enhancement'
      ];

      processedData = processedData.map(row => {
        const randomUseCase = useCases[Math.floor(Math.random() * useCases.length)];
        row['Use Case'] = randomUseCase;
        row['Use Case Confidence Score'] = Math.floor(Math.random() * 25) + 75; // 75-100
        return row;
      });

      updateStep('use-cases', 'completed', 100);

      // Step 7: Email Content
      updateStep('email-content', 'processing', 0);
      await simulateDelay(3000);

      processedData = processedData.map(row => {
        if (row['First Name'] && row['Company Name']) {
          row['Email Text'] = `Hi ${row['First Name']},\n\nI hope this email finds you well. I came across ${row['Company Name']} and was impressed by your work in the industry. I believe our ${row['Use Case']} solution could help drive significant results for your team.\n\nWould you be interested in a brief conversation about how we can support your goals?\n\nBest regards`;
        }
        return row;
      });

      updateStep('email-content', 'completed', 100);

      // Complete processing
      const result: ProcessedData = {
        originalData: data,
        processedData,
        statistics: {
          totalRecords: processedData.length,
          duplicatesRemoved,
          emailsEnriched,
          domainsGenerated
        }
      };

      onComplete(result);
    } catch (error) {
      console.error('Processing error:', error);
      // Handle error state
    } finally {
      setIsProcessing(false);
    }
  };

  const simulateDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Processing Pipeline</h2>
        <p className="text-gray-600">
          Your data is being processed through multiple enrichment stages
        </p>
      </div>

      {/* Processing Steps */}
      <div className="space-y-4 mb-8">
        {steps.map((step, index) => (
          <div key={step.id} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center
                  ${step.status === 'completed' ? 'bg-green-100 text-green-600' :
                    step.status === 'processing' ? 'bg-blue-100 text-blue-600' :
                      step.status === 'error' ? 'bg-red-100 text-red-600' :
                        'bg-gray-100 text-gray-600'}
                `}>
                  {step.status === 'completed' ? (
                    <CheckCircle size={16} />
                  ) : step.status === 'processing' ? (
                    <Loader size={16} className="animate-spin" />
                  ) : step.status === 'error' ? (
                    <AlertCircle size={16} />
                  ) : (
                    <span className="text-xs font-medium">{index + 1}</span>
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{step.title}</h3>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
              </div>

              <div className="text-right">
                <div className={`
                  px-3 py-1 rounded-full text-xs font-medium
                  ${step.status === 'completed' ? 'bg-green-100 text-green-700' :
                    step.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                      step.status === 'error' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'}
                `}>
                  {step.status === 'completed' ? 'Completed' :
                    step.status === 'processing' ? 'Processing...' :
                      step.status === 'error' ? 'Error' : 'Pending'}
                </div>
              </div>
            </div>

            {step.status === 'processing' && (
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${step.progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Start Processing Button */}
      {!isProcessing && steps.every(step => step.status === 'pending') && (
        <div className="text-center">
          <button
            onClick={startProcessing}
            className="inline-flex items-center px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
          >
            <Play size={20} className="mr-2" />
            Start Processing
          </button>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <button
          onClick={onBack}
          disabled={isProcessing}
          className="flex items-center space-x-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeft size={16} />
          <span>Back to Configuration</span>
        </button>

        <div className="text-sm text-gray-500">
          {isProcessing ? 'Processing in progress...' : 'Ready to process'}
        </div>
      </div>
    </div>
  );
}