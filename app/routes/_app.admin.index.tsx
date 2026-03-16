import { useEffect, useRef, useState } from "react";

const CLIENTS = [
  { slug: "vernalys", name: "Vernalys Skin & Laser Clinic", status: "active", startDate: "2025-07", fee: 950 },
  { slug: "cronulla", name: "Cronulla Skin Sanctuary", status: "active", startDate: "2026-01", fee: 1500 },
  { slug: "eleve", name: "Eleve Cosmetics", status: "active", startDate: "2025-07", fee: 1000 },
  { slug: "rejuvia", name: "Rejuvia Beauty & Aesthetics", status: "active", startDate: "2025-10", fee: 1500 },
  { slug: "hairplus", name: "The Hair Plus Clinic", status: "active", startDate: "2026-01", fee: 990 },
];

function fmtC(v: number) { return '$' + Number(v).toLocaleString('en-AU', {minimumFractionDigits: 0, maximumFractionDigits: 0}); }
function fmtCd(v: number) { return '$' + Number(v).toLocaleString('en-AU', {minimumFractionDigits: 2, maximumFractionDigits: 2}); }

function getLastMonth(data: any) {
  if (!data || !data.meta || !data.meta.monthly) return null;
  const months = Object.keys(data.meta.monthly).sort();
  const now = new Date();
  const currentKey = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  const completed = months.filter((m: string) => m < currentKey);
  return completed.length ? completed[completed.length - 1] : months[months.length - 1];
}

function getMonthName(key: string) {
  const [, m] = key.split('-');
  const names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return names[parseInt(m) - 1] + ' ' + key.split('-')[0];
}

export default function AdminHub() {
  const [allData, setAllData] = useState<any[]>([]);
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [inviteSlug, setInviteSlug] = useState<string | null>(null);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const templateRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    Promise.all(CLIENTS.map(c =>
      Promise.all([
        fetch(`/data/${c.slug}/meta.json`).then(r => r.ok ? r.json() : null),
        fetch(`/data/${c.slug}/leads.json`).then(r => r.ok ? r.json() : null),
      ]).then(([meta, leads]) => meta && leads ? { meta, leads } : null)
    )).then(setAllData);
  }, []);

  function showToast(msg: string) {
    setToastMsg(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2200);
  }

  function copyLink(slug: string, e: React.MouseEvent) {
    e.stopPropagation();
    const url = window.location.origin + '/dashboard?client=' + slug;
    navigator.clipboard.writeText(url).then(() => showToast('Report link copied')).catch(() => showToast('Report link copied'));
  }

  function openDashboard(slug: string) {
    window.location.href = '/dashboard?client=' + slug;
  }

  function openInviteModal(slug: string) {
    const client = CLIENTS.find(c => c.slug === slug);
    setInviteSlug(slug);
    setInviteName(client?.name || '');
    setInviteEmail('');
    setInviteLink('');
    setInviteLoading(false);
  }

  async function generateLink() {
    if (!inviteEmail || !inviteSlug) return;
    setInviteLoading(true);
    setInviteLink('');
    try {
      const form = new FormData();
      form.set('email', inviteEmail);
      form.set('clientSlug', inviteSlug);
      form.set('displayName', inviteName);
      const res = await fetch('/api/generate-link', { method: 'POST', body: form });
      const data = await res.json();
      if (data.link) {
        setInviteLink(data.link);
        showToast('Login link generated');
      } else {
        showToast('Error: ' + (data.error || 'Unknown error'));
      }
    } catch (e) {
      showToast('Failed to generate link');
    }
    setInviteLoading(false);
  }

  function copyInviteLink() {
    navigator.clipboard.writeText(inviteLink).then(() => showToast('Login link copied')).catch(() => showToast('Login link copied'));
  }

  function copyTemplate() {
    if (templateRef.current) {
      navigator.clipboard.writeText(templateRef.current.value).then(() => showToast('Template copied to clipboard')).catch(() => {
        templateRef.current?.select();
        document.execCommand('copy');
        showToast('Template copied to clipboard');
      });
    }
  }

  const now = new Date();
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const dateStr = now.getDate() + ' ' + months[now.getMonth()] + ' ' + now.getFullYear();

  let totalSpend = 0, totalLeads = 0, totalRevenue = 0;
  let latestMonth: string | null = null;
  CLIENTS.forEach((_, i) => {
    const data = allData[i];
    if (!data) return;
    const lm = getLastMonth(data);
    if (!lm) return;
    if (!latestMonth || lm > latestMonth) latestMonth = lm;
    const mm = data.meta.monthly[lm];
    const lm2 = data.leads.monthly[lm];
    if (mm) { totalSpend += mm.spend; totalLeads += mm.leads; }
    if (lm2) { totalRevenue += lm2.moneyCollected || 0; }
  });

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
:root {
  --bg: #f5f0e8;
  --card: #ffffff;
  --dark: #3b3b3b;
  --dark-light: #5a5a5a;
  --beige: #ddd5c4;
  --beige-light: #eee8dc;
  --accent: #c4a882;
  --green: #6ba378;
  --green-light: #e8f5eb;
  --coral: #c47a6c;
  --teal: #5b9ea6;
  --radius: 12px;
  --shadow: 0 1px 3px rgba(59,59,59,0.06), 0 1px 2px rgba(59,59,59,0.04);
  --shadow-hover: 0 8px 24px rgba(59,59,59,0.12);
}
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Montserrat', sans-serif; background: var(--bg); color: var(--dark); min-height: 100vh; }
.header { background: var(--card); border-bottom: 1px solid var(--beige); padding: 24px 40px; display: flex; align-items: center; justify-content: space-between; position: fixed; top: 0; left: 0; right: 0; z-index: 10; }
.header-left { display: flex; align-items: center; gap: 16px; }
.logo-text { font-weight: 700; font-size: 15px; letter-spacing: 2.5px; text-transform: uppercase; color: var(--dark); }
.logo-divider { width: 1px; height: 24px; background: var(--beige); }
.header-title { font-family: Georgia, serif; font-size: 20px; font-weight: 700; color: var(--dark); }
.header-right { display: flex; align-items: center; gap: 16px; font-size: 13px; color: var(--dark-light); }
.header-date { padding: 8px 16px; background: var(--beige-light); border-radius: 8px; font-weight: 500; }
.container { max-width: 1200px; margin: 0 auto; padding: 100px 24px 40px; }
.stats-bar { display: flex; gap: 16px; margin-bottom: 32px; }
.stat-card { flex: 1; background: var(--card); border-radius: var(--radius); padding: 20px 24px; box-shadow: var(--shadow); }
.stat-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; color: #999; margin-bottom: 6px; }
.stat-value { font-size: 28px; font-weight: 700; color: var(--dark); }
.stat-sub { font-size: 12px; color: var(--dark-light); margin-top: 4px; }
.section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.section-title { font-family: Georgia, serif; font-size: 18px; font-weight: 700; }
.section-count { font-size: 13px; color: #999; font-weight: 500; }
.client-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 20px; }
.client-tile { background: var(--card); border-radius: var(--radius); box-shadow: var(--shadow); overflow: hidden; transition: all 0.25s ease; cursor: pointer; position: relative; }
.client-tile:hover { box-shadow: var(--shadow-hover); transform: translateY(-2px); }
.tile-accent { height: 4px; background: var(--dark); }
.tile-body { padding: 24px; }
.tile-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px; }
.tile-name { font-family: Georgia, serif; font-size: 17px; font-weight: 700; color: var(--dark); line-height: 1.3; }
.tile-status { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; padding: 4px 10px; border-radius: 20px; white-space: nowrap; }
.tile-status.active { background: var(--green-light); color: var(--green); }
.tile-status.paused { background: #fef3e5; color: var(--coral); }
.tile-metrics { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 20px; }
.tile-metric-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #aaa; margin-bottom: 2px; }
.tile-metric-value { font-size: 16px; font-weight: 700; color: var(--dark); }
.tile-actions { display: flex; gap: 10px; padding-top: 16px; border-top: 1px solid var(--beige-light); }
.btn { flex: 1; padding: 10px 16px; border-radius: 8px; font-family: inherit; font-size: 12px; font-weight: 600; border: none; cursor: pointer; transition: all 0.2s; text-align: center; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; gap: 6px; }
.btn-primary { background: var(--dark); color: white; }
.btn-primary:hover { background: #2a2a2a; }
.btn-secondary { background: var(--beige-light); color: var(--dark); }
.btn-secondary:hover { background: var(--beige); }
.btn svg { width: 14px; height: 14px; flex-shrink: 0; }
.toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%) translateY(80px); background: var(--dark); color: white; padding: 12px 24px; border-radius: 8px; font-size: 13px; font-weight: 600; box-shadow: 0 8px 24px rgba(0,0,0,0.2); transition: transform 0.3s ease; z-index: 100; pointer-events: none; }
.toast.show { transform: translateX(-50%) translateY(0); }
.modal-overlay { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(59,59,59,0.5); z-index: 200; align-items: center; justify-content: center; padding: 24px; }
.modal-overlay.open { display: flex; }
.modal { background: var(--card); border-radius: var(--radius); box-shadow: 0 16px 48px rgba(0,0,0,0.2); width: 100%; max-width: 560px; max-height: 90vh; overflow-y: auto; }
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; border-bottom: 1px solid var(--beige-light); }
.modal-body { padding: 24px; }
@media (max-width: 768px) {
  .header { padding: 20px 16px 16px; flex-direction: column; align-items: center; gap: 4px; position: fixed; top: 0; left: 0; right: 0; z-index: 10; }
  .container { padding: 130px 16px 24px; }
  .header-left { flex-direction: column; align-items: center; gap: 4px; }
  .logo-text { font-size: 18px; letter-spacing: 3px; }
  .logo-divider { display: none; }
  .header-title { font-size: 14px; font-weight: 600; color: var(--dark-light); }
  .header-right { width: auto; }
  .header-date { font-size: 11px; padding: 6px 12px; }
  .stats-bar { flex-wrap: wrap; }
  .stat-card { min-width: calc(50% - 8px); }
  .client-grid { grid-template-columns: 1fr; }
}
      `}} />

      <div className="header">
        <div className="header-left">
          <div className="logo-text">MEDIA WAFFLE</div>
          <div className="logo-divider"></div>
          <div className="header-title">Client Hub</div>
        </div>
        <div className="header-right">
          <div className="header-date">{dateStr}</div>
        </div>
      </div>

      <div className="container">
        <div className="stats-bar">
          <div className="stat-card">
            <div className="stat-label">Active Clients</div>
            <div className="stat-value">{CLIENTS.length}</div>
            <div className="stat-sub">Managed accounts</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Ad Spend</div>
            <div className="stat-value">{fmtC(totalSpend)}</div>
            <div className="stat-sub">{latestMonth ? getMonthName(latestMonth) : '--'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Leads</div>
            <div className="stat-value">{totalLeads}</div>
            <div className="stat-sub">{latestMonth ? getMonthName(latestMonth) : '--'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Revenue</div>
            <div className="stat-value">{fmtC(totalRevenue)}</div>
            <div className="stat-sub">{latestMonth ? getMonthName(latestMonth) : '--'}</div>
          </div>
        </div>

        <div className="section-header">
          <div className="section-title">Active Clients</div>
          <div className="section-count">{CLIENTS.length} clients</div>
        </div>
        <div className="client-grid">
          {CLIENTS.map((c, i) => {
            const data = allData[i];
            const lm = data ? getLastMonth(data) : null;
            const mm = lm && data.meta.monthly[lm] ? data.meta.monthly[lm] : null;
            const spend = mm ? fmtC(mm.spend) : '--';
            const leads = mm ? mm.leads : '--';
            const cpl = mm ? fmtCd(mm.cpl) : '--';
            const period = lm ? getMonthName(lm) : '--';
            return (
              <div className="client-tile" key={c.slug} onClick={() => openDashboard(c.slug)}>
                <div className="tile-accent"></div>
                <div className="tile-body">
                  <div className="tile-header">
                    <div className="tile-name">{c.name}</div>
                    <div className={`tile-status ${c.status}`}>{c.status}</div>
                  </div>
                  <div style={{fontSize:'11px',color:'#aaa',fontWeight:500,textTransform:'uppercase',letterSpacing:'1px',marginBottom:'12px'}}>{period}</div>
                  <div className="tile-metrics">
                    <div>
                      <div className="tile-metric-label">Ad Spend</div>
                      <div className="tile-metric-value">{spend}</div>
                    </div>
                    <div>
                      <div className="tile-metric-label">Leads</div>
                      <div className="tile-metric-value">{leads}</div>
                    </div>
                    <div>
                      <div className="tile-metric-label">CPL</div>
                      <div className="tile-metric-value">{cpl}</div>
                    </div>
                  </div>
                  <div className="tile-actions">
                    <a className="btn btn-primary" onClick={() => openDashboard(c.slug)} href="javascript:void(0)">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
                      View Dashboard
                    </a>
                    <button className="btn btn-secondary" onClick={(e) => copyLink(c.slug, e)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                      Copy Link
                    </button>
                    <button className="btn btn-secondary" onClick={(e) => { e.stopPropagation(); openInviteModal(c.slug); }} style={{background:'var(--green-light)',color:'var(--green)'}}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2Z"/></svg>
                      Invite
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{marginTop:'40px',textAlign:'center'}}>
          <button className="btn btn-secondary" onClick={() => setModalOpen(true)} style={{padding:'14px 32px',fontSize:'14px',border:'2px dashed var(--beige)',background:'transparent',borderRadius:'var(--radius)',width:'100%',maxWidth:'340px'}}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:'18px',height:'18px'}}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add New Client
          </button>
        </div>
      </div>

      <div className={`modal-overlay${modalOpen ? ' open' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}>
        <div className="modal">
          <div className="modal-header">
            <h2 style={{fontFamily:'Georgia,serif',fontSize:'20px'}}>New Client Dashboard Setup</h2>
            <button onClick={() => setModalOpen(false)} style={{background:'none',border:'none',cursor:'pointer',padding:'4px'}}>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--dark)" strokeWidth="2" style={{width:'20px',height:'20px'}}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div className="modal-body">
            <p style={{color:'var(--dark-light)',marginBottom:'20px',fontSize:'13px',lineHeight:'1.6'}}>Copy the template below, fill in the details, and send it to Atlas to set up a new client dashboard.</p>
            <textarea ref={templateRef} readOnly style={{width:'100%',minHeight:'380px',padding:'16px',fontFamily:"'Montserrat',sans-serif",fontSize:'12px',lineHeight:'1.8',border:'1px solid var(--beige)',borderRadius:'8px',background:'var(--beige-light)',color:'var(--dark)',resize:'vertical'}} defaultValue={`NEW CLIENT DASHBOARD REQUEST

Client name:
Dashboard slug (short lowercase identifier, e.g. "vernalys"):
Meta Ad Account ID (format: act_XXXXXXXXXX):
Google Sheet ID (the long string from the sheet URL):
Lead Data tab name (e.g. "Lead Data 2025" or "Lead Data 2026"):
First month of ad data (e.g. July 2025):
Ad account currency (AUD or USD):
Agency fee per month ($):
Fee start date (if different from first month):
Any fee changes over time (e.g. "$800 for first 3 months, then $1,000"):

OPTIONAL
Offer/campaign names:
GHL Location ID (if not already configured):
GHL API Key (if not already configured):
LTV per client ($):
Any notes:`} />
            <div style={{display:'flex',gap:'10px',marginTop:'16px'}}>
              <button className="btn btn-primary" onClick={copyTemplate} style={{flex:1,padding:'12px'}}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                Copy Template
              </button>
              <button className="btn btn-secondary" onClick={() => setModalOpen(false)} style={{flex:1,padding:'12px'}}>Close</button>
            </div>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {inviteSlug && (
        <div className="modal-overlay open" onClick={(e) => { if (e.target === e.currentTarget) setInviteSlug(null); }}>
          <div className="modal" style={{maxWidth:'480px'}}>
            <div className="modal-header">
              <h2 style={{fontFamily:'Georgia,serif',fontSize:'18px'}}>Generate Login Link</h2>
              <button onClick={() => setInviteSlug(null)} style={{background:'none',border:'none',cursor:'pointer',padding:'4px'}}>
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--dark)" strokeWidth="2" style={{width:'20px',height:'20px'}}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="modal-body">
              <p style={{color:'var(--dark-light)',marginBottom:'16px',fontSize:'13px'}}>{inviteName}</p>
              {!inviteLink ? (
                <>
                  <label style={{fontSize:'11px',fontWeight:600,color:'#999',textTransform:'uppercase',letterSpacing:'1px',display:'block',marginBottom:'6px'}}>Client Email</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="client@example.com"
                    style={{width:'100%',padding:'10px 14px',border:'1px solid var(--beige)',borderRadius:'8px',fontFamily:'inherit',fontSize:'14px',color:'var(--dark)',marginBottom:'16px',outline:'none'}}
                  />
                  <button className="btn btn-primary" onClick={generateLink} disabled={inviteLoading || !inviteEmail} style={{width:'100%',padding:'12px',opacity:inviteLoading?0.6:1}}>
                    {inviteLoading ? 'Generating...' : 'Generate Login Link'}
                  </button>
                </>
              ) : (
                <>
                  <label style={{fontSize:'11px',fontWeight:600,color:'#999',textTransform:'uppercase',letterSpacing:'1px',display:'block',marginBottom:'6px'}}>Login Link (one-time use)</label>
                  <div style={{background:'var(--beige-light)',borderRadius:'8px',padding:'12px',wordBreak:'break-all',fontSize:'12px',color:'var(--dark)',marginBottom:'16px',lineHeight:'1.6'}}>
                    {inviteLink}
                  </div>
                  <div style={{display:'flex',gap:'10px'}}>
                    <button className="btn btn-primary" onClick={copyInviteLink} style={{flex:1,padding:'12px'}}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                      Copy Link
                    </button>
                    <button className="btn btn-secondary" onClick={() => { setInviteLink(''); setInviteEmail(''); }} style={{flex:1,padding:'12px'}}>
                      Generate New
                    </button>
                  </div>
                  <p style={{fontSize:'11px',color:'#999',marginTop:'12px'}}>Send this link to the client. It will log them in directly to their dashboard. Links expire after 24 hours.</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div className={`toast${toastVisible ? ' show' : ''}`}>{toastMsg}</div>
    </>
  );
}
