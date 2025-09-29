import React, { useMemo, useState } from 'react';
import Table from '../../../components/ui/Table';
import Modal from '../../../components/ui/Modal';

/**
 * PUBLIC_INTERFACE
 * StoragePanel shows S3 and Azure Blob containers with mock actions
 * for permissions, lifecycle, and basic maintenance.
 */
const StoragePanel = () => {
  const data = useMemo(
    () => ({
      'AWS S3': [
        { name: 'prod-logs', region: 'us-east-1', objects: 125430, storageClass: 'STANDARD', versioning: 'Enabled' },
        { name: 'media-assets', region: 'us-west-2', objects: 20485, storageClass: 'INTELLIGENT_TIERING', versioning: 'Disabled' },
      ],
      'Azure Blob': [
        { name: 'az-prod-data', region: 'eastus', objects: 55340, tier: 'Hot', versioning: 'Enabled' },
        { name: 'az-backups', region: 'westeurope', objects: 9980, tier: 'Cool', versioning: 'Disabled' },
      ],
    }),
    []
  );

  const [expanded, setExpanded] = useState({ 'AWS S3': true, 'Azure Blob': true });
  const [modal, setModal] = useState(null);

  const toggle = (key) => setExpanded((e) => ({ ...e, [key]: !e[key] }));
  const close = () => setModal(null);
  const notify = (m) => {
    close();
    setTimeout(() => window.alert(m), 10);
  };

  const openPermissions = (row, provider) => {
    setModal({
      title: `Edit Permissions - ${row.name}`,
      content: <PermissionsForm provider={provider} bucket={row} onSubmit={() => notify('Permissions updated (mock)')} />,
    });
  };

  const openLifecycle = (row) => {
    setModal({
      title: `Lifecycle Rules - ${row.name}`,
      content: <LifecycleForm bucket={row} onSubmit={() => notify('Lifecycle rules saved (mock)')} />,
    });
  };

  const openEmpty = (row) => {
    setModal({
      title: `Empty Bucket - ${row.name}`,
      content: (
        <p style={{ color: '#6B7280', fontSize: 14 }}>
          This will delete all objects from the bucket. Proceed?
        </p>
      ),
      onConfirm: () => notify('Empty operation scheduled (mock)'),
    });
  };

  const openDelete = (row) => {
    setModal({
      title: `Delete Bucket - ${row.name}`,
      content: (
        <p style={{ color: '#6B7280', fontSize: 14 }}>
          This will permanently delete the bucket. Ensure it is empty.
        </p>
      ),
      onConfirm: () => notify('Delete scheduled (mock)'),
    });
  };

  const s3Columns = [
    { header: 'Bucket', accessor: 'name' },
    { header: 'Region', accessor: 'region' },
    { header: 'Objects', accessor: 'objects' },
    { header: 'Class', accessor: 'storageClass' },
    { header: 'Versioning', accessor: 'versioning' },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (row) => (
        <div style={styles.actionRow}>
          <button style={styles.actionBtn} onClick={() => openPermissions(row, 'AWS')}>Permissions</button>
          <button style={styles.actionBtn} onClick={() => openLifecycle(row)}>Lifecycle</button>
          <button style={styles.actionBtn} onClick={() => notify('Upload (mock)')}>Upload</button>
          <button style={styles.actionBtn} onClick={() => openEmpty(row)}>Empty</button>
          <button style={styles.actionBtnDanger} onClick={() => openDelete(row)}>Delete</button>
        </div>
      ),
    },
  ];

  const blobColumns = [
    { header: 'Container', accessor: 'name' },
    { header: 'Region', accessor: 'region' },
    { header: 'Objects', accessor: 'objects' },
    { header: 'Tier', accessor: 'tier' },
    { header: 'Versioning', accessor: 'versioning' },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (row) => (
        <div style={styles.actionRow}>
          <button style={styles.actionBtn} onClick={() => openPermissions(row, 'Azure')}>Permissions</button>
          <button style={styles.actionBtn} onClick={() => openLifecycle(row)}>Lifecycle</button>
          <button style={styles.actionBtn} onClick={() => notify('Upload (mock)')}>Upload</button>
          <button style={styles.actionBtnDanger} onClick={() => openDelete(row)}>Delete</button>
        </div>
      ),
    },
  ];

  const cards = [
    { key: 'AWS S3', title: 'AWS S3 Buckets', columns: s3Columns, list: data['AWS S3'] },
    { key: 'Azure Blob', title: 'Azure Blob Containers', columns: blobColumns, list: data['Azure Blob'] },
  ];

  return (
    <div>
      {cards.map((c) => (
        <section key={c.key} style={styles.card}>
          <header style={styles.cardHeader} onClick={() => toggle(c.key)} role="button" tabIndex={0}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={styles.chevron(expanded[c.key])}>▾</span>
              <h3 style={styles.cardTitle}>
                {c.title}
                <span style={styles.countBadge}>{c.list.length}</span>
              </h3>
            </div>
            <span style={styles.hint}>{expanded[c.key] ? 'Collapse' : 'Expand'}</span>
          </header>
          {expanded[c.key] && (
            <div style={styles.cardBody}>
              <Table columns={c.columns} data={c.list} />
            </div>
          )}
        </section>
      ))}

      {modal && (
        <Modal title={modal.title} onClose={() => setModal(null)} onConfirm={modal.onConfirm}>
          {modal.content}
        </Modal>
      )}
    </div>
  );
};

const PermissionsForm = ({ provider, bucket, onSubmit }) => {
  const [publicRead, setPublicRead] = useState(false);
  const [blockPublicAccess, setBlockPublicAccess] = useState(true);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div style={styles.formRow}>
        <label style={styles.label}>
          <input type="checkbox" checked={publicRead} onChange={(e) => setPublicRead(e.target.checked)} /> Public read
        </label>
      </div>
      <div style={styles.formRow}>
        <label style={styles.label}>
          <input type="checkbox" checked={blockPublicAccess} onChange={(e) => setBlockPublicAccess(e.target.checked)} /> Block public access
        </label>
      </div>
      <p style={{ color: '#6B7280', fontSize: 12, marginTop: 6 }}>
        Provider: {provider}. Bucket/Container: {bucket.name}. This is a mock configuration.
      </p>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button type="submit" style={styles.primaryBtn}>Save</button>
      </div>
    </form>
  );
};

const LifecycleForm = ({ bucket, onSubmit }) => {
  const [days, setDays] = useState(30);
  const [transition, setTransition] = useState('GLACIER/Archive');

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div style={styles.formRow}>
        <label style={styles.smallLabel}>Transition after days</label>
        <input
          type="number"
          min="1"
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value || '1', 10))}
          style={styles.input}
        />
      </div>
      <div style={styles.formRow}>
        <label style={styles.smallLabel}>Transition to</label>
        <select value={transition} onChange={(e) => setTransition(e.target.value)} style={styles.select}>
          <option>GLACIER/Archive</option>
          <option>INTELLIGENT_TIERING/Cool</option>
          <option>DEEP_ARCHIVE</option>
        </select>
      </div>
      <p style={{ color: '#6B7280', fontSize: 12, marginTop: 6 }}>
        Applying to: {bucket.name}. Demo only.
      </p>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button type="submit" style={styles.primaryBtn}>Save Rules</button>
      </div>
    </form>
  );
};

const styles = {
  card: {
    background: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: 10,
    marginBottom: 12,
  },
  cardHeader: {
    padding: '12px 14px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    userSelect: 'none',
  },
  chevron: (open) => ({
    display: 'inline-block',
    transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
    color: '#9CA3AF',
    width: 16,
  }),
  cardTitle: {
    margin: 0,
    fontSize: 16,
    fontWeight: 600,
    color: '#111827',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  countBadge: {
    fontSize: 12,
    color: '#374151',
    background: '#F3F4F6',
    border: '1px solid #E5E7EB',
    padding: '2px 6px',
    borderRadius: 999,
  },
  cardBody: {
    padding: 12,
  },
  actionRow: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  actionBtn: {
    background: '#FFFFFF',
    border: '1px solid #E5E7EB',
    color: '#374151',
    padding: '6px 10px',
    borderRadius: 8,
    fontSize: 12,
  },
  actionBtnDanger: {
    background: '#FFFFFF',
    border: '1px solid #EF4444',
    color: '#EF4444',
    padding: '6px 10px',
    borderRadius: 8,
    fontSize: 12,
  },
  primaryBtn: {
    background: '#111827',
    border: '1px solid #111827',
    color: '#FFFFFF',
    padding: '6px 12px',
    borderRadius: 8,
    fontSize: 12,
  },
  formRow: {
    marginBottom: 12,
  },
  label: {
    color: '#111827',
    fontSize: 14,
  },
  smallLabel: {
    display: 'block',
    color: '#374151',
    fontSize: 13,
    marginBottom: 6,
  },
  input: {
    width: '100%',
    background: '#FFFFFF',
    border: '1px solid #E5E7EB',
    color: '#111827',
    padding: '8px 10px',
    borderRadius: 8,
    fontSize: 13,
  },
  select: {
    width: '100%',
    background: '#FFFFFF',
    border: '1px solid #E5E7EB',
    color: '#111827',
    padding: '8px 10px',
    borderRadius: 8,
    fontSize: 13,
  },
  hint: { color: '#9CA3AF', fontSize: 12 },
};

export default StoragePanel;
