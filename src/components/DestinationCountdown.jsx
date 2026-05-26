import React, { useState, useEffect } from 'react';
import { fromDateKey } from '../utils/dateUtils';
import { deleteCollectionRecord, fetchCollectionRecord, upsertCollectionRecord } from '../utils/apiClient';
import useSupabaseToken from '../hooks/useSupabaseToken';

export default function DestinationCountdown({ userId }) {
  const { token: supabaseToken, isReady: supabaseReady } = useSupabaseToken();
  const [destDate, setDestDate] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [tempDate, setTempDate] = useState('');
  const destinationId = `${userId || 'public'}::main`;

  useEffect(() => {
    let active = true;
    if (!supabaseReady) return () => { active = false; };

    // Recompute destination id if userId changes
    const destId = `${userId || 'public'}::main`;

    fetchCollectionRecord('destination', [destId, 'main'], supabaseToken)
      .then(data => {
        if (active) {
          if (data && data.date) {
            setDestDate(data.date);
            setIsEditing(false);
          } else {
            setIsEditing(true);
          }
        }
      })
      .catch(() => { if (active) setIsEditing(true); });
    return () => { active = false; };
  }, [supabaseReady, supabaseToken, userId]);

  async function handleSave() {
    if (tempDate) {
      setDestDate(tempDate);
      setIsEditing(false);
      try {
        await upsertCollectionRecord('destination', [destinationId, 'main'], { id: destinationId, user_id: userId, date: tempDate }, supabaseToken);
      } catch {}
    }
  }

  async function handleClear() {
    setDestDate('');
    setTempDate('');
    setIsEditing(true);
    try {
      await deleteCollectionRecord('destination', [destinationId, 'main'], supabaseToken);
    } catch {}
  }

  // Calculate days remaining
  let daysRemaining = null;
  if (destDate && !isEditing) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dest = fromDateKey(destDate);
    dest.setHours(0, 0, 0, 0);
    
    const diffTime = dest.getTime() - today.getTime();
    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  return (
    <div className="dest-card">
      {isEditing ? (
        <div className="dest-edit">
          <div className="dest-info">
            <h3 className="dest-title">🎯 Set Destination Date</h3>
            <p className="dest-sub">What's your big deadline or goal date?</p>
          </div>
          <div className="dest-actions">
            <input 
              type="date" 
              className="task-input dest-input" 
              value={tempDate} 
              onChange={e => setTempDate(e.target.value)} 
            />
            <button className="btn btn-primary" onClick={handleSave} disabled={!tempDate}>Save</button>
            {destDate && <button className="btn btn-ghost" onClick={() => setIsEditing(false)}>Cancel</button>}
          </div>
        </div>
      ) : (
        <div className="dest-display">
          <div className="dest-info">
            <h3 className="dest-title">🎯 Countdown to Goal</h3>
            <p className="dest-sub">Target: {fromDateKey(destDate).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="dest-count">
            {daysRemaining < 0 ? (
              <span className="dest-passed">Goal passed by {Math.abs(daysRemaining)} days</span>
            ) : daysRemaining === 0 ? (
              <span className="dest-today">It's Today! 🎉</span>
            ) : (
              <>
                <span className="dest-num">{daysRemaining}</span>
                <span className="dest-label">days remaining</span>
              </>
            )}
          </div>
          <button className="btn btn-ghost dest-edit-btn" onClick={() => { setTempDate(destDate); setIsEditing(true); }}>Edit</button>
        </div>
      )}
    </div>
  );
}
