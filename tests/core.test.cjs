'use strict';
const assert=require('node:assert/strict');
const M=require('../src/core.js');
let passed=0;
const test=(name,fn)=>{try{fn();passed++;console.log('PASS',name);}catch(e){console.error('FAIL',name);throw e;}};
const eq=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
const seed=require('./fixture.cjs');
const event=(type,x)=>({id:M.uid(),type,date:'2025-02-09',createdAt:new Date().toISOString(),note:'',...x});
const add=(d,type,x)=>{const e=event(type,x);d.batches[0].events.push(e);return e;};
const scenario=(x={})=>({...M.defaultForecast('2025-02-09'),birds:47,weightKg:1,baselineCost:4500,feedPrice:30,gainG:70,gainDeclinePct:0,fcr:2,fcrRise:0,endDay:56,...x});
test('Synthetic fixture keeps estimates, unknown survivors and unknown feed kilograms separate',()=>{const d=M.validateState(seed()),b=d.batches[0],s=M.summary(b,'2025-02-09');assert.equal(b.initialBirds,60);eq(b.chickCost,2400);assert.equal(b.placementEstimated,true);assert.equal(b.ageAtPlacement,null);assert.equal(s.head.confirmed,false);assert.equal(s.inventoryIncomplete,true);assert.equal(s.weigh.method,'estimate');});
test('Budgets and capital are excluded from recorded batch spending',()=>{const d=seed(),s=M.summary(d.batches[0]);eq(s.cashPaid,4500);eq(s.budgets,2700);eq(d.settings.capital[0].cost,15000);eq(s.usedOperating,2400);});
test('Calendar arithmetic uses date-only UTC, not hours or DST',()=>{assert.equal(M.days('2025-01-10','2025-02-09'),30);assert.equal(M.addDays('2025-01-10',45),'2025-02-24');assert.equal(M.days('2026-03-08','2026-03-09'),1);});
test('Invalid / rollover calendar dates are rejected',()=>{assert.equal(M.validDate('2026-02-30'),false);assert.equal(M.validDate('2025-01-10T00:00:00'),false);assert.equal(M.validDate('2024-02-29'),true);});
test('Purchase and feed used affect different cost accounts',()=>{const d=seed(),p=add(d,'feed',{name:'Test feed',phase:'finisher',kg:100,cost:3000});add(d,'usage',{lotId:p.id,kg:20,startDate:'2025-02-08'});M.validateState(d);const s=M.summary(d.batches[0]);eq(s.cashPaid,7500);eq(s.usedFeed,600);eq(s.usedOperating,3000);eq(s.inventoryKg,80);eq(s.inventoryValue,2400);});
test('Historical use is production cost, not a duplicate cash expense',()=>{const d=seed();add(d,'openingUsage',{name:'Historical use',cost:2100,kg:null});M.validateState(d);const s=M.summary(d.batches[0]);eq(s.cashPaid,4500);eq(s.usedOperating,4500);});
test('Duplicate usage exceeding recorded purchase cost is rejected',()=>{const d=seed(),p=add(d,'feed',{name:'Test',phase:'finisher',kg:100,cost:3000});add(d,'usage',{lotId:p.id,kg:100,startDate:'2025-02-08'});add(d,'openingUsage',{name:'Too much',cost:5500,kg:null});assert.throws(()=>M.validateState(d),/exceeds feed purchases/);});
test('Overconsumption of a feed lot is rejected',()=>{const d=seed(),p=add(d,'feed',{name:'Test',phase:'finisher',kg:50,cost:1500});add(d,'usage',{lotId:p.id,kg:51,startDate:'2025-02-08'});assert.throws(()=>M.validateState(d),/exceeds kilograms/);});
test('Usage cannot refer to unknown or unpriced lots',()=>{const d=seed();add(d,'usage',{lotId:'fixture-prior-feed',kg:10,startDate:'2025-02-08'});assert.throws(()=>M.validateState(d),/known quantity/);});
test('Deleting a feed lot with usage is rejected by state validation',()=>{const d=seed();add(d,'usage',{lotId:'deleted-lot',kg:10,startDate:'2025-02-08'});assert.throws(()=>M.validateState(d),/known quantity/);});
test('Live counts are snapshots; deaths and harvests subtract',()=>{const d=seed();add(d,'count',{count:47,date:'2025-02-07'});add(d,'loss',{count:2,date:'2025-02-08'});add(d,'harvest',{count:10,date:'2025-02-09',liveKg:20,dressedKg:14,homeKg:14,revenue:0});M.validateState(d);const h=M.headcount(d.batches[0],'2025-02-09');assert.equal(h.count,35);assert.equal(h.confirmed,true);});
test('An impossible count or over-harvest cannot silently create birds',()=>{const d=seed();add(d,'count',{count:61});assert.throws(()=>M.validateState(d),/exceeds the birds/);const e=seed();add(e,'loss',{count:61});assert.throws(()=>M.validateState(e),/removals exceed/);});
test('Home-consumption output is not booked as cash revenue',()=>{const d=seed();add(d,'harvest',{count:5,liveKg:10,dressedKg:7,revenue:0,homeKg:7});const s=M.summary(d.batches[0]);eq(s.revenue,0);eq(s.homeKg,7);eq(s.dressedKg,7);});
test('Impossible carcass yield rejected',()=>{const d=seed();add(d,'harvest',{count:5,liveKg:10,dressedKg:12,revenue:0,homeKg:0});assert.throws(()=>M.validateState(d),/Dressed weight/);});
test('Missing scenario inputs never produce fabricated curves',()=>{const d=seed(),f=M.forecast(d.batches[0],d.batches[0].forecast);assert.equal(f.rows.length,0);assert.ok(f.errors.length>=3);});
test('Projection start does not silently use hatch age',()=>{const d=seed(),f=M.forecast(d.batches[0],scenario());assert.equal(f.startDay,30);assert.equal(f.rows[0].date,'2025-02-09');});
test('Constant-gain and FCR scenario matches a hand-calculated day 35',()=>{const d=seed(),f=M.forecast(d.batches[0],scenario()),r=f.rows.find(r=>r.day===35);eq(r.weight,1.35);eq(r.feedKg,47*.35*2);eq(r.cost,4500+47*.35*2*30);eq(r.dressed,47*1.35*.7);eq(r.perKg,r.cost/r.dressed);eq(r.marginal,30*2/.7);});
test('Daily overhead is per flock and charged exactly once per elapsed day',()=>{const b=seed().batches[0],a=M.forecast(b,scenario()),f=M.forecast(b,scenario({dailyOther:100}));eq(f.rows[5].cost-a.rows[5].cost,500);});
test('Infrastructure allocation cannot change the operating-only optimum',()=>{const b=seed().batches[0],f=M.forecast(b,scenario(),20000,7),g=M.forecast(b,scenario(),0,7);eq(f.best.perKg,g.best.perKg);assert.equal(f.best.day,g.best.day);eq(f.rows[5].fullPerKg-f.rows[5].perKg,20000/7/f.rows[5].dressed);});
test('Average/marginal crossover is arithmetically consistent on every day',()=>{const f=M.forecast(seed().batches[0],scenario({gainG:60,gainDeclinePct:.5,fcr:2.2,fcrRise:.05}));for(let i=1;i<f.rows.length;i++){const prev=f.rows[i-1],r=f.rows[i];assert.equal(r.perKg<prev.perKg,r.marginal<prev.perKg);}});
test('Boundary minima are labeled, not claimed as confirmed optima',()=>{const f=M.forecast(seed().batches[0],scenario());assert.equal(f.atBoundary,true);assert.equal(f.best.day,56);});
test('Forecast chronology, zero feed price, fractional birds rejected',()=>{const b=seed().batches[0];assert.ok(M.forecast(b,scenario({endDay:29})).errors.length);assert.ok(M.forecast(b,scenario({feedPrice:0})).errors.length);assert.ok(M.forecast(b,scenario({birds:47.5})).errors.length);});
test('A day-zero/zero-downtime scenario does not divide by zero',()=>{const b=seed().batches[0],f=M.forecast(b,scenario({startDate:b.placementDate,downtime:0}));assert.equal(f.rows[0].cycles,0);assert.equal(f.rows[0].annualBreakEven,null);for(const r of f.rows)assert.ok(Number.isFinite(r.cost));});
test('Annual capacity includes grow-out and downtime; capital counted once',()=>{const b=seed().batches[0],r=M.forecast(b,scenario({salePrice:200}),20000,7).rows.find(r=>r.day===45);assert.equal(r.cycles,6);eq(r.annualMargin,(r.dressed*200-r.cost)*6-20000);eq(r.annualBreakEven,(r.cost*6+20000)/(r.dressed*6));});
test('Missing selling price suppresses profit instead of assuming a market price',()=>{const r=M.forecast(seed().batches[0],scenario()).rows[5];assert.equal(r.margin,null);assert.equal(r.annualMargin,null);});
test('Estimated weigh-ins do not create observed growth',()=>{const d=seed();assert.equal(M.recentPerformance(d.batches[0]),null);});
test('Two dated measured samples calculate daily gain',()=>{const d=seed();for(const [date,avg]of[['2025-02-03',.8],['2025-02-08',1.1]])add(d,'weigh',{date,avgKg:avg,minKg:null,maxKg:null,sampleN:10,method:'measured',weights:null});M.validateState(d);const r=M.recentPerformance(d.batches[0],'2025-02-09');eq(r.gainG,60);assert.equal(r.fcr,null);});
test('Unverified headcount suppresses logged-feed conversion',()=>{const d=seed();for(const [date,avg]of[['2025-02-03',.8],['2025-02-08',1.1]])add(d,'weigh',{date,avgKg:avg,minKg:null,maxKg:null,sampleN:10,method:'measured',weights:null});const p=add(d,'feed',{date:'2025-02-03',name:'Test',phase:'grower',kg:30,cost:1000});add(d,'usage',{date:'2025-02-08',lotId:p.id,kg:20,startDate:'2025-02-03'});assert.equal(M.recentPerformance(d.batches[0]).fcr,null);});
test('Counts and losses suppress misleading interval feed conversion',()=>{const d=seed();add(d,'count',{date:'2025-02-03',count:47});for(const [date,avg]of[['2025-02-03',.8],['2025-02-08',1.1]])add(d,'weigh',{date,avgKg:avg,minKg:null,maxKg:null,sampleN:10,method:'measured',weights:null});const p=add(d,'feed',{date:'2025-02-03',name:'Test',phase:'grower',kg:30,cost:1000});add(d,'usage',{date:'2025-02-08',lotId:p.id,kg:20,startDate:'2025-02-03'});eq(M.recentPerformance(d.batches[0]).fcr,20/(47*.3));add(d,'loss',{date:'2025-02-07',count:1});assert.equal(M.recentPerformance(d.batches[0]).fcr,null);});
test('Measured weigh-in requires a real sample count',()=>{const d=seed();add(d,'weigh',{avgKg:1,minKg:null,maxKg:null,sampleN:null,method:'measured'});assert.throws(()=>M.validateState(d),/number of birds/);});
test('Corrupt, unexpected-version and duplicate-ID backups rejected',()=>{assert.throws(()=>M.validateState({app:'Other'}));const a=seed();a.schemaVersion=2;assert.throws(()=>M.validateState(a));const b=seed();b.batches.push(JSON.parse(JSON.stringify(b.batches[0])));assert.throws(()=>M.validateState(b),/Duplicate/);});
test('JSON round-trip preserves all data and unknown values',()=>{const d=seed();assert.deepEqual(M.validateState(JSON.parse(JSON.stringify(d))),d);});
test('Historical snapshots exclude future dated feed purchases',()=>{const d=seed();add(d,'feed',{date:'2025-02-17',name:'Future',phase:'finisher',cost:3000,kg:100});eq(M.summary(d.batches[0],'2025-02-09').cashPaid,4500);});
test('Public first launch contains no farm records or assets',()=>{const s=M.validateState(M.seededState());assert.deepEqual(s.batches,[]);assert.deepEqual(s.settings.capital,[]);assert.equal(s.selectedBatchId,null);});
test('Empty ledger cannot point at a nonexistent batch',()=>{const s=M.seededState();s.selectedBatchId='missing';assert.throws(()=>M.validateState(s),/Selected batch/);});
test('First batch can be added to a blank public ledger',()=>{const s=M.seededState();const b=M.makeBatch({name:'New test flock',placementDate:'2025-01-01',initialBirds:12,chickCost:480});s.batches.push(b);s.selectedBatchId=b.id;assert.equal(M.validateState(s).batches.length,1);});
test('parseWeightList uses comma as a bird separator and period as the decimal',()=>{
  const parsed=M.parseWeightList('1.0, 1.1, 1.2, 1.1');
  assert.deepEqual(parsed.weights,[1,1.1,1.2,1.1]);
  eq(parsed.avgKg,1.1);eq(parsed.minKg,1);eq(parsed.maxKg,1.2);assert.equal(parsed.sampleN,4);
  assert.deepEqual(M.parseWeightList('1,2').weights,[1,2]);
  assert.deepEqual(M.parseWeightList('0.7; 0.8\n0.9').weights,[0.7,0.8,0.9]);
  assert.ok(M.parseWeightList('1.2.3').error);
});
test('serializeWeigh preview aggregates match the saved individual list',()=>{
  const saved=M.serializeWeigh('individual',{weights:'1.0, 1.1, 1.2, 1.1'});
  const preview=M.parseWeightList('1.0, 1.1, 1.2, 1.1');
  assert.equal(saved.method,'measured');
  assert.deepEqual(saved.weights,preview.weights);
  eq(saved.avgKg,preview.avgKg);eq(saved.minKg,preview.minKg);eq(saved.maxKg,preview.maxKg);
  assert.equal(saved.sampleN,preview.sampleN);
});
test('Estimate draft with leftover weights text still saves as an estimate',()=>{
  const e=M.serializeWeigh('estimate',{avgKg:'0.9',weights:'1.0, 2.0, 3.0',sampleN:'3'});
  assert.equal(e.method,'estimate');assert.equal(e.weights,null);eq(e.avgKg,0.9);assert.equal(e.sampleN,null);
});
test('New purchase defaults to unknown phase; a prior product copies phase only',()=>{
  assert.equal(M.purchaseDefaults(null).phase,'unknown');
  assert.equal(M.purchaseDefaults({}).phase,'unknown');
  const copied=M.purchaseDefaults({name:'Grower pellet',phase:'grower',kg:50,cost:1500});
  assert.equal(copied.name,'Grower pellet');assert.equal(copied.phase,'grower');
  assert.equal(copied.kg,undefined);assert.equal(copied.cost,undefined);
});
test('eligibleLots excludes exhausted, unknown-kg and future lots; edit keeps the current lot',()=>{
  const d=seed(),b=d.batches[0];
  const usable=add(d,'feed',{name:'Usable',phase:'grower',kg:40,cost:1200,date:'2025-02-08'});
  const exhausted=add(d,'feed',{name:'Gone',phase:'finisher',kg:10,cost:300,date:'2025-02-07'});
  add(d,'usage',{lotId:exhausted.id,kg:10,startDate:'2025-02-07',date:'2025-02-08'});
  add(d,'feed',{name:'Later',phase:'finisher',kg:20,cost:600,date:'2025-02-20'});
  const ids=M.eligibleLots(b,'2025-02-09').map(p=>p.id);
  assert.ok(ids.includes(usable.id));
  assert.ok(!ids.includes(exhausted.id));
  assert.ok(!ids.includes('fixture-prior-feed'));
  assert.ok(!ids.includes(b.events.find(e=>e.name==='Later').id));
  const edit=b.events.find(e=>e.lotId===exhausted.id);
  const editing=M.eligibleLots(b,'2025-02-09',edit).map(p=>p.id);
  assert.ok(editing.includes(exhausted.id));
  const allowance=M.eligibleLots(b,'2025-02-09',edit).find(p=>p.id===exhausted.id).allowance;
  eq(allowance,10);
});
test('lotBalances distinguishes as-of remaining from remaining after all usage',()=>{
  const d=seed(),p=add(d,'feed',{name:'Lot',phase:'grower',kg:100,cost:3000,date:'2025-02-01'});
  add(d,'usage',{lotId:p.id,kg:20,startDate:'2025-02-01',date:'2025-02-05'});
  add(d,'usage',{lotId:p.id,kg:30,startDate:'2025-02-06',date:'2025-02-09'});
  const bal=M.lotBalances(d.batches[0],p.id,'2025-02-05');
  eq(bal.balanceAtDate,80);eq(bal.remainingAfterAll,50);
});
test('Multi-lot usage commit is all-or-nothing and stays ordinary usage events',()=>{
  const d=seed(),b=d.batches[0];
  const a=add(d,'feed',{name:'A',phase:'grower',kg:40,cost:1200,date:'2025-02-08'});
  const c=add(d,'feed',{name:'B',phase:'grower',kg:10,cost:300,date:'2025-02-08'});
  const before=JSON.parse(JSON.stringify(d));
  assert.throws(()=>M.applyEvents(d,b.id,[
    event('usage',{lotId:a.id,kg:10,startDate:'2025-02-08',date:'2025-02-09'}),
    event('usage',{lotId:c.id,kg:11,startDate:'2025-02-08',date:'2025-02-09'})
  ]),/exceeds kilograms/);
  assert.deepEqual(d,before);
  const next=M.applyEvents(d,b.id,[
    event('usage',{lotId:a.id,kg:10,startDate:'2025-02-08',date:'2025-02-09'}),
    event('usage',{lotId:c.id,kg:5,startDate:'2025-02-08',date:'2025-02-09'})
  ]);
  const added=next.batches[0].events.filter(e=>e.type==='usage');
  assert.equal(added.length,2);
  assert.ok(added.every(e=>e.type==='usage'));
});
test('proposeForecastStart does not keep an old baseline or unverified bird count',()=>{
  const d=seed(),b=d.batches[0];
  b.forecast.baselineCost=9999;b.forecast.birds=99;b.forecast.startDate='2025-01-20';
  add(d,'weigh',{date:'2025-02-09',avgKg:1.1,minKg:null,maxKg:null,sampleN:8,method:'measured',weights:null});
  const unverified=M.proposeForecastStart(b);
  assert.equal(unverified.startDate,'2025-02-09');
  assert.equal(unverified.birds,null);
  assert.equal(unverified.birdsProvenance,'unverified');
  eq(unverified.baselineCost,M.summary(b,'2025-02-09').usedOperating);
  assert.notEqual(unverified.baselineCost,9999);
  add(d,'count',{date:'2025-02-09',count:47});
  const verified=M.proposeForecastStart(b);
  assert.equal(verified.birds,47);
  assert.equal(verified.weightMethod,'measured');
});
test('Optional settings.ui is accepted; older backups without it still validate',()=>{
  const old=seed();
  assert.equal(old.settings.ui,undefined);
  M.validateState(old);
  old.settings.ui={packKg:25,weighUnit:'kg',lastLotId:null,drafts:{'feed|fixture-batch|2025-02-09':{name:'Draft pellet',phase:'unknown',kg:'',cost:''}}};
  M.validateState(old);
  assert.equal(old.batches[0].events.some(e=>e.type==='draft'),false);
});
test('Weigh chart points are sorted by date then createdAt, not insertion order',()=>{
  const d=seed(),b=d.batches[0];
  add(d,'weigh',{date:'2025-02-09',createdAt:'2025-02-09T12:00:00Z',avgKg:1.2,minKg:null,maxKg:null,sampleN:4,method:'measured',weights:null});
  add(d,'weigh',{date:'2025-02-03',createdAt:'2025-02-09T13:00:00Z',avgKg:0.8,minKg:null,maxKg:null,sampleN:4,method:'measured',weights:null});
  const pts=M.weighSeriesPoints(b).filter(p=>p.method==='measured');
  assert.deepEqual(pts.map(p=>p.date),['2025-02-03','2025-02-09']);
  assert.ok(pts[0].x<pts[1].x);
});
test('productSuggestions are unique name+phase pairs from recent purchases',()=>{
  const d=seed(),b=d.batches[0];
  add(d,'feed',{name:'Grower pellet',phase:'grower',kg:50,cost:1500,date:'2025-02-01'});
  add(d,'feed',{name:'Grower pellet',phase:'grower',kg:25,cost:800,date:'2025-02-08'});
  add(d,'feed',{name:'Grower pellet',phase:'finisher',kg:25,cost:900,date:'2025-02-09'});
  const suggestions=M.productSuggestions(b);
  assert.equal(suggestions.filter(p=>p.name==='Grower pellet').length,2);
  assert.ok(suggestions.some(p=>p.name==='Grower pellet'&&p.phase==='finisher'));
});
test('attentionItems come from real gaps and never invent a missed feeding day',()=>{
  const d=seed(),items=M.attentionItems(d.batches[0],'2025-02-09');
  assert.ok(items.some(i=>/live count/i.test(i.title)));
  assert.ok(items.some(i=>/unknown quantity/i.test(i.title)));
  assert.ok(!items.some(i=>/Feeding incomplete|Birds not fed|Zero losses/i.test(i.title+i.detail)));
});
test('latestWeigh measured filter still returns a sample when a newer estimate exists',()=>{
  const d=seed();
  add(d,'weigh',{date:'2025-02-08',avgKg:1.05,minKg:null,maxKg:null,sampleN:8,method:'measured',weights:null});
  M.validateState(d);
  const b=d.batches[0];
  assert.equal(M.latestWeigh(b,'2025-02-09').method,'estimate');
  const measured=M.latestWeigh(b,'2025-02-09',true);
  assert.equal(measured.method,'measured');
  eq(measured.avgKg,1.05);
  assert.equal(measured.date,'2025-02-08');
});
test('Gram list 1000, 1200 serializes to 1.1 kg average through normalizeWeighDraft',()=>{
  const normalized=M.normalizeWeighDraft({weighMode:'individual',weighUnit:'g',weights:'1000, 1200'});
  const saved=M.serializeWeigh(normalized.weighMode,normalized);
  const preview=M.parseWeightList(normalized.weights);
  eq(preview.avgKg,1.1);
  eq(saved.avgKg,1.1);
  assert.deepEqual(saved.weights,[1,1.2]);
  assert.equal(saved.sampleN,2);
});
test('Edit usage 10→20 kg: candidate remaining matches applyEvents',()=>{
  const d=seed(),b=d.batches[0];
  const p=add(d,'feed',{name:'Lot',phase:'grower',kg:50,cost:1500,date:'2025-02-01'});
  const edit=add(d,'usage',{lotId:p.id,kg:10,startDate:'2025-02-01',date:'2025-02-09'});
  const preview={...edit,kg:20};
  const cand=M.candidateBatch(b,[preview]);
  eq(M.lotBalances(cand,p.id).remainingAfterAll,30);
  const next=M.applyEvents(d,b.id,[preview]);
  eq(M.lotBalances(next.batches[0],p.id).remainingAfterAll,M.lotBalances(cand,p.id).remainingAfterAll);
});
test('Edit loss 2→3: candidate headcount matches replaced history',()=>{
  const d=seed();
  add(d,'count',{count:55,date:'2025-02-07'});
  const loss=add(d,'loss',{count:2,date:'2025-02-08'});
  M.validateState(d);
  const b=d.batches[0];
  assert.equal(M.headcount(b,'2025-02-09').count,53);
  const cand=M.candidateBatch(b,[{...loss,count:3}]);
  assert.equal(M.headcount(cand,'2025-02-09').count,52);
  const next=M.applyEvents(d,b.id,[{...loss,count:3}]);
  assert.equal(M.headcount(next.batches[0],'2025-02-09').count,52);
});
console.log(`\n${passed} domain tests passed.`);
