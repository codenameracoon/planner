// ── statistics ────────────────────────────────────────────────────────────────
function loadMonthlyTextGoals(mon){try{const r=localStorage.getItem('monthlyTextGoals_'+monthStorageKey(mon));return r?JSON.parse(r):{};}catch{return{};}}
function saveMonthlyTextGoals(mon,obj){const k='monthlyTextGoals_'+monthStorageKey(mon);const v=JSON.stringify(obj);localStorage.setItem(k,v);syncToSupabase(k,v);}

function renderStats(){
  const body=document.getElementById('statsBody');
  const studyKeys=Object.keys(SUBJECTS).filter(k=>k!=='rest'&&k!=='precedent');

  if(viewMode==='month'){
    // Monthly: per-subject text goals (no hours) + 월간 다짐
    const mKey=monthStorageKey(currentMonday);
    const mtg=loadMonthlyTextGoals(currentMonday);
    let col3=`<div class="stats-col-goals"><div class="stats-col-label">월간 목표</div><div class="wgoal-grid">`;
    studyKeys.forEach(key=>{
      const subj=SUBJECTS[key];
      const text=mtg[key]||'';
      col3+=`<div class="wgoal-row">`+
        `<span class="stats-dot" style="background:${subj.color}"></span>`+
        `<span class="wgoal-subj-name" style="width:64px">${subj.short}</span>`+
        `<input class="wgoal-text-input" data-mkey="${key}" value="${escHtml(text)}" placeholder="목표...">`+
      `</div>`;
    });
    col3+=`</div></div>`;
    const mrKey='monthRes_'+mKey;
    const mrVal=localStorage.getItem(mrKey)||'';
    const col2=`<div class="stats-col-hours">`+
      `<div class="stats-col-label">월간 다짐</div>`+
      `<textarea class="week-resolution-inp" id="monthResolutionInp" placeholder="이번 달 나에게 하고 싶은 말...">${escHtml(mrVal)}</textarea>`+
    `</div>`;
    body.innerHTML=col3+col2;
    body.onchange=e=>{const inp=e.target.closest('[data-mkey]');if(!inp)return;const k=inp.dataset.mkey;const obj=loadMonthlyTextGoals(currentMonday);obj[k]=inp.value.trim();saveMonthlyTextGoals(currentMonday,obj);};
    const resInp=body.querySelector('#monthResolutionInp');
    if(resInp){resInp.onchange=()=>{const v=resInp.value;localStorage.setItem(mrKey,v);syncToSupabase(mrKey,v);updateStatsPanelTitle();};}
    return;
  }

  const keys=Object.keys(SUBJECTS);
  const stats={};keys.forEach(k=>{stats[k]={done:0,total:0};});
  blocks.forEach(blk=>{
    if(blk.ghost)return;
    const k=SUBJECTS[blk.subject]?blk.subject:'rest';
    const dur=(blk.endMin-blk.startMin)/60;
    stats[k].total+=dur;if(blk.completed)stats[k].done+=dur;
  });

  if(viewMode==='day'){
    // Daily: per-subject hours (today) + 오늘 다짐
    const dk=dateKey(currentDay);
    const vDay=dayIdx(currentDay);
    const todayStats={};studyKeys.forEach(k=>{todayStats[k]={done:0,total:0};});
    blocks.filter(b=>b.day===vDay&&!b.ghost).forEach(blk=>{
      const k=SUBJECTS[blk.subject]?blk.subject:'rest';
      if(!todayStats[k])return;
      const dur=(blk.endMin-blk.startMin)/60;
      todayStats[k].total+=dur;if(blk.completed)todayStats[k].done+=dur;
    });
    let col3=`<div class="stats-col-goals"><div class="stats-col-label">일간 목표</div><div class="wgoal-grid">`;
    studyKeys.forEach(key=>{
      const subj=SUBJECTS[key];
      const hrs=todayStats[key]?todayStats[key].total:0;
      const tg=weeklyTextGoals[key]||{text:'',done:false};
      col3+=`<div class="wgoal-row">`+
        `<span class="stats-dot" style="background:${subj.color}"></span>`+
        `<span class="wgoal-subj-name">${subj.short}</span>`+
        `<span class="wgoal-hrs">${hrs>0?hrs.toFixed(1)+'h':'—'}</span>`+
        `<input class="wgoal-text-input${tg.done?' done-text':''}" data-wkey="${key}" value="${escHtml(tg.text)}" placeholder="목표...">`+
      `</div>`;
    });
    col3+=`</div></div>`;
    const drKey='dayRes_'+dk;
    const drVal=localStorage.getItem(drKey)||'';
    const col2=`<div class="stats-col-hours">`+
      `<div class="stats-col-label">오늘 다짐</div>`+
      `<textarea class="week-resolution-inp" id="dayResolutionInp" placeholder="오늘 나에게 하고 싶은 말...">${escHtml(drVal)}</textarea>`+
    `</div>`;
    body.innerHTML=col3+col2;
    const resInp=body.querySelector('#dayResolutionInp');
    if(resInp){resInp.onchange=()=>{const v=resInp.value;localStorage.setItem(drKey,v);syncToSupabase(drKey,v);updateStatsPanelTitle();updateDailyGoalRows();};}
    body.onchange=e=>{const inp=e.target.closest('[data-wkey]');if(!inp)return;const k=inp.dataset.wkey;if(!weeklyTextGoals[k])weeklyTextGoals[k]={text:'',done:false};weeklyTextGoals[k].text=inp.value.trim();saveWeeklyTextGoals();};
    return;
  }

  // Week view: per-subject hours + text goals + 이번 주 다짐
  let col3=`<div class="stats-col-goals"><div class="stats-col-label">주간 목표</div><div class="wgoal-grid">`;
  studyKeys.forEach(key=>{
    const subj=SUBJECTS[key];
    const tg=weeklyTextGoals[key]||{text:'',done:false};
    const hrs=stats[key].total;
    col3+=`<div class="wgoal-row">`+
      `<div class="wgoal-check${tg.done?' done':''}" data-wcheck="${key}">${tg.done?'✓':''}</div>`+
      `<span class="stats-dot" style="background:${subj.color}"></span>`+
      `<span class="wgoal-subj-name">${subj.short}</span>`+
      `<span class="wgoal-hrs">${hrs>0?hrs.toFixed(1)+'h':'—'}</span>`+
      `<input class="wgoal-text-input${tg.done?' done-text':''}" data-wkey="${key}" value="${escHtml(tg.text)}" placeholder="목표...">`+
    `</div>`;
  });
  col3+=`</div></div>`;
  const wrKey='weekRes_'+weekKey(currentMonday);
  const wrVal=localStorage.getItem(wrKey)||'';
  const col2=`<div class="stats-col-hours">`+
    `<div class="stats-col-label">이번 주 다짐</div>`+
    `<textarea class="week-resolution-inp" id="weekResolutionInp" placeholder="이번 주 나에게 하고 싶은 말...">${escHtml(wrVal)}</textarea>`+
  `</div>`;
  body.innerHTML=col3+col2;
  const resInp=body.querySelector('#weekResolutionInp');
  if(resInp){resInp.onchange=()=>{const v=resInp.value;localStorage.setItem(wrKey,v);syncToSupabase(wrKey,v);updateStatsPanelTitle();};}
  if(isMobile()){
    [['stats-col-goals','_mGoalsCollapsed'],['stats-col-hours','_mHoursCollapsed']].forEach(([cls,stateKey])=>{
      const col=body.querySelector('.'+cls);if(!col)return;
      const lbl=col.querySelector('.stats-col-label');if(!lbl)return;
      if(window[stateKey])col.classList.add('m-col-collapsed');
      const arr=document.createElement('span');
      arr.style.cssText='float:right;color:#9B9A97;font-size:10px;font-weight:400;margin-left:6px';
      arr.textContent=window[stateKey]?'▶':'▼';
      lbl.appendChild(arr);
      lbl.onclick=()=>{
        col.classList.toggle('m-col-collapsed');
        window[stateKey]=col.classList.contains('m-col-collapsed');
        arr.textContent=window[stateKey]?'▶':'▼';
      };
    });
  }
  body.onclick=e=>{const el=e.target.closest('[data-wcheck]');if(!el)return;const k=el.dataset.wcheck;if(!weeklyTextGoals[k])weeklyTextGoals[k]={text:'',done:false};weeklyTextGoals[k].done=!weeklyTextGoals[k].done;saveWeeklyTextGoals();renderStats();};
  body.onchange=e=>{const inp=e.target.closest('[data-wkey]');if(!inp)return;const k=inp.dataset.wkey;if(!weeklyTextGoals[k])weeklyTextGoals[k]={text:'',done:false};weeklyTextGoals[k].text=inp.value.trim();saveWeeklyTextGoals();};
}

// ── toolbar progress bar ──────────────────────────────────────────────────────
function renderToolbarProgress(){
  const bar=document.getElementById('tbProgBar');
  const label=document.getElementById('tbProgLabel');
  if(!bar||!label)return;
  const studyKeys=Object.keys(SUBJECTS).filter(k=>k!=='rest');
  let src;
  if(viewMode==='day'){
    const vDay=dayIdx(currentDay);
    src=blocks.filter(b=>b.day===vDay&&!b.ghost&&studyKeys.includes(b.subject));
  }else{
    src=blocks.filter(b=>!b.ghost&&studyKeys.includes(b.subject));
  }
  const total=src.reduce((s,b)=>s+(b.endMin-b.startMin)/60,0);
  const done=src.filter(b=>b.completed).reduce((s,b)=>s+(b.endMin-b.startMin)/60,0);
  const pct=total>0?Math.round(done/total*100):0;
  // Build subject-colored segments for completed hours, then gray for remaining
  let segs='';
  if(total>0){
    studyKeys.forEach(key=>{
      const subj=SUBJECTS[key];
      const keyDone=src.filter(b=>b.subject===key&&b.completed).reduce((s,b)=>s+(b.endMin-b.startMin)/60,0);
      if(keyDone>0)segs+=`<div style="width:${(keyDone/total*100).toFixed(1)}%;background:${subj.color};height:100%"></div>`;
    });
    if(done<total)segs+=`<div style="width:${((total-done)/total*100).toFixed(1)}%;background:#E0E0E0;height:100%"></div>`;
  }
  bar.innerHTML=segs;
  label.innerHTML=`<span style="color:#2383E2;font-weight:600">${done.toFixed(1)}h</span> / ${total.toFixed(1)}h · ${pct}%`;
}

// ── dday pixel grid ───────────────────────────────────────────────────────────
const DDAY_START = new Date(2026,4,26); // May 26 2026
const DDAY_EXAM  = new Date(2026,7,30); // Aug 30 2026

function computeDayCompletionRate(date){
  const db=loadBlocksForDate(date).filter(b=>!b.ghost);
  if(!db.length)return -1; // -1 = no blocks
  const total=db.reduce((s,b)=>s+(b.endMin-b.startMin),0);
  const done=db.filter(b=>b.completed).reduce((s,b)=>s+(b.endMin-b.startMin),0);
  return total>0?done/total*100:0;
}

function buildDdayGrid(){
  const el=document.getElementById('ddayGrid');
  if(!el)return;
  if(viewMode!=='week'){el.classList.add('u-hidden');return;}
  el.classList.remove('u-hidden');

  const today=new Date();today.setHours(0,0,0,0);
  const examMs=DDAY_EXAM.getTime();
  const todayMs=today.getTime();
  const diffDays=Math.ceil((examMs-todayMs)/86400000)-1;

  // collect all days in range
  const days=[];
  for(let d=new Date(DDAY_START);d<=DDAY_EXAM;d.setDate(d.getDate()+1))days.push(new Date(d));

  // cache week data: read each localStorage key once, not once per day
  const _wkCache={};
  const _dayRate=d=>{
    const mon=getMondayOf(d);const key=weekKey(mon);
    if(!(key in _wkCache)){try{_wkCache[key]=JSON.parse(localStorage.getItem(key)||'[]');}catch{_wkCache[key]=[];}}
    const wb=_wkCache[key];const di=dayIdx(d);
    const db=wb.filter(b=>b.day===di&&!b.ghost);
    if(!db.length)return -1;
    const total=db.reduce((s,b)=>s+(b.endMin-b.startMin),0);
    const done=db.filter(b=>b.completed).reduce((s,b)=>s+(b.endMin-b.startMin),0);
    return total>0?done/total*100:0;
  };

  let doneCount=0,missCount=0;
  days.forEach(d=>{
    if(d>=today)return;
    const rate=_dayRate(d);
    if(rate<0)missCount++;       // no blocks = missed
    else if(rate>=80)doneCount++;
    else missCount++;
  });

  document.getElementById('ddayGridHdr').textContent=
    `시험까지 D-${Math.max(diffDays,0)}일 · ${doneCount}일 완료 · ${missCount}일 미완료`;

  const wrap=document.getElementById('ddaySquares');
  wrap.innerHTML='';

  days.forEach(d=>{
    const isToday=isSameDay(d,today);
    const isExam=isSameDay(d,DDAY_EXAM);
    const isPast=d<today;
    const dk=dateKey(d);

    const sq=document.createElement('div');
    sq.className='dday-sq';
    sq.dataset.date=dk;

    if(isExam){
      sq.style.background='#F28B82';
    } else if(isToday){
      sq.style.background='#fff';
      sq.style.border='2px solid #37352F';
    } else if(isPast){
      const rate=_dayRate(d);
      if(rate<0)sq.style.background='#E0E0E0';
      else if(rate>=80)sq.style.background='#81C995';
      else sq.style.background='#FDD663';
    } else {
      sq.style.background='#F1F1EF';
    }

    wrap.appendChild(sq);
  });

  // tooltip
  let tip=document.getElementById('ddayTip');
  if(!tip){tip=document.createElement('div');tip.id='ddayTip';tip.className='dday-tip';document.body.appendChild(tip);}

  wrap.querySelectorAll('.dday-sq').forEach(sq=>{
    sq.addEventListener('mouseenter',e=>{
      const d=new Date(sq.dataset.date+'T00:00:00');
      const db=loadBlocksForDate(d).filter(b=>!b.ghost);
      const totalM=db.reduce((s,b)=>s+(b.endMin-b.startMin),0);
      const doneM=db.filter(b=>b.completed).reduce((s,b)=>s+(b.endMin-b.startMin),0);
      const rate=totalM>0?Math.round(doneM/totalM*100):0;
      const label=isSameDay(d,DDAY_EXAM)?'시험일 🎯':sq.dataset.date;
      tip.innerHTML=`<strong>${label}</strong><br>`+
        (totalM>0?`${(totalM/60).toFixed(1)}h 공부 · 완료율 ${rate}%`:'기록 없음');
      tip.style.display='block';
      moveTip(e);
    });
    sq.addEventListener('mousemove',moveTip);
    sq.addEventListener('mouseleave',()=>{tip.style.display='none';});
    sq.addEventListener('click',()=>{
      const d=new Date(sq.dataset.date+'T00:00:00');
      currentDay=d;currentMonday=getMondayOf(currentDay);
      blocks=loadWeek(currentMonday);viewMode='day';
      document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view==='day'));
      renderDailyView();
    });
  });

  function moveTip(e){
    const x=e.clientX+14,y=e.clientY-40;
    tip.style.left=x+'px';tip.style.top=y+'px';
  }
}


function autoGoalFromBlock(blk){
  const short=SUBJ_SHORT[blk.subject];
  if(!short)return;
  const date=addDays(currentMonday,blk.day);
  const dk=dateKey(date);
  const text=blk.memo?`${short} ${blk.memo}`:short;
  let gs=loadDailyGoals(dk);
  const existing=gs.find(g=>g.blkId===blk.id);
  if(existing){existing.text=text;}
  else{
    const sameText=gs.find(g=>g.text===text);
    if(sameText){if(!sameText.blkId)sameText.blkId=blk.id;}
    else{gs.push({id:uid(),text,status:'',done:false,blkId:blk.id});}
  }
  saveDailyGoals(dk,gs);
  const rowEl=document.querySelector(`.daily-goal-row[data-day="${blk.day}"]`);
  if(rowEl){buildGoalRowContent(rowEl,dk);syncGoalRowHeight();}
}

function ensureGoalLinksForWeek(){
  blocks.filter(b=>!b.ghost).forEach(blk=>{
    const short=SUBJ_SHORT[blk.subject];if(!short)return;
    const date=addDays(currentMonday,blk.day);const dk=dateKey(date);
    let gs=loadDailyGoals(dk);
    const text=blk.memo?`${short} ${blk.memo}`:short;
    const linked=gs.find(g=>g.blkId===blk.id);
    if(linked){
      // remove orphaned duplicates with same text that would confuse the user
      const before=gs.length;
      gs=gs.filter(g=>g===linked||g.blkId||g.text!==text);
      if(gs.length<before)saveDailyGoals(dk,gs);
      return;
    }
    // no linked goal: adopt orphan with same text, or create new
    const orphan=gs.find(g=>!g.blkId&&g.text===text);
    if(orphan){orphan.blkId=blk.id;}
    else{gs.push({id:uid(),text,status:blk.status||'',done:blk.completed,blkId:blk.id});}
    saveDailyGoals(dk,gs);
  });
}

window.ensureGoalLinksForWeek=ensureGoalLinksForWeek;
function removeGoalForBlock(blk){
  if(!blk)return;
  const date=addDays(currentMonday,blk.day);
  const dk=dateKey(date);
  let gs=loadDailyGoals(dk);
  const before=gs.length;
  gs=gs.filter(g=>g.blkId!==blk.id);
  if(gs.length<before){
    saveDailyGoals(dk,gs);
    const rowEl=document.querySelector(`.daily-goal-row[data-day="${blk.day}"]`);
    if(rowEl){buildGoalRowContent(rowEl,dk);syncGoalRowHeight();}
  }
}

function updateStatsPanelTitle(){
  const titleEl=document.querySelector('#statsHdr .stats-strip-title');
  const inlineEl=document.getElementById('statsResolutionInline');
  if(!titleEl||!inlineEl)return;

  const collapsed=statsCollapsed||(document.getElementById('statsPanel').classList.contains('m-collapsed'));

  if(collapsed){
    let storKey='',placeholder='';
    if(viewMode==='day'){storKey='dayRes_'+dateKey(currentDay);placeholder='오늘 다짐을 입력하세요...';}
    else if(viewMode==='week'){storKey='weekRes_'+weekKey(currentMonday);placeholder='이번 주 다짐을 입력하세요...';}
    else if(viewMode==='month'){storKey='monthRes_'+monthStorageKey(currentMonday);placeholder='월간 다짐을 입력하세요...';}
    if(storKey){
      inlineEl.value=localStorage.getItem(storKey)||'';
      inlineEl.placeholder=placeholder;
      inlineEl.style.display='block';
      if(inlineEl.dataset.storKey!==storKey){
        inlineEl.dataset.storKey=storKey;
        inlineEl.oninput=()=>{const v=inlineEl.value;localStorage.setItem(storKey,v);syncToSupabase(storKey,v);};
      }
    }else{
      inlineEl.style.display='none';
    }
    titleEl.style.display='none';
  }else{
    inlineEl.style.display='none';
    titleEl.style.display='';
    titleEl.textContent='목표 & 통계';
    titleEl.style.color='';titleEl.style.fontWeight='';
  }
}

// ── stats panel collapse ──────────────────────────────────────────────────────
document.getElementById('statsResolutionInline').addEventListener('click',e=>e.stopPropagation());
document.getElementById('statsResolutionInline').addEventListener('mousedown',e=>e.stopPropagation());
// Enter in collapsed textarea inserts a space instead of a newline
document.getElementById('statsResolutionInline').addEventListener('keydown',e=>{
  if(e.key==='Enter'){
    e.preventDefault();
    const el=e.currentTarget,p=el.selectionStart;
    el.value=el.value.slice(0,p)+' '+el.value.slice(p);
    el.setSelectionRange(p+1,p+1);
    el.dispatchEvent(new Event('input'));
  }
});
function _toggleStatsCollapse(){
  statsCollapsed=!statsCollapsed;
  const body=document.getElementById('statsBody');
  const btn=document.getElementById('statsCollapseBtn');
  if(statsCollapsed){body.style.display='none';}
  else{body.style.display='';renderStats();}
  btn.textContent=statsCollapsed?'▶':'▼';
  updateStatsPanelTitle();
}
// Clicking anywhere on the header (except textarea/button which stopPropagation) toggles
// Mobile has its own handler below; skip here to avoid double-fire
document.getElementById('statsHdr').addEventListener('click',e=>{if(!isMobile())_toggleStatsCollapse();});
document.getElementById('statsCollapseBtn').addEventListener('click',e=>{
  e.stopPropagation();
  _toggleStatsCollapse();
});

function _doGoalToggle(){
  goalsCollapsed=!goalsCollapsed;
  document.getElementById('goalCollapseBtn').textContent=goalsCollapsed?'▶':'▼';
  if(isMobile())document.body.classList.toggle('goals-m-hidden',goalsCollapsed);
  requestAnimationFrame(()=>syncGoalRowHeight());
}
document.getElementById('goalCollapseBtn').addEventListener('click',_doGoalToggle);
document.getElementById('goalCollapseBtn').addEventListener('touchend',e=>{
  e.preventDefault();e.stopPropagation();_doGoalToggle();
});
// Apply initial collapsed states
{
  const _sb=document.getElementById('statsBody');
  if(_sb)_sb.style.display='none';
  const _scb=document.getElementById('statsCollapseBtn');
  if(_scb)_scb.textContent='▶';
  updateStatsPanelTitle();
  const _gcb=document.getElementById('goalCollapseBtn');
  if(_gcb)_gcb.textContent='▶';
}
