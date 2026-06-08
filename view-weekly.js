function renderTimeIndicator(){
  document.querySelectorAll('.time-now-line,.time-now-lbl').forEach(e=>e.remove());
  const now=new Date();const min=now.getHours()*60+now.getMinutes();
  if(min<START_M||min>END_M)return;
  const y=minToY(min);
  document.querySelectorAll('.day-body').forEach(body=>{
    const line=document.createElement('div');line.className='time-now-line';line.style.top=y+'px';
    const dot=document.createElement('div');dot.className='time-now-dot';line.appendChild(dot);
    body.appendChild(line);
  });
  const wrap=document.getElementById('timeLabels');
  if(wrap){const lbl=document.createElement('div');lbl.className='time-label time-now-lbl';lbl.style.top=y+'px';lbl.textContent=fmtTime(min);wrap.appendChild(lbl);}
}
setInterval(renderTimeIndicator,60000);

function renderRoutine(){}

// ── render ────────────────────────────────────────────────────────────────────
function render(){
  document.body.dataset.view=viewMode;
  const pw=document.getElementById('plannerWrapper');
  const mw=document.getElementById('monthWrap');
  const rw=document.getElementById('reviewWrap');
  const ds=document.getElementById('dailySummary');
  const cpBtn=document.getElementById('copyPrevWeek');
  const rsBtn=document.getElementById('resetWeek');
  const todayBtn=document.getElementById('todayBtn');
  const granGroup=document.getElementById('granGroup');
  if(viewMode==='week'){
    pw.classList.remove('u-hidden');mw.classList.add('u-hidden');if(rw)rw.classList.add('u-hidden');ds.classList.add('u-hidden');
    cpBtn.classList.remove('u-hidden');rsBtn.classList.remove('u-hidden');
    todayBtn.classList.add('u-hidden');granGroup.classList.remove('u-hidden');
    document.getElementById('dailyRetro').classList.add('u-hidden');
    document.getElementById('navLabel').textContent=weekLabelStr(currentMonday);
    buildTimeAxis();buildDayCols();renderBlocks();
    if(isMobile()){requestAnimationFrame(()=>{const tc=document.querySelector('.day-col.today');if(tc){const pw=document.getElementById('plannerWrapper');pw.scrollLeft=Math.max(0,tc.offsetLeft-40);}});}
    renderWeeklyRetro();buildDdayGrid();
    renderRoutine();
  } else if(viewMode==='day'){
    pw.classList.remove('u-hidden');mw.classList.add('u-hidden');if(rw)rw.classList.add('u-hidden');
    cpBtn.classList.add('u-hidden');rsBtn.classList.add('u-hidden');
    todayBtn.classList.remove('u-hidden');granGroup.classList.remove('u-hidden');
    document.getElementById('weeklyRetro').classList.add('u-hidden');
    document.getElementById('ddayGrid').classList.add('u-hidden');
    renderDailyView();
  } else if(viewMode==='review'){
    pw.classList.add('u-hidden');mw.classList.add('u-hidden');if(rw)rw.classList.remove('u-hidden');ds.classList.add('u-hidden');
    cpBtn.classList.add('u-hidden');rsBtn.classList.add('u-hidden');
    todayBtn.classList.add('u-hidden');granGroup.classList.add('u-hidden');
    document.getElementById('weeklyRetro').classList.add('u-hidden');
    document.getElementById('ddayGrid').classList.add('u-hidden');
    document.getElementById('dailyRetro').classList.add('u-hidden');
    document.getElementById('navLabel').textContent='회독 관리';
    renderReview();
  } else {
    pw.classList.add('u-hidden');mw.classList.remove('u-hidden');if(rw)rw.classList.add('u-hidden');ds.classList.add('u-hidden');
    cpBtn.classList.add('u-hidden');rsBtn.classList.add('u-hidden');
    todayBtn.classList.add('u-hidden');granGroup.classList.add('u-hidden');
    document.getElementById('weeklyRetro').classList.add('u-hidden');
    document.getElementById('ddayGrid').classList.add('u-hidden');
    document.getElementById('dailyRetro').classList.add('u-hidden');
    document.getElementById('navLabel').textContent=monthLabelStr(currentMonday);
    renderMonthView();
    renderRoutine();
  }
}

function buildTimeAxis(){
  const wrap=document.getElementById('timeLabels');
  wrap.style.height=totalH()+'px';wrap.innerHTML='';
  for(let h=START_H;h<END_H;h++){
    const el=document.createElement('div');el.className='time-label';el.style.top=minToY(h*60)+'px';el.textContent=h+':00';wrap.appendChild(el);
  }
}

function syncGoalRowHeight(){
  const rows=document.querySelectorAll('.daily-goal-row');
  if(!rows.length)return;
  rows.forEach(r=>{
    r.style.display='';
    r.style.height='auto';
    r.classList.toggle('goals-hidden',goalsCollapsed);
  });
  let maxH=0;
  rows.forEach(r=>{const h=r.getBoundingClientRect().height;if(h>maxH)maxH=h;});
  if(!maxH)return;
  rows.forEach(r=>r.style.height=maxH+'px');
  const spacer=document.querySelector('.time-goal-spacer');
  if(spacer)spacer.style.height=maxH+'px';
}

function buildGoalRowContent(rowEl, dk){
  const goals=autoPopulateDailyGoals(dk);
  const d=parseInt(rowEl.dataset.day);
  const{planned,actual}=computeDayHours(d);
  const dayResText=viewMode==='week'?(localStorage.getItem('dayRes_'+dk)||''):'';
  const dayResTrunc=dayResText.length>14?dayResText.slice(0,14)+'…':dayResText;
  let html=`<div class="dgrow-hours-wrap"><div class="dgrow-hours"><span class="dgrow-hours-actual">${actual}h</span> / ${planned}h</div>${dayResTrunc?`<span class="dgrow-dayres">${escHtml(dayResTrunc)}</span>`:''}</div><div class="dgrow-goals">`;
  goals.forEach(g=>{
    const status=getGoalStatus(g);
    const isDone=status==='done';const isFail=status==='fail';
    const checkClass=isDone?' done':isFail?' fail':'';
    const checkContent=isDone?'✓':isFail?'✗':'';
    html+=`<div class="dgrow-item">`+
      `<div class="dgrow-check${checkClass}" data-dgcheck="${g.id}">${checkContent}</div>`+
      `<input class="dgrow-text${isDone?' done-text':''}" data-dgtext="${g.id}" value="${escHtml(g.text)}" placeholder="목표...">`+
      `<button class="dgrow-del" data-dgdel="${g.id}" tabindex="-1">×</button>`+
    `</div>`;
  });
  html+=`</div><button class="dgrow-add" tabindex="-1">+ 목표</button>`;
  rowEl.innerHTML=html;
  rowEl.querySelectorAll('[data-dgcheck]').forEach(el=>{
    el.addEventListener('mousedown',e=>e.stopPropagation());
    el.addEventListener('click',e=>{
      e.stopPropagation();
      const gs=loadDailyGoals(dk);
      const g=gs.find(x=>x.id===el.dataset.dgcheck);
      if(g){
        const cur=getGoalStatus(g);
        const next=cur===''?'done':cur==='done'?'fail':'';
        g.status=next;g.done=next==='done';
        gs.sort((a,b)=>(getGoalStatus(a)===''?0:1)-(getGoalStatus(b)===''?0:1));
        saveDailyGoals(dk,gs);
        if(g.blkId){const blk=getBlock(g.blkId);if(blk){blk.status=next;blk.completed=next==='done';saveWeek();renderBlocks();}}
        buildGoalRowContent(rowEl,dk);
        syncGoalRowHeight();
      }
    });
  });
  rowEl.querySelectorAll('[data-dgtext]').forEach(inp=>{
    inp.addEventListener('mousedown',e=>e.stopPropagation());
    inp.addEventListener('click',e=>e.stopPropagation());
    const _saveGoalText=()=>{const gs=loadDailyGoals(dk);const g=gs.find(x=>x.id===inp.dataset.dgtext);if(g){g.text=inp.value.trim();saveDailyGoals(dk,gs);}};
    inp.addEventListener('input',_saveGoalText);
    inp.addEventListener('change',_saveGoalText);
    inp.addEventListener('keydown',e=>{
      if(e.key==='Tab'){e.preventDefault();return;}
      if(e.key==='Enter'){
        e.preventDefault();
        const curId=inp.dataset.dgtext;
        const gs=loadDailyGoals(dk);
        const curIdx=gs.findIndex(x=>x.id===curId);
        if(curIdx>=0)gs[curIdx].text=inp.value.trim();
        const ng={id:uid(),text:'',status:'',done:false};
        gs.splice(curIdx>=0?curIdx+1:gs.length,0,ng);
        saveDailyGoals(dk,gs);buildGoalRowContent(rowEl,dk);syncGoalRowHeight();
        const ni=rowEl.querySelector(`[data-dgtext="${ng.id}"]`);if(ni)ni.focus();
        return;
      }
      if(e.key==='Backspace'&&inp.value===''){
        e.preventDefault();
        const curId=inp.dataset.dgtext;
        let gs=loadDailyGoals(dk);
        const curIdx=gs.findIndex(x=>x.id===curId);
        gs=gs.filter(x=>x.id!==curId);
        saveDailyGoals(dk,gs);buildGoalRowContent(rowEl,dk);syncGoalRowHeight();
        const inps=[...rowEl.querySelectorAll('[data-dgtext]')];
        if(inps.length)inps[Math.max(0,curIdx-1)].focus();
      }
    });
  });
  rowEl.querySelectorAll('[data-dgdel]').forEach(btn=>{
    btn.addEventListener('mousedown',e=>e.stopPropagation());
    btn.addEventListener('click',e=>{e.stopPropagation();let gs=loadDailyGoals(dk);gs=gs.filter(x=>x.id!==btn.dataset.dgdel);saveDailyGoals(dk,gs);buildGoalRowContent(rowEl,dk);syncGoalRowHeight();});
  });
  const addBtn=rowEl.querySelector('.dgrow-add');
  addBtn.addEventListener('mousedown',e=>e.stopPropagation());
  addBtn.addEventListener('click',e=>{e.stopPropagation();const gs=loadDailyGoals(dk);gs.push({id:uid(),text:'',status:'',done:false});saveDailyGoals(dk,gs);buildGoalRowContent(rowEl,dk);syncGoalRowHeight();const inps=rowEl.querySelectorAll('[data-dgtext]');if(inps.length)inps[inps.length-1].focus();});
}

function buildDayCols(){
  const area=document.getElementById('daysArea');area.innerHTML='';
  const today=new Date();
  const numCols=viewMode==='day'?1:7;
  const startD=viewMode==='day'?dayIdx(currentDay):0;
  for(let di=0;di<numCols;di++){
    const d=viewMode==='day'?startD:di;
    const date=addDays(currentMonday,d);
    const col=document.createElement('div');
    col.className='day-col'+(isSameDay(date,today)?' today':'');
    col.dataset.day=d;
    const dk=dateKey(date);
    const hdr=document.createElement('div');hdr.className='day-header';
    const dateLabel=`${date.getMonth()+1}.${date.getDate()}(${DAYS[d]})`;
    hdr.innerHTML=`<div class="day-date">${dateLabel}</div>`;
    const routineRow=document.createElement('div');routineRow.className='day-routine-row';
    const rdata=loadRoutine(dk);
    ROUTINES.forEach(r=>{
      const rs=getRoutineStatus(rdata,r.id);
      const done=rs==='done';
      const btn=document.createElement('button');
      btn.className='routine-hdr-btn'+(done?' done':'');
      btn.title=r.label;
      btn.textContent=done?'✅'+r.icon:r.icon;
      btn.addEventListener('mousedown',e=>e.stopPropagation());
      btn.addEventListener('click',e=>{
        e.stopPropagation();
        const rd=loadRoutine(dk);
        const cur=getRoutineStatus(rd,r.id);
        const next=cur==='done'?'':'done';
        rd[r.id]=next;saveRoutine(dk,rd);
        btn.className='routine-hdr-btn'+(next?' done':'');
        btn.textContent=next==='done'?'✅'+r.icon:r.icon;
      });
      routineRow.appendChild(btn);
    });
    hdr.appendChild(routineRow);
    col.appendChild(hdr);
    const goalRow=document.createElement('div');goalRow.className='daily-goal-row';goalRow.dataset.day=d;
    buildGoalRowContent(goalRow,dk);
    col.appendChild(goalRow);
    const body=document.createElement('div');body.className='day-body';body.dataset.day=d;body.style.height=totalH()+'px';
    addTint(body,'morning',7*60,10*60);addTint(body,'afternoon',13*60,15*60);addTint(body,'evening',19*60,22*60);
    for(let h=START_H;h<=END_H;h++){
      addGridLine(body,h*60,'grid-hour');
      if(h<END_H){if(gran<=30)addGridLine(body,h*60+30,'grid-sub');if(gran===10)[10,20,40,50].forEach(off=>addGridLine(body,h*60+off,'grid-sub'));}
    }
    if(!isMobile()){
      const hoverCell=document.createElement('div');hoverCell.className='grid-hover-cell';body.appendChild(hoverCell);
      body.addEventListener('mousemove',e=>{
        if(drag){hoverCell.style.display='none';return;}
        const y=bodyY(body,e.clientY);
        const min=snapMin(clampMin(yToMin(y)));
        hoverCell.style.display='block';
        hoverCell.style.top=minToY(min)+'px';
        hoverCell.style.height=(gran*ppm())+'px';
      });
      body.addEventListener('mouseleave',()=>{hoverCell.style.display='none';});
    }
    col.appendChild(body);area.appendChild(col);
  }
  syncGoalRowHeight();
}

function addTint(parent,type,from,to){const el=document.createElement('div');el.className=`tint tint-${type}`;el.style.top=minToY(from)+'px';el.style.height=(minToY(to)-minToY(from))+'px';parent.appendChild(el);}
function addGridLine(parent,min,cls){const el=document.createElement('div');el.className=`grid-line ${cls}`;el.style.top=minToY(min)+'px';parent.appendChild(el);}

function buildBlockEl(blk){
  const subj=SUBJECTS[blk.subject]||SUBJECTS.rest;
  const dur=blk.endMin-blk.startMin;
  const h=Math.max(dur*ppm(),26);
  const isGhost=!!blk.ghost;
  const showContent=h>=36||viewMode==='day';
  const showNote=h>=60||viewMode==='day';
  const iconPaths=SUBJECT_ICONS[blk.subject]||SUBJECT_ICONS.rest;
  const tintBg=hexToRgba(subj.color,0.12);
  const el=document.createElement('div');
  const blkStatus=blk.status||(blk.completed?'done':'');
  el.className='block'+(blkStatus==='done'?' completed':blkStatus==='fail'?' failed':'')+(selectedIds.has(blk.id)?' selected':'')+(isGhost?' ghost-sr':'');
  el.dataset.id=blk.id;
  const borderStyle=subj.dashed?'dashed':'solid';
  el.style.cssText=`top:${minToY(blk.startMin)}px;height:${h}px;border-left:3px ${borderStyle} ${subj.color};--block-h:${h}px;`;
  const statusBadge=blkStatus==='done'?`<span class="block-done-badge">✓</span>`:blkStatus==='fail'?`<span class="block-fail-badge">✗</span>`:'';
  const subjLabel=statusBadge+`<span class="block-subj-name" data-subj-pick="${blk.id}">${subj.name}</span>`+(blk.memo?`<span class="block-memo-dot" style="background:${subj.color}"></span>`:'');
  el.innerHTML=
    `<div class="resize-n" data-rid="${blk.id}" data-rdir="n"></div>`+
    `<button class="block-done-btn" data-done="${blk.id}">${blkStatus==='fail'?'✗':'✓'}</button>`+
    (!isGhost?`<button class="block-focus-btn" data-focus="${blk.id}">▶</button>`:'')+
    `<div class="block-subject">${subjLabel}</div>`+
    (isGhost?`<div class="block-review-label">${blk.ghostLabel||'복습'}</div>`:'')+
    `<div class="block-content-row${showContent?'':' u-hidden'}">`+
      `<svg class="block-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${subj.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${iconPaths}</svg>`+
      `<span class="block-memo-text" data-inline-edit="${blk.id}">${blk.memo?escHtml(blk.memo):''}</span>`+
    `</div>`+
    `<div class="block-note${showNote?'':' u-hidden'}${(!blk.note&&viewMode==='day')?' empty':''}" data-note-edit="${blk.id}">${blk.note?escHtml(blk.note):(viewMode==='day'?'메모...':'')}</div>`+
    `<div class="block-time-label">${fmtTime(blk.startMin)}–${fmtTime(blk.endMin)}</div>`+
    (!isGhost&&dur>90?`<div class="block-warn">90분 초과 <button class="warn-btn" data-add-rest="${blk.id}">휴식 추가?</button></div>`:'')+
    `<div class="block-duration">${fmtDuration(dur)}</div>`+
    (blk.repeat?`<span class="block-repeat-icon">🔁</span>`:'')+
    `<div class="resize-w" data-rid="${blk.id}" data-rdir="w"></div>`+
    `<div class="resize-e" data-rid="${blk.id}" data-rdir="e"></div>`+
    `<div class="resize-s" data-rid="${blk.id}" data-rdir="s"></div>`;
  return el;
}

function computeDayStudyH(dayIndex){
  const mins=blocks.filter(b=>b.day===dayIndex&&!b.ghost&&b.subject!=='rest').reduce((s,b)=>s+(b.endMin-b.startMin),0);
  return (mins/60).toFixed(1);
}
function computeDayHours(dayIndex){
  const db=blocks.filter(b=>b.day===dayIndex&&!b.ghost&&b.subject!=='rest');
  const planned=(db.reduce((s,b)=>s+(b.endMin-b.startMin),0)/60).toFixed(1);
  const actual=(db.filter(b=>b.completed).reduce((s,b)=>s+(b.endMin-b.startMin),0)/60).toFixed(1);
  return{planned,actual};
}
function getGoalStatus(g){
  if(g.status!==undefined)return g.status;
  return g.done?'done':'';
}
function updateDailyGoalRows(){
  document.querySelectorAll('.daily-goal-row').forEach(row=>{
    const d=parseInt(row.dataset.day);
    const el=row.querySelector('.dgrow-hours');
    if(el){const{planned,actual}=computeDayHours(d);el.innerHTML=`<span class="dgrow-hours-actual">${actual}h</span> / ${planned}h`;}
  });
}

function renderBlocks(){
  if(_renderingBlocks)return;
  _renderingBlocks=true;
  document.querySelectorAll('.block').forEach(el=>el.remove());
  const vDay=viewMode==='day'?dayIdx(currentDay):null;
  blocks.forEach(blk=>{
    if(vDay!==null&&blk.day!==vDay)return;
    const body=document.querySelector(`.day-body[data-day="${blk.day}"]`);if(!body)return;
    body.appendChild(buildBlockEl(blk));
  });
  updateDailyGoalRows();
  renderStats();updateStatsPanelTitle();renderTimeIndicator();renderTemplates();
  renderDailySummary();renderDailyRetro();buildDdayGrid();
  renderToolbarProgress();
  _renderingBlocks=false;
}


function findBlockEl(el){while(el){if(el.classList&&el.classList.contains('block'))return el;if(el.classList&&el.classList.contains('day-body'))return null;el=el.parentElement;}return null;}
function findDayBody(el){while(el){if(el.classList&&el.classList.contains('day-body'))return el;if(el.classList&&el.classList.contains('days-area'))return null;el=el.parentElement;}return null;}
function bodyY(body,clientY){return clientY-body.getBoundingClientRect().top;}
function dayBodyAt(cx){for(const b of document.querySelectorAll('.day-body')){const r=b.getBoundingClientRect();if(cx>=r.left&&cx<=r.right)return b;}return null;}
function getBlock(id){return blocks.find(b=>b.id===id);}
function startDrag(){document.addEventListener('mousemove',onMouseMove);document.addEventListener('mouseup',onMouseUp);document.body.style.userSelect='none';}
function endDrag(){document.removeEventListener('mousemove',onMouseMove);document.removeEventListener('mouseup',onMouseUp);document.body.style.userSelect='';}

// ── mouse events ──────────────────────────────────────────────────────────────
function onMouseDown(e){
  if(e.button!==0)return;hideCtx();hideSubjectPicker();

  // subject picker
  const subjPickId=e.target.dataset&&e.target.dataset.subjPick;
  if(subjPickId){e.stopPropagation();showSubjectPicker(subjPickId,e.target);return;}

  // focus mode button
  if(e.target.dataset&&e.target.dataset.focus){
    e.preventDefault();e.stopPropagation();
    const blk=getBlock(e.target.dataset.focus);if(!blk)return;
    const base=viewMode==='week'?currentMonday:getMondayOf(currentDay);
    currentDay=addDays(base,blk.day);
    viewMode='day';
    document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view==='day'));
    currentMonday=getMondayOf(currentDay);blocks=loadWeek(currentMonday);
    renderDailyView();
    return;
  }
  // completion button
  if(e.target.dataset&&e.target.dataset.done){
    e.preventDefault();e.stopPropagation();
    const blk=getBlock(e.target.dataset.done);
    if(blk){if(blk.ghost){confirmGhost(blk.id);return;}pushUndo();const cur=blk.status||(blk.completed?'done':'');blk.status=cur===''?'done':cur==='done'?'fail':'';blk.completed=(blk.status==='done');saveWeek();renderBlocks();const _bdk=dateKey(addDays(currentMonday,blk.day));const _bgs=loadDailyGoals(_bdk);const _bg=_bgs.find(g=>g.blkId===blk.id);if(_bg){_bg.status=blk.status;_bg.done=blk.completed;saveDailyGoals(_bdk,_bgs);const _brow=document.querySelector(`.daily-goal-row[data-day="${blk.day}"]`);if(_brow){buildGoalRowContent(_brow,_bdk);syncGoalRowHeight();}}}
    return;
  }
  // 90-min rest
  if(e.target.dataset&&e.target.dataset.addRest){e.preventDefault();e.stopPropagation();addRestBlock(e.target.dataset.addRest);return;}
  // inline memo
  const inlineId=e.target.dataset&&e.target.dataset.inlineEdit;
  if(inlineId){e.stopPropagation();activateInlineEdit(inlineId);return;}
  const noteId=e.target.dataset&&e.target.dataset.noteEdit;
  if(noteId){e.stopPropagation();activateNoteEdit(noteId);return;}
  // drag / resize / create — disabled on mobile (handled by touch events)
  if(isMobile())return;
  // resize
  const rdir=e.target.dataset&&e.target.dataset.rdir;
  const rid=e.target.dataset&&e.target.dataset.rid;
  if(rdir&&rid){e.preventDefault();e.stopPropagation();pushUndo();drag={type:'resize',id:rid,dir:rdir};startDrag();return;}
  // block select/move
  const blkEl=findBlockEl(e.target);
  if(blkEl){
    e.preventDefault();
    const id=blkEl.dataset.id;
    const blk=getBlock(id);
    if(blk&&blk.ghost){confirmGhost(id);return;}
    const now=Date.now();
    if(dblClickId===id&&now-dblClickTimer<400){dblClickTimer=0;dblClickId=null;openEditModal(id);return;}
    dblClickTimer=now;dblClickId=id;
    if(e.shiftKey){
      if(selectedIds.has(id)){selectedIds.delete(id);blkEl.classList.remove('selected');}
      else{selectedIds.add(id);blkEl.classList.add('selected');}
      return;
    }
    if(!selectedIds.has(id)){clearSelection();selectedIds.add(id);blkEl.classList.add('selected');}
    if(!blk)return;
    pushUndo();
    const origPositions={};
    selectedIds.forEach(sid=>{const b=getBlock(sid);if(b)origPositions[sid]={day:b.day,startMin:b.startMin,endMin:b.endMin};});
    const rect=blkEl.getBoundingClientRect();
    drag={type:'move',id:blk.id,offsetY:e.clientY-rect.top,duration:blk.endMin-blk.startMin,origDay:blk.day,origStart:blk.startMin,origPositions};
    selectedIds.forEach(sid=>{const el=document.querySelector(`.block[data-id="${sid}"]`);if(el)el.style.opacity='.4';});
    startDrag();return;
  }
  // empty area
  const body=findDayBody(e.target);
  if(body){
    e.preventDefault();clearSelection();
    const day=parseInt(body.dataset.day);
    const startMin=snapMin(clampMin(yToMin(bodyY(body,e.clientY))));
    drag={type:'create-or-select',day,startMin,body,ghost:null,startX:e.clientX,startY:e.clientY};
    startDrag();
  }
}

function onMouseMove(e){
  if(!drag)return;
  if(drag.type==='create-or-select'){
    const dx=Math.abs(e.clientX-drag.startX),dy=Math.abs(e.clientY-drag.startY);
    if(dx>15){drag.type='select';createSelRect(drag.startX,drag.startY);}
    else if(dy>6){
      drag.type='create';
      const subj=SUBJECTS[lastSubject]||SUBJECTS.labor_law;
      const ghost=document.createElement('div');ghost.className='ghost-block';ghost.style.top=minToY(drag.startMin)+'px';ghost.style.height='4px';
      drag.body.appendChild(ghost);drag.ghost=ghost;drag.endMin=drag.startMin+gran;
    }
    return;
  }
  if(drag.type==='select'){updateSelRect(drag.startX,drag.startY,e.clientX,e.clientY);hitTestSelection(drag.startX,drag.startY,e.clientX,e.clientY);return;}
  if(drag.type==='create'){
    drag.endMin=Math.max(clampMin(snapMin(yToMin(bodyY(drag.body,e.clientY)))),drag.startMin+gran);
    drag.ghost.style.height=Math.max(minToY(drag.endMin)-minToY(drag.startMin),4)+'px';return;
  }
  if(drag.type==='resize'){
    const blk=getBlock(drag.id);if(!blk)return;
    if(drag.dir==='s'){
      const body=document.querySelector(`.day-body[data-day="${blk.day}"]`);if(!body)return;
      blk.endMin=Math.max(clampMin(snapMin(yToMin(bodyY(body,e.clientY)))),blk.startMin+gran);
      const el=document.querySelector(`.block[data-id="${blk.id}"]`);
      if(el){el.style.height=Math.max((blk.endMin-blk.startMin)*ppm(),14)+'px';el.querySelector('.block-time-label').textContent=`${fmtTime(blk.startMin)}–${fmtTime(blk.endMin)}`;}
    } else if(drag.dir==='n'){
      const body=document.querySelector(`.day-body[data-day="${blk.day}"]`);if(!body)return;
      const ns=Math.min(clampMin(snapMin(yToMin(bodyY(body,e.clientY)))),blk.endMin-gran);blk.startMin=ns;
      const el=document.querySelector(`.block[data-id="${blk.id}"]`);
      if(el){el.style.top=minToY(blk.startMin)+'px';el.style.height=Math.max((blk.endMin-blk.startMin)*ppm(),14)+'px';el.querySelector('.block-time-label').textContent=`${fmtTime(blk.startMin)}–${fmtTime(blk.endMin)}`;}
    } else if(drag.dir==='w'||drag.dir==='e'){
      const tb=dayBodyAt(e.clientX);if(!tb)return;
      const nd=parseInt(tb.dataset.day);if(nd===blk.day)return;
      const el=document.querySelector(`.block[data-id="${blk.id}"]`);if(el){el.remove();tb.appendChild(el);}blk.day=nd;
    }
    return;
  }
  if(drag.type==='move'){
    const tb=dayBodyAt(e.clientX);if(!tb)return;
    const nd=parseInt(tb.dataset.day);
    let ns=snapMin(clampMin(yToMin(bodyY(tb,e.clientY)-drag.offsetY)));
    if(ns+drag.duration>END_M)ns=END_M-drag.duration;
    if(ns<START_M)ns=START_M;
    const dayDelta=nd-drag.origDay;
    const minDelta=ns-drag.origStart;
    selectedIds.forEach(sid=>{
      const selBlk=getBlock(sid);if(!selBlk)return;
      const orig=drag.origPositions[sid];if(!orig)return;
      const newDay=Math.max(0,Math.min(6,orig.day+dayDelta));
      const dur=orig.endMin-orig.startMin;
      let newStart=orig.startMin+minDelta;
      let newEnd=newStart+dur;
      if(newEnd>END_M){newEnd=END_M;newStart=END_M-dur;}
      if(newStart<START_M){newStart=START_M;newEnd=START_M+dur;}
      selBlk.day=newDay;selBlk.startMin=newStart;selBlk.endMin=newEnd;
      const el=document.querySelector(`.block[data-id="${sid}"]`);if(!el)return;
      const newBody=document.querySelector(`.day-body[data-day="${newDay}"]`);
      if(newBody&&el.parentElement!==newBody)newBody.appendChild(el);
      el.style.top=minToY(newStart)+'px';
      el.style.height=Math.max(dur*ppm(),14)+'px';
      const tl=el.querySelector('.block-time-label');if(tl)tl.textContent=`${fmtTime(newStart)}–${fmtTime(newEnd)}`;
    });
  }
}

function onMouseUp(){
  if(!drag)return;
  if(drag.type==='create-or-select'){drag=null;endDrag();return;}
  if(drag.type==='select'){removeSelRect();drag=null;endDrag();return;}
  if(drag.type==='create'){
    drag.ghost.remove();
    if(drag.endMin-drag.startMin>=gran){pushUndo();const nb={id:uid(),day:drag.day,startMin:drag.startMin,endMin:drag.endMin,subject:lastSubject,memo:'',note:'',completed:false};blocks.push(nb);saveWeek();autoGoalFromBlock(nb);}
  } else if(drag.type==='resize'||drag.type==='move'){saveWeek();}
  drag=null;endDrag();renderBlocks();
}

// ── context menu ──────────────────────────────────────────────────────────────
function onContextMenu(e){
  const blkEl=findBlockEl(e.target);
  if(blkEl){
    e.preventDefault();e.stopPropagation();
    const blk=getBlock(blkEl.dataset.id);if(!blk)return;
    const menu=document.getElementById('ctxMenu');
    menu.innerHTML=
      (blk.ghost?`<button class="ctx-item" data-action="confirm" data-id="${blk.id}">복습 확정 (일반 블록으로)</button><div class="ctx-divider"></div>`:'')+
      (()=>{const st=blk.status||(blk.completed?'done':'');const lbl=st===''?'완료로 표시':st==='done'?'실패로 표시':'미완료로 표시';return`<button class="ctx-item" data-action="toggle" data-id="${blk.id}">${lbl}</button>`;})()+
      (!blk.ghost?`<button class="ctx-item" data-action="save-tmpl" data-id="${blk.id}">반복 템플릿으로 저장</button><button class="ctx-item" data-action="review" data-id="${blk.id}">복습 예약 (+3/+7/+14일)</button><button class="ctx-item" data-action="repeat-set" data-id="${blk.id}">요일 반복 설정</button>${blk.repeat?`<button class="ctx-item" data-action="repeat-clear" data-id="${blk.id}">반복 해제</button>`:``}`:'')+
      `<div class="ctx-divider"></div>`+
      `<button class="ctx-item danger" data-action="delete" data-id="${blk.id}">삭제</button>`;
    menu.style.display='block';menu.style.left=e.clientX+'px';menu.style.top=e.clientY+'px';
    requestAnimationFrame(()=>{const r=menu.getBoundingClientRect();if(r.right>window.innerWidth)menu.style.left=(e.clientX-r.width)+'px';if(r.bottom>window.innerHeight)menu.style.top=(e.clientY-r.height)+'px';});
    menu.onclick=ev=>{
      const btn=ev.target.closest('[data-action]');if(!btn)return;
      const id=btn.dataset.id;const b=getBlock(id);
      if(btn.dataset.action==='toggle'){if(b){pushUndo();const cur=b.status||(b.completed?'done':'');b.status=cur===''?'done':cur==='done'?'fail':'';b.completed=(b.status==='done');saveWeek();renderBlocks();const _bdk=dateKey(addDays(currentMonday,b.day));const _bgs=loadDailyGoals(_bdk);const _bg=_bgs.find(g=>g.blkId===b.id);if(_bg){_bg.status=b.status;_bg.done=b.completed;saveDailyGoals(_bdk,_bgs);const _brow=document.querySelector(`.daily-goal-row[data-day="${b.day}"]`);if(_brow){buildGoalRowContent(_brow,_bdk);syncGoalRowHeight();}}}}
      else if(btn.dataset.action==='delete'){pushUndo();if(b)removeGoalForBlock(b);blocks=blocks.filter(x=>x.id!==id);selectedIds.delete(id);saveWeek();renderBlocks();}
      else if(btn.dataset.action==='save-tmpl'){if(b)saveAsTemplate(b);}
      else if(btn.dataset.action==='review'){if(b)scheduleReview(b);}
      else if(btn.dataset.action==='confirm'){confirmGhost(id);}
      else if(btn.dataset.action==='repeat-set'){if(b)openRepeatModal(b.id);}
      else if(btn.dataset.action==='repeat-clear'){if(b){pushUndo();b.repeat=false;saveWeek();renderBlocks();}}
      hideCtx();
    };
    return;
  }
  // empty cell right-click — show review content insertion menu
  const body=findDayBody(e.target);if(!body)return;
  e.preventDefault();e.stopPropagation();
  const dayIdx=parseInt(body.dataset.day);
  const targetDate=addDays(currentMonday,dayIdx);
  const tgt=dateKey(targetDate);
  const startMin=snapMin(clampMin(yToMin(bodyY(body,e.clientY))));
  const endMin=startMin+60;
  const menu=document.getElementById('ctxMenu');
  const reviewItems=REVIEW_SUBJECTS.map(rs=>{
    const memo=getTodayMemoForSubject(rs.key,tgt);
    const label=memo?escHtml(memo):rs.name;
    const dot=`<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${rs.color};margin-right:6px;flex-shrink:0;vertical-align:middle"></span>`;
    return`<button class="ctx-item" data-action="ins-review" data-subj="${rs.key}" data-start="${startMin}" data-end="${endMin}" data-day="${dayIdx}" data-memo="${escHtml(memo||'')}" style="white-space:normal;max-width:260px;line-height:1.3">${dot}${label}</button>`;
  }).join('');
  // quick-insert: all user-saved items from localStorage, grouped by category
  const _allCustom=_loadQuickItems();
  let quickHtml='';
  if(_allCustom.length){
    const _qCats={};
    _allCustom.forEach(item=>{if(!_qCats[item.cat])_qCats[item.cat]=[];_qCats[item.cat].push(item);});
    quickHtml+=`<div class="ctx-divider"></div>`;
    Object.entries(_qCats).forEach(([cat,items])=>{
      const sk=_catToSubjKey(cat);const col=sk?SUBJECTS[sk]?.color:'#9B9A97';
      quickHtml+=`<div style="font-size:11px;color:#9B9A97;padding:6px 10px 2px;font-weight:600;letter-spacing:.3px">${cat}</div>`;
      items.forEach(item=>{
        const dot=`<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${col||'#9B9A97'};margin-right:6px;flex-shrink:0;vertical-align:middle"></span>`;
        const sk2=sk||'rest';
        quickHtml+=`<button class="ctx-item" data-action="quick-ins" data-text="${escHtml(item.text)}" data-cat="${escHtml(item.cat)}" data-subj="${sk2}" data-start="${startMin}" data-end="${endMin}" data-day="${dayIdx}" style="white-space:normal;max-width:260px;line-height:1.3">${dot}${escHtml(item.text)}</button>`;
      });
    });
  }
  quickHtml+=`<div class="ctx-divider"></div><button class="ctx-item" data-action="quick-edit" style="color:#9B9A97;font-size:12px">+ 바로 추가</button>`;
  menu.innerHTML=`<div style="font-size:11px;color:#9B9A97;padding:6px 10px 2px;font-weight:600;letter-spacing:.3px">회독 내용 삽입 · ${fmtTime(startMin)}</div>`+reviewItems+quickHtml;
  menu.style.display='block';menu.style.left=e.clientX+'px';menu.style.top=e.clientY+'px';
  requestAnimationFrame(()=>{const r=menu.getBoundingClientRect();if(r.right>window.innerWidth)menu.style.left=(e.clientX-r.width)+'px';if(r.bottom>window.innerHeight)menu.style.top=(e.clientY-r.height)+'px';});
  menu.onclick=ev=>{
    const btn=ev.target.closest('[data-action]');if(!btn)return;
    if(btn.dataset.action==='ins-review'){
      pushUndo();
      const nb={id:uid(),day:parseInt(btn.dataset.day),startMin:parseInt(btn.dataset.start),endMin:parseInt(btn.dataset.end),subject:btn.dataset.subj,memo:btn.dataset.memo,note:'',completed:false};
      blocks.push(nb);saveWeek();renderBlocks();hideCtx();autoGoalFromBlock(nb);
    }else if(btn.dataset.action==='quick-ins'){
      pushUndo();
      const sk=btn.dataset.subj||_catToSubjKey(btn.dataset.cat)||'rest';
      const nb={id:uid(),day:parseInt(btn.dataset.day),startMin:parseInt(btn.dataset.start),endMin:parseInt(btn.dataset.end),subject:sk,memo:btn.dataset.text,note:'',completed:false};
      blocks.push(nb);saveWeek();renderBlocks();hideCtx();autoGoalFromBlock(nb);
    }else if(btn.dataset.action==='quick-edit'){
      hideCtx();_openQuickEditModal();
    }
  };
}

function hideCtx(){document.getElementById('ctxMenu').style.display='none';}

// ── quick-insert management ───────────────────────────────────────────────────
const _QUICK_CATS=['노동법','인사노무관리','행정쟁송법','노동경제학','스터디','기타'];
const _QUICK_DEFAULTS=[];
function _catToSubjKey(cat){return{노동법:'labor_law',인사노무관리:'hr_mgmt',행정쟝송법:'admin_law',행정쟁송법:'admin_law',노동경제학:'labor_econ'}[cat]||null;}
function _loadQuickItems(){try{return JSON.parse(localStorage.getItem('quickInsertItems')||'[]');}catch{return[];}}
function _saveQuickItems(items){localStorage.setItem('quickInsertItems',JSON.stringify(items));}
function _openQuickEditModal(){
  const prev=document.getElementById('_quickEditOverlay');if(prev)prev.remove();
  const custom=_loadQuickItems();
  const cats={};
  custom.forEach((item,idx)=>{if(!cats[item.cat])cats[item.cat]=[];cats[item.cat].push({...item,idx});});
  let itemsHtml='';
  if(!custom.length){
    itemsHtml='<div style="color:#9B9A97;font-size:13px;padding:8px 0">항목이 없습니다. 아래에서 추가하세요.</div>';
  }else{
    Object.entries(cats).forEach(([cat,items])=>{
      itemsHtml+=`<div style="font-size:11px;font-weight:600;color:#9B9A97;margin:10px 0 4px;letter-spacing:.4px">${cat}</div>`;
      items.forEach(item=>{
        itemsHtml+=`<div style="display:flex;align-items:center;gap:6px;padding:4px 0;border-bottom:1px solid #F4F4F2"><span style="flex:1;font-size:13px">${escHtml(item.text)}</span><button data-qdel="${item.idx}" style="background:none;border:none;cursor:pointer;font-size:15px;color:#C0BFBC;padding:0 4px;line-height:1">×</button></div>`;
      });
    });
  }
  const ov=document.createElement('div');
  ov.id='_quickEditOverlay';
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:10000;display:flex;align-items:center;justify-content:center';
  ov.innerHTML=`<div style="background:#fff;border-radius:12px;padding:20px 24px;width:360px;max-height:80vh;overflow-y:auto;box-shadow:0 8px 40px rgba(0,0,0,.18);font-family:inherit">
    <div style="font-weight:600;font-size:15px;margin-bottom:12px">빠른 입력 항목 편집</div>
    <div id="_qeList">${itemsHtml}</div>
    <div style="margin-top:16px;border-top:1px solid #F4F4F2;padding-top:14px">
      <div style="font-size:12px;font-weight:600;color:#9B9A97;margin-bottom:8px">새 항목 추가</div>
      <select id="_qeCat" style="width:100%;margin-bottom:8px;padding:7px 10px;border:1px solid #E9E9E7;border-radius:6px;font-size:13px;font-family:inherit;background:#fff">${_QUICK_CATS.map(c=>`<option value="${c}">${c}</option>`).join('')}</select>
      <div style="display:flex;gap:6px"><input id="_qeText" type="text" placeholder="항목 텍스트" style="flex:1;padding:7px 10px;border:1px solid #E9E9E7;border-radius:6px;font-size:13px;font-family:inherit;outline:none"><button id="_qeAdd" style="background:#37352F;color:#fff;border:none;border-radius:6px;padding:7px 14px;font-size:13px;cursor:pointer;font-family:inherit">추가</button></div>
    </div>
    <div style="display:flex;justify-content:flex-end;margin-top:16px"><button id="_qeClose" style="background:none;border:1px solid #E9E9E7;border-radius:6px;padding:7px 18px;font-size:13px;cursor:pointer;font-family:inherit">닫기</button></div>
  </div>`;
  document.body.appendChild(ov);
  const close=()=>ov.remove();
  ov.addEventListener('click',e=>{if(e.target===ov)close();});
  document.getElementById('_qeClose').onclick=close;
  ov.addEventListener('click',e=>{
    const del=e.target.closest('[data-qdel]');if(!del)return;
    const idx=parseInt(del.dataset.qdel);
    const items=_loadQuickItems();items.splice(idx,1);_saveQuickItems(items);
    close();_openQuickEditModal();
  });
  const addItem=()=>{
    const cat=document.getElementById('_qeCat').value;
    const text=document.getElementById('_qeText').value.trim();
    if(!text){document.getElementById('_qeText').focus();return;}
    const items=_loadQuickItems();items.push({cat,text});_saveQuickItems(items);
    close();_openQuickEditModal();
  };
  document.getElementById('_qeAdd').onclick=addItem;
  document.getElementById('_qeText').addEventListener('keydown',e=>{if(e.key==='Enter')addItem();});
}

// ── weekday repeat ─────────────────────────────────────────────────────────────
let _repeatBlkId=null;
function openRepeatModal(blkId){
  _repeatBlkId=blkId;
  const blk=getBlock(blkId);if(!blk)return;
  document.querySelectorAll('.repeat-day-chip').forEach(chip=>{
    chip.classList.toggle('on',parseInt(chip.dataset.rday)===blk.day);
  });
  document.querySelector('input[name="rperiod"][value="thisweek"]').checked=true;
  document.getElementById('repeatModalOverlay').classList.add('open');
}
function closeRepeatModal(){
  document.getElementById('repeatModalOverlay').classList.remove('open');
  _repeatBlkId=null;
}
document.getElementById('repeatCancel').onclick=closeRepeatModal;
document.getElementById('repeatModalOverlay').onclick=e=>{if(e.target===document.getElementById('repeatModalOverlay'))closeRepeatModal();};
document.querySelectorAll('.repeat-day-chip').forEach(chip=>{
  chip.addEventListener('click',()=>chip.classList.toggle('on'));
});
document.getElementById('repeatApply').onclick=()=>{
  const blk=getBlock(_repeatBlkId);if(!blk)return;
  const selDays=[...document.querySelectorAll('.repeat-day-chip.on')].map(c=>parseInt(c.dataset.rday));
  if(!selDays.length){alert('요일을 하나 이상 선택하세요.');return;}
  const period=document.querySelector('input[name="rperiod"]:checked').value;
  const EXAM=new Date(2026,7,30);EXAM.setHours(0,0,0,0);
  const weeks=[new Date(currentMonday)];
  if(period!=='thisweek'){
    let w=addDays(currentMonday,7);
    while(period==='exam'?w<=EXAM:weeks.length<2){weeks.push(new Date(w));w=addDays(w,7);}
  }
  pushUndo();
  blk.repeat=true;
  let created=0;
  weeks.forEach(wMon=>{
    const wk=weekKey(wMon);
    const isCur=weekKey(currentMonday)===wk;
    const wb=isCur?blocks:loadWeek(wMon);
    let changed=isCur;
    selDays.forEach(day=>{
      if(isCur&&day===blk.day)return;
      if(wb.some(b=>b.day===day&&!b.ghost&&b.startMin<blk.endMin&&b.endMin>blk.startMin))return;
      wb.push({id:uid(),day,startMin:blk.startMin,endMin:blk.endMin,subject:blk.subject,memo:blk.memo||'',note:blk.note||'',completed:false,repeat:true});
      created++;changed=true;
    });
    if(changed){
      if(isCur)saveWeek();
      else{const v=JSON.stringify(wb);localStorage.setItem(wk,v);syncToSupabase(wk,v);}
    }
  });
  renderBlocks();
  closeRepeatModal();
  showPlannerToast(`✓ ${created}개 블록이 생성되었습니다`);
};
function showPlannerToast(msg){
  let t=document.getElementById('plannerToast');
  if(!t){t=document.createElement('div');t.id='plannerToast';t.style.cssText='position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#37352F;color:#fff;padding:8px 16px;border-radius:6px;font-size:13px;z-index:9999;opacity:0;transition:opacity .2s;pointer-events:none;white-space:nowrap;';document.body.appendChild(t);}
  t.textContent=msg;t.style.opacity='1';
  clearTimeout(t._h);t._h=setTimeout(()=>t.style.opacity='0',2500);
}

// ── subject picker ────────────────────────────────────────────────────────────
function hideSubjectPicker(){const el=document.getElementById('subjPicker');if(el)el.remove();}
function showSubjectPicker(blockId,anchor){
  hideSubjectPicker();
  const blk=getBlock(blockId);if(!blk)return;
  const picker=document.createElement('div');picker.className='subj-picker';picker.id='subjPicker';
  Object.entries(SUBJECTS).forEach(([key,subj])=>{
    const item=document.createElement('div');
    item.className='subj-picker-item'+(key===blk.subject?' cur':'');
    const dotStyle=subj.dashed
      ?`width:10px;height:10px;border-radius:3px;flex-shrink:0;border:1.5px dashed ${subj.color}`
      :`background:${subj.color};width:10px;height:10px;border-radius:3px;flex-shrink:0`;
    item.innerHTML=`<span style="${dotStyle}"></span><span>${subj.name}</span>`;
    item.addEventListener('mousedown',ev=>{
      ev.stopPropagation();
      if(key!==blk.subject){pushUndo();blk.subject=key;saveWeek();renderBlocks();}
      hideSubjectPicker();
    });
    picker.appendChild(item);
  });
  document.body.appendChild(picker);
  const ar=anchor.getBoundingClientRect();
  picker.style.left=ar.left+'px';picker.style.top=(ar.bottom+4)+'px';
  requestAnimationFrame(()=>{
    const pr=picker.getBoundingClientRect();
    if(pr.right>window.innerWidth-8)picker.style.left=(window.innerWidth-pr.width-8)+'px';
    if(pr.bottom>window.innerHeight-8)picker.style.top=(ar.top-pr.height-4)+'px';
  });
}

// ── mobile touch ──────────────────────────────────────────────────────────────
let touchState=null;
let longPressTimer=null;

function showMobileCtx(blockId,x,y){
  const blk=getBlock(blockId);if(!blk)return;
  const menu=document.getElementById('ctxMenu');
  menu.innerHTML=
    (()=>{const st=blk.status||(blk.completed?'done':'');const lbl=st===''?'완료로 표시':st==='done'?'실패로 표시':'미완료로 표시';return`<button class="ctx-item" data-action="toggle" data-id="${blk.id}">${lbl}</button>`;})()+
    `<button class="ctx-item" data-action="edit" data-id="${blk.id}">메모 편집</button>`+
    `<div class="ctx-divider"></div>`+
    `<button class="ctx-item danger" data-action="delete" data-id="${blk.id}">삭제</button>`;
  menu.style.display='block';
  menu.style.left=Math.min(x,window.innerWidth-190)+'px';
  menu.style.top=Math.min(y,window.innerHeight-140)+'px';
  menu.onclick=ev=>{
    const btn=ev.target.closest('[data-action]');if(!btn)return;
    const id=btn.dataset.id;const b=getBlock(id);
    if(btn.dataset.action==='toggle'){if(b){pushUndo();const cur=b.status||(b.completed?'done':'');b.status=cur===''?'done':cur==='done'?'fail':'';b.completed=(b.status==='done');saveWeek();renderBlocks();const _bdk=dateKey(addDays(currentMonday,b.day));const _bgs=loadDailyGoals(_bdk);const _bg=_bgs.find(g=>g.blkId===b.id);if(_bg){_bg.status=b.status;_bg.done=b.completed;saveDailyGoals(_bdk,_bgs);const _brow=document.querySelector(`.daily-goal-row[data-day="${b.day}"]`);if(_brow){buildGoalRowContent(_brow,_bdk);syncGoalRowHeight();}}}}
    else if(btn.dataset.action==='edit'){openEditModal(id);}
    else if(btn.dataset.action==='delete'){if(b){pushUndo();removeGoalForBlock(b);blocks=blocks.filter(x=>x.id!==id);selectedIds.delete(id);saveWeek();renderBlocks();}}
    hideCtx();
  };
}

function onTouchStart(e){
  if(!isMobile())return;
  if(longPressTimer){clearTimeout(longPressTimer);longPressTimer=null;}
  const t=e.touches[0];
  const tx=t.clientX,ty=t.clientY;
  touchState={x:tx,y:ty,t:Date.now(),moved:false};
  // long press on a block (not on a button) → context menu
  const blkEl=findBlockEl(e.target);
  if(blkEl&&!e.target.closest('.block-done-btn')&&!e.target.closest('.block-focus-btn')){
    const id=blkEl.dataset.id;
    longPressTimer=setTimeout(()=>{
      longPressTimer=null;touchState=null;
      showMobileCtx(id,tx,ty);
    },500);
  }
}

function onTouchMove(e){
  if(!isMobile()||!touchState)return;
  const t=e.touches[0];
  const dx=t.clientX-touchState.x,dy=t.clientY-touchState.y;
  if(Math.abs(dx)>8||Math.abs(dy)>8){
    touchState.moved=true;
    if(longPressTimer){clearTimeout(longPressTimer);longPressTimer=null;}
  }
}

function onTouchEnd(e){
  if(!isMobile())return;
  if(longPressTimer){clearTimeout(longPressTimer);longPressTimer=null;}
  if(!touchState)return;
  const t=e.changedTouches[0];
  const dx=t.clientX-touchState.x;
  const dy=t.clientY-touchState.y;
  const dt=Date.now()-touchState.t;
  const moved=touchState.moved;
  touchState=null;

  // horizontal swipe → navigate day
  if(Math.abs(dx)>60&&Math.abs(dy)<80&&dt<600){
    if(viewMode==='day'){
      currentDay=addDays(currentDay,dx<0?1:-1);
      currentMonday=getMondayOf(currentDay);
      blocks=loadWeek(currentMonday);
      ensureGoalLinksForWeek();
      renderDailyView();
    }
    return;
  }

  // tap on block (not a button, not a swipe) → select
  if(!moved&&dt<400){
    const blkEl=findBlockEl(e.target);
    if(blkEl&&!e.target.closest('.block-done-btn')&&!e.target.closest('.block-focus-btn')){
      const id=blkEl.dataset.id;
      if(selectedIds.has(id)){clearSelection();}
      else{clearSelection();selectedIds.add(id);blkEl.classList.add('selected');}
    } else if(!blkEl){
      clearSelection();
    }
  }
}

// ── mobile touch resize ───────────────────────────────────────────────────────
let touchResizeState=null;

function onResizeHandleTouchStart(e){
  if(!isMobile())return;
  const handle=e.target.closest('[data-rdir]');
  if(!handle)return;
  const dir=handle.dataset.rdir;
  if(dir!=='s'&&dir!=='n')return;
  const id=handle.dataset.rid;
  const blk=getBlock(id);if(!blk)return;
  e.preventDefault();e.stopPropagation();
  if(longPressTimer){clearTimeout(longPressTimer);longPressTimer=null;}
  touchState=null;
  const ty=e.touches[0].clientY;
  touchResizeState={dir,id};
  document.addEventListener('touchmove',onResizeTouchMove,{passive:false});
  document.addEventListener('touchend',onResizeTouchEnd);
}

function onResizeTouchMove(e){
  if(!touchResizeState)return;
  e.preventDefault();
  const{dir,id}=touchResizeState;
  const blk=getBlock(id);if(!blk)return;
  const ty=e.touches[0].clientY;
  const body=document.querySelector(`.day-body[data-day="${blk.day}"]`);if(!body)return;
  const el=document.querySelector(`.block[data-id="${id}"]`);if(!el)return;
  if(dir==='s'){
    blk.endMin=Math.max(clampMin(snapMin(yToMin(bodyY(body,ty)))),blk.startMin+gran);
    el.style.height=Math.max((blk.endMin-blk.startMin)*ppm(),14)+'px';
    const lbl=el.querySelector('.block-time-label');if(lbl)lbl.textContent=`${fmtTime(blk.startMin)}–${fmtTime(blk.endMin)}`;
  } else {
    const ns=Math.min(clampMin(snapMin(yToMin(bodyY(body,ty)))),blk.endMin-gran);
    blk.startMin=ns;
    el.style.top=minToY(blk.startMin)+'px';
    el.style.height=Math.max((blk.endMin-blk.startMin)*ppm(),14)+'px';
    const lbl=el.querySelector('.block-time-label');if(lbl)lbl.textContent=`${fmtTime(blk.startMin)}–${fmtTime(blk.endMin)}`;
  }
}

function onResizeTouchEnd(){
  if(!touchResizeState)return;
  document.removeEventListener('touchmove',onResizeTouchMove);
  document.removeEventListener('touchend',onResizeTouchEnd);
  pushUndo();saveWeek();renderBlocks();
  touchResizeState=null;
}

// ── init ──────────────────────────────────────────────────────────────────────
const daysArea=document.getElementById('daysArea');
daysArea.addEventListener('mousedown',onMouseDown);
daysArea.addEventListener('contextmenu',onContextMenu);
daysArea.addEventListener('touchstart',onResizeHandleTouchStart,{passive:false});
daysArea.addEventListener('touchstart',onTouchStart,{passive:true});
daysArea.addEventListener('touchmove',onTouchMove,{passive:true});
daysArea.addEventListener('touchend',onTouchEnd,{passive:true});

// ── mobile scroll axis lock ────────────────────────────────────────────────────
(function(){
  const pw=document.getElementById('plannerWrapper');
  let axis=null,x0=0,y0=0,l0=0,t0=0;
  pw.addEventListener('touchstart',function(e){
    if(!isMobile())return;
    const t=e.touches[0];
    axis=null;x0=t.clientX;y0=t.clientY;l0=pw.scrollLeft;t0=pw.scrollTop;
  },{passive:true});
  pw.addEventListener('touchmove',function(e){
    if(!isMobile()||touchResizeState)return;
    const t=e.touches[0];
    const dx=t.clientX-x0,dy=t.clientY-y0;
    if(!axis&&(Math.abs(dx)>5||Math.abs(dy)>5)){
      axis=Math.abs(dx)>Math.abs(dy)?'x':'y';
    }
    if(axis){
      e.preventDefault();
      if(axis==='x')pw.scrollLeft=l0-dx;
      else pw.scrollTop=t0-dy;
    }
  },{passive:false});
  pw.addEventListener('touchend',function(){axis=null;},{passive:true});
  pw.addEventListener('touchcancel',function(){axis=null;},{passive:true});
})();
