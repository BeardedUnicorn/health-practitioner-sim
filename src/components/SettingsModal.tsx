import { useEffect, useState } from 'react';
import { ApiConfig } from '../types';
import { useSessionContext } from '../features/session/state/session-context';
import { requestCompletionText } from '../shared/llm/client';
import './SettingsModal.css';

interface SettingsModalProps {
  config: ApiConfig;
  onChange: (config: ApiConfig) => void;
  onClose: () => void;
}

export function SettingsModal({ config, onChange, onClose }: SettingsModalProps) {
  const { actions: sessionActions } = useSessionContext();
  const [draft, setDraft] = useState<ApiConfig>(config);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Keep draft in sync if the parent config changes while the modal is open.
  useEffect(() => {
    setDraft(config);
  }, [config]);

  const handleCancel = () => {
    setDraft(config);
    onClose();
  };

  const handleSave = () => {
    onChange(draft);
    onClose();
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    sessionActions.setError(null);

    try {
      const result = await requestCompletionText(draft, {
        model: draft.modelName,
        messages: [{ role: 'user', content: 'Say "Connection successful" and nothing else.' }],
        max_tokens: 10,
      });

      if (result.toLowerCase().includes('connection successful')) {
        setTestResult({ success: true, message: 'Connection successful!' });
      } else {
        setTestResult({ success: true, message: `Connected, but received unexpected response: "${result.slice(0, 50)}..."` });
      }
    } catch (err) {
      console.error('Test connection error:', err);
      const message = err instanceof Error ? err.message : String(err);
      const isAuthError = message.includes('401') || message.includes('403') || message.toLowerCase().includes('unauthorized') || message.toLowerCase().includes('api key');

      sessionActions.setError({
        title: 'Connection test failed',
        message: 'Could not connect to the API with these settings.',
        details: `Error: ${message}\nModel: ${draft.modelName}\nEndpoint: ${draft.apiUrl}`,
        isAuthError,
      });
      setTestResult({ success: false, message: 'Connection failed.' });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>⚙️ API Settings</h2>
          <button className="modal-close" onClick={handleCancel}>×</button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label>API URL</label>
            <input
              type="text"
              value={draft.apiUrl}
              onChange={(e) => setDraft({ ...draft, apiUrl: e.target.value })}
              placeholder="http://localhost:1234/v1"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>API Key (optional)</label>
            <input
              type="password"
              value={draft.apiKey}
              onChange={(e) => setDraft({ ...draft, apiKey: e.target.value })}
              placeholder="Leave empty if not required"
            />
          </div>

          <div className="form-group">
            <label>Model Name</label>
            <input
              type="text"
              value={draft.modelName}
              onChange={(e) => setDraft({ ...draft, modelName: e.target.value })}
              placeholder="Enter model name"
            />
          </div>

          <div className="settings-actions">
            <button 
              onClick={handleTestConnection} 
              className="btn-secondary btn-small"
              disabled={isTesting}
            >
              {isTesting ? 'Testing...' : '🧪 Test Connection'}
            </button>
            {testResult && (
              <span className={`test-result ${testResult.success ? 'success' : 'error'}`}>
                {testResult.message}
              </span>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={handleCancel} className="btn-secondary">
            Cancel
          </button>
          <button onClick={handleSave} className="btn-primary">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
