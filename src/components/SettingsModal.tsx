import { useEffect, useState } from 'react';
import { ApiConfig } from '../types';
import './SettingsModal.css';

interface SettingsModalProps {
  config: ApiConfig;
  onChange: (config: ApiConfig) => void;
  onClose: () => void;
}

export function SettingsModal({ config, onChange, onClose }: SettingsModalProps) {
  const [draft, setDraft] = useState<ApiConfig>(config);

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
