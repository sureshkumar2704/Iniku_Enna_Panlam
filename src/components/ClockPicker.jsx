import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

const CX = 120, CY = 120, FACE_R = 100, NUM_R = 80, HAND_R = 88, TIP_R = 10;

function clockAngleToXY(clockDeg, r) {
  const rad = (clockDeg - 90) * (Math.PI / 180);
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
}

function posToClockAngle(clientX, clientY, rect) {
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  let angle = Math.atan2(clientX - cx, -(clientY - cy)) * (180 / Math.PI);
  if (angle < 0) angle += 360;
  return angle;
}

export default function ClockPicker({ value, onChange, label, placeholder = '--:-- --', disabled }) {
  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState(0);
  const [ampm, setAmpm] = useState('AM');
  const [mode, setMode] = useState('hour');
  const [isDragging, setIsDragging] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [hasValue, setHasValue] = useState(false);
  const svgRef = useRef(null);
  const popupRef = useRef(null);
  const activePointerIdRef = useRef(null);

  useEffect(() => {
    if (value) {
      const [h, m] = value.split(':').map(Number);
      setAmpm(h >= 12 ? 'PM' : 'AM');
      setHour(h % 12 || 12);
      setMinute(m);
      setHasValue(true);
    }
  }, [value]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    function onOutside(e) {
      if (popupRef.current && !popupRef.current.contains(e.target)) setIsOpen(false);
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [isOpen]);

  function emit(h, m, ap) {
    let h24 = h % 12;
    if (ap === 'PM') h24 += 12;
    onChange(`${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    setHasValue(true);
  }

  function applyAngle(angle) {
    if (mode === 'hour') {
      const h = Math.round(angle / 30) % 12 || 12;
      setHour(h);
    } else {
      const m = Math.round(angle / 6) % 60;
      setMinute(m);
    }
  }

  function getAngle(e) {
    if (!svgRef.current) return 0;
    const rect = svgRef.current.getBoundingClientRect();
    const cl = e.clientX;
    const ct = e.clientY;
    return posToClockAngle(cl, ct, rect);
  }

  const onPointerDown = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    activePointerIdRef.current = e.pointerId;
    if (svgRef.current?.setPointerCapture && e.pointerId !== undefined) {
      svgRef.current.setPointerCapture(e.pointerId);
    }
    applyAngle(getAngle(e));
  }, [mode, hour, minute, ampm]);

  const onPointerMove = useCallback((e) => {
    if (!isDragging) return;
    e.preventDefault();
    e.stopPropagation();
    applyAngle(getAngle(e));
  }, [isDragging, mode, hour, minute, ampm]);

  const onPointerUp = useCallback((e) => {
    if (!isDragging) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (svgRef.current?.releasePointerCapture && activePointerIdRef.current !== null) {
      try {
        svgRef.current.releasePointerCapture(activePointerIdRef.current);
      } catch {
        // Ignore if capture was already released.
      }
    }
    activePointerIdRef.current = null;
    if (mode === 'hour') setMode('minute');
  }, [isDragging, mode]);

  const handAngle = mode === 'hour' ? (hour % 12) * 30 : minute * 6;
  const tip = clockAngleToXY(handAngle, HAND_R);

  const dH = String(hour).padStart(2, '0');
  const dM = String(minute).padStart(2, '0');

  // Generate hour/minute labels
  const labels = mode === 'hour'
    ? Array.from({ length: 12 }, (_, i) => {
        const h = i + 1;
        const pos = clockAngleToXY(h * 30, NUM_R);
        return { key: h, label: String(h), pos, selected: h === hour };
      })
    : Array.from({ length: 12 }, (_, i) => {
        const m = i * 5;
        const pos = clockAngleToXY(m * 6, NUM_R);
        return { key: m, label: String(m).padStart(2, '0'), pos, selected: m === minute };
      });

  return (
    <div className="cp-wrap">
      <span className="cp-label">{label}</span>
      <button
        className={`cp-trigger ${hasValue ? 'cp-trigger--set' : ''}`}
        onClick={() => {
          if (disabled) return;
          setMode('hour');
          setIsOpen((o) => !o);
        }}
        type="button"
        disabled={disabled}
        style={disabled ? { cursor: 'not-allowed', opacity: 0.5 } : {}}
      >
        {hasValue ? `${dH}:${dM} ${ampm}` : placeholder}
      </button>

      {isOpen && createPortal(
        <>
          <div className="cp-overlay" onClick={() => setIsOpen(false)} />
          <div className="cp-popup" ref={popupRef}>
            {/* Time display + mode selector */}
            <div className="cp-header">
            <button type="button" className={`cp-seg ${mode === 'hour' ? 'cp-seg--active' : ''}`} onClick={() => setMode('hour')}>{dH}</button>
            <span className="cp-sep">:</span>
            <button type="button" className={`cp-seg ${mode === 'minute' ? 'cp-seg--active' : ''}`} onClick={() => setMode('minute')}>{dM}</button>
            <div className="cp-ampm">
              <button type="button" className={ampm === 'AM' ? 'cp-ampm-btn--active' : 'cp-ampm-btn'} onClick={() => setAmpm('AM')}>AM</button>
              <button type="button" className={ampm === 'PM' ? 'cp-ampm-btn--active' : 'cp-ampm-btn'} onClick={() => setAmpm('PM')}>PM</button>
            </div>
          </div>

          <p className="cp-hint">{mode === 'hour' ? 'Drag to set hour' : 'Drag to set minute'}</p>

          {/* SVG Clock */}
          <svg
            ref={svgRef}
            viewBox="0 0 240 240"
            className="cp-svg"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            style={{ touchAction: 'none', userSelect: 'none', cursor: isDragging ? 'grabbing' : 'grab' }}
          >
            {/* Outer ring */}
            <circle cx={CX} cy={CY} r={FACE_R + 4} className="cp-ring" />
            {/* Face */}
            <circle cx={CX} cy={CY} r={FACE_R} className="cp-face" />

            {/* Tick marks */}
            {Array.from({ length: 60 }, (_, i) => {
              const a = i * 6;
              const isMain = i % 5 === 0;
              const inner = clockAngleToXY(a, isMain ? FACE_R - 12 : FACE_R - 6);
              const outer = clockAngleToXY(a, FACE_R - 1);
              return (
                <line key={i} x1={outer.x} y1={outer.y} x2={inner.x} y2={inner.y}
                  strokeWidth={isMain ? 2 : 1}
                  stroke={isMain ? 'rgba(160,150,255,0.5)' : 'rgba(255,255,255,0.1)'} />
              );
            })}

            {/* Selected sector arc */}
            {(() => {
              const startRad = -Math.PI / 2;
              const endRad = (handAngle - 90) * Math.PI / 180;
              const largeArc = handAngle > 180 ? 1 : 0;
              const sx = CX + 3 * Math.cos(startRad);
              const sy = CY + 3 * Math.sin(startRad);
              const ex = CX + (HAND_R - 12) * Math.cos(endRad);
              const ey = CY + (HAND_R - 12) * Math.sin(endRad);
              return (
                <path
                  d={`M ${sx} ${sy} L ${tip.x * 0.85 + CX * 0.15} ${tip.y * 0.85 + CY * 0.15}`}
                  stroke="rgba(124,108,248,0.3)" strokeWidth="2" fill="none"
                />
              );
            })()}

            {/* Hand */}
            <line x1={CX} y1={CY} x2={tip.x} y2={tip.y} className="cp-hand" />

            {/* Labels */}
            {labels.map(({ key, label, pos, selected }) => (
              <g key={key}>
                {selected && <circle cx={pos.x} cy={pos.y} r={14} className="cp-num-bg" />}
                <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central"
                  className={`cp-num ${selected ? 'cp-num--sel' : ''}`}>
                  {label}
                </text>
              </g>
            ))}

            {/* Center dot */}
            <circle cx={CX} cy={CY} r={5} className="cp-center" />
            {/* Hand tip */}
            <circle cx={tip.x} cy={tip.y} r={TIP_R} className="cp-tip" />
          </svg>

          <div className="cp-footer">
            <button type="button" className="btn btn-ghost cp-cancel" onClick={() => {
              if (value) {
                const [h, m] = value.split(':').map(Number);
                setAmpm(h >= 12 ? 'PM' : 'AM');
                setHour(h % 12 || 12);
                setMinute(m);
              }
              setIsOpen(false);
            }}>Cancel</button>
            <button type="button" className="btn btn-primary cp-ok" onClick={() => { 
              emit(hour, minute, ampm);
              setIsOpen(false); 
              setMode('hour'); 
            }}>OK</button>
          </div>
        </div>
        </>,
        document.body
      )}
    </div>
  );
}
