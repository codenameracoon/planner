function renderDailyView(){
  currentMonday=getMondayOf(currentDay);blocks=loadWeek(currentMonday);
  document.getElementById('navLabel').textContent=`${currentDay.getMonth()+1}월 ${currentDay.getDate()}일 (${DAYS[dayIdx(currentDay)]})`;
  buildTimeAxis();buildDayCols();renderBlocks();
  document.getElementById('dailySummary').classList.remove('u-hidden');
  renderRoutine();
  requestAnimationFrame(()=>{document.getElementById('plannerWrapper').scrollTop=minToY(7*60);});
}

function renderDailySummary(){
  const el=document.getElementById('dailySummary');
  if(viewMode!=='day'){el.classList.add('u-hidden');return;}
  el.classList.remove('u-hidden');
  const vDay=dayIdx(currentDay);
  const db=blocks.filter(b=>b.day===vDay&&!b.ghost);
  const total=db.reduce((s,b)=>s+(b.endMin-b.startMin)/60,0);
  const done=db.filter(b=>b.completed).reduce((s,b)=>s+(b.endMin-b.startMin)/60,0);
  const bySubj={};
  db.forEach(b=>{const k=SUBJECTS[b.subject]?b.subject:'rest';bySubj[k]=(bySubj[k]||0)+(b.endMin-b.startMin)/60;});
  const retroBody=document.getElementById('dailyRetroBody');
  const isCollapsed=retroBody&&retroBody.style.display==='none';
  let html=`<span class="daily-summary-total">오늘 ${total.toFixed(1)}h (완료 ${done.toFixed(1)}h)</span><button class="daily-retro-link" id="dailyRetroLnk">${isCollapsed?'펼치기 ▼':'접기 ▲'}</button>`;
  Object.keys(bySubj).forEach(k=>{const s=SUBJECTS[k];html+=`<span class="daily-summary-item"><span class="daily-sum-dot" style="background:${s.color}"></span>${s.short} ${bySubj[k].toFixed(1)}h</span>`;});
  el.innerHTML=html;
  el.querySelector('#dailyRetroLnk').onclick=()=>{
    const body=document.getElementById('dailyRetroBody');
    const collapsed=body.style.display==='none';
    body.style.display=collapsed?'':'none';
    el.querySelector('#dailyRetroLnk').textContent=collapsed?'접기 ▲':'펼치기 ▼';
  };
}
