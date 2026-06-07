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
  let html=`<span class="daily-summary-total">오늘 ${total.toFixed(1)}h (완료 ${done.toFixed(1)}h)</span>`;
  Object.keys(bySubj).forEach(k=>{const s=SUBJECTS[k];html+=`<span class="daily-summary-item"><span class="daily-sum-dot" style="background:${s.color}"></span>${s.short} ${bySubj[k].toFixed(1)}h</span>`;});
  el.innerHTML=html;
}
