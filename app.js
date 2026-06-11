'use strict';

// ── Supabase sync ──────────────────────────────────────────────────────────────
const SUPABASE_URL='https://btnvhypirjlyqfmkeaes.supabase.co';
const SUPABASE_ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0bnZoeXBpcmpseXFmbWtlYWVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NTUzMjUsImV4cCI6MjA5NTQzMTMyNX0.0Am6_oZaXFHywJt4JPUChl91WLtgQBmQkkdzI0yW9wM';
let _sb=null;
let _syncTimer=null;
let _savedAt={};

const _CLOUD_CHECK=`<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M6.657 18c-2.572 0 -4.657 -2.007 -4.657 -4.483c0 -2.475 2.085 -4.482 4.657 -4.482c.393 -1.762 1.794 -3.2 3.675 -3.773c1.88 -.572 3.956 -.193 5.444 1c1.488 1.19 2.162 3.007 1.77 4.769h.99c1.913 0 3.464 1.56 3.464 3.486c0 1.927 -1.551 3.487 -3.465 3.487h-11.878"/><path d="M9 12l2 2l4 -4"/></svg>`;
const _CLOUD_UPLOAD=`<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M7 18a4.6 4.4 0 0 1 0 -9a5 4.5 0 0 1 11 2h1a3.5 3.5 0 0 1 0 7h-1"/><polyline points="9 15 12 12 15 15"/><line x1="12" y1="12" x2="12" y2="21"/></svg>`;

function setSyncStatus(s){
  const btn=document.getElementById('syncBtn');if(!btn)return;
  if(s==='saving'){
    if(_syncTimer){clearTimeout(_syncTimer);_syncTimer=null;}
    btn.innerHTML=_CLOUD_UPLOAD;btn.style.color='#9B9A97';
  }else{
    if(_syncTimer)clearTimeout(_syncTimer);
    _syncTimer=setTimeout(()=>{btn.innerHTML=_CLOUD_CHECK;btn.style.color='#81C995';_syncTimer=null;},400);
  }
}

function _getSyncMeta(){try{return JSON.parse(localStorage.getItem('_planner_sync_meta')||'{}');}catch{return{};}}
function _setSyncMeta(key,ts){try{const m=_getSyncMeta();m[key]=ts;localStorage.setItem('_planner_sync_meta',JSON.stringify(m));}catch{}}

async function syncToSupabase(key,valueStr){
  const ts=new Date().toISOString();
  _setSyncMeta(key,ts);
  _savedAt[key]=Date.now();
  if(!_sb)return;
  setSyncStatus('saving');
  try{
    await _sb.from('planner_data').upsert({key,value:valueStr,updated_at:ts},{onConflict:'key'});
    setSyncStatus('synced');
  }catch(e){setSyncStatus('synced');}
}

function _isPlannerKey(k){
  return k&&k!=='_planner_sync_meta'&&k!=='darkMode'&&(
    k.startsWith('week_')||k==='weeklyGoals'||k==='templates'||
    k.startsWith('weeklyTextGoals_')||k.startsWith('monthlyGoals_')||
    k.startsWith('dailyGoals_')||k.startsWith('retro_')||k.startsWith('routine_')||
    k.startsWith('weekRes_')||k.startsWith('dayRes_')||k.startsWith('monthRes_')||
    k.startsWith('monthlyTextGoals_')||k.startsWith('monthEvents_')||
    k.startsWith('review_')
  );
}

async function _loadFromSupabase(){
  if(!_sb)return{updated:false,remoteKeys:new Set(),needsPush:[]};
  try{
    const{data,error}=await _sb.from('planner_data').select('*');
    if(error||!data)return{updated:false,remoteKeys:new Set(),needsPush:[]};
    const meta=_getSyncMeta();
    const remoteKeys=new Set(data.map(r=>r.key));
    const needsPush=[];
    let updated=false;
    const now=Date.now();
    data.forEach(row=>{
      if(_savedAt[row.key]&&now-_savedAt[row.key]<15000)return;
      const localTs=meta[row.key];
      if(localTs&&row.updated_at<=localTs){
        const current=localStorage.getItem(row.key);
        if(current&&current!==row.value)needsPush.push({key:row.key,value:current,updated_at:localTs});
        return;
      }
      const current=localStorage.getItem(row.key);
      if(current!==row.value){
        localStorage.setItem(row.key,row.value);
        _setSyncMeta(row.key,row.updated_at);
        updated=true;
      } else if(!localTs){
        _setSyncMeta(row.key,row.updated_at);
      }
    });
    return{updated,remoteKeys,needsPush};
  }catch(e){return{updated:false,remoteKeys:new Set(),needsPush:[]};}
}

async function _pushMissingToSupabase(remoteKeys){
  if(!_sb)return;
  const rows=[];
  for(let i=0;i<localStorage.length;i++){
    const k=localStorage.key(i);
    if(!_isPlannerKey(k)||remoteKeys.has(k))continue;
    rows.push({key:k,value:localStorage.getItem(k),updated_at:new Date().toISOString()});
  }
  if(!rows.length)return;
  setSyncStatus('saving');
  try{
    await _sb.from('planner_data').upsert(rows,{onConflict:'key'});
    rows.forEach(r=>_setSyncMeta(r.key,r.updated_at));
    setSyncStatus('synced');
  }catch(e){setSyncStatus('synced');}
}

async function initAndSync(){
  // retry if supabase CDN hasn't loaded yet (e.g., slow mobile network)
  if(!window.supabase){
    setTimeout(initAndSync,1500);return;
  }
  try{
    _sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
  }catch(e){_sb=null;return;}
  const{updated,remoteKeys,needsPush}=await _loadFromSupabase();
  if(needsPush.length){try{await _sb.from('planner_data').upsert(needsPush,{onConflict:'key'});needsPush.forEach(r=>_setSyncMeta(r.key,r.updated_at));}catch(e){}}
  await _pushMissingToSupabase(remoteKeys);
  if(updated){
    weeklyGoals=loadWeeklyGoals();
    weeklyTextGoals=loadWeeklyTextGoals();
    monthlyGoals=loadMonthlyGoals(new Date());
    templates=loadTemplates();
    blocks=loadWeek(currentMonday);
    ensureGoalLinksForWeek();
    render();
  }
  setSyncStatus('synced');
}

const SUBJECTS = {
  labor_law:  { name:'노동법',         short:'노동법',   color:'#F28B82' },
  hr_mgmt:    { name:'인사노무관리',   short:'인사노무', color:'#81C995' },
  admin_law:  { name:'행정쟁송법',     short:'행정쟁송', color:'#8AB4F8' },
  labor_econ: { name:'노동경제학',     short:'노동경제', color:'#FDD663' },
  precedent:  { name:'판례암기+타이핑', short:'판례암기', color:'#F28B82', dashed:true },
  rest:       { name:'휴식/식사/산책', short:'휴식',     color:'#E0E0E0' }
};
const SUBJ_SHORT={labor_law:'노동',hr_mgmt:'인사',admin_law:'행쟁',labor_econ:'노경',precedent:'판례'};
const DAYS = ['월','화','수','목','금','토','일'];
const ROUTINES=[
  {id:'water',icon:'💧',label:'물마시기'},
  {id:'anki', icon:'🎱',label:'안키돌리기'},
  {id:'yoga', icon:'🧘',label:'요가하기'},
];
const START_H=7, END_H=24, START_M=420, END_M=1440, TOTAL_M=1020;
const PPM = {10:2.5, 30:1.5, 60:1.0};
const EXAM_DATE = new Date(2026,7,30);

const REVIEW_SUBJECTS=[
  {key:'labor_law',  name:'노동법',       color:'#F28B82'},
  {key:'hr_mgmt',   name:'인사노무관리', color:'#81C995'},
  {key:'admin_law', name:'행정쟁송법',   color:'#8AB4F8'},
  {key:'labor_econ',name:'노동경제학',   color:'#FDD663'},
];

let viewMode = 'week';
let currentMonday = getMondayOf(new Date());
let currentDay = new Date(); currentDay.setHours(0,0,0,0);
let gran = 30;
let blocks = [];
let drag = null;
let editBlockId = null;
let lastSubject = 'labor_law';
let dblClickTimer = 0;
let dblClickId = null;
let selectedIds = new Set();
let selRectEl = null;
let clipboard = [];
let undoStack = [];
let redoStack = [];
let inlineEditingId = null;
let _renderingBlocks = false;
const isMobile = () => window.innerWidth <= 768;
let statsTab = 'weekly';
let expandedMonthDay = null;
let weeklyGoals = {};
let weeklyTextGoals = {};
let monthlyGoals = [];
let templates = [];
let statsCollapsed = true;
let goalsCollapsed = true;
let reviewSubTab = 'all';
let reviewViewDate = null;
let reviewAllViewDate = null;
let _rsSubjectKey = null, _rsCycleNum = null;
let _schedAddedDates = {};

// ── date helpers ──────────────────────────────────────────────────────────────
function getMondayOf(d) {
  const r=new Date(d); r.setHours(0,0,0,0);
  const wd=r.getDay(); r.setDate(r.getDate()+(wd===0?-6:1-wd)); return r;
}
function addDays(d,n){const r=new Date(d);r.setDate(r.getDate()+n);return r;}
function isSameDay(a,b){return a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();}
function isoWeek(d){
  const r=new Date(d);r.setHours(0,0,0,0);r.setDate(r.getDate()+3-(r.getDay()+6)%7);
  const j=new Date(r.getFullYear(),0,4);
  return 1+Math.round(((r-j)/86400000-3+(j.getDay()+6)%7)/7);
}
function weekKey(m){return `week_${m.getFullYear()}-W${String(isoWeek(m)).padStart(2,'0')}`;}
function weekLabelStr(m){return `${m.getFullYear()}년 ${m.getMonth()+1}월 ${Math.ceil(m.getDate()/7)}주`;}
function monthLabelStr(d){return `${d.getFullYear()}년 ${d.getMonth()+1}월`;}
function fmtDate(d){return `${d.getMonth()+1}/${d.getDate()}`;}
function fmtTime(min){return `${String(Math.floor(min/60)).padStart(2,'0')}:${String(min%60).padStart(2,'0')}`;}
function fmtDuration(m){const h=Math.floor(m/60),mins=m%60;if(h===0)return `${mins}m`;return mins?`${h}h ${mins}m`:`${h}h`;}
function dateKey(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function monthStorageKey(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;}
function dayIdx(date){const d=date.getDay();return d===0?6:d-1;}

// ── grid math ─────────────────────────────────────────────────────────────────
function ppm(){return PPM[gran];}
function minToY(min){return(min-START_M)*ppm();}
function yToMin(y){return START_M+y/ppm();}
function snapMin(min){return Math.round(min/gran)*gran;}
function clampMin(m){return Math.max(START_M,Math.min(END_M,m));}
function totalH(){return TOTAL_M*ppm();}
function isLight(hex){const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);return(r*299+g*587+b*114)/1000>160;}
function darken(hex,a){let r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);r=Math.max(0,r-a);g=Math.max(0,g-a);b=Math.max(0,b-a);return'#'+[r,g,b].map(x=>x.toString(16).padStart(2,'0')).join('');}
function hexToRgba(hex,alpha){const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);return `rgba(${r},${g},${b},${alpha})`;}

const SUBJECT_ICONS={
  labor_law:`<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>`,
  hr_mgmt:`<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>`,
  admin_law:`<path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21H17"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>`,
  labor_econ:`<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>`,
  precedent:`<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>`,
  rest:`<path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" y1="2" x2="6" y2="4"/><line x1="10" y1="2" x2="10" y2="4"/><line x1="14" y1="2" x2="14" y2="4"/>`
};
function escHtml(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7);}

// ── storage ───────────────────────────────────────────────────────────────────
function loadWeek(m){try{const r=localStorage.getItem(weekKey(m));return r?JSON.parse(r):[];}catch{return[];}}
function saveWeek(){const k=weekKey(currentMonday);const v=JSON.stringify(blocks);localStorage.setItem(k,v);syncToSupabase(k,v);}
function loadWeeklyGoals(){try{const r=localStorage.getItem('weeklyGoals');return r?JSON.parse(r):{};}catch{return{};}}
function saveWeeklyGoals(){const v=JSON.stringify(weeklyGoals);localStorage.setItem('weeklyGoals',v);syncToSupabase('weeklyGoals',v);}
function weeklyTextGoalsKey(){return 'weeklyTextGoals_'+weekKey(currentMonday);}
function loadWeeklyTextGoals(){try{const r=localStorage.getItem(weeklyTextGoalsKey());return r?JSON.parse(r):{};}catch{return{};}}
function saveWeeklyTextGoals(){const k=weeklyTextGoalsKey();const v=JSON.stringify(weeklyTextGoals);localStorage.setItem(k,v);syncToSupabase(k,v);}
function loadMonthlyGoals(d){try{const r=localStorage.getItem('monthlyGoals_'+monthStorageKey(d));return r?JSON.parse(r):[];}catch{return[];}}
function saveMonthlyGoals(){const k='monthlyGoals_'+monthStorageKey(new Date());const v=JSON.stringify(monthlyGoals);localStorage.setItem(k,v);syncToSupabase(k,v);}
function loadTemplates(){try{const r=localStorage.getItem('templates');return r?JSON.parse(r):[];}catch{return[];}}
function saveTemplates(){const v=JSON.stringify(templates);localStorage.setItem('templates',v);syncToSupabase('templates',v);}
function loadDailyGoals(dk){try{const r=localStorage.getItem('dailyGoals_'+dk);return r?JSON.parse(r):[];}catch{return[];}}
function hasDailyGoals(dk){return localStorage.getItem('dailyGoals_'+dk)!==null;}
function saveDailyGoals(dk,goals){const k='dailyGoals_'+dk;const v=JSON.stringify(goals);localStorage.setItem(k,v);syncToSupabase(k,v);}
function autoPopulateDailyGoals(dk){
  if(hasDailyGoals(dk))return loadDailyGoals(dk);
  return[];
}
function routineKey(dk){return 'routine_'+dk;}
function loadRoutine(dk){try{return JSON.parse(localStorage.getItem(routineKey(dk))||'null')||{};}catch{return{};}}
function saveRoutine(dk,data){const k=routineKey(dk);const v=JSON.stringify(data);localStorage.setItem(k,v);syncToSupabase(k,v);}
function getRoutineStatus(data,rid){const v=data[rid];if(v===true||v==='done')return 'done';if(v==='fail')return 'fail';return '';}
// ── undo / redo ───────────────────────────────────────────────────────────────
function pushUndo(){undoStack.push(JSON.stringify(blocks));if(undoStack.length>50)undoStack.shift();redoStack=[];}
function undo(){if(!undoStack.length)return;redoStack.push(JSON.stringify(blocks));blocks=JSON.parse(undoStack.pop());saveWeek();renderBlocks();}
function redo(){if(!redoStack.length)return;undoStack.push(JSON.stringify(blocks));blocks=JSON.parse(redoStack.pop());saveWeek();renderBlocks();}
function clearHistory(){undoStack=[];redoStack=[];}

function loadBlocksForDate(date){
  const mon=getMondayOf(date);
  const wb=loadWeek(mon);
  return wb.filter(b=>b.day===dayIdx(date));
}

// ── selection ─────────────────────────────────────────────────────────────────
function clearSelection(){selectedIds.clear();document.querySelectorAll('.block.selected').forEach(el=>el.classList.remove('selected'));}
function deleteSelected(){if(!selectedIds.size)return;pushUndo();blocks.filter(b=>selectedIds.has(b.id)).forEach(b=>removeGoalForBlock(b));blocks=blocks.filter(b=>!selectedIds.has(b.id));selectedIds.clear();saveWeek();renderBlocks();}
function createSelRect(x,y){removeSelRect();selRectEl=document.createElement('div');selRectEl.className='sel-rect';selRectEl.style.cssText=`left:${x}px;top:${y}px;width:0;height:0;`;document.body.appendChild(selRectEl);}
function updateSelRect(x1,y1,x2,y2){if(!selRectEl)return;selRectEl.style.left=Math.min(x1,x2)+'px';selRectEl.style.top=Math.min(y1,y2)+'px';selRectEl.style.width=Math.abs(x2-x1)+'px';selRectEl.style.height=Math.abs(y2-y1)+'px';}
function removeSelRect(){if(selRectEl){selRectEl.remove();selRectEl=null;}}
function hitTestSelection(x1,y1,x2,y2){const l=Math.min(x1,x2),r=Math.max(x1,x2),t=Math.min(y1,y2),b=Math.max(y1,y2);selectedIds.clear();document.querySelectorAll('.block').forEach(el=>{const br=el.getBoundingClientRect();const hit=br.left<r&&br.right>l&&br.top<b&&br.bottom>t;el.classList.toggle('selected',hit);if(hit)selectedIds.add(el.dataset.id);});}

// ── D-day ─────────────────────────────────────────────────────────────────────
function renderDday(){
  const today=new Date();today.setHours(0,0,0,0);
  const exam=new Date(EXAM_DATE);exam.setHours(0,0,0,0);
  const diff=Math.round((exam-today)/86400000)-1;
  const el=document.getElementById('ddayBadge');
  el.textContent=diff>0?`2차 시험 D-${diff}`:diff===0?'2차 시험 D-Day':`2차 시험 D+${Math.abs(diff)}`;
}

// ── monthly events ────────────────────────────────────────────────────────────
function monthEventsKey(mon){return 'monthEvents_'+monthStorageKey(mon);}
function loadMonthEvents(mon){try{return JSON.parse(localStorage.getItem(monthEventsKey(mon))||'[]');}catch{return[];}}
function saveMonthEvents(mon,events){const k=monthEventsKey(mon);const v=JSON.stringify(events);localStorage.setItem(k,v);syncToSupabase(k,v);}

function renderMonthEvents(wrap){
  const mon=currentMonday;
  const events=loadMonthEvents(mon).slice().sort((a,b)=>a.date.localeCompare(b.date)||a.time.localeCompare(b.time));
  const panel=document.createElement('div');panel.className='month-events-panel';

  const hdr=document.createElement('div');hdr.className='month-events-hdr';
  const title=document.createElement('span');title.className='month-events-title';title.textContent='이달의 일정';
  hdr.appendChild(title);panel.appendChild(hdr);

  const list=document.createElement('div');list.id='monthEventList';
  function _renderList(){
    list.innerHTML='';
    const evs=loadMonthEvents(mon).slice().sort((a,b)=>a.date.localeCompare(b.date)||a.time.localeCompare(b.time));
    if(!evs.length){const emp=document.createElement('div');emp.className='month-event-empty';emp.textContent='등록된 일정이 없습니다';list.appendChild(emp);return;}
    evs.forEach(ev=>{
      const item=document.createElement('div');item.className='month-event-item';
      const ds=ev.date.slice(5).replace('-','/');
      const alarmLabels={10:'10분 전',30:'30분 전',60:'1시간 전',1440:'하루 전'};
      const alarmText=ev.alarmMinutes?alarmLabels[ev.alarmMinutes]||`${ev.alarmMinutes}분 전`:'';
      item.innerHTML=`<span class="month-event-date">${ds}</span>`+
        `<span class="month-event-time">${ev.time||''}</span>`+
        `<span class="month-event-title">${escHtml(ev.title)}</span>`+
        (alarmText?`<span class="month-event-alarm">🔔 ${alarmText}</span>`:'')+
        `<button class="month-event-del" data-evdel="${ev.id}">×</button>`;
      item.querySelector('[data-evdel]').addEventListener('click',e=>{
        e.stopPropagation();
        const evs2=loadMonthEvents(mon).filter(x=>x.id!==ev.id);
        saveMonthEvents(mon,evs2);_renderList();
      });
      list.appendChild(item);
    });
  }
  _renderList();
  panel.appendChild(list);

  wrap.appendChild(panel);
}

function requestNotifPermission(){
  if(!('Notification' in window))return;
  if(Notification.permission==='default')Notification.requestPermission();
}

function checkEventAlarms(){
  if(!('Notification' in window)||Notification.permission!=='granted')return;
  const now=new Date();
  [-1,0,1].forEach(offset=>{
    const d=new Date(now.getFullYear(),now.getMonth()+offset,1);
    const events=loadMonthEvents(d);
    events.forEach(ev=>{
      if(!ev.alarmMinutes)return;
      const notifKey='evNotif_'+ev.id+dateKey(now);
      if(sessionStorage.getItem(notifKey))return;
      const [h,m]=(ev.time||'09:00').split(':').map(Number);
      const evDate=new Date(ev.date);evDate.setHours(h,m,0,0);
      const alarmTime=new Date(evDate.getTime()-ev.alarmMinutes*60000);
      if(alarmTime<=now&&now<evDate){
        try{new Notification('📅 '+ev.title,{body:ev.date.slice(5)+' '+ev.time+' 일정 알림'});}catch(e){}
        sessionStorage.setItem(notifKey,'1');
      }
    });
  });
}
setInterval(checkEventAlarms,30000);



// ── rest helper ───────────────────────────────────────────────────────────────
function addRestBlock(blockId){
  const blk=getBlock(blockId);if(!blk)return;if(blk.endMin>=END_M)return;
  pushUndo();
  const newEnd=Math.min(blk.endMin+20,END_M);
  blocks.push({id:uid(),day:blk.day,startMin:blk.endMin,endMin:newEnd,subject:'rest',memo:'휴식',completed:false});
  saveWeek();renderBlocks();
}

// ── inline memo edit ─────────────────────────────────────────────────────────
function activateInlineEdit(blockId){
  if(inlineEditingId===blockId)return;
  const blk=getBlock(blockId);if(!blk)return;
  const contentRow=document.querySelector(`.block[data-id="${blockId}"] .block-content-row`);
  const memoEl=document.querySelector(`.block[data-id="${blockId}"] .block-memo-text`);if(!memoEl)return;
  if(contentRow)contentRow.classList.remove('u-hidden');
  inlineEditingId=blockId;
  const origMemo=blk.memo||'';let committed=false;
  memoEl.contentEditable='true';memoEl.textContent=origMemo;memoEl.focus();
  const range=document.createRange();range.selectNodeContents(memoEl);range.collapse(false);
  const sel=window.getSelection();sel.removeAllRanges();sel.addRange(range);
  function commit(){if(committed)return;committed=true;inlineEditingId=null;const nm=memoEl.textContent.trim();const cb=getBlock(blockId);if(cb&&nm!==origMemo)pushUndo();if(cb)cb.memo=nm;memoEl.contentEditable='false';saveWeek();renderBlocks();}
  function revert(){committed=true;inlineEditingId=null;memoEl.contentEditable='false';memoEl.textContent=origMemo;}
  memoEl.addEventListener('blur',commit,{once:true});
  memoEl.addEventListener('keydown',ev=>{
    if(ev.key==='Enter'&&!ev.metaKey&&!ev.ctrlKey){
      ev.preventDefault();
      const sel=window.getSelection();if(!sel.rangeCount)return;
      const range=sel.getRangeAt(0);range.deleteContents();
      const nl=document.createTextNode('\n');range.insertNode(nl);
      range.setStartAfter(nl);range.setEndAfter(nl);sel.removeAllRanges();sel.addRange(range);
    }
    if(ev.key==='Escape'){ev.stopPropagation();memoEl.removeEventListener('blur',commit);revert();}
  });
}

function activateNoteEdit(blockId){
  if(inlineEditingId===blockId+'_note')return;
  const blk=getBlock(blockId);if(!blk)return;
  const noteEl=document.querySelector(`.block[data-id="${blockId}"] .block-note`);if(!noteEl)return;
  noteEl.classList.remove('u-hidden');
  inlineEditingId=blockId+'_note';
  const origNote=blk.note||'';let committed=false;
  noteEl.classList.remove('empty');noteEl.textContent=origNote;
  noteEl.contentEditable='true';noteEl.focus();
  const range=document.createRange();range.selectNodeContents(noteEl);range.collapse(false);
  const sel=window.getSelection();sel.removeAllRanges();sel.addRange(range);
  function commit(){if(committed)return;committed=true;inlineEditingId=null;const nn=noteEl.textContent.trim();const cb=getBlock(blockId);if(cb&&nn!==origNote)pushUndo();if(cb)cb.note=nn;noteEl.contentEditable='false';saveWeek();renderBlocks();}
  function revert(){committed=true;inlineEditingId=null;noteEl.contentEditable='false';noteEl.textContent=origNote;}
  noteEl.addEventListener('blur',commit,{once:true});
  noteEl.addEventListener('keydown',ev=>{
    if(ev.key==='Enter'&&!ev.metaKey&&!ev.ctrlKey){
      ev.preventDefault();
      const sel=window.getSelection();if(!sel.rangeCount)return;
      const range=sel.getRangeAt(0);range.deleteContents();
      const nl=document.createTextNode('\n');range.insertNode(nl);
      range.setStartAfter(nl);range.setEndAfter(nl);sel.removeAllRanges();sel.addRange(range);
    }
    if(ev.key==='Escape'){ev.stopPropagation();noteEl.removeEventListener('blur',commit);revert();}
  });
}

// ── templates ─────────────────────────────────────────────────────────────────
function saveAsTemplate(blk){
  templates.push({id:uid(),day:blk.day,startMin:blk.startMin,endMin:blk.endMin,subject:blk.subject,memo:blk.memo||''});
  saveTemplates();renderTemplates();
}
function applyTemplate(tmpl){
  if(blocks.some(b=>b.day===tmpl.day&&b.startMin===tmpl.startMin&&!b.ghost))return;
  pushUndo();
  const nb={id:uid(),day:tmpl.day,startMin:tmpl.startMin,endMin:tmpl.endMin,subject:tmpl.subject,memo:tmpl.memo,completed:false};
  blocks.push(nb);
  saveWeek();renderBlocks();
  autoGoalFromBlock(nb);
}
function applyAllTemplates(){
  if(!templates.length)return;
  pushUndo();
  const added=[];
  templates.forEach(t=>{
    if(!blocks.some(b=>b.day===t.day&&b.startMin===t.startMin&&!b.ghost)){
      const nb={id:uid(),day:t.day,startMin:t.startMin,endMin:t.endMin,subject:t.subject,memo:t.memo,completed:false};
      blocks.push(nb);added.push(nb);
    }
  });
  if(added.length){saveWeek();renderBlocks();added.forEach(b=>autoGoalFromBlock(b));}
}
function renderTemplates(){
  const body=document.getElementById('tmplBody');
  if(!templates.length){body.innerHTML='<span class="tmpl-empty">저장된 템플릿 없음</span>';return;}
  body.innerHTML=templates.map(t=>{
    const subj=SUBJECTS[t.subject]||SUBJECTS.rest;
    return `<div class="tmpl-item"><span class="tmpl-dot" style="background:${subj.color}"></span><span>${subj.short} ${DAYS[t.day]} ${fmtTime(t.startMin)}</span><button class="tmpl-apply" data-tapply="${t.id}">적용</button><button class="tmpl-del" data-tdel="${t.id}">×</button></div>`;
  }).join('')+`<button class="tmpl-apply-all">이번 주 전체 적용</button>`;
  body.querySelectorAll('[data-tapply]').forEach(btn=>btn.addEventListener('click',()=>{const t=templates.find(x=>x.id===btn.dataset.tapply);if(t)applyTemplate(t);}));
  body.querySelectorAll('[data-tdel]').forEach(btn=>btn.addEventListener('click',()=>{templates=templates.filter(x=>x.id!==btn.dataset.tdel);saveTemplates();renderTemplates();}));
  body.querySelector('.tmpl-apply-all').addEventListener('click',applyAllTemplates);
}

// ── spaced repetition ─────────────────────────────────────────────────────────
function scheduleReview(blk){
  const srcDate=addDays(currentMonday,blk.day);
  [3,7,14].forEach(offset=>{
    const tDate=addDays(srcDate,offset);
    const tMon=getMondayOf(tDate);
    const tDay=dayIdx(tDate);
    const tKey=weekKey(tMon);
    let wb;try{wb=JSON.parse(localStorage.getItem(tKey)||'[]');}catch{wb=[];}
    if(!wb.some(b=>b.ghost&&b.startMin===blk.startMin&&b.subject===blk.subject&&b.day===tDay)){
      wb.push({id:uid(),day:tDay,startMin:blk.startMin,endMin:blk.endMin,subject:blk.subject,memo:blk.memo||'',completed:false,ghost:true,ghostLabel:`+${offset}일 복습`});
      const wbStr=JSON.stringify(wb);localStorage.setItem(tKey,wbStr);syncToSupabase(tKey,wbStr);
    }
  });
  alert('복습이 +3, +7, +14일에 예약되었습니다.');
}
function confirmGhost(id){
  const blk=getBlock(id);if(!blk||!blk.ghost)return;
  pushUndo();blk.ghost=false;blk.ghostLabel=undefined;saveWeek();renderBlocks();
}


// ── edit modal ────────────────────────────────────────────────────────────────
let _editGoalsDk=null;

function _renderEditGoals(dk){
  const list=document.getElementById('editGoalsList');
  const goals=loadDailyGoals(dk);
  list.innerHTML='';
  goals.forEach(g=>{
    const row=document.createElement('div');row.className='edit-goal-item';row.dataset.gid=g.id;
    const inp=document.createElement('input');inp.type='text';inp.className='edit-goal-text';inp.value=g.text;inp.placeholder='목표 입력...';
    inp.addEventListener('keydown',ev=>{if(ev.key==='Enter'){ev.preventDefault();_addEditGoal(dk);}});
    const del=document.createElement('button');del.type='button';del.className='edit-goal-del';del.textContent='×';
    del.addEventListener('click',()=>{_saveEditGoalsNow(dk);let gs=loadDailyGoals(dk);gs=gs.filter(x=>x.id!==g.id);saveDailyGoals(dk,gs);_renderEditGoals(dk);});
    row.appendChild(inp);row.appendChild(del);list.appendChild(row);
  });
}

function _saveEditGoalsNow(dk){
  const list=document.getElementById('editGoalsList');
  const gs=loadDailyGoals(dk);
  list.querySelectorAll('.edit-goal-item').forEach(row=>{
    const g=gs.find(x=>x.id===row.dataset.gid);
    const inp=row.querySelector('.edit-goal-text');
    if(g&&inp)g.text=inp.value.trim();
  });
  saveDailyGoals(dk,gs);
}

function _addEditGoal(dk){
  _saveEditGoalsNow(dk);
  const gs=loadDailyGoals(dk);
  gs.push({id:uid(),text:'',status:'',done:false});
  saveDailyGoals(dk,gs);
  _renderEditGoals(dk);
  const inputs=document.getElementById('editGoalsList').querySelectorAll('.edit-goal-text');
  if(inputs.length)inputs[inputs.length-1].focus();
}

function openEditModal(blockId){
  const blk=getBlock(blockId);if(!blk)return;
  editBlockId=blk.id;
  document.getElementById('editSubject').value=blk.subject;
  document.getElementById('editMemo').value=blk.memo||'';
  document.getElementById('editNote').value=blk.note||'';
  const blkDate=addDays(currentMonday,blk.day);
  _editGoalsDk=dateKey(blkDate);
  const DAYNAMES=['월','화','수','목','금','토','일'];
  document.getElementById('editGoalsDayLabel').textContent=`(${blkDate.getMonth()+1}/${blkDate.getDate()} ${DAYNAMES[blk.day]})`;
  _renderEditGoals(_editGoalsDk);
  document.getElementById('modalOverlay').classList.add('open');
  setTimeout(()=>document.getElementById('editMemo').focus(),50);
}

document.getElementById('editGoalsAdd').addEventListener('click',()=>{if(_editGoalsDk)_addEditGoal(_editGoalsDk);});

function _syncMemoToLinkedGoal(){
  if(!editBlockId||!_editGoalsDk)return;
  const subject=document.getElementById('editSubject').value;
  const short=SUBJ_SHORT[subject]||'';
  const memo=document.getElementById('editMemo').value.trim();
  const newText=memo?`${short} ${memo}`:short;
  const gs=loadDailyGoals(_editGoalsDk);
  const linked=gs.find(g=>g.blkId===editBlockId);
  if(!linked)return;
  const row=document.getElementById('editGoalsList').querySelector(`.edit-goal-item[data-gid="${linked.id}"]`);
  if(row){const inp=row.querySelector('.edit-goal-text');if(inp)inp.value=newText;}
}
document.getElementById('editMemo').addEventListener('input',_syncMemoToLinkedGoal);
document.getElementById('editSubject').addEventListener('change',_syncMemoToLinkedGoal);

document.getElementById('modalCancel').onclick=closeModal;
document.getElementById('modalOverlay').onclick=e=>{if(e.target===document.getElementById('modalOverlay'))closeModal();};
document.getElementById('modalSave').onclick=()=>{
  const blk=getBlock(editBlockId);
  if(blk){pushUndo();blk.subject=document.getElementById('editSubject').value;blk.memo=document.getElementById('editMemo').value.trim();blk.note=document.getElementById('editNote').value.trim();lastSubject=blk.subject;saveWeek();renderBlocks();autoGoalFromBlock(blk);}
  if(_editGoalsDk){
    _saveEditGoalsNow(_editGoalsDk);
    if(blk){const goalRow=document.querySelector(`.daily-goal-row[data-day="${blk.day}"]`);if(goalRow)buildGoalRowContent(goalRow,_editGoalsDk);syncGoalRowHeight();}
  }
  closeModal();
};
function closeModal(){document.getElementById('modalOverlay').classList.remove('open');editBlockId=null;_editGoalsDk=null;}

// ── navigation ────────────────────────────────────────────────────────────────
document.getElementById('prevBtn').onclick=()=>{
  if(viewMode==='review')return;
  if(viewMode==='week'){navigate(-7);}
  else if(viewMode==='day'){currentDay=addDays(currentDay,-1);currentMonday=getMondayOf(currentDay);blocks=loadWeek(currentMonday);ensureGoalLinksForWeek();renderDailyView();}
  else{currentMonday=new Date(currentMonday.getFullYear(),currentMonday.getMonth()-1,1);render();}
};
document.getElementById('nextBtn').onclick=()=>{
  if(viewMode==='review')return;
  if(viewMode==='week'){navigate(7);}
  else if(viewMode==='day'){currentDay=addDays(currentDay,1);currentMonday=getMondayOf(currentDay);blocks=loadWeek(currentMonday);ensureGoalLinksForWeek();renderDailyView();}
  else{currentMonday=new Date(currentMonday.getFullYear(),currentMonday.getMonth()+1,1);render();}
};
document.getElementById('todayBtn').onclick=()=>{currentDay=new Date();currentDay.setHours(0,0,0,0);currentMonday=getMondayOf(currentDay);blocks=loadWeek(currentMonday);ensureGoalLinksForWeek();renderDailyView();};

function navigate(days){clearSelection();clearHistory();currentMonday=addDays(currentMonday,days);blocks=loadWeek(currentMonday);weeklyTextGoals=loadWeeklyTextGoals();ensureGoalLinksForWeek();render();}

document.getElementById('copyPrevWeek').onclick=()=>{
  if(blocks.length>0&&!confirm('현재 주에 데이터가 있습니다. 전주 내용으로 교체할까요?'))return;
  pushUndo();const prev=loadWeek(addDays(currentMonday,-7));blocks=prev.map(b=>({...b,id:uid(),completed:false,status:''}));saveWeek();blocks.forEach(b=>autoGoalFromBlock(b));renderBlocks();
};
document.getElementById('resetWeek').onclick=()=>{
  if(!confirm('이번 주 데이터를 모두 삭제할까요?'))return;pushUndo();blocks=[];selectedIds.clear();saveWeek();renderBlocks();
};

// ── view toggle ───────────────────────────────────────────────────────────────
document.querySelectorAll('[data-view]').forEach(btn=>{
  btn.onclick=()=>{
    viewMode=btn.dataset.view;
    document.querySelectorAll('[data-view]').forEach(b=>b.classList.remove('active'));btn.classList.add('active');
    if(viewMode==='day'){currentDay=new Date();currentDay.setHours(0,0,0,0);currentMonday=getMondayOf(currentDay);blocks=loadWeek(currentMonday);}
    else if(viewMode==='week'){blocks=loadWeek(currentMonday);}
    expandedMonthDay=null;render();
  };
});

// ── granularity ───────────────────────────────────────────────────────────────
document.querySelectorAll('[data-gran]').forEach(btn=>{
  btn.onclick=()=>{gran=parseInt(btn.dataset.gran);document.querySelectorAll('[data-gran]').forEach(b=>b.classList.remove('active'));btn.classList.add('active');render();};
});



// ── template panel ────────────────────────────────────────────────────────────
document.getElementById('tmplToggleBtn').addEventListener('click',()=>{
  document.getElementById('tmplPanel').classList.toggle('collapsed');
});
document.getElementById('undoBtn').addEventListener('click',undo);
document.getElementById('redoBtn').addEventListener('click',redo);

// ── keyboard ──────────────────────────────────────────────────────────────────
function isTypingContext(){const el=document.activeElement;return el&&(el.tagName==='INPUT'||el.tagName==='TEXTAREA'||el.contentEditable==='true');}

document.addEventListener('keydown',e=>{
  if(document.getElementById('repeatModalOverlay').classList.contains('open')){if(e.key==='Escape')closeRepeatModal();return;}
  if(document.getElementById('modalOverlay').classList.contains('open')){if(e.key==='Escape')closeModal();return;}
  const meta=e.metaKey||e.ctrlKey;
  if(meta&&e.key==='c'&&selectedIds.size>0&&!isTypingContext()){e.preventDefault();clipboard=blocks.filter(b=>selectedIds.has(b.id)).map(b=>({...b}));return;}
  if(meta&&e.key==='v'&&clipboard.length>0&&!isTypingContext()){
    e.preventDefault();pushUndo();clearSelection();
    const nb=clipboard.map(b=>{
      const dur=b.endMin-b.startMin;const ns=Math.min(b.startMin+30,END_M-Math.max(dur,gran));const ne=Math.min(ns+dur,END_M);const id=uid();selectedIds.add(id);
      return{...b,id,startMin:ns,endMin:ne,completed:false};
    });
    blocks.push(...nb);saveWeek();renderBlocks();return;
  }
  if(meta&&e.key==='z'&&!e.shiftKey&&!isTypingContext()){e.preventDefault();undo();return;}
  if(meta&&(e.key==='y'||(e.key==='z'&&e.shiftKey))&&!isTypingContext()){e.preventDefault();redo();return;}
  if((e.key==='Escape'||e.key==='Delete')&&selectedIds.size>0&&!isTypingContext()){e.preventDefault();deleteSelected();return;}
  if(e.key==='Escape')hideCtx();
});

document.addEventListener('click',e=>{if(!document.getElementById('ctxMenu').contains(e.target))hideCtx();});

// ── retrospectives ────────────────────────────────────────────────────────────
function retroStorageKey(type,d){
  if(type==='day')return `retro_${dateKey(d)}`;
  if(type==='week')return `retro_week_${weekKey(getMondayOf(d))}`;
  if(type==='month')return `retro_month_${monthStorageKey(d)}`;
}
function loadRetro(type,d){try{return JSON.parse(localStorage.getItem(retroStorageKey(type,d))||'null')||{};}catch{return {};}}
function saveRetro(type,d,data){const k=retroStorageKey(type,d);const v=JSON.stringify(data);localStorage.setItem(k,v);syncToSupabase(k,v);}

function makeStars(val,cb,cls='retro-star',max=5){
  let html='<div class="retro-stars">';
  for(let i=1;i<=max;i++)html+=`<button class="${cls}${i<=val?' active':''}" data-star="${i}">★</button>`;
  html+='</div>';
  const wrap=document.createElement('div');wrap.innerHTML=html;
  const starsEl=wrap.firstElementChild;
  starsEl.addEventListener('click',e=>{
    const btn=e.target.closest('[data-star]');if(!btn)return;
    const v=parseInt(btn.dataset.star);cb(v);
    starsEl.querySelectorAll('[data-star]').forEach(b=>b.classList.toggle('active',parseInt(b.dataset.star)<=v));
  });
  return starsEl;
}

const MOODS=[
  {id:'bright',emoji:'😄',label:'밝은 웃음'},
  {id:'meh',emoji:'😐',label:'그저 그런'},
  {id:'tearup',emoji:'🥺',label:'눈물 고임'},
  {id:'cry',emoji:'😭',label:'오열'},
  {id:'angry',emoji:'😤',label:'화남'},
  {id:'sick',emoji:'🤒',label:'아픔'},
  {id:'study',emoji:'📚',label:'열공 모드'},
  {id:'pumped',emoji:'💪',label:'의지 충만'},
  {id:'sleepy',emoji:'😴',label:'졸음'},
  {id:'anxious',emoji:'😰',label:'불안'},
  {id:'blown',emoji:'🤯',label:'머리 폭발'},
  {id:'touched',emoji:'🥹',label:'감동적'},
];


// one-time migration: add goals from pre-existing blocks for week of 2026-06-01
(function migrateJune1Goals(){
  const mKey='goalsMigrated_2026-W23';
  if(localStorage.getItem(mKey))return;
  const jun1=new Date(2026,5,1);
  const wMon=getMondayOf(jun1);
  const wb=loadWeek(wMon);
  wb.forEach(blk=>{
    const short=SUBJ_SHORT[blk.subject];if(!short)return;
    const date=addDays(wMon,blk.day);const dk=dateKey(date);
    const text=blk.memo?`${short} ${blk.memo}`:short;
    let gs=loadDailyGoals(dk);
    if(gs.some(g=>g.blkId===blk.id))return;
    gs.push({id:uid(),text,status:'',done:false,blkId:blk.id});
    saveDailyGoals(dk,gs);
  });
  localStorage.setItem(mKey,'1');
})();

// dark mode
function applyDark(on){document.body.classList.toggle('dark',on);localStorage.setItem('darkMode',on?'1':'0');}

// ── init block moved to view-review.js (last loaded file) ────────────────────
