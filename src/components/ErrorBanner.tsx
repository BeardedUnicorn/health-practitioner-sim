import { useState } from 'react';
import './ErrorBanner.css';

export interface AppError {
  title: string;
  message: string;
  details?: string;
}

interface ErrorBannerProps {
  error: AppError;
  onDismiss: () => void;
}

export function ErrorBanner({ error, onDismiss }: ErrorBannerProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="error-banner" role="alert" aria-live="polite">
      <div className="error-banner__content">
        <div className="error-banner__title-row">
          <div className="error-banner__title">
            <span className="error-banner__icon" aria-hidden="true">⚠️</span>
            <span>{error.title}</span>
          </div>

          <div className="error-banner__actions">
            {error.details && (
              <button
                className="error-banner__btn"
                onClick={() => setShowDetails((v) => !v)}
                type="button"
              >
                {showDetails ? 'Hide details' : 'Details'}
              </button>
            )}
            <button
              className="error-banner__btn error-banner__btn--close"
              onClick={onDismiss}
              type="button"
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        </div>

        <div className="error-banner__message">{error.message}</div>

        {showDetails && error.details && (
          <pre className="error-banner__details">{error.details}</pre>
        )}
      </div>
    </div>
  );
}
