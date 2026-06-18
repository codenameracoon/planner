function buildWeeklyRetroInEl(container, wMon){
  const data=loadRetro('week',wMon);
  const secTitle=document.createElement('div');secTitle.className='month-expand-section-title';secTitle.textContent='주간 회고';
  container.appendChild(secTitle);
  const retroBody=document.createElement('div');retroBody.className='retro-body';retroBody.style.gap='6px';
  const starRow=document.createElement('div');starRow.className='retro-row';
  const starLbl=document.createElement('span');starLbl.className='retro-label';starLbl.textContent='이번 주 별점';
  const stars=makeStars(data.rating||0,v=>{const d=loadRetro('week',wMon);d.rating=v;saveRetro('week',wMon,d);});
  starRow.appendChild(starLbl);starRow.appendChild(stars);retroBody.appendChild(starRow);
  [['good','이번 주 잘한 것'],['weak','아직 불안한 부분'],['next','다음 주 집중 과목/범위']].forEach(([key,label])=>{
    const row=document.createElement('div');row.className='retro-row';
    const lbl=document.createElement('span');lbl.className='retro-label';lbl.textContent=label;
    const inp=document.createElement('input');inp.className='retro-input';inp.type='text';inp.value=data[key]||'';inp.placeholder='입력...';
    inp.addEventListener('change',()=>{const d=loadRetro('week',wMon);d[key]=inp.value.trim();saveRetro('week',wMon,d);});
    row.appendChild(lbl);row.appendChild(inp);retroBody.appendChild(row);
  });
  container.appendChild(retroBody);
}

function showAddEventModal(defaultDate){
  const existing=document.getElementById('addEventModal');
  if(existing){existing.remove();return;}
  const mon=currentMonday;
  const isDark=document.body.classList.contains('dark');
  const bg=isDark?'#252525':'#fff';
  const bdr=isDark?'#3a3a3a':'#E9E9E7';
  const overlay=document.createElement('div');
  overlay.id='addEventModal';
  overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:9999;display:flex;align-items:center;justify-content:center';
  const box=document.createElement('div');
  box.style.cssText=`background:${bg};border-radius:8px;padding:16px 18px;width:300px;display:flex;flex-direction:column;gap:9px;box-shadow:0 4px 24px rgba(0,0,0,.18)`;
  const inpStyle=`font-family:inherit;font-size:13px;padding:5px 7px;border:1px solid ${bdr};border-radius:4px;outline:none;background:${bg};color:${isDark?'#E8E8E6':'#37352F'};width:100%;box-sizing:border-box`;
  box.innerHTML=`<div style="font-size:14px;font-weight:600;color:${isDark?'#E8E8E6':'#37352F'}">일정 추가</div>`+
    `<input id="aeDate" type="date" value="${defaultDate}" style="${inpStyle}">`+
    `<div style="display:flex;gap:8px"><input id="aeTime" type="time" value="09:00" style="${inpStyle};width:120px;flex-shrink:0"><input id="aeTitle" type="text" placeholder="일정 제목" style="${inpStyle}"></div>`+
    `<select id="aeAlarm" style="${inpStyle}">`+
      `<option value="0">알림 없음</option>`+
      `<option value="10">10분 전</option>`+
      `<option value="30">30분 전</option>`+
      `<option value="60">1시간 전</option>`+
      `<option value="1440">하루 전</option>`+
    `</select>`+
    `<div style="display:flex;gap:8px;justify-content:flex-end">`+
      `<button id="aeCancel" style="font-family:inherit;font-size:13px;padding:5px 14px;border:1px solid ${bdr};border-radius:4px;cursor:pointer;background:none;color:${isDark?'#E8E8E6':'#37352F'}">취소</button>`+
      `<button id="aeSave" style="font-family:inherit;font-size:13px;padding:5px 14px;border:none;border-radius:4px;cursor:pointer;background:#2383E2;color:#fff;font-weight:600">추가</button>`+
    `</div>`;
  overlay.appendChild(box);
  document.body.appendChild(overlay);
  setTimeout(()=>box.querySelector('#aeTitle').focus(),40);
  overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.remove();});
  box.querySelector('#aeCancel').addEventListener('click',()=>overlay.remove());
  box.querySelector('#aeSave').addEventListener('click',()=>{
    const date=box.querySelector('#aeDate').value;
    const time=box.querySelector('#aeTime').value;
    const title=box.querySelector('#aeTitle').value.trim();
    if(!title){box.querySelector('#aeTitle').focus();return;}
    const alarmMinutes=parseInt(box.querySelector('#aeAlarm').value)||0;
    if(alarmMinutes>0)requestNotifPermission();
    const evs=loadMonthEvents(mon);
    evs.push({id:uid(),date,time,title,alarmMinutes});
    saveMonthEvents(mon,evs);
    overlay.remove();
    renderMonthView();
  });
}

function renderMonthView(){
  const wrap=document.getElementById('monthWrap');
  const today=new Date();today.setHours(0,0,0,0);
  const year=currentMonday.getFullYear(),month=currentMonday.getMonth();
  const firstDay=new Date(year,month,1);
  const gridStart=getMondayOf(firstDay);
  let html='<div class="month-grid">';
  DAYS.forEach(d=>html+=`<div class="month-hdr-cell">${d}</div>`);
  for(let w=0;w<6;w++){
    const weekMonday=addDays(gridStart,w*7);
    const wk=weekKey(weekMonday);
    const res=localStorage.getItem('weekRes_'+wk)||'';
    const wdStr=dateKey(weekMonday);
    html+=`<div class="month-week-hdr">`+
      `<span class="month-week-res${res?'':' month-week-res-empty'}">${res?escHtml(res):'이번 주 다짐 없음'}</span>`+
    `</div>`;
    for(let d=0;d<7;d++){
      const cellDate=addDays(gridStart,w*7+d);
      const dk=dateKey(cellDate);
      const isToday=isSameDay(cellDate,today);
      const isOther=cellDate.getMonth()!==month;
      const isSelected=dk===expandedMonthDay;
      const db=loadBlocksForDate(cellDate).filter(b=>!b.ghost);
      const tH=db.reduce((s,b)=>s+(b.endMin-b.startMin)/60,0);
      const dH=db.filter(b=>b.completed).reduce((s,b)=>s+(b.endMin-b.startMin)/60,0);
      const rate=tH>0?Math.round(dH/tH*100):0;
      const subjKeys=[...new Set(db.map(b=>SUBJECTS[b.subject]?b.subject:'rest'))];
      const intensity=Math.min(tH/8,1);
      html+=`<div class="month-cell${isToday?' today-cell':''}${isOther?' other-month':''}${isSelected?' selected-cell':''}" data-mdate="${dk}" style="background:rgba(35,131,226,${(intensity*0.07).toFixed(2)})">`+
        `<div class="month-cell-top"><span class="month-cell-num">${cellDate.getDate()}</span><button class="month-cell-add" data-adddate="${dk}" title="일정 추가">+</button></div>`+
        `<div class="month-dots">${subjKeys.slice(0,6).map(k=>`<span class="month-dot" style="background:${SUBJECTS[k].color}"></span>`).join('')}</div>`+
        (tH>0?`<div class="month-cell-info">${tH.toFixed(1)}h</div>`:'')+
        (rate>0?`<div class="month-cell-rate">${rate}%</div>`:'')+
      `</div>`;
    }
  }
  html+='</div>';
  if(expandedMonthDay){
    const expDate=new Date(expandedMonthDay);
    const db=loadBlocksForDate(expDate).sort((a,b)=>a.startMin-b.startMin);
    html+=`<div class="month-expand">`+
      `<div class="month-expand-hdr">${expDate.getMonth()+1}월 ${expDate.getDate()}일 (${DAYS[dayIdx(expDate)]})<button class="month-expand-close" id="closeExpand">×</button></div>`;
    if(!db.length)html+='<div style="font-size:11px;color:#9B9A97">블록 없음</div>';
    else db.forEach(b=>{const s=SUBJECTS[b.subject]||SUBJECTS.rest;html+=`<div class="month-blk-item"><span class="month-blk-dot" style="background:${s.color}"></span><span class="month-blk-time">${fmtTime(b.startMin)}–${fmtTime(b.endMin)}</span><span class="month-blk-name">${s.name}${b.memo?' · '+escHtml(b.memo):''}</span><span class="month-blk-done">${b.completed?'✓':''}</span></div>`;});
    html+=`</div>`;
  }
  wrap.innerHTML=html;
  wrap.querySelectorAll('.month-cell').forEach(cell=>{
    cell.addEventListener('click',()=>{const dk=cell.dataset.mdate;expandedMonthDay=expandedMonthDay===dk?null:dk;renderMonthView();});
  });
  wrap.querySelectorAll('.month-cell-add').forEach(btn=>{
    btn.addEventListener('click',e=>{e.stopPropagation();showAddEventModal(btn.dataset.adddate);});
  });
  const closeBtn=document.getElementById('closeExpand');
  if(closeBtn)closeBtn.addEventListener('click',e=>{e.stopPropagation();expandedMonthDay=null;renderMonthView();});
  if(expandedMonthDay){
    const expandEl=wrap.querySelector('.month-expand');
    if(expandEl){
      const expDate=new Date(expandedMonthDay);
      buildWeeklyRetroInEl(expandEl,getMondayOf(expDate));
    }
  }
  renderMonthlyRetro(wrap);
  renderMonthEvents(wrap);
  renderStats();updateStatsPanelTitle();
  renderToolbarProgress();
}

// ── drag helpers ──────────────────────────────────────────────────────────────
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
  menu.innerHTML=`<div style="font-size:11px;color:#9B9A97;padding:6px 10px 2px;font-weight:600;letter-spacing:.3px">회독 내용 삽입 · ${fmtTime(startMin)}</div>`+reviewItems;
  menu.style.display='block';menu.style.left=e.clientX+'px';menu.style.top=e.clientY+'px';
  requestAnimationFrame(()=>{const r=menu.getBoundingClientRect();if(r.right>window.innerWidth)menu.style.left=(e.clientX-r.width)+'px';if(r.bottom>window.innerHeight)menu.style.top=(e.clientY-r.height)+'px';});
  menu.onclick=ev=>{
    const btn=ev.target.closest('[data-action="ins-review"]');if(!btn)return;
    pushUndo();
    const nb={id:uid(),day:parseInt(btn.dataset.day),startMin:parseInt(btn.dataset.start),endMin:parseInt(btn.dataset.end),subject:btn.dataset.subj,memo:btn.dataset.memo,note:'',completed:false};
    blocks.push(nb);
    saveWeek();renderBlocks();hideCtx();
    autoGoalFromBlock(nb);
  };
}

function hideCtx(){document.getElementById('ctxMenu').style.display='none';}

// ── weekday repeat ─────────────────────────────────────────────────────────────
let _monthlyRepeatBlkId=null;
function openRepeatModal(blkId){
  _monthlyRepeatBlkId=blkId;
  const blk=getBlock(blkId);if(!blk)return;
  document.querySelectorAll('.repeat-day-chip').forEach(chip=>{
    chip.classList.toggle('on',parseInt(chip.dataset.rday)===blk.day);
  });
  document.querySelector('input[name="rperiod"][value="thisweek"]').checked=true;
  document.getElementById('repeatModalOverlay').classList.add('open');
}
function closeRepeatModal(){
  document.getElementById('repeatModalOverlay').classList.remove('open');
  _monthlyRepeatBlkId=null;
}
document.getElementById('repeatCancel').onclick=closeRepeatModal;
document.getElementById('repeatModalOverlay').onclick=e=>{if(e.target===document.getElementById('repeatModalOverlay'))closeRepeatModal();};
document.querySelectorAll('.repeat-day-chip').forEach(chip=>{
  chip.addEventListener('click',()=>chip.classList.toggle('on'));
});
document.getElementById('repeatApply').onclick=()=>{
  const blk=getBlock(_monthlyRepeatBlkId);if(!blk)return;
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


function renderDailyRetro(){
  const el=document.getElementById('dailyRetro');
  if(viewMode!=='day'){el.classList.add('u-hidden');return;}
  el.classList.remove('u-hidden');
  const data=loadRetro('day',currentDay);
  const body=document.getElementById('dailyRetroBody');
  body.innerHTML='';
  // Row 1: mood emojis + divider + stars
  const topRow=document.createElement('div');topRow.className='retro-row-top';
  const moodGrid=document.createElement('div');moodGrid.className='mood-grid';
  MOODS.forEach(m=>{
    const btn=document.createElement('button');btn.className='mood-btn'+(data.mood===m.id?' active':'');
    btn.textContent=m.emoji;btn.title=m.label;
    btn.onclick=()=>{
      const d=loadRetro('day',currentDay);
      d.mood=d.mood===m.id?null:m.id;
      saveRetro('day',currentDay,d);
      moodGrid.querySelectorAll('.mood-btn').forEach((b,i)=>b.classList.toggle('active',MOODS[i].id===d.mood));
    };
    moodGrid.appendChild(btn);
  });
  const vdiv=document.createElement('div');vdiv.className='retro-vdiv';
  const stars=makeStars(data.rating||0,v=>{const d=loadRetro('day',currentDay);d.rating=v;saveRetro('day',currentDay,d);},undefined,3);
  topRow.appendChild(moodGrid);topRow.appendChild(vdiv);topRow.appendChild(stars);body.appendChild(topRow);
  // Row 2: 잘 된 것 | 안 된 것 (2-column textarea)
  const twoCol=document.createElement('div');twoCol.className='retro-2col';
  [['good','잘 된 것'],['bad','안 된 것']].forEach(([key,label])=>{
    const col=document.createElement('div');col.className='retro-col';
    const lbl=document.createElement('span');lbl.className='retro-col-label';lbl.textContent=label;
    const ta=document.createElement('textarea');ta.className='retro-col-ta';ta.value=data[key]||'';ta.placeholder='입력...';ta.rows=2;
    ta.onchange=()=>{const d=loadRetro('day',currentDay);d[key]=ta.value.trim();saveRetro('day',currentDay,d);};
    col.appendChild(lbl);col.appendChild(ta);twoCol.appendChild(col);
  });
  body.appendChild(twoCol);
  // Row 3: 내일 가장 먼저 할 것 (full width, 1 line)
  const tmrRow=document.createElement('div');tmrRow.className='retro-row';
  const tmrLbl=document.createElement('span');tmrLbl.className='retro-label';tmrLbl.textContent='내일 가장 먼저';
  const tmrInp=document.createElement('input');tmrInp.className='retro-input';tmrInp.type='text';tmrInp.value=data.tomorrow||'';tmrInp.placeholder='입력...';
  tmrInp.onchange=()=>{const d=loadRetro('day',currentDay);d.tomorrow=tmrInp.value.trim();saveRetro('day',currentDay,d);};
  tmrRow.appendChild(tmrLbl);tmrRow.appendChild(tmrInp);body.appendChild(tmrRow);
  // Row 4: 오늘 생각 (full width, 1 line)
  const thtRow=document.createElement('div');thtRow.className='retro-row';
  const thtLbl=document.createElement('span');thtLbl.className='retro-label';thtLbl.textContent='오늘 생각';
  const thtInp=document.createElement('input');thtInp.className='retro-input';thtInp.type='text';thtInp.value=data.thoughts||'';thtInp.placeholder='오늘 떠오른 생각...';
  thtInp.onchange=()=>{const d=loadRetro('day',currentDay);d.thoughts=thtInp.value.trim();saveRetro('day',currentDay,d);};
  thtRow.appendChild(thtLbl);thtRow.appendChild(thtInp);body.appendChild(thtRow);
}

function renderWeeklyRetro(){
  const el=document.getElementById('weeklyRetro');
  const isSunday=new Date().getDay()===0;
  if(viewMode!=='week'||!isSunday){el.classList.add('u-hidden');return;}
  el.classList.remove('u-hidden');
  const data=loadRetro('week',currentMonday);
  const body=document.getElementById('weeklyRetroBody');
  body.innerHTML='';
  const starRow=document.createElement('div');starRow.className='retro-row';
  const starLbl=document.createElement('span');starLbl.className='retro-label';starLbl.textContent='이번 주 별점';
  const stars=makeStars(data.rating||0,v=>{const d=loadRetro('week',currentMonday);d.rating=v;saveRetro('week',currentMonday,d);});
  starRow.appendChild(starLbl);starRow.appendChild(stars);body.appendChild(starRow);
  const fields=[['good','이번 주 잘한 것'],['weak','아직 불안한 부분'],['next','다음 주 집중 과목/범위']];
  fields.forEach(([key,label])=>{
    const row=document.createElement('div');row.className='retro-row';
    const lbl=document.createElement('span');lbl.className='retro-label';lbl.textContent=label;
    const inp=document.createElement('input');inp.className='retro-input';inp.type='text';inp.value=data[key]||'';inp.placeholder='입력...';
    inp.addEventListener('change',()=>{const d=loadRetro('week',currentMonday);d[key]=inp.value.trim();saveRetro('week',currentMonday,d);});
    row.appendChild(lbl);row.appendChild(inp);body.appendChild(row);
  });
}

function renderMonthlyRetro(wrap){
  const now=currentMonday;
  const data=loadRetro('month',now);
  // Build panel via DOM (not innerHTML) so we can append stars + text inputs together
  const panel=document.createElement('div');panel.className='retro-panel';panel.id='monthlyRetroPanel';
  const hdr=document.createElement('div');hdr.className='retro-header';hdr.id='monthlyRetroHdr';
  const title=document.createElement('span');title.className='retro-title';title.textContent='월간 회고';
  const toggle=document.createElement('button');toggle.className='retro-toggle-btn';toggle.id='monthlyRetroToggle';toggle.textContent='펼치기 ▼';
  hdr.appendChild(title);hdr.appendChild(toggle);panel.appendChild(hdr);
  const body=document.createElement('div');body.className='retro-body';body.id='monthlyRetroBody';body.style.cssText='display:none;flex-direction:column;gap:6px';
  // Monthly star row + note
  const mStarRow=document.createElement('div');mStarRow.className='retro-row';
  const mStarLbl=document.createElement('span');mStarLbl.className='retro-label';mStarLbl.textContent='이달의 별점';
  const mStars=makeStars(data.rating||0,v=>{const d=loadRetro('month',now);d.rating=v;saveRetro('month',now,d);});
  const mStarNote=document.createElement('input');mStarNote.className='retro-input';mStarNote.type='text';mStarNote.value=data.ratingNote||'';mStarNote.placeholder='한 줄 소감...';mStarNote.style.marginLeft='6px';
  mStarNote.addEventListener('change',()=>{const d=loadRetro('month',now);d.ratingNote=mStarNote.value.trim();saveRetro('month',now,d);});
  mStarRow.appendChild(mStarLbl);mStarRow.appendChild(mStars);mStarRow.appendChild(mStarNote);body.appendChild(mStarRow);
  // Per-subject star rows + notes
  const studySubjs=[['labor_law','노동법'],['hr_mgmt','인사노무관리'],['admin_law','행정쟁송법'],['labor_econ','노동경제학'],['precedent','판례암기+타이핑']];
  studySubjs.forEach(([k,n])=>{
    const s=SUBJECTS[k];
    const row=document.createElement('div');row.className='retro-subj-row';
    const dot=document.createElement('span');dot.className='retro-subj-dot';dot.style.background=s.color;
    const name=document.createElement('span');name.className='retro-subj-name';name.textContent=n;
    const stars=makeStars((data.subjRating||{})[k]||0,v=>{const d=loadRetro('month',now);d.subjRating=d.subjRating||{};d.subjRating[k]=v;saveRetro('month',now,d);},'retro-subj-star');
    const note=document.createElement('input');note.className='retro-subj-inp';note.type='text';note.value=(data.subjNote||{})[k]||'';note.placeholder='한 줄 평...';
    note.addEventListener('change',()=>{const d=loadRetro('month',now);d.subjNote=d.subjNote||{};d.subjNote[k]=note.value.trim();saveRetro('month',now,d);});
    row.appendChild(dot);row.appendChild(name);row.appendChild(stars);row.appendChild(note);body.appendChild(row);
  });
  // Text fields
  [['pattern','고칠 공부 패턴'],['goal','다음 달 목표']].forEach(([key,label])=>{
    const row=document.createElement('div');row.className='retro-row';
    const lbl=document.createElement('span');lbl.className='retro-label';lbl.textContent=label;
    const inp=document.createElement('input');inp.className='retro-input';inp.type='text';inp.value=data[key]||'';inp.placeholder='입력...';
    inp.addEventListener('change',()=>{const d=loadRetro('month',now);d[key]=inp.value.trim();saveRetro('month',now,d);});
    row.appendChild(lbl);row.appendChild(inp);body.appendChild(row);
  });
  panel.appendChild(body);
  hdr.addEventListener('click',()=>{
    const open=body.style.display!=='none';
    body.style.display=open?'none':'flex';
    if(!open){body.style.flexDirection='column';body.style.gap='6px';}
    toggle.textContent=open?'펼치기 ▼':'접기 ▲';
  });
  wrap.appendChild(panel);
}

// retro collapse toggles
document.getElementById('dailyRetroHdr').addEventListener('click',()=>{
  const body=document.getElementById('dailyRetroBody');
  const btn=document.getElementById('dailyRetroToggle');
  const collapsed=body.style.display==='none';
  body.style.display=collapsed?'':'none';btn.textContent=collapsed?'접기 ▲':'펼치기 ▼';
});
document.getElementById('weeklyRetroHdr').addEventListener('click',()=>{
  const el=document.getElementById('weeklyRetro');
  const body=document.getElementById('weeklyRetroBody');
  const btn=document.getElementById('weeklyRetroToggle');
  el.classList.toggle('collapsed');
  const collapsed=!el.classList.contains('collapsed');
  btn.textContent=collapsed?'접기 ▲':'펼치기 ▼';
});

// ── retro popup (daily 22:30, weekly on Sunday, monthly on last day) ──────────
function isLastDayOfMonth(d){return new Date(d.getFullYear(),d.getMonth(),d.getDate()+1).getMonth()!==d.getMonth();}

function buildRetroPopup(){
  const now=new Date();
  const h=now.getHours(),m=now.getMinutes();
  if(h<22||(h===22&&m<30))return;

  const isSunday=now.getDay()===0;
  const isMonthEnd=isLastDayOfMonth(now);

  // Skip if all relevant retros already written
  const dayData=loadRetro('day',now);
  const dailyDone=!!(dayData.good||dayData.bad||dayData.tomorrow||dayData.mood||dayData.rating);
  let allDone=dailyDone;
  if(isSunday){const wd=loadRetro('week',getMondayOf(now));allDone=allDone&&!!(wd.good||wd.weak||wd.next||wd.rating);}
  if(isMonthEnd){const md=loadRetro('month',now);allDone=allDone&&!!(md.rating||md.pattern||md.goal);}
  if(allDone)return;

  const todayKey=`retroPopup_${dateKey(now)}`;
  if(localStorage.getItem(todayKey))return;
  localStorage.setItem(todayKey,'1');

  const parts=['일간 회고'];
  if(isSunday)parts.push('주간 회고');
  if(isMonthEnd)parts.push('월간 회고');
  document.getElementById('retroPopupTitle').textContent=parts.join(' + ');

  const body=document.getElementById('retroPopupBody');
  body.innerHTML='';

  // ── daily section ─────────────────────────────────────────────────────────
  const dsec=document.createElement('div');dsec.className='retro-popup-section';
  const dhdr=document.createElement('div');dhdr.className='retro-popup-section-label';dhdr.textContent='오늘의 회고';dsec.appendChild(dhdr);
  const dsr=document.createElement('div');dsr.className='retro-popup-row';
  const dsl=document.createElement('span');dsl.className='retro-popup-lbl';dsl.textContent='오늘 별점';
  const dss=makeStars(dayData.rating||0,v=>{const d=loadRetro('day',now);d.rating=v;saveRetro('day',now,d);},undefined,3);
  dsr.appendChild(dsl);dsr.appendChild(dss);dsec.appendChild(dsr);
  const dmoodRow=document.createElement('div');dmoodRow.className='retro-popup-row';dmoodRow.style.flexDirection='column';dmoodRow.style.alignItems='flex-start';
  const dmoodLbl=document.createElement('span');dmoodLbl.className='retro-popup-lbl';dmoodLbl.textContent='오늘 기분';
  const dmoodGrid=document.createElement('div');dmoodGrid.className='mood-grid';
  MOODS.forEach(m=>{
    const btn=document.createElement('button');btn.className='mood-btn'+(dayData.mood===m.id?' active':'');
    btn.textContent=m.emoji;btn.title=m.label;
    btn.onclick=()=>{const d=loadRetro('day',now);d.mood=d.mood===m.id?null:m.id;saveRetro('day',now,d);dmoodGrid.querySelectorAll('.mood-btn').forEach((b,i)=>b.classList.toggle('active',MOODS[i].id===d.mood));};
    dmoodGrid.appendChild(btn);
  });
  dmoodRow.appendChild(dmoodLbl);dmoodRow.appendChild(dmoodGrid);dsec.appendChild(dmoodRow);
  [['good','잘 된 것'],['bad','안 된 것'],['tomorrow','내일 가장 먼저 할 것']].forEach(([k,lbl])=>{
    const row=document.createElement('div');row.className='retro-popup-row';
    const l=document.createElement('span');l.className='retro-popup-lbl';l.textContent=lbl;
    const inp=document.createElement('input');inp.className='retro-popup-inp';inp.type='text';inp.value=dayData[k]||'';inp.placeholder='입력...';
    const _save=()=>{const d=loadRetro('day',now);d[k]=inp.value.trim();saveRetro('day',now,d);};
    inp.addEventListener('input',_save);inp.addEventListener('change',_save);
    row.appendChild(l);row.appendChild(inp);dsec.appendChild(row);
  });
  body.appendChild(dsec);

  // ── weekly section (Sunday only) ──────────────────────────────────────────
  if(isSunday){
    const wMon=getMondayOf(now);const weekData=loadRetro('week',wMon);
    const wsec=document.createElement('div');wsec.className='retro-popup-section';
    const whdr=document.createElement('div');whdr.className='retro-popup-section-label';whdr.textContent='주간 회고';wsec.appendChild(whdr);
    const wsr=document.createElement('div');wsr.className='retro-popup-row';
    const wsl=document.createElement('span');wsl.className='retro-popup-lbl';wsl.textContent='이번 주 별점';
    const wss=makeStars(weekData.rating||0,v=>{const d=loadRetro('week',wMon);d.rating=v;saveRetro('week',wMon,d);});
    wsr.appendChild(wsl);wsr.appendChild(wss);wsec.appendChild(wsr);
    [['good','이번 주 잘한 것'],['weak','아직 불안한 부분'],['next','다음 주 집중 과목/범위']].forEach(([k,lbl])=>{
      const row=document.createElement('div');row.className='retro-popup-row';
      const l=document.createElement('span');l.className='retro-popup-lbl';l.textContent=lbl;
      const inp=document.createElement('input');inp.className='retro-popup-inp';inp.type='text';inp.value=weekData[k]||'';inp.placeholder='입력...';
      const _save=()=>{const d=loadRetro('week',wMon);d[k]=inp.value.trim();saveRetro('week',wMon,d);};
      inp.addEventListener('input',_save);inp.addEventListener('change',_save);
      row.appendChild(l);row.appendChild(inp);wsec.appendChild(row);
    });
    body.appendChild(wsec);
  }

  // ── monthly section (last day of month only) ──────────────────────────────
  if(isMonthEnd){
    const mData=loadRetro('month',now);
    const msec=document.createElement('div');msec.className='retro-popup-section';
    const mhdr=document.createElement('div');mhdr.className='retro-popup-section-label';mhdr.textContent='월간 회고';msec.appendChild(mhdr);
    const msr=document.createElement('div');msr.className='retro-popup-row';
    const msl=document.createElement('span');msl.className='retro-popup-lbl';msl.textContent='이달의 별점';
    const mss=makeStars(mData.rating||0,v=>{const d=loadRetro('month',now);d.rating=v;saveRetro('month',now,d);});
    const msNote=document.createElement('input');msNote.className='retro-popup-inp';msNote.type='text';msNote.value=mData.ratingNote||'';msNote.placeholder='한 줄 소감...';msNote.style.marginLeft='6px';
    const _msNoteSave=()=>{const d=loadRetro('month',now);d.ratingNote=msNote.value.trim();saveRetro('month',now,d);};
    msNote.addEventListener('input',_msNoteSave);msNote.addEventListener('change',_msNoteSave);
    msr.appendChild(msl);msr.appendChild(mss);msr.appendChild(msNote);msec.appendChild(msr);
    [['labor_law','노동법'],['hr_mgmt','인사노무관리'],['admin_law','행정쟁송법'],['labor_econ','노동경제학'],['precedent','판례암기+타이핑']].forEach(([k,n])=>{
      const s=SUBJECTS[k];
      const row=document.createElement('div');row.className='retro-popup-row';
      const dot=document.createElement('span');dot.style.cssText=`display:inline-block;width:8px;height:8px;border-radius:2px;background:${s.color};margin-right:4px;flex-shrink:0`;
      const nm=document.createElement('span');nm.className='retro-popup-lbl';nm.style.minWidth='76px';nm.textContent=n;
      const stars=makeStars((mData.subjRating||{})[k]||0,v=>{const d=loadRetro('month',now);d.subjRating=d.subjRating||{};d.subjRating[k]=v;saveRetro('month',now,d);},'retro-star');
      const note=document.createElement('input');note.className='retro-popup-inp';note.type='text';note.value=(mData.subjNote||{})[k]||'';note.placeholder='한 줄 평...';note.style.marginLeft='4px';
      const _noteSave=()=>{const d=loadRetro('month',now);d.subjNote=d.subjNote||{};d.subjNote[k]=note.value.trim();saveRetro('month',now,d);};
      note.addEventListener('input',_noteSave);note.addEventListener('change',_noteSave);
      row.appendChild(dot);row.appendChild(nm);row.appendChild(stars);row.appendChild(note);msec.appendChild(row);
    });
    [['pattern','고칠 공부 패턴'],['goal','다음 달 목표']].forEach(([key,lbl])=>{
      const row=document.createElement('div');row.className='retro-popup-row';
      const l=document.createElement('span');l.className='retro-popup-lbl';l.textContent=lbl;
      const inp=document.createElement('input');inp.className='retro-popup-inp';inp.type='text';inp.value=mData[key]||'';inp.placeholder='입력...';
      const _save=()=>{const d=loadRetro('month',now);d[key]=inp.value.trim();saveRetro('month',now,d);};
      inp.addEventListener('input',_save);inp.addEventListener('change',_save);
      row.appendChild(l);row.appendChild(inp);msec.appendChild(row);
    });
    body.appendChild(msec);
  }

  document.getElementById('retroPopupOverlay').classList.add('open');
}
function closeRetroPopup(){
  document.querySelectorAll('#retroPopupBody .retro-popup-inp').forEach(inp=>{
    inp.dispatchEvent(new Event('input'));inp.dispatchEvent(new Event('change'));
  });
  document.getElementById('retroPopupOverlay').classList.remove('open');
}
document.getElementById('retroPopupClose').onclick=closeRetroPopup;
document.getElementById('retroPopupDismiss').onclick=closeRetroPopup;
document.getElementById('retroPopupSave').onclick=closeRetroPopup;
let _retroScrolled=false;
document.getElementById('retroPopupOverlay').addEventListener('touchmove',()=>{_retroScrolled=true;},{passive:true});
document.getElementById('retroPopupOverlay').addEventListener('touchend',()=>{setTimeout(()=>{_retroScrolled=false;},300);},{passive:true});
document.getElementById('retroPopupOverlay').addEventListener('click',e=>{if(_retroScrolled)return;if(e.target===document.getElementById('retroPopupOverlay'))closeRetroPopup();});
setInterval(buildRetroPopup,30000);
buildRetroPopup();
