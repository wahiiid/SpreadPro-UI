import { useState } from 'react';
import { ArrowLeft, ArrowRight, Settings, Trash2, Plus, X } from 'lucide-react';

interface ProcessingConfig {
  specialCharacters: string[];
  companySuffixes: string[];
  columnsToDelete: string[];
}

interface ConfigurationPanelProps {
  config: ProcessingConfig;
  onSave: (config: ProcessingConfig) => void;
  onBack: () => void;
}

export function ConfigurationPanel({ config, onSave, onBack }: ConfigurationPanelProps) {
  const [localConfig, setLocalConfig] = useState<ProcessingConfig>(config);
  const [newSpecialChar, setNewSpecialChar] = useState('');
  const [newSuffix, setNewSuffix] = useState('');

  const handleSave = () => {
    onSave(localConfig);
  };

  const addSpecialCharacter = () => {
    if (newSpecialChar && !localConfig.specialCharacters.includes(newSpecialChar)) {
      setLocalConfig(prev => ({
        ...prev,
        specialCharacters: [...prev.specialCharacters, newSpecialChar]
      }));
      setNewSpecialChar('');
    }
  };

  const removeSpecialCharacter = (char: string) => {
    setLocalConfig(prev => ({
      ...prev,
      specialCharacters: prev.specialCharacters.filter(c => c !== char)
    }));
  };

  const addSuffix = () => {
    if (newSuffix && !localConfig.companySuffixes.includes(newSuffix.toUpperCase())) {
      setLocalConfig(prev => ({
        ...prev,
        companySuffixes: [...prev.companySuffixes, newSuffix.toUpperCase()]
      }));
      setNewSuffix('');
    }
  };

  const removeSuffix = (suffix: string) => {
    setLocalConfig(prev => ({
      ...prev,
      companySuffixes: prev.companySuffixes.filter(s => s !== suffix)
    }));
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Configuration Settings</h2>
        <p className="text-gray-600">
          Configure data cleaning rules and API keys for the enrichment process
        </p>
      </div>

      <div className="space-y-8">
        {/* Special Characters Section */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <div className="flex items-center space-x-2 mb-4">
            <Settings className="text-gray-600" size={20} />
            <h3 className="text-lg font-semibold text-gray-900">Special Characters to Remove</h3>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            These characters will be removed from First Name and Last Name fields
          </p>

          <div className="flex flex-wrap gap-2 mb-4">
            {localConfig.specialCharacters.map(char => (
              <span
                key={char}
                className="inline-flex items-center px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full"
              >
                {char}
                <button
                  onClick={() => removeSpecialCharacter(char)}
                  className="ml-2 text-red-600 hover:text-red-800"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>

          <div className="flex space-x-2">
            <input
              type="text"
              value={newSpecialChar}
              onChange={(e) => setNewSpecialChar(e.target.value)}
              placeholder="Add special character"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              maxLength={1}
            />
            <button
              onClick={addSpecialCharacter}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Company Suffixes Section */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <div className="flex items-center space-x-2 mb-4">
            <Trash2 className="text-gray-600" size={20} />
            <h3 className="text-lg font-semibold text-gray-900">Company Suffixes to Remove</h3>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            These suffixes will be stripped from company names
          </p>

          <div className="flex flex-wrap gap-2 mb-4">
            {localConfig.companySuffixes.map(suffix => (
              <span
                key={suffix}
                className="inline-flex items-center px-3 py-1 bg-orange-100 text-orange-800 text-sm font-medium rounded-full"
              >
                {suffix}
                <button
                  onClick={() => removeSuffix(suffix)}
                  className="ml-2 text-orange-600 hover:text-orange-800"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>

          <div className="flex space-x-2">
            <input
              type="text"
              value={newSuffix}
              onChange={(e) => setNewSuffix(e.target.value)}
              placeholder="Add company suffix"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <button
              onClick={addSuffix}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to Preview</span>
        </button>

        <button
          onClick={handleSave}
          className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
        >
          <span>Start Processing</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}