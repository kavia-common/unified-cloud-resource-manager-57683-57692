import React, { useMemo, useState, useCallback } from 'react';
import RecommendationDetailsDrawer from './RecommendationDetailsDrawer';

// Minimal mock-safe data if no external data is passed
const DEFAULT_ROWS = [
  {
    id: 'rec-1',
    title: 'Right-size underutilized EC2 instances',
    cloudProvider: 'AWS',
    impactedServices: ['EC2', 'EBS'],
  },
  {
    id: 'rec-2',
    title: 'Enable Azure storage lifecycle policies',
    cloudProvider: 'Azure',
    impactedServices: ['Storage Accounts', 'Blob'],
  },
];

export default function TopRecommendationsTable({ rows }) {
  const data = useMemo(() => {
    if (Array.isArray(rows) && rows.length > 0) return rows;
    return DEFAULT_ROWS;
  }, [rows]);

  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);

  const handleViewDetails = useCallback((row) => {
    setSelectedRecommendation(row);
    setDrawerOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setDrawerOpen(false);
    // retain selection for potential re-open, or clear if desired:
    // setSelectedRecommendation(null);
  }, []);

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <h3 style={styles.title}>Top Recommendations</h3>
      </div>
      <div style={styles.tableContainer}>
        <table style={styles.table} role="table" aria-label="Top Recommendations">
          <thead>
            <tr>
              <th style={styles.th}>Title</th>
              <th style={styles.th}>Cloud</th>
              <th style={styles.th}>Impacted Services</th>
              <th style={styles.th} aria-label="Actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => {
              const services = Array.isArray(row.impactedServices) ? row.impactedServices : [];
              return (
                <tr key={row.id || row.title}>
                  <td style={styles.td}>{row.title || 'Untitled Recommendation'}</td>
                  <td style={styles.td}>{row.cloudProvider || 'Unknown'}</td>
                  <td style={styles.td}>
                    {services.length > 0 ? services.join(', ') : 'No services listed'}
                  </td>
                  <td style={styles.td}>
                    <button
                      style={styles.viewBtn}
                      onClick={() => handleViewDetails(row)}
                      aria-label={`View details for ${row.title || 'this recommendation'}`}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <RecommendationDetailsDrawer
        isOpen={isDrawerOpen}
        onClose={handleClose}
        recommendation={selectedRecommendation}
      />
    </div>
  );
}

const styles = {
  wrapper: {
    background: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    padding: '12px 16px',
    borderBottom: '1px solid #F3F4F6',
    background: '#F9FAFB',
  },
  title: {
    margin: 0,
    fontSize: 16,
    color: '#111827',
  },
  tableContainer: {
    width: '100%',
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: 0,
  },
  th: {
    textAlign: 'left',
    color: '#6B7280',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    padding: '12px 16px',
    borderBottom: '1px solid #F3F4F6',
    background: '#FFFFFF',
    position: 'sticky',
    top: 0,
  },
  td: {
    padding: '12px 16px',
    borderBottom: '1px solid #F3F4F6',
    color: '#374151',
    fontSize: 14,
  },
  viewBtn: {
    appearance: 'none',
    background: '#FFFFFF',
    color: '#374151',
    border: '1px solid #E5E7EB',
    borderRadius: 8,
    padding: '6px 10px',
    fontSize: 14,
    cursor: 'pointer',
    transition: 'box-shadow 120ms ease, border-color 120ms ease, transform 60ms ease',
    outline: 'none',
  },
};

// Improve focus styles using inline pseudo-like approach by adding global listeners would be overkill,
// but React inline doesn't support :hover/:focus. Rely on browser default focus ring plus clear visual design.
