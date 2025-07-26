import React, { useState } from 'react';
import { Download, RefreshCw, BarChart3, Users, Mail, Globe, Eye, EyeOff } from 'lucide-react';

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

interface ResultsDisplayProps {
  data: ProcessedData;
  fileName: string;
  onStartOver: () => void;
}

export function ResultsDisplay({ data, fileName, onStartOver }: ResultsDisplayProps) {
  const [showAllRows, setShowAllRows] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'data'>('overview');

  const displayData = showAllRows ? data.processedData : data.processedData.slice(0, 10);
  const columns = data.processedData.length > 0 ? Object.keys(data.processedData[0]) : [];

  const downloadCSV = () => {
    const csvContent = [
      columns.join(','),
      ...data.processedData.map(row => 
        columns.map(col => `"${row[col] || ''}"`).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `processed_${fileName}`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, color }: {
    icon: React.ElementType;
    title: string;
    value: string | number;
    subtitle: string;
    color: string;
  }) => (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Processing Complete!</h2>
        <p className="text-gray-600">
          Your data has been successfully processed and enriched. Review the results below.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6">
        <button
          onClick={() => setSelectedTab('overview')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedTab === 'overview'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setSelectedTab('data')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedTab === 'data'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Data Preview
        </button>
      </div>

      {selectedTab === 'overview' && (
        <div className="space-y-6">
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              icon={Users}
              title="Total Records"
              value={data.statistics.totalRecords}
              subtitle="After processing"
              color="bg-blue-500"
            />
            <StatCard
              icon={RefreshCw}
              title="Duplicates Removed"
              value={data.statistics.duplicatesRemoved}
              subtitle="Based on LinkedIn URLs"
              color="bg-green-500"
            />
            <StatCard
              icon={Mail}
              title="Emails Enriched"
              value={data.statistics.emailsEnriched}
              subtitle="New email addresses found"
              color="bg-purple-500"
            />
            <StatCard
              icon={Globe}
              title="Domains Generated"
              value={data.statistics.domainsGenerated}
              subtitle="AI-powered domain discovery"
              color="bg-orange-500"
            />
          </div>

          {/* Processing Summary */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Processing Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Original Records:</span>
                <span className="font-medium">{data.originalData.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Final Records:</span>
                <span className="font-medium">{data.statistics.totalRecords}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Data Quality Score:</span>
                <span className="font-medium text-green-600">
                  {Math.round(((data.statistics.totalRecords - data.statistics.duplicatesRemoved) / data.originalData.length) * 100)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Enrichment Rate:</span>
                <span className="font-medium text-blue-600">
                  {Math.round((data.statistics.emailsEnriched / data.statistics.totalRecords) * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* New Columns Added */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">New Columns Added</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                'Company Domain',
                'MX Provider',
                'EmailID',
                'Company Analysis',
                'Company Confidence Score',
                'Use Case',
                'Use Case Confidence Score',
                'Email Text'
              ].map(column => (
                <div key={column} className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">{column}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedTab === 'data' && (
        <div className="space-y-6">
          {/* Data Controls */}
          <div className="flex justify-between items-center">
            <p className="text-gray-600">
              Showing {displayData.length} of {data.processedData.length} records
            </p>
            <button
              onClick={() => setShowAllRows(!showAllRows)}
              className="flex items-center space-x-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              {showAllRows ? <EyeOff size={16} /> : <Eye size={16} />}
              <span>{showAllRows ? 'Show Less' : 'Show All'}</span>
            </button>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto border rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {columns.map(column => (
                    <th
                      key={column}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayData.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    {columns.map(column => (
                      <td key={column} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {row[column] || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center mt-8">
        <button
          onClick={onStartOver}
          className="flex items-center space-x-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
        >
          <RefreshCw size={16} />
          <span>Start Over</span>
        </button>
        
        <button
          onClick={downloadCSV}
          className="flex items-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
        >
          <Download size={16} />
          <span>Download Processed Data</span>
        </button>
      </div>
    </div>
  );
}