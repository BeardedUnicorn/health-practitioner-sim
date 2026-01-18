import { ApiConfig } from '../types';

interface SettingsModalProps {
  config: ApiConfig;
  onChange: (config: ApiConfig) => void;
  onClose: () => void;
}

export function SettingsModal({ config, onChange, onClose }: SettingsModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>⚙️ Settings</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="form-group">
            <label>API URL:</label>
            <input
              type="text"
              value={config.apiUrl}
              onChange={(e) => onChange({ ...config, apiUrl: e.target.value })}
              placeholder="http://localhost:1234/v1"
            />
          </div>
          <div className="form-group">
            <label>API Key (optional):</label>
            <input
              type="password"
              value={config.apiKey}
              onChange={(e) => onChange({ ...config, apiKey: e.target.value })}
              placeholder="Leave empty if not required"
            />
          </div>
          <div className="form-group">
            <label>Model Name:</label>
            <input
              type="text"
              value={config.modelName}
              onChange={(e) => onChange({ ...config, modelName: e.target.value })}
              placeholder="local-model"
            />
          </div>
        </div>
        
        <div className="modal-footer">
          <button onClick={onClose} className="btn-primary">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}