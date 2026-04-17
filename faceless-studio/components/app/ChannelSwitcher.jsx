'use client';
// components/app/ChannelSwitcher.jsx
// Compact dropdown to switch between channels on the generate page
// Only rendered for Studio plan users

import { useState, useEffect, useRef } from 'react';

/**
 * ChannelSwitcher
 *
 * Props:
 *   session         {object}  — Supabase session (for auth header)
 *   activeChannelId {string}  — currently active channel id
 *   onChange        {function(channel)} — called when user switches
 */
export default function ChannelSwitcher({ session, activeChannelId, onChange }) {
  const [channels, setChannels] = useState([]);
  const [open,     setOpen]     = useState(false);
  const [loading,  setLoading]  = useState(true);
  const [switching, setSwitching] = useState(false);
  const dropRef = useRef(null);

  useEffect(() => {
    if (!session?.access_token) return;
    fetch('/api/channels', { headers: { Authorization: `Bearer ${session.access_token}` } })
      .then(r => r.json())
      .then(json => { if (json.success) setChannels(json.channels || []); })
      .finally(() => setLoading(false));
  }, [session?.access_token]);

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  async function handleSwitch(channel) {
    if (channel.id === activeChannelId) { setOpen(false); return; }
    setSwitching(true);
    setOpen(false);
    try {
      await fetch(`/api/channels/${channel.id}/activate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      onChange?.(channel);
    } finally {
      setSwitching(false);
    }
  }

  const active = channels.find(c => c.id === activeChannelId) || channels[0];

  if (loading || channels.length === 0) return null;

  return (
    <>
      <style>{`
        .csw-root { position: relative; font-family: 'DM Sans', sans-serif; }

        .csw-trigger {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border: 1.5px solid #E8E8E8;
          border-radius: 9px;
          background: #FFFFFF;
          cursor: pointer;
          transition: all 0.18s;
          min-width: 0;
        }
        .csw-trigger:hover { border-color: #0A0A0A; background: #F8F8F8; }
        .csw-trigger.open  { border-color: #0A0A0A; }
        .csw-trigger.switching { opacity: 0.5; pointer-events: none; }

        .csw-avatar {
          width: 26px;
          height: 26px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          flex-shrink: 0;
        }

        .csw-label {
          flex: 1;
          min-width: 0;
          overflow: hidden;
        }
        .csw-channel-name {
          font-size: 13px;
          font-weight: 700;
          color: #0A0A0A;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          line-height: 1.3;
        }
        .csw-channel-meta {
          font-size: 10px;
          color: #8C8C8C;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-family: 'JetBrains Mono', monospace;
          line-height: 1.3;
        }

        .csw-chevron {
          font-size: 10px;
          color: #8C8C8C;
          flex-shrink: 0;
          transition: transform 0.2s;
        }
        .csw-trigger.open .csw-chevron { transform: rotate(180deg); }

        .csw-dropdown {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          min-width: 260px;
          background: #FFFFFF;
          border: 1.5px solid #0A0A0A;
          border-radius: 12px;
          overflow: hidden;
          z-index: 500;
          box-shadow: 0 8px 32px rgba(0,0,0,0.12);
          animation: csw-drop 0.18s ease both;
        }

        @keyframes csw-drop {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .csw-header {
          padding: 10px 14px;
          border-bottom: 1px solid #E8E8E8;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .csw-header-label {
          font-size: 9px;
          font-weight: 700;
          color: #8C8C8C;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-family: 'JetBrains Mono', monospace;
        }
        .csw-manage-link {
          font-size: 11px;
          font-weight: 600;
          color: #0A0A0A;
          text-decoration: underline;
          text-underline-offset: 2px;
          cursor: pointer;
          background: none;
          border: none;
          padding: 0;
          font-family: 'DM Sans', sans-serif;
        }

        .csw-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          cursor: pointer;
          transition: background 0.12s;
          border: none;
          background: transparent;
          width: 100%;
          text-align: left;
        }
        .csw-item:hover { background: #F8F8F8; }
        .csw-item.active { background: #F5F5F5; }

        .csw-item-avatar {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 17px;
          flex-shrink: 0;
        }

        .csw-item-body { flex: 1; min-width: 0; }
        .csw-item-name {
          font-size: 13px;
          font-weight: 600;
          color: #0A0A0A;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          display: block;
        }
        .csw-item-sub {
          font-size: 10px;
          color: #8C8C8C;
          font-family: 'JetBrains Mono', monospace;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          display: block;
          margin-top: 1px;
        }
        .csw-item-check {
          width: 16px;
          height: 16px;
          border-radius: '50%';
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          flex-shrink: 0;
          border-radius: 50%;
        }
        .csw-item-check.checked {
          background: #0A0A0A;
          color: #FFFFFF;
        }

        .csw-footer {
          padding: 8px 14px;
          border-top: 1px solid #E8E8E8;
        }
        .csw-new-btn {
          width: 100%;
          padding: '8px 0';
          border: 1px dashed #E8E8E8;
          border-radius: 7px;
          background: transparent;
          font-size: 12px;
          font-weight: 600;
          color: #5C5C5C;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: all 0.15s;
          padding: 8px 0;
          text-align: center;
        }
        .csw-new-btn:hover { border-color: #0A0A0A; color: #0A0A0A; background: #F8F8F8; }
      `}</style>

      <div className="csw-root" ref={dropRef}>
        {/* Trigger */}
        <button
          className={`csw-trigger${open ? ' open' : ''}${switching ? ' switching' : ''}`}
          onClick={() => !switching && setOpen(!open)}
          title="Switch channel"
        >
          {switching ? (
            <span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #E8E8E8', borderTopColor: '#0A0A0A', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
          ) : active ? (
            <div className="csw-avatar" style={{ background: `${active.avatar_color}18`, border: `1.5px solid ${active.avatar_color}40` }}>
              {active.avatar_emoji}
            </div>
          ) : null}

          {active && (
            <div className="csw-label">
              <div className="csw-channel-name">{active.name}</div>
              <div className="csw-channel-meta">{active.platform} · {active.niche?.slice(0, 20) || active.language}</div>
            </div>
          )}

          {channels.length > 1 && <span className="csw-chevron">▼</span>}
        </button>

        {/* Dropdown */}
        {open && (
          <div className="csw-dropdown">
            <div className="csw-header">
              <span className="csw-header-label">Your channels ({channels.length}/5)</span>
              <button className="csw-manage-link" onClick={() => { setOpen(false); window.location.href = '/channels'; }}>Manage →</button>
            </div>

            {channels.map(ch => {
              const isActive = ch.id === activeChannelId;
              return (
                <button key={ch.id} className={`csw-item ${isActive ? 'active' : ''}`} onClick={() => handleSwitch(ch)}>
                  <div className="csw-item-avatar" style={{ background: `${ch.avatar_color}18`, border: `1.5px solid ${ch.avatar_color}${isActive ? '80' : '30'}` }}>
                    {ch.avatar_emoji}
                  </div>
                  <div className="csw-item-body">
                    <span className="csw-item-name">{ch.name}</span>
                    <span className="csw-item-sub">
                      {[ch.niche?.slice(0, 18) || ch.platform, ch.language].filter(Boolean).join(' · ')}
                    </span>
                  </div>
                  <div className={`csw-item-check ${isActive ? 'checked' : ''}`} style={{ border: isActive ? 'none' : '1.5px solid #E8E8E8' }}>
                    {isActive ? '✓' : ''}
                  </div>
                </button>
              );
            })}

            {channels.length < 5 && (
              <div className="csw-footer">
                <button className="csw-new-btn" onClick={() => { setOpen(false); window.location.href = '/channels'; }}>
                  + Add channel
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}