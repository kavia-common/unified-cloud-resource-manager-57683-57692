import React, { useMemo, useState } from 'react';
import Table from '../../../components/ui/Table';
import Modal from '../../../components/ui/Modal';

/**
 * PUBLIC_INTERFACE
 * NetworkingPanel shows security group and load balancer management with mock actions.
 */
const NetworkingPanel = () => {
  const data = useMemo(
    () => ({
      'Security Groups': [
        { id: 'sg-0a1b2c', name: 'web-sg', rules: 5, attached: 3, provider: 'AWS' },
        { id: 'az-nsg-01', name: 'az-web-nsg', rules: 7, attached: 2, provider: 'Azure' },
      ],
      'Load Balancers': [
        { id: 'alb-123', name: 'public-alb', type: 'application', listeners: 2, targets: 4, provider: 'AWS' },
        { id: 'az-lb-1', name: 'front-door', type: 'layer4', listeners: 3, targets: 6, provider: 'Azure' },
      ],
    }),
    []
  );

  const [expanded, setExpanded] = useState({ 'Security Groups': true, 'Load Balancers': true });
  const [modal, setModal] = useState(null);
  const toggle = (k) => setExpanded((e) => ({ ...e, [k]: !e[k] }));
  const notify = (m) => setTimeout(() => window.alert(m), 10);

  const openAttach = (row) =>
    setModal({
      title: `Attach to Instances - ${row.name}`,
      content: <AttachForm onSubmit={(ids) => { setModal(null); notify(`Attached to: ${ids} (mock)`); }} />,
    });

  const openRule = (row) =>
    setModal({
      title: `Add Rule - ${row.name}`,
      content: <RuleForm onSubmit={(r) => { setModal(null); notify(`Rule added: ${r.protocol}/${r.port} (mock)`); }} />,
    });

  const openLBTargets = (row) =>
    setModal({
      title: `Manage Targets - ${row.name}`,
      content: <TargetsForm onSubmit={(action) => { setModal(null); notify(`${action} targets requested (mock)`); }} />,
    });

  const sgColumns = [
    { header: 'Name', accessor: 'name' },
    { header: 'SG/NSG ID', accessor: 'id' },
    { header: 'Rules', accessor: 'rules' },
    { header: 'Attached', accessor: 'attached' },
    { header: 'Provider', accessor: 'provider' },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (row) => (
        <div style={styles.actionRow}>
          <button style={styles.actionBtn} onClick={() => openAttach(row)}>Attach</button>
          <button style={styles.actionBtn} onClick={() => notify('Detach requested (mock)')}>Detach</button>
          <button style={styles.actionBtn} onClick={() => openRule(row)}>Add Rule</button>
          <button style={styles.actionBtnDanger} onClick={() => notify('Delete requested (mock)')}>Delete</button>
        </div>
      ),
    },
  ];

  const lbColumns = [
    { header: 'Name', accessor: 'name' },
    { header: 'LB ID', accessor: 'id' },
    { header: 'Type', accessor: 'type' },
    { header: 'Listeners', accessor: 'listeners' },
    { header: 'Targets', accessor: 'targets' },
    { header: 'Provider', accessor: 'provider' },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (row) => (
        <div style={styles.actionRow}>
          <button style={styles.actionBtn} onClick={() => openLBTargets(row)}>Manage Targets</button>
          <button style={styles.actionBtn} onClick={() => notify('Add Listener (mock)')}>Add Listener</button>
          <button style={styles.actionBtnDanger} onClick={() => notify('Delete LB (mock)')}>Delete</button>
        </div>
      ),
    },
  ];

  const cards = [
    { key: 'Security Groups', title: 'Security Groups / NSGs', columns: sgColumns, list: data['Security Groups'] },
    { key: 'Load Balancers', title: 'Load Balancers', columns: lbColumns, list: data['Load Balancers'] },
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

const AttachForm = ({ onSubmit }) => {
  const [ids, setIds] = useState('i-0a1b2c3,i-1234567');
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(ids); }}>
      <div style={styles.formRow}>
        <label style={styles.smallLabel}>Instance IDs (comma separated)</label>
        <input value={ids} onChange={(e) => setIds(e.target.value)} style={styles.input} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button type="submit" style={styles.primaryBtn}>Attach</button>
      </div>
    </form>
  );
};

const RuleForm = ({ onSubmit }) => {
  const [protocol, setProtocol] = useState('tcp');
  const [port, setPort] = useState(443);
  const [cidr, setCidr] = useState('0.0.0.0/0');

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ protocol, port, cidr }); }}>
      <div style={styles.formRow}>
        <label style={styles.smallLabel}>Protocol</label>
        <select value={protocol} onChange={(e) => setProtocol(e.target.value)} style={styles.select}>
          <option>tcp</option>
          <option>udp</option>
        </select>
      </div>
      <div style={styles.formRow}>
        <label style={styles.smallLabel}>Port</label>
        <input type="number" value={port} onChange={(e) => setPort(parseInt(e.target.value || '0', 10))} style={styles.input} />
      </div>
      <div style={styles.formRow}>
        <label style={styles.smallLabel}>CIDR</label>
        <input value={cidr} onChange={(e) => setCidr(e.target.value)} style={styles.input} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button type="submit" style={styles.primaryBtn}>Add Rule</button>
      </div>
    </form>
  );
};

const TargetsForm = ({ onSubmit }) => {
  const [action, setAction] = useState('Register');
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(action); }}>
      <div style={styles.formRow}>
        <label style={styles.smallLabel}>Action</label>
        <select value={action} onChange={(e) => setAction(e.target.value)} style={styles.select}>
          <option>Register</option>
          <option>Deregister</option>
        </select>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button type="submit" style={styles.primaryBtn}>Apply</button>
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

export default NetworkingPanel;
