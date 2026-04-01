import{w as b,a as u,r as f,d as m,N as s,O as y}from"./chunk-EPOLDU6W-Dso2WXXj.js";import{j as e}from"./jsx-runtime-u17CrQMm.js";function M({formAction:o}){return!!o}const j=`
.hub-wrap { display: flex; min-height: 100vh; font-family: 'Montserrat', sans-serif; background: #f5f0e8; }
.hub-sidebar {
  width: 240px; background: #fff; border-right: 1px solid #ddd5c4;
  position: fixed; top: 0; left: 0; bottom: 0;
  display: flex; flex-direction: column; z-index: 40;
  transition: transform 0.25s ease;
}
.hub-overlay { display: none; }
.hub-hamburger { display: none; }
.hub-close-btn { display: none; }
.hub-main { margin-left: 240px; flex: 1; min-height: 100vh; padding: 32px; overflow-y: auto; }

@media (max-width: 768px) {
  .hub-sidebar {
    transform: translateX(-100%);
    width: 280px;
    box-shadow: 4px 0 24px rgba(0,0,0,0.15);
  }
  .hub-sidebar.open { transform: translateX(0); }
  .hub-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 35; }
  .hub-overlay.open { display: block; }
  .hub-close-btn { display: block; }
  .hub-hamburger {
    display: flex; align-items: center; justify-content: center;
    position: fixed; top: 12px; right: 12px; z-index: 50;
    width: 40px; height: 40px; border-radius: 8px;
    background: #fff; border: 1px solid #ddd5c4; cursor: pointer;
    box-shadow: 0 1px 4px rgba(0,0,0,0.08);
  }
  .hub-main { margin-left: 0; padding: 16px; padding-top: 16px; }
}

/* Responsive tables */
.hub-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
@media (max-width: 768px) {
  .hub-table-wrap table { min-width: 640px; }
}

/* Responsive grids */
.hub-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.hub-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
.hub-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.hub-grid-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
@media (max-width: 768px) {
  .hub-grid-2, .hub-grid-3, .hub-grid-4 { grid-template-columns: 1fr; }
  .hub-grid-cards { grid-template-columns: 1fr; }
}
@media (min-width: 769px) and (max-width: 1024px) {
  .hub-grid-4 { grid-template-columns: repeat(2, 1fr); }
}

/* Responsive form rows */
.hub-form-row { display: flex; gap: 8px; align-items: flex-end; }
@media (max-width: 768px) {
  .hub-form-row { flex-direction: column; align-items: stretch; }
  .hub-form-row input, .hub-form-row button { width: 100%; }
}

/* Responsive action buttons */
.hub-actions { display: flex; gap: 8px; flex-shrink: 0; }
@media (max-width: 768px) {
  .hub-card-layout { flex-direction: column !important; }
  .hub-actions { margin-top: 12px; }
}

/* Responsive page header */
.hub-page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
@media (max-width: 480px) {
  .hub-page-header { flex-direction: column; align-items: flex-start; gap: 12px; }
}

/* Escalation resolve row */
.hub-resolve-row { display: flex; gap: 8px; align-items: flex-end; }
@media (max-width: 768px) {
  .hub-resolve-row { flex-direction: column; align-items: stretch; }
}
`,S=b(function(){const{isAdmin:l,clients:c}=u(),[h,d]=f.useState(!1),g=m();return f.useEffect(()=>{d(!1)},[g.pathname]),e.jsxs(e.Fragment,{children:[e.jsx("style",{dangerouslySetInnerHTML:{__html:j}}),e.jsxs("div",{className:"hub-wrap",children:[e.jsx("button",{className:"hub-hamburger",onClick:()=>d(!0),"aria-label":"Menu",children:e.jsxs("svg",{width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",stroke:"#3b3b3b",strokeWidth:"2",strokeLinecap:"round",children:[e.jsx("line",{x1:"3",y1:"6",x2:"21",y2:"6"}),e.jsx("line",{x1:"3",y1:"12",x2:"21",y2:"12"}),e.jsx("line",{x1:"3",y1:"18",x2:"21",y2:"18"})]})}),e.jsx("div",{className:`hub-overlay ${h?"open":""}`,onClick:()=>d(!1)}),e.jsxs("nav",{className:`hub-sidebar ${h?"open":""}`,children:[e.jsxs("div",{style:{padding:"24px 24px 20px",borderBottom:"1px solid #ddd5c4",display:"flex",justifyContent:"space-between",alignItems:"flex-start"},children:[e.jsxs("div",{children:[e.jsx("div",{style:{fontWeight:700,fontSize:15,letterSpacing:2.5,textTransform:"uppercase",color:"#3b3b3b"},children:"Media Waffle"}),e.jsx("div",{style:{fontSize:10,fontWeight:500,letterSpacing:1.5,textTransform:"uppercase",color:"#c4a882",marginTop:4},children:"AI Messaging Hub"})]}),e.jsx("button",{className:"hub-close-btn",onClick:()=>d(!1),"aria-label":"Close menu",style:{background:"none",border:"none",cursor:"pointer",padding:4},children:e.jsxs("svg",{width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",stroke:"#3b3b3b",strokeWidth:"2",strokeLinecap:"round",children:[e.jsx("line",{x1:"18",y1:"6",x2:"6",y2:"18"}),e.jsx("line",{x1:"6",y1:"6",x2:"18",y2:"18"})]})})]}),e.jsxs("div",{style:{padding:"16px 12px",flex:1,overflowY:"auto"},children:[e.jsx("div",{style:p,children:"Admin"}),l&&e.jsxs(e.Fragment,{children:[e.jsxs(s,{prefetch:"intent",to:"/hub/admin/clients",style:({isActive:i})=>a(i),children:[e.jsx(r,{d:"M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zm14 10v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"}),"All Clients"]}),e.jsxs(s,{prefetch:"intent",to:"/hub/admin/onboarding",style:({isActive:i})=>a(i),children:[e.jsx(r,{d:"M12 5v14m-7-7h14"}),"New Client"]})]}),e.jsx("div",{style:{...p,marginTop:16},children:"Select Client"}),e.jsx("div",{style:{padding:"0 4px",marginBottom:8},children:e.jsxs("select",{style:{width:"100%",padding:"8px 10px",border:"1px solid #ddd5c4",borderRadius:6,fontSize:12,fontFamily:"'Montserrat', sans-serif",background:"#faf8f5",color:"#3b3b3b",cursor:"pointer"},value:(()=>{const i=typeof window<"u"?window.location.pathname:"";return c.find(t=>t.msg_clients&&i.startsWith(`/hub/${t.msg_clients.slug}`))?.msg_clients?.slug||""})(),onChange:i=>{i.target.value&&(window.location.href=`/hub/${i.target.value}/brand`)},children:[e.jsx("option",{value:"",children:"-- Select client --"}),c.map(i=>{const n=i.msg_clients;return n?e.jsx("option",{value:n.slug,children:n.name},n.id):null})]})}),(()=>{const i=c.find(t=>{const x=t.msg_clients;return x?(typeof window<"u"?window.location.pathname:"").startsWith(`/hub/${x.slug}`):!1});if(!i)return null;const n=i.msg_clients;return e.jsxs(e.Fragment,{children:[e.jsx("div",{style:{...p,marginTop:16},children:n.name}),e.jsxs(s,{prefetch:"render",to:`/hub/${n.slug}/brand`,style:({isActive:t})=>a(t),children:[e.jsx(r,{d:"M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 3a4 4 0 100 8 4 4 0 000-8z"}),"Brand Identity"]}),e.jsxs(s,{prefetch:"render",to:`/hub/${n.slug}/settings`,style:({isActive:t})=>a(t),children:[e.jsx(r,{d:"M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"}),"Settings"]}),e.jsxs(s,{prefetch:"render",to:`/hub/${n.slug}/locations`,style:({isActive:t})=>a(t),children:[e.jsx(r,{d:"M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"}),"Locations"]}),e.jsxs(s,{prefetch:"render",to:`/hub/${n.slug}/offers`,style:({isActive:t})=>a(t),children:[e.jsx(r,{text:"$"}),"Offers & Services"]}),e.jsxs(s,{prefetch:"render",to:`/hub/${n.slug}/training`,style:({isActive:t})=>a(t),children:[e.jsx(r,{d:"M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3"}),"AI Training"]}),e.jsxs(s,{prefetch:"render",to:`/hub/${n.slug}/conversations`,style:({isActive:t})=>a(t),children:[e.jsx(r,{d:"M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"}),"Conversations"]}),e.jsxs(s,{prefetch:"render",to:`/hub/${n.slug}/escalations`,style:({isActive:t})=>a(t),children:[e.jsx(r,{d:"M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"}),"Escalations"]}),e.jsxs(s,{prefetch:"render",to:`/hub/${n.slug}/faqs`,style:({isActive:t})=>a(t),children:[e.jsx(r,{text:"?"}),"FAQs"]})]})})()]}),e.jsx("div",{style:{padding:"16px 16px",borderTop:"1px solid #ddd5c4"},children:e.jsx("div",{style:{fontSize:10,color:"#bbb",fontWeight:500},children:"Powered by Media Waffle"})})]}),e.jsx("main",{className:"hub-main",children:e.jsx(y,{context:{allClientData:u().allClientData}})})]})]})});function r({d:o,text:l}){return l?e.jsx("span",{style:{width:18,height:18,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:16,fontWeight:400,fontFamily:"'Montserrat', sans-serif"},children:l}):e.jsx("svg",{width:"18",height:"18",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",style:{flexShrink:0},children:e.jsx("path",{d:o})})}const p={fontSize:10,fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:"#aaa",padding:"16px 12px 6px"};function a(o){return{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",borderRadius:8,fontSize:14,fontWeight:500,color:o?"white":"#5a5a5a",background:o?"#3b3b3b":"transparent",textDecoration:"none",cursor:"pointer",transition:"all 0.2s",marginBottom:2}}export{S as default,M as shouldRevalidate};
