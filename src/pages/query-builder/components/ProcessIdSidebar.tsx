import React, { useState, useEffect } from 'react';
import { PROCESS_IDS } from 'ao-process-clients/dist/src/process-ids';
import './ProcessIdSidebar.css';

interface ProcessId {
  name: string;
  value: string;
}

interface ProcessIdGroup {
  name: string;
  ids: ProcessId[];
}

export function ProcessIdSidebar() {
  const [processIdGroups, setProcessIdGroups] = useState<ProcessIdGroup[]>([]);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(() => {
    // Start with all sections collapsed
    return new Set(Object.keys(PROCESS_IDS));
  });

  useEffect(() => {
    // Parse process IDs from the library
    const groups: ProcessIdGroup[] = [];
    
    // Parse all process ID categories
    Object.entries(PROCESS_IDS).forEach(([category, processGroup]) => {
      // Special case for AO which is a string
      if (typeof processGroup === 'string') {
        groups.push({
          name: category,
          ids: [{
            name: category,
            value: processGroup
          }]
        });
        return;
      }

      const ids: ProcessId[] = [];
      
      // Recursively extract all string values from the process group
      const extractProcessIds = (obj: any, prefix = '') => {
        Object.entries(obj).forEach(([key, value]) => {
          if (typeof value === 'string') {
            ids.push({
              name: prefix + key
                .replace(/_/g, ' ')
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' '),
              value: value
            });
          } else if (typeof value === 'object' && value !== null) {
            extractProcessIds(value, `${prefix}${key} > `);
          }
        });
      };
      
      extractProcessIds(processGroup);
      
      if (ids.length > 0) {
        groups.push({
          name: category,
          ids: ids.sort((a, b) => a.name.localeCompare(b.name))
        });
      }
    });

    // Sort groups alphabetically
    groups.sort((a, b) => a.name.localeCompare(b.name));
    
    setProcessIdGroups(groups);
  }, []);

  const copyToClipboard = (value: string, name: string) => {
    navigator.clipboard.writeText(value).then(() => {
      setCopySuccess(`Copied ${name}`);
      setTimeout(() => setCopySuccess(null), 2000);
    });
  };

  return (
    <div className="process-id-sidebar">
      <h2>Process IDs</h2>
      {processIdGroups.map((group) => (
        <div key={group.name} className="process-id-section">
          <div 
            className="section-header"
            onClick={() => {
              setCollapsedSections(prev => {
                const newSet = new Set(prev);
                if (newSet.has(group.name)) {
                  newSet.delete(group.name);
                } else {
                  newSet.add(group.name);
                }
                return newSet;
              });
            }}
          >
            <h3>{group.name}</h3>
            <span className={`toggle-icon ${collapsedSections.has(group.name) ? 'collapsed' : ''}`}>
              ▼
            </span>
          </div>
          <div className={`section-content ${collapsedSections.has(group.name) ? 'collapsed' : ''}`}>
            {group.ids.map((id) => (
              <div
                key={id.value}
                className="process-id-item"
                onClick={() => copyToClipboard(id.value, id.name)}
                title="Click to copy"
              >
                <div className="process-id-name">
                  {id.name.split(' > ').map((part, i, arr) => (
                    <React.Fragment key={i}>
                      {i > 0 && <span> › </span>}
                      {part}
                    </React.Fragment>
                  ))}
                </div>
                <div className="process-id-value">{id.value}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
      {copySuccess && (
        <div className="copy-success">
          {copySuccess}
        </div>
      )}
    </div>
  );
}
