/* Daily Ledger usability refresh: responsive navigation, dashboard signals and transaction shortcuts. */
(()=>{
  'use strict';
  if(window.__ledgerModernizeLoaded)return;
  window.__ledgerModernizeLoaded=true;
  const $=id=>document.getElementById(id);
  const hasCore=()=>typeof data!=='undefined'&&typeof extra!=='undefined'&&typeof page==='function';
  const css=`
  .ledger-nav-shell{position:sticky;top:0;z-index:28;background:var(--paper,#f4f5f2);background:color-mix(in srgb,var(--paper,#f4f5f2) 92%,transparent);backdrop-filter:blur(12px);padding:2px 0 5px}
  .ledger-nav-shell>.tabs{position:relative!important;top:auto!important;overflow:visible!important}
  .ledger-more-trigger,.ledger-more-menu{display:none!important}
  .ledger-pulse{margin:0 0 18px}.ledger-pulse-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
  .ledger-pulse-stat{min-width:0;padding:15px;border:1px solid var(--line,#e5e7e2);border-radius:12px;background:var(--surface-2,#fbfbf9)}
  .ledger-pulse-stat span,.ledger-pulse-eyebrow{display:block;color:var(--muted,#707a74);font-size:11px;letter-spacing:.1em;text-transform:uppercase;font-weight:650}
  .ledger-pulse-stat strong{display:block;margin-top:5px;font-size:21px;font-family:"Space Grotesk",sans-serif;overflow-wrap:anywhere}
  .ledger-pulse-note{font-size:13px;color:var(--muted,#707a74);line-height:1.5;margin:12px 0 0}
  .ledger-insight{margin-top:12px;padding:12px 14px;border-left:3px solid var(--emerald,#2e6e5c);border-radius:0 9px 9px 0;background:var(--surface-2,#fbfbf9);font-size:13px;line-height:1.5}
  .ledger-insight.up{border-color:var(--danger,#b4452f)}.ledger-insight.down{border-color:var(--income,#438471)}
  .ledger-pulse-bottom{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:14px;margin-top:14px}
  .ledger-mini-chart{display:flex;align-items:flex-end;gap:10px;height:92px;margin-top:13px;padding:0 3px}
  .ledger-mini-bar{flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;gap:5px}
  .ledger-mini-bar i{display:block;width:min(100%,30px);min-height:3px;border-radius:6px 6px 2px 2px;background:var(--emerald,#2e6e5c)}
  .ledger-mini-bar small{font-size:10px;color:var(--muted,#707a74);white-space:nowrap}.ledger-mini-bar b{font-size:9px;color:var(--muted,#707a74);font-weight:500}
  .ledger-action-list{display:grid;gap:8px;margin-top:10px}.ledger-action{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;padding:9px 0;border-bottom:1px solid var(--line,#e5e7e2);font-size:13px}
  .ledger-action:last-child{border-bottom:0}.ledger-action button{flex:none;padding:5px 9px;font-size:11px}
  .ledger-dashboard-actions{display:flex;flex-wrap:wrap;gap:10px}.ledger-dashboard-actions button{width:auto!important}
  .ledger-quick-ranges{display:flex;gap:7px;flex-wrap:wrap;margin:8px 0 13px}.ledger-quick-ranges button{padding:7px 11px;font-size:12px}
  .ledger-quick-ranges button[aria-pressed=true]{background:var(--emerald,#2e6e5c);color:#fff;border-color:var(--emerald,#2e6e5c)}
  .ledger-month-caption{font-size:12px;color:var(--muted,#707a74);margin:0 0 10px}
  .ledger-month-group td{padding:12px 10px!important;background:var(--surface-2,#fbfbf9);border-bottom:1px solid var(--line,#e5e7e2);color:var(--muted,#707a74);font-size:12px}
  .ledger-month-group td span:last-child{float:right;text-align:right}
  .ledger-budget-state{display:inline-flex;align-items:center;margin-left:8px;padding:3px 8px;border-radius:99px;background:#edf0e9;color:var(--muted,#707a74);font-size:11px;font-weight:600}
  .budget-item[data-ledger-level=watch] .ledger-budget-state{background:#fff1d9;color:#875b11}
  .budget-item[data-ledger-level=over] .ledger-budget-state{background:#f7e2dd;color:var(--danger,#b4452f)}
  .budget-item progress[data-ledger-level=watch]::-webkit-progress-value{background:#c58c25}
  .budget-item progress[data-ledger-level=over]::-webkit-progress-value{background:var(--danger,#b4452f)}
  .budget-item progress[data-ledger-level=watch]::-moz-progress-bar{background:#c58c25}
  .budget-item progress[data-ledger-level=over]::-moz-progress-bar{background:var(--danger,#b4452f)}
  #customReportBuilder .cr-catgrid{grid-template-columns:repeat(auto-fit,minmax(min(100%,190px),1fr));align-items:start}
  #crReportOutput .cr-report-header button{min-width:130px}
  #ledgerCloudBar{box-shadow:0 3px 14px #19211f0a}
  @media(max-width:720px){
    .ledger-nav-shell{padding:0 0 5px}.ledger-nav-shell>.tabs{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr));gap:3px;overflow:visible!important}
    .ledger-nav-shell>.tabs button[data-ledger-secondary=true]{display:none!important}
    .ledger-nav-shell .ledger-more-trigger{display:block!important;min-width:0;padding:10px 4px!important;font-size:12px!important}
    .ledger-more-menu{display:none;position:absolute!important;top:calc(100% + 5px);right:0;left:auto;z-index:40;width:min(280px,calc(100vw - 24px));padding:7px;background:var(--surface,#fff);border:1px solid var(--line,#e5e7e2);border-radius:13px;box-shadow:0 12px 34px #19211f24}
    .ledger-more-menu.open{display:grid!important;gap:3px}.ledger-more-menu button{width:100%;text-align:left;background:transparent!important;color:var(--ink,#19211f)!important;border:0;padding:11px 12px!important}
    .ledger-more-menu button.active{background:var(--emerald-soft,#e4efe9)!important;color:var(--emerald-deep,#245746)!important}
    .ledger-pulse-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.ledger-pulse-bottom{grid-template-columns:1fr}
    .ledger-dashboard-actions{margin-top:12px}.ledger-dashboard-actions button{flex:1}
    #view-spending .table-scroll{overflow:visible}
    #view-spending .table-scroll>table{display:block;width:100%;min-width:0}
    #view-spending .table-scroll>table thead{display:none}
    #view-spending .table-scroll>table tbody#rows{display:grid;gap:9px}
    #view-spending #rows tr.tx-row{display:grid;grid-template-columns:minmax(0,1fr) auto;grid-template-rows:auto auto auto auto;gap:0;background:var(--surface,#fff);border:1px solid var(--line,#e5e7e2);border-radius:12px;box-shadow:0 2px 8px #19211f08;overflow:hidden}
    #view-spending #rows tr.tx-row td{display:block;border:0;padding:5px 10px;min-width:0;overflow-wrap:anywhere}
    #view-spending #rows tr.tx-row td:nth-child(1){grid-column:1;grid-row:1;color:var(--muted,#707a74);font-size:12px}
    #view-spending #rows tr.tx-row td:nth-child(2){grid-column:1;grid-row:2}
    #view-spending #rows tr.tx-row td:nth-child(3){grid-column:1/-1;grid-row:3;font-weight:600}
    #view-spending #rows tr.tx-row td:nth-child(4){grid-column:1;grid-row:4;color:var(--muted,#707a74);font-size:12px}
    #view-spending #rows tr.tx-row td:nth-child(4):before{content:"Account · ";font-weight:600;color:var(--muted,#707a74)}
    #view-spending #rows tr.tx-row td:nth-child(5){grid-column:2;grid-row:1/3;align-self:center;white-space:nowrap;font-size:16px}
    #view-spending #rows tr.tx-row td:nth-child(6){grid-column:2;grid-row:4;justify-self:end}
    #view-spending #rows tr.tx-detail{display:block;background:var(--surface,#fff);border:1px solid var(--line,#e5e7e2);border-radius:10px;margin-top:-7px}
    #view-spending #rows tr.tx-detail>td{display:block;padding:10px}
    #view-spending #rows tr.ledger-month-group{display:block;background:transparent;border:0;box-shadow:none;margin-top:4px}
    #view-spending #rows tr.ledger-month-group td{display:flex;justify-content:space-between;gap:8px;align-items:flex-end;padding:8px 2px!important;background:transparent;font-size:11px}
  }
  @media(max-width:430px){.ledger-pulse-grid{grid-template-columns:1fr 1fr}.ledger-pulse-stat{padding:12px}.ledger-pulse-stat strong{font-size:18px}.ledger-quick-ranges button{flex:1}}
  `;
  function localISO(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
  function monthISO(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;}
  function safeText(s){return typeof escapeHtml==='function'?escapeHtml(String(s??'')):String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function usdSpend(list){return list.filter(t=>t.kind==='expense'&&!t.forPerson).reduce((sum,t)=>sum+(typeof netAmtUSD==='function'?netAmtUSD(t):Number(t.a||0)),0);}
  function monthStart(offset){const n=new Date();return new Date(n.getFullYear(),n.getMonth()+offset,1);}
  function spendForMonth(mk){return usdSpend(data.filter(t=>String(t.d||'').startsWith(mk)));}
  function categorySpend(mk){const out={};data.filter(t=>t.kind==='expense'&&!t.forPerson&&String(t.d||'').startsWith(mk)).forEach(t=>{const c=t.c||'Uncategorized';out[c]=(out[c]||0)+(typeof netAmtUSD==='function'?netAmtUSD(t):Number(t.a||0));});return out;}
  function pulseHTML(){
    const now=new Date(),today=localISO(now),mk=monthISO(now),day=now.getDate(),days=new Date(now.getFullYear(),now.getMonth()+1,0).getDate();
    const monthRows=data.filter(t=>String(t.d||'').startsWith(mk));
    const spending=usdSpend(monthRows),income=monthRows.filter(t=>t.kind==='income').reduce((s,t)=>s+(typeof amtUSD==='function'?amtUSD(t):Number(t.a||0)),0);
    const budgetMap=extra.budgets||{},budgetTotal=Object.values(budgetMap).reduce((s,x)=>s+Number(x||0),0),currentCats=categorySpend(mk),budgetedSpend=Object.entries(budgetMap).reduce((s,[c])=>s+(currentCats[c]||0),0),remaining=budgetTotal-budgetedSpend;
    const prior=Array.from({length:3},(_,i)=>monthStart(-(i+1))).map(d=>monthISO(d));
    const baseline=prior.reduce((s,m)=>s+spendForMonth(m),0)/3,projected=spending/Math.max(day,1)*days,delta=projected-baseline,change=baseline?delta/baseline*100:0;
    const significant=baseline>0&&Math.abs(change)>=15&&Math.abs(delta)>=50;
    const allCats={};prior.forEach(m=>{const mCats=categorySpend(m);Object.entries(mCats).forEach(([c,v])=>allCats[c]=(allCats[c]||0)+v/3);});
    const categoryFlags=Object.entries(allCats).map(([c,avg])=>{const pace=(currentCats[c]||0)/Math.max(day,1)*days,diff=pace-avg,pct=avg?diff/avg*100:0;return{c,avg,pace,diff,pct};}).filter(x=>x.avg>0&&Math.abs(x.pct)>=15&&Math.abs(x.diff)>=50).sort((a,b)=>Math.abs(b.diff)-Math.abs(a.diff)).slice(0,3);
    const bills=Array.isArray(extra.bills)?extra.bills:[],soon=bills.filter(b=>b.d&&b.d>=today&&b.d<=localISO(new Date(now.getFullYear(),now.getMonth(),now.getDate()+7))),overdue=bills.filter(b=>b.d&&b.d<today);
    const nearBudgets=Object.entries(budgetMap).map(([c,limit])=>{const spent=currentCats[c]||0,ratio=Number(limit)>0?spent/Number(limit):0;return{c,spent,limit:Number(limit),ratio};}).filter(x=>x.ratio>=.8).sort((a,b)=>b.ratio-a.ratio);
    const uncategorized=monthRows.filter(t=>t.kind==='expense'&&!t.forPerson&&(!String(t.c||'').trim()||String(t.c).toLowerCase()==='uncategorized')).length;
    const flags=[];
    if(overdue.length)flags.push({text:`${overdue.length} bill${overdue.length===1?' is':'s are'} overdue.`,go:'budgets',action:'Review bills'});
    if(soon.length)flags.push({text:`${soon.length} bill${soon.length===1?' is':'s are'} due in the next 7 days.`,go:'budgets',action:'View bills'});
    if(nearBudgets.length){const x=nearBudgets[0];flags.push({text:`${x.c} is at ${Math.round(x.ratio*100)}% of its monthly limit.`,go:'budgets',action:'Review budgets'});}
    if(uncategorized)flags.push({text:`${uncategorized} expense${uncategorized===1?' needs':'s need'} a category.`,go:'spending',action:'Review transactions'});
    const sync=$('ledgerCloudStatus');if(sync&&(/failed|newer|updated on another/i.test(sync.textContent)))flags.push({text:`Cloud sync needs attention: ${sync.textContent}`,go:'settings',action:'Check sync'});
    const insight=significant?`Projected spending is ${delta>0?'above':'below'} the previous three-month average by ${fmt(Math.abs(delta))} (${Math.abs(change).toFixed(1)}%). This alert requires both a 15% and $50 change.`:`No total spending change has crossed both thresholds (15% and $50) versus the previous three-month average.`;
    const categoryInsight=categoryFlags.map(x=>`${safeText(x.c)} ${x.diff>0?'is pacing above':'is pacing below'} its prior-three-month average by ${fmt(Math.abs(x.diff))} (${Math.abs(x.pct).toFixed(1)}%).`).join(' ');
    const history=Array.from({length:6},(_,i)=>monthStart(i-5)).map(d=>({m:monthISO(d),label:d.toLocaleDateString(undefined,{month:'short'}),v:spendForMonth(monthISO(d))})),max=Math.max(1,...history.map(x=>x.v));
    const bars=history.map(x=>`<div class="ledger-mini-bar" title="${safeText(x.m)} · ${fmt(x.v)}"><i style="height:${Math.max(4,x.v/max*62)}px"></i><small>${safeText(x.label)}</small><b>${fmt(x.v)}</b></div>`).join('');
    const actions=flags.slice(0,4).map(x=>`<div class="ledger-action"><span>${safeText(x.text)}</span><button type="button" class="btn-ghost" data-ledger-go="${x.go}">${x.action}</button></div>`).join('')||'<p class="ledger-pulse-note">You’re all caught up. No bills, budgets, or uncategorized expenses need attention.</p>';
    const top=Object.entries(currentCats).sort((a,b)=>b[1]-a[1])[0];
    return `<section class="card ledger-pulse" id="ledgerPulse"><div class="card-h"><h2>This month at a glance</h2><span class="acct-meta">${safeText(now.toLocaleDateString(undefined,{month:'long',year:'numeric'}))} · ${day} of ${days} days</span></div><div class="card-b"><div class="ledger-pulse-grid"><div class="ledger-pulse-stat"><span>Spending so far</span><strong>${fmt(spending)}</strong></div><div class="ledger-pulse-stat"><span>Income so far</span><strong>${fmt(income)}</strong></div><div class="ledger-pulse-stat"><span>Net cash flow</span><strong>${fmt(income-spending)}</strong></div></div><div class="ledger-insight ${significant?(delta>0?'up':'down'):''}">${insight}${top?` Largest category so far: <b>${safeText(top[0])}</b> (${fmt(top[1])}).`:''}</div>${categoryInsight?`<div class="ledger-insight">Category changes: ${categoryInsight}</div>`:''}<p class="ledger-pulse-note">End-of-month estimate: ${fmt(projected)} at the current daily pace · previous 3-month average: ${fmt(baseline)}. Estimate only; linked refunds follow the ledger’s net-spending rules.</p><div class="ledger-pulse-bottom"><div><div class="ledger-pulse-eyebrow">Six-month spending trend</div><div class="ledger-mini-chart" role="img" aria-label="Monthly spending for the last six months">${bars}</div></div><div><div class="ledger-pulse-eyebrow">Needs attention</div><div class="ledger-action-list">${actions}</div></div></div>${budgetTotal?`<p class="ledger-pulse-note">Monthly category budgets: ${remaining>=0?fmt(remaining)+' remaining':fmt(-remaining)+' over'} of ${fmt(budgetTotal)} total spend in budgeted categories.</p>`:''}</div></section>`;
  }
  function enhanceHero(){
    const hero=document.querySelector('#overviewBody .hero');if(!hero||hero.querySelector('.ledger-dashboard-actions'))return;
    const old=hero.querySelector('button');if(!old)return;
    const actions=document.createElement('div');actions.className='ledger-dashboard-actions';old.replaceWith(actions);actions.appendChild(old);
    const ai=document.createElement('button');ai.type='button';ai.className='btn-ghost';ai.textContent='AI Import';ai.setAttribute('aria-label','Import transactions from a receipt or statement image');
    ai.addEventListener('click',()=>page('ai'));actions.appendChild(ai);
  }
  function enhanceOverview(){
    const body=$('overviewBody');if(!body)return;
    enhanceHero();
    let pulse=$('ledgerPulse');if(!pulse){const hero=body.querySelector('.hero');if(hero)hero.insertAdjacentHTML('afterend',pulseHTML());else body.insertAdjacentHTML('afterbegin',pulseHTML());}else{const temp=document.createElement('div');temp.innerHTML=pulseHTML();pulse.replaceWith(temp.firstElementChild);}
  }
  function updateStatsForCalendar(){
    const stats=$('stats');if(!stats||!hasCore())return;
    const now=new Date(),cur=monthISO(now),prev=monthISO(new Date(now.getFullYear(),now.getMonth()-1,1)),prev3=Array.from({length:3},(_,i)=>monthISO(monthStart(-(i+1))));
    const byMonth=m=>spendForMonth(m),curSpend=byMonth(cur),prevSpend=byMonth(prev),avg=prev3.reduce((s,m)=>s+byMonth(m),0)/3;
    const inc=data.filter(t=>t.kind==='income'&&String(t.d||'').startsWith(cur)).reduce((s,t)=>s+(typeof amtUSD==='function'?amtUSD(t):Number(t.a||0)),0);
    const cards=stats.querySelectorAll('.stat');if(cards.length<4)return;
    const values=[['This month',curSpend],['Previous month',prevSpend],['Previous 3-month avg',avg],['Income this month',inc]];
    cards.forEach((card,i)=>{const k=card.querySelector('.k'),v=card.querySelector('.v');if(k&&v&&values[i]){k.textContent=values[i][0];v.textContent=fmt(values[i][1]);}});
  }
  function buildMobileNav(){
    const tabs=document.querySelector('.tabs');if(!tabs)return;
    let shell=tabs.closest('.ledger-nav-shell');if(!shell){shell=document.createElement('div');shell.className='ledger-nav-shell';tabs.parentNode.insertBefore(shell,tabs);shell.appendChild(tabs);}
    const primary=new Set(['overview','spending','accounts']);
    [...tabs.querySelectorAll('button[data-view]')].forEach(b=>{b.dataset.ledgerSecondary=String(!primary.has(b.dataset.view));});
    let trigger=tabs.querySelector('.ledger-more-trigger');if(!trigger){trigger=document.createElement('button');trigger.type='button';trigger.className='ledger-more-trigger btn-ghost';trigger.textContent='More ▾';trigger.setAttribute('aria-expanded','false');tabs.appendChild(trigger);}
    let menu=shell.querySelector('.ledger-more-menu');if(!menu){menu=document.createElement('div');menu.className='ledger-more-menu';menu.setAttribute('role','menu');shell.appendChild(menu);}
    const secondary=[...tabs.querySelectorAll('button[data-view][data-ledger-secondary="true"]')];
    const routeSig=secondary.map(b=>`${b.dataset.view}:${b.textContent.trim()}`).join('|');
    if(menu.dataset.routes!==routeSig){menu.innerHTML=secondary.map(b=>`<button type="button" role="menuitem" data-more-view="${safeText(b.dataset.view)}">${safeText(b.textContent.trim())}</button>`).join('');menu.dataset.routes=routeSig;}
    const sync=()=>{const current=tabs.querySelector('button[data-view].active')?.dataset.view||'';const activeSecondary=secondary.some(b=>b.dataset.view===current);trigger.textContent=activeSecondary?'More · '+(tabs.querySelector(`button[data-view="${current}"]`)?.textContent.trim()||'')+' ▾':'More ▾';trigger.classList.toggle('active',activeSecondary);trigger.setAttribute('aria-expanded',String(menu.classList.contains('open')));menu.querySelectorAll('[data-more-view]').forEach(b=>b.classList.toggle('active',b.dataset.moreView===current));};
    if(!trigger.__ledgerBound){trigger.__ledgerBound=true;trigger.addEventListener('click',()=>{menu.classList.toggle('open');sync();});menu.addEventListener('click',e=>{const b=e.target.closest('[data-more-view]');if(!b)return;page(b.dataset.moreView);menu.classList.remove('open');setTimeout(sync,0);});document.addEventListener('click',e=>{if(!shell.contains(e.target)){menu.classList.remove('open');sync();}});document.addEventListener('keydown',e=>{if(e.key==='Escape'){menu.classList.remove('open');sync();}});tabs.addEventListener('click',()=>setTimeout(sync,0));}
    sync();
  }
  function addDateShortcuts(){
    const search=$('search'),from=$('fromDate'),to=$('toDate'),bar=search?.closest('.controls');if(!bar||!from||!to||$('ledgerDateShortcuts'))return;
    const box=document.createElement('div');box.id='ledgerDateShortcuts';box.className='ledger-quick-ranges';box.innerHTML='<button type="button" class="btn-ghost" data-range="current" aria-pressed="false">This month</button><button type="button" class="btn-ghost" data-range="previous" aria-pressed="false">Last month</button><button type="button" class="btn-ghost" data-range="90" aria-pressed="false">Last 90 days</button><button type="button" class="btn-ghost" data-range="all" aria-pressed="true">All time</button>';
    const caption=document.createElement('p');caption.className='ledger-month-caption';caption.id='ledgerMonthCaption';
    bar.insertAdjacentElement('afterend',box);box.insertAdjacentElement('afterend',caption);
    box.addEventListener('click',e=>{const b=e.target.closest('[data-range]');if(!b)return;const now=new Date();let start='',end='';if(b.dataset.range==='current'){start=localISO(new Date(now.getFullYear(),now.getMonth(),1));end=localISO(now);}else if(b.dataset.range==='previous'){start=localISO(new Date(now.getFullYear(),now.getMonth()-1,1));end=localISO(new Date(now.getFullYear(),now.getMonth(),0));}else if(b.dataset.range==='90'){const d=new Date(now.getFullYear(),now.getMonth(),now.getDate()-89);start=localISO(d);end=localISO(now);}if($('fltMonth'))$('fltMonth').value='';try{showAll=true;}catch{}from.value=start;to.value=end;box.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));if(typeof renderTable==='function')renderTable();updateCaption();});
    [from,to,$('fltMonth'),$('fltKind'),$('fltCat'),$('fltAcct'),$('search')].filter(Boolean).forEach(x=>x.addEventListener(x===search?'input':'change',()=>{if(x===from||x===to)box.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed','false'));updateCaption();}));
    function updateCaption(){if(!caption)return;const count=$('rows')?.querySelectorAll('tr.tx-row').length||0;const a=from.value,b=to.value;caption.textContent=`${a||b?`${a||'Earliest'} to ${b||'Latest'}`:'All dates'} · ${count} transactions shown`;}
    box.__updateCaption=updateCaption;updateCaption();
  }
  function updateBudgetAndBills(){
    document.querySelectorAll('#budgetList .budget-item').forEach(item=>{const progress=item.querySelector('progress');if(!progress)return;const ratio=Number(progress.value||0)/Math.max(1,Number(progress.max||1)),level=ratio>=1?'over':ratio>=.8?'watch':'ok';progress.dataset.ledgerLevel=level;item.dataset.ledgerLevel=level;let tag=item.querySelector('.ledger-budget-state');if(!tag){tag=document.createElement('span');tag.className='ledger-budget-state';item.querySelector('.bar-top')?.appendChild(tag);}if(tag)tag.textContent=level==='over'?'Over limit':level==='watch'?'Near limit':'On track';});
    const list=$('billList');if(list&&Array.isArray(extra.bills)){const rows=[...list.querySelectorAll('.acct-row')],paired=extra.bills.map((bill,i)=>({bill,row:rows[i]})).filter(x=>x.row);paired.sort((a,b)=>String(a.bill.d||'').localeCompare(String(b.bill.d||'')));paired.forEach(({bill,row})=>{const meta=row.querySelector('.acct-meta');if(meta){let badge=meta.querySelector('.ledger-due-state');if(!badge){badge=document.createElement('span');badge.className='ledger-due-state ledger-budget-state';meta.append(' · ',badge);}const today=localISO(new Date()),gap=Math.round((new Date(`${bill.d}T12:00:00`)-new Date(`${today}T12:00:00`))/86400000);badge.textContent=gap<0?'Overdue':gap===0?'Due today':gap<=7?`Due in ${gap} day${gap===1?'':'s'}`:'Upcoming';}list.appendChild(row);});}
  }
  function addMonthGroups(){
    const tbody=$('rows'),sort=$('sortBy');if(!tbody||!sort||sort.value.split('-')[0]!=='date')return;
    const rows=typeof getFiltered==='function'?getFiltered():[];if(!rows.length)return;
    let previous='';
    rows.forEach(t=>{const key=String(t.d||'').slice(0,7);if(!key||key===previous)return;previous=key;const matching=rows.filter(x=>String(x.d||'').startsWith(key)),spend=usdSpend(matching),income=matching.filter(x=>x.kind==='income').reduce((s,x)=>s+(typeof amtUSD==='function'?amtUSD(x):Number(x.a||0)),0);const first=tbody.querySelector(`tr.tx-row[data-row="${CSS.escape(String(t.id))}"]`);if(!first)return;const row=document.createElement('tr');row.className='ledger-month-group';row.innerHTML=`<td colspan="6"><span>${safeText(new Date(`${key}-01T12:00:00`).toLocaleDateString(undefined,{month:'long',year:'numeric'}))}</span><span>${matching.length} entries · spending ${fmt(spend)} · income ${fmt(income)}</span></td>`;first.before(row);});
  }
  function wrapRenderers(){
    if(typeof renderStats==='function'&&!renderStats.__ledgerModernized){const base=renderStats;const next=function(...args){const out=base.apply(this,args);updateStatsForCalendar();return out;};next.__ledgerModernized=true;renderStats=next;}
    if(typeof renderExtra==='function'&&!renderExtra.__ledgerModernized){const base=renderExtra;const next=function(...args){const out=base.apply(this,args);enhanceOverview();updateBudgetAndBills();return out;};next.__ledgerModernized=true;renderExtra=next;}
    if(typeof renderTable==='function'&&!renderTable.__ledgerModernized){const base=renderTable;const next=function(...args){const out=base.apply(this,args);addMonthGroups();const box=$('ledgerDateShortcuts');box?.__updateCaption?.();return out;};next.__ledgerModernized=true;renderTable=next;}
  }
  function mount(){
    if(!document.querySelector('.wrap')||!document.querySelector('.tabs')||!hasCore())return false;
    if(!document.getElementById('ledgerModernizeStyle')){const s=document.createElement('style');s.id='ledgerModernizeStyle';s.textContent=css;document.head.appendChild(s);}
    wrapRenderers();buildMobileNav();addDateShortcuts();
    updateStatsForCalendar();enhanceOverview();updateBudgetAndBills();
    return true;
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{mount();}, {once:true});
  let tries=0;const timer=setInterval(()=>{tries++;if(mount()||tries>240)clearInterval(timer);},250);
  const observer=new MutationObserver(()=>{if(document.querySelector('.tabs button[data-view="ai"]'))buildMobileNav();if($('overviewBody')){wrapRenderers();addDateShortcuts();}});
  observer.observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(()=>observer.disconnect(),60000);
  document.addEventListener('click',e=>{const b=e.target.closest('[data-ledger-go]');if(b)page(b.dataset.ledgerGo);});
})();
