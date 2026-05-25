import React from 'react';
import { supabase } from '../utils/supabase/client';

export default function SupabaseDemo() {
  const [status, setStatus] = React.useState('idle');

  async function testPing() {
    setStatus('loading');
    try {
      // Try a lightweight call: fetch current user (may be null) and test a simple read
      const { data: user } = await supabase.auth.getUser();
      // If you have a 'destination' table, this will attempt to read one row.
      const { data, error } = await supabase.from('destination').select().limit(1).maybeSingle();
      if (error) throw error;
      setStatus('OK');
    } catch (err) {
      console.error('Supabase test failed', err);
      setStatus('error');
    }
  }

  return (
    <div style={{ padding: 16 }}>
      <h3>Supabase Integration</h3>
      <p>Status: {status}</p>
      <button onClick={testPing}>Test Supabase</button>
    </div>
  );
}
