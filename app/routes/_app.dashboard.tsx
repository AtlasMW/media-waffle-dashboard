import { useEffect, useRef } from "react";
import { useRouteLoaderData, useParams } from "react-router";
import type { Route } from "./+types/_app.dashboard";
import { createSupabaseServerClient } from "~/lib/supabase.server";

export async function loader({ request, params }: Route.LoaderArgs) {
  const { supabase } = createSupabaseServerClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.redirect(new URL("/login", request.url).toString());

  const { data: profile } = await supabase.from("profiles").select("role, client_slug").eq("id", user.id).single();

  // Admin can access any dashboard
  if (profile?.role === "admin") return { allowed: true, slug: params.slug || profile?.client_slug };

  // Client can only access their own dashboard
  const requestedSlug = params.slug || new URL(request.url).searchParams.get("client");
  if (requestedSlug && profile?.client_slug && requestedSlug !== profile.client_slug) {
    // Redirect to their own dashboard
    return Response.redirect(new URL(`/dashboard/${profile.client_slug}`, request.url).toString());
  }

  return { allowed: true, slug: profile?.client_slug || requestedSlug };
}

const CSS = `
:root {
  --bg: #f5f0e8; --card: #ffffff; --dark: #3b3b3b; --dark-light: #5a5a5a;
  --beige: #ddd5c4; --beige-light: #eee8dc; --accent: #c4a882; --accent-light: #e8d5b8;
  --teal: #5b9ea6; --teal-light: #e8f4f5; --coral: #c47a6c; --coral-light: #f5e8e5;
  --green: #6ba378; --green-light: #e8f5eb; --fb-blue: #1877F2; --ig-purple: #ba1fe4;
  --sidebar-w: 240px; --radius: 12px;
  --shadow: 0 1px 3px rgba(59,59,59,0.06), 0 1px 2px rgba(59,59,59,0.04);
  --shadow-hover: 0 4px 12px rgba(59,59,59,0.1);
}
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Montserrat', sans-serif; background: var(--bg); color: var(--dark); min-height: 100vh; display: flex; }
.sidebar { width: var(--sidebar-w); background: var(--card); border-right: 1px solid var(--beige); position: fixed; top: 0; left: 0; bottom: 0; display: flex; flex-direction: column; z-index: 40; }
.sidebar-logo { padding: 24px 24px 20px; border-bottom: 1px solid var(--beige); }
.logo-text { font-weight: 700; font-size: 15px; letter-spacing: 2.5px; text-transform: uppercase; color: var(--dark); }
.logo-sub { font-size: 10px; font-weight: 500; letter-spacing: 1.5px; text-transform: uppercase; color: var(--accent); margin-top: 4px; }
.sidebar-nav { padding: 16px 12px; flex: 1; }
.nav-label { font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #aaa; padding: 12px 12px 6px; }
.nav-item { display: flex; align-items: center; gap: 12px; padding: 10px 14px; border-radius: 8px; font-size: 14px; font-weight: 500; color: var(--dark-light); cursor: pointer; transition: all 0.2s; margin-bottom: 2px; }
.nav-item:hover { background: var(--beige-light); color: var(--dark); }
.nav-item.active { background: var(--dark); color: white; }
.nav-item svg { width: 18px; height: 18px; flex-shrink: 0; }
.nav-item.active svg path, .nav-item.active svg rect, .nav-item.active svg circle, .nav-item.active svg polyline, .nav-item.active svg line { stroke: white; }
.sidebar-footer { padding: 16px 12px; border-top: 1px solid var(--beige); }
.sidebar-client { font-size: 11px; color: #999; font-weight: 500; }
.sidebar-updated { font-size: 10px; color: #bbb; margin-top: 4px; }
.main { margin-left: var(--sidebar-w); flex: 1; min-height: 100vh; }
.topbar { padding: 20px 32px; display: flex; align-items: center; justify-content: space-between; background: var(--card); border-bottom: 1px solid var(--beige); position: sticky; top: 0; z-index: 30; }
.topbar-left h1 { font-family: Georgia, serif; font-size: 22px; font-weight: 700; }
.topbar-left p { font-size: 13px; color: #999; margin-top: 2px; }
.topbar-right { display: flex; align-items: center; gap: 12px; }
.date-selector { display: flex; align-items: center; background: var(--beige-light); border-radius: 8px; overflow: visible; position: relative; }
.date-btn { padding: 8px 16px; font-family: inherit; font-size: 12px; font-weight: 600; border: none; background: none; color: var(--dark-light); cursor: pointer; transition: all 0.2s; }
.date-btn.active { background: var(--dark); color: white; }
.date-btn:hover:not(.active) { background: var(--beige); }
.custom-range-wrap { position: relative; }
.custom-range-popup { display: none; position: absolute; top: calc(100% + 8px); right: 0; background: var(--card); border-radius: 10px; box-shadow: var(--shadow-hover); padding: 16px; z-index: 100; min-width: 260px; }
.custom-range-popup.open { display: block; }
.custom-range-popup label { font-size: 11px; font-weight: 600; color: #999; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px; }
.custom-range-popup input[type="date"] { width: 100%; padding: 8px 10px; border: 1px solid var(--beige); border-radius: 6px; font-family: 'Montserrat', sans-serif; font-size: 13px; color: var(--dark); margin-bottom: 12px; outline: none; cursor: pointer; }
.custom-range-popup input[type="date"]:focus { border-color: var(--accent); }
.custom-range-popup .apply-btn { width: 100%; padding: 8px; background: var(--dark); color: white; border: none; border-radius: 6px; font-family: inherit; font-size: 12px; font-weight: 600; cursor: pointer; transition: opacity 0.2s; }
.custom-range-popup .apply-btn:hover { opacity: 0.85; }
.month-selector { display: flex; align-items: center; gap: 4px; }
.month-selector select { padding: 8px 12px; border: 1px solid var(--beige); border-radius: 8px; font-family: inherit; font-size: 13px; font-weight: 500; color: var(--dark); background: var(--card); cursor: pointer; outline: none; }
.month-nav-btn { width: 32px; height: 32px; border: 1px solid var(--beige); border-radius: 6px; background: var(--card); color: var(--dark); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 14px; transition: all 0.2s; }
.month-nav-btn:hover { background: var(--beige-light); border-color: var(--dark); }
.month-nav-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.month-nav-btn:disabled:hover { background: var(--card); border-color: var(--beige); }
.export-btn { padding: 8px 16px; border: 1px solid var(--beige); border-radius: 8px; font-family: inherit; font-size: 12px; font-weight: 600; color: var(--dark); background: var(--card); cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.2s; }
.export-btn:hover { border-color: var(--dark); background: var(--beige-light); }
.content { padding: 24px 32px 48px; }
.kpi-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; margin-bottom: 24px; }
.kpi-card { background: var(--card); border-radius: var(--radius); padding: 20px; box-shadow: var(--shadow); transition: box-shadow 0.2s; }
.kpi-card:hover { box-shadow: var(--shadow-hover); }
.kpi-icon { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; font-size: 14px; font-weight: 700; }
.kpi-icon.spend { background: var(--accent-light); color: var(--accent); }
.kpi-icon.leads { background: #e8e6e3; color: var(--dark); }
.kpi-icon.responded { background: var(--teal-light); color: var(--teal); }
.kpi-icon.booked { background: #f0eaff; color: #7c6fbd; }
.kpi-icon.revenue { background: #e8f5eb; color: #6ba378; }
.kpi-icon.cpl { background: var(--green-light); color: var(--green); }
.kpi-icon.ctr { background: var(--coral-light); color: var(--coral); }
.kpi-icon.impressions { background: #f0eaff; color: #7c6fbd; }
.kpi-icon.msg { background: #e8f0ff; color: var(--fb-blue); }
.kpi-icon.conv { background: #fce8ff; color: var(--ig-purple); }
.kpi-label { font-size: 11px; font-weight: 600; color: #999; letter-spacing: 0.5px; text-transform: uppercase; }
.kpi-value { font-size: 24px; font-weight: 700; margin-top: 4px; color: var(--dark); }
.kpi-trend { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 600; margin-top: 6px; padding: 2px 8px; border-radius: 4px; }
.kpi-trend.up { color: var(--green); background: var(--green-light); }
.kpi-trend.down { color: var(--coral); background: var(--coral-light); }
.kpi-trend.neutral { color: #999; background: var(--beige-light); }
.chart-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
.chart-row.triple { grid-template-columns: 1fr 1fr 1fr; }
.chart-row.full { grid-template-columns: 1fr; }
.chart-card { background: var(--card); border-radius: var(--radius); padding: 24px; box-shadow: var(--shadow); }
.chart-card h3 { font-family: Georgia, serif; font-size: 16px; font-weight: 700; margin-bottom: 4px; }
.chart-card .chart-sub { font-size: 12px; color: #999; margin-bottom: 16px; }
.chart-container { position: relative; height: 280px; }
.chart-container.short { height: 220px; }
.ad-table { width: 100%; border-collapse: collapse; }
.ad-table th { text-align: left; font-size: 11px; font-weight: 700; color: #999; text-transform: uppercase; letter-spacing: 0.5px; padding: 10px 12px; border-bottom: 1px solid var(--beige); }
.ad-table td { padding: 14px 12px; border-bottom: 1px solid var(--beige-light); font-size: 13px; vertical-align: middle; }
.ad-table tr:last-child td { border-bottom: none; }
.ad-table tr:hover { background: var(--beige-light); }
.ad-rank { width: 28px; height: 28px; border-radius: 6px; background: var(--beige-light); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px; }
.ad-rank.top { background: var(--accent-light); color: var(--accent); }
.ad-name { font-weight: 600; font-size: 13px; }
.ad-adset { font-size: 11px; color: #999; margin-top: 2px; }
.ad-metric { font-weight: 600; }
.ad-metric.best { color: var(--green); }
.lead-table { width: 100%; border-collapse: collapse; }
.lead-table th { text-align: left; font-size: 11px; font-weight: 700; color: #999; text-transform: uppercase; letter-spacing: 0.5px; padding: 10px 12px; border-bottom: 1px solid var(--beige); }
.lead-table td { padding: 12px; border-bottom: 1px solid var(--beige-light); font-size: 13px; }
.lead-table tr:hover { background: var(--beige-light); }
.status-badge { display: inline-block; padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; }
.status-badge.confirmed, .status-badge.appointmentsuccessful { background: var(--green-light); color: var(--green); }
.status-badge.noshow { background: var(--coral-light); color: var(--coral); }
.status-badge.cancelled { background: #ffeaea; color: #c0392b; }
.status-badge.followup, .status-badge.infollowup { background: var(--accent-light); color: var(--accent); }
.status-badge.nocontact { background: var(--beige-light); color: #999; }
.status-badge.yes { background: var(--green-light); color: var(--green); }
.status-badge.appointmentbooked { background: var(--teal-light); color: var(--teal); }
.tab-content { display: none; }
.tab-content.active { display: block; }
.offer-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
.offer-card { background: var(--beige-light); border-radius: 10px; padding: 20px; }
.offer-card h4 { font-size: 14px; font-weight: 700; margin-bottom: 12px; }
.offer-stat { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
.offer-stat .label { color: #999; font-weight: 500; }
.offer-stat .value { font-weight: 700; }
.range-label { font-size: 12px; color: #999; font-weight: 500; margin-bottom: 4px; text-align: center; }
.mobile-tabs { display: none; background: var(--card); border-bottom: 1px solid var(--beige); padding: 8px 12px; gap: 4px; position: sticky; top: 0; z-index: 35; }
.mobile-tab { flex: 1; padding: 10px 8px; border: none; background: var(--beige-light); border-radius: 8px; font-family: inherit; font-size: 12px; font-weight: 600; color: var(--dark-light); cursor: pointer; transition: all 0.2s; }
.mobile-tab.active { background: var(--dark); color: white; }
@media (max-width: 1200px) { .kpi-grid { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 1400px) and (min-width: 1201px) { .kpi-grid { grid-template-columns: repeat(5, 1fr); } }
@media (max-width: 900px) {
  .sidebar { display: none; }
  .main { margin-left: 0; }
  .mobile-tabs { display: flex; }
  .topbar { position: static; }
  .kpi-grid { grid-template-columns: repeat(2, 1fr); }
  .chart-row, .chart-row.triple { grid-template-columns: 1fr; }
  .content { padding: 16px; }
  .topbar { padding: 16px; flex-direction: column; align-items: stretch; gap: 12px; }
  .topbar-left { text-align: center; }
  .topbar-left h1 { font-size: 18px; }
  .topbar-right { flex-wrap: wrap; justify-content: center; gap: 8px; }
  .month-selector { justify-content: center; }
  .date-selector { justify-content: center; }
  .export-btn { justify-content: center; width: 100%; }
  .ad-table { display: block; overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .lead-table { display: block; overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .offer-grid { grid-template-columns: 1fr; }
  .custom-range-popup { right: auto; left: 50%; transform: translateX(-50%); }
}
@media (max-width: 480px) {
  .kpi-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
  .kpi-card { padding: 14px; }
  .kpi-value { font-size: 18px; }
  .kpi-label { font-size: 10px; }
  .kpi-icon { width: 28px; height: 28px; font-size: 11px; margin-bottom: 8px; }
  .content { padding: 10px; }
  .topbar { padding: 12px; }
  .topbar-left h1 { font-size: 16px; }
  .topbar-left p { font-size: 11px; }
  .chart-card { padding: 14px; }
  .chart-card h3 { font-size: 13px; }
  .chart-card .chart-sub { font-size: 11px; margin-bottom: 10px; }
  .chart-container { height: 200px; }
  .chart-container.short { height: 170px; }
  .chart-row { gap: 10px; margin-bottom: 10px; }
  .date-btn { padding: 6px 10px; font-size: 11px; }
  .month-selector select { font-size: 12px; padding: 6px 8px; }
  .month-nav-btn { width: 28px; height: 28px; font-size: 12px; }
  .ad-table, .ad-table thead, .ad-table tbody, .ad-table th, .ad-table td, .ad-table tr { display: block; }
  .ad-table thead { display: none; }
  .ad-table tr { background: var(--card); border: 1px solid var(--beige-light); border-radius: 8px; padding: 12px; margin-bottom: 8px; }
  .ad-table td { padding: 4px 0; border: none; font-size: 12px; display: flex; justify-content: space-between; }
  .ad-table td:before { font-weight: 600; color: #999; font-size: 11px; text-transform: uppercase; }
  .ad-rank { display: inline-flex; }
  .ad-name { font-size: 12px; }
  .ad-adset { font-size: 10px; }
  .lead-table, .lead-table thead, .lead-table tbody, .lead-table th, .lead-table td, .lead-table tr { display: block; }
  .lead-table thead { display: none; }
  .lead-table tr { background: var(--card); border: 1px solid var(--beige-light); border-radius: 8px; padding: 12px; margin-bottom: 8px; }
  .lead-table td { padding: 3px 0; border: none; font-size: 12px; }
  .offer-grid { gap: 10px; }
  .offer-card { padding: 14px; }
  .offer-card h4 { font-size: 13px; margin-bottom: 8px; }
  .offer-stat { font-size: 12px; padding: 4px 0; }
  .period-summary-grid { grid-template-columns: 1fr 1fr !important; gap: 12px !important; }
  .period-summary-grid div div:last-child { font-size: 22px !important; }
}
`;

// The entire dashboard JS logic from index.html, injected via useEffect
const DASHBOARD_SCRIPT = `
(function() {
let metaData=null, leadsData=null, currentTab='overview', currentMonth=null, currentRange='monthly', charts={}, customStart=null, customEnd=null;
const C = { dark:'#3b3b3b', accent:'#c4a882', teal:'#5b9ea6', coral:'#c47a6c', green:'#6ba378', purple:'#7c6fbd', beige:'#ddd5c4', beigeLight:'#eee8dc', fbBlue:'#1877F2', igPurple:'#ba1fe4' };
Chart.defaults.font.family = "'Montserrat', sans-serif";
Chart.defaults.font.size = 11;
Chart.defaults.color = '#999';
Chart.defaults.plugins.legend.labels.usePointStyle = true;
Chart.defaults.plugins.legend.labels.pointStyle = 'circle';
Chart.defaults.plugins.legend.labels.padding = 16;

window._dashboardSwitchTab = function(tab, el) { switchTab(tab, el); };
window._dashboardSetMobileTab = function(el) { setMobileTab(el); };
window._dashboardNavMonth = function(dir) { navMonth(dir); };
window._dashboardChangeMonth = function() { changeMonth(); };
window._dashboardSetRange = function(r, el) { setRange(r, el); };
window._dashboardToggleCustomRange = function(el) { toggleCustomRange(el); };
window._dashboardApplyCustomRange = function() { applyCustomRange(); };
window._dashboardExportPDF = function() { exportPDF(); };

async function loadData() {
  var client = new URLSearchParams(window.location.search).get('client');
  if (!client) client = window.__CLIENT_SLUG__ || null;
  if (!client) { window.location.href = '/admin'; return; }
  const [mr, lr] = await Promise.all([fetch('/data/' + client + '/meta.json'), fetch('/data/' + client + '/leads.json')]);
  metaData = await mr.json(); leadsData = await lr.json();
  document.getElementById('client-name').textContent = metaData.client;
  document.getElementById('sidebar-client').textContent = metaData.client;
  document.getElementById('sidebar-updated').textContent = 'Last updated: ' + fmtDate(metaData.lastUpdated.slice(0,10));
  populateMonths(); render();
}

function populateMonths() {
  const sel = document.getElementById('month-selector');
  const now = new Date();
  const currentMonthKey = now.toISOString().slice(0,7);
  const months = Object.keys(metaData.monthly).filter(function(m){ return m < currentMonthKey; }).sort().reverse();
  sel.innerHTML = months.map(function(m) { var p=m.split('-').map(Number); var d=new Date(p[0],p[1]-1,1); return '<option value="'+m+'">'+d.toLocaleDateString('en-AU',{month:'long',year:'numeric'})+'</option>'; }).join('');
  currentMonth = months[0] || Object.keys(metaData.monthly).sort().reverse()[0];
  updateMonthNav();
}

function changeMonth() { currentMonth = document.getElementById('month-selector').value; updateMonthNav(); render(); }
function navMonth(dir) {
  var sel = document.getElementById('month-selector');
  var opts = Array.from(sel.options).map(function(o){return o.value;});
  var idx = opts.indexOf(sel.value);
  var newIdx = idx - dir;
  if (newIdx >= 0 && newIdx < opts.length) { sel.value = opts[newIdx]; changeMonth(); }
}
function updateMonthNav() {
  var sel = document.getElementById('month-selector');
  var opts = Array.from(sel.options).map(function(o){return o.value;});
  var idx = opts.indexOf(sel.value);
  document.getElementById('month-prev').disabled = (idx >= opts.length - 1);
  document.getElementById('month-next').disabled = (idx <= 0);
}
function setRange(r, el) {
  currentRange=r;
  document.querySelectorAll('.date-btn').forEach(function(b){b.classList.remove('active');});
  el.classList.add('active');
  document.getElementById('month-selector-wrap').style.display = r==='monthly' ? 'flex' : 'none';
  if (r !== 'custom') document.getElementById('custom-range-popup').classList.remove('open');
  render();
}
function toggleCustomRange(el) {
  var popup = document.getElementById('custom-range-popup');
  var isOpen = popup.classList.contains('open');
  if (isOpen) { popup.classList.remove('open'); return; }
  var daily = metaData ? metaData.daily || [] : [];
  var ceiling = getDataCeiling();
  if (daily.length && ceiling && !document.getElementById('custom-start').value) {
    var s = parseLocalDate(ceiling); s.setDate(s.getDate()-29);
    document.getElementById('custom-start').value = s.toISOString().slice(0,10);
    document.getElementById('custom-end').value = ceiling;
    document.getElementById('custom-start').max = ceiling;
    document.getElementById('custom-end').max = ceiling;
    document.getElementById('custom-start').min = daily[0].date;
    document.getElementById('custom-end').min = daily[0].date;
  }
  popup.classList.add('open');
}
function applyCustomRange() {
  var s = document.getElementById('custom-start').value;
  var e = document.getElementById('custom-end').value;
  if (!s || !e) return;
  if (s > e) { alert('Start date must be before end date'); return; }
  customStart = s; customEnd = e;
  currentRange = 'custom';
  document.querySelectorAll('.date-btn').forEach(function(b){b.classList.remove('active');});
  document.getElementById('custom-range-btn').classList.add('active');
  document.getElementById('month-selector-wrap').style.display = 'none';
  document.getElementById('custom-range-popup').classList.remove('open');
  render();
}
function switchTab(tab, el) { currentTab=tab; document.querySelectorAll('.nav-item').forEach(function(n){n.classList.remove('active');}); document.querySelectorAll('.tab-content').forEach(function(t){t.classList.remove('active');}); if(el)el.classList.add('active'); document.getElementById('tab-'+tab).classList.add('active'); render(); }
function setMobileTab(el) { document.querySelectorAll('.mobile-tab').forEach(function(t){t.classList.remove('active');}); el.classList.add('active'); }

function fmtC(n) { return '$'+n.toLocaleString('en-AU',{minimumFractionDigits:2,maximumFractionDigits:2}); }
function fmtCw(n) { return '$'+Math.round(n).toLocaleString('en-AU'); }
function fmtP(n) { return n.toFixed(2)+'%'; }
function getMonthLabel(mk) { var p=mk.split('-').map(Number); return new Date(p[0],p[1]-1,1).toLocaleDateString('en-AU',{month:'long',year:'numeric'}); }
function fmtPw(n) { return Math.round(n)+'%'; }
function fmtN(n) { if(n>=1000000) return (n/1000000).toFixed(1)+'M'; if(n>=1000) return (n/1000).toFixed(1)+'K'; return n.toString(); }
function parseLocalDate(s) { if(!s) return new Date(NaN); if(s.indexOf('-')>-1){ var p=s.split('-').map(Number); return new Date(p[0],p[1]-1,p[2]||1); } var d=new Date(s); if(!isNaN(d.getTime())) return d; return new Date(NaN); }
function toISO(s) { var d=parseLocalDate(s); if(isNaN(d.getTime())) return ''; return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function fmtDate(d) { if(!d) return '--'; if(typeof d==='string') d=parseLocalDate(d); if(isNaN(d.getTime())) return '--'; var dd=String(d.getDate()).padStart(2,'0'); var mm=String(d.getMonth()+1).padStart(2,'0'); return dd+'/'+mm+'/'+d.getFullYear(); }
function fmtDateLong(d) { if(!d) return '--'; if(typeof d==='string') d=parseLocalDate(d); if(isNaN(d.getTime())) return '--'; var months=['January','February','March','April','May','June','July','August','September','October','November','December']; return d.getDate()+' '+months[d.getMonth()]+' '+d.getFullYear(); }
function fmtDateShort(d) { if(typeof d==='string') d=parseLocalDate(d); var months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']; return d.getDate()+' '+months[d.getMonth()]; }
function fmtBucketLabel(startDate, endDate) { var s=typeof startDate==='string'?parseLocalDate(startDate):startDate; var e=typeof endDate==='string'?parseLocalDate(endDate):endDate; var months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']; if(s.getMonth()===e.getMonth()) return s.getDate()+'-'+e.getDate()+' '+months[s.getMonth()]; return s.getDate()+' '+months[s.getMonth()]+' - '+e.getDate()+' '+months[e.getMonth()]; }
function prevMonth(m) { var p = m.split('-').map(Number); var d=new Date(p[0], p[1]-2, 1); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'); }

function trend(cur,prev,invert) {
  if(!prev&&prev!==0) return '<span class="kpi-trend neutral">--</span>';
  var ch=((cur-prev)/Math.abs(prev||1)*100).toFixed(1);
  var dir=ch>0?'up':ch<0?'down':'neutral';
  if(invert) dir=ch>0?'down':ch<0?'up':'neutral';
  var ar=ch>0?'&#8599;':ch<0?'&#8600;':'&#8594;';
  return '<span class="kpi-trend '+dir+'">'+ar+' '+Math.abs(ch)+'%</span>';
}

function kpi(icon,label,value,trendHtml) {
  return '<div class="kpi-card"><div class="kpi-icon '+icon+'"></div><div class="kpi-label">'+label+'</div><div class="kpi-value">'+value+'</div>'+(trendHtml||'')+'</div>';
}

function destroyCharts() { Object.values(charts).forEach(function(c){c.destroy();}); charts={}; }

function getLastCompletedMonthEnd() {
  var now = new Date();
  var endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  return endOfLastMonth.getFullYear()+'-'+String(endOfLastMonth.getMonth()+1).padStart(2,'0')+'-'+String(endOfLastMonth.getDate()).padStart(2,'0');
}

function getDataCeiling() {
  var daily = metaData.daily || [];
  if (!daily.length) return null;
  var lastCompleted = getLastCompletedMonthEnd();
  var latestData = daily[daily.length - 1].date;
  return lastCompleted < latestData ? lastCompleted : latestData;
}

function getDateRange(range) {
  var daily = metaData.daily || [];
  if (!daily.length) return null;
  var ceiling = getDataCeiling();
  if (!ceiling) return null;
  if (range === 'custom' && customStart && customEnd) {
    return { start: customStart, end: customEnd, label: fmtDate(customStart)+' - '+fmtDate(customEnd) };
  }
  var end = parseLocalDate(ceiling);
  var start;
  if (range === '7d') { start = new Date(end); start.setDate(start.getDate() - 6); }
  else if (range === '14d') { start = new Date(end); start.setDate(start.getDate() - 13); }
  else if (range === '90d') { start = new Date(end); start.setDate(start.getDate() - 89); }
  else { start = new Date(end); start.setDate(start.getDate() - 29); }
  var startStr = start.getFullYear()+'-'+String(start.getMonth()+1).padStart(2,'0')+'-'+String(start.getDate()).padStart(2,'0');
  return { start: startStr, end: ceiling, label: fmtDate(start)+' - '+fmtDate(end) };
}

function getDailyInRange(range) {
  var dr = getDateRange(range);
  if (!dr || !metaData.daily) return [];
  return metaData.daily.filter(function(d){ return d.date >= dr.start && d.date <= dr.end; });
}

function getLeadsInRange(range) {
  var dr = getDateRange(range);
  if (!dr || !leadsData.allLeads) return [];
  return leadsData.allLeads.filter(function(l){ var iso = toISO(l.date); return iso && iso >= dr.start && iso <= dr.end; });
}

function aggregateDaily(days) {
  var totals = { spend: 0, impressions: 0, reach: 0, leads: 0, messages: 0, linkClicks: 0 };
  days.forEach(function(d) { totals.spend += d.spend; totals.impressions += d.impressions; totals.reach += d.reach; totals.leads += d.leads; totals.messages += d.messages; totals.linkClicks += (d.linkClicks||0); });
  totals.cpl = totals.leads > 0 ? totals.spend / totals.leads : 0;
  totals.costPerMessage = totals.messages > 0 ? totals.spend / totals.messages : 0;
  totals.cpc = totals.linkClicks > 0 ? totals.spend / totals.linkClicks : 0;
  // CRITICAL: leadConvPct = leads / linkClicks * 100
  totals.leadConvPct = totals.linkClicks > 0 ? (totals.leads / totals.linkClicks * 100) : 0;
  var withCtr = days.filter(function(d){ return d.uniqueCtr > 0; });
  totals.uniqueCtr = withCtr.length > 0 ? withCtr.reduce(function(s,d){ return s + d.uniqueCtr; }, 0) / withCtr.length : 0;
  totals.cpm = days.length > 0 ? days.reduce(function(s,d){ return s + d.cpm; }, 0) / days.length : 0;
  return totals;
}

function aggregateLeads(leads) {
  var totals = { totalLeads: leads.length, responded: 0, noContact: 0, inFollowUp: 0, confirmed: 0, noShow: 0, cancelled: 0 };
  leads.forEach(function(l) {
    var r = (l.responded || '').toLowerCase();
    if (r === 'yes') totals.responded++;
    else if (r === 'no contact') totals.noContact++;
    else totals.inFollowUp++;
    var s = (l.status || '').toLowerCase();
    if (s.includes('successful') || s === 'confirmed') totals.confirmed++;
    else if (s.includes('cancelled')) totals.cancelled++;
    else if (s.includes('no show') || s.includes('no-show')) totals.noShow++;
  });
  totals.respondedPct = totals.totalLeads > 0 ? (totals.responded / totals.totalLeads * 100) : 0;
  totals.booked = totals.confirmed + totals.cancelled + totals.noShow;
  totals.bookedPct = totals.totalLeads > 0 ? (totals.booked / totals.totalLeads * 100) : 0;
  totals.cancellationRate = totals.booked > 0 ? (totals.cancelled / totals.booked * 100) : 0;
  totals.rebooked = 0;
  if (leadsData.monthly) {
    var dr = getDateRange(currentRange);
    Object.entries(leadsData.monthly).forEach(function(entry) {
      var k = entry[0], v = entry[1];
      var mStart = k + '-01';
      var p = k.split('-').map(Number);
      var mEndD = new Date(p[0], p[1], 0);
      var mEnd = p[0]+'-'+String(p[1]).padStart(2,'0')+'-'+String(mEndD.getDate()).padStart(2,'0');
      if (dr && mStart <= dr.end && mEnd >= dr.start && v.rebooked) {
        totals.rebooked += v.rebooked;
      }
    });
  }
  totals.rebookingRate = totals.booked > 0 ? Math.min(100, (totals.rebooked / totals.booked * 100)) : 0;
  totals.moneyCollected = 0;
  if (leadsData.monthly) {
    var dr = getDateRange(currentRange);
    Object.entries(leadsData.monthly).forEach(function(entry) {
      var k = entry[0], v = entry[1];
      var mStart = k + '-01';
      var p = k.split('-').map(Number);
      var mEndD = new Date(p[0], p[1], 0);
      var mEnd = p[0]+'-'+String(p[1]).padStart(2,'0')+'-'+String(mEndD.getDate()).padStart(2,'0');
      if (dr && mStart <= dr.end && mEnd >= dr.start && v.moneyCollected) {
        totals.moneyCollected += v.moneyCollected;
      }
    });
  }
  return totals;
}

function render() {
  destroyCharts();
  var sub = document.getElementById('range-subtitle');
  var rdl = document.getElementById('range-date-label');
  if (currentRange === 'monthly') {
    var p = currentMonth.split('-').map(Number);
    var mStart = new Date(p[0], p[1] - 1, 1);
    var mEnd = new Date(p[0], p[1], 0);
    sub.textContent = fmtDate(mStart) + ' \\u2013 ' + fmtDate(mEnd);
    if(rdl) rdl.style.display='none';
    var m = metaData.monthly[currentMonth], l = enrichLeadData(leadsData.monthly[currentMonth]);
    var pm = metaData.monthly[prevMonth(currentMonth)], pl = enrichLeadData(leadsData.monthly[prevMonth(currentMonth)]);
    if (currentTab === 'overview') renderOverview(m, l, pm, pl);
    else if (currentTab === 'ads') renderAds(m, pm);
    else if (currentTab === 'leads') renderLeads(l, pl, m);
    else if (currentTab === 'roi') renderROI(m, l, pm, pl);
  } else {
    var dr = getDateRange(currentRange);
    sub.textContent = dr ? dr.label : 'Performance Dashboard';
    if(rdl && dr) { rdl.textContent = fmtDateLong(dr.start)+' - '+fmtDateLong(dr.end); rdl.style.display='inline'; } else if(rdl) { rdl.style.display='none'; }
    var days = getDailyInRange(currentRange);
    var leads = getLeadsInRange(currentRange);
    var m = aggregateDaily(days);
    var l = aggregateLeads(leads);
    var numDays;
    if (currentRange === 'custom') { numDays = Math.round((parseLocalDate(dr.end) - parseLocalDate(dr.start)) / 86400000) + 1; }
    else { numDays = currentRange === '7d' ? 7 : currentRange === '14d' ? 14 : currentRange === '90d' ? 90 : 30; }
    var drPrev = getDateRange(currentRange);
    var pm, pl;
    if (drPrev) {
      var prevEnd = parseLocalDate(drPrev.start);
      prevEnd.setDate(prevEnd.getDate() - 1);
      var prevStart = new Date(prevEnd);
      prevStart.setDate(prevStart.getDate() - numDays + 1);
      var prevStartStr = prevStart.toISOString().slice(0,10);
      var prevEndStr = prevEnd.toISOString().slice(0,10);
      var prevDays = (metaData.daily||[]).filter(function(d){ return d.date >= prevStartStr && d.date <= prevEndStr; });
      var prevLeads = (leadsData.allLeads||[]).filter(function(ld){ var iso=toISO(ld.date); return iso && iso >= prevStartStr && iso <= prevEndStr; });
      pm = aggregateDaily(prevDays);
      pl = aggregateLeads(prevLeads);
    }
    if (currentTab === 'overview') renderOverviewRange(m, l, pm, pl, days, leads);
    else if (currentTab === 'ads') renderAdsRange(m, pm, days);
    else if (currentTab === 'leads') renderLeadsRange(l, pl, leads, days);
    else if (currentTab === 'roi') renderROIRange(m, l, pm, pl);
  }
}

function enrichLeadData(l) {
  if (!l) return l;
  l.cancellationRate = l.booked > 0 ? (l.cancelled / l.booked * 100) : 0;
  if (l.rebooked === undefined) l.rebooked = 0;
  if (l.rebookingRate === undefined) l.rebookingRate = l.booked > 0 ? Math.min(100, (l.rebooked / l.booked * 100)) : 0;
  return l;
}

var LEGEND_OVERVIEW = '<div class="chart-row full"><div class="chart-card" style="background:var(--beige-light);"><h3 style="margin-bottom:16px;">Metric Definitions</h3><div style="display:grid;gap:12px;font-size:13px;line-height:1.6;"><div><strong>Total Spend:</strong> Total amount spent on Meta (Facebook/Instagram) advertising for the period.</div><div><strong>Total Leads:</strong> Number of leads generated through Meta ad campaigns during the period.</div><div><strong>Cost Per Lead (CPL):</strong> Average cost to acquire one lead. Calculated as Total Spend / Total Leads. Lower is better.</div><div><strong>Responded %:</strong> Percentage of leads who responded to follow-up contact via SMS, email, or phone call.</div><div><strong>Booked:</strong> Number of leads who booked an appointment (confirmed, cancelled, or no-show).</div><div><strong>Lead Status Breakdown:</strong> Visual breakdown of where all leads sit in the pipeline (Responded, No Contact, In Follow Up).</div><div><strong>Best Performing Ad:</strong> The ad with the highest efficiency (leads per dollar spent) for the period.</div></div></div></div>';
var LEGEND_ADS = '<div class="chart-row full"><div class="chart-card" style="background:var(--beige-light);"><h3 style="margin-bottom:16px;">Metric Definitions</h3><div style="display:grid;gap:12px;font-size:13px;line-height:1.6;"><div><strong>Ad Spend:</strong> Total amount spent on Meta ads during the selected reporting period.</div><div><strong>Leads Generated:</strong> Total number of leads captured from the ad campaigns.</div><div><strong>Cost Per Lead (CPL):</strong> Average cost to generate one lead.</div><div><strong>Conversations Started:</strong> Number of messaging conversations initiated through the ads (Facebook Messenger or Instagram DMs).</div><div><strong>Cost Per Conversation:</strong> Average cost to start a messaging conversation from the ads.</div><div><strong>Unique CTR:</strong> Percentage of people who saw the ad and clicked the link.</div><div><strong>CPM:</strong> Cost to show the ad 1,000 times. Indicates how expensive the audience is to reach.</div><div><strong>Link Clicks:</strong> Total number of clicks on links within the ad that directed people to a destination.</div><div><strong>CPC:</strong> Cost per click. Average cost for each link click on the ad.</div><div><strong>Lead Conv %:</strong> Percentage of link clicks that converted into a lead. Calculated as leads ÷ link clicks × 100.</div><div><strong>Audience by Age:</strong> Distribution of leads across age groups to identify which demographics respond most.</div><div><strong>Ad Placements:</strong> Where ads were shown (Facebook Feed, Instagram Feed, Stories, etc.) and how many leads each placement generated.</div></div></div></div>';
var LEGEND_LEADS = '<div class="chart-row full"><div class="chart-card" style="background:var(--beige-light);"><h3 style="margin-bottom:16px;">Metric Definitions</h3><div style="display:grid;gap:12px;font-size:13px;line-height:1.6;"><div><strong>Total Opportunities:</strong> Total number of qualified leads created in Go High Level CRM.</div><div><strong>Responded %:</strong> Percentage of leads who responded via SMS, email, or phone call.</div><div><strong>Booked:</strong> Number of leads who booked an appointment (confirmed, cancelled, or no-show).</div><div><strong>Booking Rate:</strong> Percentage of total leads who booked an appointment. Calculated as Booked / Total Opportunities x 100.</div><div><strong>Money Collected:</strong> Revenue generated from all confirmed appointments that came from leads during this period.</div><div><strong>Confirmed Appointments:</strong> Number of leads who attended their booked appointment successfully.</div><div><strong>Cancelled Appointments:</strong> Number of leads who booked an appointment but cancelled before attending.</div><div><strong>Cancellation Rate:</strong> Percentage of booked appointments that were cancelled.</div><div><strong>Rebooked Appointments:</strong> Number of successful appointments that were rebooked for a future appointment.</div><div><strong>Rebooking Rate:</strong> Percentage of successful bookings where the client scheduled another appointment.</div><div><strong>Lead Status Breakdown:</strong> Visual breakdown of where all leads sit in the pipeline (Confirmed, No Show, Cancelled, In Follow Up, No Contact).</div><div><strong>Offer Comparison:</strong> Side-by-side performance of each active offer, including budget allocation, leads, CPL, and bookings.</div></div></div></div>';

function getMonthlyDailyData(monthKey) {
  var daily = (metaData.daily || []).filter(function(d){ return d.date.startsWith(monthKey); });
  return {
    labels: daily.map(function(d){ return parseLocalDate(d.date).getDate(); }),
    spend: daily.map(function(d){ return d.spend; }),
    leads: daily.map(function(d){ return d.leads; }),
    cpl: daily.map(function(d){ return d.leads > 0 ? d.spend / d.leads : 0; }),
    days: daily
  };
}
function dailyXAxis() { return { grid:{display:false}, ticks:{ maxRotation:45, autoSkip:false, font:{size:9} } }; }

function renderOverview(m,l,pm,pl) {
  if(!m) return;
  var tab=document.getElementById('tab-overview');
  var dd = getMonthlyDailyData(currentMonth);
  var bestAd=m.ads&&m.ads.reduce(function(a,b){return((a.leads||0)/(a.spend||1)>(b.leads||0)/(b.spend||1))?a:b;},m.ads[0]);
  var avgCpl = m.cpl || 0;
  var avgCplLine = dd.labels.map(function(){ return avgCpl; });
  var ml = getMonthLabel(currentMonth);
  tab.innerHTML = '<div class="kpi-grid">'+kpi('spend','Total Spend',fmtC(m.spend),trend(m.spend,pm&&pm.spend))+kpi('leads','Total Leads',m.leads,trend(m.leads,pm&&pm.leads))+kpi('cpl','Cost Per Lead',fmtC(m.cpl),trend(m.cpl,pm&&pm.cpl,true))+kpi('responded','Responded %',l?fmtPw(l.respondedPct):'--',l&&pl?trend(l.respondedPct,pl.respondedPct):'')+kpi('booked','Booked',l?l.booked:'--',l&&pl?trend(l.booked,pl.booked):'')+'</div><div class="chart-row full"><div class="chart-card"><h3>Cost Per Lead</h3><div class="chart-sub">'+ml+' — Daily CPL vs monthly average ('+fmtC(avgCpl)+')</div><div class="chart-container"><canvas id="c-cpl"></canvas></div></div></div><div class="chart-row">'+(l?'<div class="chart-card"><h3>Lead Status</h3><div class="chart-sub">'+ml+'</div><div class="chart-container short"><canvas id="c-lead-status"></canvas></div></div>':'')+'<div class="chart-card"><h3>Best Performing Ad</h3><div class="chart-sub">'+ml+'</div><div style="padding:16px 0;"><div style="font-weight:700;font-size:16px;margin-bottom:4px;">'+(bestAd&&bestAd.adName||'--')+'</div><div style="font-size:12px;color:#999;margin-bottom:16px;">'+(bestAd&&bestAd.campaignName||'')+'</div><div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;"><div><div class="kpi-label">Leads</div><div style="font-size:22px;font-weight:700;margin-top:4px;">'+(bestAd&&bestAd.leads||0)+'</div></div><div><div class="kpi-label">CPL</div><div style="font-size:22px;font-weight:700;margin-top:4px;">'+fmtC(bestAd&&bestAd.cpl||0)+'</div></div><div><div class="kpi-label">Unique CTR</div><div style="font-size:22px;font-weight:700;margin-top:4px;">'+fmtP(bestAd&&bestAd.uniqueCtr||0)+'</div></div></div></div></div></div>'+LEGEND_OVERVIEW;

  charts.cpl = new Chart(document.getElementById('c-cpl'),{type:'line',data:{labels:dd.labels,datasets:[
    {label:'Daily CPL',data:dd.cpl,borderColor:C.dark,backgroundColor:'rgba(59,59,59,0.08)',fill:true,pointRadius:3,pointBackgroundColor:C.dark,pointHoverRadius:5,tension:0.3,borderWidth:2},
    {label:'Monthly Avg ('+fmtC(avgCpl)+')',data:avgCplLine,borderColor:C.accent,borderDash:[8,4],borderWidth:2,pointRadius:0,fill:false,tension:0}
  ]},options:{responsive:true,maintainAspectRatio:false,scales:{y:{grid:{color:'#f0ebe3'},ticks:{callback:function(v){return '$'+v.toFixed(2);}}},x:dailyXAxis()}}});

  if(l) {
    var lTotal=l.responded+l.noContact+l.inFollowUp;
    charts.ls = new Chart(document.getElementById('c-lead-status'),{type:'doughnut',data:{labels:['Responded: '+l.responded+' ('+(l.responded/lTotal*100).toFixed(1)+'%)','No Contact: '+l.noContact+' ('+(l.noContact/lTotal*100).toFixed(1)+'%)','In Follow Up: '+l.inFollowUp+' ('+(l.inFollowUp/lTotal*100).toFixed(1)+'%)'],datasets:[{data:[l.responded,l.noContact,l.inFollowUp],backgroundColor:[C.dark,C.beige,C.accent],borderWidth:0,hoverOffset:4}]},options:{responsive:true,maintainAspectRatio:false,cutout:'65%',plugins:{legend:{position:'bottom'}}}});
  }
}

function bucketDays(days, bucketSize) {
  if (bucketSize <= 1) return { labels: days.map(function(d){ return fmtDateShort(d.date); }), data: days };
  var buckets = [];
  for (var i = 0; i < days.length; i += bucketSize) {
    var chunk = days.slice(i, i + bucketSize);
    var spend = chunk.reduce(function(s,d){ return s + d.spend; }, 0);
    var leads = chunk.reduce(function(s,d){ return s + d.leads; }, 0);
    var impressions = chunk.reduce(function(s,d){ return s + d.impressions; }, 0);
    var messages = chunk.reduce(function(s,d){ return s + d.messages; }, 0);
    var label = fmtBucketLabel(chunk[0].date, chunk[chunk.length-1].date);
    buckets.push({ spend:spend, leads:leads, impressions:impressions, messages:messages, label:label });
  }
  return { labels: buckets.map(function(b){ return b.label; }), data: buckets };
}

function renderOverviewRange(m,l,pm,pl,days,leads) {
  var tab=document.getElementById('tab-overview');
  var _numD = currentRange==='custom' && customStart && customEnd ? Math.round((parseLocalDate(customEnd)-parseLocalDate(customStart))/86400000)+1 : 0;
  var bSize = (currentRange === '90d' || (currentRange==='custom' && _numD > 45)) ? 7 : 1;
  var bucketed = bucketDays(days, bSize);
  var labels = bucketed.labels;
  var chartData = bucketed.data;

  var avgCplR = m.cpl || 0;
  var cplDataR = chartData.map(function(d){ return d.leads > 0 ? d.spend / d.leads : null; });
  var avgCplLineR = labels.map(function(){ return avgCplR; });

  tab.innerHTML = '<div class="kpi-grid">'+kpi('spend','Total Spend',fmtC(m.spend),trend(m.spend,pm&&pm.spend))+kpi('leads','Total Leads',m.leads,trend(m.leads,pm&&pm.leads))+kpi('cpl','Cost Per Lead',fmtC(m.cpl),trend(m.cpl,pm&&pm.cpl,true))+kpi('responded','Responded %',fmtPw(l.respondedPct),pl?trend(l.respondedPct,pl.respondedPct):'')+kpi('booked','Booked',l.booked,pl?trend(l.booked,pl.booked):'')+'</div><div class="chart-row full"><div class="chart-card"><h3>Cost Per Lead</h3><div class="chart-sub">Daily CPL vs period average ('+fmtC(avgCplR)+')</div><div class="chart-container"><canvas id="c-cpl"></canvas></div></div></div><div class="chart-row"><div class="chart-card"><h3>Lead Status</h3><div class="chart-sub">Period breakdown</div><div class="chart-container short"><canvas id="c-lead-status"></canvas></div></div><div class="chart-card"><h3>Period Summary</h3><div class="chart-sub">Key metrics at a glance</div><div class="period-summary-grid" style="padding:16px 0;display:grid;grid-template-columns:1fr 1fr;gap:20px;"><div><div class="kpi-label">Total Leads</div><div style="font-size:28px;font-weight:700;margin-top:4px;">'+l.totalLeads+'</div></div><div><div class="kpi-label">Responded</div><div style="font-size:28px;font-weight:700;margin-top:4px;">'+l.responded+'</div></div><div><div class="kpi-label">Avg Daily Spend</div><div style="font-size:28px;font-weight:700;margin-top:4px;">'+fmtC(days.length?m.spend/days.length:0)+'</div></div><div><div class="kpi-label">Avg Daily Leads</div><div style="font-size:28px;font-weight:700;margin-top:4px;">'+(days.length?(m.leads/days.length).toFixed(1):'0')+'</div></div></div></div></div>'+LEGEND_OVERVIEW;

  var pr = (currentRange === '90d' || (currentRange==='custom' && _numD > 45)) ? 4 : 3;
  charts.cpl = new Chart(document.getElementById('c-cpl'),{type:'line',data:{labels:labels,datasets:[
    {label:'Daily CPL',data:cplDataR,borderColor:C.dark,backgroundColor:'rgba(59,59,59,0.06)',fill:true,pointRadius:pr,pointBackgroundColor:C.dark,tension:0.3,spanGaps:true,borderWidth:2},
    {label:'Period Avg ('+fmtC(avgCplR)+')',data:avgCplLineR,borderColor:C.accent,borderDash:[8,4],borderWidth:2,pointRadius:0,fill:false,tension:0}
  ]},options:{responsive:true,maintainAspectRatio:false,scales:{y:{grid:{color:'#f0ebe3'},ticks:{callback:function(v){return '$'+v.toFixed(2);}}},x:{grid:{display:false}}}}});

  var lTotal = l.responded + l.noContact + l.inFollowUp;
  if (lTotal > 0) {
    charts.ls = new Chart(document.getElementById('c-lead-status'),{type:'doughnut',data:{labels:['Responded: '+l.responded+' ('+(l.responded/lTotal*100).toFixed(1)+'%)','No Contact: '+l.noContact+' ('+(l.noContact/lTotal*100).toFixed(1)+'%)','In Follow Up: '+l.inFollowUp+' ('+(l.inFollowUp/lTotal*100).toFixed(1)+'%)'],datasets:[{data:[l.responded,l.noContact,l.inFollowUp],backgroundColor:[C.dark,C.beige,C.accent],borderWidth:0,hoverOffset:4}]},options:{responsive:true,maintainAspectRatio:false,cutout:'65%',plugins:{legend:{position:'bottom'}}}});
  }
}

function renderAds(m,pm) {
  if(!m) return;
  var tab=document.getElementById('tab-ads');
  var hasMultiOffer = m.offers && m.offers.length > 1;
  var hasGender = m.gender && m.gender.length > 0;
  var ageRowCols = hasGender ? 'triple' : '';
  var adsML = getMonthLabel(currentMonth);
  tab.innerHTML = '<div class="kpi-grid">'+kpi('spend','Ad Spend',fmtC(m.spend),trend(m.spend,pm&&pm.spend))+kpi('leads','Leads Generated',m.leads,trend(m.leads,pm&&pm.leads))+kpi('cpl','Cost Per Lead',fmtC(m.cpl),trend(m.cpl,pm&&pm.cpl,true))+kpi('msg','Conversations Started',m.messages,trend(m.messages,pm&&pm.messages))+kpi('msg','Cost Per Conversation',fmtC(m.costPerMessage),trend(m.costPerMessage,pm&&pm.costPerMessage,true))+kpi('ctr','Unique CTR',fmtP(m.uniqueCtr),trend(m.uniqueCtr,pm&&pm.uniqueCtr))+kpi('impressions','CPM',fmtC(m.cpm),trend(m.cpm,pm&&pm.cpm,true))+kpi('clicks','Link Clicks',fmtN(m.linkClicks||0),trend(m.linkClicks||0,pm&&pm.linkClicks||0))+kpi('cpc','CPC',fmtC(m.cpc||0),trend(m.cpc||0,pm&&pm.cpc||0,true))+kpi('conv','Lead Conv %',fmtP(m.leadConvPct),trend(m.leadConvPct,pm&&pm.leadConvPct))+'</div><div class="chart-row full"><div class="chart-card"><h3>Campaign Performance</h3><div class="chart-sub">'+adsML+' — Daily CPL by campaign</div><div class="chart-container"><canvas id="c-campaigns"></canvas></div></div></div>'+(hasMultiOffer?'<div class="chart-row full"><div class="chart-card"><h3>Offer Comparison</h3><div class="chart-sub">'+adsML+' — Side-by-side performance of active offers</div><div class="offer-grid" id="offer-compare-grid"></div></div></div>':'')+'<div class="chart-row '+ageRowCols+'"><div class="chart-card"><h3>Audience by Age</h3><div class="chart-sub">'+adsML+'</div><div class="chart-container"><canvas id="c-age"></canvas></div></div>'+(hasGender?'<div class="chart-card"><h3>Gender Breakdown</h3><div class="chart-sub">'+adsML+'</div><div class="chart-container"><canvas id="c-gender"></canvas></div></div>':'')+'<div class="chart-card"><h3>Ad Placements</h3><div class="chart-sub">'+adsML+'</div><div class="chart-container"><canvas id="c-placements"></canvas></div></div></div><div class="chart-row full"><div class="chart-card"><h3>Ad Creative Leaderboard</h3><div class="chart-sub">'+adsML+' — Top 5 ads ranked by cost per lead</div><div id="ad-leaderboard-table"></div></div></div>'+LEGEND_ADS;

  // Campaign daily CPL chart
  var campDaily = metaData.campaignDaily || {};
  var monthDates = Object.keys(campDaily).filter(function(d){ return d.startsWith(currentMonth); }).sort();
  var campNames = {};
  monthDates.forEach(function(d){ Object.keys(campDaily[d]).forEach(function(c){ campNames[c]=true; }); });
  var campList = Object.keys(campNames).sort();
  var campColors = [C.dark, C.coral, C.teal, C.accent, '#8b5cf6', '#f59e0b'];
  var campDatasets = [];
  campList.forEach(function(camp, i) {
    var cplArr = monthDates.map(function(d){ var cd = campDaily[d]&&campDaily[d][camp]; return cd && cd.leads > 0 ? cd.spend / cd.leads : null; });
    var totalSpend = 0, totalLeads = 0;
    monthDates.forEach(function(d){ var cd = campDaily[d]&&campDaily[d][camp]; if(cd){ totalSpend+=cd.spend; totalLeads+=cd.leads; }});
    var avgCplCamp = totalLeads > 0 ? totalSpend / totalLeads : 0;
    var shortName = camp.replace(/^.*?(?=((?:AGE [0-9]+[+]? )?OFFER))/i, '').substring(0, 40);
    campDatasets.push({label:shortName+' CPL',data:cplArr,borderColor:campColors[i%campColors.length],backgroundColor:'transparent',pointRadius:3,pointBackgroundColor:campColors[i%campColors.length],tension:0.3,borderWidth:2,spanGaps:true});
    campDatasets.push({label:shortName+' Avg ('+fmtC(avgCplCamp)+')',data:monthDates.map(function(){return avgCplCamp;}),borderColor:campColors[i%campColors.length],borderDash:[8,4],borderWidth:1.5,pointRadius:0,fill:false,tension:0});
  });
  var campDayLabels = monthDates.map(function(d){ return parseLocalDate(d).getDate(); });
  charts.camp = new Chart(document.getElementById('c-campaigns'),{type:'line',data:{labels:campDayLabels,datasets:campDatasets},options:{responsive:true,maintainAspectRatio:false,scales:{y:{grid:{color:'#f0ebe3'},ticks:{callback:function(v){return '$'+v.toFixed(0);}}},x:dailyXAxis()},plugins:{legend:{labels:{usePointStyle:true,pointStyle:'circle',font:{size:11}}}}}});

  if(hasMultiOffer) {
    document.getElementById('offer-compare-grid').innerHTML = m.offers.map(function(o) {
      var camp = (m.campaigns||[]).find(function(c){ return c.name.toUpperCase().includes(o.campaignPattern); });
      return '<div class="offer-card"><h4>'+o.name+'</h4><div class="offer-stat"><span class="label">Leads</span><span class="value">'+o.leads+'</span></div><div class="offer-stat"><span class="label">CPL</span><span class="value">'+fmtC(o.cpl)+'</span></div><div class="offer-stat"><span class="label">Lead Conv %</span><span class="value">'+fmtP(camp?camp.leadConvPct:0)+'</span></div></div>';
    }).join('');
  }

  var ageData = m.demographics || [];
  if(ageData.length) {
    var ageColors = [C.beigeLight, C.accent, C.dark, C.teal, C.coral, C.beige];
    charts.age = new Chart(document.getElementById('c-age'),{type:'pie',data:{
      labels:ageData.map(function(a){return (a.age||a.range)+' ('+a.leads+' leads, Budget $'+Math.round(a.spend)+')';}),
      datasets:[{data:ageData.map(function(a){return a.leads;}),backgroundColor:ageColors,borderWidth:2,borderColor:'#fff'}]
    },options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'right',labels:{font:{size:11}}}}}});
  }

  var placeData = m.placements || [];
  if(placeData.length) {
    var placementColors = [C.dark, C.accent, C.teal, C.coral, C.beige, C.beigeLight];
    charts.place = new Chart(document.getElementById('c-placements'),{type:'doughnut',data:{
      labels:placeData.filter(function(p){return p.leads>0;}).map(function(p){return p.name+' ('+p.leads+' leads)';}),
      datasets:[{data:placeData.filter(function(p){return p.leads>0;}).map(function(p){return p.leads;}),backgroundColor:placementColors,borderWidth:0,hoverOffset:4}]
    },options:{responsive:true,maintainAspectRatio:false,cutout:'60%',plugins:{legend:{position:'right',labels:{font:{size:11}}}}}});
  }

  if (hasGender) {
    var genderColors = [C.coral, C.teal, C.beige];
    charts.gender = new Chart(document.getElementById('c-gender'),{type:'pie',data:{
      labels:m.gender.map(function(g){ var cpl = g.leads > 0 ? fmtC(g.spend/g.leads) : '--'; return g.gender+' ('+g.leads+' leads, CPL '+cpl+')'; }),
      datasets:[{data:m.gender.map(function(g){return g.leads;}),backgroundColor:genderColors,borderWidth:2,borderColor:'#fff'}]
    },options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'right',labels:{font:{size:11}}}}}});
  }

  var ads = (m.ads||[]).filter(function(a){return a.spend>0;}).sort(function(a,b){return a.cpl-b.cpl;}).slice(0,5);
  document.getElementById('ad-leaderboard-table').innerHTML = '<table class="ad-table"><thead><tr><th>#</th><th>Ad Creative</th><th>Spend</th><th>Leads</th><th>CPL</th><th>Unique CTR</th><th>Frequency</th></tr></thead><tbody>'+ads.map(function(a,i){return '<tr><td><div class="ad-rank '+(i===0?'top':'')+'">'+(i+1)+'</div></td><td><div class="ad-name">'+a.adName+'</div><div class="ad-adset">'+a.adSetName+'</div></td><td class="ad-metric">'+fmtC(a.spend)+'</td><td class="ad-metric">'+a.leads+'</td><td class="ad-metric '+(i===0?'best':'')+'">'+fmtC(a.cpl)+'</td><td class="ad-metric">'+fmtP(a.uniqueCtr)+'</td><td class="ad-metric">'+a.frequency.toFixed(2)+'</td></tr>';}).join('')+'</tbody></table>';
}

function renderAdsRange(m,pm,days) {
  var tab=document.getElementById('tab-ads');
  var drLabel = getDateRange(currentRange);
  var _numD = currentRange==='custom' && customStart && customEnd ? Math.round((parseLocalDate(customEnd)-parseLocalDate(customStart))/86400000)+1 : 0;
  var bSize = (currentRange === '90d' || (currentRange==='custom' && _numD > 45)) ? 7 : 1;
  var bucketed = bucketDays(days, bSize);
  var labels = bucketed.labels;
  var chartData = bucketed.data;
  var closestMonth = currentMonth || Object.keys(metaData.monthly).sort().reverse()[0];
  var mm = metaData.monthly[closestMonth] || {};
  var ads = (mm.ads||[]).filter(function(a){return a.spend>0;}).sort(function(a,b){return a.cpl-b.cpl;}).slice(0,5);

  // Aggregate gender data across months in range
  var genderAgg = {};
  var dr = getDateRange(currentRange);
  if (dr && metaData.monthly) {
    Object.entries(metaData.monthly).forEach(function(entry) {
      var k = entry[0], v = entry[1];
      var mStart = k + '-01';
      var p = k.split('-').map(Number);
      var mEndD = new Date(p[0], p[1], 0);
      var mEnd = p[0]+'-'+String(p[1]).padStart(2,'0')+'-'+String(mEndD.getDate()).padStart(2,'0');
      if (mStart <= dr.end && mEnd >= dr.start && v.gender) {
        v.gender.forEach(function(g) {
          if (!genderAgg[g.gender]) genderAgg[g.gender] = { gender: g.gender, spend: 0, leads: 0 };
          genderAgg[g.gender].spend += g.spend;
          genderAgg[g.gender].leads += g.leads;
        });
      }
    });
  }
  var genderDataR = Object.values(genderAgg);
  var hasGenderR = genderDataR.length > 0;
  var ageRowColsR = hasGenderR ? 'triple' : '';

  var adsPL = drLabel ? drLabel.label : 'Selected period';
  tab.innerHTML = '<div class="kpi-grid">'+kpi('spend','Ad Spend',fmtC(m.spend),trend(m.spend,pm&&pm.spend))+kpi('leads','Leads Generated',m.leads,trend(m.leads,pm&&pm.leads))+kpi('cpl','Cost Per Lead',fmtC(m.cpl),trend(m.cpl,pm&&pm.cpl,true))+kpi('msg','Conversations Started',m.messages,trend(m.messages,pm&&pm.messages))+kpi('msg','Cost Per Conversation',fmtC(m.costPerMessage),trend(m.costPerMessage,pm&&pm.costPerMessage,true))+kpi('ctr','Unique CTR',fmtP(m.uniqueCtr),trend(m.uniqueCtr,pm&&pm.uniqueCtr))+kpi('impressions','CPM',fmtC(m.cpm),trend(m.cpm,pm&&pm.cpm,true))+kpi('clicks','Link Clicks',fmtN(m.linkClicks||0),trend(m.linkClicks||0,pm&&pm.linkClicks||0))+kpi('cpc','CPC',fmtC(m.cpc||0),trend(m.cpc||0,pm&&pm.cpc||0,true))+kpi('conv','Lead Conv %',fmtP(m.leadConvPct||0),trend(m.leadConvPct||0,pm&&pm.leadConvPct||0))+'</div><div class="chart-row full"><div class="chart-card"><h3>Spend vs Leads</h3><div class="chart-sub">'+adsPL+'</div><div class="chart-container"><canvas id="c-overlay"></canvas></div></div></div><div class="chart-row '+ageRowColsR+'"><div class="chart-card"><h3>Audience by Age</h3><div class="chart-sub">'+adsPL+'</div><div class="chart-container"><canvas id="c-age"></canvas></div></div>'+(hasGenderR?'<div class="chart-card"><h3>Gender Breakdown</h3><div class="chart-sub">'+adsPL+'</div><div class="chart-container"><canvas id="c-gender"></canvas></div></div>':'')+'<div class="chart-card"><h3>Ad Placements</h3><div class="chart-sub">'+adsPL+'</div><div class="chart-container"><canvas id="c-placements"></canvas></div></div></div><div class="chart-row full"><div class="chart-card"><h3>Ad Creative Leaderboard</h3><div class="chart-sub">'+adsPL+'</div><div id="ad-leaderboard-table"></div></div></div>'+LEGEND_ADS;

  var pr2 = (currentRange === '90d' || (currentRange==='custom' && _numD > 45)) ? 4 : 3;
  charts.ov = new Chart(document.getElementById('c-overlay'),{type:'line',data:{labels:labels,datasets:[
    {label:'Spend ($)',data:chartData.map(function(d){return d.spend;}),borderColor:C.beige,fill:false,pointRadius:pr2,pointBackgroundColor:C.beige,tension:0.3,yAxisID:'y',borderDash:[6,4]},
    {label:'Leads',data:chartData.map(function(d){return d.leads;}),borderColor:C.dark,backgroundColor:'rgba(59,59,59,0.06)',fill:true,pointRadius:pr2,pointBackgroundColor:C.dark,tension:0.3,yAxisID:'y1'}
  ]},options:{responsive:true,maintainAspectRatio:false,scales:{y:{position:'left',grid:{color:'#f0ebe3'},ticks:{callback:function(v){return '$'+v;}}},y1:{position:'right',grid:{display:false}}}}});

  var ageDataR = mm.demographics || [];
  if(ageDataR.length) {
    var ageColors = [C.beigeLight, C.accent, C.dark, C.teal, C.coral, C.beige];
    charts.age = new Chart(document.getElementById('c-age'),{type:'pie',data:{
      labels:ageDataR.map(function(a){return (a.age||a.range)+' ('+a.leads+' leads, Budget $'+Math.round(a.spend)+')';}),
      datasets:[{data:ageDataR.map(function(a){return a.leads;}),backgroundColor:ageColors,borderWidth:2,borderColor:'#fff'}]
    },options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'right',labels:{font:{size:11}}}}}});
  }

  var placeDataR = mm.placements || [];
  if(placeDataR.length) {
    var placementColors = [C.dark, C.accent, C.teal, C.coral, C.beige, C.beigeLight];
    charts.place = new Chart(document.getElementById('c-placements'),{type:'doughnut',data:{
      labels:placeDataR.filter(function(p){return p.leads>0;}).map(function(p){return p.name+' ('+p.leads+' leads)';}),
      datasets:[{data:placeDataR.filter(function(p){return p.leads>0;}).map(function(p){return p.leads;}),backgroundColor:placementColors,borderWidth:0,hoverOffset:4}]
    },options:{responsive:true,maintainAspectRatio:false,cutout:'60%',plugins:{legend:{position:'right',labels:{font:{size:11}}}}}});
  }

  if (hasGenderR) {
    var genderColorsR = [C.coral, C.teal, C.beige];
    charts.gender = new Chart(document.getElementById('c-gender'),{type:'pie',data:{
      labels:genderDataR.map(function(g){ var cpl = g.leads > 0 ? fmtC(g.spend/g.leads) : '--'; return g.gender+' ('+g.leads+' leads, CPL '+cpl+')'; }),
      datasets:[{data:genderDataR.map(function(g){return g.leads;}),backgroundColor:genderColorsR,borderWidth:2,borderColor:'#fff'}]
    },options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'right',labels:{font:{size:11}}}}}});
  }

  document.getElementById('ad-leaderboard-table').innerHTML = ads.length ? '<table class="ad-table"><thead><tr><th>#</th><th>Ad Creative</th><th>Spend</th><th>Leads</th><th>CPL</th><th>Unique CTR</th><th>Frequency</th></tr></thead><tbody>'+ads.map(function(a,i){return '<tr><td><div class="ad-rank '+(i===0?'top':'')+'">'+(i+1)+'</div></td><td><div class="ad-name">'+a.adName+'</div><div class="ad-adset">'+a.adSetName+'</div></td><td class="ad-metric">'+fmtC(a.spend)+'</td><td class="ad-metric">'+a.leads+'</td><td class="ad-metric '+(i===0?'best':'')+'">'+fmtC(a.cpl)+'</td><td class="ad-metric">'+fmtP(a.uniqueCtr)+'</td><td class="ad-metric">'+a.frequency.toFixed(2)+'</td></tr>';}).join('')+'</tbody></table>' : '<p style="color:#999;font-size:13px;">No ad data available for this period.</p>';
}

function renderLeads(l,pl,m) {
  if(!l) return;
  var tab=document.getElementById('tab-leads');
  var p2 = currentMonth.split('-').map(Number);
  var monthLabel = new Date(p2[0], p2[1]-1, 1).toLocaleDateString('en-AU',{month:'long',year:'numeric'});
  tab.innerHTML = '<div class="kpi-grid">'+kpi('leads','Total Opportunities',l.totalLeads,trend(l.totalLeads,pl&&pl.totalLeads))+kpi('ctr','Responded %',fmtPw(l.respondedPct),trend(l.respondedPct,pl&&pl.respondedPct))+kpi('cpl','Booked Appointments',l.booked,trend(l.booked,pl&&pl.booked))+kpi('conv','Booking Rate',fmtPw(l.bookedPct),trend(l.bookedPct,pl&&pl.bookedPct))+kpi('revenue','Money Collected',fmtCw(l.moneyCollected),trend(l.moneyCollected,pl&&pl.moneyCollected))+kpi('booked','Confirmed Appointments',l.confirmed,trend(l.confirmed,pl&&pl.confirmed))+kpi('ctr','Cancelled Appointments',l.cancelled,trend(l.cancelled,pl&&pl.cancelled,true))+kpi('ctr','Cancellation Rate',fmtPw(l.cancellationRate||0),trend(l.cancellationRate||0,pl&&pl.cancellationRate||0,true))+kpi('booked','Rebooked Appointments',l.rebooked||0,trend(l.rebooked||0,pl&&pl.rebooked||0))+kpi('conv','Rebooking Rate',fmtPw(l.rebookingRate||0),trend(l.rebookingRate||0,pl&&pl.rebookingRate||0))+'</div><div class="chart-row full" id="call-metrics-section" style="display:none;"><div class="chart-card"><h3>Speed to Lead - Call Response</h3><div class="chart-sub">'+monthLabel+' - Outbound call performance</div><div class="kpi-grid" id="call-metrics-grid"></div></div></div><div class="chart-row"><div class="chart-card"><h3>Lead Status Breakdown</h3><div class="chart-sub">'+monthLabel+'</div><div class="chart-container"><canvas id="c-lead-donut"></canvas></div></div><div class="chart-card"><h3>Opportunities by Day of Week</h3><div class="chart-sub">'+monthLabel+'</div><div class="chart-container"><canvas id="c-lead-trend"></canvas></div></div></div>'+(l.offers&&l.offers.length>0?'<div class="chart-row full"><div class="chart-card"><h3>Offer Comparison</h3><div class="chart-sub">Budget, leads, CPL, and bookings by offer</div><div class="offer-grid">'+l.offers.map(function(o){var metaOffer=(m&&m.offers||[]).find(function(mo){return mo.campaignPattern&&o.name.toUpperCase().includes(mo.campaignPattern);}); var budget=metaOffer?metaOffer.spend:0; return '<div class="offer-card"><h4>'+o.name+'</h4><div class="offer-stat"><span class="label">Budget</span><span class="value">'+fmtC(budget)+'</span></div><div class="offer-stat"><span class="label">Leads</span><span class="value">'+o.leads+'</span></div><div class="offer-stat"><span class="label">CPL</span><span class="value">'+fmtC(o.cpl)+'</span></div><div class="offer-stat"><span class="label">Bookings</span><span class="value">'+o.booked+'</span></div></div>';}).join('')+'</div></div></div>':'')+'<div class="chart-row full"><div class="chart-card"><h3>Recent Leads</h3><div class="chart-sub">Latest lead activity</div><table class="lead-table"><thead><tr><th>Date</th><th>Name</th><th>Offer</th><th>Responded</th><th>Status</th></tr></thead><tbody>'+(l.leads||[]).slice(0,20).map(function(lead){var rc=lead.responded==='Yes'?'yes':lead.responded==='No contact'?'nocontact':'infollowup'; var sc=(lead.status||'').toLowerCase().replace(/\\s/g,''); return '<tr><td>'+fmtDate(lead.date)+'</td><td style="font-weight:600;">'+lead.name+'</td><td>'+lead.offer+'</td><td><span class="status-badge '+rc+'">'+lead.responded+'</span></td><td>'+(lead.status?'<span class="status-badge '+sc+'">'+lead.status+'</span>':'<span style="color:#ccc;">--</span>')+'</td></tr>';}).join('')+'</tbody></table></div></div>'+LEGEND_LEADS;

  var ldTotal=l.confirmed+l.noShow+l.cancelled+l.inFollowUp+l.noContact;
  var ldPct=function(v){return ldTotal?(v/ldTotal*100).toFixed(1):'0.0';};
  charts.ld = new Chart(document.getElementById('c-lead-donut'),{type:'doughnut',data:{
    labels:['Confirmed: '+l.confirmed+' ('+ldPct(l.confirmed)+'%)','No Show: '+l.noShow+' ('+ldPct(l.noShow)+'%)','Cancelled: '+l.cancelled+' ('+ldPct(l.cancelled)+'%)','In Follow Up: '+l.inFollowUp+' ('+ldPct(l.inFollowUp)+'%)','No Contact: '+l.noContact+' ('+ldPct(l.noContact)+'%)'],
    datasets:[{data:[l.confirmed,l.noShow,l.cancelled,l.inFollowUp,l.noContact],backgroundColor:[C.green,C.coral,'#c0392b',C.accent,C.beige],borderWidth:0,hoverOffset:4}]
  },options:{responsive:true,maintainAspectRatio:false,cutout:'60%',plugins:{legend:{position:'right'}}}});

  var allLeads = (l.leads || []);
  var dowCounts = [0,0,0,0,0,0,0];
  allLeads.forEach(function(ld){ if(ld.date){ var d = new Date(ld.date); if(!isNaN(d.getTime())){ dowCounts[d.getDay()]++; }}});
  var dowLabels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  var dowData = [dowCounts[1],dowCounts[2],dowCounts[3],dowCounts[4],dowCounts[5],dowCounts[6],dowCounts[0]];
  charts.lt = new Chart(document.getElementById('c-lead-trend'),{type:'bar',data:{
    labels:dowLabels,
    datasets:[
      {label:'Opportunities',data:dowData,backgroundColor:C.beige,borderRadius:6}
    ]
  },options:{responsive:true,maintainAspectRatio:false,scales:{y:{grid:{color:'#f0ebe3'},ticks:{stepSize:1}},x:{grid:{display:false}}},plugins:{legend:{display:false}}}});

  var cSlug = new URLSearchParams(window.location.search).get('client') || window.__CLIENT_SLUG__ || '';
  fetch('https://lavpnfluvywcjeiyuash.supabase.co/functions/v1/call-metrics?client=' + cSlug)
    .then(function(r) { return r.json(); })
    .then(function(cm) {
      if (!cm || !cm.total_outbound_calls || cm.total_outbound_calls === 0) return;
      var section = document.getElementById('call-metrics-section');
      var grid = document.getElementById('call-metrics-grid');
      if (!grid || !section) return;
      section.style.display = '';
      function fmtTime(s) {
        if (s === null || s === undefined) return '--';
        if (s < 60) return s + 's';
        if (s < 3600) return Math.floor(s/60) + 'm ' + (s%60) + 's';
        var d = Math.floor(s/86400);
        var h = Math.floor((s%86400)/3600);
        var m = Math.floor((s%3600)/60);
        if (d > 0) return d + 'd ' + h + 'h ' + m + 'm';
        return h + 'h ' + m + 'm';
      }

      // Calculate business hours response time from raw calls
      // Business hours: Mon-Sat, clinic opening hours (default 9am-6pm)
      function calcBizHoursSeconds(oppCreated, callStarted) {
        if (!oppCreated || !callStarted) return null;
        var start = new Date(oppCreated);
        var end = new Date(callStarted);
        if (isNaN(start) || isNaN(end) || end <= start) return null;
        var totalBizSec = 0;
        var cursor = new Date(start);
        var OPEN_HOUR = 9;
        var CLOSE_HOUR = 18;
        while (cursor < end) {
          var day = cursor.getDay();
          if (day >= 1 && day <= 6) {
            var dayStart = new Date(cursor); dayStart.setHours(OPEN_HOUR, 0, 0, 0);
            var dayEnd = new Date(cursor); dayEnd.setHours(CLOSE_HOUR, 0, 0, 0);
            var windowStart = cursor > dayStart ? cursor : dayStart;
            var windowEnd = end < dayEnd ? end : dayEnd;
            if (windowStart < windowEnd && windowStart < dayEnd && windowEnd > dayStart) {
              totalBizSec += (windowEnd - windowStart) / 1000;
            }
          }
          cursor = new Date(cursor); cursor.setDate(cursor.getDate() + 1); cursor.setHours(0, 0, 0, 0);
        }
        return Math.round(totalBizSec);
      }
      var bhTimes = [];
      if (cm.raw_calls) {
        cm.raw_calls.forEach(function(c) {
          if (c.is_first_call && c.opportunity_created_at && c.call_started_at) {
            var bh = calcBizHoursSeconds(c.opportunity_created_at, c.call_started_at);
            if (bh !== null) bhTimes.push(bh);
          }
        });
      }
      var avgBH = bhTimes.length > 0 ? Math.round(bhTimes.reduce(function(a,b){return a+b;},0) / bhTimes.length) : null;
      grid.innerHTML =
        kpi('booked', 'Contacts Called', cm.unique_contacts_called, '') +
        kpi('leads', 'Total Outbound Calls', cm.total_outbound_calls, '') +
        kpi('conv', 'Called Within 10 Min', cm.called_within_10_min_pct + '%', '') +
        kpi('responded', 'Answered', (cm.status_breakdown && cm.status_breakdown.completed) || 0, '') +
        kpi('cpl', 'No Answer', (cm.status_breakdown && cm.status_breakdown['no-answer']) || 0, '') +
        kpi('conv', 'Answer Rate', cm.total_outbound_calls > 0 ? Math.round(((cm.status_breakdown && cm.status_breakdown.completed) || 0) / cm.total_outbound_calls * 100) + '%' : '--', '') +
        kpi('ctr', 'Voicemail', (cm.status_breakdown && cm.status_breakdown.voicemail) || 0, '') +
        kpi('ctr', 'Avg Time to First Call', fmtTime(cm.avg_time_to_first_call_seconds), '') +
        kpi('ctr', 'Avg Response (Business Hrs)', fmtTime(avgBH), '');
    })
    .catch(function(err) {});
}

function renderLeadsRange(l,pl,leads,days) {
  var tab=document.getElementById('tab-leads');

  var closestMonth = currentMonth || Object.keys(metaData.monthly).sort().reverse()[0];
  var mm = metaData.monthly[closestMonth];
  var offerMap = {};
  leads.forEach(function(ld) {
    var o = ld.offer || 'Unknown';
    if (!offerMap[o]) offerMap[o] = { name: o, leads: 0, booked: 0 };
    offerMap[o].leads++;
    var s = (ld.status || '').toLowerCase();
    if (s.includes('successful') || s === 'confirmed' || s.includes('booked') || s.includes('cancelled') || s.includes('no show')) offerMap[o].booked++;
  });
  var offerCards = Object.values(offerMap).filter(function(o){return o.name.toUpperCase().includes('OFFER');}).map(function(o) {
    var metaOffer = (mm&&mm.offers||[]).find(function(mo){return mo.campaignPattern && o.name.toUpperCase().includes(mo.campaignPattern);});
    var budget = metaOffer ? metaOffer.spend : 0;
    var cpl = o.leads > 0 && budget > 0 ? budget / o.leads : 0;
    return '<div class="offer-card"><h4>'+o.name+'</h4><div class="offer-stat"><span class="label">Budget</span><span class="value">'+fmtC(budget)+'</span></div><div class="offer-stat"><span class="label">Leads</span><span class="value">'+o.leads+'</span></div><div class="offer-stat"><span class="label">CPL</span><span class="value">'+(cpl>0?fmtC(cpl):'--')+'</span></div><div class="offer-stat"><span class="label">Bookings</span><span class="value">'+o.booked+'</span></div></div>';
  }).join('');

  var drLabel = getDateRange(currentRange);
  var periodLabel = drLabel ? drLabel.label : 'Selected period';
  tab.innerHTML = '<div class="kpi-grid">'+kpi('leads','Total Opportunities',l.totalLeads,trend(l.totalLeads,pl&&pl.totalLeads))+kpi('ctr','Responded %',fmtPw(l.respondedPct),trend(l.respondedPct,pl&&pl.respondedPct))+kpi('cpl','Booked Appointments',l.booked,trend(l.booked,pl&&pl.booked))+kpi('conv','Booking Rate',fmtPw(l.bookedPct),trend(l.bookedPct,pl&&pl.bookedPct))+kpi('revenue','Money Collected',fmtCw(l.moneyCollected),trend(l.moneyCollected,pl&&pl.moneyCollected))+kpi('booked','Confirmed Appointments',l.confirmed,trend(l.confirmed,pl&&pl.confirmed))+kpi('ctr','Cancelled Appointments',l.cancelled,trend(l.cancelled,pl&&pl.cancelled,true))+kpi('ctr','Cancellation Rate',fmtPw(l.cancellationRate||0),trend(l.cancellationRate||0,pl&&pl.cancellationRate||0,true))+kpi('booked','Rebooked Appointments',l.rebooked||0,trend(l.rebooked||0,pl&&pl.rebooked||0))+kpi('conv','Rebooking Rate',fmtPw(l.rebookingRate||0),trend(l.rebookingRate||0,pl&&pl.rebookingRate||0))+'</div><div class="chart-row full" id="call-metrics-section" style="display:none;"><div class="chart-card"><h3>Speed to Lead - Call Response</h3><div class="chart-sub">'+periodLabel+' - Outbound call performance</div><div class="kpi-grid" id="call-metrics-grid"></div></div></div><div class="chart-row"><div class="chart-card"><h3>Lead Status Breakdown</h3><div class="chart-sub">'+periodLabel+'</div><div class="chart-container"><canvas id="c-lead-donut"></canvas></div></div><div class="chart-card"><h3>Opportunities by Day of Week</h3><div class="chart-sub">'+periodLabel+'</div><div class="chart-container"><canvas id="c-lead-trend"></canvas></div></div></div>'+(offerCards?'<div class="chart-row full"><div class="chart-card"><h3>Offer Comparison</h3><div class="chart-sub">Budget, leads, CPL, and bookings by offer</div><div class="offer-grid">'+offerCards+'</div></div></div>':'')+'<div class="chart-row full"><div class="chart-card"><h3>Leads in Period</h3><div class="chart-sub">'+leads.length+' leads found</div><table class="lead-table"><thead><tr><th>Date</th><th>Name</th><th>Offer</th><th>Responded</th><th>Status</th></tr></thead><tbody>'+leads.slice().reverse().slice(0,10).map(function(lead){var rc=(lead.responded||'').toLowerCase()==='yes'?'yes':(lead.responded||'').toLowerCase()==='no contact'?'nocontact':'infollowup'; var sc=(lead.status||'').toLowerCase().replace(/\\s/g,''); return '<tr><td>'+fmtDate(lead.date)+'</td><td style="font-weight:600;">'+lead.name+'</td><td>'+lead.offer+'</td><td><span class="status-badge '+rc+'">'+lead.responded+'</span></td><td>'+(lead.status?'<span class="status-badge '+sc+'">'+lead.status+'</span>':'<span style="color:#ccc;">--</span>')+'</td></tr>';}).join('')+'</tbody></table></div></div>'+LEGEND_LEADS;

  var ldTotal = l.responded + l.noContact + l.inFollowUp;
  var ldPct = function(v){return ldTotal?(v/ldTotal*100).toFixed(1):'0.0';};
  if (ldTotal > 0) {
    charts.ld = new Chart(document.getElementById('c-lead-donut'),{type:'doughnut',data:{
      labels:['Responded: '+l.responded+' ('+ldPct(l.responded)+'%)','No Contact: '+l.noContact+' ('+ldPct(l.noContact)+'%)','In Follow Up: '+l.inFollowUp+' ('+ldPct(l.inFollowUp)+'%)'],
      datasets:[{data:[l.responded,l.noContact,l.inFollowUp],backgroundColor:[C.dark,C.beige,C.accent],borderWidth:0,hoverOffset:4}]
    },options:{responsive:true,maintainAspectRatio:false,cutout:'60%',plugins:{legend:{position:'right'}}}});
  }

  var dowCountsR = [0,0,0,0,0,0,0];
  leads.forEach(function(ld){ if(ld.date){ var d = new Date(ld.date); if(!isNaN(d.getTime())){ dowCountsR[d.getDay()]++; }}});
  var dowLabelsR = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  var dowDataR = [dowCountsR[1],dowCountsR[2],dowCountsR[3],dowCountsR[4],dowCountsR[5],dowCountsR[6],dowCountsR[0]];
  charts.lt = new Chart(document.getElementById('c-lead-trend'),{type:'bar',data:{
    labels:dowLabelsR,
    datasets:[
      {label:'Opportunities',data:dowDataR,backgroundColor:C.beige,borderRadius:6}
    ]
  },options:{responsive:true,maintainAspectRatio:false,scales:{y:{grid:{color:'#f0ebe3'},ticks:{stepSize:1}},x:{grid:{display:false}}},plugins:{legend:{display:false}}}});

  var cSlugR = new URLSearchParams(window.location.search).get('client') || window.__CLIENT_SLUG__ || '';
  fetch('https://lavpnfluvywcjeiyuash.supabase.co/functions/v1/call-metrics?client=' + cSlugR)
    .then(function(r) { return r.json(); })
    .then(function(cm) {
      if (!cm || !cm.total_outbound_calls || cm.total_outbound_calls === 0) return;
      var section = document.getElementById('call-metrics-section');
      var grid = document.getElementById('call-metrics-grid');
      if (!grid || !section) return;
      section.style.display = '';
      function fmtTime(s) {
        if (s === null || s === undefined) return '--';
        if (s < 60) return s + 's';
        if (s < 3600) return Math.floor(s/60) + 'm ' + (s%60) + 's';
        var d = Math.floor(s/86400);
        var h = Math.floor((s%86400)/3600);
        var m = Math.floor((s%3600)/60);
        if (d > 0) return d + 'd ' + h + 'h ' + m + 'm';
        return h + 'h ' + m + 'm';
      }

      // Calculate business hours response time from raw calls
      // Business hours: Mon-Sat, clinic opening hours (default 9am-6pm)
      function calcBizHoursSeconds(oppCreated, callStarted) {
        if (!oppCreated || !callStarted) return null;
        var start = new Date(oppCreated);
        var end = new Date(callStarted);
        if (isNaN(start) || isNaN(end) || end <= start) return null;
        var totalBizSec = 0;
        var cursor = new Date(start);
        var OPEN_HOUR = 9;
        var CLOSE_HOUR = 18;
        while (cursor < end) {
          var day = cursor.getDay();
          if (day >= 1 && day <= 6) {
            var dayStart = new Date(cursor); dayStart.setHours(OPEN_HOUR, 0, 0, 0);
            var dayEnd = new Date(cursor); dayEnd.setHours(CLOSE_HOUR, 0, 0, 0);
            var windowStart = cursor > dayStart ? cursor : dayStart;
            var windowEnd = end < dayEnd ? end : dayEnd;
            if (windowStart < windowEnd && windowStart < dayEnd && windowEnd > dayStart) {
              totalBizSec += (windowEnd - windowStart) / 1000;
            }
          }
          cursor = new Date(cursor); cursor.setDate(cursor.getDate() + 1); cursor.setHours(0, 0, 0, 0);
        }
        return Math.round(totalBizSec);
      }
      var bhTimes = [];
      if (cm.raw_calls) {
        cm.raw_calls.forEach(function(c) {
          if (c.is_first_call && c.opportunity_created_at && c.call_started_at) {
            var bh = calcBizHoursSeconds(c.opportunity_created_at, c.call_started_at);
            if (bh !== null) bhTimes.push(bh);
          }
        });
      }
      var avgBH = bhTimes.length > 0 ? Math.round(bhTimes.reduce(function(a,b){return a+b;},0) / bhTimes.length) : null;
      grid.innerHTML =
        kpi('booked', 'Contacts Called', cm.unique_contacts_called, '') +
        kpi('leads', 'Total Outbound Calls', cm.total_outbound_calls, '') +
        kpi('conv', 'Called Within 10 Min', cm.called_within_10_min_pct + '%', '') +
        kpi('responded', 'Answered', (cm.status_breakdown && cm.status_breakdown.completed) || 0, '') +
        kpi('cpl', 'No Answer', (cm.status_breakdown && cm.status_breakdown['no-answer']) || 0, '') +
        kpi('conv', 'Answer Rate', cm.total_outbound_calls > 0 ? Math.round(((cm.status_breakdown && cm.status_breakdown.completed) || 0) / cm.total_outbound_calls * 100) + '%' : '--', '') +
        kpi('ctr', 'Voicemail', (cm.status_breakdown && cm.status_breakdown.voicemail) || 0, '') +
        kpi('ctr', 'Avg Time to First Call', fmtTime(cm.avg_time_to_first_call_seconds), '') +
        kpi('ctr', 'Avg Response (Business Hrs)', fmtTime(avgBH), '');
    })
    .catch(function(err) {});
}

function getLTV() {
  return metaData && metaData.ltv ? metaData.ltv : null;
}

function getAgencyFee(monthKey) {
  if (!metaData || !metaData.agencyFees) return 0;
  return metaData.agencyFees[monthKey] || 0;
}

function roiKpi(label, value) {
  return '<div class="kpi-card"><div class="kpi-label">'+label+'</div><div class="kpi-value">'+value+'</div></div>';
}

function renderROIContent(tab, m, l, pm, pl, numMonths) {
  var agencyFee = 0;
  if (currentRange === 'monthly') {
    agencyFee = getAgencyFee(currentMonth);
  } else {
    var dr = getDateRange(currentRange);
    if (dr && metaData.agencyFees) {
      Object.keys(metaData.agencyFees).forEach(function(mk) {
        var mStart = mk + '-01';
        var p = mk.split('-').map(Number);
        var mEndD = new Date(p[0], p[1], 0);
        var mEnd = p[0]+'-'+String(p[1]).padStart(2,'0')+'-'+String(mEndD.getDate()).padStart(2,'0');
        if (mStart <= dr.end && mEnd >= dr.start) {
          agencyFee += metaData.agencyFees[mk];
        }
      });
    }
  }
  var adSpend = m&&m.spend || 0;
  var bookings = l&&l.booked || 0;
  var moneyCollected = l&&l.moneyCollected || 0;
  var totalCost = adSpend + agencyFee;
  var clientLTV = getLTV();
  var hasLTV = clientLTV !== null;
  var ltvRevenue = hasLTV ? bookings * clientLTV : 0;
  var trueROI = hasLTV && totalCost > 0 ? (ltvRevenue / totalCost * 100) : 0;
  var roi = totalCost > 0 ? (moneyCollected / totalCost * 100) : 0;
  var roiColor = roi >= 100 ? 'var(--green)' : roi >= 50 ? 'var(--accent)' : 'var(--coral)';
  var trueRoiColor = hasLTV ? (trueROI >= 100 ? 'var(--green)' : trueROI >= 50 ? 'var(--accent)' : 'var(--coral)') : '#999';

  var ltvRevenueDisplay = hasLTV ? fmtCw(ltvRevenue) : 'TBA';
  var trueROIDisplay = hasLTV ? trueROI.toFixed(1)+'%' : 'TBA';
  var ltvDescription = metaData.ltvDescription || (hasLTV ? 'Currently estimated at ~$'+clientLTV+' per client.' : 'The average revenue generated per client, calculated by dividing total revenue by the total number of clients.');
  var trueROISub = hasLTV ? 'Based on bookings x LTV ($'+clientLTV+')' : 'LTV not yet determined';

  tab.innerHTML = '<div class="kpi-grid">'+roiKpi('Agency Fee',fmtCw(agencyFee))+roiKpi('Ad Spend',fmtC(adSpend))+roiKpi('Total Cost',fmtC(totalCost))+roiKpi('Bookings',bookings)+roiKpi('Money Collected',fmtCw(moneyCollected))+roiKpi('LTV Revenue',ltvRevenueDisplay)+'</div><div class="chart-row"><div class="chart-card"><h3>Return on Investment</h3><div class="chart-sub">Based on actual money collected</div><div style="text-align:center;padding:30px 0;"><div style="font-size:48px;font-weight:700;color:'+roiColor+';">'+roi.toFixed(1)+'%</div><div style="font-size:14px;color:#999;margin-top:8px;">ROI</div></div></div><div class="chart-card"><h3>TRUE ROI (Projected)</h3><div class="chart-sub">'+trueROISub+'</div><div style="text-align:center;padding:30px 0;"><div style="font-size:48px;font-weight:700;color:'+trueRoiColor+';">'+trueROIDisplay+'</div><div style="font-size:14px;color:#999;margin-top:8px;">TRUE ROI</div></div></div></div><div class="chart-row full"><div class="chart-card"><h3>ROI Breakdown</h3><div class="chart-sub">Cost vs revenue comparison</div><div class="chart-container"><canvas id="c-roi-bar"></canvas></div></div></div><div class="chart-row full"><div class="chart-card" style="background:var(--beige-light);"><h3 style="margin-bottom:16px;">Metric Definitions</h3><div style="display:grid;gap:12px;font-size:13px;line-height:1.6;"><div><strong>Agency Fee:</strong> The monthly retainer paid to Media Waffle for management and strategy.</div><div><strong>Ad Spend:</strong> Total amount spent on Meta (Facebook/Instagram) advertising for the period.</div><div><strong>Total Cost:</strong> The combined investment: Ad Spend + Agency Fee. This is the total outlay for the period.</div><div><strong>Bookings:</strong> Number of confirmed appointments.</div><div><strong>Money Collected:</strong> Revenue generated from all confirmed appointments that came from leads during this period.</div><div><strong>LTV (Lifetime Value):</strong> '+ltvDescription+'</div><div><strong>LTV Revenue:</strong> Projected total revenue: Bookings x LTV. Represents the expected long-term value of bookings made this period.</div><div><strong>ROI (Return on Investment):</strong> Money Collected / Total Cost x 100. Shows actual return based on cash already received. Below 100% means you have not recouped costs yet from collected revenue alone.</div><div><strong>TRUE ROI:</strong> LTV Revenue / Total Cost x 100. Shows projected return when accounting for the full lifetime value of each booking. This is the more accurate measure of campaign profitability.</div></div></div></div>';

  var barLabels = hasLTV ? ['Agency Fee','Ad Spend','Total Cost','Money Collected','LTV Revenue'] : ['Agency Fee','Ad Spend','Total Cost','Money Collected'];
  var barData = hasLTV ? [agencyFee, adSpend, totalCost, moneyCollected, ltvRevenue] : [agencyFee, adSpend, totalCost, moneyCollected];
  var barColors = hasLTV ? [C.accent, C.beige, C.coral, '#6ba378', '#35d45a'] : [C.accent, C.beige, C.coral, '#6ba378'];

  charts.roiBar = new Chart(document.getElementById('c-roi-bar'),{type:'bar',data:{
    labels:barLabels,
    datasets:[{
      data:barData,
      backgroundColor:barColors,
      borderRadius:6
    }]
  },options:{responsive:true,maintainAspectRatio:false,indexAxis:'y',plugins:{legend:{display:false},tooltip:{callbacks:{label:function(ctx){return fmtC(ctx.raw);}}}},scales:{x:{grid:{color:'#f0ebe3'},ticks:{callback:function(v){return '$'+v.toLocaleString();}}},y:{grid:{display:false}}}}});
}

function renderROI(m, l, pm, pl) {
  renderROIContent(document.getElementById('tab-roi'), m, l, pm, pl, 1);
}

function renderROIRange(m, l, pm, pl) {
  var numMonths = 1;
  var dr = getDateRange(currentRange);
  if (dr) {
    var days = Math.round((parseLocalDate(dr.end) - parseLocalDate(dr.start)) / 86400000) + 1;
    numMonths = Math.max(1, Math.round(days / 30));
  }
  renderROIContent(document.getElementById('tab-roi'), m, l, pm, pl, numMonths);
}

async function exportPDF() {
  var btn=document.querySelector('.export-btn'); btn.textContent='Generating...'; btn.disabled=true;
  try {
    var c=document.getElementById('dashboard-content');
    var canvas=await html2canvas(c,{scale:2,backgroundColor:'#f5f0e8',useCORS:true});
    var jsPDF2=window.jspdf; var pdf=new jsPDF2.jsPDF('l','mm','a4');
    var w=pdf.internal.pageSize.getWidth(), h=(canvas.height*w)/canvas.width;
    var left=h, pos=0; var pH=pdf.internal.pageSize.getHeight();
    pdf.addImage(canvas.toDataURL('image/jpeg',0.95),'JPEG',0,pos,w,h);
    left-=pH; while(left>0){pos=-(h-left);pdf.addPage();pdf.addImage(canvas.toDataURL('image/jpeg',0.95),'JPEG',0,pos,w,h);left-=pH;}
    var rangeLabel = currentRange==='monthly' ? currentMonth : currentRange==='custom' ? customStart+' to '+customEnd : currentRange.toUpperCase();
    pdf.save(metaData.client+' - '+rangeLabel+'.pdf');
  } catch(e){alert('PDF export failed.');}
  btn.innerHTML='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Export PDF';
  btn.disabled=false;
}

loadData();
document.addEventListener('click', function(e) {
  var wrap = document.querySelector('.custom-range-wrap');
  if (wrap && !wrap.contains(e.target)) document.getElementById('custom-range-popup').classList.remove('open');
});
})();
`;

export default function ClientDashboard() {
  const scriptInjected = useRef(false);
  const appData = useRouteLoaderData("routes/_app") as { profile?: { client_slug?: string } } | undefined;

  useEffect(() => {
    if (scriptInjected.current) return;
    scriptInjected.current = true;
    // Inject client slug for profile-based routing
    if (appData?.profile?.client_slug) {
      (window as any).__CLIENT_SLUG__ = appData.profile.client_slug;
    }
    // Wait for Chart.js to load
    const waitForChart = setInterval(() => {
      if (typeof (window as any).Chart !== 'undefined') {
        clearInterval(waitForChart);
        const script = document.createElement('script');
        script.textContent = DASHBOARD_SCRIPT;
        document.body.appendChild(script);
      }
    }, 100);
    return () => clearInterval(waitForChart);
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: CSS}} />
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-text">Media Waffle</div>
          <div className="logo-sub">Client Dashboard</div>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-label">Reporting</div>
          <div className="nav-item active" onClick={(e) => (window as any)._dashboardSwitchTab?.('overview', e.currentTarget)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
            Overview
          </div>
          <div className="nav-item" onClick={(e) => (window as any)._dashboardSwitchTab?.('ads', e.currentTarget)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>
            Ad Performance
          </div>
          <div className="nav-item" onClick={(e) => (window as any)._dashboardSwitchTab?.('leads', e.currentTarget)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Lead Data
          </div>
          <div className="nav-item" onClick={(e) => (window as any)._dashboardSwitchTab?.('roi', e.currentTarget)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            ROI
          </div>
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-client" id="sidebar-client">Loading...</div>
          <div className="sidebar-updated" id="sidebar-updated">Last updated: --</div>
        </div>
      </aside>

      <div className="main">
        <div className="mobile-tabs" id="mobile-tabs">
          <button className="mobile-tab active" onClick={(e) => { (window as any)._dashboardSwitchTab?.('overview', document.querySelector('.nav-item:nth-child(2)')); (window as any)._dashboardSetMobileTab?.(e.currentTarget); }}>Overview</button>
          <button className="mobile-tab" onClick={(e) => { (window as any)._dashboardSwitchTab?.('ads', document.querySelector('.nav-item:nth-child(3)')); (window as any)._dashboardSetMobileTab?.(e.currentTarget); }}>Ads</button>
          <button className="mobile-tab" onClick={(e) => { (window as any)._dashboardSwitchTab?.('leads', document.querySelector('.nav-item:nth-child(4)')); (window as any)._dashboardSetMobileTab?.(e.currentTarget); }}>Leads</button>
          <button className="mobile-tab" onClick={(e) => { (window as any)._dashboardSwitchTab?.('roi', document.querySelector('.nav-item:nth-child(5)')); (window as any)._dashboardSetMobileTab?.(e.currentTarget); }}>ROI</button>
        </div>
        <div className="topbar">
          <div className="topbar-left">
            <h1 id="client-name">Loading...</h1>
            <p id="range-subtitle">Performance Dashboard</p>
          </div>
          <div className="topbar-right">
            <div className="month-selector" id="month-selector-wrap">
              <button className="month-nav-btn" id="month-prev" onClick={() => (window as any)._dashboardNavMonth?.(-1)}>&#8592;</button>
              <select id="month-selector" onChange={() => (window as any)._dashboardChangeMonth?.()}></select>
              <button className="month-nav-btn" id="month-next" onClick={() => (window as any)._dashboardNavMonth?.(1)}>&#8594;</button>
            </div>
            <span id="range-date-label" style={{fontSize:'12px',color:'#8a8478',marginRight:'10px',display:'none'}}></span>
            <div className="date-selector">
              <button className="date-btn" onClick={(e) => (window as any)._dashboardSetRange?.('90d', e.currentTarget)}>90D</button>
              <button className="date-btn active" onClick={(e) => (window as any)._dashboardSetRange?.('monthly', e.currentTarget)}>Monthly</button>
              <div className="custom-range-wrap">
                <button className="date-btn" id="custom-range-btn" onClick={(e) => (window as any)._dashboardToggleCustomRange?.(e.currentTarget)}>Custom</button>
                <div className="custom-range-popup" id="custom-range-popup">
                  <label>From</label>
                  <input type="date" id="custom-start" />
                  <label>To</label>
                  <input type="date" id="custom-end" />
                  <button className="apply-btn" onClick={() => (window as any)._dashboardApplyCustomRange?.()}>Apply</button>
                </div>
              </div>
            </div>
            <button className="export-btn" onClick={() => (window as any)._dashboardExportPDF?.()}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Export PDF
            </button>
          </div>
        </div>

        <div className="content" id="dashboard-content">
          <div className="tab-content active" id="tab-overview"></div>
          <div className="tab-content" id="tab-ads"></div>
          <div className="tab-content" id="tab-leads"></div>
          <div className="tab-content" id="tab-roi"></div>
        </div>
      </div>
    </>
  );
}
