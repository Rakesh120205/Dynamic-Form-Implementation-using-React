import React, { useState, useEffect } from 'react';
import { FormField } from './components/FormField';
import { ProgressBar } from './components/ProgressBar';
import { DataTable } from './components/DataTable';
import { Toast } from './components/Toast';
import { fetchFormConfig } from './data/mockApi';
import { FormConfig, FormData, FormEntry } from './types/form';
import { ClipboardList } from 'lucide-react';

function App() {
  const [formType, setFormType] = useState<string>('userInfo');
  const [formConfig, setFormConfig] = useState<FormConfig | null>(null);
  const [formData, setFormData] = useState<FormData>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [entries, setEntries] = useState<FormEntry[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadFormConfig();
  }, [formType]);

  const loadFormConfig = async () => {
    try {
      setLoading(true);
      const config = await fetchFormConfig(formType);
      setFormConfig(config);
      setFormData({});
      setErrors({});
    } catch (error) {
      showToast('Failed to load form configuration', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const calculateProgress = (): number => {
    if (!formConfig) return 0;
    const requiredFields = formConfig.fields.filter(field => field.required);
    const completedFields = requiredFields.filter(field => formData[field.name]);
    return (completedFields.length / requiredFields.length) * 100;
  };

  const validateForm = (): boolean => {
    if (!formConfig) return false;
    
    const newErrors: Record<string, string> = {};
    formConfig.fields.forEach(field => {
      if (field.required && !formData[field.name]) {
        newErrors[field.name] = `${field.label} is required`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    const newEntry: FormEntry = {
      ...formData,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      formType,
    };

    setEntries(prev => [...prev, newEntry]);
    setFormData({});
    showToast('Form submitted successfully!', 'success');
  };

  const handleEdit = (entry: FormEntry) => {
    setFormType(entry.formType);
    setFormData(entry);
    showToast('Edit mode activated', 'info');
  };

  const handleDelete = (id: string) => {
    setEntries(prev => prev.filter(entry => entry.id !== id));
    showToast('Entry deleted successfully', 'success');
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <ClipboardList className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Dynamic Form Builder</h1>
            </div>
            <select
              value={formType}
              onChange={(e) => setFormType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="userInfo">User Information</option>
              <option value="address">Address Information</option>
              <option value="payment">Payment Information</option>
            </select>
          </div>

          <ProgressBar progress={calculateProgress()} />

          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {formConfig?.fields.map((field) => (
                <FormField
                  key={field.name}
                  field={field}
                  value={formData[field.name]?.toString() || ''}
                  error={errors[field.name]}
                  onChange={handleFieldChange}
                />
              ))}
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Submit
              </button>
            </form>
          )}
        </div>

        <DataTable
          entries={entries}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default App;