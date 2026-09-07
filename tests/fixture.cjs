/* Synthetic regression fixture. Not a real farm or a default app ledger. */
'use strict';
const M=require('../src/core.js');
function fixtureState(){
 const b=M.makeBatch({name:'Synthetic test flock',placementDate:'2025-01-10',initialBirds:60,chickCost:2400,placementEstimated:true});
 b.id='fixture-batch';
 b.events=[
  {id:'fixture-prior-feed',type:'feed',date:null,createdAt:'2025-02-09T00:00:00Z',name:'Synthetic prior feed',phase:'unknown',kg:null,cost:2100,note:'Test-only unpriced quantity.'},
  {id:'fixture-budget',type:'budget',date:'2025-02-09',createdAt:'2025-02-09T00:01:00Z',name:'Synthetic budget',cost:2700,note:'Test allocation, not a purchase.'},
  {id:'fixture-estimate',type:'weigh',date:'2025-02-09',createdAt:'2025-02-09T00:02:00Z',avgKg:0.9,minKg:null,maxKg:1.2,sampleN:null,method:'estimate',weights:null,note:'Synthetic estimate for validation tests.'}
 ];
 b.forecast={...M.defaultForecast('2025-02-09'),weightKg:0.9};
 return {app:'FlockLedger',schemaVersion:1,selectedBatchId:b.id,settings:{recoveryBatches:7,capital:[{id:'fixture-asset',name:'Synthetic asset',date:null,cost:15000}]},batches:[b]};
}
module.exports=fixtureState;
if(require.main===module)process.stdout.write(JSON.stringify(fixtureState()));
