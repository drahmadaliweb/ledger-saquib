(()=>{
 if(location.protocol!=='https:'||!/(^|\.)chase\.com$/i.test(location.hostname))return {error:'Open Chase’s signed-in offers page first.'};
 const selectors='[data-testid="commerce-tile"],[data-cy="commerce-tile"],[data-locator-id="merchantOffer"],.sixersoffers__container,[data-offer-id],[data-testid="offer-card"],[data-testid="merchant-offer-card"]';
 const roots=[document],candidates=[];let visited=0;
 for(let i=0;i<roots.length&&visited<30000;i++){
  const root=roots[i];candidates.push(...root.querySelectorAll(selectors));
  for(const el of root.querySelectorAll('*')){if(++visited>30000)break;if(el.shadowRoot)roots.push(el.shadowRoot);}
 }
 const shown=el=>el.getClientRects().length>0&&!el.closest('[hidden],[aria-hidden="true"]');
 const offers=[],seen=new Set();
 for(const el of [...new Set(candidates)].slice(0,500)){
  if(!shown(el)||el.querySelector(selectors))continue;
  const ownRoots=[el];for(let i=0;i<ownRoots.length&&i<50;i++)for(const node of ownRoots[i].querySelectorAll('*'))if(node.shadowRoot)ownRoots.push(node.shadowRoot);
  const texts=ownRoots.map(r=>r.innerText||r.textContent||'');let merchant=el.getAttribute('data-merchant-name')||'';
  for(const r of ownRoots){if(!merchant){const name=r.querySelector('[data-merchant-name],h2,h3,h4,[class*="merchant-name"],[class*="merchantName"],[class*="brand-name"]');merchant=name?.getAttribute('data-merchant-name')||name?.innerText||name?.textContent||'';}
   if(!merchant){const image=r.querySelector('img[alt]');merchant=image?.alt||'';}
   for(const label of r.querySelectorAll('[aria-label]')){const text=label.getAttribute('aria-label')||'';if(/\b(?:added to card|add to card|add offer|offer activated)\b/i.test(text))texts.push(text);}
  }
  if(!merchant)merchant=el.getAttribute('aria-label')||ownRoots.map(r=>r.querySelector('a[aria-label]')?.getAttribute('aria-label')).find(Boolean)||'';
  const parsed=LedgerChaseParser.parse([...new Set(texts)].join('\n'),merchant,el.getAttribute('data-offer-id')||'');
  if(!parsed.unit&&!parsed.merchant)continue;
  const key=JSON.stringify([parsed.sourceId,parsed.merchant,parsed.unit,parsed.value,parsed.to,parsed.text]);if(seen.has(key))continue;seen.add(key);offers.push(parsed);
 }
 return {offers,scanLimitReached:visited>=30000,message:offers.length?'Read loaded offer tiles only. Hidden, unloaded and other-card offers are not included.':'No supported offer tiles were found. Open the full Chase Offers page for one card, wait for it to load, and expand/scroll to load more. This Chase layout may need support.'};
})();
