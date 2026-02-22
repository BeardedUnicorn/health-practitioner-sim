import { useState } from 'react';
import './ErrorBanner.css';

export interface AppError {
  title: string;
  message: string;
  details?: string;
  isAuthError?: boolean;
}

interface ErrorBannerProps {
  error: AppError;
  onDismiss: () => void;
  onRetry?: () => void;
  onOpenSettings?: () => void;
}

export function ErrorBanner({ error, onDismiss, onRetry, onOpenSettings }: ErrorBannerProps) {
  const [showDetails, setShowDetails] = useState(false);

  const handleCopyDetails = async () => {
    if (error.details) {
      try {
        await navigator.clipboard.writeText(error.details);
      } catch (err) {
        console.error('Failed to copy error details:', err);
      }
    }
  };

  return (
    <div className="error-banner" role="alert" aria-live="polite">
      <div className="error-banner__content">
        <div className="error-banner__title-row">
          <div className="error-banner__title">
            <span className="error-banner__icon" aria-hidden="true">⚠️</span>
            <span>{error.title}</span>
          </div>

          <div className="error-banner__actions">
            {onRetry && (
              <button
                className="error-banner__btn error-banner__btn--primary"
                onClick={onRetry}
                type="button"
              >
                Retry
              </button>
            )}
            {error.isAuthError && onOpenSettings && (
              <button
                className="error-banner__btn"
                onClick={onOpenSettings}
                type="button"
              >
                Open Settings
              </button>
            )}
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
          <div className="error-banner__details-container">
            <div className="error-banner__details-header">
              <button
                className="error-banner__btn error-banner__btn--small"
                onClick={handleCopyDetails}
                type="button"
              >
                Copy Details
              </button>
            </div>
            <pre className="error-banner__details">{error.details}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
