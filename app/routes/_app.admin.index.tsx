import { useEffect, useRef, useState } from "react";
import { redirect, useFetcher } from "react-router";
import type { Route } from "./+types/_app.admin.index";
import { createSupabaseServerClient } from "~/lib/supabase.server";

export async function loader({ request }: Route.LoaderArgs) {
  const { supabase } = createSupabaseServerClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return redirect("/dashboard");
  return null;
}

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  const intent = form.get("intent");

  if (intent === "create_client_account") {
    const email = (form.get("email") as string || "").trim();
    const password = form.get("password") as string || "";
    const clientSlug = form.get("clientSlug") as string || "";

    if (!email || !password || !clientSlug) {
      return { error: "Email, password, and client are required" };
    }

    const SB_URL = "https://lavpnfluvywcjeiyuash.supabase.co";
    const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdnBuZmx1dnl3Y2plaXl1YXNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzYwMTM4NywiZXhwIjoyMDg5MTc3Mzg3fQ.DtJLCeAdfxABizPVJWZ_jZ9ma02g3dyj3dv1HaZbJ2g";

    const createRes = await fetch(`${SB_URL}/auth/v1/admin/users`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${SB_KEY}`, "apikey": SB_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, email_confirm: true }),
    });
    const userData = await createRes.json();
    if (!userData.id) {
      return { error: userData.msg || userData.message || "Failed to create account" };
    }

    await fetch(`${SB_URL}/rest/v1/profiles?id=eq.${userData.id}`, {
      method: "PATCH",
      headers: { "Authorization": `Bearer ${SB_KEY}`, "apikey": SB_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ role: "client", client_slug: clientSlug }),
    });

    const clientRes = await fetch(`${SB_URL}/rest/v1/msg_clients?slug=eq.${clientSlug}&select=id`, {
      headers: { "Authorization": `Bearer ${SB_KEY}`, "apikey": SB_KEY },
    });
    const clients = await clientRes.json();
    if (clients && clients.length > 0) {
      await fetch(`${SB_URL}/rest/v1/msg_client_users`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${SB_KEY}`, "apikey": SB_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: clients[0].id, user_id: userData.id, role: "owner" }),
      });
    }

    const origin = new URL(request.url).origin;
    return {
      created: true,
      email,
      clientSlug,
      reportingLink: `${origin}/dashboard/${clientSlug}`,
      messagingLink: `${origin}/hub/${clientSlug}/brand`,
    };
  }

  return {};
}

const CLIENTS = [
  { slug: "vernalys", name: "Vernalys Skin & Laser Clinic", status: "active", startDate: "2025-07", fee: 950, hasReporting: true, hasMessaging: false },
  { slug: "cronulla", name: "Cronulla Skin Sanctuary", status: "active", startDate: "2026-01", fee: 1500, hasReporting: true, hasMessaging: false },
  { slug: "eleve", name: "Élevé Cosmetics", status: "active", startDate: "2025-07", fee: 1000, hasReporting: true, hasMessaging: false },
  { slug: "rejuvia", name: "Rejuvia Beauty & Aesthetics", status: "active", startDate: "2025-10", fee: 1500, hasReporting: true, hasMessaging: false },
  { slug: "hairplus", name: "The Hair Plus Clinic", status: "active", startDate: "2026-01", fee: 990, hasReporting: true, hasMessaging: false },
  { slug: "oceanelle", name: "Oceanelle Medispa", status: "active", startDate: "2026-03", fee: 990, hasReporting: true, hasMessaging: false },
  { slug: "livingskin", name: "Living Skin Clinic", status: "active", startDate: "2025-11", fee: 950, hasReporting: true, hasMessaging: false },
  { slug: "mbluxury", name: "MB Luxury Spa", status: "active", startDate: "2025-09", fee: 1000, hasReporting: true, hasMessaging: true },
  { slug: "wildflower", name: "Wildflower Skin Clinic", status: "active", startDate: "2024-03", fee: 1200, hasReporting: true, hasMessaging: false },
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
  const [setupSlug, setSetupSlug] = useState<string | null>(null);
  const [setupName, setSetupName] = useState('');
  const [setupEmail, setSetupEmail] = useState('');
  const [setupPassword, setSetupPassword] = useState('');
  const setupFetcher = useFetcher();
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

  function openSetupModal(slug: string) {
    const client = CLIENTS.find(c => c.slug === slug);
    setSetupSlug(slug);
    setSetupName(client?.name || '');
    setSetupEmail('');
    setSetupPassword('');
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text).then(() => showToast(label + ' copied')).catch(() => showToast(label + ' copied'));
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
.client-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
@media (max-width: 1200px) { .client-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 768px) { .client-grid { grid-template-columns: 1fr; } }
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
.tile-actions { display: flex; gap: 10px; padding-top: 16px; border-top: 1px solid var(--beige-light); flex-wrap: nowrap; }
.btn { white-space: nowrap; }
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
              <div className="client-tile" key={c.slug} onClick={() => c.hasReporting ? openDashboard(c.slug) : (window.location.href = '/hub/' + c.slug + '/brand')}>
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
                  <div style={{paddingTop:'16px',borderTop:'1px solid var(--beige-light)',display:'flex',flexDirection:'column',gap:'8px'}}>
                    <a className="btn btn-primary" href={c.hasReporting ? '/dashboard/' + c.slug : '#'} onClick={(e) => { e.stopPropagation(); if (!c.hasReporting) e.preventDefault(); }} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'6px',width:'100%',padding:'10px 16px',opacity: c.hasReporting ? 1 : 0.35,cursor: c.hasReporting ? 'pointer' : 'default'}}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:'14px',height:'14px',flexShrink:0}}><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>
                      Reporting
                    </a>
                    <a className="btn btn-primary" href={c.hasMessaging ? '/hub/' + (c.slug === 'mbluxury' ? 'mb-luxury' : c.slug) + '/brand' : '#'} onClick={(e) => { e.stopPropagation(); if (!c.hasMessaging) e.preventDefault(); }} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'6px',width:'100%',padding:'10px 16px',background: c.hasMessaging ? '#5b9ea6' : '#888',opacity: c.hasMessaging ? 1 : 0.35,cursor: c.hasMessaging ? 'pointer' : 'default'}}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:'14px',height:'14px',flexShrink:0}}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"/></svg>
                      AI Messaging
                    </a>
                    <div style={{display:'flex',gap:'8px'}}>
                      <button className="btn btn-secondary" onClick={(e) => copyLink(c.slug, e)} style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:'6px',padding:'10px 16px'}}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:'14px',height:'14px',flexShrink:0}}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                        Copy Link
                      </button>
                      <button className="btn btn-secondary" onClick={(e) => { e.stopPropagation(); openSetupModal(c.slug); }} style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:'6px',padding:'10px 16px',background:'var(--green-light)',color:'var(--green)'}}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:'14px',height:'14px',flexShrink:0}}><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                        Setup Access
                      </button>
                    </div>
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

      {/* Setup Access Modal */}
      {setupSlug && (
        <div className="modal-overlay open" onClick={(e) => { if (e.target === e.currentTarget) setSetupSlug(null); }}>
          <div className="modal" style={{maxWidth:'520px'}}>
            <div className="modal-header">
              <h2 style={{fontFamily:"'Montserrat',sans-serif",fontSize:'18px',fontWeight:700}}>Client Access Setup</h2>
              <button onClick={() => setSetupSlug(null)} style={{background:'none',border:'none',cursor:'pointer',padding:'4px'}}>
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--dark)" strokeWidth="2" style={{width:'20px',height:'20px'}}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="modal-body">
              <p style={{color:'var(--dark-light)',marginBottom:'20px',fontSize:'14px',fontWeight:600}}>{setupName}</p>

              {(setupFetcher.data as any)?.created ? (
                <>
                  <div style={{background:'var(--green-light)',borderRadius:'8px',padding:'16px',marginBottom:'20px'}}>
                    <div style={{fontSize:'13px',fontWeight:600,color:'var(--green)',marginBottom:'4px'}}>Account created successfully</div>
                    <div style={{fontSize:'12px',color:'var(--dark-light)'}}>Email: {(setupFetcher.data as any).email}</div>
                  </div>
                  <div style={{marginBottom:'16px'}}>
                    <label style={{fontSize:'11px',fontWeight:600,color:'#999',textTransform:'uppercase',letterSpacing:'1px',display:'block',marginBottom:'6px'}}>Reporting Dashboard Link</label>
                    <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
                      <div style={{flex:1,background:'var(--beige-light)',borderRadius:'8px',padding:'10px 14px',fontSize:'12px',color:'var(--dark)',wordBreak:'break-all'}}>{(setupFetcher.data as any).reportingLink}</div>
                      <button className="btn btn-secondary" onClick={() => copyToClipboard((setupFetcher.data as any).reportingLink, 'Reporting link')} style={{padding:'10px 14px',flexShrink:0}}>Copy</button>
                    </div>
                  </div>
                  <div style={{marginBottom:'20px'}}>
                    <label style={{fontSize:'11px',fontWeight:600,color:'#999',textTransform:'uppercase',letterSpacing:'1px',display:'block',marginBottom:'6px'}}>AI Messaging Hub Link</label>
                    <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
                      <div style={{flex:1,background:'var(--beige-light)',borderRadius:'8px',padding:'10px 14px',fontSize:'12px',color:'var(--dark)',wordBreak:'break-all'}}>{(setupFetcher.data as any).messagingLink}</div>
                      <button className="btn btn-secondary" onClick={() => copyToClipboard((setupFetcher.data as any).messagingLink, 'Messaging link')} style={{padding:'10px 14px',flexShrink:0}}>Copy</button>
                    </div>
                  </div>
                  <button className="btn btn-secondary" onClick={() => setSetupSlug(null)} style={{width:'100%',padding:'12px'}}>Done</button>
                </>
              ) : (
                <setupFetcher.Form method="post">
                  <input type="hidden" name="intent" value="create_client_account" />
                  <input type="hidden" name="clientSlug" value={setupSlug} />
                  <div style={{marginBottom:'14px'}}>
                    <label style={{fontSize:'11px',fontWeight:600,color:'#999',textTransform:'uppercase',letterSpacing:'1px',display:'block',marginBottom:'6px'}}>Client Email</label>
                    <input type="email" name="email" value={setupEmail} onChange={(e) => setSetupEmail(e.target.value)} placeholder="client@example.com" required style={{width:'100%',padding:'10px 14px',border:'1px solid var(--beige)',borderRadius:'8px',fontFamily:'inherit',fontSize:'14px',color:'var(--dark)',outline:'none'}} />
                  </div>
                  <div style={{marginBottom:'20px'}}>
                    <label style={{fontSize:'11px',fontWeight:600,color:'#999',textTransform:'uppercase',letterSpacing:'1px',display:'block',marginBottom:'6px'}}>Password</label>
                    <input type="text" name="password" value={setupPassword} onChange={(e) => setSetupPassword(e.target.value)} placeholder="Set a password for the client" required style={{width:'100%',padding:'10px 14px',border:'1px solid var(--beige)',borderRadius:'8px',fontFamily:'inherit',fontSize:'14px',color:'var(--dark)',outline:'none'}} />
                    <p style={{fontSize:'11px',color:'#999',marginTop:'6px'}}>You set the password. Share it with the client along with their dashboard link.</p>
                  </div>
                  {(setupFetcher.data as any)?.error && (
                    <div style={{background:'#ffebee',borderRadius:'8px',padding:'12px',marginBottom:'16px',fontSize:'13px',color:'#c62828'}}>{(setupFetcher.data as any).error}</div>
                  )}
                  <button type="submit" className="btn btn-primary" disabled={setupFetcher.state === 'submitting' || !setupEmail || !setupPassword} style={{width:'100%',padding:'12px',opacity:(setupFetcher.state === 'submitting' || !setupEmail || !setupPassword)?0.6:1}}>
                    {setupFetcher.state === 'submitting' ? 'Creating Account...' : 'Create Account and Get Links'}
                  </button>
                </setupFetcher.Form>
              )}
            </div>
          </div>
        </div>
      )}

      <div className={`toast${toastVisible ? ' show' : ''}`}>{toastMsg}</div>
    </>
  );
}
