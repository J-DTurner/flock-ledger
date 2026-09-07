/* Flock Ledger domain model. No network, no UI, no dependencies. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.FlockMath = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const DAY = 86400000;
  const isNum = v => typeof v === 'number' && Number.isFinite(v);
  const sum = xs => xs.reduce((a, x) => a + (isNum(x) ? x : 0), 0);
  function validDate(s) {
    if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
    const d = new Date(s + 'T00:00:00Z');
    return Number.isFinite(+d) && d.toISOString().slice(0, 10) === s;
  }
  function days(a, b) { return validDate(a) && validDate(b) ? Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / DAY) : null; }
  function addDays(a, n) { return new Date(Date.parse(a + 'T00:00:00Z') + n * DAY).toISOString().slice(0, 10); }
  function today() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
  function uid() { return 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 9); }
  function eligible(e, date) { return !e.date || e.date <= date; }
  function records(b, type, date) { return b.events.filter(e => (!type || e.type === type) && (!date || eligible(e, date))); }
  function headcount(b, date = today()) {
    const dated = b.events.filter(e => e.date && e.date <= date).sort((a,b) => a.date.localeCompare(b.date) || (a.createdAt || '').localeCompare(b.createdAt || ''));
    let count = b.initialBirds, confirmed = false, confirmedOn = null;
    for (const e of dated) {
      if (e.type === 'count') { count = e.count; confirmed = true; confirmedOn = e.date; }
      if (e.type === 'loss' || e.type === 'harvest') count -= e.count;
    }
    return { count, confirmed, confirmedOn, label: confirmed ? 'last counted, less subsequent recorded removals' : 'placed less recorded removals; not a verified live count' };
  }
  function latestWeigh(b, date = today(), onlyMeasured = false) {
    return records(b, 'weigh', date).filter(e => e.date && (!onlyMeasured || e.method === 'measured')).sort((a,b) => b.date.localeCompare(a.date) || (b.createdAt || '').localeCompare(a.createdAt || ''))[0] || null;
  }
  function feedInventory(b, date = today()) {
    return records(b, 'feed', date).map(p => {
      const used = sum(records(b, 'usage', date).filter(u => u.lotId === p.id).map(u => u.kg));
      return { ...p, used, remaining: isNum(p.kg) ? p.kg - used : null, price: isNum(p.kg) && p.kg > 0 ? p.cost / p.kg : null };
    });
  }
  function summary(b, date = today()) {
    const ev = records(b, null, date), inv = feedInventory(b, date);
    const feedPaid = sum(ev.filter(e => e.type === 'feed').map(e => e.cost));
    const otherPaid = sum(ev.filter(e => e.type === 'expense').map(e => e.cost));
    const usedFeed = sum(inv.map(p => p.price === null ? 0 : p.used * p.price)) + sum(ev.filter(e => e.type === 'openingUsage').map(e => e.cost));
    const harvested = ev.filter(e => e.type === 'harvest');
    return {
      feedPaid, otherPaid, cashPaid: b.chickCost + feedPaid + otherPaid,
      usedFeed, usedOperating: b.chickCost + usedFeed + otherPaid,
      budgets: sum(ev.filter(e => e.type === 'budget').map(e => e.cost)),
      knownPurchasedKg: sum(inv.map(p => p.kg)), recordedUsedKg: sum(ev.filter(e => e.type === 'usage').map(e => e.kg)) + sum(ev.filter(e => e.type === 'openingUsage').map(e => e.kg)),
      inventoryKg: sum(inv.map(p => p.remaining)), inventoryValue: sum(inv.map(p => p.price === null ? 0 : p.price * p.remaining)),
      inventoryIncomplete: inv.some(p => p.kg === null),
      harvestedBirds: sum(harvested.map(e => e.count)), dressedKg: sum(harvested.map(e => e.dressedKg)),
      revenue: sum(harvested.map(e => e.revenue)), homeKg: sum(harvested.map(e => e.homeKg)),
      head: headcount(b, date), weigh: latestWeigh(b, date),
      undatedCash: sum(ev.filter(e => !e.date && (e.type === 'feed' || e.type === 'expense')).map(e => e.cost))
    };
  }
  function recentPerformance(b, date = today()) {
    const ws = records(b, 'weigh', date).filter(e => e.method === 'measured').sort((a,b) => a.date.localeCompare(b.date));
    if (ws.length < 2) return null;
    const z = ws[ws.length - 1];
    const a = ws.slice(0,-1).reverse().find(e => e.date < z.date);
    if (!a) return null;
    const d = days(a.date, z.date), gain = z.avgKg - a.avgKg;
    const h0 = headcount(b, a.date), h1 = headcount(b, z.date);
    const removals = b.events.some(e => ['loss','harvest','count'].includes(e.type) && e.date > a.date && e.date <= z.date && (e.type !== 'count' || e.count !== h0.count));
    const usage = records(b,'usage',date).filter(e => e.startDate >= a.date && e.date <= z.date);
    const feed = sum(usage.map(e => e.kg));
    const fcr = gain > 0 && h0.confirmed && h1.confirmed && !removals && h0.count === h1.count && h1.count > 0 && feed > 0 ? feed / (gain * h1.count) : null;
    return {start:a.date,end:z.date,days:d,gainG:gain*1000/d,feed,fcr, qualifier:'Logged-feed ratio only. Missing usage entries and sampling error can bias it; deaths or removals suppress this ratio.'};
  }
  function forecast(b, params, capital = 0, recoveryBatches = 7) {
    const p = { ...params }, errors = [];
    if (!validDate(p.startDate)) errors.push('Choose a projection start date.');
    for (const [k, label, min, max] of [
      ['birds','Live birds for this scenario',1,1000000], ['weightKg','Starting average live weight',0.05,20],
      ['baselineCost','Operating cost already used at the start',0,1e9], ['feedPrice','Feed price per kg',0.01,10000],
      ['yieldPct','Dressed yield percentage',30,90], ['gainG','Starting daily gain',1,200],
      ['gainDeclinePct','Daily growth decline percentage',0,10], ['fcr','Starting incremental feed conversion',0.5,10],
      ['fcrRise','Daily FCR increase',0,0.5], ['dailyOther','Extra daily flock costs',0,100000],
      ['endDay','Final day since purchase',1,180], ['downtime','Days between batches',0,90]
    ]) if (!isNum(p[k]) || p[k] < min || p[k] > max) errors.push(`${label} must be ${min}–${max}.`);
    if (isNum(p.birds) && !Number.isInteger(p.birds)) errors.push('Bird count must be a whole number.');
    if (isNum(p.salePrice) && p.salePrice < 0) errors.push('Sale price cannot be negative.');
    const startDay = days(b.placementDate, p.startDate);
    if (startDay === null || startDay < 0) errors.push('Projection start must be on or after placement.');
    if (isNum(p.endDay) && p.endDay <= startDay) errors.push('Final day must be after the projection start.');
    if (!Number.isInteger(p.endDay) || !Number.isInteger(p.downtime)) errors.push('Final day and turnaround must be whole days.');
    if (errors.length) return {errors, rows:[], best:null};
    const rows = [], pen = capital / Math.max(1,recoveryBatches);
    let weight = p.weightKg, feedKg = 0, cost = p.baselineCost, lastDressed = 0;
    for (let d = startDay; d <= p.endDay; d++) {
      const t = d - startDay;
      let marginal = null, gain = 0, incrementalFcr = null;
      if (t > 0) {
        gain = p.gainG / 1000 * Math.pow(1 - p.gainDeclinePct/100, t-1);
        incrementalFcr = p.fcr + p.fcrRise * (t-1);
        const kg = p.birds * gain * incrementalFcr;
        feedKg += kg; weight += gain;
        const increment = kg*p.feedPrice + p.dailyOther;
        cost += increment;
        marginal = increment / (p.birds * gain * p.yieldPct/100);
      }
      const dressed = p.birds * weight * p.yieldPct/100;
      const revenue = isNum(p.salePrice) ? dressed*p.salePrice : null;
      const cycles = d + p.downtime > 0 ? Math.floor(365 / (d + p.downtime)) : 0;
      rows.push({day:d,date:addDays(b.placementDate,d),weight,feedKg,feedCost:feedKg*p.feedPrice,cost,dressed,perKg:cost/dressed,fullPerKg:(cost+pen)/dressed,marginal,incrementalFcr,gainG:gain*1000,capitalPerBatch:pen,revenue,margin:revenue === null ? null : revenue-cost,cycles,annualKg:dressed*cycles,annualCost:cost*cycles,annualBreakEven:cycles>0?(cost*cycles+capital)/(dressed*cycles):null,annualMargin:revenue === null ? null :(revenue-cost)*cycles-capital});
      lastDressed = dressed;
    }
    let best = rows[0]; for(const r of rows) if(r.perKg < best.perKg) best=r;
    const nearBest = rows.filter(r => r.perKg <= best.perKg * 1.01);
    return {errors:[],rows,best,nearBest,startDay,atBoundary:best.day===startDay || best.day===p.endDay};
  }
  function validateState(s) {
    const fail = m => { throw new Error(m); };
    if (!s || s.app !== 'FlockLedger' || s.schemaVersion !== 1) fail('Not a supported Flock Ledger backup (version 1).');
    if (!Array.isArray(s.batches) || s.batches.length>500) fail('Backup must contain 0–500 batches.');
    const text=(x,name,max=1000)=>{if(typeof x!=='string'||x.length>max)fail(`Invalid ${name}.`);};
    const num=(x,name,min=0,max=1e9,nullable=false)=>{if(nullable&&x===null)return;if(!isNum(x)||x<min||x>max)fail(`Invalid ${name}.`);};
    const integer=(x,name,min=0,max=1e6)=>{num(x,name,min,max);if(!Number.isInteger(x))fail(`${name} must be a whole number.`);};
    const date=(x,name,optional=false)=>{if(optional&&x===null)return;if(!validDate(x))fail(`Invalid ${name}.`);};
    const ids = new Set();
    for (const b of s.batches) {
      text(b.id,'batch identifier',100);if(ids.has(b.id))fail('Duplicate batch identifier.');ids.add(b.id);
      text(b.name,'batch name',120);if(!b.name.trim())fail('Batch name is required.');date(b.placementDate,'placement date');
      integer(b.initialBirds,'initial bird count',1); num(b.chickCost,'chick cost');num(b.ageAtPlacement,'age at purchase',0,180,true);
      if(!['active','closed'].includes(b.status))fail('Invalid batch status.');
      if(!Array.isArray(b.events)||b.events.length>30000)fail('Too many records or invalid records.');
      const eids=new Set();
      for(const e of b.events) {
        text(e.id,'record identifier',100);if(eids.has(e.id))fail('Duplicate record identifier.');eids.add(e.id);
        date(e.date,'record date',true);text(e.note||'','note',5000);if(e.name!==undefined)text(e.name,'description',180);
        if(e.date && e.date < b.placementDate)fail('A batch record predates purchase.');
        if(e.createdAt!==undefined)text(e.createdAt,'record timestamp',80);
        if(['feed','expense','budget','openingUsage'].includes(e.type))num(e.cost,'record cost');
        if(e.type==='feed') {num(e.kg,'feed kilograms',0.001,1e7,true);if(!['starter','grower','finisher','booster','other','unknown'].includes(e.phase))fail('Invalid feed phase.');}
        else if(e.type==='usage'){num(e.kg,'feed used',0.001,1e7);text(e.lotId,'feed lot',100);date(e.startDate,'usage period start');date(e.date,'usage end');if(e.startDate>=e.date)fail('Feed usage must end after its start. Use consecutive dates for a one-day period.');}
        else if(e.type==='weigh') {
          date(e.date,'weighing date');num(e.avgKg,'average weight',0.01,20);num(e.minKg,'minimum weight',0.001,20,true);num(e.maxKg,'maximum weight',0.001,20,true);num(e.sampleN,'sample count',1,1e6,true);
          if(!['measured','estimate'].includes(e.method))fail('Invalid weighing method.');
          if(e.method==='measured' && (e.sampleN===null||!Number.isInteger(e.sampleN)))fail('Measured weighings need the number of birds weighed.');
          if(e.minKg!==null && e.minKg>e.avgKg)fail('Minimum weight is greater than the average.');if(e.maxKg!==null&&e.maxKg<e.avgKg)fail('Maximum weight is less than the average.');
          if(e.weights!==undefined&&e.weights!==null){if(!Array.isArray(e.weights)||e.weights.length>10000)fail('Invalid individual weights.');e.weights.forEach(w=>num(w,'individual weight',0.01,20));}
        } else if(e.type==='count'||e.type==='loss') {date(e.date,'bird record date');integer(e.count,'bird count',e.type==='count'?0:1);}
        else if(e.type==='harvest') {date(e.date,'harvest date');integer(e.count,'harvest count',1);num(e.liveKg,'total live kilograms',0,1e7,true);num(e.dressedKg,'total dressed kilograms',0.001,1e7);num(e.revenue,'cash received');num(e.homeKg,'home-consumption kg',0,e.dressedKg);if(e.liveKg!==null&&e.dressedKg>e.liveKg)fail('Dressed weight cannot exceed live weight.');}
        else if(e.type==='openingUsage') {num(e.kg,'historical feed kg',0,1e7,true);}
        else if(!['expense','budget','note'].includes(e.type))fail('Unknown record type.');
      }
      for(const u of b.events.filter(e=>e.type==='usage')) {const p=b.events.find(e=>e.type==='feed'&&e.id===u.lotId);if(!p||p.kg===null)fail('Feed usage must refer to a purchase with a known quantity.');if(p.date&&u.date<p.date)fail('Feed cannot be used before it was purchased.');}
      for(const p of feedInventory(b,'9999-12-31'))if(p.remaining!==null&&p.remaining < -0.00001)fail(`Feed usage exceeds kilograms purchased for ${p.name}.`);
      const sorted=b.events.filter(e=>['count','loss','harvest'].includes(e.type)).sort((a,b)=>a.date.localeCompare(b.date)||(a.createdAt||'').localeCompare(b.createdAt||''));
      let n=b.initialBirds;for(const e of sorted){if(e.type==='count'){if(e.count>n)fail('A live count exceeds the birds remaining in the ledger. Edit the earlier count/removal or batch placement first.');n=e.count;}else n-=e.count;if(n<0)fail('Bird removals exceed the birds remaining.');}
      if(sum(b.events.filter(e=>e.type==='openingUsage').map(e=>e.cost)) + sum(feedInventory(b,'9999-12-31').map(p=>p.price===null?0:p.used*p.price)) > sum(b.events.filter(e=>e.type==='feed').map(e=>e.cost))+0.01)fail('Logged feed-use cost exceeds feed purchases recorded. Remove duplicate consumption entries or add the missing purchases.');
      if(!b.forecast||typeof b.forecast!=='object'||Array.isArray(b.forecast))fail('Invalid forecast settings.');
      const fp=b.forecast;for(const k of ['birds','weightKg','baselineCost','feedPrice','yieldPct','gainG','gainDeclinePct','fcr','fcrRise','dailyOther','endDay','salePrice','downtime'])if(fp[k]!==null&&(!isNum(fp[k])||fp[k]<0||fp[k]>1e9))fail(`Invalid forecast ${k}.`);
      if(fp.startDate!==null&&!validDate(fp.startDate))fail('Invalid forecast start date.');
    }
    if(!s.settings||!Array.isArray(s.settings.capital)||s.settings.capital.length>1000)fail('Invalid capital settings.');
    integer(s.settings.recoveryBatches,'capital recovery batches',1,1000);
    for(const a of s.settings.capital){text(a.id,'capital id',100);text(a.name,'capital description',180);num(a.cost,'capital amount');date(a.date,'capital date',true);}
    if(s.settings.ui!==undefined && s.settings.ui!==null){
      const ui=s.settings.ui;
      if(typeof ui!=='object'||Array.isArray(ui))fail('Invalid UI settings.');
      const keys=Object.keys(ui);
      if(keys.length>30)fail('Invalid UI settings.');
      if(ui.packKg!==undefined&&ui.packKg!==null)num(ui.packKg,'pack kilograms',0.001,1e5);
      if(ui.weighUnit!==undefined&&ui.weighUnit!==null&&!['kg','g'].includes(ui.weighUnit))fail('Invalid weigh unit.');
      if(ui.lastLotId!==undefined&&ui.lastLotId!==null)text(ui.lastLotId,'last lot',100);
      if(ui.drafts!==undefined&&ui.drafts!==null){
        if(typeof ui.drafts!=='object'||Array.isArray(ui.drafts))fail('Invalid drafts.');
        const dkeys=Object.keys(ui.drafts);
        if(dkeys.length>80)fail('Too many drafts.');
        for(const k of dkeys){
          text(k,'draft key',240);
          const draft=ui.drafts[k];
          if(typeof draft!=='object'||draft===null||Array.isArray(draft))fail('Invalid draft.');
        }
      }
    }
    if(s.batches.length ? !s.batches.some(b=>b.id===s.selectedBatchId) : s.selectedBatchId!==null)fail('Selected batch is missing.');
    return s;
  }
  function defaultForecast(date=null) {return {startDate:date,birds:null,weightKg:null,baselineCost:null,feedPrice:null,yieldPct:70,gainG:60,gainDeclinePct:0.5,fcr:2.2,fcrRise:0.03,dailyOther:0,endDay:60,salePrice:null,downtime:10};}
  function makeBatch({name,placementDate,initialBirds,chickCost,ageAtPlacement=null,placementEstimated=false}) {return {id:uid(),name,placementDate,initialBirds,chickCost,ageAtPlacement,placementEstimated,status:'active',events:[],forecast:defaultForecast(placementDate)};}
  // Public builds always start empty. Existing local ledgers are never replaced.
  function seededState() {
    return {app:'FlockLedger',schemaVersion:1,selectedBatchId:null,
      settings:{recoveryBatches:7,capital:[]},batches:[]};
  }
  function parseWeightList(text) {
    if (typeof text !== 'string' || !text.trim()) return {weights:[],error:null,avgKg:null,minKg:null,maxKg:null,sampleN:0};
    const parts = text.trim().split(/[\s,;]+/).filter(Boolean);
    const weights = [];
    for (const part of parts) {
      if (!/^\d+(\.\d+)?$/.test(part) && !/^\.\d+$/.test(part)) return {weights:[],error:'Enter individual weights as kilograms separated by commas, spaces, or new lines. Use a period for decimals.',avgKg:null,minKg:null,maxKg:null,sampleN:0};
      const n = Number(part);
      if (!Number.isFinite(n) || n <= 0) return {weights:[],error:'Each individual weight must be a positive number of kilograms.',avgKg:null,minKg:null,maxKg:null,sampleN:0};
      weights.push(n);
    }
    return {weights,error:null,avgKg:sum(weights)/weights.length,minKg:Math.min(...weights),maxKg:Math.max(...weights),sampleN:weights.length};
  }
  function serializeWeigh(mode, draft) {
    const n = (v, optional) => v===''||v===undefined||v===null ? (optional ? null : NaN) : Number(v);
    if (mode === 'estimate') return {method:'estimate',weights:null,avgKg:n(draft.avgKg),minKg:null,maxKg:null,sampleN:null};
    if (mode === 'individual') {
      const parsed = parseWeightList(draft.weights);
      if (parsed.error) throw new Error(parsed.error);
      if (!parsed.weights.length) throw new Error('Enter at least one individual weight.');
      return {method:'measured',weights:parsed.weights,avgKg:parsed.avgKg,minKg:parsed.minKg,maxKg:parsed.maxKg,sampleN:parsed.sampleN};
    }
    return {method:'measured',weights:null,avgKg:n(draft.avgKg),minKg:n(draft.minKg,true),maxKg:n(draft.maxKg,true),sampleN:n(draft.sampleN,true)};
  }
  function purchaseDefaults(product) {
    if (!product || typeof product !== 'object') return {name:'',phase:'unknown'};
    return {name:product.name||'',phase:product.phase||'unknown'};
  }
  function lotUsed(batch, lotId, asOfDate, excludeId) {
    return sum(batch.events.filter(e => e.type==='usage' && e.lotId===lotId && e.id!==excludeId && (!asOfDate || !e.date || e.date<=asOfDate)).map(e => e.kg));
  }
  function lotBalances(batch, lotId, asOfDate) {
    const p = batch.events.find(e => e.type==='feed' && e.id===lotId);
    if (!p) return null;
    const usedAsOf = lotUsed(batch, lotId, asOfDate);
    const usedAll = lotUsed(batch, lotId);
    return {
      lotId, bought:p.kg, asOfDate, usedAsOf, usedAll,
      balanceAtDate: isNum(p.kg) ? p.kg - usedAsOf : null,
      remainingAfterAll: isNum(p.kg) ? p.kg - usedAll : null
    };
  }
  function eligibleLots(batch, endDate, edit) {
    const excludeId = edit && edit.id;
    return batch.events.filter(p => {
      if (p.type!=='feed' || p.kg===null) return false;
      if (p.date && endDate && p.date > endDate) return false;
      const remaining = p.kg - lotUsed(batch, p.id, null, excludeId);
      if (edit && edit.lotId===p.id) return true;
      return remaining > 0.00001;
    }).map(p => {
      const remaining = p.kg - lotUsed(batch, p.id, null, excludeId);
      const asOf = endDate ? p.kg - lotUsed(batch, p.id, endDate, excludeId) : remaining;
      return {...p, remaining, asOfRemaining:asOf, allowance:remaining};
    });
  }
  function productSuggestions(batch) {
    const seen = new Set(), out = [];
    const feeds = batch.events.filter(e => e.type==='feed').sort((a,b) => (b.date||'').localeCompare(a.date||'') || (b.createdAt||'').localeCompare(a.createdAt||''));
    for (const p of feeds) {
      const name = (p.name||'').trim();
      if (!name) continue;
      const key = name.toLowerCase()+'|'+p.phase;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({name, phase:p.phase, lastDate:p.date, lastCost:p.cost, lastKg:p.kg});
    }
    return out;
  }
  function attentionItems(batch, date = today()) {
    const items = [], h = headcount(batch, date), s = summary(batch, date);
    const measured = records(batch,'weigh',date).filter(e => e.method==='measured' && e.date);
    if (!h.confirmed) items.push({key:'count',title:'No live count recorded',detail:'',action:'Count birds',actionType:'count'});
    const unknownQty = records(batch,'feed',date).filter(p => p.kg===null);
    if (unknownQty.length===1) items.push({key:'unknown-qty',title:'One purchase has an unknown quantity',detail:'',action:'Review purchase',actionType:'feed',eventId:unknownQty[0].id});
    if (unknownQty.length>1) items.push({key:'unknown-qty',title:unknownQty.length+' purchases have an unknown quantity',detail:'',action:'Review purchases',actionType:'records'});
    if (measured.length===1) items.push({key:'weigh',title:'One measured weighing recorded',detail:'Another dated sample is needed for observed daily gain.',action:'Weigh birds',actionType:'weigh'});
    if (s.inventoryIncomplete && !unknownQty.length) items.push({key:'stock',title:'Recorded stock is incomplete',detail:'',action:'Review purchases',actionType:'records'});
    return items;
  }
  function proposeForecastStart(batch) {
    const w = latestWeigh(batch);
    if (!w) return {startDate:null,weightKg:null,weightMethod:null,birds:null,birdsProvenance:'no-weigh',baselineCost:null,feedPrice:null,incomplete:true};
    const startDate = w.date, h = headcount(batch, startDate), s = summary(batch, startDate);
    const inv = feedInventory(batch, startDate).filter(p => p.price!==null).sort((a,b) => (a.date||'').localeCompare(b.date||'') || (a.createdAt||'').localeCompare(b.createdAt||''));
    return {
      startDate, weightKg:w.avgKg, weightMethod:w.method,
      birds: h.confirmed ? h.count : null,
      birdsProvenance: h.confirmed ? 'verified-count' : 'unverified',
      baselineCost: s.usedOperating,
      baselineIncomplete: s.inventoryIncomplete,
      feedPrice: inv.length ? inv[inv.length-1].price : null,
      feedPriceDate: inv.length ? inv[inv.length-1].date : null,
      incomplete: !h.confirmed || s.inventoryIncomplete || !inv.length
    };
  }
  function sortWeighObservations(events) {
    return events.filter(e => e.type==='weigh' && e.date).slice().sort((a,b) => a.date.localeCompare(b.date) || (a.createdAt||'').localeCompare(b.createdAt||''));
  }
  function weighSeriesPoints(batch) {
    return sortWeighObservations(batch.events).map(w => ({date:w.date,createdAt:w.createdAt,method:w.method,avgKg:w.avgKg,x:days(batch.placementDate,w.date),y:w.avgKg}));
  }
  function applyEvents(state, batchId, events, removeIds) {
    const next = JSON.parse(JSON.stringify(state));
    const b = next.batches.find(x => x.id===batchId);
    if (!b) throw new Error('The batch for this entry is no longer in the ledger.');
    if (removeIds && removeIds.length) b.events = b.events.filter(e => !removeIds.includes(e.id));
    for (const e of events) {
      const i = b.events.findIndex(x => x.id===e.id);
      if (i>=0) b.events[i]=e; else b.events.push(e);
    }
    return validateState(next);
  }
  function blockingCountRecord(batch, count, date) {
    const sorted = batch.events.filter(e => ['count','loss','harvest'].includes(e.type) && e.date && e.date<=date).sort((a,b) => a.date.localeCompare(b.date) || (a.createdAt||'').localeCompare(b.createdAt||''));
    let n = batch.initialBirds, last = {id:null,type:'placement',count:batch.initialBirds,date:batch.placementDate};
    for (const e of sorted) {
      if (e.type==='count') { if (e.count>n) return e; n=e.count; }
      else n -= e.count;
      last = e;
      if (n<0) return e;
    }
    return count>n ? last : null;
  }
  function normalizeWeighDraft(draft) {
    const g = draft && draft.weighUnit === 'g';
    const scale = v => {
      if (v === '' || v === undefined || v === null) return v;
      const n = Number(v);
      return Number.isFinite(n) ? String(g ? n / 1000 : n) : v;
    };
    if (!draft) return {weighMode:'average', method:'measured', avgKg:'', minKg:'', maxKg:'', sampleN:'', weights:''};
    if (draft.weighMode === 'individual') {
      const parts = String(draft.weights || '').trim().split(/[\s,;]+/).filter(Boolean);
      return {
        weighMode: 'individual',
        method: 'measured',
        avgKg: '',
        minKg: '',
        maxKg: '',
        sampleN: draft.sampleN,
        weights: parts.map(w => {
          const n = Number(w);
          return Number.isFinite(n) ? String(g ? n / 1000 : n) : w;
        }).join(', ')
      };
    }
    if (draft.weighMode === 'estimate') {
      return {weighMode:'estimate', method:'estimate', avgKg:scale(draft.avgKg), minKg:null, maxKg:null, sampleN:null, weights:''};
    }
    return {weighMode:'average', method:'measured', avgKg:scale(draft.avgKg), minKg:scale(draft.minKg), maxKg:scale(draft.maxKg), sampleN:draft.sampleN, weights:draft.weights};
  }
  function candidateBatch(batch, events, removeIds) {
    const next = JSON.parse(JSON.stringify(batch));
    if (removeIds && removeIds.length) next.events = next.events.filter(e => !removeIds.includes(e.id));
    for (const e of events || []) {
      const i = next.events.findIndex(x => x.id === e.id);
      if (i >= 0) next.events[i] = e;
      else next.events.push(e);
    }
    return next;
  }
  return {sum,isNum,validDate,days,addDays,today,uid,records,headcount,latestWeigh,feedInventory,summary,recentPerformance,forecast,validateState,defaultForecast,makeBatch,seededState,parseWeightList,serializeWeigh,purchaseDefaults,lotBalances,eligibleLots,productSuggestions,attentionItems,proposeForecastStart,sortWeighObservations,weighSeriesPoints,applyEvents,blockingCountRecord,normalizeWeighDraft,candidateBatch};
});
