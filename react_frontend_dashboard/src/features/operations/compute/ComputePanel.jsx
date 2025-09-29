import React, { useMemo, useState } from 'react';
import Table from '../../../components/ui/Table';
import Modal from '../../../components/ui/Modal';

/**
 * PUBLIC_INTERFACE
 * ComputePanel renders expandable resource sections for VMs across clouds
 * and provides mock action handlers (Start/Stop/Restart/Resize/Terminate).
 */
const ComputePanel = () => {
  const data = useMemo(
    () => ({
      AWS: [
        { id: 'i-0a1b2c3d4e5f', name: 'web-01', type: 't3.medium', state: 'stopped', region: 'us-east-1', os: 'Amazon Linux' },
        { id: 'i-1234567890ab', name: 'api-01', type: 'm5.large', state: 'running', region: 'us-east-2', os: 'Ubuntu 22.04' },
      ],
      Azure: [
        { id: 'vm-az-001', name: 'az-web-01', type: 'Standard_D2s_v5', state: 'running', region: 'eastus', os: 'Ubuntu 20.04' },
        { id: 'vm-az-002', name: 'az-batch-01', type: 'Standard_F4s_v2', state: 'deallocated', region: 'westeurope', os: 'Windows' },
      ],
    }),
    []
  );

  const [expanded, setExpanded] = useState({ AWS: true, Azure: true });
  const [modal, setModal] = useState(null); // { title, content, onConfirm }

  const toggle = (key) => setExpanded((e) => ({ ...e, [key]: !e[key] }));

  const openConfirm = (title, message, onConfirm) =>
    setModal({
      title,
      content: (
        <div style={{ color: '#6B7280', fontSize: 14, lineHeight: 1.5 }}>
          <p style={{ marginTop: 0 }}>{message}</p>
          <p>This is a demo flow. No real changes will be made.</p>
        </div>
      ),
      onConfirm,
    });

  const handleAction = (action, row) => {
    switch (action) {
      case 'Start':
        openConfirm('Start instance', `Start ${row.name} (${row.id})?`, () => closeModalWithToast('Start scheduled'));
        break;
      case 'Stop':
        openConfirm('Stop instance', `Stop ${row.name} (${row.id})?`, () => closeModalWithToast('Stop scheduled'));
        break;
      case 'Restart':
        openConfirm('Restart instance', `Restart ${row.name} (${row.id})?`, () => closeModalWithToast('Restart scheduled'));
        break;
      case 'Resize':
        setModal({
          title: 'Resize instance',
          content: <ResizeForm instance={row} onSubmit={(sz) => closeModalWithToast(`Resize to ${sz} requested`)} />,
        });
        break;
      case 'Terminate':
        openConfirm(
          'Terminate instance',
          `This will permanently delete ${row.name} (${row.id}). Proceed?`,
          () => closeModalWithToast('Terminate scheduled')
        );
        break;
      default:
        break;
    }
  };

  const closeModalWithToast = (msg) => {
    setModal(null);
    // Light-weight toast using alert for now (keeps dependencies minimal and aligns with minimalist style)
    // Could be swapped with components/ui/Toast if needed.
    setTimeout(() => window.alert(msg), 10);
  };

  const columns = [
    { header: 'Name', accessor: 'name' },
    { header: 'Instance ID', accessor: 'id' },
    { header: 'Type', accessor: 'type' },
    { header: 'State', accessor: 'state' },
    { header: 'Region', accessor: 'region' },
    { header: 'OS', accessor: 'os' },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (row) => (
        <div style={styles.actionRow}>
          {['Start', 'Stop', 'Restart', 'Resize', 'Terminate'].map((a) => (
            <button
              key={a}
              onClick={() => handleAction(a, row)}
              style={a === 'Terminate' ? styles.actionBtnDanger : styles.actionBtn}
            >
              {a}
            </button>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div>
      {['AWS', 'Azure'].map((provider) => (
        <section key={provider} style={styles.card}>
          <header style={styles.cardHeader} onClick={() => toggle(provider)} role="button" tabIndex={0}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={styles.chevron(expanded[provider])}>▾</span>
              <h3 style={styles.cardTitle}>
                {provider} VMs
                <span style={styles.countBadge}>{data[provider].length}</span>
              </h3>
            </div>
            <span style={styles.hint}>{expanded[provider] ? 'Collapse' : 'Expand'}</span>
          </header>
          {expanded[provider] && (
            <div style={styles.cardBody}>
              <Table columns={columns} data={data[provider]} />
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

const ResizeForm = ({ instance, onSubmit }) => {
  const [size, setSize] = useState(instance?.type || 't3.medium');

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(size);
      }}
    >
      <div style={{ marginBottom: 12 }}>
        <label htmlFor="size" style={{ display: 'block', fontSize: 13, color: '#374151', marginBottom: 6 }}>
          New size
        </label>
        <select
          id="size"
          value={size}
          onChange={(e) => setSize(e.target.value)}
          style={styles.select}
        >
          <option>t3.small</option>
          <option>t3.medium</option>
          <option>m5.large</option>
          <option>m5.xlarge</option>
          <option>Standard_D2s_v5</option>
          <option>Standard_F4s_v2</option>
        </select>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button type="submit" style={styles.primaryBtn}>Request Resize</button>
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
  select: {
    width: '100%',
    background: '#FFFFFF',
    border: '1px solid #E5E7EB',
    color: '#111827',
    padding: '8px 10px',
    borderRadius: 8,
    fontSize: 13,
  },
};

export default ComputePanel;
