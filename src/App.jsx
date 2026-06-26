import { useState, useEffect, useRef } from "react";
import { supabase } from "./lib/supabaseClient";
import { fetchProfileByAuthUserId, fetchAsesores, fetchLeads, fetchUnits, insertLead, insertAsesor, updateAsesor, setAsesorActivo, swapTurnos, updateOwnProfile, fetchTowers, fetchMarketingSpend, upsertMarketingSpend, fetchProjectConfig, upsertProjectConfig, fetchGoals, insertGoal, updateGoal, deleteGoal, setAsesorCanBlockUnits, updateUnit, insertUnit, deleteUnit, updateTower, insertTower, blockUnit, unblockUnit, reassignLeadAsesor, updateLeadStage } from "./lib/data";

const AV = {
  obsidian:"#0d1117",deep:"#111820",surface:"#161e27",card:"#1a2330",
  border:"#1f2d3d",borderLight:"#243446",
  teal:"#2dd4bf",tealDim:"#1a8a7a",tealGlow:"rgba(45,212,191,0.12)",
  green:"#4ade80",greenDim:"#166534",amber:"#fbbf24",rose:"#fb7185",
  slate:"#94a3b8",muted:"#4a5e74",text:"#e2e8f0",textDim:"#7a95b0",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  :root{--fs-meta:14px;--fs-body:16px;}
  body{background:#0d1117;color:#e2e8f0;font-family:'DM Sans',sans-serif;font-size:var(--fs-meta);line-height:1.6;}
  .crm-root{display:flex;height:100vh;overflow:hidden;}
  .sidebar{width:220px;min-width:220px;background:#111820;border-right:1px solid #1f2d3d;display:flex;flex-direction:column;z-index:10;}
  .sidebar-logo{padding:24px 20px 20px;border-bottom:1px solid #1f2d3d;}
  .logo-name{font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:500;color:#e2e8f0;letter-spacing:.02em;}
  .logo-sub{font-size:var(--fs-meta);color:#2dd4bf;letter-spacing:.15em;text-transform:uppercase;margin-top:2px;}
  .sidebar-role{padding:12px 20px;border-bottom:1px solid #1f2d3d;display:flex;gap:6px;}
  .role-btn{flex:1;padding:6px 4px;border-radius:6px;border:1px solid #1f2d3d;background:transparent;color:#7a95b0;font-size:var(--fs-meta);cursor:pointer;transition:all .15s;font-family:'DM Sans',sans-serif;}
  .role-btn.active{background:rgba(45,212,191,.12);border-color:#1a8a7a;color:#2dd4bf;}
  .sidebar-nav{flex:1;padding:12px 10px;overflow-y:auto;}
  .nav-section{margin-bottom:20px;}
  .nav-label{font-size:var(--fs-meta);letter-spacing:.12em;text-transform:uppercase;color:#4a5e74;padding:0 10px;margin-bottom:6px;}
  .nav-item{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:8px;cursor:pointer;color:#7a95b0;font-size:var(--fs-meta);transition:all .15s;border:1px solid transparent;margin-bottom:2px;}
  .nav-item:hover{background:#161e27;color:#e2e8f0;}
  .nav-item.active{background:rgba(45,212,191,.12);border-color:#1f2d3d;color:#2dd4bf;}
  .nav-icon{font-size:16px;width:20px;text-align:center;}
  .nav-badge{margin-left:auto;background:#fb7185;color:white;font-size:var(--fs-meta);padding:1px 6px;border-radius:10px;font-weight:600;}
  .sidebar-user{padding:14px 16px;border-top:1px solid #1f2d3d;display:flex;align-items:center;gap:10px;}
  .user-avatar{width:32px;height:32px;border-radius:50%;background:rgba(45,212,191,.12);border:1px solid #1a8a7a;display:flex;align-items:center;justify-content:center;font-size:var(--fs-meta);color:#2dd4bf;font-weight:600;flex-shrink:0;}
  .user-info{flex:1;min-width:0;}
  .user-name{font-size:var(--fs-meta);font-weight:500;color:#e2e8f0;}
  .user-role{font-size:var(--fs-meta);color:#4a5e74;}
  .main{flex:1;display:flex;flex-direction:column;overflow:hidden;}
  .topbar{padding:14px 24px;border-bottom:1px solid #1f2d3d;display:flex;align-items:center;gap:16px;background:#111820;}
  .topbar-title{font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:400;color:#e2e8f0;flex:1;}
  .topbar-actions{display:flex;gap:8px;align-items:center;}
  .content{flex:1;overflow-y:auto;padding:24px;}
  .btn{padding:8px 16px;border-radius:8px;border:1px solid #1f2d3d;background:transparent;color:#e2e8f0;font-size:var(--fs-meta);cursor:pointer;transition:all .15s;font-family:'DM Sans',sans-serif;display:flex;align-items:center;gap:6px;}
  .btn:hover{background:#161e27;border-color:#243446;}
  .btn-primary{background:#1a8a7a;border-color:#2dd4bf;color:white;}
  .btn-primary:hover{background:#2dd4bf;color:#0d1117;}
  .btn-danger{border-color:#fb7185;color:#fb7185;}
  .btn-danger:hover{background:rgba(251,113,133,.1);}
  .btn-sm{padding:5px 10px;font-size:var(--fs-meta);}
  .btn:disabled{opacity:.4;cursor:not-allowed;pointer-events:none;}
  .stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:24px;}
  .stat-card{background:#1a2330;border:1px solid #1f2d3d;border-radius:12px;padding:18px 20px;position:relative;overflow:hidden;}
  .stat-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,#2dd4bf,transparent);}
  .stat-label{font-size:var(--fs-meta);color:#7a95b0;letter-spacing:.05em;text-transform:uppercase;margin-bottom:6px;}
  .stat-value{font-family:'Cormorant Garamond',serif;font-size:34px;font-weight:400;color:#e2e8f0;line-height:1;}
  .stat-sub{font-size:var(--fs-body);color:#4a5e74;margin-top:6px;}
  .stat-accent{color:#2dd4bf;}.stat-warn{color:#fbbf24;}.stat-danger{color:#fb7185;}
  .section-title{font-size:var(--fs-meta);font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:#7a95b0;margin:20px 0 8px;}
  .section-title:first-child{margin-top:0;}
  .stat-value-hero{font-size:48px;}
  .action-panel{background:#1a2330;border:1px solid #1f2d3d;border-radius:12px;margin-bottom:8px;overflow:hidden;}
  .action-row{display:flex;align-items:flex-start;gap:12px;padding:13px 18px;border-bottom:1px solid #1f2d3d;}
  .action-row:last-child{border-bottom:none;}
  .action-dot{width:9px;height:9px;border-radius:50%;margin-top:6px;flex-shrink:0;}
  .action-text{flex:1;font-size:var(--fs-body);color:#e2e8f0;line-height:1.5;}
  .action-text strong{font-weight:600;}
  .action-sub{font-size:var(--fs-meta);color:#7a95b0;margin-top:3px;display:flex;gap:8px;flex-wrap:wrap;}
  .action-ok{padding:18px;text-align:center;color:#4ade80;font-size:var(--fs-body);}
  .action-btns{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;}
  .two-col{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;}
  .full-row{margin-bottom:16px;}
  .panel{background:#1a2330;border:1px solid #1f2d3d;border-radius:12px;overflow:hidden;}
  .panel-header{padding:14px 18px;border-bottom:1px solid #1f2d3d;display:flex;align-items:center;gap:10px;}
  .panel-title{font-size:var(--fs-meta);font-weight:500;color:#e2e8f0;flex:1;}
  .panel-body{padding:16px 18px;}
  .pipeline-scroll{display:flex;gap:12px;overflow-x:auto;padding-bottom:12px;scrollbar-width:thick;scrollbar-color:#243446 #111820;}
  .pipeline-scroll::-webkit-scrollbar{height:12px;}
  .pipeline-scroll::-webkit-scrollbar-track{background:#111820;}
  .pipeline-scroll::-webkit-scrollbar-thumb{background:#243446;border-radius:6px;}
  .pipeline-col{min-width:160px;background:#161e27;border:1px solid #1f2d3d;border-radius:10px;padding:10px;flex-shrink:0;}
  .pipeline-col-header{display:flex;align-items:center;gap:8px;margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid #1f2d3d;}
  .col-dot{width:8px;height:8px;border-radius:50%;}
  .col-name{font-size:var(--fs-meta);font-weight:500;color:#e2e8f0;flex:1;}
  .col-count{font-size:var(--fs-meta);color:#4a5e74;background:#111820;padding:2px 7px;border-radius:10px;}
  .lead-card{background:#1a2330;border:1px solid #1f2d3d;border-radius:8px;padding:10px 12px;margin-bottom:8px;cursor:pointer;transition:all .15s;}
  .lead-card:hover{border-color:#1a8a7a;}
  .lead-link{font-size:var(--fs-meta);font-weight:500;color:#2dd4bf;cursor:pointer;background:none;border:none;padding:0;font-family:'DM Sans',sans-serif;transition:color .15s;text-align:left;}
  .lead-link:hover{color:#5eead4;text-decoration:underline;}
  .lead-meta{font-size:var(--fs-meta);color:#7a95b0;display:flex;gap:8px;flex-wrap:wrap;margin-top:3px;}
  .source-badge{padding:2px 7px;border-radius:4px;font-size:var(--fs-meta);font-weight:500;letter-spacing:.03em;}
  .lead-timer{font-size:var(--fs-meta);margin-top:6px;}
  .timer-hot{color:#fb7185;}.timer-warn{color:#fbbf24;}.timer-ok{color:#2dd4bf;}
  .tasks-list{display:flex;flex-direction:column;gap:8px;}
  .task-item{background:#1a2330;border:1px solid #1f2d3d;border-radius:10px;padding:14px 16px;cursor:pointer;transition:all .15s;display:flex;gap:14px;align-items:flex-start;}
  .task-item:hover{border-color:#243446;}
  .task-item.urgent{border-left:3px solid #fb7185;}
  .task-item.normal{border-left:3px solid #2dd4bf;}
  .task-item.future{border-left:3px solid #4a5e74;}
  .task-icon{font-size:20px;margin-top:2px;}
  .task-info{flex:1;}
  .task-title{font-size:var(--fs-body);font-weight:500;color:#e2e8f0;margin-bottom:3px;}
  .task-lead-link{font-size:var(--fs-meta);color:#2dd4bf;margin-bottom:4px;cursor:pointer;background:none;border:none;padding:0;font-family:'DM Sans',sans-serif;}
  .task-lead-link:hover{text-decoration:underline;}
  .task-desc{font-size:var(--fs-meta);color:#7a95b0;}
  .task-time{font-size:var(--fs-meta);color:#4a5e74;text-align:right;white-space:nowrap;}
  .task-time.urgent{color:#fb7185;}
  table{width:100%;border-collapse:collapse;}
  th{text-align:left;font-size:var(--fs-meta);letter-spacing:.08em;text-transform:uppercase;color:#4a5e74;padding:10px 14px;border-bottom:1px solid #1f2d3d;font-weight:500;}
  td{padding:12px 14px;border-bottom:1px solid #1f2d3d;font-size:var(--fs-meta);color:#e2e8f0;}
  tr:last-child td{border-bottom:none;}
  tr:hover td{background:#161e27;}
  .chip{display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:20px;font-size:var(--fs-meta);font-weight:500;white-space:nowrap;}
  .chip-nuevo{background:rgba(45,212,191,.1);color:#2dd4bf;border:1px solid #1a8a7a;}
  .chip-contactado{background:rgba(96,165,250,.1);color:#60a5fa;border:1px solid #1d4ed8;}
  .chip-calificado{background:rgba(74,222,128,.1);color:#4ade80;border:1px solid #166534;}
  .chip-visita-agendada{background:rgba(251,191,36,.1);color:#fbbf24;border:1px solid #92400e;}
  .chip-visita-realizada{background:rgba(167,139,250,.1);color:#a78bfa;border:1px solid #4c1d95;}
  .chip-documentacion{background:rgba(236,72,153,.1);color:#ec4899;border:1px solid #be185d;}
  .chip-negociacion{background:rgba(251,146,60,.1);color:#fb923c;border:1px solid #7c2d12;}
  .chip-apartado{background:rgba(74,222,128,.15);color:#4ade80;border:1px solid #166534;}
  .chip-escriturado{background:rgba(16,185,129,.1);color:#10b981;border:1px solid #065f46;}
  .chip-repechaje{background:rgba(148,163,184,.1);color:#94a3b8;border:1px solid #334155;}
  .chip-perdido{background:rgba(251,113,133,.1);color:#fb7185;border:1px solid #9f1239;}
  .chip-inactivo{background:rgba(74,94,116,.2);color:#4a5e74;border:1px solid #1f2d3d;}
  .units-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px;}
  .unit-card{background:#161e27;border:1px solid #1f2d3d;border-radius:10px;padding:14px;text-align:center;cursor:pointer;transition:all .15s;}
  .unit-card:hover{border-color:#243446;}
  .unit-num{font-family:'Cormorant Garamond',serif;font-size:22px;color:#e2e8f0;}
  .unit-model{font-size:var(--fs-meta);color:#7a95b0;margin:3px 0;}
  .unit-status{font-size:var(--fs-meta);font-weight:500;margin-top:6px;}
  .us-disponible{color:#2dd4bf;}.us-apartada{color:#fbbf24;}.us-bloqueada{color:#fb7185;}.us-vendida{color:#4a5e74;}
  .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.75);display:flex;align-items:center;justify-content:center;z-index:200;padding:20px;}
  .modal{background:#1a2330;border:1px solid #243446;border-radius:16px;width:100%;max-width:560px;max-height:88vh;overflow-y:auto;padding:28px;}
  .modal-lg{max-width:680px;}
  .modal-title{font-family:'Cormorant Garamond',serif;font-size:24px;font-weight:400;color:#e2e8f0;margin-bottom:6px;}
  .modal-sub{font-size:var(--fs-meta);color:#7a95b0;margin-bottom:20px;}
  .form-group{margin-bottom:16px;}
  .form-label{font-size:var(--fs-meta);letter-spacing:.06em;text-transform:uppercase;color:#4a5e74;margin-bottom:6px;display:block;}
  .form-input{width:100%;padding:10px 14px;background:#161e27;border:1px solid #1f2d3d;border-radius:8px;color:#e2e8f0;font-size:var(--fs-body);font-family:'DM Sans',sans-serif;outline:none;transition:border-color .15s;}
  .form-input:focus{border-color:#1a8a7a;}
  .form-select{width:100%;padding:10px 14px;background:#161e27;border:1px solid #1f2d3d;border-radius:8px;color:#e2e8f0;font-size:var(--fs-body);font-family:'DM Sans',sans-serif;outline:none;}
  .form-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
  .modal-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:24px;}
  .flow-question{font-size:var(--fs-meta);color:#7a95b0;margin-bottom:8px;}
  .flow-options{display:flex;gap:8px;flex-wrap:wrap;}
  .flow-opt{padding:8px 14px;border-radius:8px;border:1px solid #1f2d3d;background:transparent;color:#e2e8f0;font-size:var(--fs-meta);cursor:pointer;transition:all .15s;font-family:'DM Sans',sans-serif;}
  .flow-opt:hover{border-color:#1a8a7a;color:#2dd4bf;}
  .flow-opt.selected{background:rgba(45,212,191,.12);border-color:#2dd4bf;color:#2dd4bf;}
  .flow-opt.red{border-color:rgba(251,113,133,.3);color:#fb7185;}
  .flow-opt.red:hover,.flow-opt.red.selected{background:rgba(251,113,133,.1);border-color:#fb7185;}
  .notif-list{display:flex;flex-direction:column;gap:6px;}
  .notif-item{display:flex;gap:12px;align-items:flex-start;padding:12px 14px;border-radius:8px;background:#161e27;border:1px solid #1f2d3d;}
  .notif-dot{width:8px;height:8px;border-radius:50%;margin-top:5px;flex-shrink:0;}
  .notif-text{flex:1;font-size:var(--fs-meta);color:#7a95b0;line-height:1.5;}
  .notif-text strong{color:#e2e8f0;font-weight:500;}
  .notif-time{font-size:var(--fs-meta);color:#4a5e74;white-space:nowrap;}
  .ia-chat{display:flex;flex-direction:column;height:420px;}
  .ia-messages{flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:12px;padding-bottom:4px;}
  .ia-msg{padding:12px 14px;border-radius:10px;font-size:var(--fs-meta);line-height:1.6;max-width:90%;}
  .ia-msg.system{background:#161e27;border:1px solid #1f2d3d;color:#e2e8f0;align-self:flex-start;}
  .ia-msg.user{background:rgba(45,212,191,.12);border:1px solid #1a8a7a;color:#e2e8f0;align-self:flex-end;}
  .ia-msg.loading{color:#7a95b0;font-style:italic;}
  .ia-input-row{display:flex;gap:8px;margin-top:12px;border-top:1px solid #1f2d3d;padding-top:12px;}
  .ia-input{flex:1;padding:10px 14px;background:#161e27;border:1px solid #1f2d3d;border-radius:8px;color:#e2e8f0;font-size:var(--fs-meta);font-family:'DM Sans',sans-serif;outline:none;}
  .ia-input:focus{border-color:#1a8a7a;}
  .report-bar-wrap{margin-bottom:10px;}
  .report-bar-label{display:flex;justify-content:space-between;font-size:var(--fs-meta);color:#7a95b0;margin-bottom:4px;}
  .report-bar-bg{height:8px;background:#161e27;border-radius:4px;overflow:hidden;}
  .report-bar-fill{height:100%;border-radius:4px;transition:width .5s ease;}
  .cb-row{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:8px;border:1px solid #1f2d3d;background:#161e27;cursor:pointer;transition:all .15s;margin-bottom:6px;}
  .cb-row:hover{border-color:#243446;}
  .cb-row.selected{border-color:#1a8a7a;background:rgba(45,212,191,.06);}
  .cb-box{width:18px;height:18px;border-radius:4px;border:1.5px solid #243446;background:transparent;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .15s;}
  .cb-box.checked{background:#1a8a7a;border-color:#2dd4bf;}
  .cb-check{color:white;font-size:var(--fs-meta);}
  .ficha-section{margin-bottom:20px;}
  .ficha-section-title{font-size:var(--fs-meta);letter-spacing:.1em;text-transform:uppercase;color:#4a5e74;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #1f2d3d;}
  .ficha-row{display:flex;justify-content:space-between;align-items:flex-start;padding:6px 0;font-size:var(--fs-meta);}
  .ficha-key{color:#7a95b0;}
  .ficha-val{color:#e2e8f0;text-align:right;}
  .historia-item{padding:10px 12px;background:#161e27;border-radius:8px;border-left:2px solid #1f2d3d;margin-bottom:6px;}
  .historia-header{display:flex;justify-content:space-between;margin-bottom:4px;}
  .historia-action{font-size:var(--fs-meta);font-weight:500;color:#e2e8f0;}
  .historia-time{font-size:var(--fs-meta);color:#4a5e74;}
  .historia-note{font-size:var(--fs-meta);color:#7a95b0;}
  .asesor-card{background:#161e27;border:1px solid #1f2d3d;border-radius:10px;padding:16px;}
  .asesor-card.inactive{opacity:.5;}
  .modo-opt{display:flex;gap:12px;padding:12px 14px;border-radius:10px;border:1px solid #1f2d3d;background:#161e27;cursor:pointer;transition:all .15s;margin-bottom:8px;}
  .modo-opt:hover{border-color:#243446;}
  .modo-opt.active{border-color:#1a8a7a;background:rgba(45,212,191,.07);}
  ::-webkit-scrollbar{width:4px;height:4px;}
  ::-webkit-scrollbar-track{background:transparent;}
  ::-webkit-scrollbar-thumb{background:#1f2d3d;border-radius:2px;}
  .divider{height:1px;background:#1f2d3d;margin:16px 0;}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
  .pulse{animation:pulse 1.5s infinite;}
  @keyframes slideIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  .slide-in{animation:slideIn .2s ease;}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  .fade-in{animation:fadeIn .15s ease;}
  .progress-strip{background:#161e27;border:1px solid #1f2d3d;border-radius:8px;padding:6px 12px;margin-bottom:10px;opacity:.85;}
  .progress-strip-top{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px;}
  .progress-strip-title{font-size:11px;color:#5a7188;text-transform:uppercase;letter-spacing:.06em;}
  .progress-strip-pct{font-size:11px;font-weight:500;color:#7dd3c8;}
  .progress-strip-track{position:relative;height:4px;background:#0d1117;border-radius:3px;}
  .progress-strip-fill{height:100%;border-radius:3px;background:#2dd4bf;transition:width .5s ease;}
  .progress-strip-tick{position:absolute;top:-2px;width:2px;height:8px;background:#fbbf24;}
  .progress-strip-sub{font-size:10px;color:#4a5e74;margin-top:3px;}
  .funnel-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,260px));gap:14px;margin-bottom:24px;}
  .tower-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px;}
  .tower-mini{background:#161e27;border:1px solid #1f2d3d;border-radius:8px;padding:8px 10px;opacity:.9;}
  .tower-mini-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;}
  .tower-mini-name{font-size:var(--fs-meta);font-weight:500;color:#9fb3c8;}
  .tower-badge{font-size:11px;padding:2px 8px;border-radius:20px;font-weight:500;}
  .tower-badge-preventa{background:rgba(148,163,184,.15);color:#94a3b8;}
  .tower-badge-en_venta{background:rgba(45,212,191,.15);color:#2dd4bf;}
  .tower-badge-entregada{background:rgba(74,222,128,.15);color:#4ade80;}
  .tower-progress-track{height:3px;background:#0d1117;border-radius:2px;overflow:hidden;margin-bottom:5px;}
  .tower-progress-fill{height:100%;background:#2dd4bf;border-radius:2px;}
  .tower-mini-stats{display:flex;flex-wrap:wrap;gap:8px;font-size:10px;color:#5a7188;}
  .tower-note{font-size:10px;color:#5a7188;margin-top:2px;}
  .goal-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,320px));gap:14px;margin-bottom:24px;}
  .goal-card{background:#161e27;border:1px solid #1f2d3d;border-radius:10px;padding:14px 16px;}
  .goal-card-head{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:4px;}
  .goal-card-title{font-size:var(--fs-body);font-weight:500;color:#e2e8f0;}
  .goal-card-sub{font-size:var(--fs-meta);color:#7a95b0;}
  .goal-status{font-size:11px;padding:2px 8px;border-radius:20px;font-weight:500;white-space:nowrap;}
  .goal-status-met{background:rgba(74,222,128,.15);color:#4ade80;}
  .goal-status-warn{background:rgba(251,191,36,.15);color:#fbbf24;}
  .goal-status-behind{background:rgba(251,113,133,.15);color:#fb7185;}
  .semaforo-card{background:#161e27;border:1px solid #1f2d3d;border-radius:10px;padding:14px 16px;margin-bottom:10px;}
  .semaforo-head{display:flex;align-items:center;gap:10px;margin-bottom:8px;}
  .semaforo-dot{width:12px;height:12px;border-radius:50%;flex-shrink:0;}
  .semaforo-dot-verde{background:#4ade80;}
  .semaforo-dot-amarillo{background:#fbbf24;}
  .semaforo-dot-rojo{background:#fb7185;}
  .semaforo-metrics{display:flex;gap:18px;flex-wrap:wrap;font-size:var(--fs-meta);color:#7a95b0;margin-bottom:6px;}
  .semaforo-diag{font-size:var(--fs-meta);color:#94a3b8;font-style:italic;}
  @media(max-width:1024px){
    .stats-grid{grid-template-columns:repeat(2,1fr);}
    .two-col{grid-template-columns:1fr;}
    .sidebar{width:180px;min-width:180px;}
    .topbar-title{font-size:18px;}
    .modal{max-width:90vw;}
  }
  @media(max-width:768px){
    :root{--fs-meta:16px;--fs-body:18px;}
    .crm-root{flex-direction:column;}
    .sidebar{position:fixed;top:60px;left:0;right:0;width:100%;height:auto;max-height:calc(100vh - 60px);z-index:900;flex-direction:column;overflow-y:auto;background:#0f172a;}
    .sidebar.hidden{display:none;}
    .sidebar-logo{padding:12px 16px;flex-direction:row;align-items:center;justify-content:space-between;width:100%;border-bottom:1px solid #1f2d3d;}
    .logo-name{font-size:22px;font-weight:600;}
    .sidebar-nav{width:100%;display:flex;flex-direction:column;padding:0;}
    .sidebar-user{display:none;}
    .sidebar-role{display:none;}
    .main{padding-top:60px;margin-left:0;}
    .topbar{position:fixed;top:0;left:0;right:0;height:60px;padding:8px 12px;display:flex;align-items:center;justify-content:space-between;gap:12px;z-index:899;border-bottom:1px solid #1f2d3d;}
    .topbar-title{font-size:22px;font-weight:600;}
    .topbar-actions{gap:8px;display:flex;align-items:center;}
    .topbar-actions .btn{padding:8px 12px;font-size:20px;min-height:44px;}
    .content{padding:12px;padding-bottom:80px;font-size:18px;}
    .nav-item{padding:14px 16px;font-size:20px;border-left:3px solid transparent;display:flex;align-items:center;gap:12px;}
    .nav-item:hover{background:#1e293b;}
    .nav-item.active{border-left-color:#2dd4bf;background:#1e293b;}
    .nav-icon{font-size:22px;}
    .nav-label{padding:8px 16px;font-size:14px;text-transform:uppercase;color:#64748b;font-weight:600;}
    .stats-grid{grid-template-columns:1fr;gap:12px;}
    .stat-card{padding:14px;font-size:16px;}
    .stat-label{font-size:19px;}
    .stat-value{font-size:32px;font-weight:600;}
    .stat-value-hero{font-size:36px;}
    .action-row{padding:12px 14px;}
    .two-col{grid-template-columns:1fr;}
    .panel-header{padding:12px 16px;font-size:20px;font-weight:600;}
    .panel-body{padding:12px;font-size:19px;}
    .modal{max-width:95vw;padding:18px;border-radius:12px;}
    .modal-title{font-size:23px;font-weight:600;}
    .modal-sub{font-size:19px;}
    .form-label{font-size:19px;font-weight:500;}
    .form-input{padding:10px 12px;font-size:18px;min-height:44px;}
    .form-select{padding:10px 12px;font-size:18px;min-height:44px;}
    .btn{padding:10px 16px;font-size:18px;min-height:44px;border-radius:6px;}
    .lead-card{padding:12px;font-size:17px;}
    .pipeline-col{min-width:140px;padding:10px;}
    .units-grid{grid-template-columns:repeat(auto-fill,minmax(100px,1fr));}
    table{font-size:17px;}
    th,td{padding:10px 8px;}
    .asesor-card{padding:12px;font-size:17px;}
    .ia-chat{height:300px;}
    .tower-grid{grid-template-columns:1fr;}
    .funnel-grid{grid-template-columns:1fr;}
    .progress-strip-pct{font-size:19px;}
    .semaforo-metrics{gap:12px;}
  }
  @media(max-width:480px){
    .content{padding:10px;padding-bottom:80px;font-size:18px;}
    .topbar-title{font-size:20px;}
    .nav-item{padding:12px 14px;font-size:19px;}
    .stat-value{font-size:28px;}
    .modal{max-width:100vw;border-radius:0;padding:16px;}
    .form-input{font-size:18px;min-height:44px;}
    .btn{font-size:18px;padding:10px 14px;min-height:40px;}
    .panel-header{font-size:19px;}
    .panel-body{font-size:19px;}
  }
`;

// DATA
const SOURCES = {
  meta:     {label:"Meta Ads",   color:"#1877f2",bg:"rgba(24,119,242,.15)"},
  google:   {label:"Google Ads", color:"#ea4335",bg:"rgba(234,67,53,.15)"},
  web:      {label:"Sitio Web",   color:"#a78bfa",bg:"rgba(167,139,250,.15)"},
  whatsapp: {label:"WhatsApp",   color:"#25d366",bg:"rgba(37,211,102,.15)"},
  broker:   {label:"Broker",     color:"#fbbf24",bg:"rgba(251,191,36,.15)"},
  instagram:{label:"Instagram",  color:"#e1306c",bg:"rgba(225,48,108,.15)"},
  facebook: {label:"Facebook",   color:"#1877f2",bg:"rgba(24,119,242,.15)"},
  tiktok:   {label:"TikTok",     color:"#000000",bg:"rgba(0,0,0,.15)"},
  youtube:  {label:"YouTube",    color:"#ff0000",bg:"rgba(255,0,0,.15)"},
  gmb:      {label:"Google My Business",color:"#4285f4",bg:"rgba(66,133,244,.15)"},
  manual:   {label:"Manual",     color:"#94a3b8",bg:"rgba(148,163,184,.15)"},
};
const STAGES=[
  {id:"nuevo",           label:"Nuevo",           dot:"#2dd4bf"},
  {id:"contactado",      label:"Contactado",      dot:"#60a5fa"},
  {id:"calificado",      label:"Calificado",      dot:"#4ade80"},
  {id:"visita_agendada", label:"Visita Agendada", dot:"#fbbf24"},
  {id:"visita_realizada",label:"Visita Realizada",dot:"#a78bfa"},
  {id:"documentacion",   label:"En Documentación",dot:"#ec4899"},
  {id:"negociacion",     label:"Negociación",     dot:"#fb923c"},
  {id:"apartado",        label:"Apartado",        dot:"#4ade80"},
  {id:"escriturado",     label:"Escriturado",     dot:"#10b981"},
];
const STAGE_LABELS={
  nuevo:"Nuevo",contactado:"Contactado",calificado:"Calificado",
  visita_agendada:"Visita Agendada",visita_realizada:"Visita Realizada",
  documentacion:"En Documentación",negociacion:"Negociación",apartado:"Apartado",
  escriturado:"Escriturado",repechaje:"Repechaje",perdido:"Perdido",
};
const NOTIFS=[
  {id:1,text:"Nuevo lead de <strong>Meta Ads</strong>: Daniela Vega — hace 8 min. Sin asignar.",time:"08:52",color:"#2dd4bf"},
  {id:2,text:"Nuevo lead de <strong>Meta Ads</strong>: Carlos Mendoza — hace 25 min. Asignado a Rodrigo.",time:"08:35",color:"#2dd4bf"},
  {id:3,text:"<strong>Carlos Mendoza</strong> lleva 25 min sin ser contactado. Rodrigo sin actividad.",time:"08:40",color:"#fbbf24"},
  {id:4,text:"Valentina movió a <strong>Roberto Salinas</strong> de Visita Realizada → Negociación.",time:"Ayer 16:20",color:"#a78bfa"},
  {id:5,text:"Unidad <strong>2A</strong> apartada. Sofía Morales. Asesor: Rodrigo. Vence en 72h.",time:"Ayer 11:05",color:"#4ade80"},
  {id:6,text:"<strong>Luis Hernández</strong> sin contacto en 3 intentos. Movido a Repechaje.",time:"Hace 3 días",color:"#4a5e74"},
];
const TASKS=[
  {id:1,type:"primer_contacto",title:"Primer contacto",         lead:"Carlos Mendoza", leadId:1,desc:"Entró hace 25 min por Meta Ads.",                urgency:"urgent",time:"Hace 25 min"},
  {id:2,type:"primer_contacto",title:"Primer contacto",         lead:"Daniela Vega",   leadId:6,desc:"Entró hace 8 min. Reasignada hace 2 min.",       urgency:"urgent",time:"Hace 8 min"},
  {id:3,type:"enviar_info",    title:"Enviar renders y tabla",  lead:"Fernanda Ríos",  leadId:2,desc:"Pidió información completa en la llamada.",       urgency:"normal",time:"Hoy"},
  {id:4,type:"followup",       title:"2do intento de contacto", lead:"Javier Castillo",leadId:9,desc:"No contestó ayer. 1 de 3 intentos.",             urgency:"normal",time:"Hoy"},
  {id:5,type:"visita",         title:"Confirmar visita mañana", lead:"Ana Gutiérrez",  leadId:4,desc:"Visita mañana 10am. Confirmar por WhatsApp.",     urgency:"normal",time:"Hoy"},
  {id:6,type:"negociacion",    title:"Seguimiento negociación", lead:"Roberto Salinas",leadId:5,desc:"Espera respuesta bono $100k. Lleva 1 día.",      urgency:"future",time:"Mañana"},
];
const TASK_ICONS={primer_contacto:"📞",enviar_info:"📄",followup:"🔁",visita:"🗓️",negociacion:"🤝"};

// HELPERS
function timeAgo(ts){const m=Math.floor((Date.now()-ts)/60000);if(m<60)return`${m} min`;const h=Math.floor(m/60);if(h<24)return`${h}h`;return`${Math.floor(h/24)}d`;}
function timerClass(ts){const m=Math.floor((Date.now()-ts)/60000);if(m<15)return"timer-ok";if(m<45)return"timer-warn";return"timer-hot";}
function fmtDate(ts){return new Date(ts).toLocaleDateString("es-MX",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"});}
function ini(name){return(name||"").split(" ").map(n=>n[0]).join("").slice(0,2);}

// METRICS HELPERS
function get30DaysAgo(){return Date.now()-30*86400000;}
const ACTIVE_LEAD_STAGES=["calificado","visita_agendada","negociacion","apartado"];
const FUNNEL_STAGES=[
  {id:"nuevo",label:"Nuevo"},{id:"contactado",label:"Contactado"},{id:"calificado",label:"Calificado"},
  {id:"visita_agendada",label:"Visita Agendada"},{id:"negociacion",label:"Negociación"},{id:"apartado",label:"Apartado"},
];
const MARKETING_SOURCES=["instagram","facebook","whatsapp","meta","google","web","tiktok","gmb"];
const STALE_LEAD_STAGES=["nuevo","contactado","calificado","visita_agendada","negociacion"];
const STALE_HOURS=48;
const SOURCE_SILENCE_DAYS=5;

function calcMetrics(leads,units,asesores){
  const total30dias=leads.filter(l=>l.created>=get30DaysAgo()).length;
  const calificados30=leads.filter(l=>l.created>=get30DaysAgo()&&ACTIVE_LEAD_STAGES.includes(l.stage)).length;
  const caidos30=leads.filter(l=>l.created>=get30DaysAgo()&&l.stage==="perdido").length;
  const repechaje30=leads.filter(l=>l.created>=get30DaysAgo()&&l.stage==="repechaje").length;
  const totalLeads=leads.length;
  const calificadosTotal=leads.filter(l=>ACTIVE_LEAD_STAGES.includes(l.stage)).length;
  const pctCalificados30=total30dias>0?Math.round(calificados30/total30dias*100):null;

  const todayStart=new Date();todayStart.setHours(0,0,0,0);
  const leadsHoy=leads.filter(l=>l.created>=todayStart.getTime()).length;
  const leads7dias=leads.filter(l=>l.created>=Date.now()-7*86400000).length;

  const asesoresActivos=asesores.filter(a=>a.activo);
  const tiempoRespPromedio=asesoresActivos.length>0?Math.round(asesoresActivos.reduce((s,a)=>s+(Number(a.tiempo_resp)||0),0)/asesoresActivos.length):null;

  const urgentes=leads.filter(l=>l.stage==="nuevo"&&Date.now()-l.created>30*60000);

  const staleLeads=leads.filter(l=>STALE_LEAD_STAGES.includes(l.stage)&&Date.now()-l.lastActivity>STALE_HOURS*3600000);
  const asesoresAtrasados=Object.values(staleLeads.reduce((acc,l)=>{
    const key=l.asesor||"Sin asignar";
    if(!acc[key])acc[key]={asesor:key,leads:[]};
    acc[key].leads.push(l);
    return acc;
  },{})).sort((a,b)=>b.leads.length-a.leads.length);

  const fuentesActivas=[...new Set(leads.map(l=>l.source))].filter(s=>MARKETING_SOURCES.includes(s));
  const fuentesSilenciosas=fuentesActivas.map(src=>{
    const maxCreated=Math.max(...leads.filter(l=>l.source===src).map(l=>l.created));
    return{source:src,label:SOURCES[src]?.label||src,dias:Math.floor((Date.now()-maxCreated)/86400000)};
  }).filter(f=>f.dias>=SOURCE_SILENCE_DAYS).sort((a,b)=>b.dias-a.dias);

  const fuentesBajaCalidad=Object.entries(
    leads.reduce((acc,l)=>{
      if(!acc[l.source])acc[l.source]={total:0,cal:0};
      acc[l.source].total++;
      if(ACTIVE_LEAD_STAGES.includes(l.stage))acc[l.source].cal++;
      return acc;
    },{})
  ).map(([source,v])=>({source,label:SOURCES[source]?.label||source,total:v.total,pct:Math.round(v.cal/v.total*100)}))
   .filter(f=>f.total>=3&&f.pct<=20);

  const towerStats=["A","B","C"].map(t=>{
    const us=units.filter(u=>u.torre===t);
    const vendidas=us.filter(u=>u.status==="vendida").length;
    return{torre:t,total:us.length,vendidas,pct:us.length>0?Math.round(vendidas/us.length*100):null};
  });
  const totalUnidades=units.length;
  const totalVendidas=units.filter(u=>u.status==="vendida").length;
  const pctVentaGlobal=totalUnidades>0?Math.round(totalVendidas/totalUnidades*100):null;

  const now=new Date();
  const closesByMonth=Array.from({length:6}).map((_,i)=>{
    const d=new Date(now.getFullYear(),now.getMonth()-(5-i),1);
    const next=new Date(now.getFullYear(),now.getMonth()-(5-i)+1,1);
    const count=units.filter(u=>u.soldAt&&u.soldAt>=d.getTime()&&u.soldAt<next.getTime()).length;
    return{label:d.toLocaleDateString("es-MX",{month:"short"}),count};
  });

  const enEscritura=units.filter(u=>u.escrituraStatus==="en_proceso").length;
  const escrituraCompletada=units.filter(u=>u.escrituraStatus==="completada").length;
  const enCierre=leads.filter(l=>l.stage==="negociacion").length;
  const apartadas=units.filter(u=>u.status==="apartada").length;

  const asesoresConMeta=asesores.filter(a=>a.activo&&a.metas?.ventasCerradas?.target>0);
  const metaTargetSum=asesoresConMeta.reduce((s,a)=>s+a.metas.ventasCerradas.target,0);
  const metaActualSum=asesoresConMeta.reduce((s,a)=>s+a.metas.ventasCerradas.actual,0);
  const pctMetasVentas=metaTargetSum>0?Math.round(metaActualSum/metaTargetSum*100):null;

  let prevCount=null;
  const funnel=FUNNEL_STAGES.map(s=>{
    const count=leads.filter(l=>l.stage===s.id).length;
    const dropPct=prevCount!=null&&prevCount>0?Math.round((1-count/prevCount)*100):null;
    prevCount=count;
    return{...s,count,dropPct};
  });

  const pipelineValue=units.filter(u=>u.status==="apartada").reduce((s,u)=>s+u.price,0);

  const sevenDays=Date.now()+7*86400000;
  const bloqueosPorVencer=units.filter(u=>u.bloqueoExpiraAt&&u.bloqueoExpiraAt<=sevenDays);
  const bloqueosVencidos=units.filter(u=>u.bloqueoExpiraAt&&u.bloqueoExpiraAt<Date.now());

  const mixModelos=Object.entries(
    units.filter(u=>u.status==="vendida").reduce((acc,u)=>{acc[u.model]=(acc[u.model]||0)+1;return acc;},{})
  ).map(([model,count])=>({model,count})).sort((a,b)=>b.count-a.count);

  return{
    calificados30,caidos30,repechaje30,pctCalificados30,calificadosTotal,totalLeads,
    leadsHoy,leads7dias,tiempoRespPromedio,urgentes,asesoresAtrasados,fuentesSilenciosas,fuentesBajaCalidad,
    towerStats,pctVentaGlobal,totalVendidas,totalUnidades,
    closesByMonth,enEscritura,escrituraCompletada,enCierre,apartadas,
    pctMetasVentas,funnel,pipelineValue,bloqueosPorVencer,bloqueosVencidos,mixModelos,
  };
}

// ── LOGIN ────────────────────────────────────────────────────────────────
function LoginModal({onLogin}){
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(false);
  async function handleLogin(){
    setError("");setLoading(true);
    const {error:authError}=await supabase.auth.signInWithPassword({email,password});
    setLoading(false);
    if(authError){setError("Email o contraseña incorrectos");return;}
    onLogin();
  }
  return(
    <div className="modal-overlay" style={{background:"rgba(0,0,0,.95)"}}>
      <div className="modal" style={{maxWidth:400}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:32,fontWeight:400,color:AV.text,marginBottom:4}}>Aqua Vivant CRM</div>
        </div>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" type="email" placeholder="tu@email.com" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()}/>
        </div>
        <div className="form-group">
          <label className="form-label">Contraseña</label>
          <input className="form-input" type="password" placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()}/>
        </div>
        {error&&<div style={{fontSize:"var(--fs-meta)",color:AV.rose,marginBottom:16,padding:"8px 12px",background:"rgba(251,113,133,.1)",borderRadius:8,border:"1px solid rgba(251,113,133,.3)"}}>{error}</div>}
        <button className="btn btn-primary" style={{width:"100%",justifyContent:"center"}} disabled={loading} onClick={handleLogin}>{loading?"Ingresando...":"Ingresar"}</button>
        <div style={{fontSize:"var(--fs-meta)",color:AV.muted,marginTop:16,textAlign:"center"}}>
          <div>Demo: admin@aquavivant.com / admin123</div>
          <div style={{marginTop:4}}>rodrigo@aquavivant.com / pass123</div>
        </div>
      </div>
    </div>
  );
}

// ATOMS
function SrcBadge({source}){const s=SOURCES[source]||SOURCES.manual;return<span className="source-badge" style={{background:s.bg,color:s.color}}>{s.label}</span>;}
function StageChip({stage}){
  const map={nuevo:"chip-nuevo",contactado:"chip-contactado",calificado:"chip-calificado",visita_agendada:"chip-visita-agendada",visita_realizada:"chip-visita-realizada",negociacion:"chip-negociacion",apartado:"chip-apartado",repechaje:"chip-repechaje",perdido:"chip-perdido"};
  return<span className={`chip ${map[stage]||""}`}>{STAGE_LABELS[stage]||stage}</span>;
}
function LeadLink({lead,onOpen}){return<button className="lead-link" onClick={e=>{e.stopPropagation();onOpen(lead);}}>{lead.name}</button>;}
function CB({checked,onChange}){return<div className={`cb-box ${checked?"checked":""}`} onClick={e=>{e.stopPropagation();onChange();}}>{checked&&<span className="cb-check">✓</span>}</div>;}

// ── FICHA LEAD ────────────────────────────────────────────────────────────────
function FichaModal({lead,onClose,asesores,onReassign}){
  const [changingAsesor,setChangingAsesor]=useState(false);
  const [newAsesorId,setNewAsesorId]=useState("");
  const [saving,setSaving]=useState(false);
  const [err,setErr]=useState("");
  if(!lead)return null;

  const handleReassign=async()=>{
    if(!newAsesorId)return;
    setSaving(true);setErr("");
    try{
      const a=asesores.find(x=>x.id===newAsesorId);
      await onReassign(lead.id,newAsesorId,lead.asesor||null,a?.name||"",);
      setChangingAsesor(false);
    }catch(e){setErr(e.message||"Error al reasignar");}
    finally{setSaving(false);}
  };

  return(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg slide-in" onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",alignItems:"flex-start",gap:16,marginBottom:20}}>
          <div style={{flex:1}}>
            <div className="modal-title">{lead.name}</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:6}}>
              <StageChip stage={lead.stage}/><SrcBadge source={lead.source}/>
              {lead.interes&&<span style={{fontSize:"var(--fs-meta)",color:AV.textDim}}>{lead.interes}</span>}
            </div>
          </div>
          <button className="btn btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="ficha-section">
          <div className="ficha-section-title">Contacto</div>
          <div className="ficha-row"><span className="ficha-key">Teléfono</span><span className="ficha-val">{lead.phone}</span></div>
          <div className="ficha-row"><span className="ficha-key">Fuente</span><span className="ficha-val"><SrcBadge source={lead.source}/></span></div>
          {lead.campaign&&<div className="ficha-row"><span className="ficha-key">Campaña</span><span className="ficha-val">{lead.campaign}</span></div>}
          {lead.broker&&<div className="ficha-row"><span className="ficha-key">Broker</span><span className="ficha-val" style={{color:AV.amber}}>{lead.broker}</span></div>}
        </div>
        <div className="ficha-section">
          <div className="ficha-section-title">Pipeline</div>
          <div className="ficha-row">
            <span className="ficha-key">Asesor</span>
            <span className="ficha-val" style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
              {changingAsesor?(
                <>
                  <select className="form-select" style={{padding:"3px 8px",fontSize:"var(--fs-meta)",width:"auto"}} value={newAsesorId} onChange={e=>setNewAsesorId(e.target.value)}>
                    <option value="">— Elegir asesor —</option>
                    {(asesores||[]).filter(a=>a.activo).map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                  <button className="btn btn-sm btn-primary" disabled={!newAsesorId||saving} onClick={handleReassign}>{saving?"Guardando...":"Guardar"}</button>
                  <button className="btn btn-sm" onClick={()=>{setChangingAsesor(false);setErr("");}}>Cancelar</button>
                  {err&&<span style={{color:AV.rose,fontSize:"var(--fs-meta)"}}>{err}</span>}
                </>
              ):(
                <>
                  {lead.asesor?<span>{lead.asesor}</span>:<span style={{color:AV.rose}}>Sin asignar</span>}
                  {onReassign&&<button className="btn btn-sm" style={{marginLeft:6}} onClick={()=>{setNewAsesorId("");setChangingAsesor(true);}}>{lead.asesor?"Cambiar":"Asignar"}</button>}
                </>
              )}
            </span>
          </div>
          <div className="ficha-row"><span className="ficha-key">Etapa</span><span className="ficha-val"><StageChip stage={lead.stage}/></span></div>
          {lead.unidad&&<div className="ficha-row"><span className="ficha-key">Unidad</span><span className="ficha-val" style={{color:AV.teal}}>{lead.unidad}</span></div>}
          {lead.razon&&<div className="ficha-row"><span className="ficha-key">Razón salida</span><span className="ficha-val" style={{color:AV.rose}}>{lead.razon}</span></div>}
        </div>
        <div className="ficha-section">
          <div className="ficha-section-title">Tiempos</div>
          <div className="ficha-row"><span className="ficha-key">Entrada</span><span className="ficha-val">{fmtDate(lead.created)}</span></div>
          <div className="ficha-row"><span className="ficha-key">Últ. actividad</span><span className="ficha-val">{fmtDate(lead.lastActivity)}</span></div>
        </div>
        <div className="ficha-section">
          <div className="ficha-section-title">Historial completo</div>
          {(lead.historia||[]).map((h,i)=>(
            <div key={i} className="historia-item">
              <div className="historia-header"><span className="historia-action">{h.action}</span><span className="historia-time">{fmtDate(h.ts)} · {h.by}</span></div>
              {h.note&&<div className="historia-note">{h.note}</div>}
            </div>
          ))}
          {!(lead.historia&&lead.historia.length)&&<div style={{fontSize:"var(--fs-meta)",color:AV.muted}}>Sin historial.</div>}
        </div>
      </div>
    </div>
  );
}

// ── CHAT DE IA ────────────────────────────────────────────────────────────────
function ChatIA({messages,onSendMessage,onClose}){
  const [input,setInput]=useState("");
  const responses={
    "¿cuántos leads":"Tienes actualmente 8 leads en el pipeline. 2 en etapa de documentación y 3 por cerrar.",
    "¿cuántas ventas":"Se han cerrado 2 ventas este mes. 1 está escriturada.",
    "desempeño":"Tu equipo tiene un desempeño del 85%. Rodrigo y Valentina están cumpliendo metas.",
    "próximas tareas":"Tienes 2 tareas urgentes: contactar a Carlos Mendoza y hacer seguimiento a Fernanda.",
    "reporte":"El reporte del mes muestra conversión del 15% y tiempo promedio de respuesta de 18 minutos.",
  };

  function handleSend(){
    if(!input.trim()) return;
    const lower=input.toLowerCase();
    const found=Object.keys(responses).find(key=>lower.includes(key));
    const botReply=found?responses[found]:"Lo siento, no entiendo esa pregunta. Intenta preguntar sobre leads, ventas, desempeño o tareas.";
    onSendMessage([...messages,{type:"user",text:input},{type:"bot",text:botReply}]);
    setInput("");
  }

  return(
    <div style={{position:"fixed",bottom:20,right:20,left:20,width:"auto",maxWidth:380,marginLeft:"auto",height:"min(500px, 70vh)",background:AV.bg,border:`1px solid ${AV.border}`,borderRadius:12,display:"flex",flexDirection:"column",zIndex:1000,boxShadow:"0 10px 40px rgba(0,0,0,.5)"}}>
      <div style={{padding:"16px",borderBottom:`1px solid ${AV.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",background:"#1f2d3d"}}>
        <div style={{fontSize:16,fontWeight:600}}>💬 Asistente IA</div>
        <button onClick={onClose} style={{background:"none",border:"none",color:AV.text,cursor:"pointer",fontSize:18}}>✕</button>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"16px",display:"flex",flexDirection:"column",gap:10}}>
        {messages.map((msg,i)=>(
          <div key={i} style={{display:"flex",justifyContent:msg.type==="user"?"flex-end":"flex-start"}}>
            <div style={{maxWidth:"85%",padding:"10px 14px",background:msg.type==="user"?AV.teal:"#1f2d3d",borderRadius:10,fontSize:"var(--fs-body)",lineHeight:1.5,color:msg.type==="user"?AV.bg:AV.text}}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>
      <div style={{padding:"12px",borderTop:`1px solid ${AV.border}`,display:"flex",gap:8,background:"#0f172a"}}>
        <input placeholder="Pregunta algo..." value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSend()} style={{flex:1,padding:"10px 12px",fontSize:"var(--fs-body)",background:"#1f2d3d",border:`1px solid ${AV.border}`,borderRadius:6,color:AV.text,outline:"none"}}/>
        <button onClick={handleSend} style={{padding:"10px 16px",fontSize:16,background:AV.teal,border:"none",borderRadius:6,color:AV.bg,cursor:"pointer",fontWeight:600}}>↗</button>
      </div>
    </div>
  );
}

// ── PERFIL DE USUARIO ────────────────────────────────────────────────────────────────
function UserProfileModal({user,onClose,onSave}){
  const [f,setF]=useState({name:user.name||"",email:user.email||"",phone:user.phone||"",photo:user.photo||""});
  const s=(k,v)=>setF(p=>({...p,[k]:v}));
  return(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-title">Mi Perfil</div>
        <div className="form-group">
          <label className="form-label">Nombre *</label>
          <input className="form-input" placeholder="Tu nombre completo" value={f.name} onChange={e=>s("name",e.target.value)}/>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Email *</label>
            <input className="form-input" type="email" placeholder="tu@email.com" value={f.email} onChange={e=>s("email",e.target.value)}/>
          </div>
          <div className="form-group">
            <label className="form-label">Teléfono</label>
            <input className="form-input" placeholder="9981234567" value={f.phone} onChange={e=>s("phone",e.target.value)}/>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">URL de foto de perfil</label>
          <input className="form-input" placeholder="https://..." value={f.photo} onChange={e=>s("photo",e.target.value)}/>
        </div>
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" disabled={!f.name.trim()||!f.email.trim()} onClick={()=>{onSave(f);onClose();}}>Guardar Cambios</button>
        </div>
      </div>
    </div>
  );
}

// ── NUEVO LEAD ────────────────────────────────────────────────────────────────
function NewLeadModal({onClose,onSave,asesores}){
  const [f,setF]=useState({name:"",phone:"",source:"manual",asesor:"",campaign:"",interes:"",notes:""});
  const s=(k,v)=>setF(p=>({...p,[k]:v}));
  return(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal slide-in" onClick={e=>e.stopPropagation()}>
        <div className="modal-title">Nuevo Lead</div>
        <div className="modal-sub">Solo nombre y teléfono son obligatorios.</div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Nombre *</label><input className="form-input" placeholder="Nombre completo" value={f.name} onChange={e=>s("name",e.target.value)}/></div>
          <div className="form-group"><label className="form-label">Teléfono *</label><input className="form-input" placeholder="10 dígitos" value={f.phone} onChange={e=>s("phone",e.target.value)}/></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Fuente</label><select className="form-select" value={f.source} onChange={e=>s("source",e.target.value)}><option value="manual">Manual</option><option value="instagram">Instagram</option><option value="facebook">Facebook</option><option value="whatsapp">WhatsApp</option><option value="meta">Meta Ads</option><option value="google">Google Ads</option><option value="web">Sitio Web</option><option value="tiktok">TikTok</option><option value="gmb">Google My Business</option><option value="broker">Broker</option><option value="manual">Manual</option></select></div>
          <div className="form-group"><label className="form-label">Asignar a</label><select className="form-select" value={f.asesor} onChange={e=>s("asesor",e.target.value)}><option value="">Turno automático</option>{asesores.filter(a=>a.activo).map(a=><option key={a.id} value={a.name}>{a.name}</option>)}</select></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Interés</label><select className="form-select" value={f.interes} onChange={e=>s("interes",e.target.value)}><option value="">No definido</option><option value="2 Rec">2 Recámaras</option><option value="3 Rec">3 Recámaras</option><option value="PB Jardín">PB con Jardín</option><option value="Penthouse">Penthouse</option></select></div>
          <div className="form-group"><label className="form-label">Campaña</label><input className="form-input" placeholder="Nombre de campaña" value={f.campaign} onChange={e=>s("campaign",e.target.value)}/></div>
        </div>
        <div className="form-group"><label className="form-label">Nota inicial</label><input className="form-input" placeholder="¿Viene prefiltrado?" value={f.notes} onChange={e=>s("notes",e.target.value)}/></div>
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" disabled={!f.name.trim()||!f.phone.trim()} onClick={()=>{onSave(f);onClose();}}>Crear Lead</button>
        </div>
      </div>
    </div>
  );
}

// ── ASESOR FORM ───────────────────────────────────────────────────────────────
function AsesorModal({asesor,onClose,onSave}){
  const isEdit=!!asesor;
  const [f,setF]=useState({
    name:(asesor&&asesor.name)||"",
    email:(asesor&&asesor.email)||"",
    phone:(asesor&&asesor.phone)||"",
    metas:asesor?.metas||{
      toursRealizados:{target:8,actual:0,periodo:"mes"},
      leadsDocumentacion:{target:12,actual:0,periodo:"mes"},
      ventasCerradas:{target:4,actual:0,periodo:"mes"},
      ventasEscritura:{target:2,actual:0,periodo:"mes"}
    },
    canBlockUnits:asesor?.canBlockUnits||false,
  });
  const updateMeta=(key,field,value)=>{
    setF(p=>({...p,metas:{...p.metas,[key]:{...p.metas[key],[field]:parseInt(value)||0}}}));
  };
  return(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg slide-in" onClick={e=>e.stopPropagation()}>
        <div className="modal-title">{isEdit?"Editar Asesor":"Agregar Asesor"}</div>
        <div className="modal-sub">{isEdit?`Editando: ${asesor.name}`:"El asesor entrará al final del turno. Establece sus metas aquí."}</div>

        <div style={{background:AV.surface,borderRadius:10,padding:14,marginBottom:16}}>
          <div style={{fontSize:"var(--fs-meta)",fontWeight:500,color:AV.text,marginBottom:12}}>Información Básica</div>
          <div className="form-group"><label className="form-label">Nombre *</label><input className="form-input" value={f.name} onChange={e=>setF(p=>({...p,name:e.target.value}))}/></div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Email</label><input className="form-input" value={f.email} onChange={e=>setF(p=>({...p,email:e.target.value}))}/></div>
            <div className="form-group"><label className="form-label">Teléfono</label><input className="form-input" value={f.phone} onChange={e=>setF(p=>({...p,phone:e.target.value}))}/></div>
          </div>
        </div>

        <div style={{background:AV.surface,borderRadius:10,padding:14,marginBottom:16}}>
          <div style={{fontSize:"var(--fs-meta)",fontWeight:500,color:AV.text,marginBottom:12}}>⭐ Metas Mensuales</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div className="form-group">
              <label className="form-label">Tours Realizados (Meta)</label>
              <input className="form-input" type="number" value={f.metas.toursRealizados.target} onChange={e=>updateMeta("toursRealizados","target",e.target.value)}/>
            </div>
            <div className="form-group">
              <label className="form-label">Leads en Documentación (Meta)</label>
              <input className="form-input" type="number" value={f.metas.leadsDocumentacion.target} onChange={e=>updateMeta("leadsDocumentacion","target",e.target.value)}/>
            </div>
            <div className="form-group">
              <label className="form-label">Ventas Cerradas (Meta)</label>
              <input className="form-input" type="number" value={f.metas.ventasCerradas.target} onChange={e=>updateMeta("ventasCerradas","target",e.target.value)}/>
            </div>
            <div className="form-group">
              <label className="form-label">Ventas Escrituradas (Meta)</label>
              <input className="form-input" type="number" value={f.metas.ventasEscritura.target} onChange={e=>updateMeta("ventasEscritura","target",e.target.value)}/>
            </div>
          </div>
          <div style={{fontSize:"var(--fs-meta)",color:AV.muted,marginTop:10}}>💡 Personaliza las metas según experiencia. Nuevos: 2-4 tours. Veteranos: 8+ tours.</div>
        </div>

        {isEdit&&(
          <div style={{background:AV.surface,borderRadius:10,padding:14,marginBottom:16}}>
            <div style={{fontSize:"var(--fs-meta)",fontWeight:500,color:AV.text,marginBottom:8}}>🔒 Permisos de Inventario</div>
            <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:"var(--fs-meta)",color:AV.text}}>
              <input type="checkbox" checked={f.canBlockUnits} onChange={e=>setF(p=>({...p,canBlockUnits:e.target.checked}))}/>
              Puede bloquear propiedades temporalmente desde Inventario
            </label>
            <div style={{fontSize:"var(--fs-meta)",color:AV.muted,marginTop:6}}>El admin sigue controlando, unidad por unidad, cuáles pueden bloquearse por vendedores, y puede desbloquear cualquier unidad cuando lo necesite.</div>
          </div>
        )}

        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" disabled={!f.name.trim()} onClick={()=>{onSave(f);onClose();}}>{isEdit?"Guardar":"Agregar"}</button>
        </div>
      </div>
    </div>
  );
}

// ── PERFIL ASESOR ─────────────────────────────────────────────────────────────
function AsesorPerfilModal({asesor,leads,onClose}){
  if(!asesor)return null;
  const aMetas=asesor.metas;
  const aLeads=leads.filter(l=>l.asesor===asesor.name&&!["perdido","repechaje"].includes(l.stage));
  const pctCierre=aMetas.ventasCerradas.target>0?Math.round(aMetas.ventasCerradas.actual/aMetas.ventasCerradas.target*100):0;
  const pctTours=aMetas.toursRealizados.target>0?Math.round(aMetas.toursRealizados.actual/aMetas.toursRealizados.target*100):0;
  const pctDocs=aMetas.leadsDocumentacion.target>0?Math.round(aMetas.leadsDocumentacion.actual/aMetas.leadsDocumentacion.target*100):0;
  const pctEscritura=aMetas.ventasEscritura.target>0?Math.round(aMetas.ventasEscritura.actual/aMetas.ventasEscritura.target*100):0;
  const semaforoColor=pctCierre>=80&&pctTours>=80?AV.green:pctCierre>=50?AV.amber:AV.rose;
  return(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg slide-in" onClick={e=>e.stopPropagation()}>
        <button className="btn btn-sm" style={{position:"absolute",top:20,right:20}} onClick={onClose}>✕</button>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
          <div className="user-avatar" style={{width:56,height:56,fontSize:20}}>{ini(asesor.name)}</div>
          <div>
            <div className="modal-title" style={{marginBottom:0}}>{asesor.name}</div>
            <div style={{fontSize:"var(--fs-meta)",color:AV.muted}}>{asesor.email}</div>
          </div>
        </div>

        <div className="ficha-section">
          <div className="ficha-section-title">🎯 Semáforo de Desempeño</div>
          <div style={{display:"flex",alignItems:"center",gap:12,padding:"16px",background:AV.surface,borderRadius:10,marginBottom:16}}>
            <div style={{fontSize:48}}>{pctCierre>=80?'🟢':pctCierre>=50?'🟡':'🔴'}</div>
            <div>
              <div style={{fontSize:"var(--fs-body)",fontWeight:500,color:AV.text,marginBottom:4}}>
                {pctCierre>=80?"Excelente desempeño":pctCierre>=50?"En camino":"Necesita mejorar"}
              </div>
              <div style={{fontSize:"var(--fs-meta)",color:AV.muted}}>% Cierre: {pctCierre}% | Tiempo resp: {asesor.tiempo_resp}min</div>
            </div>
          </div>
        </div>

        <div className="ficha-section">
          <div className="ficha-section-title">⭐ Metas Mensuales</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div className="panel" style={{background:AV.surface,border:"none"}}>
              <div style={{fontSize:"var(--fs-meta)",color:AV.muted,marginBottom:8}}>Tours Realizados</div>
              <div style={{fontSize:20,fontWeight:500,color:AV.text,marginBottom:4}}>{aMetas.toursRealizados.actual}/{aMetas.toursRealizados.target}</div>
              <div style={{height:6,background:"#111820",borderRadius:3,overflow:"hidden"}}>
                <div style={{width:Math.min(pctTours,100)+"%",height:"100%",background:pctTours>=100?AV.green:pctTours>=80?AV.teal:AV.amber,transition:"width .3s"}}/>
              </div>
              <div style={{fontSize:"var(--fs-meta)",color:AV.muted,marginTop:6}}>{pctTours}% completado</div>
            </div>
            <div className="panel" style={{background:AV.surface,border:"none"}}>
              <div style={{fontSize:"var(--fs-meta)",color:AV.muted,marginBottom:8}}>Documentación</div>
              <div style={{fontSize:20,fontWeight:500,color:AV.text,marginBottom:4}}>{aMetas.leadsDocumentacion.actual}/{aMetas.leadsDocumentacion.target}</div>
              <div style={{height:6,background:"#111820",borderRadius:3,overflow:"hidden"}}>
                <div style={{width:Math.min(pctDocs,100)+"%",height:"100%",background:pctDocs>=100?AV.green:pctDocs>=80?AV.teal:AV.amber,transition:"width .3s"}}/>
              </div>
              <div style={{fontSize:"var(--fs-meta)",color:AV.muted,marginTop:6}}>{pctDocs}% completado</div>
            </div>
            <div className="panel" style={{background:AV.surface,border:"none"}}>
              <div style={{fontSize:"var(--fs-meta)",color:AV.muted,marginBottom:8}}>Ventas Cerradas</div>
              <div style={{fontSize:20,fontWeight:500,color:AV.text,marginBottom:4}}>{aMetas.ventasCerradas.actual}/{aMetas.ventasCerradas.target}</div>
              <div style={{height:6,background:"#111820",borderRadius:3,overflow:"hidden"}}>
                <div style={{width:Math.min(pctCierre,100)+"%",height:"100%",background:pctCierre>=100?AV.green:pctCierre>=80?AV.teal:AV.amber,transition:"width .3s"}}/>
              </div>
              <div style={{fontSize:"var(--fs-meta)",color:AV.muted,marginTop:6}}>{pctCierre}% completado</div>
            </div>
            <div className="panel" style={{background:AV.surface,border:"none"}}>
              <div style={{fontSize:"var(--fs-meta)",color:AV.muted,marginBottom:8}}>Escrituradas</div>
              <div style={{fontSize:20,fontWeight:500,color:AV.text,marginBottom:4}}>{aMetas.ventasEscritura.actual}/{aMetas.ventasEscritura.target}</div>
              <div style={{height:6,background:"#111820",borderRadius:3,overflow:"hidden"}}>
                <div style={{width:Math.min(pctEscritura,100)+"%",height:"100%",background:pctEscritura>=100?AV.green:pctEscritura>=80?AV.teal:AV.amber,transition:"width .3s"}}/>
              </div>
              <div style={{fontSize:"var(--fs-meta)",color:AV.muted,marginTop:6}}>{pctEscritura}% completado</div>
            </div>
          </div>
        </div>

        <div className="ficha-section">
          <div className="ficha-section-title">📊 Estadísticas</div>
          <div className="ficha-row"><span className="ficha-key">Leads Activos</span><span className="ficha-val">{aLeads.length}</span></div>
          <div className="ficha-row"><span className="ficha-key">Tiempo Respuesta Prom.</span><span className="ficha-val" style={{color:asesor.tiempo_resp<15?AV.teal:AV.amber}}>{asesor.tiempo_resp} min</span></div>
          <div className="ficha-row"><span className="ficha-key">Tasa de Conversión</span><span className="ficha-val">{asesor.conversion}%</span></div>
          <div className="ficha-row"><span className="ficha-key">Correo</span><span className="ficha-val" style={{fontSize:"var(--fs-meta)"}}>{asesor.email}</span></div>
          <div className="ficha-row"><span className="ficha-key">Teléfono</span><span className="ficha-val">{asesor.phone}</span></div>
        </div>

        <div style={{marginTop:20}}>
          <button className="btn" onClick={onClose} style={{width:"100%",justifyContent:"center"}}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}

// ── ELIMINAR ASESOR ───────────────────────────────────────────────────────────
function EliminarModal({asesor,leads,asesores,onClose,onConfirm,onViewLead}){
  const active=leads.filter(l=>l.asesor===asesor.name&&!["perdido","repechaje"].includes(l.stage));
  const otros=asesores.filter(a=>a.id!==asesor.id&&a.activo);
  const [modo,setModo]=useState(null);
  const [destUnico,setDestUnico]=useState("");
  const [sel,setSel]=useState({});
  const [tempDest,setTempDest]=useState("");

  if(active.length===0){
    return(
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal slide-in" onClick={e=>e.stopPropagation()}>
          <div className="modal-title">Eliminar asesor</div>
          <div className="modal-sub">¿Eliminar a <strong style={{color:AV.text}}>{asesor.name}</strong>?</div>
          <div style={{background:"rgba(45,212,191,.06)",border:"1px solid #1a8a7a",borderRadius:10,padding:"12px 16px",fontSize:"var(--fs-meta)",color:AV.textDim,marginBottom:16}}>✓ Sin leads activos. Se puede eliminar sin consecuencias.</div>
          <div style={{fontSize:"var(--fs-meta)",color:AV.muted}}>Quedará inactivo. Su historial se conserva.</div>
          <div className="modal-actions">
            <button className="btn" onClick={onClose}>Cancelar</button>
            <button className="btn btn-danger" onClick={()=>{onConfirm(asesor,{modo:"simple"});onClose();}}>Eliminar</button>
          </div>
        </div>
      </div>
    );
  }

  function toggleLead(id){setSel(s=>({...s,[id]:s[id]!==undefined?undefined:""}));}
  function toggleAll(){
    const allSel=active.every(l=>sel[l.id]!==undefined);
    if(allSel){setSel({});}else{const n={};active.forEach(l=>{n[l.id]="";});setSel(n);}
  }
  const selCount=Object.values(sel).filter(v=>v!==undefined).length;
  const selAssigned=Object.values(sel).filter(v=>v!==undefined&&v).length;
  const canConfirm=modo==="repartir"||(modo==="uno"&&destUnico)||(modo==="manual"&&selCount>0&&selAssigned===selCount);

  const modos=[
    {id:"repartir",icon:"🔄",label:"Repartir automáticamente",desc:"Se distribuyen en turno entre los demás asesores."},
    {id:"uno",     icon:"👤",label:"Asignar todos a un asesor",desc:"Elige un asesor y todos sus leads van con él."},
    {id:"manual",  icon:"☑️",label:"Selección manual",          desc:"Decide lead por lead quién los recibe. Haz click en el nombre para ver la ficha."},
  ];

  return(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg slide-in" onClick={e=>e.stopPropagation()}>
        <div className="modal-title">Eliminar asesor</div>
        <div className="modal-sub">Eliminando a <strong style={{color:AV.text}}>{asesor.name}</strong></div>

        <div style={{background:"rgba(251,113,133,.08)",border:"1px solid rgba(251,113,133,.3)",borderRadius:10,padding:"12px 16px",marginBottom:20}}>
          <div style={{fontSize:"var(--fs-meta)",fontWeight:500,color:AV.rose,marginBottom:4}}>⚠️ Este asesor tiene {active.length} lead{active.length>1?"s":""} activo{active.length>1?"s":""}</div>
          <div style={{fontSize:"var(--fs-meta)",color:AV.textDim}}>Debes decidir qué pasa con ellos antes de continuar.</div>
        </div>

        <div className="form-label" style={{marginBottom:10}}>¿Qué hacemos con sus leads?</div>
        {modos.map(m=>(
          <div key={m.id} className={`modo-opt ${modo===m.id?"active":""}`} onClick={()=>setModo(m.id)}>
            <span style={{fontSize:20}}>{m.icon}</span>
            <div style={{flex:1}}>
              <div style={{fontSize:"var(--fs-meta)",fontWeight:500,color:modo===m.id?AV.teal:AV.text}}>{m.label}</div>
              <div style={{fontSize:"var(--fs-meta)",color:AV.textDim,marginTop:2}}>{m.desc}</div>
            </div>
            {modo===m.id&&<span style={{color:AV.teal,fontSize:16}}>✓</span>}
          </div>
        ))}

        {modo==="uno"&&(
          <div className="form-group fade-in" style={{marginTop:12}}>
            <label className="form-label">Asesor destino</label>
            <select className="form-select" value={destUnico} onChange={e=>setDestUnico(e.target.value)}>
              <option value="">— Elige un asesor —</option>
              {otros.map(a=><option key={a.id} value={a.name}>{a.name} ({leads.filter(l=>l.asesor===a.name&&!["perdido","repechaje"].includes(l.stage)).length} activos)</option>)}
            </select>
          </div>
        )}

        {modo==="manual"&&(
          <div className="fade-in" style={{marginTop:12}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
              <span style={{fontSize:"var(--fs-meta)",color:AV.textDim}}>Leads de {asesor.name}</span>
              <button className="btn btn-sm" style={{marginLeft:"auto"}} onClick={toggleAll}>{active.every(l=>sel[l.id]!==undefined)?"Deseleccionar todo":"Seleccionar todo"}</button>
              {selCount>0&&(
                <div style={{display:"flex",gap:6,alignItems:"center"}}>
                  <select className="form-select" style={{width:"auto",padding:"5px 8px",fontSize:"var(--fs-meta)"}} value={tempDest} onChange={e=>setTempDest(e.target.value)}>
                    <option value="">Asignar sel. a...</option>
                    {otros.map(a=><option key={a.id} value={a.name}>{a.name}</option>)}
                  </select>
                  <button className="btn btn-sm btn-primary" disabled={!tempDest} onClick={()=>{const n={...sel};active.forEach(l=>{if(n[l.id]!==undefined)n[l.id]=tempDest;});setSel(n);}}>OK</button>
                </div>
              )}
            </div>
            {active.map(l=>{
              const isSel=sel[l.id]!==undefined;
              return(
                <div key={l.id} className={`cb-row ${isSel?"selected":""}`} onClick={()=>toggleLead(l.id)}>
                  <CB checked={isSel} onChange={()=>toggleLead(l.id)}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                      <button className="lead-link" style={{fontSize:"var(--fs-meta)"}} onClick={e=>{e.stopPropagation();onViewLead(l);}}>{l.name}</button>
                      <StageChip stage={l.stage}/>
                      <SrcBadge source={l.source}/>
                    </div>
                    <div style={{fontSize:"var(--fs-meta)",color:AV.muted,marginTop:2}}>Últ. actividad: {timeAgo(l.lastActivity)}{l.interes?` · ${l.interes}`:""}</div>
                  </div>
                  {isSel&&(
                    <select className="form-select" style={{width:150,padding:"4px 8px",fontSize:"var(--fs-meta)",flexShrink:0}} value={sel[l.id]||""} onChange={e=>{e.stopPropagation();setSel(s=>({...s,[l.id]:e.target.value}));}} onClick={e=>e.stopPropagation()}>
                      <option value="">— Destino —</option>
                      {otros.map(a=><option key={a.id} value={a.name}>{a.name}</option>)}
                    </select>
                  )}
                </div>
              );
            })}
            {selCount>0&&(
              <div style={{fontSize:"var(--fs-meta)",color:AV.teal,marginTop:6}}>
                {selCount} de {active.length} seleccionados
                {selAssigned<selCount&&<span style={{color:AV.amber}}> · {selCount-selAssigned} sin destino</span>}
              </div>
            )}
          </div>
        )}

        {modo==="repartir"&&(
          <div className="fade-in" style={{background:"rgba(45,212,191,.06)",border:"1px solid #1a8a7a",borderRadius:10,padding:"12px 16px",fontSize:"var(--fs-meta)",color:AV.textDim,marginTop:12}}>
            Se repartirán <strong style={{color:AV.text}}>{active.length} leads</strong> en turno entre: {otros.map(a=>a.name).join(", ")}.<br/>
            Cada asesor recibirá notificación por cada lead asignado.
          </div>
        )}

        <div style={{marginTop:14,padding:"10px 12px",background:AV.surface,borderRadius:8,fontSize:"var(--fs-meta)",color:AV.muted}}>
          📋 El asesor quedará inactivo. Todo su historial se conserva.
        </div>
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn btn-danger" disabled={!canConfirm} onClick={()=>{onConfirm(asesor,{modo,destUnico,sel});onClose();}}>
            Eliminar y reasignar leads
          </button>
        </div>
      </div>
    </div>
  );
}

// ── CERRAR TAREA ──────────────────────────────────────────────────────────────
function CloseTaskModal({task,onClose,onComplete}){
  const [step,setStep]=useState(0);
  const [ans,setAns]=useState({});
  const [saving,setSaving]=useState(false);

  // Steps vary by task type
  const steps=task.type==="post_visita"?[
    {q:`¿${task.lead} asistió a la visita?`,opts:[{l:"✅ Sí asistió",v:"yes"},{l:"❌ No asistió",v:"no"}],k:"asistio"},
    ...(ans.asistio==="yes"?[
      {q:"¿Cómo resultó?",opts:[{l:"Muy interesado, quiere propuesta",v:"interested"},{l:"Le gustó, necesita tiempo",v:"thinking"},{l:"Quiere visitar otra vez",v:"revisit"}],k:"resultado"},
      {q:"Siguiente paso",opts:[{l:"Enviar propuesta",v:"propuesta"},{l:"Follow-up en 48h",v:"followup"},{l:"Agendar 2da visita",v:"revisita"}],k:"next"},
    ]:[])
  ]:task.type==="followup"?[
    {q:`¿Pudiste comunicarte con ${task.lead}?`,opts:[{l:"✅ Sí, hablamos",v:"yes"},{l:"📵 No contestó",v:"no"}],k:"contacted"},
    ...(ans.contacted==="yes"?[
      {q:"¿Cómo está el interés?",opts:[{l:"Sigue interesado",v:"active"},{l:"Enfriando",v:"cold"},{l:"Quiere avanzar",v:"forward"}],k:"interes"},
    ]:[])
  ]:[
    // primer_contacto (default)
    {q:`¿Lograste contactar a ${task.lead}?`,opts:[{l:"✅ Sí, contestó",v:"yes"},{l:"📵 No contestó",v:"no"},{l:"❌ Número equivocado",v:"wrong"}],k:"contacted"},
    ...(ans.contacted==="yes"?[
      {q:"¿Cuál es su situación?",opts:[{l:"Le interesa mucho",v:"interested"},{l:"Quiere más info",v:"info"},{l:"Comparando",v:"comparing"},{l:"Quiere visitar",v:"visit"}],k:"said"},
      {q:"Siguiente paso",opts:[{l:"Agendar visita",v:"schedule"},{l:"Mandar info",v:"info"},{l:"Llamada follow-up",v:"call"},{l:"Enviar propuesta",v:"proposal"}],k:"next"},
      {q:"¿Cambias el status?",opts:[{l:"→ Contactado",v:"contactado"},{l:"→ Calificado",v:"calificado"},{l:"→ Visita Agendada",v:"visita_agendada"},{l:"Sin cambio",v:"no_change"}],k:"status"},
    ]:[])
  ];

  const cur=steps[step];
  const done=step>=steps.length;
  const red=[{l:"🚫 Ya compró con otro",v:"perdido-competencia"},{l:"😐 No le interesó",v:"perdido-no-interes"},{l:"💸 No le alcanza",v:"repechaje-presupuesto"},{l:"⏳ No ahorita (6+ meses)",v:"remarketing-timing"}];

  async function handleComplete(){
    setSaving(true);
    try{ await onComplete(ans); onClose(); }
    catch(e){ alert("Error al guardar: "+e.message); setSaving(false); }
  }

  return(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal slide-in" onClick={e=>e.stopPropagation()}>
        <div className="modal-title">Cerrar Tarea</div>
        <div className="modal-sub">{task.title} · <span style={{color:AV.teal}}>{task.lead}</span></div>
        {cur&&(
          <div style={{background:AV.surface,borderRadius:10,padding:16,marginBottom:12}}>
            <div className="flow-question">{cur.q}</div>
            <div className="flow-options">
              {cur.opts.map(o=><button key={o.v} className={`flow-opt ${ans[cur.k]===o.v?"selected":""}`}
                onClick={()=>{setAns(a=>({...a,[cur.k]:o.v}));setTimeout(()=>setStep(s=>s+1),200);}}>{o.l}</button>)}
            </div>
          </div>
        )}
        {done&&(
          <div style={{background:AV.surface,borderRadius:10,padding:16}}>
            <div className="flow-question" style={{color:AV.rose}}>⚠️ Zona Roja — si aplica:</div>
            <div className="flow-options">
              {red.map(o=><button key={o.v} className={`flow-opt red ${ans.zonaRoja===o.v?"selected":""}`}
                onClick={()=>setAns(a=>({...a,zonaRoja:a.zonaRoja===o.v?null:o.v}))}>{o.l}</button>)}
            </div>
            {ans.contacted==="no"&&<div style={{fontSize:"var(--fs-meta)",color:AV.muted,marginTop:10}}>→ Tarea de 2do intento generada.</div>}
            {ans.contacted==="wrong"&&<div style={{fontSize:"var(--fs-meta)",color:AV.muted,marginTop:10}}>→ Admin recibirá aviso de número incorrecto.</div>}
          </div>
        )}
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Cancelar</button>
          {done&&<button className="btn btn-primary" disabled={saving} onClick={handleComplete}>
            {saving?"Guardando…":"Marcar como hecha ✓"}
          </button>}
        </div>
      </div>
    </div>
  );
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
const QUALIFYING_STAGES=["calificado","visita_agendada","visita_realizada","documentacion","negociacion","apartado","escriturado","vendido"];

function semaforoColor(cplc,pct){
  if(cplc==null) return "rojo";
  if(cplc<3000&&pct>30) return "verde";
  if(cplc>8000||pct<15) return "rojo";
  return "amarillo";
}
function diagnosticoInversion(color,pct,leadsMes){
  if(color==="verde") return "Campaña funcionando correctamente.";
  const volumenAlto=leadsMes>=10;
  if(pct>30&&!volumenAlto) return "Buena calidad, falta volumen. Considera aumentar inversión.";
  if(pct<15&&volumenAlto) return "Alto volumen, baja calidad. Revisar segmentación de campaña.";
  if(pct<15&&!volumenAlto) return "Campaña ineficiente. Revisar creativos y targeting.";
  return "Resultados estables. Seguir monitoreando.";
}

const GOAL_METRICS=[
  {key:"ventas_cerradas",label:"Unidades vendidas",unit:"unidades",comparison:"gte"},
  {key:"leads_calificados",label:"Leads calificados",unit:"leads",comparison:"gte"},
  {key:"tiempo_respuesta",label:"Tiempo de primera respuesta",unit:"horas (promedio, máx.)",comparison:"lte"},
];
const GOAL_SCOPES=[
  {key:"equipo_completo",label:"Equipo completo"},
  {key:"vendedor",label:"Vendedor inhouse"},
  {key:"broker",label:"Broker externo"},
  {key:"marketing_digital",label:"Equipo de marketing digital"},
  {key:"canal",label:"Canal específico"},
];

function scopeLabel(goal,asesores,brokerOptions){
  if(goal.scope_type==="vendedor") return asesores.find(a=>a.id===goal.scope_value)?.name||"Vendedor";
  if(goal.scope_type==="broker") return brokerOptions.find(b=>b.id===goal.scope_value)?.name||"Broker";
  if(goal.scope_type==="canal") return SOURCES[goal.scope_value]?.label||goal.scope_value;
  return GOAL_SCOPES.find(s=>s.key===goal.scope_type)?.label||goal.scope_type;
}

function computeGoalProgress(goal,leads,units){
  const start=goal.period_start?new Date(goal.period_start).getTime():0;
  const end=goal.period_end?new Date(goal.period_end).getTime()+86399999:Date.now();
  const inPeriod=ts=>ts>=start&&ts<=end;
  const matchesScope=l=>{
    switch(goal.scope_type){
      case"vendedor":return l._asesorId===goal.scope_value;
      case"broker":return l._brokerId===goal.scope_value;
      case"marketing_digital":return MARKETING_SOURCES.includes(l.source);
      case"canal":return l.source===goal.scope_value;
      default:return true;
    }
  };
  let value=null;
  if(goal.metric_key==="ventas_cerradas"){
    const unitOwner=new Map();
    leads.forEach(l=>{if(l.unidad&&matchesScope(l))unitOwner.set(l.unidad,true);});
    value=units.filter(u=>u.status==="vendida"&&u.soldAt&&inPeriod(u.soldAt)&&(goal.scope_type==="equipo_completo"||unitOwner.has(u.num))).length;
  }else if(goal.metric_key==="leads_calificados"){
    value=leads.filter(l=>QUALIFYING_STAGES.includes(l.stage)&&inPeriod(l.created)&&matchesScope(l)).length;
  }else if(goal.metric_key==="tiempo_respuesta"){
    const sample=leads.filter(l=>inPeriod(l.created)&&matchesScope(l)&&l.historia&&l.historia.length>0).map(l=>(l.historia[0].ts-l.created)/3600000).filter(h=>h>=0);
    value=sample.length>0?Math.round((sample.reduce((a,b)=>a+b,0)/sample.length)*10)/10:null;
  }
  const target=Number(goal.target_value);
  const met=value!=null&&(goal.comparison==="lte"?value<=target:value>=target);
  const pct=value==null?0:goal.comparison==="lte"?(value<=target?100:Math.max(0,Math.min(100,Math.round(target/value*100)))):Math.max(0,Math.min(100,Math.round(value/target*100)));
  return{value,target,met,pct};
}

function AdminDashboard({leads,asesores,units,towers,onOpen,marketingSpend,projectConfig,goals,refreshData,insertGoal,updateGoal,deleteGoal,setView}){
  const [showSpendModal,setShowSpendModal]=useState(false);
  const [showGoalModal,setShowGoalModal]=useState(false);
  const [editGoal,setEditGoal]=useState(null);
  const brokerOptions=Array.from(new Map(leads.filter(l=>l._brokerId).map(l=>[l._brokerId,{id:l._brokerId,name:l.broker}])).values());
  const now=new Date();
  const monthStart=new Date(now.getFullYear(),now.getMonth(),1).getTime();
  const prevMonthStart=new Date(now.getFullYear(),now.getMonth()-1,1).getTime();
  const monthKey=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-01`;

  // Sección A — avance del proyecto
  const totalUnidades=units.length;
  const vendidasTotal=units.filter(u=>u.status==="vendida").length;
  const pctVendido=totalUnidades>0?Math.round(vendidasTotal/totalUnidades*100):null;
  const metaTotal=projectConfig?.meta_ventas_total?.target??null;
  const pctHaciaMeta=metaTotal>0?Math.round(vendidasTotal/metaTotal*100):null;
  const tickPct=metaTotal>0&&totalUnidades>0?Math.min(100,Math.round(metaTotal/totalUnidades*100)):null;

  // Sección B — funnel de ventas
  const vendidasEsteMes=units.filter(u=>u.soldAt&&u.soldAt>=monthStart).length;
  const vendidasMesAnterior=units.filter(u=>u.soldAt&&u.soldAt>=prevMonthStart&&u.soldAt<monthStart).length;
  const enEscrituracion=units.filter(u=>u.escrituraStatus==="en_proceso").length;
  const apartadasCount=units.filter(u=>u.status==="apartada").length;
  const enNegociacion=leads.filter(l=>l.stage==="negociacion").length;
  const enDocumentacion=leads.filter(l=>l.stage==="documentacion").length;
  const visitasRealizadasMes=leads.filter(l=>l.stage==="visita_realizada"&&l.lastActivity>=monthStart).length;
  const visitasAgendadas=leads.filter(l=>l.stage==="visita_agendada").length;
  const leadsCalificados=leads.filter(l=>l.stage==="calificado").length;
  const leadsContactados=leads.filter(l=>l.stage==="contactado").length;

  // Sección C — torres
  const towerCards=towers.map(t=>{
    const letter=(t.name||"").replace("Torre ","");
    const us=units.filter(u=>u.torre===letter);
    return{
      ...t,letter,
      total:us.length,
      disponibles:us.filter(u=>u.status==="disponible").length,
      apartadas:us.filter(u=>u.status==="apartada").length,
      vendidas:us.filter(u=>u.status==="vendida").length,
      bloqueadas:us.filter(u=>u.status==="bloqueada").length,
      escrituradas:us.filter(u=>["completada","en_proceso"].includes(u.escrituraStatus)).length,
      entregadas:us.filter(u=>u.entregadaAt!=null).length,
    };
  });

  // Sección D1 — leads por fuente
  const sourceIntel=MARKETING_SOURCES.map(src=>{
    const all=leads.filter(l=>l.source===src);
    const last30=all.filter(l=>l.created>=get30DaysAgo());
    const cal=all.filter(l=>QUALIFYING_STAGES.includes(l.stage));
    return{source:src,label:SOURCES[src]?.label||src,color:SOURCES[src]?.color||AV.slate,total:all.length,total30:last30.length,pctCal:all.length>0?Math.round(cal.length/all.length*100):null};
  }).filter(s=>s.total>0).sort((a,b)=>b.total-a.total);

  // Sección D2 — semáforo de inversión
  const inversionIntel=MARKETING_SOURCES.map(src=>{
    const spend=marketingSpend.find(m=>m.source===src&&m.month===monthKey);
    if(!spend||Number(spend.amount)<=0) return null;
    const leadsMes=leads.filter(l=>l.source===src&&l.created>=monthStart).length;
    const calMes=leads.filter(l=>l.source===src&&l.created>=monthStart&&QUALIFYING_STAGES.includes(l.stage)).length;
    const pct=leadsMes>0?Math.round(calMes/leadsMes*100):0;
    const cpl=leadsMes>0?Math.round(Number(spend.amount)/leadsMes):null;
    const cplc=calMes>0?Math.round(Number(spend.amount)/calMes):null;
    const color=semaforoColor(cplc,pct);
    return{source:src,label:SOURCES[src]?.label||src,amount:Number(spend.amount),pct,cpl,cplc,color,diag:diagnosticoInversion(color,pct,leadsMes)};
  }).filter(Boolean);

  return(
    <>
      <div className="progress-strip">
        <div className="progress-strip-top">
          <span className="progress-strip-title">Avance del Proyecto</span>
          <span className="progress-strip-pct">{pctVendido!=null?`${pctVendido}% vendido`:"(sin info)"}{pctHaciaMeta!=null&&<span style={{color:AV.muted,fontSize:14,marginLeft:10}}>· {pctHaciaMeta}% hacia meta</span>}</span>
        </div>
        <div className="progress-strip-track">
          <div className="progress-strip-fill" style={{width:`${pctVendido??0}%`}}/>
          {tickPct!=null&&<div className="progress-strip-tick" style={{left:`${tickPct}%`}}/>}
        </div>
        <div className="progress-strip-sub">{vendidasTotal} de {totalUnidades} unidades vendidas{metaTotal?` · Meta: ${metaTotal} unidades`:""}</div>
      </div>

      <div className="section-title">Torres</div>
      <div className="tower-grid">
        {towerCards.map(t=>(
          <div key={t.id} className="tower-mini">
            <div className="tower-mini-head">
              <span className="tower-mini-name">Torre {t.letter}</span>
              <span className={`tower-badge tower-badge-${t.status}`}>{t.status==="preventa"?"Preventa":t.status==="en_venta"?"En Venta":"Entregada"}</span>
            </div>
            <div className="tower-progress-track"><div className="tower-progress-fill" style={{width:`${t.total>0?Math.round(t.vendidas/t.total*100):0}%`}}/></div>
            <div className="tower-mini-stats">
              <span>Entregada {t.entregadas}/{t.total}</span>
              <span>Escriturada {t.escrituradas}/{t.total}</span>
              <span>Vendida {t.vendidas}/{t.total}</span>
            </div>
            {(t.status==="en_venta"||(t.status==="preventa"&&t.vendidas>0))&&(
              <div className="tower-mini-stats" style={{marginTop:4}}>
                <span>Disponibles {t.disponibles}</span>
                <span>Apartadas {t.apartadas}</span>
                <span>Bloqueadas {t.bloqueadas}</span>
              </div>
            )}
            {t.status==="preventa"&&t.vendidas===0&&<div className="tower-note">Aún no disponible para venta</div>}
          </div>
        ))}
      </div>

      <div className="section-title" style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <span>Metas y Objetivos</span>
        <button className="btn" style={{padding:"4px 10px",fontSize:"var(--fs-meta)"}} onClick={()=>{setEditGoal(null);setShowGoalModal(true);}}>+ Nueva meta</button>
      </div>
      {goals.length===0?(
        <div className="panel" style={{marginBottom:24}}><div className="panel-body" style={{fontSize:"var(--fs-meta)",color:AV.muted}}>Sin metas configuradas. Usa "+ Nueva meta" para definir objetivos de ventas, leads calificados o tiempo de respuesta.</div></div>
      ):(
        <div className="goal-grid">
          {goals.map(g=>{
            const prog=computeGoalProgress(g,leads,units);
            const metric=GOAL_METRICS.find(m=>m.key===g.metric_key);
            return(
              <div key={g.id} className="goal-card" style={{opacity:g.active?1:.5}}>
                <div className="goal-card-head">
                  <span className="goal-card-title">{g.title}</span>
                  <span className={`goal-status goal-status-${prog.met?"met":prog.pct>=50?"warn":"behind"}`}>{prog.met?"Cumplida":prog.pct>=50?"En curso":"Atrasada"}</span>
                </div>
                <div className="goal-card-sub">{scopeLabel(g,asesores,brokerOptions)} · {metric?.label}</div>
                <div className="tower-progress-track"><div className="tower-progress-fill" style={{width:`${prog.pct}%`,background:prog.met?AV.green:prog.pct>=50?AV.amber:AV.rose}}/></div>
                <div className="goal-card-sub" style={{marginTop:6}}>
                  {prog.value==null?"Sin datos":g.metric_key==="tiempo_respuesta"?`${prog.value}h promedio (meta: ${g.comparison==="lte"?"≤":"≥"}${prog.target}h)`:`${prog.value} / ${prog.target} ${metric?.unit||""}`}
                </div>
                <div className="goal-card-sub" style={{marginTop:4}}>{g.period_start}{g.period_end?` → ${g.period_end}`:" (sin fecha límite)"}{g.recurring==="mensual"?" · Mensual":""}</div>
                <div style={{display:"flex",gap:8,marginTop:8}}>
                  <button className="btn" style={{padding:"3px 8px",fontSize:11}} onClick={()=>{setEditGoal(g);setShowGoalModal(true);}}>Editar</button>
                  <button className="btn" style={{padding:"3px 8px",fontSize:11}} onClick={()=>updateGoal(g.id,{active:!g.active}).then(refreshData)}>{g.active?"Pausar":"Activar"}</button>
                  <button className="btn" style={{padding:"3px 8px",fontSize:11,color:AV.rose}} onClick={()=>{if(confirm("¿Eliminar esta meta?"))deleteGoal(g.id).then(refreshData);}}>Eliminar</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="section-title">Funnel de Ventas</div>
      <div className="funnel-grid">
        <div className="stat-card"><div className="stat-label">Vendidas Este Mes</div><div className="stat-value stat-value-hero stat-accent">{vendidasEsteMes}</div><div className="stat-sub">Unidades</div></div>
        <div className="stat-card"><div className="stat-label">Vendidas Mes Anterior</div><div className="stat-value stat-value-hero">{vendidasMesAnterior}</div><div className="stat-sub">Unidades</div></div>
        <div className="stat-card"><div className="stat-label">En Escrituración</div><div className="stat-value stat-value-hero stat-warn">{enEscrituracion}</div><div className="stat-sub">Unidades</div></div>
        <div className="stat-card"><div className="stat-label">Apartadas</div><div className="stat-value">{apartadasCount}</div><div className="stat-sub">Unidades</div></div>
        <div className="stat-card"><div className="stat-label">En Negociación</div><div className="stat-value">{enNegociacion}</div><div className="stat-sub">Leads</div></div>
        <div className="stat-card"><div className="stat-label">En Documentación</div><div className="stat-value">{enDocumentacion}</div><div className="stat-sub">Leads</div></div>
        <div className="stat-card"><div className="stat-label">Visitas Realizadas (mes)</div><div className="stat-value">{visitasRealizadasMes}</div><div className="stat-sub">Leads</div></div>
        <div className="stat-card"><div className="stat-label">Visitas Agendadas</div><div className="stat-value">{visitasAgendadas}</div><div className="stat-sub">Leads</div></div>
        <div className="stat-card"><div className="stat-label">Leads Calificados</div><div className="stat-value">{leadsCalificados}</div><div className="stat-sub">Leads</div></div>
        <div className="stat-card"><div className="stat-label">Leads Contactados</div><div className="stat-value">{leadsContactados}</div><div className="stat-sub">Leads</div></div>
      </div>

      <div className="section-title">Inteligencia de Marketing</div>
      <div className="two-col">
        <div className="panel">
          <div className="panel-header"><span>📊</span><div className="panel-title">Leads por Fuente</div></div>
          <div className="panel-body">
            {sourceIntel.length===0?(
              <div style={{fontSize:"var(--fs-meta)",color:AV.muted}}>(sin info)</div>
            ):sourceIntel.map(s=>(
              <div key={s.source} className="report-bar-wrap">
                <div className="report-bar-label"><span style={{color:AV.text}}>{s.label}</span><span style={{color:AV.textDim}}>{s.total} leads ({s.total30} en 30d) · {s.pctCal??0}% califican</span></div>
                <div className="report-bar-bg"><div className="report-bar-fill" style={{width:`${s.pctCal??0}%`,background:s.color}}/></div>
              </div>
            ))}
          </div>
        </div>
        <div className="panel">
          <div className="panel-header"><span>🚦</span><div className="panel-title">Semáforo de Inversión</div><button className="btn" style={{marginLeft:"auto",padding:"4px 10px",fontSize:"var(--fs-meta)"}} onClick={()=>setShowSpendModal(true)}>+ Registrar inversión</button></div>
          <div className="panel-body">
            {inversionIntel.length===0?(
              <div style={{fontSize:"var(--fs-meta)",color:AV.muted}}>Sin inversión registrada este mes. Usa "Registrar inversión" para empezar a medir CPL/CPLC.</div>
            ):inversionIntel.map(s=>(
              <div key={s.source} className="semaforo-card">
                <div className="semaforo-head">
                  <div className={`semaforo-dot semaforo-dot-${s.color}`}/>
                  <strong style={{color:AV.text,fontSize:"var(--fs-meta)"}}>{s.label}</strong>
                </div>
                <div className="semaforo-metrics">
                  <span>Inversión: ${s.amount.toLocaleString("es-MX")}</span>
                  <span>CPL: {s.cpl!=null?`$${s.cpl.toLocaleString("es-MX")}`:"(sin leads)"}</span>
                  <span>CPLC: {s.cplc!=null?`$${s.cplc.toLocaleString("es-MX")}`:"(sin calificados)"}</span>
                  <span>{s.pct}% califican</span>
                </div>
                <div className="semaforo-diag">{s.diag}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showSpendModal&&<RegistrarInversionModal onClose={()=>setShowSpendModal(false)} onSaved={refreshData}/>}
      {showGoalModal&&<GoalModal goal={editGoal} asesores={asesores} brokerOptions={brokerOptions} onClose={()=>setShowGoalModal(false)} onSaved={refreshData} insertGoal={insertGoal} updateGoal={updateGoal}/>}
    </>
  );
}

function GoalModal({goal,asesores,brokerOptions,onClose,onSaved,insertGoal,updateGoal}){
  const [title,setTitle]=useState(goal?.title||"");
  const [metricKey,setMetricKey]=useState(goal?.metric_key||GOAL_METRICS[0].key);
  const [scopeType,setScopeType]=useState(goal?.scope_type||"equipo_completo");
  const [scopeValue,setScopeValue]=useState(goal?.scope_value||"");
  const [targetValue,setTargetValue]=useState(goal?.target_value??"");
  const [periodStart,setPeriodStart]=useState(goal?.period_start||new Date().toISOString().slice(0,10));
  const [periodEnd,setPeriodEnd]=useState(goal?.period_end||"");
  const [recurring,setRecurring]=useState(goal?.recurring||"");
  const [saving,setSaving]=useState(false);

  const needsScopeValue=["vendedor","broker","canal"].includes(scopeType);
  const metric=GOAL_METRICS.find(m=>m.key===metricKey);

  const handleSave=async()=>{
    setSaving(true);
    try{
      const payload={
        title,metric_key:metricKey,scope_type:scopeType,
        scope_value:needsScopeValue?scopeValue:null,
        target_value:Number(targetValue),
        comparison:metric.comparison,
        period_start:periodStart,
        period_end:periodEnd||null,
        recurring:recurring||null,
      };
      if(goal)await updateGoal(goal.id,payload);
      else await insertGoal({...payload,active:true});
      await onSaved();
      onClose();
    }finally{
      setSaving(false);
    }
  };

  return(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal slide-in" onClick={e=>e.stopPropagation()}>
        <div className="modal-title">{goal?"Editar Meta":"Nueva Meta"}</div>
        <div className="modal-sub">Define un objetivo medible para el equipo, un vendedor, un broker o un canal específico.</div>
        <div className="form-group">
          <div className="form-label">Título</div>
          <input className="form-input" type="text" value={title} onChange={e=>setTitle(e.target.value)} placeholder="Ej. Vender 10 departamentos antes del 5 de noviembre"/>
        </div>
        <div className="form-row">
          <div className="form-group">
            <div className="form-label">Métrica</div>
            <select className="form-select" value={metricKey} onChange={e=>setMetricKey(e.target.value)}>
              {GOAL_METRICS.map(m=><option key={m.key} value={m.key}>{m.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <div className="form-label">Objetivo ({metric.unit})</div>
            <input className="form-input" type="number" min="0" step="0.1" value={targetValue} onChange={e=>setTargetValue(e.target.value)} placeholder="0"/>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <div className="form-label">Aplica a</div>
            <select className="form-select" value={scopeType} onChange={e=>{setScopeType(e.target.value);setScopeValue("");}}>
              {GOAL_SCOPES.map(s=><option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
          {needsScopeValue&&(
            <div className="form-group">
              <div className="form-label">{scopeType==="vendedor"?"Vendedor":scopeType==="broker"?"Broker":"Canal"}</div>
              <select className="form-select" value={scopeValue} onChange={e=>setScopeValue(e.target.value)}>
                <option value="">Selecciona...</option>
                {scopeType==="vendedor"&&asesores.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
                {scopeType==="broker"&&brokerOptions.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
                {scopeType==="canal"&&MARKETING_SOURCES.map(s=><option key={s} value={s}>{SOURCES[s]?.label||s}</option>)}
              </select>
            </div>
          )}
        </div>
        <div className="form-row">
          <div className="form-group">
            <div className="form-label">Fecha inicio</div>
            <input className="form-input" type="date" value={periodStart} onChange={e=>setPeriodStart(e.target.value)}/>
          </div>
          <div className="form-group">
            <div className="form-label">Fecha límite (opcional)</div>
            <input className="form-input" type="date" value={periodEnd} onChange={e=>setPeriodEnd(e.target.value)}/>
          </div>
        </div>
        <div className="form-group">
          <div className="form-label">Recurrencia</div>
          <select className="form-select" value={recurring} onChange={e=>setRecurring(e.target.value)}>
            <option value="">Única (sin repetir)</option>
            <option value="mensual">Mensual</option>
          </select>
        </div>
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" disabled={!title||!targetValue||(needsScopeValue&&!scopeValue)||saving} onClick={handleSave}>{saving?"Guardando...":"Guardar"}</button>
        </div>
      </div>
    </div>
  );
}

function RegistrarInversionModal({onClose,onSaved}){
  const now=new Date();
  const defaultMonth=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
  const [source,setSource]=useState(MARKETING_SOURCES[0]);
  const [month,setMonth]=useState(defaultMonth);
  const [amount,setAmount]=useState("");
  const [notes,setNotes]=useState("");
  const [saving,setSaving]=useState(false);

  const handleSave=async()=>{
    setSaving(true);
    try{
      await upsertMarketingSpend(source,`${month}-01`,Number(amount),notes);
      await onSaved();
      onClose();
    }finally{
      setSaving(false);
    }
  };

  return(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal slide-in" onClick={e=>e.stopPropagation()}>
        <div className="modal-title">Registrar Inversión Mensual</div>
        <div className="modal-sub">Captura el gasto de marketing por fuente y mes para calcular CPL/CPLC.</div>
        <div className="form-row">
          <div className="form-group">
            <div className="form-label">Fuente</div>
            <select className="form-select" value={source} onChange={e=>setSource(e.target.value)}>
              {MARKETING_SOURCES.map(s=><option key={s} value={s}>{SOURCES[s]?.label||s}</option>)}
            </select>
          </div>
          <div className="form-group">
            <div className="form-label">Mes</div>
            <input className="form-input" type="month" value={month} onChange={e=>setMonth(e.target.value)}/>
          </div>
        </div>
        <div className="form-group">
          <div className="form-label">Monto invertido (MXN)</div>
          <input className="form-input" type="number" min="0" step="1" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0"/>
        </div>
        <div className="form-group">
          <div className="form-label">Notas (opcional)</div>
          <input className="form-input" type="text" value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Campaña, observaciones..."/>
        </div>
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" disabled={!amount||saving} onClick={handleSave}>{saving?"Guardando...":"Guardar"}</button>
        </div>
      </div>
    </div>
  );
}

// ── PIPELINE ──────────────────────────────────────────────────────────────────
function AdminPipeline({leads,onOpen,setView}){
  const ps=STAGES.filter(s=>!["repechaje","perdido"].includes(s.id));
  const [filterStage,setFilterStage]=useState(null);
  const displayLeads=filterStage?leads.filter(l=>l.stage===filterStage):leads;
  const ds=STAGES.find(s=>s.id===filterStage);

  if(filterStage){
    return(
      <div>
        <button className="btn" onClick={()=>setFilterStage(null)} style={{marginBottom:16}}>← Volver al Pipeline</button>
        <div style={{fontSize:18,fontWeight:500,color:AV.text,marginBottom:16}}>
          <StageChip stage={filterStage}/> ({displayLeads.length} leads)
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12}}>
          {displayLeads.map(l=>(
            <div key={l.id} className="panel" style={{cursor:"pointer"}} onClick={()=>onOpen(l)}>
              <div className="panel-body">
                <div style={{fontSize:"var(--fs-body)",fontWeight:500,color:AV.text,marginBottom:8}}><LeadLink lead={l} onOpen={onOpen}/></div>
                <div style={{display:"flex",gap:8,marginBottom:8,flexWrap:"wrap"}}>
                  <SrcBadge source={l.source}/>
                  {l.interes&&<span style={{fontSize:"var(--fs-meta)",color:AV.textDim}}>{l.interes}</span>}
                </div>
                <div style={{fontSize:"var(--fs-meta)",color:AV.muted}}>Asesor: {l.asesor||"Sin asignar"}</div>
                <div style={{fontSize:"var(--fs-meta)",color:AV.muted,marginTop:4}}>Entrada: {timeAgo(l.created)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return(
    <>
      <div style={{marginBottom:16}}>
        <div className="panel" style={{padding:"10px 16px",display:"flex",gap:24,alignItems:"center"}}>
          {["repechaje","perdido"].map(s=>(
            <button key={s} onClick={()=>setFilterStage(s)} style={{display:"flex",gap:8,alignItems:"center",background:"none",border:"none",cursor:"pointer",padding:0}}>
              <StageChip stage={s}/>
              <span style={{fontSize:"var(--fs-meta)",color:AV.textDim}}>{leads.filter(l=>l.stage===s).length}</span>
            </button>
          ))}
          <div style={{marginLeft:"auto",fontSize:"var(--fs-meta)",color:AV.muted}}>Fuera del pipeline activo</div>
        </div>
      </div>
      <div className="pipeline-scroll" style={{height:"calc(100vh - 280px)"}}>
        {ps.map(stage=>{
          const sl=leads.filter(l=>l.stage===stage.id);
          return(
            <div key={stage.id} className="pipeline-col">
              <div className="pipeline-col-header"><div className="col-dot" style={{background:stage.dot}}/><div className="col-name">{stage.label}</div><div className="col-count">{sl.length}</div></div>
              {sl.map(l=>(
                <div key={l.id} className="lead-card" onClick={()=>onOpen(l)}>
                  <LeadLink lead={l} onOpen={onOpen}/>
                  <div className="lead-meta"><SrcBadge source={l.source}/>{l.interes&&<span style={{color:AV.textDim}}>{l.interes}</span>}</div>
                  {l.asesor&&<div style={{fontSize:"var(--fs-meta)",color:AV.muted,marginTop:4}}>{l.asesor}</div>}
                  <div className={`lead-timer ${timerClass(l.lastActivity)}`}>{stage.id==="nuevo"?`⏱ Hace ${timeAgo(l.created)}`:`Últ. ${timeAgo(l.lastActivity)}`}</div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </>
  );
}

// ── TODOS LOS LEADS ───────────────────────────────────────────────────────────
function AdminLeads({leads,onOpen}){
  const [sortBy,setSortBy]=useState("entrada");
  const [sortDir,setSortDir]=useState("desc");
  const toggleSort=(field)=>{
    if(sortBy===field){setSortDir(d=>d==="asc"?"desc":"asc");}else{setSortBy(field);setSortDir("asc");}
  };
  const sortedLeads=[...leads].sort((a,b)=>{
    let av,bv;
    if(sortBy==="nombre"){av=a.name;bv=b.name;}
    else if(sortBy==="fuente"){av=a.source;bv=b.source;}
    else if(sortBy==="interes"){av=a.interes||"";bv=b.interes||"";}
    else if(sortBy==="estado"){av=a.stage;bv=b.stage;}
    else if(sortBy==="asesor"){av=a.asesor||"";bv=b.asesor||"";}
    else if(sortBy==="entrada"){av=a.created;bv=b.created;}
    else if(sortBy==="actividad"){av=a.lastActivity;bv=b.lastActivity;}
    if(typeof av==="string"){return sortDir==="asc"?av.localeCompare(bv):bv.localeCompare(av);}
    return sortDir==="asc"?av-bv:bv-av;
  });
  const ThHeader=({label,field})=>(
    <th style={{cursor:"pointer",userSelect:"none"}} onClick={()=>toggleSort(field)}>
      {label} {sortBy===field?<span style={{color:AV.teal}}>{sortDir==="asc"?"↑":"↓"}</span>:""}
    </th>
  );
  return(
    <div className="panel">
      <div className="panel-header"><div className="panel-title">Todos los leads — {leads.length} registros</div></div>
      <div className="panel-body" style={{padding:0}}>
        <table>
          <thead><tr><ThHeader label="Lead" field="nombre"/><ThHeader label="Fuente" field="fuente"/><ThHeader label="Interés" field="interes"/><ThHeader label="Estado" field="estado"/><ThHeader label="Asesor" field="asesor"/><ThHeader label="Entrada" field="entrada"/><ThHeader label="Últ. actividad" field="actividad"/></tr></thead>
          <tbody>
            {sortedLeads.map(l=>(
              <tr key={l.id} style={{cursor:"pointer"}} onClick={()=>onOpen(l)}>
                <td><LeadLink lead={l} onOpen={onOpen}/><div style={{fontSize:"var(--fs-meta)",color:AV.muted}}>{l.phone}</div></td>
                <td><SrcBadge source={l.source}/></td>
                <td style={{color:AV.textDim}}>{l.interes||"—"}</td>
                <td><StageChip stage={l.stage}/></td>
                <td style={{fontSize:"var(--fs-meta)",color:AV.textDim}}>{l.asesor||<span style={{color:AV.rose}}>Sin asignar</span>}</td>
                <td style={{fontSize:"var(--fs-meta)",color:AV.muted}}>{timeAgo(l.created)}</td>
                <td style={{fontSize:"var(--fs-meta)",color:AV.muted}}>{timeAgo(l.lastActivity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── EQUIPO ────────────────────────────────────────────────────────────────────
function AdminEquipo({leads,asesores,refreshData,onOpen}){
  const [showAdd,setShowAdd]=useState(false);
  const [editA,setEditA]=useState(null);
  const [delA,setDelA]=useState(null);
  const [fichaInModal,setFichaInModal]=useState(null);
  const [perfilAsesor,setPerfilAsesor]=useState(null);
  const active=asesores.filter(a=>a.activo).sort((a,b)=>a.turno-b.turno);
  const inactive=asesores.filter(a=>!a.activo);

  async function addAsesor(f){
    const maxT=asesores.filter(a=>a.activo).reduce((m,a)=>Math.max(m,a.turno),0);
    await insertAsesor({name:f.name,email:f.email,phone:f.phone,turno:maxT+1});
    await refreshData();
  }
  async function editAsesor(f){await updateAsesor(editA.id,{name:f.name,email:f.email,phone:f.phone});await setAsesorCanBlockUnits(editA.id,f.canBlockUnits);await refreshData();}
  async function delAsesor(a){await setAsesorActivo(a.id,false);await refreshData();}
  async function moveTurno(idx,dir){
    const newIdx=idx+dir;if(newIdx<0||newIdx>=active.length)return;
    const a=active[idx],b=active[newIdx];
    await swapTurnos(a.id,a.turno,b.id,b.turno);
    await refreshData();
  }

  return(
    <>
      <div className="two-col">
        <div className="panel">
          <div className="panel-header"><span>🔄</span><div className="panel-title">Turno de asignación</div></div>
          <div className="panel-body">
            <div style={{fontSize:"var(--fs-meta)",color:AV.textDim,marginBottom:12}}>Leads digitales y web se asignan en este orden.</div>
            {active.map((a,i)=>(
              <div key={a.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:`1px solid ${AV.border}`}}>
                <div style={{width:24,height:24,borderRadius:"50%",background:AV.tealGlow,border:`1px solid ${AV.tealDim}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"var(--fs-meta)",color:AV.teal,fontWeight:700}}>{i+1}</div>
                <div className="user-avatar" style={{fontSize:"var(--fs-meta)"}}>{ini(a.name)}</div>
                <div style={{flex:1,fontSize:"var(--fs-meta)",color:AV.text}}>{a.name}</div>
                <div style={{display:"flex",gap:4}}>
                  <button className="btn btn-sm" disabled={i===0} onClick={()=>moveTurno(i,-1)}>↑</button>
                  <button className="btn btn-sm" disabled={i===active.length-1} onClick={()=>moveTurno(i,1)}>↓</button>
                </div>
              </div>
            ))}
            <div style={{marginTop:12,padding:"10px 12px",background:AV.surface,borderRadius:8,fontSize:"var(--fs-meta)",color:AV.muted}}>📌 Brokers externos NO entran en este turno.</div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header"><span>👤</span><div className="panel-title">Asesores inhouse</div><button className="btn btn-primary btn-sm" onClick={()=>setShowAdd(true)}>+ Agregar</button></div>
          <div className="panel-body" style={{display:"flex",flexDirection:"column",gap:10}}>
            {active.map(a=>{
              const aLeads=leads.filter(l=>l.asesor===a.name&&!["perdido","repechaje"].includes(l.stage));
              return(
                <div key={a.id} className="asesor-card" style={{cursor:"pointer",transition:"all .2s"}} onClick={()=>setPerfilAsesor(a)} onMouseEnter={e=>e.currentTarget.style.borderColor=AV.teal} onMouseLeave={e=>e.currentTarget.style.borderColor=AV.border}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                    <div className="user-avatar">{ini(a.name)}</div>
                    <div style={{flex:1}}><div style={{fontSize:"var(--fs-meta)",fontWeight:500,color:AV.text}}>{a.name}</div><div style={{fontSize:"var(--fs-meta)",color:AV.muted}}>{a.email}</div></div>
                    <div style={{display:"flex",gap:6}}>
                      <button className="btn btn-sm" onClick={e=>{e.stopPropagation();setEditA(a);}}>Editar</button>
                      <button className="btn btn-sm btn-danger" onClick={e=>{e.stopPropagation();setDelA(a);}}>Eliminar</button>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:16,fontSize:"var(--fs-meta)",flexWrap:"wrap"}}>
                    <span><span style={{color:AV.muted}}>Leads: </span><span style={{fontWeight:500}}>{aLeads.length}</span></span>
                    <span><span style={{color:AV.muted}}>T. resp: </span><span style={{color:parseInt(a.tiempo_resp)<15?AV.teal:AV.amber}}>{a.tiempo_resp}</span></span>
                    <span><span style={{color:AV.muted}}>Conv: </span><span style={{color:parseFloat(a.conversion)>15?AV.teal:AV.amber}}>{a.conversion}</span></span>
                    <span><span style={{color:AV.muted}}>Turno: </span><span style={{color:AV.teal}}>#{a.turno}</span></span>
                  </div>
                </div>
              );
            })}
            {inactive.length>0&&(<>
              <div style={{fontSize:"var(--fs-meta)",color:AV.muted,textTransform:"uppercase",letterSpacing:".1em",marginTop:8}}>Inactivos</div>
              {inactive.map(a=>(
                <div key={a.id} className="asesor-card inactive">
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div className="user-avatar" style={{opacity:.5}}>{ini(a.name)}</div>
                    <div style={{flex:1}}><div style={{fontSize:"var(--fs-meta)",color:AV.textDim}}>{a.name}</div><div style={{fontSize:"var(--fs-meta)",color:AV.muted}}>Inactivo · historial conservado</div></div>
                    <span className="chip chip-inactivo">Inactivo</span>
                  </div>
                </div>
              ))}
            </>)}
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header"><span>🏢</span><div className="panel-title">Brokers externos</div><button className="btn btn-sm">+ Registrar broker</button></div>
        <div className="panel-body" style={{padding:0}}>
          <table>
            <thead><tr><th>Broker / Agencia</th><th>Estado</th><th>Leads enviados</th><th>En seguimiento</th><th>Modo</th></tr></thead>
            <tbody>
              <tr>
                <td><strong>InverCasas MTY</strong><br/><span style={{fontSize:"var(--fs-meta)",color:AV.muted}}>Monterrey, NL</span></td>
                <td><span className="chip chip-calificado">Activo</span></td>
                <td>1</td><td>Rodrigo Peña</td>
                <td><span style={{fontSize:"var(--fs-meta)",color:AV.textDim}}>Solo envía leads</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {showAdd&&<AsesorModal onClose={()=>setShowAdd(false)} onSave={addAsesor}/>}
      {editA&&<AsesorModal asesor={editA} onClose={()=>setEditA(null)} onSave={editAsesor}/>}
      {delA&&<EliminarModal asesor={delA} leads={leads} asesores={asesores} onClose={()=>setDelA(null)} onConfirm={(a,cfg)=>delAsesor(a)} onViewLead={l=>{setDelA(null);setFichaInModal(l);}}/>}
      {fichaInModal&&<FichaModal lead={fichaInModal} onClose={()=>setFichaInModal(null)} asesores={asesores} onReassign={async(id,aid,old,nw)=>{await reassignLeadAsesor(id,aid,old,nw,"Admin");await refreshData();}}/>}
      {perfilAsesor&&<AsesorPerfilModal asesor={perfilAsesor} leads={leads} onClose={()=>setPerfilAsesor(null)}/>}
    </>
  );
}

// ── INVENTARIO ────────────────────────────────────────────────────────────────
function AdminInventario({units,towers,refreshData}){
  const [selected,setSelected]=useState(null);
  const [addingTo,setAddingTo]=useState(null); // tower id for new unit
  const towerOrder=["A","B","C"];
  const sortedTowers=[...towers].sort((a,b)=>(a.order_index??99)-(b.order_index??99));

  const statusLabel={disponible:"🟢 Disponible",apartada:"🟡 Apartada",bloqueada:"🔴 Bloqueada",vendida:"⚫ Vendida"};
  const statusColor={disponible:AV.teal,apartada:AV.amber,bloqueada:AV.rose,vendida:AV.muted};

  return(
    <>
      <div className="stats-grid">
        {[["Disponibles","disponible",AV.teal],["Apartadas","apartada",AV.amber],["Bloqueadas","bloqueada",AV.rose],["Vendidas","vendida",AV.muted]].map(([l,s,c])=>(
          <div key={s} className="stat-card"><div className="stat-label">{l}</div><div className="stat-value" style={{color:c}}>{units.filter(u=>u.status===s).length}</div></div>
        ))}
      </div>

      {sortedTowers.map(t=>{
        const letter=(t.name||"").replace("Torre ","");
        const towerUnits=units.filter(u=>u.torre===letter);
        return(
          <div key={t.id} className="panel" style={{marginBottom:16}}>
            <div className="panel-header">
              <span>🏗️</span>
              <div className="panel-title">{t.name}</div>
              <span className={`tower-badge tower-badge-${t.status}`} style={{marginLeft:8}}>
                {t.status==="preventa"?"Preventa":t.status==="en_venta"?"En Venta":"Entregada"}
              </span>
              <span style={{marginLeft:"auto",fontSize:"var(--fs-meta)",color:AV.muted}}>
                {towerUnits.filter(u=>u.status==="vendida").length}/{towerUnits.length} vendidas
              </span>
              <button className="btn btn-sm" style={{marginLeft:12}} onClick={()=>setAddingTo(t)}>+ Nueva unidad</button>
            </div>
            <div className="panel-body">
              {towerUnits.length===0?(
                <div style={{fontSize:"var(--fs-meta)",color:AV.muted}}>Sin unidades registradas. Agrega la primera.</div>
              ):(
                <div className="units-grid">
                  {towerUnits.map(u=>(
                    <div key={u.num} className="unit-card" style={{cursor:"pointer"}} onClick={()=>setSelected(u)}>
                      <div className="unit-num">{u.num}</div>
                      <div className="unit-model">{u.model||"—"}</div>
                      {(u.habitaciones||u.banos)&&(
                        <div style={{fontSize:10,color:AV.textDim}}>
                          {u.habitaciones?`${u.habitaciones} rec`:""}{u.habitaciones&&u.banos?" · ":""}{u.banos?`${u.banos} baños`:""}
                        </div>
                      )}
                      {u.m2&&<div style={{fontSize:10,color:AV.muted}}>{u.m2} m²</div>}
                      <div style={{fontSize:10,color:AV.muted}}>{u.price?`$${(u.price/1000000).toFixed(1)}M`:""}</div>
                      <div className={`unit-status us-${u.status}`}>{statusLabel[u.status]||u.status}</div>
                      {u.compradorNombre&&<div style={{fontSize:10,color:AV.textDim,marginTop:2}}>{u.compradorNombre}</div>}
                      {u.entregadaAt&&<div style={{fontSize:10,color:AV.green,marginTop:2}}>✓ Entregada</div>}
                      {u.escrituraStatus==="completada"&&!u.entregadaAt&&<div style={{fontSize:10,color:AV.teal,marginTop:2}}>✓ Escriturada</div>}
                      {u.vence&&<div style={{fontSize:10,color:AV.rose,marginTop:2}}>Vence {u.vence}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {selected&&<UnitAdminModal unit={selected} onClose={()=>setSelected(null)} onSaved={()=>{setSelected(null);refreshData();}}/>}
      {addingTo&&<NewUnitModal tower={addingTo} onClose={()=>setAddingTo(null)} onSaved={()=>{setAddingTo(null);refreshData();}}/>}
    </>
  );
}

function UnitAdminModal({unit,onClose,onSaved}){
  const [model,setModel]=useState(unit.model||"");
  const [price,setPrice]=useState(unit.price||"");
  const [m2,setM2]=useState(unit.m2??"");
  const [habitaciones,setHabitaciones]=useState(unit.habitaciones??"");
  const [banos,setBanos]=useState(unit.banos??"");
  const [description,setDescription]=useState(unit.description||"");
  const [notes,setNotes]=useState(unit.notes||"");
  const [vendedorBlockAllowed,setVendedorBlockAllowed]=useState(unit.vendedorBlockAllowed);
  const [compradorNombre,setCompradorNombre]=useState(unit.compradorNombre||"");
  const [saving,setSaving]=useState(false);
  const [blockReason,setBlockReason]=useState("");
  const [blockType,setBlockType]=useState("temporal");
  const [blockUntil,setBlockUntil]=useState("");
  const [working,setWorking]=useState(false);
  const [confirmDelete,setConfirmDelete]=useState(false);

  const handleSaveFields=async()=>{
    setSaving(true);
    try{
      await updateUnit(unit._id,{model,price:Number(price),m2,habitaciones,banos,description,notes,vendedorBlockAllowed,compradorNombre});
      onSaved();
    }finally{setSaving(false);}
  };

  const handleSetStatus=async(newStatus)=>{
    setWorking(true);
    try{
      const now=new Date().toISOString();
      const fields={status:newStatus};
      if(newStatus==="vendida"&&!unit.soldAt) fields.soldAt=now;
      if(newStatus==="disponible"){fields.soldAt=null;fields.escrituraStatus=null;fields.escrituraCompletedAt=null;fields.entregadaAt=null;fields.compradorNombre=null;}
      if(newStatus==="apartada"&&unit.status==="bloqueada"){fields.soldAt=null;}
      await updateUnit(unit._id,fields);
      onSaved();
    }finally{setWorking(false);}
  };

  const handleSetEscritura=async(val)=>{
    setWorking(true);
    try{
      const fields={escrituraStatus:val};
      if(val==="completada") fields.escrituraCompletedAt=new Date().toISOString();
      await updateUnit(unit._id,fields);
      onSaved();
    }finally{setWorking(false);}
  };

  const handleMarcarEntregada=async()=>{
    setWorking(true);
    try{
      await updateUnit(unit._id,{entregadaAt:new Date().toISOString()});
      onSaved();
    }finally{setWorking(false);}
  };

  const handleBlock=async()=>{
    setWorking(true);
    try{
      const until=blockType==="temporal"&&blockUntil?new Date(`${blockUntil}T23:59:59`).toISOString():null;
      await blockUnit(unit._id,blockReason,until);
      onSaved();
    }finally{setWorking(false);}
  };

  const handleUnblock=async()=>{
    setWorking(true);
    try{await unblockUnit(unit._id);onSaved();}finally{setWorking(false);}
  };

  const handleDelete=async()=>{
    setWorking(true);
    try{await deleteUnit(unit._id);onSaved();}finally{setWorking(false);}
  };

  const statusFlow=[
    {key:"disponible",label:"Disponible",color:AV.teal},
    {key:"apartada",label:"Apartada",color:AV.amber},
    {key:"vendida",label:"Vendida",color:"#94a3b8"},
  ];

  return(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg slide-in" onClick={e=>e.stopPropagation()}>
        <div className="modal-title">Unidad {unit.num} · Torre {unit.torre}</div>
        <div className="modal-sub">Edita los datos y gestiona el ciclo de vida de esta propiedad.</div>

        {/* Estado actual + flujo */}
        <div style={{background:AV.surface,borderRadius:10,padding:14,marginBottom:16}}>
          <div style={{fontSize:"var(--fs-meta)",fontWeight:500,color:AV.text,marginBottom:10}}>Estado de la unidad</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
            {statusFlow.map(s=>(
              <button key={s.key} className="btn btn-sm" disabled={working||unit.status===s.key}
                style={{background:unit.status===s.key?s.color:"transparent",color:unit.status===s.key?"#0d1117":s.color,border:`1px solid ${s.color}`,fontWeight:unit.status===s.key?600:400}}
                onClick={()=>handleSetStatus(s.key)}>
                {s.label}
              </button>
            ))}
          </div>

          {unit.status==="vendida"&&(
            <>
              <div style={{fontSize:"var(--fs-meta)",color:AV.textDim,marginBottom:10}}>Vendida el {unit.soldAt?new Date(unit.soldAt).toLocaleDateString("es-MX"):"-"}</div>
              <div className="form-group" style={{marginBottom:10}}>
                <label className="form-label">Comprador</label>
                <input className="form-input" value={compradorNombre} onChange={e=>setCompradorNombre(e.target.value)} placeholder="Nombre del comprador"/>
              </div>
              {unit.lead&&<div style={{fontSize:"var(--fs-meta)",color:AV.textDim,marginBottom:10}}>Lead vinculado: <strong style={{color:AV.text}}>{unit.lead}</strong></div>}
              <div style={{fontSize:"var(--fs-meta)",fontWeight:500,color:AV.text,marginBottom:8}}>Escritura</div>
              <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"}}>
                {[["pendiente","Pendiente"],["en_proceso","En proceso"],["completada","Completada"]].map(([v,l])=>(
                  <button key={v} className="btn btn-sm" disabled={working||unit.escrituraStatus===v}
                    style={{background:unit.escrituraStatus===v?AV.teal:"transparent",color:unit.escrituraStatus===v?"#0d1117":AV.teal,border:`1px solid ${AV.teal}`}}
                    onClick={()=>handleSetEscritura(v)}>{l}</button>
                ))}
              </div>
              {unit.escrituraStatus==="completada"&&!unit.entregadaAt&&(
                <button className="btn btn-sm btn-primary" disabled={working} onClick={handleMarcarEntregada}>✓ Marcar como Entregada</button>
              )}
              {unit.entregadaAt&&<div style={{fontSize:"var(--fs-meta)",color:AV.green}}>✓ Entregada el {new Date(unit.entregadaAt).toLocaleDateString("es-MX")}</div>}
            </>
          )}

          {unit.status==="bloqueada"&&(
            <div style={{marginTop:8}}>
              <div style={{fontSize:"var(--fs-meta)",color:AV.textDim}}>Bloqueada por: {unit.blockedBy||"—"} {unit.blockedReason?`· ${unit.blockedReason}`:""}</div>
              <div style={{fontSize:"var(--fs-meta)",color:AV.textDim}}>{unit.bloqueoExpiraAt?`Vence: ${unit.vence}`:"Bloqueo permanente"}</div>
              <button className="btn btn-sm" style={{marginTop:8}} disabled={working} onClick={handleUnblock}>Desbloquear</button>
            </div>
          )}

          {unit.status!=="bloqueada"&&unit.status!=="vendida"&&(
            <div style={{marginTop:8,borderTop:`1px solid ${AV.border}`,paddingTop:12}}>
              <div style={{fontSize:"var(--fs-meta)",fontWeight:500,color:AV.text,marginBottom:8}}>🔒 Bloquear</div>
              {unit.status!=="disponible"&&<div style={{fontSize:"var(--fs-meta)",color:AV.amber,marginBottom:8}}>Unidad {unit.status}. El admin puede bloquearla igualmente.</div>}
              <div className="form-group"><label className="form-label">Motivo</label><input className="form-input" value={blockReason} onChange={e=>setBlockReason(e.target.value)} placeholder="Motivo del bloqueo..."/></div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Tipo</label>
                  <select className="form-select" value={blockType} onChange={e=>setBlockType(e.target.value)}>
                    <option value="temporal">Temporal</option>
                    <option value="permanente">Permanente</option>
                  </select>
                </div>
                {blockType==="temporal"&&<div className="form-group"><label className="form-label">Hasta</label><input className="form-input" type="date" value={blockUntil} onChange={e=>setBlockUntil(e.target.value)}/></div>}
              </div>
              <button className="btn" disabled={working||!blockReason||(blockType==="temporal"&&!blockUntil)} onClick={handleBlock}>{working?"Bloqueando...":"Bloquear unidad"}</button>
            </div>
          )}
        </div>

        {/* Datos de la propiedad */}
        <div style={{background:AV.surface,borderRadius:10,padding:14,marginBottom:16}}>
          <div style={{fontSize:"var(--fs-meta)",fontWeight:500,color:AV.text,marginBottom:12}}>Información de la propiedad</div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Modelo / Tipo</label><input className="form-input" value={model} onChange={e=>setModel(e.target.value)} placeholder="2 Recámaras, Penthouse..."/></div>
            <div className="form-group"><label className="form-label">Precio (MXN)</label><input className="form-input" type="number" min="0" value={price} onChange={e=>setPrice(e.target.value)}/></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">m²</label><input className="form-input" type="number" min="0" step="0.1" value={m2} onChange={e=>setM2(e.target.value)} placeholder="85"/></div>
            <div className="form-group"><label className="form-label">Recámaras</label><input className="form-input" type="number" min="0" max="10" value={habitaciones} onChange={e=>setHabitaciones(e.target.value)} placeholder="2"/></div>
            <div className="form-group"><label className="form-label">Baños</label><input className="form-input" type="number" min="0" step="0.5" max="10" value={banos} onChange={e=>setBanos(e.target.value)} placeholder="2"/></div>
          </div>
          <div className="form-group"><label className="form-label">Descripción</label><textarea className="form-input" rows={2} value={description} onChange={e=>setDescription(e.target.value)} placeholder="Vista, acabados, orientación, nivel..."/></div>
          <div className="form-group"><label className="form-label">Notas internas</label><textarea className="form-input" rows={2} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Notas solo para el equipo..."/></div>
          <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:"var(--fs-meta)",color:AV.text,marginTop:4}}>
            <input type="checkbox" checked={vendedorBlockAllowed} onChange={e=>setVendedorBlockAllowed(e.target.checked)}/>
            Vendedores con permiso pueden bloquear esta unidad
          </label>
          <div className="modal-actions" style={{marginTop:14}}>
            <button className="btn btn-primary" disabled={saving} onClick={handleSaveFields}>{saving?"Guardando...":"Guardar cambios"}</button>
          </div>
        </div>

        <div className="modal-actions" style={{justifyContent:"space-between"}}>
          {!confirmDelete?(
            <button className="btn" style={{color:AV.rose,fontSize:"var(--fs-meta)"}} onClick={()=>setConfirmDelete(true)}>Eliminar unidad</button>
          ):(
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontSize:"var(--fs-meta)",color:AV.rose}}>¿Eliminar {unit.num}?</span>
              <button className="btn" style={{color:AV.rose}} disabled={working} onClick={handleDelete}>Sí, eliminar</button>
              <button className="btn" onClick={()=>setConfirmDelete(false)}>Cancelar</button>
            </div>
          )}
          <button className="btn" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}

function NewUnitModal({tower,onClose,onSaved}){
  const [number,setNumber]=useState("");
  const [model,setModel]=useState("");
  const [m2,setM2]=useState("");
  const [habitaciones,setHabitaciones]=useState("");
  const [banos,setBanos]=useState("");
  const [price,setPrice]=useState("");
  const [description,setDescription]=useState("");
  const [saving,setSaving]=useState(false);

  const handleSave=async()=>{
    if(!number.trim()) return;
    setSaving(true);
    try{
      await insertUnit({towerId:tower.id,number:number.trim(),model:model.trim(),price:price?Number(price):null,m2:m2?Number(m2):null,habitaciones:habitaciones?Number(habitaciones):null,banos:banos?Number(banos):null,description:description.trim()});
      onSaved();
    }finally{setSaving(false);}
  };

  return(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal slide-in" onClick={e=>e.stopPropagation()}>
        <div className="modal-title">Nueva Unidad — {tower.name}</div>
        <div className="modal-sub">Proyecto Aqua Vivant · {tower.name}</div>
        <div className="form-group"><label className="form-label">Número de unidad *</label><input className="form-input" value={number} onChange={e=>setNumber(e.target.value)} placeholder={`${(tower.name||"").replace("Torre ","")||"X"}-01`}/></div>
        <div className="form-group"><label className="form-label">Modelo / Tipo</label><input className="form-input" value={model} onChange={e=>setModel(e.target.value)} placeholder="2 Recámaras, Penthouse, Studio..."/></div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">m²</label><input className="form-input" type="number" min="0" step="0.1" value={m2} onChange={e=>setM2(e.target.value)} placeholder="85"/></div>
          <div className="form-group"><label className="form-label">Precio (MXN)</label><input className="form-input" type="number" min="0" value={price} onChange={e=>setPrice(e.target.value)} placeholder="3500000"/></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Recámaras</label><input className="form-input" type="number" min="0" max="10" value={habitaciones} onChange={e=>setHabitaciones(e.target.value)} placeholder="2"/></div>
          <div className="form-group"><label className="form-label">Baños</label><input className="form-input" type="number" min="0" step="0.5" max="10" value={banos} onChange={e=>setBanos(e.target.value)} placeholder="2"/></div>
        </div>
        <div className="form-group"><label className="form-label">Descripción</label><textarea className="form-input" rows={2} value={description} onChange={e=>setDescription(e.target.value)} placeholder="Vista, orientación, nivel, acabados..."/></div>
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" disabled={saving||!number.trim()} onClick={handleSave}>{saving?"Guardando...":"Agregar unidad"}</button>
        </div>
      </div>
    </div>
  );
}

// ── NOTIFICACIONES ────────────────────────────────────────────────────────────
function AdminNotifs({leads,asesores,units,dismissed,dismiss,setView}){
  const metrics=calcMetrics(leads,units,asesores);
  const alertUrgentes=dismissed.includes("urgentes")?[]:metrics.urgentes;
  const alertBloqueos=dismissed.includes("bloqueos")?[]:metrics.bloqueosVencidos;
  const alertAsesores=metrics.asesoresAtrasados.filter(a=>a.asesor!=="Sin asignar"&&!dismissed.includes(`asesor_${a.asesor}`));
  const alertSilenciosas=metrics.fuentesSilenciosas.filter(f=>!dismissed.includes(`silenciosa_${f.source}`));
  const alertBajaCalidad=metrics.fuentesBajaCalidad.filter(f=>!dismissed.includes(`baja_${f.source}`));
  const sinPendientes=alertUrgentes.length===0&&alertBloqueos.length===0&&alertAsesores.length===0&&alertSilenciosas.length===0&&alertBajaCalidad.length===0;
  return(
    <div className="panel">
      <div className="panel-header"><span>⚡</span><div className="panel-title">Acción Inmediata</div></div>
      <div className="panel-body">
        <div className="action-panel" style={{margin:0}}>
          {sinPendientes?(
            <div className="action-ok">✓ Todo bajo control — sin pendientes urgentes en este momento</div>
          ):(
            <>
              {alertUrgentes.length>0&&(
                <div className="action-row">
                  <div className="action-dot" style={{background:AV.rose}}/>
                  <div className="action-text">
                    <strong>{alertUrgentes.length} lead{alertUrgentes.length>1?"s":""}</strong> sin contactar en +30 min
                    <div className="action-btns">
                      <button className="btn btn-sm btn-primary" onClick={()=>setView("leads")}>Resolver</button>
                      <button className="btn btn-sm" onClick={()=>dismiss("urgentes")}>Marcar resuelto</button>
                    </div>
                  </div>
                </div>
              )}
              {alertBloqueos.length>0&&(
                <div className="action-row">
                  <div className="action-dot" style={{background:AV.rose}}/>
                  <div className="action-text">
                    <strong>{alertBloqueos.length} bloqueo{alertBloqueos.length>1?"s":""} vencido{alertBloqueos.length>1?"s":""}</strong> — unidad{alertBloqueos.length>1?"es":""}: {alertBloqueos.map(u=>u.num).join(", ")}
                    <div className="action-btns">
                      <button className="btn btn-sm btn-primary" onClick={()=>setView("inventario")}>Resolver</button>
                      <button className="btn btn-sm" onClick={()=>dismiss("bloqueos")}>Marcar resuelto</button>
                    </div>
                  </div>
                </div>
              )}
              {alertAsesores.map(a=>(
                <div className="action-row" key={a.asesor}>
                  <div className="action-dot" style={{background:AV.amber}}/>
                  <div className="action-text">
                    <strong>{a.asesor}</strong> tiene {a.leads.length} lead{a.leads.length>1?"s":""} sin seguimiento hace más de {STALE_HOURS}h
                    <div className="action-btns">
                      <button className="btn btn-sm btn-primary" onClick={()=>setView("equipo")}>Ir a Equipo & Turnos</button>
                      <button className="btn btn-sm" onClick={()=>dismiss(`asesor_${a.asesor}`)}>Marcar resuelto</button>
                    </div>
                  </div>
                </div>
              ))}
              {alertSilenciosas.map(f=>(
                <div className="action-row" key={f.source}>
                  <div className="action-dot" style={{background:AV.amber}}/>
                  <div className="action-text">
                    <strong>{f.label}</strong> lleva {f.dias} días sin generar leads nuevos
                    <div className="action-btns">
                      <button className="btn btn-sm" onClick={()=>dismiss(`silenciosa_${f.source}`)}>Enterado</button>
                    </div>
                  </div>
                </div>
              ))}
              {alertBajaCalidad.map(f=>(
                <div className="action-row" key={f.source}>
                  <div className="action-dot" style={{background:AV.amber}}/>
                  <div className="action-text">
                    <strong>{f.label}</strong> — {f.total} leads recibidos, solo {f.pct}% están calificando
                    <div className="action-btns">
                      <button className="btn btn-sm" onClick={()=>dismiss(`baja_${f.source}`)}>Enterado</button>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── ASESOR TAREAS ─────────────────────────────────────────────────────────────
const PIPELINE_STAGES_SET=new Set(["nuevo","contactado","calificado","visita_agendada","visita_realizada","documentacion","negociacion","apartado","escriturado"]);

function computeTareas(leads,currentUser,projectConfig){
  const now=Date.now();
  const primerContactoMs=(Number(projectConfig?.crm_tiempo_primer_contacto_min??30))*60000;
  const seguimientoMs=(Number(projectConfig?.crm_intervalo_intentos_horas??24))*3600000;
  const isAdmin=currentUser?.role==="admin";
  const myLeads=leads.filter(l=>{
    if(!PIPELINE_STAGES_SET.has(l.stage))return false;
    if(isAdmin)return true;
    return l._asesorId===currentUser?.id;
  });
  const tasks=[];
  myLeads.forEach(l=>{
    const sinAct=now-l.lastActivity;
    if(l.stage==="nuevo"&&sinAct>=primerContactoMs){
      tasks.push({id:`contacto_${l.id}`,type:"primer_contacto",title:"Primer contacto",lead:l.name,leadId:l.id,
        desc:`Entró hace ${timeAgo(l.created)} por ${SOURCES[l.source]?.label||l.source}.`,
        urgency:"urgent",time:timeAgo(l.lastActivity)});
    }
    if(["contactado","calificado","negociacion"].includes(l.stage)&&sinAct>=seguimientoMs){
      tasks.push({id:`seguimiento_${l.id}`,type:"followup",title:"Seguimiento",lead:l.name,leadId:l.id,
        desc:`Sin actividad hace ${timeAgo(l.lastActivity)}.`,
        urgency:"normal",time:timeAgo(l.lastActivity)});
    }
    if(l.stage==="visita_agendada"&&l.fechaCita){
      const diff=now-l.fechaCita;
      if(diff>=12*3600000&&diff<=72*3600000){
        tasks.push({id:`postvisita_${l.id}`,type:"post_visita",title:"Post-visita",lead:l.name,leadId:l.id,
          desc:`La visita fue hace ${timeAgo(l.fechaCita)}.`,
          urgency:"urgent",time:timeAgo(l.fechaCita)});
      }
    }
  });
  return tasks;
}

function AsesorTareas({leads,onOpen,currentUser,projectConfig,refreshData}){
  const [activeTask,setActiveTask]=useState(null);
  const [completed,setCompleted]=useState(new Set());
  const allTasks=computeTareas(leads,currentUser,projectConfig).filter(t=>!completed.has(t.id));
  const urgent=allTasks.filter(t=>t.urgency==="urgent");
  const normal=allTasks.filter(t=>t.urgency==="normal");

  async function handleComplete(ans){
    const task=activeTask;
    const now=new Date().toISOString();
    let newStage=undefined;
    let newFechaCita=undefined;
    let action="";
    let nota="";

    if(task.type==="primer_contacto"){
      if(ans.contacted==="yes"){
        newStage=ans.status&&ans.status!=="no_change"?ans.status:"contactado";
        action="Primer contacto realizado";
        nota=`Situación: ${ans.said||"—"} · Siguiente: ${ans.next||"—"}`;
      }else if(ans.contacted==="no"){
        action="Intento de contacto — sin respuesta";
        nota="No contestó";
      }else{
        action="Número incorrecto";
        nota="Número equivocado reportado";
      }
    }else if(task.type==="post_visita"){
      if(ans.asistio==="yes"){
        newStage="visita_realizada";
        action="Visita realizada";
        nota=ans.resultado||"";
      }else{
        newStage="calificado";
        newFechaCita=null;
        action="Cliente no asistió a visita";
        nota="Fecha de cita limpiada";
      }
    }else{
      action="Seguimiento realizado";
      nota=ans.contacted==="yes"?`Interés: ${ans.interes||"—"}`:"Sin respuesta";
    }
    if(ans.zonaRoja){
      const[newS,razon]=ans.zonaRoja.split("-");
      newStage=newS==="remarketing"?"repechaje":newS;
      nota+=(nota?" · ":"")+`Zona roja: ${razon}`;
    }
    await updateLeadStage(task.leadId,{stage:newStage,fechaCita:newFechaCita,lastActivityAt:now,action,nota,by:currentUser?.name||"Asesor"});
    setCompleted(s=>new Set([...s,task.id]));
    await refreshData();
  }

  function TaskSec({title,color,items}){
    if(!items.length)return null;
    return(
      <div className="panel full-row">
        <div className="panel-header"><div className="panel-title" style={{color}}>{title}</div></div>
        <div className="panel-body">
          <div className="tasks-list">
            {items.map(t=>(
              <div key={t.id} className={`task-item ${t.urgency}`} onClick={()=>setActiveTask(t)}>
                <div className="task-icon">{TASK_ICONS[t.type]||"📋"}</div>
                <div className="task-info">
                  <div className="task-title">{t.title}</div>
                  <button className="task-lead-link" onClick={e=>{e.stopPropagation();const l=leads.find(l=>l.id===t.leadId);if(l)onOpen(l);}}>Ver ficha de {t.lead} →</button>
                  <div className="task-desc">{t.desc}</div>
                </div>
                <div className={`task-time ${t.urgency==="urgent"?"urgent":""}`}>{t.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  return(
    <>
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-label">Urgentes</div><div className="stat-value stat-danger">{urgent.length}</div><div className="stat-sub">Contactar ahora</div></div>
        <div className="stat-card"><div className="stat-label">Para hoy</div><div className="stat-value stat-warn">{normal.length}</div></div>
        <div className="stat-card"><div className="stat-label">Completadas</div><div className="stat-value stat-accent">{completed.size}</div><div className="stat-sub">Esta sesión</div></div>
        <div className="stat-card"><div className="stat-label">Total activas</div><div className="stat-value">{allTasks.length}</div></div>
      </div>
      {allTasks.length===0&&<div className="action-ok">✓ Sin tareas pendientes por ahora</div>}
      <TaskSec title="🔴 Urgentes — Atender ahora" color={AV.rose} items={urgent}/>
      <TaskSec title="Para hoy" color={AV.text} items={normal}/>
      {completed.size>0&&<div style={{padding:"10px 0",fontSize:"var(--fs-meta)",color:AV.muted,textAlign:"center"}}>✓ {completed.size} tarea{completed.size>1?"s":""} completada{completed.size>1?"s":""}</div>}
      {activeTask&&<CloseTaskModal task={activeTask} onClose={()=>setActiveTask(null)} onComplete={handleComplete}/>}
    </>
  );
}

// ── MIS LEADS ─────────────────────────────────────────────────────────────────
function AsesorMisLeads({leads,onOpen,currentUser}){
  const mis=leads.filter(l=>l.asesor===currentUser?.name);
  return(
    <div className="panel">
      <div className="panel-header"><div className="panel-title">Mis leads</div><span style={{fontSize:"var(--fs-meta)",color:AV.muted}}>{mis.length} asignados</span></div>
      <div className="panel-body" style={{padding:0}}>
        <table>
          <thead><tr><th>Lead</th><th>Fuente</th><th>Interés</th><th>Estado</th><th>Últ. actividad</th></tr></thead>
          <tbody>
            {mis.map(l=>(
              <tr key={l.id}>
                <td><LeadLink lead={l} onOpen={onOpen}/><div style={{fontSize:"var(--fs-meta)",color:AV.muted}}>{l.phone}</div></td>
                <td><SrcBadge source={l.source}/></td>
                <td style={{color:AV.textDim}}>{l.interes||"—"}</td>
                <td><StageChip stage={l.stage}/></td>
                <td style={{fontSize:"var(--fs-meta)",color:AV.muted}}>{timeAgo(l.lastActivity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function VendedorInventario({units,currentUser,canBlock,refreshData}){
  const [blocking,setBlocking]=useState(null);
  return(
    <>
      <div className="stats-grid">
        {[["Disponibles","disponible",AV.teal],["Apartadas","apartada",AV.amber],["Bloqueadas","bloqueada",AV.rose],["Vendidas","vendida",AV.muted]].map(([l,s,c])=>(
          <div key={s} className="stat-card"><div className="stat-label">{l}</div><div className="stat-value" style={{color:c}}>{units.filter(u=>u.status===s).length}</div></div>
        ))}
      </div>
      {!canBlock&&<div style={{fontSize:"var(--fs-meta)",color:AV.muted,marginBottom:14}}>No tienes permiso para bloquear propiedades. Pídeselo a un administrador si lo necesitas.</div>}
      <div className="panel">
        <div className="panel-header"><span>🏗️</span><div className="panel-title">Inventario</div></div>
        <div className="panel-body">
          <div className="units-grid">
            {units.map(u=>{
              const blockedByMe=u.status==="bloqueada"&&u.blockedBy===currentUser?.name;
              const canBlockThis=canBlock&&u.status==="disponible"&&u.vendedorBlockAllowed;
              return(
                <div key={u.num} className="unit-card">
                  <div className="unit-num">{u.num}</div>
                  <div className="unit-model">{u.model}</div>
                  <div style={{fontSize:"var(--fs-meta)",color:AV.muted}}>${(u.price/1000000).toFixed(1)}M</div>
                  <div className={`unit-status us-${u.status}`}>
                    {u.status==="disponible"&&"🟢 Disponible"}{u.status==="apartada"&&"🟡 Apartada"}{u.status==="bloqueada"&&"🔴 Bloqueada"}{u.status==="vendida"&&"⚫ Vendida"}
                  </div>
                  {u.status==="bloqueada"&&<div style={{fontSize:11,color:AV.textDim,marginTop:2}}>{blockedByMe?"Bloqueada por ti":`Por: ${u.blockedBy||"—"}`}{u.vence?` · vence ${u.vence}`:" · permanente"}</div>}
                  {canBlockThis&&<button className="btn" style={{marginTop:6,padding:"3px 8px",fontSize:11}} onClick={()=>setBlocking(u)}>Bloquear</button>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {blocking&&<VendedorBlockModal unit={blocking} onClose={()=>setBlocking(null)} onSaved={refreshData}/>}
    </>
  );
}

function VendedorBlockModal({unit,onClose,onSaved}){
  const [reason,setReason]=useState("");
  const [until,setUntil]=useState("");
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState("");

  const handleBlock=async()=>{
    setSaving(true);setError("");
    try{
      await blockUnit(unit._id,reason,new Date(`${until}T23:59:59`).toISOString());
      await onSaved();
      onClose();
    }catch(e){
      setError(e.message||"No se pudo bloquear la unidad.");
    }finally{setSaving(false);}
  };

  return(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal slide-in" onClick={e=>e.stopPropagation()}>
        <div className="modal-title">Bloquear Unidad {unit.num}</div>
        <div className="modal-sub">El bloqueo de vendedores es siempre temporal. El administrador puede desbloquearla cuando lo necesite.</div>
        <div className="form-group"><label className="form-label">Motivo</label><input className="form-input" value={reason} onChange={e=>setReason(e.target.value)} placeholder="Ej. Cliente en proceso de decisión"/></div>
        <div className="form-group"><label className="form-label">Hasta</label><input className="form-input" type="date" value={until} onChange={e=>setUntil(e.target.value)}/></div>
        {error&&<div style={{fontSize:"var(--fs-meta)",color:AV.rose,marginBottom:8}}>{error}</div>}
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" disabled={!reason||!until||saving} onClick={handleBlock}>{saving?"Bloqueando...":"Bloquear"}</button>
        </div>
      </div>
    </div>
  );
}

// ── ROOT ──────────────────────────────────────────────────────────────────────
export default function AquaVivantCRM(){
  const [currentUser,setCurrentUser]=useState(null);
  const [sessionLoading,setSessionLoading]=useState(true);
  const [view,setView]=useState("dashboard");
  const [leads,setLeads]=useState([]);
  const [asesores,setAsesores]=useState([]);
  const [units,setUnits]=useState([]);
  const [towers,setTowers]=useState([]);
  const [marketingSpend,setMarketingSpend]=useState([]);
  const [projectConfig,setProjectConfig]=useState({});
  const [goals,setGoals]=useState([]);
  const [dataLoading,setDataLoading]=useState(false);
  const [showNewLead,setShowNewLead]=useState(false);
  const [ficha,setFicha]=useState(null);
  const [dismissedAlerts,setDismissedAlerts]=useState([]);
  const dismissAlert=(key)=>setDismissedAlerts(d=>[...d,key]);
  const [showMobileSidebar,setShowMobileSidebar]=useState(false);
  const [showProfileModal,setShowProfileModal]=useState(false);
  const [showChat,setShowChat]=useState(false);
  const [chatMessages,setChatMessages]=useState([{type:"bot",text:"Hola, soy tu asistente de IA. ¿En qué puedo ayudarte?"}]);

  const role=currentUser?.role||"admin";
  const [isMobile,setIsMobile]=useState(typeof window!=="undefined"&&window.innerWidth<768);

  useEffect(()=>{
    function onResize(){setIsMobile(window.innerWidth<768);}
    window.addEventListener("resize",onResize);
    window.addEventListener("orientationchange",onResize);
    return()=>{window.removeEventListener("resize",onResize);window.removeEventListener("orientationchange",onResize);};
  },[]);

  useEffect(()=>{
    let active=true;
    async function loadProfile(session){
      if(!session){if(active)setCurrentUser(null);return;}
      try{
        const profile=await fetchProfileByAuthUserId(session.user.id);
        if(active)setCurrentUser(profile);
      }catch{
        if(active)setCurrentUser(null);
      }
    }
    supabase.auth.getSession().then(({data})=>{loadProfile(data.session).finally(()=>{if(active)setSessionLoading(false);});});
    const {data:listener}=supabase.auth.onAuthStateChange((_event,session)=>{loadProfile(session);});
    return()=>{active=false;listener.subscription.unsubscribe();};
  },[]);

  const refreshData=async()=>{
    const [l,a,u,t,ms,pc,g]=await Promise.all([fetchLeads(),fetchAsesores(),fetchUnits(),fetchTowers(),fetchMarketingSpend(),fetchProjectConfig(),fetchGoals()]);
    setLeads(l);setAsesores(a);setUnits(u);setTowers(t);setMarketingSpend(ms);setProjectConfig(pc);setGoals(g);
  };

  useEffect(()=>{
    if(!currentUser){setLeads([]);setAsesores([]);setUnits([]);setTowers([]);setMarketingSpend([]);setProjectConfig({});setGoals([]);return;}
    let active=true;
    setDataLoading(true);
    refreshData().finally(()=>{if(active)setDataLoading(false);});
    return()=>{active=false;};
  },[currentUser?.id]);

  useEffect(()=>setView(role==="admin"?"dashboard":"tareas"),[role]);

  // Badge de notificaciones: conteo real de alertas activas (descontando descartadas)
  const _nm=calcMetrics(leads,units,asesores);
  const notifCount=(
    (dismissedAlerts.includes("urgentes")||_nm.urgentes.length===0?0:1)+
    (dismissedAlerts.includes("bloqueos")||_nm.bloqueosVencidos.length===0?0:1)+
    _nm.asesoresAtrasados.filter(a=>a.asesor!=="Sin asignar"&&!dismissedAlerts.includes(`asesor_${a.asesor}`)).length+
    _nm.fuentesSilenciosas.filter(f=>!dismissedAlerts.includes(`silenciosa_${f.source}`)).length+
    _nm.fuentesBajaCalidad.filter(f=>!dismissedAlerts.includes(`baja_${f.source}`)).length
  );

  const adminNav=[
    {s:"Principal"},{id:"dashboard",label:"Dashboard",icon:"◈"},{id:"notificaciones",label:"Notificaciones",icon:"🔔",badge:notifCount>0?String(notifCount):null},
    {s:"Pipeline"},{id:"pipeline",label:"Pipeline",icon:"⟶"},{id:"leads",label:"Todos los leads",icon:"◉"},
    {s:"Administración"},{id:"equipo",label:"Equipo & Turnos",icon:"⚡"},{id:"inventario",label:"Inventario",icon:"🏗️"},
  ];
  const vendedorNav=[{s:"Mi día"},{id:"tareas",label:"Mis Tareas",icon:"✓"},{id:"mis_leads",label:"Mis Leads",icon:"◉"},{s:"Información"},{id:"inventario",label:"Inventario",icon:"🏗️"}];
  const navItems=role==="admin"?adminNav:vendedorNav;
  const titles={dashboard:"Dashboard",notificaciones:"Notificaciones",pipeline:"Pipeline de ventas",leads:"Todos los leads",equipo:"Equipo & Asignaciones",inventario:"Inventario de unidades",tareas:"Mis tareas del día",mis_leads:"Mis leads"};

  async function addLead(f){
    let asignado=null;
    if(f.asesor){
      asignado=asesores.find(a=>a.name===f.asesor)||null;
    }else{
      const activeA=asesores.filter(a=>a.activo).sort((a,b)=>a.turno-b.turno);
      if(activeA.length>0){
        // Round-robin: assign to active vendedor with fewest open leads
        const counts=activeA.map(a=>({a,n:leads.filter(l=>l._asesorId===a.id&&!["perdido","repechaje"].includes(l.stage)).length}));
        asignado=counts.sort((x,y)=>x.n-y.n)[0].a;
      } else {
        // No active vendedores: assign to admin
        asignado={id:currentUser?.id};
      }
    }
    await insertLead({name:f.name,phone:f.phone,source:f.source,campaign:f.campaign,interes:f.interes,notes:f.notes,asesorId:asignado?.id||null,authorName:currentUser?.name||"Sistema"});
    await refreshData();
  }

  async function handleReassignLead(leadId,newAsesorId,oldName,newName){
    await reassignLeadAsesor(leadId,newAsesorId,oldName,newName,currentUser?.name||"Admin");
    await refreshData();
    setFicha(f=>f?{...f,asesor:newName,_asesorId:newAsesorId}:f);
  }

  async function handleLogout(){
    await supabase.auth.signOut();
  }

  if(sessionLoading){
    return<><style>{css}</style><div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",color:AV.muted}}>Cargando…</div></>;
  }

  return(
    <>
      <style>{css}</style>
      {!currentUser?<LoginModal onLogin={()=>{}}/>:(
      <div className="crm-root">
        <aside className={`sidebar${isMobile&&!showMobileSidebar?" hidden":""}`}>
          {isMobile?(
            <>
              <div className="sidebar-user" style={{cursor:"pointer",borderBottom:`1px solid #1f2d3d`,padding:"16px",display:"flex",gap:"12px",alignItems:"center"}} onClick={()=>{setShowMobileSidebar(false);setTimeout(()=>setShowProfileModal(true),100);}}>
                <div className="user-avatar" style={{background:currentUser?.photo?`url(${currentUser.photo}) center/cover`:"",width:50,height:50,minWidth:50}}>
                  {!currentUser?.photo&&ini(currentUser?.name||"")}
                </div>
                <div style={{flex:1}}>
                  <div className="user-name">{currentUser?.name||""}</div>
                  <div className="user-role" style={{fontSize:"12px"}}>{role==="admin"?"Administrador":role==="vendedor"?"Vendedor":"Broker"}</div>
                </div>
              </div>
              <nav className="sidebar-nav">
                {navItems.filter(item=>!item.s).map(item=>(
                  <div key={item.id} className={`nav-item ${view===item.id?"active":""}`} onClick={()=>{setView(item.id);setShowMobileSidebar(false);}}><span className="nav-icon">{item.icon}</span><span style={{flex:1}}>{item.label}</span>{item.badge&&<span className="nav-badge">{item.badge}</span>}</div>
                ))}
                <div style={{padding:"12px 16px",marginTop:"12px",borderTop:"1px solid #1f2d3d",fontSize:"14px"}}>
                  <button className="btn" onClick={handleLogout} style={{width:"100%",justifyContent:"center"}}>Cerrar sesión</button>
                </div>
              </nav>
            </>
          ):(
            <>
              <div className="sidebar-logo"><div className="logo-name">Aqua Vivant</div></div>
              <nav className="sidebar-nav">
                {navItems.map((item,i)=>item.s?<div key={i} className="nav-section"><div className="nav-label">{item.s}</div></div>:<div key={item.id} className={`nav-item ${view===item.id?"active":""}`} onClick={()=>{setView(item.id);if(isMobile)setShowMobileSidebar(false);}}><span className="nav-icon">{item.icon}</span>{item.label}{item.badge&&<span className="nav-badge">{item.badge}</span>}</div>)}
              </nav>
              <div className="sidebar-user" onClick={()=>setShowProfileModal(true)} style={{cursor:"pointer",transition:"all .2s ease"}}>
                <div className="user-avatar" style={{background:currentUser?.photo?`url(${currentUser.photo}) center/cover`:""}}>
                  {!currentUser?.photo&&ini(currentUser?.name||"")}
                </div>
                <div className="user-info"><div className="user-name">{currentUser?.name||""}</div><div className="user-role">{role==="admin"?"Administrador":role==="vendedor"?"Vendedor":"Broker"}</div></div>
              </div>
            </>
          )}
        </aside>
        <main className="main">
          <div className="topbar">
            {isMobile?(
              <>
                <div className="topbar-title" style={{flex:1,marginLeft:0,fontSize:18}}>{titles[view]||"Aqua Vivant"}</div>
                {role==="admin"&&<button className="btn btn-primary" onClick={()=>setShowNewLead(true)} style={{minWidth:44,minHeight:44,padding:"6px 10px"}}>➕</button>}
                <button onClick={()=>setShowMobileSidebar(!showMobileSidebar)} style={{background:"none",border:"none",color:AV.text,fontSize:20,cursor:"pointer",padding:"8px 12px",minWidth:44,minHeight:44,display:"flex",alignItems:"center",justifyContent:"center"}}>☰</button>
              </>
            ):(
              <>
                <div className="topbar-title">{titles[view]||""}</div>
                <div className="topbar-actions">
                  {role==="admin"&&<button className="btn btn-primary" onClick={()=>setShowNewLead(true)}>+ Nuevo lead</button>}
                  <div style={{width:8,height:8,borderRadius:"50%",background:AV.teal}} className="pulse"/>
                  <span style={{fontSize:"var(--fs-body)",color:AV.muted}}>En línea</span>
                  <button className="btn" onClick={handleLogout}>Logout</button>
                </div>
              </>
            )}
          </div>
          <div className="content">
            {dataLoading?<div style={{color:AV.muted,padding:24}}>Cargando datos…</div>:(<>
            {role==="admin"&&view==="dashboard"      &&<AdminDashboard leads={leads} asesores={asesores} units={units} towers={towers} onOpen={setFicha} marketingSpend={marketingSpend} projectConfig={projectConfig} goals={goals} refreshData={refreshData} upsertMarketingSpend={upsertMarketingSpend} upsertProjectConfig={upsertProjectConfig} insertGoal={insertGoal} updateGoal={updateGoal} deleteGoal={deleteGoal} setView={setView}/>}
            {role==="admin"&&view==="pipeline"       &&<AdminPipeline leads={leads} onOpen={setFicha} setView={setView}/>}
            {role==="admin"&&view==="leads"          &&<AdminLeads leads={leads} onOpen={setFicha}/>}
            {role==="admin"&&view==="equipo"         &&<AdminEquipo leads={leads} asesores={asesores} refreshData={refreshData} onOpen={setFicha}/>}
            {role==="admin"&&view==="inventario"     &&<AdminInventario units={units} towers={towers} refreshData={refreshData}/>}
            {role==="admin"&&view==="notificaciones" &&<AdminNotifs leads={leads} asesores={asesores} units={units} dismissed={dismissedAlerts} dismiss={dismissAlert} setView={setView}/>}
            {(role==="vendedor"||role==="asesor")&&view==="tareas"    &&<AsesorTareas leads={leads} onOpen={setFicha} currentUser={currentUser} projectConfig={projectConfig} refreshData={refreshData}/>}
            {(role==="vendedor"||role==="broker"||role==="asesor")&&view==="mis_leads" &&<AsesorMisLeads leads={leads} onOpen={setFicha} currentUser={currentUser}/>}
            {(role==="vendedor"||role==="broker"||role==="asesor")&&view==="inventario" &&<VendedorInventario units={units} currentUser={currentUser} canBlock={role==="vendedor"&&!!currentUser?.canBlockUnits} refreshData={refreshData}/>}
            </>)}
          </div>
        </main>
        {showNewLead&&<NewLeadModal onClose={()=>setShowNewLead(false)} onSave={addLead} asesores={asesores}/>}
        {ficha&&<FichaModal lead={ficha} onClose={()=>setFicha(null)} asesores={asesores} onReassign={handleReassignLead}/>}
        {showProfileModal&&<UserProfileModal user={currentUser} onClose={()=>{setShowProfileModal(false);if(isMobile)setShowMobileSidebar(false);}} onSave={async(data)=>{await updateOwnProfile(currentUser.id,data);setCurrentUser(p=>({...p,...data}));}}/>}
        {!showChat&&<button onClick={()=>setShowChat(true)} style={{position:"fixed",bottom:20,right:20,width:56,height:56,borderRadius:"50%",background:AV.teal,border:"none",cursor:"pointer",color:AV.bg,fontSize:24,display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,boxShadow:"0 4px 12px rgba(45,212,191,.3)"}}  title="Abrir chat con IA">💬</button>}
        {showChat&&<ChatIA messages={chatMessages} onSendMessage={setChatMessages} onClose={()=>setShowChat(false)}/>}
      </div>
      )}
    </>
  );
}
