import React, { useMemo, useState } from 'react';
import Table from '../../../components/ui/Table';
import Modal from '../../../components/ui/Modal';

/**
 * PUBLIC_INTERFACE
 * DatabasesPanel provides actions like Pause/Resume/Snapshot/Scale on mock RDS and Azure SQL.
 */
const DatabasesPanel = () => {
  const data = useMemo(
    () => ({
      'AWS RDS': [
        { id: 'rds-001', name: 'orders-db', engine: 'postgres', size: 'db.m5.large', status: 'available', region: 'us-east-1' },
        { id: 'rds-002', name: 'analytics-db', engine: 'mysql', size: 'db.r6g.large', status: 'modifying', region: 'us-west-2' },
      ],
      'Azure SQL': [
        { id: 'azsql-001', name: 'crm-db', engine: 'mssql', size: 'GP_S_Gen5_2', status: 'online', region: 'eastus' },
        { id: 'azsql-002', name: 'bi-warehouse', engine: 'mssql', size: 'BC_Gen5_4', status: 'paused', region: 'westeurope' },
      ],
    }),
    []
  );

  const [expanded, setExpanded] = useState({ 'AWS RDS': true, 'Azure SQL': true });
  const [modal, setModal] = useState(null);

  const toggle = (k) => setExpanded((e) => ({ ...e, [k]: !e[k] }));
  const notify = (m) => setTimeout(() => window.alert(m), 10);

  const openScale = (row) =>
    setModal({
      title: `Scale - ${row.name}`,
      content: <ScaleForm current={row.size} onSubmit={(sz) => { setModal(null); notify(`Scale to ${sz} requested (mock)`); }} />,
    });

  const openSnapshot = (row) =>
    setModal({
      title: `Snapshot - ${row.name}`,
      content: <SnapshotForm onSubmit={(name) => { setModal(null); notify(`Snapshot ${name} requested (mock)`); }} />,
    });

  const actionButtons = (row, types) => (
    <div style={styles.actionRow}>
      {types.includes('Pause') && <button style={styles.actionBtn} onClick={() => notify('Pause requested (mock)')}>Pause</button>}
      {types.includes('Resume') && <button style={styles.actionBtn} onClick={() => notify('Resume requested (mock)')}>Resume</button>}
      <button style={styles.actionBtn} onClick={() => openSnapshot(row)}>Snapshot</button>
      <button style={styles.actionBtn} onClick={() => openScale(row)}>Scale</button>
      <button style={styles.actionBtnDanger} onClick={() => notify('Delete requested (mock)')}>Delete</button>
    </div>
  );

  const rdsColumns = [
    { header: 'Name', accessor: 'name' },
    { header: 'DB ID', accessor: 'id' },
    { header: 'Engine', accessor: 'engine' },
    { header: 'Size', accessor: 'size' },
    { header: 'Status', accessor: 'status' },
    { header: 'Region', accessor: 'region' },
    { header: 'Actions', accessor: 'actions', render: (row) => actionButtons(row, ['Pause', 'Resume']) },
  ];

  const azColumns = [
    { header: 'Name', accessor: 'name' },
    { header: 'DB ID', accessor: 'id' },
    { header: 'Engine', accessor: 'engine' },
    { header: 'Size', accessor: 'size' },
    { header: 'Status', accessor: 'status' },
    { header: 'Region', accessor: 'region' },
    { header: 'Actions', accessor: 'actions', render: (row) => actionButtons(row, ['Pause', 'Resume']) },
  ];

  const cards = [
    { key: 'AWS RDS', title: 'AWS RDS Instances', columns: rdsColumns, list: data['AWS RDS'] },
    { key: 'Azure SQL', title: 'Azure SQL Databases', columns: azColumns, list: data['Azure SQL'] },
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
        <Modal title={modal.title} onClose={() => setModal(null)}>
          {modal.content}
        </Modal>
      )}
    </div>
  );
};

const ScaleForm = ({ current, onSubmit }) => {
  const [size, setSize] = useState(current || 'db.m5.large');
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(size); }}>
      <div style={styles.formRow}>
        <label style={styles.smallLabel}>Instance size</label>
        <select value={size} onChange={(e) => setSize(e.target.value)} style={styles.select}>
          <option>db.t3.medium</option>
          <option>db.m5.large</option>
          <option>db.r6g.large</option>
          <option>GP_S_Gen5_2</option>
          <option>BC_Gen5_4</option>
        </select>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button type="submit" style={styles.primaryBtn}>Request Scale</button>
      </div>
    </form>
  );
};

const SnapshotForm = ({ onSubmit }) => {
  const [name, setName] = useState('snapshot-' + new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-'));
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(name); }}>
      <div style={styles.formRow}>
        <label style={styles.smallLabel}>Snapshot name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} style={styles.input} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button type="submit" style={styles.primaryBtn}>Create Snapshot</button>
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
  input: {
    width: '100%',
    background: '#FFFFFF',
    border: '1px solid #E5E7EB',
    color: '#111827',
    padding: '8px 10px',
    borderRadius: 8,
    fontSize: 13,
  },
  formRow: {
    marginBottom: 12,
  },
  hint: { color: '#9CA3AF', fontSize: 12 },
};

export default DatabasesPanel;
