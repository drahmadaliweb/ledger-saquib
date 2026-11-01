/* Local text parsing only. No bank API calls, credentials, clicks or activation. */
(()=>{
 const clean=s=>String(s||'').replace(/\u00a0/g,' ').replace(/[ \t]+/g,' ').trim();
 const num=s=>Number(String(s).replace(/,/g,''));
 function dateISO(y,m,d){const v=new Date(Date.UTC(+y,+m-1,+d));return v.getUTCFullYear()===+y&&v.getUTCMonth()===+m-1&&v.getUTCDate()===+d?`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`:'';}
 function expiration(text,now=new Date()){
  let m=text.match(/(?:expires?|expiration|valid (?:through|until)|offer ends?)(?:\s+(?:on|date))?\s*[:\-]?\s*(\d{4})-(\d{2})-(\d{2})/i);if(m)return {date:dateISO(m[1],m[2],m[3]),estimated:false};
  m=text.match(/(?:expires?|expiration|valid (?:through|until)|offer ends?)(?:\s+(?:on|date))?\s*[:\-]?\s*(\d{1,2})\/(\d{1,2})\/(\d{4}|\d{2})\b/i);if(m)return {date:dateISO(m[3].length===2?'20'+m[3]:m[3],m[1],m[2]),estimated:false};
  m=text.match(/(?:expires?|expiration|valid (?:through|until)|offer ends?)(?:\s+(?:on|date))?\s*[:\-]?\s*([A-Za-z]+)\.?\s+(\d{1,2}),?\s+(\d{4})/i);
  if(m){const month=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'].indexOf(m[1].slice(0,3).toLowerCase())+1;return {date:month?dateISO(m[3],month,m[2]):'',estimated:false};}
  m=text.match(/\b(\d{1,3}) days? left\b/i);let days=m?+m[1]:/\b(?:last day|expires today)\b/i.test(text)?0:null;
  if(days!==null){const d=new Date(now);d.setDate(d.getDate()+days);return {date:dateISO(d.getFullYear(),d.getMonth()+1,d.getDate()),estimated:true};}return {date:'',estimated:false};
 }
 function parse(raw,merchant='',sourceId='',now=new Date()){
  const text=clean(raw).replace(/\b(?:\d[ -]?){12,19}\b/g,'[number removed]').slice(0,6000),warnings=[];
  let m=text.match(/(\d+(?:\.\d+)?)\s*%\s*(?:cash\s*)?back\b/i),unit='',value=null;
  if(m){unit='percent';value=num(m[1]);}else{m=text.match(/\$\s*([\d,]+(?:\.\d{1,2})?)\s*(?:cash\s*)?back\b/i);if(m){unit='cash';value=num(m[1]);}}
  if(!(value>0)||unit==='percent'&&value>100){unit='';value=null;warnings.push('Reward rate not read');}
  const minimumMatch=text.match(/(?:spend(?:ing)?|minimum(?:\s+(?:spend|purchase|of))?|purchases?\s+of)\s*(?:at least\s*)?\$\s*([\d,]+(?:\.\d{1,2})?)/i)||text.match(/\$\s*([\d,]+(?:\.\d{1,2})?)\s+or more/i);
  const capMatch=text.match(/(?:maximum(?:\s+(?:cash\s*back|reward|statement credit))?(?:\s+of)?|cash\s*back\s+maximum(?:\s+of)?|up to a maximum(?:\s+of)?|capped at|cap(?:\s+of)?)\s*[:\-]?\s*\$\s*([\d,]+(?:\.\d{1,2})?)/i);
  const end=expiration(text,now),minimum=minimumMatch?num(minimumMatch[1]):null,cap=capMatch?num(capMatch[1]):null;
  const mode=/\b(?:multiple transactions|combined purchases|cumulative|one or more purchases|one or more transactions)\b/i.test(text)?'combined':/\b(?:single purchase|single transaction|one transaction|one purchase)\b/i.test(text)?'single':'unknown';
  const activation=/\b(?:added to (?:your )?card|offer added|offer activated|already added)\b/i.test(text)?'added':/\b(?:add (?:offer|to card)|activate offer)\b/i.test(text)?'not-added':'unknown';
  merchant=clean(merchant).replace(/\s+(?:Add to card|Added to card|Add Offer|View (?:offer|details))\s*$/i,'').replace(/^(?:View (?:offer|details)(?: for)?|Offer from)\s+/i,'').split(/\b(?:earn|get|receive)\s+(?=\d|\$)|\b\d+(?:\.\d+)?%\s*(?:cash\s*)?back/i)[0].trim().slice(0,100);
  if(!merchant||/^(?:Chase Offers|Offers Wallet|Available offers|Added offers)$/i.test(merchant))warnings.push('Merchant not read');
  if(minimum===null)warnings.push('Minimum spend not read');if(cap===null)warnings.push('Cashback cap not read');if(mode==='unknown')warnings.push('Single/combined spend rule not read');if(!end.date)warnings.push('Expiry not read');if(end.estimated)warnings.push('Expiry estimated from days left');if(activation==='unknown')warnings.push('Activation not verified');if(/\bup to\s+\d+(?:\.\d+)?%/i.test(text))warnings.push('Tiered/up-to rate: review conditions');
  return {merchant,unit,value,minimum,cap,minimumMode:mode,to:end.date,activation,sourceId:String(sourceId||'').replace(/[^A-Za-z0-9_.:\-]/g,'').slice(0,100),text,warnings};
 }
 globalThis.LedgerChaseParser={parse,expiration};
})();
