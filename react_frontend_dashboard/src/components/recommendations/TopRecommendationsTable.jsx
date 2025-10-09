import React, { useMemo } from 'react';

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

/**
 * PUBLIC_INTERFACE
 * TopRecommendationsTable
 * Minimal table that lists recommendations and delegates "View Details" to parent via onViewDetails(row).
 */
export default function TopRecommendationsTable({ rows, onViewDetails }) {
  const data = useMemo(() => {
    if (Array.isArray(rows) && rows.length > 0) return rows;
    return DEFAULT_ROWS;
  }, [rows]);

  return (
    <div style={styles.wrapper}>
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
                      onClick={() => onViewDetails && onViewDetails(row)}
                      aria-label={`View details for ${row.title || 'this recommendation'}`}
                      data-testid={`view-details-${row.id || row.title}`}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              );
            })}
            {data.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: 16, color: '#6B7280' }}>
                  No recommendations available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
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
