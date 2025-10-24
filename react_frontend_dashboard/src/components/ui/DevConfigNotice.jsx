import React from 'react';
import { hasSupabaseConfig } from '../../lib/supabaseClient';

const boxStyle = {
  background: '#FFF7ED',
  border: '1px solid #FDBA74',
  color: '#9A3412',
  padding: '8px 12px',
  borderRadius: 8,
  fontSize: 12,
  marginBottom: 12,
};

const DevConfigNotice = () => {
  if (hasSupabaseConfig()) return null;
  return (
    <div style={boxStyle}>
      Supabase configuration missing. Some features may be disabled. Add REACT_APP_SUPABASE_URL and
      REACT_APP_SUPABASE_KEY to your .env (see .env.example).
    </div>
  );
};

export default DevConfigNotice;
