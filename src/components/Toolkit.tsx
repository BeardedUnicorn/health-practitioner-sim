import { ToolkitSection } from '../types';

interface ToolkitProps {
  sections: ToolkitSection[];
  isLoading: boolean;
  onAssessment: (assessmentType: string, assessmentName: string) => void;
}

export function Toolkit({ sections, isLoading, onAssessment }: ToolkitProps) {
  return (
    <div className="info-box toolkit-box">
      <h3>🩺 Assessment Tools</h3>
      {sections.map((section) => (
        <div key={section.title} className="toolkit-section">
          <h4>{section.title}</h4>
          {section.items.map((item) => (
            <button
              key={item.id}
              onClick={() => onAssessment(item.assessmentType, item.assessmentName)}
              disabled={isLoading}
              className={`toolkit-btn ${section.title === 'Comprehensive' ? 'toolkit-btn-full' : ''}`}
            >
              {item.emoji} {item.label}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}