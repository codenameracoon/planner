// ── review feature ────────────────────────────────────────────────────────────

function reviewStorageKey(k){return 'review_subject_'+k;}
function reviewCheckKey(k,d){return 'review_check_'+dateKey(d||new Date())+'_'+k;}
function loadReviewData(k){try{return JSON.parse(localStorage.getItem(reviewStorageKey(k))||'null');}catch{return null;}}
function saveReviewData(k,d){const key=reviewStorageKey(k);const v=JSON.stringify(d);localStorage.setItem(key,v);syncToSupabase(key,v);}
function loadReviewChecks(k,d){try{return JSON.parse(localStorage.getItem(reviewCheckKey(k,d))||'null')||{};}catch{return{};}}
function saveReviewChecks(k,c,d){localStorage.setItem(reviewCheckKey(k,d),JSON.stringify(c));}

function initAdminLawData(){
  const existing=loadReviewData('admin_law');
  if(existing&&existing.version===4)return;
  const blocks=[
    "무명항고소송",
    "대상적격",
    "원고적격",
    "협의의 소익",
    "피고적격",
    "관할",
    "제소기간",
    "행정심판 전치주의",
    "가구제(집행정지)",
    "병합",
    "소변경",
    "참가",
    "심리",
    "처분사유의 추가·변경",
    "주장입증책임",
    "위법성판단기준시",
    "사정판결",
    "기속력",
    "기판력",
    "간접강제",
    "선결문제",
    "무효등확인소송",
    "부작위위법확인소송",
    "당사자소송",
    "행정심판법"
  ].map((name,i)=>({id:'b'+(i+1),name}));
  const dailyPlan=[
    {day:0,blockIdx:3,text:'블록4 후반 — 심리원칙, 처분사유추가변경'},
    {day:1,blockIdx:4,text:'블록5 전반 — 판결종류, 기속력, 간접강제'},
    {day:2,blockIdx:4,text:'블록5 후반 — 기판력, 사정판결'},
    {day:3,blockIdx:5,text:'블록6 전반 — 무효등확인소송, 선결문제'},
    {day:4,blockIdx:5,text:'블록6 후반 — 부작위위법확인소송'},
    {day:5,blockIdx:6,text:'블록7 — 당사자소송, 객관소송'},
    {day:6,blockIdx:7,text:'블록8 전반 — 행정심판 종류, 요건, 심리'},
    {day:7,blockIdx:7,text:'블록8 후반 — 가구제(임시처분), 재결의효력, 직접처분'},
    {day:8,blockIdx:0,text:'블록1 전반 — 소송의 한계, 원고적격 전반부'},
    {day:9,blockIdx:0,text:'블록1 후반 — 원고적격 후반부, 협의의 소익'},
    {day:10,blockIdx:1,text:'블록2 전반 — 대상적격 처분성 개념, 거부처분'},
    {day:11,blockIdx:1,text:'블록2 후반 — 대상적격 각종 처분성 판례'},
    {day:12,blockIdx:2,text:'블록3 전반 — 피고적격, 관할, 제소기간'},
    {day:13,blockIdx:2,text:'블록3 후반 — 행정심판전치주의, 소의변경/참가'},
    {day:14,blockIdx:3,text:'블록4 전반 — 가구제(집행정지)'}
  ];
  const c12=[
    {num:12,days:2,blocksPerDay:4,startDate:'2026-08-06'},
    {num:13,days:2,blocksPerDay:4,startDate:'2026-08-08'},
    {num:14,days:2,blocksPerDay:4,startDate:'2026-08-10'},
    {num:15,days:2,blocksPerDay:4,startDate:'2026-08-12'},
    {num:16,days:2,blocksPerDay:4,startDate:'2026-08-14'},
  ];
  const c17=['2026-08-16','2026-08-17','2026-08-18','2026-08-19','2026-08-20',
    '2026-08-21','2026-08-22'].map((sd,i)=>({num:17+i,days:1,blocksPerDay:8,startDate:sd}));
  const cycles=[
    {num:1,days:15,blocksPerDay:null,startDate:'2026-05-29',dailyPlan},
    {num:2,days:10,blocksPerDay:1,startDate:'2026-06-13'},
    {num:3,days:8,blocksPerDay:1,startDate:'2026-06-23'},
    {num:4,days:6,blocksPerDay:1.5,startDate:'2026-07-01'},
    {num:5,days:6,blocksPerDay:1.5,startDate:'2026-07-07'},
    {num:6,days:5,blocksPerDay:2,startDate:'2026-07-13'},
    {num:7,days:5,blocksPerDay:2,startDate:'2026-07-18'},
    {num:8,days:4,blocksPerDay:2,startDate:'2026-07-23'},
    {num:9,days:4,blocksPerDay:2,startDate:'2026-07-27'},
    {num:10,days:3,blocksPerDay:3,startDate:'2026-07-31'},
    {num:11,days:3,blocksPerDay:3,startDate:'2026-08-03'},
    ...c12,...c17,
    {num:24,days:4,blocksPerDay:null,startDate:'2026-08-26',label:'최종정돈'},
    {num:25,days:1,blocksPerDay:null,startDate:'2026-08-30',label:'D-1'},
  ];
  saveReviewData('admin_law',{blocks,cycles,version:4});
}

function getCalendarEndForCycle(c){
  if(!c||!c.startDate)return null;
  const start=new Date(c.startDate);start.setHours(0,0,0,0);
  if(!c.weekdayOnly)return addDays(start,c.days);
  let d=new Date(start);let count=0;
  while(count<c.days){const dow=d.getDay();if(dow!==0&&dow!==6)count++;if(count<c.days)d=addDays(d,1);}
  return addDays(d,1);
}
function getCycleDayIn(c,date){
  if(!c||!c.startDate)return 0;
  const start=new Date(c.startDate);start.setHours(0,0,0,0);
  if(!c.weekdayOnly)return Math.max(0,Math.floor((date-start)/86400000));
  let d=new Date(date);d.setHours(0,0,0,0);
  while(d.getDay()===0||d.getDay()===6)d=addDays(d,-1);
  if(d<start)return 0;
  let count=0;let cur=new Date(start);
  while(cur<d){const dow=cur.getDay();if(dow!==0&&dow!==6)count++;cur=addDays(cur,1);}
  return count;
}
function getCycleDayCalDate(c,dayIndex){
  if(!c||!c.startDate)return null;
  const start=new Date(c.startDate);start.setHours(0,0,0,0);
  if(!c.weekdayOnly)return addDays(start,dayIndex);
  let d=new Date(start);let cnt=0;
  while(cnt<dayIndex){d=addDays(d,1);if(d.getDay()!==0&&d.getDay()!==6)cnt++;}
  return d;
}
function getCycleStatus(c,today){
  if(!c.startDate)return 'future';
  const start=new Date(c.startDate);start.setHours(0,0,0,0);
  const end=getCalendarEndForCycle(c);
  if(today>=end)return 'done';
  if(today>=start)return 'current';
  return 'future';
}

function getTodayBlockIndices(dayInCycle,blocksPerDay,numBlocks){
  if(!blocksPerDay||blocksPerDay<=0)return[];
  const s=Math.floor(dayInCycle*blocksPerDay);
  const e=Math.floor((dayInCycle+1)*blocksPerDay);
  const r=[];
  for(let i=s;i<Math.min(e,numBlocks);i++)r.push(i);
  return r;
}

function buildCycleContentHtml(c,data,subjKey,weaks){
  if(!data)return'';
  const nb=data.blocks.length;
  let rows='';
  if(c.dailyPlan){
    const dg={};
    c.dailyPlan.forEach(p=>{
      if(!dg[p.day])dg[p.day]=[];
      const blk=data.blocks[p.blockIdx];
      dg[p.day].push({text:p.text||blk?.name||'',planDay:p.day,blockIdx:p.blockIdx,blockId:blk?.id});
    });
    Object.keys(dg).sort((a,b)=>+a-+b).forEach(d=>{
      const di=parseInt(d);const dayLbl=`${di+1}일`;
      dg[d].forEach((item,ni)=>{
        const wr=weaks&&item.blockId&&weaks[item.blockId]?' ⭐':'';
        rows+=`<div class="rcex-row rcex-future"><span class="rcex-icon"></span><span class="rcex-day">${ni===0?dayLbl:''}</span><input class="rcex-name-inp" data-rsk="${subjKey}" data-rcycle="${c.num}" data-isplan="true" data-planday="${item.planDay}" data-blockidx="${item.blockIdx}" value="${escHtml(item.text)}"${wr?` title="${wr.trim()}"`:''}></div>`;
      });
    });
  }else if(c.blocksPerDay){
    for(let d=0;d<c.days;d++){
      const idxs=getTodayBlockIndices(d,c.blocksPerDay,nb);
      const dayLbl=`${d+1}일`;
      if(!idxs.length){rows+=`<div class="rcex-row rcex-future"><span class="rcex-icon"></span><span class="rcex-day">${dayLbl}</span><span class="rcex-name" style="opacity:.4">—</span></div>`;continue;}
      idxs.forEach((bi,ni)=>{
        const blk=data.blocks[bi];if(!blk)return;
        const wr=weaks&&weaks[blk.id]?' ⭐':'';
        rows+=`<div class="rcex-row rcex-future"><span class="rcex-icon"></span><span class="rcex-day">${ni===0?dayLbl:''}</span><input class="rcex-name-inp" data-rsk="${subjKey}" data-rcycle="${c.num}" data-isplan="false" data-planday="" data-blockidx="${bi}" value="${escHtml(blk.name)}"${wr?` title="${wr.trim()}"`:''}></div>`;
      });
    }
  }else{
    rows=`<div class="rcex-row"><span class="rcex-name" style="opacity:.4;font-size:12px">일정 미설정</span></div>`;
  }
  return rows;
}

function renderReview(){
  const wrap=document.getElementById('reviewWrap');
  if(!wrap)return;
  const today=new Date();today.setHours(0,0,0,0);

  // sub-tabs with short mobile-friendly names
  const SHORT={labor_law:'노동법',hr_mgmt:'인사',admin_law:'행쟁',labor_econ:'노경'};
  const subTabsEl=document.getElementById('reviewSubTabs');
  const tabs=[{key:'all',label:'전체'},...REVIEW_SUBJECTS];
  subTabsEl.innerHTML=tabs.map(t=>{
    const subj=REVIEW_SUBJECTS.find(s=>s.key===t.key);
    const cls='review-sub-tab'+(subj?' subj-tab':'')+( reviewSubTab===t.key?' active':'');
    const style=subj&&reviewSubTab===t.key?`style="background:${subj.color};border-color:${subj.color}"`:subj?`style="color:${subj.color};border-color:${subj.color}"`:'' ;
    return `<button class="${cls}" data-rtab="${t.key}" ${style}>${t.label||(SHORT[t.key]||t.name)}</button>`;
  }).join('');
  subTabsEl.querySelectorAll('[data-rtab]').forEach(btn=>{
    btn.addEventListener('click',()=>{reviewSubTab=btn.dataset.rtab;renderReview();});
  });

  // date navigator
  const navEl=document.getElementById('reviewDateNav');
  if(navEl){
    if(reviewSubTab!=='all'){
      const vd=reviewViewDate||today;
      const isToday=isSameDay(vd,today);
      const ym=`${vd.getFullYear()}.${String(vd.getMonth()+1).padStart(2,'0')}.${String(vd.getDate()).padStart(2,'0')}`;
      const dow=DAYS[dayIdx(vd)];
      const lbl=isToday?`${ym} (${dow}) · 오늘`:`${ym} (${dow})`;
      const todayBtn=!isToday?`<button class="btn" id="rdnToday" style="font-size:12px;padding:3px 8px">오늘</button>`:'';
      navEl.style.display='flex';
      navEl.innerHTML=`<button class="btn btn-nav" id="rdnPrev">←</button><span class="review-date-nav-label">${lbl}</span><button class="btn btn-nav" id="rdnNext">→</button>${todayBtn}`;
      document.getElementById('rdnPrev').onclick=()=>{
        const base=new Date(reviewViewDate||today);base.setHours(0,0,0,0);
        reviewViewDate=addDays(base,-1);renderReview();
      };
      document.getElementById('rdnNext').onclick=()=>{
        const base=new Date(reviewViewDate||today);base.setHours(0,0,0,0);
        reviewViewDate=addDays(base,1);renderReview();
      };
      const tb=document.getElementById('rdnToday');
      if(tb)tb.onclick=()=>{reviewViewDate=null;renderReview();};
    }else{
      // all tab date nav
      const vd=reviewAllViewDate||today;
      const isToday=isSameDay(vd,today);
      const ym=`${vd.getFullYear()}.${String(vd.getMonth()+1).padStart(2,'0')}.${String(vd.getDate()).padStart(2,'0')}`;
      const dow=DAYS[dayIdx(vd)];
      const lbl=isToday?`${ym} (${dow}) · 오늘`:`${ym} (${dow})`;
      const todayBtn=!isToday?`<button class="btn" id="rdnToday" style="font-size:12px;padding:3px 8px">오늘</button>`:'';
      navEl.style.display='flex';
      navEl.innerHTML=`<button class="btn btn-nav" id="rdnPrev">←</button><span class="review-date-nav-label">${lbl}</span><button class="btn btn-nav" id="rdnNext">→</button>${todayBtn}`;
      document.getElementById('rdnPrev').onclick=()=>{
        const base=new Date(reviewAllViewDate||today);base.setHours(0,0,0,0);
        reviewAllViewDate=addDays(base,-1);renderReview();
      };
      document.getElementById('rdnNext').onclick=()=>{
        const base=new Date(reviewAllViewDate||today);base.setHours(0,0,0,0);
        reviewAllViewDate=addDays(base,1);renderReview();
      };
      const tb=document.getElementById('rdnToday');
      if(tb)tb.onclick=()=>{reviewAllViewDate=null;renderReview();};
    }
  }

  const content=document.getElementById('reviewContent');
  if(reviewSubTab==='all'){const vd=reviewAllViewDate||today;renderReviewAll(content,today,vd);}
  else{
    const subj=REVIEW_SUBJECTS.find(s=>s.key===reviewSubTab);
    if(subj)renderReviewSubject(content,subj,today);
  }
}

function renderReviewAll(el,today,vd){
  if(!vd)vd=today;
  const _allDk=dateKey(vd);
  const _allIsWeekend=vd.getDay()===0||vd.getDay()===6;
  const _allLabel=isSameDay(vd,today)?'오늘':`${vd.getMonth()+1}월${vd.getDate()}일`;

  function _subjSchedBtnHtml(sk){
    if(_allIsWeekend)return'';
    const added=!!_schedAddedDates[sk+':alltab:'+_allDk];
    const st=added?'color:#81C995;border-color:#81C995;cursor:default':'';
    return`<button class="review-tb-btn${added?' used':''}" data-rrow-sched="${sk}" style="margin-left:auto;flex-shrink:0;${st}" ${added?'disabled':''}>${added?'✓ 추가됨':'+ 시간표'}</button>`;
  }

  const _allAdded=!!_schedAddedDates['all:'+_allDk];
  const _tomorrowKey=dateKey(addDays(today,1));
  let html='';
  html+='<div class="review-all-grid">';
  REVIEW_SUBJECTS.forEach(subj=>{
    const data=loadReviewData(subj.key);
    if(!data){
      html+=`<div class="review-all-row" data-rrow="${subj.key}"><div class="review-all-top"><span class="review-all-badge" style="background:${subj.color}">${subj.name}</span><span class="review-all-cycle">—</span>${_subjSchedBtnHtml(subj.key)}</div><span class="review-all-info">회독 일정을 추가하세요</span></div>`;
      return;
    }
    const nb=data.blocks.length;
    const cycles=data.cycles||[];
    let cur=null,dayIn=0,doneCount=0;
    cycles.forEach(c=>{
      const st=getCycleStatus(c,today);
      if(st==='done')doneCount++;
      if(st==='current'&&!cur){cur=c;dayIn=getCycleDayIn(c,today);}
    });
    const FRUITS={labor_law:'🍎',hr_mgmt:'🍉',admin_law:'🍒',labor_econ:'🍋'};
    const fruit=FRUITS[subj.key]||'';
    const todayChecks=loadReviewChecks(subj.key,today);
    let squares='';
    if(cur&&cur.blocksPerDay){
      let todayDayIdx=-1;
      for(let d=0;d<cur.days;d++){const td=getCycleDayCalDate(cur,d);if(td&&isSameDay(td,today)){todayDayIdx=d;break;}}
      const todayIds=todayDayIdx>=0?getTodayBlockIndices(todayDayIdx,cur.blocksPerDay,nb).map(j=>data.blocks[j]?.id).filter(Boolean):[];
      const allTodayDone=todayIds.length>0&&todayIds.every(id=>todayChecks[id]);
      for(let day=0;day<cur.days;day++){
        const dd=getCycleDayCalDate(cur,day);
        const lbl=dd?`<span class="review-sq-lbl">${fmtDate(dd)}</span>`:'';
        const isT=dd&&isSameDay(dd,today);
        const isP=dd&&dd<today&&!isT;
        if(isP)squares+=`<div class="review-sq done">${lbl}${fruit}</div>`;
        else if(isT)squares+=`<div class="review-sq ${allTodayDone?'done':'today'}">${lbl}${fruit}</div>`;
        else squares+=`<div class="review-sq remaining">${lbl}${fruit}</div>`;
      }
    }else if(cur&&(cur.dailyPlan||cur.dailyTexts)){
      let todayDayIdx=-1;
      for(let d=0;d<cur.days;d++){const td=getCycleDayCalDate(cur,d);if(td&&isSameDay(td,today)){todayDayIdx=d;break;}}
      const allTodayDone=todayDayIdx>=0?!!todayChecks['dp_'+todayDayIdx]:false;
      for(let day=0;day<cur.days;day++){
        const dd=getCycleDayCalDate(cur,day);
        const lbl=dd?`<span class="review-sq-lbl">${fmtDate(dd)}</span>`:'';
        const isT=dd&&isSameDay(dd,today);
        const isP=dd&&dd<today&&!isT;
        if(isP)squares+=`<div class="review-sq done">${lbl}${fruit}</div>`;
        else if(isT)squares+=`<div class="review-sq ${allTodayDone?'done':'today'}">${lbl}${fruit}</div>`;
        else squares+=`<div class="review-sq remaining">${lbl}${fruit}</div>`;
      }
    }else{
      for(let i=0;i<nb;i++)squares+=`<div class="review-sq remaining">${fruit}</div>`;
    }
    const info=cur?`${dayIn}/${cur.days}일 완료 · D-${cur.days-dayIn}`:doneCount>0?`${doneCount}회독 완료`:'미시작';
    html+=`<div class="review-all-row" data-rrow="${subj.key}"><div class="review-all-top"><span class="review-all-badge" style="background:${subj.color}">${subj.name}</span><span class="review-all-cycle">${cur?(cur.label||cur.num+'회독'):'—'}</span>${_subjSchedBtnHtml(subj.key)}</div><div class="review-squares">${squares}</div><span class="review-all-info">${info}</span></div>`;
  });
  html+='</div>';

  // Weak blocks section
  let weakHtml='';let hasWeak=false;
  REVIEW_SUBJECTS.forEach(subj=>{
    const w=loadReviewWeaks(subj.key);
    const d=loadReviewData(subj.key);
    if(!d)return;
    const wb=d.blocks.filter(b=>w[b.id]);
    if(!wb.length)return;
    hasWeak=true;
    weakHtml+=`<div class="review-weak-subj" style="color:${subj.color}">${subj.name}</div>`;
    wb.forEach(b=>{weakHtml+=`<div class="review-weak-item"><span class="review-weak-badge">★</span><span>${escHtml(b.name)}</span></div>`;});
  });
  if(hasWeak)html+=`<div class="review-weak-section"><span class="review-section-title">⚠ 약점 블록</span>${weakHtml}</div>`;

  el.innerHTML=html;
  el.querySelectorAll('[data-rrow]').forEach(row=>{
    row.addEventListener('click',()=>{reviewSubTab=row.dataset.rrow;renderReview();});
  });
  el.querySelectorAll('[data-rrow-sched]').forEach(btn=>{
    btn.addEventListener('click',e=>{
      e.stopPropagation();
      const sk=btn.dataset.rrowSched;
      const stateKey=sk+':alltab:'+_allDk;
      if(_schedAddedDates[stateKey])return;
      addSingleSubjectSchedule(btn,sk,vd,stateKey);
    });
  });
  const _aBtn=el.querySelector('#allSubjSchedBtn');
  if(_aBtn&&!_allAdded){_aBtn.addEventListener('click',()=>addTodaySchedule(_aBtn,vd,'all:'+_allDk));}
}

function renderReviewSubject(el,subj,today){
  const data=loadReviewData(subj.key);
  const cycles=data?(data.cycles||[]):[];
  const nb=data?data.blocks.length:0;
  const weaks=loadReviewWeaks(subj.key);

  // view date vs real today
  const vd=reviewViewDate||today;
  const isTodayView=isSameDay(vd,today);
  const isFutureView=vd>today;

  // weekend → show no-review message
  if(vd.getDay()===0||vd.getDay()===6){
    el.innerHTML=`<div style="text-align:center;padding:32px 16px;font-size:15px;color:#9B9A97">🌸 주말에는 회독이 없습니다</div>`;
    return;
  }

  // today's cycle (cycle card, roadmap, speed)
  let cur=null,dayIn=0;
  cycles.forEach(c=>{
    const st=getCycleStatus(c,today);
    if(st==='current'&&!cur){cur=c;dayIn=getCycleDayIn(c,today);}
  });

  // viewDate's cycle (오늘 체크 section)
  let viewCur=null,viewDayIn=0;
  cycles.forEach(c=>{
    const st=getCycleStatus(c,vd);
    if(st==='current'&&!viewCur){viewCur=c;viewDayIn=getCycleDayIn(c,vd);}
  });

  let html='';

  if(!data){
    html=`<p class="review-empty">아직 회독 데이터가 없습니다.</p>`;
    el.innerHTML=html;
    const ab=document.createElement('button');ab.className='review-add-btn';ab.textContent='+ 회독 추가';
    ab.onclick=()=>addReviewCycle(subj.key);
    el.appendChild(ab);
    return;
  }

  // schedule-button state (declared here so it's in scope at event binding below)
  const _sbDk=dateKey(vd);
  const _sbIsWeekend=vd.getDay()===0||vd.getDay()===6;
  const _sbAdded=!!_schedAddedDates[subj.key+':'+_sbDk];

  // current cycle card (based on today)
  if(cur){
    const daysLeft=cur.days-dayIn-1;
    const pct=Math.round((dayIn+1)/cur.days*100);
    const _fmtBpd=v=>{const r=Math.round(v*10)/10;return r===Math.floor(r)?String(Math.floor(r)):r.toFixed(1);};
    const bpd=cur.blocksPerDay?_fmtBpd(cur.blocksPerDay)+'블록/일':(cur.dailyPlan?'일정표':'—');

    // build block detail list entries (based on today's dayIn)
    let detailEntries=[];
    if(cur.dailyPlan){
      const dg={};
      cur.dailyPlan.forEach(p=>{
        if(!dg[p.day])dg[p.day]=[];
        const blk=data.blocks[p.blockIdx];
        dg[p.day].push({name:p.text||blk?.name||'',blockId:blk?.id,planDay:p.day,blockIdx:p.blockIdx,isPlan:true});
      });
      Object.keys(dg).sort((a,b)=>+a-+b).forEach(d=>{
        const di=parseInt(d);
        detailEntries.push({day:di,status:di<dayIn?'done':di===dayIn?'today':'future',items:dg[d]});
      });
    }else if(cur.blocksPerDay){
      for(let d=0;d<cur.days;d++){
        const idxs=getTodayBlockIndices(d,cur.blocksPerDay,nb);
        const items=idxs.map(i=>({name:data.blocks[i]?.name||'',blockId:data.blocks[i]?.id,blockIdx:i})).filter(x=>x.blockId);
        if(items.length)detailEntries.push({day:d,status:d<dayIn?'done':d===dayIn?'today':'future',items});
      }
    }
    const doneDays=detailEntries.filter(e=>e.status==='done').length;
    const remDaysCount=detailEntries.filter(e=>e.status!=='done').length;

    // build popup-style daily content for 전체 보기
    let popupDetailHtml='';
    if(cur.dailyTexts&&cur.dailyTexts.length){
      cur.dailyTexts.forEach((txt,di)=>{
        popupDetailHtml+=`<div class="rs-content-row"><span class="rs-content-day">${di+1}일</span><span style="font-size:13px;color:#37352F">${escHtml(txt)}</span></div>`;
      });
    }else if(cur.dailyPlan){
      const _dg={};
      cur.dailyPlan.forEach(p=>{if(!_dg[p.day])_dg[p.day]=[];const blk=data.blocks[p.blockIdx];_dg[p.day].push(p.text||blk?.name||'');});
      Object.keys(_dg).sort((a,b)=>+a-+b).forEach(day=>{
        const di=parseInt(day);
        _dg[day].forEach((txt,ni)=>{popupDetailHtml+=`<div class="rs-content-row"><span class="rs-content-day">${ni===0?di+1+'일':''}</span><span style="font-size:13px;color:#37352F">${escHtml(txt)}</span></div>`;});
      });
    }else if(cur.blocksPerDay){
      for(let day=0;day<cur.days;day++){
        const idxs=getTodayBlockIndices(day,cur.blocksPerDay,nb);
        idxs.forEach((bi,ni)=>{const blk=data.blocks[bi];if(!blk)return;popupDetailHtml+=`<div class="rs-content-row"><span class="rs-content-day">${ni===0?day+1+'일':''}</span><span style="font-size:13px;color:#37352F">${escHtml(blk.name)}</span></div>`;});
      }
    }

    html+=`<div class="review-section"><div class="review-cycle-card" style="border-color:${subj.color}40">`;
    html+=`<div class="review-cycle-badge" style="background:${subj.color}">${cur.label||cur.num+'회독'} 진행 중</div>`;
    html+=`<div class="review-cycle-props"><span class="review-cycle-prop">기간: <span>${cur.days}일</span></span><span class="review-cycle-prop">하루분량: <span>${bpd}</span></span></div>`;
    html+=`<div class="review-progress-bar"><div class="review-progress-fill" style="width:${pct}%;background:${subj.color}"></div></div>`;
    html+=`<div class="review-cycle-info" style="margin-bottom:1px">${doneDays}일 완료 · ${remDaysCount}일 남음</div>`;
    html+=`<div class="review-cycle-info">${dayIn+1}/${cur.days}일째 · D-${daysLeft}</div>`;
    if(cur.startDate){const _tlS=new Date(cur.startDate);_tlS.setHours(0,0,0,0);const _tlE=addDays(getCalendarEndForCycle(cur),-1);const _pct=Math.min(99,Math.round((dayIn+0.5)/cur.days*100));html+=`<div class="review-timeline"><span class="review-tl-date">${fmtDate(_tlS)}</span><div class="review-tl-bar"><div class="review-tl-track" style="background:linear-gradient(to right,${subj.color} ${_pct}%,#E9E9E7 ${_pct}%)"></div><div class="review-tl-dot" style="left:${_pct}%;background:${subj.color}"></div></div><span class="review-tl-date">${fmtDate(_tlE)}</span></div>`;}

    // 오늘 체크 section — inside the cycle card
    const checks=loadReviewChecks(subj.key,vd);
    let todayItems=[];
    if(viewCur){
      if(viewCur.dailyTexts&&viewCur.dailyTexts.length>viewDayIn&&viewCur.dailyTexts[viewDayIn]){
        todayItems.push({checkId:'dp_'+viewDayIn,blockId:'dt_'+viewDayIn,name:viewCur.dailyTexts[viewDayIn]});
      }else if(viewCur.dailyPlan){
        viewCur.dailyPlan.filter(p=>p.day===viewDayIn).forEach(p=>{
          const blk=data.blocks[p.blockIdx];if(!blk)return;
          todayItems.push({checkId:'dp_'+viewDayIn,blockId:blk.id,blockIdx:p.blockIdx,name:p.text||blk.name});
        });
      }else if(viewCur.blocksPerDay){
        getTodayBlockIndices(viewDayIn,viewCur.blocksPerDay,nb).forEach(bi=>{
          const blk=data.blocks[bi];if(!blk)return;
          todayItems.push({checkId:blk.id,blockId:blk.id,blockIdx:bi,name:blk.name});
        });
      }
    }
    // starred blocks float to top
    todayItems.sort((a,b)=>(weaks[b.blockId]?1:0)-(weaks[a.blockId]?1:0));

    // weekend rest check
    const isWeekendRest=!!(viewCur?.weekdayOnly&&(vd.getDay()===0||vd.getDay()===6));

    // section title reflects viewDate
    let checkTitle='오늘 체크';
    if(isWeekendRest){checkTitle='주말 휴식일';}
    else if(!isTodayView){const vm=vd.getMonth()+1,vda=vd.getDate();checkTitle=isFutureView?`${vm}/${vda} 예정`:`${vm}/${vda} 체크`;}

    const _sbStyle=_sbAdded?'background:#9B9A97;color:#fff;border-color:#9B9A97;cursor:default':'';
    const _sbDateLabel=isTodayView?'오늘':`${vd.getMonth()+1}월${vd.getDate()}일`;
    const _sbLabel=_sbAdded?'✓ 추가됨':`+ ${_sbDateLabel} 시간표 추가`;
    const _sbHtml=!_sbIsWeekend?`<button class="review-tb-btn" id="addTodaySched_${subj.key}" ${_sbAdded?'disabled':''} style="${_sbStyle}">${_sbLabel}</button>`:'';
    const _rcexBtnHtml=popupDetailHtml?`<button class="rcex-toggle-btn" id="rcex_${subj.key}">전체 보기 ▼</button>`:'';

    html+=`<div style="margin-top:14px;border-top:1px solid #F4F4F2;padding-top:12px">`;
    html+=`<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px"><span class="review-section-title" style="margin-bottom:0;display:inline">${checkTitle}</span>${_rcexBtnHtml}${_sbHtml}</div>`;
    html+=`<div class="review-today-list" id="rtl_${subj.key}">`;
    if(!todayItems.length){
      const emptyMsg=isWeekendRest?'주말 — 평일 기준 회독 중, 오늘은 휴식일입니다':isFutureView?'아직 체크할 수 없습니다':!viewCur?'이 날은 복습 없는 날입니다':'오늘은 복습 없는 날입니다';
      html+=`<div class="review-empty"${(isFutureView||isWeekendRest)?' style="color:#C0BFBC"':''}>${emptyMsg}</div>`;
    }else{
      todayItems.forEach(item=>{
        const done=!!checks[item.checkId];
        const isWeak=!!weaks[item.blockId];
        const prevMemo=loadReviewMemo(subj.key,item.blockId);
        const hourOpts=Array.from({length:14},(_,i)=>i+7).map(h=>`<option value="${h}"${h===9?' selected':''}>${h}:00</option>`).join('');
        const faded=isFutureView?' style="opacity:.45"':'';
        html+=`<div class="review-today-item"${faded}>`;
        html+=`<div class="review-today-check${done?' done':''}" data-rck="${item.checkId}" data-bid="${item.blockId}" data-rsk="${subj.key}"${isFutureView?' style="pointer-events:none;opacity:.4"':''}>${done?'✓':'✗'}</div>`;
        html+=`<div class="review-item-body">`;
        html+=`<input class="review-today-name${done?' done-text':''}" data-rnm="${item.blockId}" data-rsk="${subj.key}" value="${escHtml(item.name)}"${isFutureView?' disabled':''}>`;
        if(isWeak)html+=`<span class="review-weak-badge">⚠ 약점</span>`;
        if(prevMemo)html+=`<span class="review-prev-memo">이전 메모: ${escHtml(prevMemo)}</span>`;
        if(!isFutureView){
          html+=`<div class="review-memo-area" id="ma_${item.checkId}">`;
          html+=`<textarea class="review-memo-inp" placeholder="메모..." rows="2" id="mt_${item.checkId}">${escHtml(prevMemo)}</textarea>`;
          html+=`<button class="btn" style="font-size:12px;padding:2px 8px;margin-top:4px" data-msave="${item.checkId}" data-rsk="${subj.key}" data-bid="${item.blockId}">저장</button>`;
          html+=`</div>`;
        }
        html+=`<div class="review-tb-picker" id="tp_${item.checkId}">`;
        html+=`<select class="review-tb-hour" id="tsh_${item.checkId}">${hourOpts}</select>`;
        html+=`<select class="review-tb-dur" id="tsd_${item.checkId}"><option value="30">30분</option><option value="60" selected>1시간</option><option value="90">1.5시간</option><option value="120">2시간</option></select>`;
        html+=`<button class="review-tb-confirm" data-tbadd="${item.checkId}" data-rsk="${subj.key}" data-bname="${escHtml(item.name)}">추가</button>`;
        html+=`</div>`;
        html+=`</div>`;
        html+=`<div class="review-item-actions">`;
        html+=`<button class="review-star-btn${isWeak?' active':''}" data-star="${item.checkId}" data-bid="${item.blockId}" data-rsk="${subj.key}" title="약점 태그">⭐</button>`;
        if(!isFutureView)html+=`<button class="review-memo-btn" data-memo="${item.checkId}" title="메모">📝</button>`;
        html+=`<button class="review-tb-btn" data-tb="${item.checkId}">+ 시간표</button>`;
        html+=`</div>`;
        html+=`</div>`;
      });
    }
    html+=`</div>`; // close review-today-list
    if(popupDetailHtml){html+=`<div class="rcex-body" id="rcexb_${subj.key}" style="display:none">${popupDetailHtml}</div>`;}
    html+=`</div>`; // close inner check section
    html+=`</div></div>`; // close review-cycle-card and review-section

    // speed analysis
    const doneCnt=cycles.filter(c=>getCycleStatus(c,today)==='done').length;
    const examDate=new Date('2026-08-31');examDate.setHours(0,0,0,0);
    const daysToExam=Math.round((examDate-today)/86400000);
    const completedDays=getCompletedDaysInCycle(subj.key,cur,data);
    const delayDays=dayIn-completedDays;
    const paceStr=delayDays>0?`+${delayDays}일 지연`:delayDays<0?`${-delayDays}일 앞당김`:'예정 준수';
    const doneCycles=cycles.filter(c=>getCycleStatus(c,today)==='done');
    const avgCycleDays=doneCycles.length?Math.round(doneCycles.reduce((s,c)=>s+(c.days||0),0)/doneCycles.length):(cur?cur.days:15);
    const totalCompletable=doneCnt+(cur?1:0)+Math.max(0,Math.floor(daysToExam/avgCycleDays));
    let addBpdStr='—';
    if(cur&&cur.blocksPerDay&&dayIn<cur.days-1){
      const blkDone=Math.round(completedDays*cur.blocksPerDay);
      const blkRem=nb-blkDone;
      const dRem=cur.days-dayIn-1;
      const reqBpd=dRem>0?blkRem/dRem:0;
      const addBpd=reqBpd-cur.blocksPerDay;
      addBpdStr=addBpd<=0.05?'추가 불필요':`+${Math.ceil(addBpd)}블록/일 추가 권장`;
    }
    html+=`<div class="review-section"><span class="review-section-title">속도 분석</span><div class="review-speed-box">`;
    html+=`<div class="review-speed-row"><span>현재 페이스</span><span>${paceStr}</span></div>`;
    html+=`<div class="review-speed-row"><span>시험일 기준 완료 가능</span><span>총 ${totalCompletable}회독</span></div>`;
    html+=`<div class="review-speed-row"><span>목표 달성</span><span>${addBpdStr}</span></div>`;
    html+=`<div class="review-speed-row"><span>시험까지</span><span>D-${daysToExam}</span></div>`;
    html+=`</div></div>`;
  }

  // roadmap
  html+=`<div class="review-section"><span class="review-section-title">전체 회독 로드맵</span><div class="review-roadmap">`;
  cycles.forEach(c=>{
    const st=getCycleStatus(c,today);
    let sDate=null,eDate=null;
    if(c.startDate){sDate=new Date(c.startDate);sDate.setHours(0,0,0,0);const _ce=getCalendarEndForCycle(c);eDate=_ce?addDays(_ce,-1):addDays(sDate,c.days-1);}
    let circCls='',info='',editBtn='';
    if(st==='done'){circCls='done';info=`완료 · ${fmtDate(sDate)}~${fmtDate(eDate)}`;}
    else if(st==='current'){circCls='current';info=`진행 중 · D-${cur?cur.days-dayIn-1:'?'}`;editBtn=`<button class="review-roadmap-edit" data-red="${c.num}" data-rsk="${subj.key}">편집</button>`;}
    else{info=c.startDate?`예정 · ${fmtDate(sDate)} 시작`:'예정 · 미설정';editBtn=`<button class="review-roadmap-edit" data-red="${c.num}" data-rsk="${subj.key}">편집</button>`;}
    const rowStyle=st==='current'?`style="background:${subj.color}15"`:'';
    const circLabel=c.label?c.label.slice(0,2):c.num;
    let endBtn='';
    if(st==='current'){endBtn=`<button class="review-roadmap-end" data-rend="${c.num}" data-rsk="${subj.key}">종료</button>`;}
    else if(st==='done'&&c.manualEnd){endBtn=`<button class="review-roadmap-end review-roadmap-unend" data-rend="${c.num}" data-rsk="${subj.key}" data-unend="1" style="opacity:.6">종료 취소</button>`;}
    const contentBtn=`<button class="review-roadmap-content-btn" data-ckey="${c.num}" data-rsk="${subj.key}">내용</button>`;
    html+=`<div class="review-roadmap-row${st==='current'?' current-cycle':''}" ${rowStyle}><div class="review-roadmap-circle ${circCls}">${circLabel}</div><span class="review-roadmap-name">${c.label||c.num+'회독'}</span><span class="review-roadmap-info">${info}</span>${editBtn}${endBtn}${contentBtn}</div>`;
    const contentRows=buildCycleContentHtml(c,data,subj.key,weaks);
    html+=`<div class="rcex-cycle-content" id="rcexc_${subj.key}_${c.num}" style="display:none">${contentRows}</div>`;
  });
  html+=`</div></div>`;
  el.innerHTML=html;

  // bind: rcex expand toggle (current cycle)
  const rcexBtn=el.querySelector(`#rcex_${subj.key}`);
  const rcexBody=el.querySelector(`#rcexb_${subj.key}`);
  if(rcexBtn&&rcexBody){
    rcexBtn.addEventListener('click',()=>{
      const open=rcexBody.style.display!=='none';
      rcexBody.style.display=open?'none':'block';
      rcexBtn.textContent=open?'전체 보기 ▼':'접기 ▲';
    });
  }

  // bind: roadmap content toggle
  el.querySelectorAll('[data-ckey]').forEach(btn=>{
    btn.addEventListener('click',e=>{
      e.stopPropagation();
      const cnum=btn.dataset.ckey,sk=btn.dataset.rsk;
      const body=document.getElementById(`rcexc_${sk}_${cnum}`);
      if(!body)return;
      const open=body.style.display!=='none';
      body.style.display=open?'none':'block';
      btn.textContent=open?'내용':'접기';
    });
  });

  // bind: content edit (rcex-name-inp in roadmap and current-cycle detail)
  el.querySelectorAll('.rcex-name-inp').forEach(inp=>{
    inp.addEventListener('change',()=>{
      const sk=inp.dataset.rsk;
      const d=loadReviewData(sk);if(!d)return;
      if(inp.dataset.isplan==='true'){
        const planDay=parseInt(inp.dataset.planday);
        const cycleNum=parseInt(inp.dataset.rcycle);
        const c=d.cycles.find(x=>x.num===cycleNum);
        if(c&&c.dailyPlan){
          const p=c.dailyPlan.find(x=>x.day===planDay);
          if(p)p.text=inp.value.trim();
          saveReviewData(sk,d);
        }
      }else{
        const bi=parseInt(inp.dataset.blockidx);
        if(!isNaN(bi)&&bi>=0&&d.blocks[bi]){d.blocks[bi].name=inp.value.trim();saveReviewData(sk,d);}
      }
    });
  });

  // bind: end-cycle buttons (toggle: 종료 ↔ 종료 취소)
  el.querySelectorAll('[data-rend]').forEach(btn=>{
    btn.addEventListener('click',e=>{
      e.stopPropagation();
      const sk=btn.dataset.rsk,num=parseInt(btn.dataset.rend);
      const d=loadReviewData(sk);if(!d)return;
      const c=d.cycles.find(x=>x.num===num);if(!c||!c.startDate)return;
      if(btn.dataset.unend==='1'){
        // undo completion
        if(!confirm(`${c.label||num+'회독'} 종료를 취소할까요?`))return;
        if(c._originalDays!=null){c.days=c._originalDays;}
        delete c._originalDays;delete c.manualEnd;
        saveReviewData(sk,d);reviewSubTab='all';renderReview();
        return;
      }
      if(!confirm(`${c.label||num+'회독'}을 오늘(${dateKey(today)})로 종료할까요?`))return;
      const start=new Date(c.startDate);start.setHours(0,0,0,0);
      c._originalDays=c.days;
      if(c.weekdayOnly){
        let count=0,dd=new Date(start);
        while(dd<=today){if(dd.getDay()!==0&&dd.getDay()!==6)count++;dd=addDays(dd,1);}
        c.days=Math.max(1,count);
      }else{
        c.days=Math.max(1,Math.round((today-start)/86400000)+1);
      }
      c.manualEnd=true;
      saveReviewData(sk,d);reviewSubTab='all';renderReview();
    });
  });

  // bind: add-schedule button (any date)
  const _schedBtn=el.querySelector(`#addTodaySched_${subj.key}`);
  if(_schedBtn&&!_sbAdded)_schedBtn.addEventListener('click',()=>addTodaySchedule(_schedBtn,vd,subj.key+':'+_sbDk));

  // bind: check toggle (uses viewDate; disabled for future)
  el.querySelectorAll('[data-rck]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      if(isFutureView)return;
      const id=btn.dataset.rck,sk=btn.dataset.rsk,bid=btn.dataset.bid;
      const ch=loadReviewChecks(sk,vd);ch[id]=!ch[id];saveReviewChecks(sk,ch,vd);
      btn.classList.toggle('done',!!ch[id]);btn.textContent=ch[id]?'✓':'✗';
      const nm=el.querySelector(`[data-rnm="${bid}"]`);if(nm)nm.classList.toggle('done-text',!!ch[id]);
      if(ch[id]&&isTodayView){const d2=loadReviewData(sk);if(d2)tryAutoNextCycle(sk,d2);}
    });
  });

  // bind: name edit
  el.querySelectorAll('[data-rnm]').forEach(inp=>{
    inp.addEventListener('change',()=>{
      const id=inp.dataset.rnm,sk=inp.dataset.rsk;
      const d=loadReviewData(sk);if(!d)return;
      const b=d.blocks.find(x=>x.id===id);if(b){b.name=inp.value;saveReviewData(sk,d);}
    });
  });

  // bind: star toggle
  el.querySelectorAll('[data-star]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const bid=btn.dataset.bid,sk=btn.dataset.rsk;
      const w=loadReviewWeaks(sk);
      w[bid]=!w[bid];if(!w[bid])delete w[bid];
      saveReviewWeaks(sk,w);
      btn.classList.toggle('active',!!w[bid]);
      const item=btn.closest('.review-today-item');
      if(item){
        let badge=item.querySelector('.review-weak-badge');
        if(w[bid]&&!badge){
          badge=document.createElement('span');badge.className='review-weak-badge';badge.textContent='⚠ 약점';
          const body=item.querySelector('.review-item-body');
          const refEl=body.querySelector('.review-prev-memo')||body.querySelector('.review-memo-area');
          body.insertBefore(badge,refEl||null);
        }else if(!w[bid]&&badge){badge.remove();}
      }
      showReviewToast(w[bid]?'약점 블록 태그됨':'약점 태그 해제');
    });
  });

  // bind: memo toggle
  el.querySelectorAll('[data-memo]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const id=btn.dataset.memo;
      const area=document.getElementById('ma_'+id);
      if(area)area.classList.toggle('open');
    });
  });

  // bind: memo save
  el.querySelectorAll('[data-msave]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const id=btn.dataset.msave,sk=btn.dataset.rsk,bid=btn.dataset.bid;
      const ta=document.getElementById('mt_'+id);if(!ta)return;
      saveReviewMemo(sk,bid,ta.value.trim());
      document.getElementById('ma_'+id).classList.remove('open');
      const item=btn.closest('.review-today-item');
      if(item){
        let prev=item.querySelector('.review-prev-memo');
        const body=item.querySelector('.review-item-body');
        if(ta.value.trim()){
          if(!prev){prev=document.createElement('span');prev.className='review-prev-memo';body.insertBefore(prev,document.getElementById('ma_'+id));}
          prev.textContent=ta.value.trim();
        }else if(prev){prev.remove();}
      }
      showReviewToast('메모 저장됨');
    });
  });

  // bind: time picker toggle
  el.querySelectorAll('[data-tb]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const id=btn.dataset.tb;
      const picker=document.getElementById('tp_'+id);if(picker)picker.classList.toggle('open');
    });
  });

  // bind: time picker add
  el.querySelectorAll('[data-tbadd]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const id=btn.dataset.tbadd,sk=btn.dataset.rsk,bname=btn.dataset.bname;
      const h=parseInt(document.getElementById('tsh_'+id).value);
      const dur=parseInt(document.getElementById('tsd_'+id).value);
      addBlockFromReview(sk,bname,h,dur,vd);
      const picker=document.getElementById('tp_'+id);if(picker)picker.classList.remove('open');
      const tbBtn=el.querySelector(`[data-tb="${id}"]`);
      if(tbBtn){tbBtn.classList.add('used');tbBtn.disabled=true;tbBtn.textContent='✓ 추가됨';}
    });
  });

  // bind: roadmap edit buttons
  el.querySelectorAll('[data-red]').forEach(btn=>{
    btn.addEventListener('click',e=>{
      e.stopPropagation();
      openReviewEditModal(btn.dataset.rsk,parseInt(btn.dataset.red),cycles);
    });
  });

  // add cycle button
  const ab=document.createElement('button');ab.className='review-add-btn';ab.textContent='+ 회독 추가';
  ab.onclick=()=>addReviewCycle(subj.key);
  el.appendChild(ab);
}

function addReviewCycle(sk){
  const d=loadReviewData(sk)||{blocks:Array.from({length:8},(_,i)=>({id:'b'+(i+1),name:'블록 '+(i+1)})),cycles:[]};
  const next=(d.cycles.length?d.cycles[d.cycles.length-1].num:0)+1;
  d.cycles.push({num:next,days:7,blocksPerDay:1,startDate:null});
  saveReviewData(sk,d);renderReview();
}

function startNewRound(startDate){
  const today=new Date();today.setHours(0,0,0,0);
  REVIEW_SUBJECTS.forEach(subj=>{
    const d=loadReviewData(subj.key);
    if(!d)return;
    const cycles=d.cycles||[];
    const cur=cycles.find(c=>getCycleStatus(c,today)==='current');
    if(cur&&cur.startDate){
      const start=new Date(cur.startDate);start.setHours(0,0,0,0);
      if(cur.weekdayOnly){
        let count=0,dd=new Date(start);
        while(dd<today){if(dd.getDay()!==0&&dd.getDay()!==6)count++;dd=addDays(dd,1);}
        cur.days=Math.max(1,count);
      }else{
        cur.days=Math.max(1,Math.round((today-start)/86400000));
      }
    }
    const alreadyNext=cur&&cycles.find(c=>c.num===cur.num+1);
    if(!alreadyNext){
      const nextNum=(cycles.length?cycles[cycles.length-1].num:0)+1;
      const baseDays=cur?Math.max(1,Math.round((cur.days||7)*0.8)):7;
      cycles.push({num:nextNum,days:baseDays,blocksPerDay:cur?cur.blocksPerDay:1,weekdayOnly:cur?!!cur.weekdayOnly:false,startDate});
      d.cycles=cycles;
      saveReviewData(subj.key,d);
    }
  });
  renderReview();
  showReviewToast('새 회독이 시작되었습니다.');
}

function openReviewEditModal(sk,cycleNum,cycles){
  _rsSubjectKey=sk;_rsCycleNum=cycleNum;
  const d=loadReviewData(sk);
  const c=d&&cycleNum?d.cycles.find(x=>x.num===cycleNum):null;
  document.getElementById('reviewEditTitle').textContent=cycleNum?`${cycleNum}회독 설정`:'회독 설정';
  document.getElementById('rsDaysVal').textContent=c?c.days:7;
  document.getElementById('rsStartDate').value=c&&c.startDate?c.startDate:'';
  const prev=cycles&&cycleNum>1?cycles.find(x=>x.num===cycleNum-1):null;
  const prevEndDate=prev&&prev.startDate?dateKey(addDays(new Date(prev.startDate),prev.days)):'';
  document.getElementById('rsAutoDate').checked=false;
  document.getElementById('rsAutoDate').dataset.prevend=prevEndDate;
  document.getElementById('rsWeekdayOnly').checked=!!(c&&c.weekdayOnly);
  document.getElementById('rsTotalCount').value=d&&d.totalCount?d.totalCount:'';
  const rec=cycleNum>1?`추천: ${cycleNum}회독은 이전 회독 대비 ~20% 단축 권장`:'';
  document.getElementById('rsSuggestion').textContent=rec;

  // populate content section
  const contentField=document.getElementById('rsContentField');
  const contentSection=document.getElementById('rsContentSection');
  contentSection.innerHTML='';
  if(c&&d){
    const nb=d.blocks.length;
    let hasContent=false;
    if(c.dailyTexts&&c.dailyTexts.length){
      hasContent=true;
      c.dailyTexts.forEach((txt,di)=>{
        const row=document.createElement('div');row.className='rs-content-row';
        const lbl=document.createElement('span');lbl.className='rs-content-day';lbl.textContent=`${di+1}일`;
        const inp=document.createElement('input');inp.className='rs-content-inp';inp.type='text';
        inp.value=txt;inp.dataset.dailyday=di;
        row.appendChild(lbl);row.appendChild(inp);contentSection.appendChild(row);
      });
    }else if(c.dailyPlan){
      hasContent=true;
      const dg={};
      c.dailyPlan.forEach(p=>{
        if(!dg[p.day])dg[p.day]=[];
        const blk=d.blocks[p.blockIdx];
        dg[p.day].push({text:p.text||blk?.name||'',planDay:p.day,blockIdx:p.blockIdx});
      });
      Object.keys(dg).sort((a,b)=>+a-+b).forEach(day=>{
        const di=parseInt(day);
        dg[day].forEach((item,ni)=>{
          const row=document.createElement('div');row.className='rs-content-row';
          const lbl=document.createElement('span');lbl.className='rs-content-day';lbl.textContent=ni===0?`${di+1}일`:'';
          const inp=document.createElement('input');inp.className='rs-content-inp';inp.type='text';
          inp.value=item.text;inp.dataset.planday=item.planDay;inp.dataset.isplan='true';inp.dataset.blockidx=item.blockIdx;
          row.appendChild(lbl);row.appendChild(inp);contentSection.appendChild(row);
        });
      });
    }else if(c.blocksPerDay){
      hasContent=true;
      for(let day=0;day<c.days;day++){
        const idxs=getTodayBlockIndices(day,c.blocksPerDay,nb);
        if(!idxs.length){
          const row=document.createElement('div');row.className='rs-content-row';
          const lbl=document.createElement('span');lbl.className='rs-content-day';lbl.textContent=`${day+1}일`;
          const empty=document.createElement('span');empty.style.cssText='font-size:12px;color:#C0BFBC';empty.textContent='—';
          row.appendChild(lbl);row.appendChild(empty);contentSection.appendChild(row);
          continue;
        }
        idxs.forEach((bi,ni)=>{
          const blk=d.blocks[bi];if(!blk)return;
          const row=document.createElement('div');row.className='rs-content-row';
          const lbl=document.createElement('span');lbl.className='rs-content-day';lbl.textContent=ni===0?`${day+1}일`:'';
          const inp=document.createElement('input');inp.className='rs-content-inp';inp.type='text';
          inp.value=blk.name;inp.dataset.isplan='false';inp.dataset.blockidx=bi;
          row.appendChild(lbl);row.appendChild(inp);contentSection.appendChild(row);
        });
      }
    }
    contentField.style.display=hasContent?'':'none';
  }else{
    contentField.style.display='none';
  }

  // populate blocks editing section
  const blocksField=document.getElementById('rsBlocksField');
  const blocksSection=document.getElementById('rsBlocksSection');
  blocksSection.innerHTML='';
  if(d){
    function _addBlockRow(blk,idx){
      const row=document.createElement('div');row.className='rs-block-row';
      const num=document.createElement('span');num.className='rs-block-num';num.textContent=idx+1;
      const inp=document.createElement('input');inp.className='rs-block-inp';inp.type='text';inp.value=blk.name;inp.dataset.blockid=blk.id;
      const del=document.createElement('button');del.className='rs-block-del';del.textContent='×';del.title='삭제';
      del.onclick=()=>{row.remove();_reindexBlockNums();};
      row.appendChild(num);row.appendChild(inp);row.appendChild(del);
      blocksSection.appendChild(row);
    }
    function _reindexBlockNums(){
      blocksSection.querySelectorAll('.rs-block-num').forEach((n,i)=>n.textContent=i+1);
    }
    d.blocks.forEach(_addBlockRow);
    document.getElementById('rsBlockAdd').onclick=()=>{
      const newId='b_'+Date.now();
      _addBlockRow({id:newId,name:''},d.blocks.length+blocksSection.querySelectorAll('.rs-block-row').length);
      _reindexBlockNums();
      blocksSection.lastElementChild?.querySelector('.rs-block-inp')?.focus();
    };
    blocksField.style.display='';
  }else{
    blocksField.style.display='none';
  }

  document.getElementById('reviewModalOverlay').classList.add('open');
}

function autoDistributeToContent(){
  const D=parseInt(document.getElementById('rsDaysVal').textContent);
  if(!D)return;
  const totalVal=parseInt(document.getElementById('rsTotalCount').value);
  const section=document.getElementById('rsContentSection');
  const field=document.getElementById('rsContentField');
  section.innerHTML='';field.style.display='';

  if(totalVal>0){
    // numeric range mode: "1~18", "19~36", ...
    const N=totalVal;
    for(let d=0;d<D;d++){
      const start=Math.floor(d*N/D)+1;
      const end=Math.floor((d+1)*N/D);
      const row=document.createElement('div');row.className='rs-content-row';
      const lbl=document.createElement('span');lbl.className='rs-content-day';lbl.textContent=`${d+1}일`;
      const inp=document.createElement('input');inp.className='rs-content-inp';inp.type='text';inp.dataset.dailyday=d;
      inp.value=start===end?`${start}`:`${start}~${end}`;
      row.appendChild(lbl);row.appendChild(inp);section.appendChild(row);
    }
  }else{
    // block name mode
    const blockNames=Array.from(document.querySelectorAll('#rsBlocksSection .rs-block-inp')).map(i=>i.value.trim()).filter(Boolean);
    if(!blockNames.length)return;
    const N=blockNames.length;
    for(let d=0;d<D;d++){
      const start=Math.floor(d*N/D);
      const end=Math.floor((d+1)*N/D);
      const chunk=blockNames.slice(start,end);
      const row=document.createElement('div');row.className='rs-content-row';
      const lbl=document.createElement('span');lbl.className='rs-content-day';lbl.textContent=`${d+1}일`;
      const inp=document.createElement('input');inp.className='rs-content-inp';inp.type='text';inp.dataset.dailyday=d;
      inp.value=!chunk.length?'':chunk.length===1?chunk[0]:`${chunk[0]} ~ ${chunk[chunk.length-1]}`;
      row.appendChild(lbl);row.appendChild(inp);section.appendChild(row);
    }
  }
}

function closeReviewModal(){
  document.getElementById('reviewModalOverlay').classList.remove('open');
  _rsSubjectKey=null;_rsCycleNum=null;
}

function loadReviewWeaks(sk){try{return JSON.parse(localStorage.getItem('review_weak_'+sk)||'{}')}catch{return{}}}
function saveReviewWeaks(sk,d){const key='review_weak_'+sk;const v=JSON.stringify(d);localStorage.setItem(key,v);syncToSupabase(key,v);}
function loadReviewMemo(sk,blockId){try{return localStorage.getItem('review_memo_'+sk+'_'+blockId)||''}catch{return''}}
function saveReviewMemo(sk,blockId,text){const key='review_memo_'+sk+'_'+blockId;localStorage.setItem(key,text);syncToSupabase(key,text);}

function showReviewToast(msg){
  const t=document.getElementById('reviewToast');if(!t)return;
  t.textContent=msg;t.style.opacity='1';
  clearTimeout(t._hide);t._hide=setTimeout(()=>t.style.opacity='0',2000);
}

function getCompletedDaysInCycle(sk,cur,data){
  if(!cur||!cur.startDate||!data)return 0;
  const s=new Date(cur.startDate);s.setHours(0,0,0,0);
  const today=new Date();today.setHours(0,0,0,0);
  const nb=data.blocks.length;
  let count=0,d=0;
  let calDate=new Date(s);
  while(d<cur.days){
    if(calDate>=today)break;
    const dow=calDate.getDay();
    if(!cur.weekdayOnly||dow!==0&&dow!==6){
      const ch=loadReviewChecks(sk,calDate);
      let ids=[];
      if(cur.dailyPlan){ids=cur.dailyPlan.filter(p=>p.day===d).map(()=>'dp_'+d);}
      else if(cur.blocksPerDay){ids=getTodayBlockIndices(d,cur.blocksPerDay,nb).map(i=>data.blocks[i]?.id).filter(Boolean);}
      if(ids.length&&ids.every(id=>ch[id]))count++;
      d++;
    }
    calDate=addDays(calDate,1);
  }
  return count;
}

function tryAutoNextCycle(sk,data){
  const today=new Date();today.setHours(0,0,0,0);
  const cur=data.cycles.find(c=>getCycleStatus(c,today)==='current');
  if(!cur)return;
  if(cur.weekdayOnly&&(today.getDay()===0||today.getDay()===6))return;
  const dayIn=getCycleDayIn(cur,today);
  if(dayIn!==cur.days-1)return;
  const checks=loadReviewChecks(sk);
  let todayIds=[];
  if(cur.dailyPlan){
    todayIds=cur.dailyPlan.filter(p=>p.day===dayIn).map(()=>'dp_'+dayIn);
  }else if(cur.blocksPerDay){
    todayIds=getTodayBlockIndices(dayIn,cur.blocksPerDay,data.blocks.length).map(i=>data.blocks[i].id);
  }
  if(!todayIds.length||!todayIds.every(id=>checks[id]))return;
  let next=data.cycles.find(c=>c.num===cur.num+1);
  if(!next){
    const newDays=Math.max(1,Math.round(cur.days*0.8));
    next={num:cur.num+1,days:newDays,blocksPerDay:cur.blocksPerDay||1,startDate:null};
    data.cycles.push(next);
  }
  if(next.startDate)return;
  const _calEnd=getCalendarEndForCycle(cur);
  next.startDate=dateKey(_calEnd||addDays(new Date(cur.startDate),cur.days));
  saveReviewData(sk,data);
  showReviewToast(`${cur.label||cur.num+'회독'} 완료!`);
  const banner=document.getElementById('reviewBanner');
  if(banner){
    const msg=banner.querySelector('.review-banner-msg');
    if(msg)msg.textContent=`${cur.label||cur.num+'회독'} 완료! ${next.label||next.num+'회독'}이 자동 설정되었습니다.`;
    const editBtn=document.getElementById('reviewBannerEdit');
    if(editBtn){editBtn.dataset.rsk=sk;editBtn.dataset.rnum=next.num;}
    banner.classList.add('open');
  }
}

function addBlockFromReview(sk,bname,hour,dur,targetDate){
  const td=targetDate?new Date(targetDate):new Date();td.setHours(0,0,0,0);
  const dk=dateKey(td);
  const tMon=getMondayOf(td);
  const tWKey=weekKey(tMon);
  const isCurrentWeek=weekKey(currentMonday)===tWKey;
  pushUndo();
  if(isCurrentWeek){
    blocks.push({id:uid(),day:dk,startMin:hour*60,endMin:hour*60+dur,subject:sk,memo:bname,note:'',completed:false});
    saveWeek();
  }else{
    const wb=loadWeek(tMon);
    wb.push({id:uid(),day:dk,startMin:hour*60,endMin:hour*60+dur,subject:sk,memo:bname,note:'',completed:false});
    const v=JSON.stringify(wb);localStorage.setItem(tWKey,v);syncToSupabase(tWKey,v);
  }
  showReviewToast('시간표에 추가됨!');
}

function getTodayMemoForSubject(sk,tgt){
  const data=loadReviewData(sk);if(!data)return'';
  const refDate=tgt?new Date(tgt):(()=>{const d=new Date();d.setHours(0,0,0,0);return d;})();
  refDate.setHours(0,0,0,0);
  let cur=null;
  (data.cycles||[]).forEach(c=>{if(getCycleStatus(c,refDate)==='current'&&!cur)cur=c;});
  if(!cur)return'';
  const dayIn=getCycleDayIn(cur,refDate);
  const cn=cur.label||(cur.num+'회독');
  const items=[];
  if(cur.dailyTexts&&cur.dailyTexts[dayIn]){
    items.push(cn+' '+cur.dailyTexts[dayIn]);
  }else if(cur.dailyPlan){
    cur.dailyPlan.filter(p=>p.day===dayIn).forEach(p=>{
      const blk=data.blocks[p.blockIdx];if(!blk)return;
      items.push(cn+' '+(p.text||blk.name));
    });
  }else if(cur.blocksPerDay){
    getTodayBlockIndices(dayIn,cur.blocksPerDay,data.blocks.length).forEach(bi=>{
      const blk=data.blocks[bi];if(!blk)return;
      items.push(cn+' '+blk.name);
    });
  }
  return items.join(' / ');
}

function addTodaySchedule(btn,targetDate,stateKey){
  const realToday=new Date();realToday.setHours(0,0,0,0);
  const tgt=targetDate?new Date(targetDate):realToday;tgt.setHours(0,0,0,0);
  const dow=tgt.getDay();
  if(dow===0||dow===6){alert('주말에는 시간표를 추가할 수 없습니다.');return;}

  const todayDi=dayIdx(tgt);
  const todayMon=getMondayOf(tgt);
  const todayWKey=weekKey(todayMon);
  const isCurrentWeek=weekKey(currentMonday)===todayWKey;
  let todayBlocks=isCurrentWeek?[...blocks]:loadWeek(todayMon);

  const m={
    labor_law: getTodayMemoForSubject('labor_law',tgt)||'노동법',
    admin_law: getTodayMemoForSubject('admin_law',tgt)||'행정쟁송법',
    hr_mgmt:   getTodayMemoForSubject('hr_mgmt',tgt)||'인사노무관리',
    labor_econ:getTodayMemoForSubject('labor_econ',tgt)||'노동경제학',
  };

  const studySlots=[
    {subject:'labor_law', startMin:480, endMin:660, memo:m.labor_law},
    {subject:'admin_law', startMin:660, endMin:720, memo:m.admin_law},
    {subject:'admin_law', startMin:780, endMin:900, memo:m.admin_law},
    {subject:'hr_mgmt',   startMin:900, endMin:1080,memo:m.hr_mgmt},
    {subject:'labor_econ',startMin:1200,endMin:1380,memo:m.labor_econ},
  ];
  const restSlots=[
    {subject:'rest',startMin:720,endMin:780,memo:'점심'},
    {subject:'rest',startMin:1080,endMin:1140,memo:'저녁'},
    {subject:'rest',startMin:1140,endMin:1200,memo:'율무 산책'},
  ];

  const hasConflict=studySlots.some(slot=>
    todayBlocks.some(b=>b.day===todayDi&&!b.ghost&&b.startMin<slot.endMin&&b.endMin>slot.startMin)
  );

  if(hasConflict){
    if(!confirm('이미 해당 시간에 블록이 있습니다. 덮어쓸까요?'))return;
    const toRemove=new Set();
    studySlots.forEach(slot=>{
      todayBlocks.forEach(b=>{
        if(b.day===todayDi&&!b.ghost&&b.startMin<slot.endMin&&b.endMin>slot.startMin)toRemove.add(b.id);
      });
    });
    todayBlocks=todayBlocks.filter(b=>!toRemove.has(b.id));
  }

  pushUndo();
  studySlots.forEach(slot=>{
    todayBlocks.push({id:uid(),day:todayDi,startMin:slot.startMin,endMin:slot.endMin,subject:slot.subject,memo:slot.memo,note:'',completed:false});
  });
  restSlots.forEach(slot=>{
    const exists=todayBlocks.some(b=>b.day===todayDi&&!b.ghost&&b.startMin<slot.endMin&&b.endMin>slot.startMin);
    if(!exists)todayBlocks.push({id:uid(),day:todayDi,startMin:slot.startMin,endMin:slot.endMin,subject:slot.subject,memo:slot.memo,note:'',completed:false});
  });

  if(isCurrentWeek){blocks=todayBlocks;saveWeek();}
  else{const v=JSON.stringify(todayBlocks);localStorage.setItem(todayWKey,v);syncToSupabase(todayWKey,v);}

  if(stateKey)_schedAddedDates[stateKey]=true;
  btn.textContent='✓ 추가됨';
  btn.style.cssText+='background:#9B9A97;color:#fff;border-color:#9B9A97;cursor:default;';
  btn.disabled=true;
  const isToday=isSameDay(tgt,realToday);
  showReviewToast(isToday?'오늘 시간표에 추가됨!':`${tgt.getMonth()+1}월${tgt.getDate()}일 시간표에 추가됨!`);
}

function addSingleSubjectSchedule(btn,subjKey,targetDate,stateKey){
  const SLOTS={
    labor_law:[{startMin:480,endMin:660}],
    admin_law:[{startMin:660,endMin:720},{startMin:780,endMin:900}],
    hr_mgmt:[{startMin:900,endMin:1080}],
    labor_econ:[{startMin:1200,endMin:1380}],
  };
  const slots=SLOTS[subjKey];if(!slots)return;
  const realToday=new Date();realToday.setHours(0,0,0,0);
  const tgt=targetDate?new Date(targetDate):realToday;tgt.setHours(0,0,0,0);
  if(tgt.getDay()===0||tgt.getDay()===6){alert('주말에는 시간표를 추가할 수 없습니다.');return;}
  const todayDi=dayIdx(tgt);
  const todayMon=getMondayOf(tgt);
  const todayWKey=weekKey(todayMon);
  const isCurrentWeek=weekKey(currentMonday)===todayWKey;
  let todayBlocks=isCurrentWeek?[...blocks]:loadWeek(todayMon);
  const memo=getTodayMemoForSubject(subjKey,tgt)||SUBJECTS[subjKey]?.name||subjKey;
  const hasConflict=slots.some(slot=>todayBlocks.some(b=>b.day===todayDi&&!b.ghost&&b.startMin<slot.endMin&&b.endMin>slot.startMin));
  if(hasConflict){
    if(!confirm('이미 해당 시간에 블록이 있습니다. 덮어쓸까요?'))return;
    const toRemove=new Set();
    slots.forEach(slot=>{todayBlocks.forEach(b=>{if(b.day===todayDi&&!b.ghost&&b.startMin<slot.endMin&&b.endMin>slot.startMin)toRemove.add(b.id);});});
    todayBlocks=todayBlocks.filter(b=>!toRemove.has(b.id));
  }
  pushUndo();
  slots.forEach(slot=>{todayBlocks.push({id:uid(),day:todayDi,startMin:slot.startMin,endMin:slot.endMin,subject:subjKey,memo,note:'',completed:false});});
  if(isCurrentWeek){blocks=todayBlocks;saveWeek();}
  else{const v=JSON.stringify(todayBlocks);localStorage.setItem(todayWKey,v);syncToSupabase(todayWKey,v);}
  if(stateKey)_schedAddedDates[stateKey]=true;
  btn.textContent='✓ 추가됨';btn.classList.add('used');
  btn.style.cssText+='color:#81C995;border-color:#81C995;cursor:default;';
  btn.disabled=true;
  const isToday=isSameDay(tgt,realToday);
  showReviewToast((isToday?'오늘 ':`${tgt.getMonth()+1}월${tgt.getDate()}일 `)+(SUBJECTS[subjKey]?.short||subjKey)+' 시간표 추가됨!');
}

document.getElementById('rsDaysMinus').addEventListener('click',()=>{
  const v=parseInt(document.getElementById('rsDaysVal').textContent);
  if(v>1)document.getElementById('rsDaysVal').textContent=v-1;
});
document.getElementById('rsDaysPlus').addEventListener('click',()=>{
  document.getElementById('rsDaysVal').textContent=parseInt(document.getElementById('rsDaysVal').textContent)+1;
});
document.getElementById('rsAutoDistBtn').addEventListener('click',autoDistributeToContent);
document.getElementById('rsAutoDate').addEventListener('change',function(){
  if(this.checked&&this.dataset.prevend)document.getElementById('rsStartDate').value=this.dataset.prevend;
});
document.getElementById('rsCancel').addEventListener('click',closeReviewModal);
document.getElementById('reviewBannerClose').addEventListener('click',()=>document.getElementById('reviewBanner').classList.remove('open'));
document.getElementById('reviewBannerEdit').addEventListener('click',function(){
  const sk=this.dataset.rsk,num=parseInt(this.dataset.rnum);
  if(!sk||!num)return;
  const d=loadReviewData(sk);
  if(d)openReviewEditModal(sk,num,d.cycles);
  document.getElementById('reviewBanner').classList.remove('open');
});
document.getElementById('reviewModalOverlay').addEventListener('click',e=>{if(e.target===document.getElementById('reviewModalOverlay'))closeReviewModal();});
document.getElementById('rsSave').addEventListener('click',()=>{
  if(!_rsSubjectKey||!_rsCycleNum){closeReviewModal();return;}
  const d=loadReviewData(_rsSubjectKey);if(!d){closeReviewModal();return;}
  const c=d.cycles.find(x=>x.num===_rsCycleNum);
  if(c){
    c.days=parseInt(document.getElementById('rsDaysVal').textContent);
    c.startDate=document.getElementById('rsStartDate').value||null;
    c.weekdayOnly=document.getElementById('rsWeekdayOnly').checked;
  const tc=parseInt(document.getElementById('rsTotalCount').value);
  if(tc>0)d.totalCount=tc;else delete d.totalCount;
    // save content edits
    document.querySelectorAll('#rsContentSection .rs-content-inp').forEach(inp=>{
      if(inp.dataset.isplan==='true'){
        const planDay=parseInt(inp.dataset.planday);
        if(c.dailyPlan){const p=c.dailyPlan.find(x=>x.day===planDay);if(p)p.text=inp.value.trim();}
      }else{
        const bi=parseInt(inp.dataset.blockidx);
        if(!isNaN(bi)&&bi>=0&&d.blocks[bi])d.blocks[bi].name=inp.value.trim();
      }
    });
  }
  // save daily texts from content section (auto-distributed rows)
  const dailyInputs=document.querySelectorAll('#rsContentSection [data-dailyday]');
  if(dailyInputs.length){
    c.dailyTexts=Array.from(dailyInputs).map(inp=>inp.value.trim());
  }
  // save block list edits
  const newBlocks=[];
  document.querySelectorAll('#rsBlocksSection .rs-block-row').forEach(row=>{
    const inp=row.querySelector('.rs-block-inp');
    const id=inp.dataset.blockid||('b_'+Date.now()+'_'+Math.random().toString(36).slice(2));
    const name=inp.value.trim();
    if(name)newBlocks.push({id,name});
  });
  if(newBlocks.length)d.blocks=newBlocks;
  saveReviewData(_rsSubjectKey,d);closeReviewModal();renderReview();
});

initAdminLawData();

function initLaborLawData(){
  const existing=loadReviewData('labor_law');
  if(existing){
    // migration: add totalCount if missing
    if(!existing.totalCount){existing.totalCount=181;saveReviewData('labor_law',existing);}
    return;
  }
  const blocks=[{id:'b1',name:'쟁점 1~181'}];
  const c12=[
    {num:12,days:2,blocksPerDay:7.5,startDate:'2026-08-06'},
    {num:13,days:2,blocksPerDay:7.5,startDate:'2026-08-08'},
    {num:14,days:2,blocksPerDay:7.5,startDate:'2026-08-10'},
    {num:15,days:2,blocksPerDay:7.5,startDate:'2026-08-12'},
    {num:16,days:2,blocksPerDay:7.5,startDate:'2026-08-14'},
  ];
  const c17=['2026-08-16','2026-08-17','2026-08-18','2026-08-19','2026-08-20',
    '2026-08-21','2026-08-22','2026-08-23','2026-08-24','2026-08-25'].map((sd,i)=>({num:17+i,days:1,blocksPerDay:15,startDate:sd}));
  const cycles=[
    {num:1,days:15,blocksPerDay:1,startDate:'2026-05-29'},
    {num:2,days:10,blocksPerDay:1.5,startDate:'2026-06-13'},
    {num:3,days:8,blocksPerDay:2,startDate:'2026-06-23'},
    {num:4,days:6,blocksPerDay:2.5,startDate:'2026-07-01'},
    {num:5,days:6,blocksPerDay:2.5,startDate:'2026-07-07'},
    {num:6,days:5,blocksPerDay:3,startDate:'2026-07-13'},
    {num:7,days:5,blocksPerDay:3,startDate:'2026-07-18'},
    {num:8,days:4,blocksPerDay:4,startDate:'2026-07-23'},
    {num:9,days:4,blocksPerDay:4,startDate:'2026-07-27'},
    {num:10,days:3,blocksPerDay:5,startDate:'2026-07-31'},
    {num:11,days:3,blocksPerDay:5,startDate:'2026-08-03'},
    ...c12,...c17,
    {num:27,days:4,blocksPerDay:null,startDate:'2026-08-26',label:'최종정돈'},
    {num:28,days:1,blocksPerDay:null,startDate:'2026-08-30',label:'D-1'},
  ];
  saveReviewData('labor_law',{blocks,cycles,totalCount:181});
}
initLaborLawData();

function initHrMgmtData(){
  const existing=loadReviewData('hr_mgmt');
  if(existing&&existing.version===2)return;
  const blocks=[
    "제1~2편 총론 및 환경변화 + 이슈1(성과주의) + 이슈2(윤리경영)",
    "제3편 전략적 인적자원관리(SHRM) + 이슈3(지속가능경영)",
    "제4편 직무관리(직무분석,평가) + 이슈4(다양성경영) + 이슈5(국제HRM)",
    "제4편 직무관리(직무설계) + 이슈17(스마트워크)",
    "제5편 확보관리(인력계획,모집) + 이슈6(여성인력) + 이슈7(비정규직)",
    "제5편 확보관리(선발,선발오류) + 이슈8(핵심인재) + 이슈9(승계계획)",
    "제6편 개발관리(교육훈련) + 이슈10(저성과자관리)",
    "제6편 개발관리(경력및조직개발) + 이슈11(고령인력) + 이슈12(역량기반CB-HRM)",
    "제7편 평가관리(목적,기법) + 이슈13(지식경영) + 이슈14(고성과작업시스템)",
    "제7편 평가관리(평가오류,신뢰성) + 이슈18(인사감사)",
    "제8편 보상관리(임금수준,체계) + 이슈16(근로생활의질QWL)",
    "제8편 보상관리(형태,복리후생) + 이슈15(가족친화경영FFM)",
    "제9편 유지관리(근로시간,노사) + 이슈19(조직문화)",
    "제9편 유지관리(안전보건,스트레스) + 이슈20(사회적자본)",
    "제10편 이직관리 + 보완의날"
  ].map((name,i)=>({id:'b'+(i+1),name}));
  const dailyPlan=[
    {day:0,blockIdx:12,text:'블록13 — 제9편 유지관리(근로시간,노사) + 이슈19(조직문화)'},
    {day:1,blockIdx:13,text:'블록14 — 제9편 유지관리(안전보건,스트레스) + 이슈20(사회적자본)'},
    {day:2,blockIdx:14,text:'블록15 — 제10편 이직관리 + 보완의날'},
    {day:3,blockIdx:0,text:'블록1 — 제1~2편 총론 및 환경변화 + 이슈1,2'},
    {day:4,blockIdx:1,text:'블록2 — 제3편 SHRM + 이슈3'},
    {day:5,blockIdx:2,text:'블록3 — 제4편 직무관리(직무분석,평가) + 이슈4,5'},
    {day:6,blockIdx:3,text:'블록4 — 제4편 직무관리(직무설계) + 이슈17'},
    {day:7,blockIdx:4,text:'블록5 — 제5편 확보관리(인력계획,모집) + 이슈6,7'},
    {day:8,blockIdx:5,text:'블록6 — 제5편 확보관리(선발,선발오류) + 이슈8,9'},
    {day:9,blockIdx:6,text:'블록7 — 제6편 개발관리(교육훈련) + 이슈10'},
    {day:10,blockIdx:7,text:'블록8 — 제6편 개발관리(경력및조직개발) + 이슈11,12'},
    {day:11,blockIdx:8,text:'블록9 — 제7편 평가관리(목적,기법) + 이슈13,14'},
    {day:12,blockIdx:9,text:'블록10 — 제7편 평가관리(평가오류,신뢰성) + 이슈18'},
    {day:13,blockIdx:10,text:'블록11 — 제8편 보상관리(임금수준,체계) + 이슈16'},
    {day:14,blockIdx:11,text:'블록12 — 제8편 보상관리(형태,복리후생) + 이슈15'}
  ];
  const c12=[
    {num:12,days:2,blocksPerDay:7.5,startDate:'2026-08-06'},
    {num:13,days:2,blocksPerDay:7.5,startDate:'2026-08-08'},
    {num:14,days:2,blocksPerDay:7.5,startDate:'2026-08-10'},
    {num:15,days:2,blocksPerDay:7.5,startDate:'2026-08-12'},
    {num:16,days:2,blocksPerDay:7.5,startDate:'2026-08-14'},
  ];
  const c17=['2026-08-16','2026-08-17','2026-08-18','2026-08-19','2026-08-20',
    '2026-08-21','2026-08-22','2026-08-23','2026-08-24','2026-08-25'].map((sd,i)=>({num:17+i,days:1,blocksPerDay:15,startDate:sd}));
  const cycles=[
    {num:1,days:15,blocksPerDay:null,startDate:'2026-05-29',dailyPlan},
    {num:2,days:10,blocksPerDay:1.5,startDate:'2026-06-13'},
    {num:3,days:8,blocksPerDay:2,startDate:'2026-06-23'},
    {num:4,days:6,blocksPerDay:2.5,startDate:'2026-07-01'},
    {num:5,days:6,blocksPerDay:2.5,startDate:'2026-07-07'},
    {num:6,days:5,blocksPerDay:3,startDate:'2026-07-13'},
    {num:7,days:5,blocksPerDay:3,startDate:'2026-07-18'},
    {num:8,days:4,blocksPerDay:3.75,startDate:'2026-07-23'},
    {num:9,days:4,blocksPerDay:3.75,startDate:'2026-07-27'},
    {num:10,days:3,blocksPerDay:5,startDate:'2026-07-31'},
    {num:11,days:3,blocksPerDay:5,startDate:'2026-08-03'},
    ...c12,...c17,
    {num:27,days:4,blocksPerDay:null,startDate:'2026-08-26',label:'최종정돈'},
    {num:28,days:1,blocksPerDay:null,startDate:'2026-08-30',label:'D-1'},
  ];
  saveReviewData('hr_mgmt',{blocks,cycles,version:2});
}
initHrMgmtData();

function initLaborEconData(){
  if(loadReviewData('labor_econ'))return;
  const blocks=[
    "주제1~7 노동공급기초,효용극대화",
    "주제8~13 후방굴절,세금,할증임금",
    "주제14~19 EITC,부의소득세,복지제도",
    "주제20~23 가구생산모형,부가/실망노동자",
    "주제24~28 단/장기노동수요,탄력성",
    "주제29~32 힉스-마샬법칙,준고정비용",
    "주제33~35 노동시장균형,최저임금",
    "주제36~37 조세귀착,법정부가혜택",
    "주제38~40 이민자,기술진보",
    "주제41~42 수요독점기업",
    "코어1~13 총복습",
    "주제43~47 보상적임금격차",
    "주제48~52 인적자본",
    "주제53~57 소득분포",
    "주제58~62 노동이동,차별",
    "주제63~66 노동조합",
    "주제67~70 유인급여",
    "주제71~74 실업",
    "주제75~77 필립스곡선",
    "기타심화 1","기타심화 2","기타심화 3","기타심화 4"
  ].map((name,i)=>({id:'b'+(i+1),name}));
  const nb=23;
  const c12=[
    {num:12,days:2,blocksPerDay:nb/2,startDate:'2026-08-06'},
    {num:13,days:2,blocksPerDay:nb/2,startDate:'2026-08-08'},
    {num:14,days:2,blocksPerDay:nb/2,startDate:'2026-08-10'},
    {num:15,days:2,blocksPerDay:nb/2,startDate:'2026-08-12'},
    {num:16,days:2,blocksPerDay:nb/2,startDate:'2026-08-14'},
  ];
  const c17=['2026-08-16','2026-08-17','2026-08-18','2026-08-19','2026-08-20',
    '2026-08-21','2026-08-22','2026-08-23','2026-08-24','2026-08-25'].map((sd,i)=>({num:17+i,days:1,blocksPerDay:nb,startDate:sd}));
  const cycles=[
    {num:1,days:15,blocksPerDay:nb/15,startDate:'2026-05-29'},
    {num:2,days:10,blocksPerDay:nb/10,startDate:'2026-06-13'},
    {num:3,days:8,blocksPerDay:nb/8,startDate:'2026-06-23'},
    {num:4,days:6,blocksPerDay:nb/6,startDate:'2026-07-01'},
    {num:5,days:6,blocksPerDay:nb/6,startDate:'2026-07-07'},
    {num:6,days:5,blocksPerDay:nb/5,startDate:'2026-07-13'},
    {num:7,days:5,blocksPerDay:nb/5,startDate:'2026-07-18'},
    {num:8,days:4,blocksPerDay:nb/4,startDate:'2026-07-23'},
    {num:9,days:4,blocksPerDay:nb/4,startDate:'2026-07-27'},
    {num:10,days:3,blocksPerDay:nb/3,startDate:'2026-07-31'},
    {num:11,days:3,blocksPerDay:nb/3,startDate:'2026-08-03'},
    ...c12,...c17,
    {num:27,days:4,blocksPerDay:null,startDate:'2026-08-26',label:'최종정돈'},
    {num:28,days:1,blocksPerDay:null,startDate:'2026-08-30',label:'D-1'},
  ];
  saveReviewData('labor_econ',{blocks,cycles});
}
initLaborEconData();

function migrateWeekdayOnly(){
  ['labor_law','admin_law','hr_mgmt','labor_econ'].forEach(sk=>{
    const d=loadReviewData(sk);if(!d)return;
    const c1=d.cycles.find(x=>x.num===1);
    if(c1&&c1.weekdayOnly===undefined){c1.weekdayOnly=true;saveReviewData(sk,d);}
  });
}
migrateWeekdayOnly();

// ── app init (runs after all scripts loaded) ──────────────────────────────────
weeklyGoals=loadWeeklyGoals();
weeklyTextGoals=loadWeeklyTextGoals();
monthlyGoals=loadMonthlyGoals(new Date());
templates=loadTemplates();

if(localStorage.getItem('darkMode')==='1')applyDark(true);
renderDday();
if(isMobile()){
  currentDay=new Date();currentDay.setHours(0,0,0,0);
  currentMonday=getMondayOf(currentDay);
}
blocks=loadWeek(currentMonday);
ensureGoalLinksForWeek();
render();

requestAnimationFrame(()=>{document.getElementById('plannerWrapper').scrollTop=minToY(7*60);});

if(isMobile()){
  document.body.classList.add('goals-m-hidden');
  const _sp=document.getElementById('statsPanel');
  const _sh=document.getElementById('statsHdr');
  if(_sp&&_sh){
    _sp.classList.add('m-collapsed');
    const _stog=document.createElement('span');
    _stog.style.cssText='font-size:11px;color:#9B9A97;margin-left:auto;pointer-events:none;white-space:nowrap';
    _stog.textContent='펼치기 ▼';
    _sh.appendChild(_stog);
    _sh.addEventListener('click',e=>{
      if(e.target===document.getElementById('statsResolutionInline'))return;
      _sp.classList.toggle('m-collapsed');
      const isCol=_sp.classList.contains('m-collapsed');
      _stog.textContent=isCol?'펼치기 ▼':'접기 ▲';
      if(!isCol)renderStats();
      updateStatsPanelTitle();
    });
  }
  const _dg=document.getElementById('ddayGrid');
  const _dgh=document.getElementById('ddayGridHdr');
  if(_dg&&_dgh){
    _dg.classList.add('m-collapsed');
    _dgh.addEventListener('click',()=>{_dg.classList.toggle('m-collapsed');});
  }
  const _wr=document.getElementById('weeklyRetroHdr');
  if(_wr)_wr.style.cursor='pointer';
  const _dr=document.getElementById('dailyRetroHdr');
  if(_dr)_dr.style.cursor='pointer';
}

initAndSync();

async function _pollSync(){
  if(document.hidden)return;
  const{updated,needsPush}=await _loadFromSupabase();
  if(needsPush.length){try{await _sb.from('planner_data').upsert(needsPush,{onConflict:'key'});needsPush.forEach(r=>_setSyncMeta(r.key,r.updated_at));}catch(e){}}
  if(updated){
    weeklyGoals=loadWeeklyGoals();
    weeklyTextGoals=loadWeeklyTextGoals();
    monthlyGoals=loadMonthlyGoals(new Date());
    templates=loadTemplates();
    blocks=loadWeek(currentMonday);
    render();
  }
}
setInterval(_pollSync,30000);
document.addEventListener('visibilitychange',function(){if(!document.hidden)_pollSync();});

if('serviceWorker' in navigator){
  navigator.serviceWorker.getRegistrations().then(regs=>{regs.forEach(r=>r.update());});
  if('caches' in window){caches.keys().then(ns=>ns.forEach(n=>caches.delete(n)));}
  navigator.serviceWorker.register('./sw.js').catch(()=>{});
}
