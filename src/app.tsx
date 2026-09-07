/* Offline React UI. React is vendored; no CDN or runtime package downloads. */
declare const React:any, ReactDOM:any, FlockMath:any;
const M=FlockMath;
const money=(n:any,dp=0)=>n===null||n===undefined||!Number.isFinite(n)?'—':'₱'+n.toLocaleString('en-PH',{minimumFractionDigits:dp,maximumFractionDigits:dp});
const qty=(n:any,dp=2)=>n===null||n===undefined||!Number.isFinite(n)?'—':n.toLocaleString('en-PH',{maximumFractionDigits:dp,minimumFractionDigits:dp});
const dateLabel=(s:any)=>M.validDate(s)?new Date(s+'T12:00:00').toLocaleDateString('en-PH',{day:'numeric',month:'short',year:'numeric'}):'Date unknown';
const dateShort=(s:any)=>M.validDate(s)?new Date(s+'T12:00:00').toLocaleDateString('en-PH',{day:'numeric',month:'long'}):'Date unknown';
function workingDateTitle(date:string){const today=M.today();if(date===today)return{h1:'Today',eyebrow:'DAILY LOG'};if(date<today)return{h1:'Daily log · '+dateShort(date),eyebrow:'PAST DATE'};return{h1:'Upcoming · '+dateShort(date),eyebrow:'FUTURE DATE'};}
const clone=(s:any)=>JSON.parse(JSON.stringify(s));
const NATIVE=typeof navigator!=='undefined' && navigator.userAgent.indexOf('FlockLedger/1')>=0;
function nativeCall(op:string,data=''){return window.prompt('flock:'+op,data);}
function storeRead(){return NATIVE?nativeCall('load'):localStorage.getItem('flock-ledger-v1');}
function storeWrite(s:any){const text=JSON.stringify(s);if(text.length>4500000)throw new Error('The local ledger is near its 4.5 MB limit. Export a backup before removing old batches.');if(NATIVE){if(nativeCall('save',text)!=='ok')throw new Error('Android storage could not save the change. Your previous data has been kept.');}else localStorage.setItem('flock-ledger-v1',text);}
function saveDownload(name:string,text:string,mime='application/json'){if(NATIVE){const result=nativeCall('export',JSON.stringify({name,mime,text}));if(result!=='pending')throw new Error(result||'Export was not started.');return;}const u=URL.createObjectURL(new Blob([text],{type:mime}));const a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),3000);}
const ICONS:any={home:'M3 11l9-8 9 8M5 10v11h5v-7h4v7h5V10',log:'M5 3h14v18H5zM9 7h6M9 11h6M9 15h4',chart:'M4 4v16h17M7 15l4-5 4 2 5-7',flock:'M5 19v-5a7 7 0 0114 0v5M8 20h8M8 8V5h8v3',save:'M5 3h12l3 3v15H4V3zM8 3v6h8V3M8 21v-7h8v7',plus:'M12 5v14M5 12h14',arrow:'M5 12h14M14 7l5 5-5 5',close:'M6 6l12 12M18 6L6 18',edit:'M4 20l4-1 12-12-4-4L4 15v5M14 5l4 4',down:'M6 9l6 6 6-6',check:'M5 12l4 4L19 6',feed:'M5 7h14l2 14H3L5 7zM8 3h8M12 11v6',weight:'M5 8h14l2 13H3L5 8zM9 8V5a3 3 0 016 0v3',trash:'M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7',removal:'M15 3h6v18h-6M10 17l-5-5 5-5M5 12h12',info:'M12 11v6M12 7v.1M22 12a10 10 0 11-20 0 10 10 0 0120 0'};
const TYPELABEL:any={feed:'Feed purchase',usage:'Feed used',weigh:'Weighing',count:'Live count',loss:'Bird loss',harvest:'Harvest',expense:'Expense',budget:'Budget only',openingUsage:'Historical feed use',note:'Note'};
const ACTION_META:any={feed:{title:'Buy feed',save:'Save purchase',eyebrow:'FEED PURCHASE'},usage:{title:'Use feed',save:'Save feed use',eyebrow:'FEED USE'},weigh:{title:'Weigh birds',save:'Save weighing',eyebrow:'WEIGHING'},count:{title:'Count birds',save:'Save count',eyebrow:'LIVE COUNT'},loss:{title:'Loss / removal',save:'Save removal',eyebrow:'REMOVAL'},harvest:{title:'Harvest',save:'Save harvest',eyebrow:'HARVEST'},expense:{title:'Expense',save:'Save expense',eyebrow:'EXPENSE'},budget:{title:'Feed budget',save:'Save budget',eyebrow:'BUDGET'},openingUsage:{title:'Historical feed use',save:'Save historical use',eyebrow:'HISTORICAL USE'},note:{title:'Note',save:'Save note',eyebrow:'NOTE'}};
const CHOOSER:any[]=[['usage','Use feed'],['feed','Buy feed'],['weigh','Weigh birds'],['count','Count birds'],['loss','Loss / removal'],['expense','Expense'],['harvest','Harvest'],['note','Note'],['budget','Feed budget'],['openingUsage','Historical feed use']];
function Icon({name,size=20}:any){return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={ICONS[name]||ICONS.log}/></svg>;}
function Badge({children,kind='muted'}:any){return <span className={'badge '+kind}>{children}</span>;}
function Note({children,tone='info'}:any){return <div className={'note '+tone}><Icon name="info" size={17}/><div>{children}</div></div>;}
function Field({label,hint,children,wide=false}:any){return <label className={'field '+(wide?'wide':'')}><span>{label}</span>{children}{hint&&<small>{hint}</small>}</label>;}
function Metric({label,value,sub,accent=false}:any){return <div className={'metric '+(accent?'accent':'')}><span className="eyebrow">{label}</span><strong>{value}</strong><small>{sub}</small></div>;}
function Empty({title,text,action}:any){return <div className="empty"><Icon name="chart" size={30}/><h3>{title}</h3><p>{text}</p>{action}</div>;}
function SectionTitle({title,sub,action}:any){return <div className="section-heading"><div><h2>{title}</h2>{sub&&<p>{sub}</p>}</div>{action}</div>;}
function draftKey(cmd:any){return [cmd.action,cmd.batchId,cmd.date||'',cmd.lotId||'',cmd.event&&cmd.event.id||'',cmd.convert&&cmd.convert.id||''].join('|');}
function freshDraft(cmd:any){
  const e=cmd.event||(cmd.convert?{name:cmd.convert.name||'',cost:cmd.convert.cost,date:cmd.date||M.today(),phase:'unknown',type:'feed'}:{});
  const product=cmd.product||null;
  const defaults=M.purchaseDefaults(cmd.action==='feed'&&!e.id?product:e.type==='feed'?e:null);
  const date=e.date===null?'':(e.date||cmd.date||M.today());
  const weighMode=e.weights&&e.weights.length?'individual':e.method==='estimate'?'estimate':'average';
  return {
    date,name:e.name||defaults.name||'',phase:e.phase||defaults.phase||'unknown',
    cost:e.cost===undefined?'':String(e.cost),kg:e.kg===null||e.kg===undefined?'':String(e.kg),
    qtyUnknown:e.type==='feed'&&e.id?e.kg===null:false,qtyMode:'kg',sacks:'',packKg:cmd.packKg?String(cmd.packKg):'',
    lotId:e.lotId||cmd.lotId||'',extraLots:[],startDate:e.startDate||(date?M.addDays(date,-1):M.addDays(M.today(),-1)),
    periodMode:'daily',avgKg:e.avgKg===undefined?'':String(e.avgKg),minKg:e.minKg==null?'':String(e.minKg),
    maxKg:e.maxKg==null?'':String(e.maxKg),sampleN:e.sampleN==null?'':String(e.sampleN),method:e.method||'measured',
    weighMode,weighUnit:'kg',weights:e.weights?e.weights.join(', '):'',count:e.count===undefined?'':String(e.count),
    liveKg:e.liveKg==null?'':String(e.liveKg),dressedKg:e.dressedKg===undefined?'':String(e.dressedKg),
    revenue:e.revenue===undefined?'0':String(e.revenue),homeKg:e.homeKg===undefined?'0':String(e.homeKg),
    dest:e.type==='harvest'&&Number(e.revenue)>0?'cash':'home',note:e.note||'',detailsOpen:!!e.note,error:'',overlap:'',
    lastPriceOffer:product&&product.lastKg&&product.lastCost?product.lastCost/product.lastKg:null,lastPriceDate:product&&product.lastDate||null
  };
}
function draftDirty(cmd:any,s:any){
  const f=freshDraft(cmd);
  return ['name','phase','cost','kg','qtyUnknown','lotId','avgKg','minKg','maxKg','sampleN','weights','count','liveKg','dressedKg','revenue','homeKg','note','sacks','packKg','date','startDate','weighMode','weighUnit','qtyMode','periodMode','dest','method'].some(k=>String(s[k]??'')!==String(f[k]??'')) || (s.extraLots&&s.extraLots.length);
}
function LineChart({series,title,unit='kg',xLabel='Days since purchase',floorZero=false}:any){
  const all=series.reduce((a:any,s:any)=>a.concat(s.points),[]).filter((p:any)=>Number.isFinite(p.x)&&Number.isFinite(p.y));
  if(!all.length)return <Empty title="No chart data yet" text="Add a dated record to begin."/>;
  const W=720,H=220,L=8,R=8,T=12,B=12;
  let minX=Math.min(...all.map((p:any)=>p.x)), maxX=Math.max(...all.map((p:any)=>p.x));if(minX===maxX){minX-=1;maxX+=1;}
  let minY=floorZero?0:Math.min(...all.map((p:any)=>p.y)),maxY=Math.max(...all.map((p:any)=>p.y));let delta=maxY-minY||Math.max(1,maxY*.2);if(!floorZero)minY=Math.max(0,minY-delta*.12);maxY+=delta*.15;if(maxY===minY)maxY=minY+1;
  const x=(v:number)=>L+(v-minX)/(maxX-minX)*(W-L-R), y=(v:number)=>H-B-(v-minY)/(maxY-minY)*(H-T-B);
  const yfmt=(n:number)=>unit==='₱/kg'?'₱'+n.toFixed(0):n.toFixed(maxY<5?1:0);
  const yTicks=[0,1,2,3,4].map(i=>minY+(maxY-minY)*i/4);
  const xTicks=[0,1,2,3,4,5].map(i=>minX+(maxX-minX)*i/5);
  return <div className="chart"><div className="chart-legend">{series.map((s:any,i:number)=><span key={i}><i className={s.dash?'dashed':''} style={{borderColor:s.color}}/>{s.label}</span>)}</div>
    <div className="chart-plot">
      <div className="chart-y" aria-hidden="true">{yTicks.slice().reverse().map((val,i)=><span key={i}>{yfmt(val)}</span>)}</div>
      <div className="chart-svg-wrap">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title+'; '+unit+' by '+xLabel} preserveAspectRatio="none">
          {yTicks.map((val,i)=><line key={i} x1={L} x2={W-R} y1={y(val)} y2={y(val)} stroke="#e7e9e2"/>)}
          <line x1={L} x2={W-R} y1={H-B} y2={H-B} stroke="#bac2b5"/>
          {series.map((s:any,i:number)=><g key={i}>{s.connect!==false&&s.points.length>1&&<polyline fill="none" stroke={s.color} strokeWidth="2.7" strokeDasharray={s.dash?'7 6':undefined} points={s.points.map((p:any)=>`${x(p.x)},${y(p.y)}`).join(' ')}/>} {s.points.filter((p:any,j:number)=>s.markAll||s.points.length<5||j===0||j===s.points.length-1).map((p:any,j:number)=><circle key={j} cx={x(p.x)} cy={y(p.y)} r={s.connect===false?5:3} fill={s.open?'#fff':s.color} stroke={s.color} strokeWidth="2"><title>{`Day ${p.x}: ${unit==='₱/kg'?money(p.y,2):qty(p.y)+' '+unit}`}</title></circle>)}</g>)}
        </svg>
        <div className="chart-x" aria-hidden="true">{xTicks.map((val,i)=><span key={i}>{Math.round(val)}</span>)}</div>
      </div>
    </div>
    <small className="chart-caption">{xLabel}. {unit==='₱/kg'?'Focused vertical scale for comparing cost differences. ':''}Exact values are shown in the records or comparison table below.</small></div>;
}
function recordDescription(e:any,b:any){const p=b.events.find((x:any)=>x.id===e.lotId);switch(e.type){case'feed':return `${e.kg===null?'kg unknown':qty(e.kg)+' kg'} · ${e.phase} · ${money(e.cost)}${e.kg?' · '+money(e.cost/e.kg,2)+'/kg':''}`;case'usage':return `${qty(e.kg)} kg · ${p?.name||'Feed lot'} · ${dateLabel(e.startDate)} → ${dateLabel(e.date)}`;case'weigh':return `${qty(e.avgKg)} kg average${e.sampleN?' · '+e.sampleN+' weighed':''}${e.maxKg!==null?' · max '+qty(e.maxKg)+' kg':''}${e.method==='estimate'?' · estimate':''}`;case'count':return `${e.count} live birds counted`;case'loss':return `${e.count} birds removed`;case'harvest':return `${e.count} birds · ${qty(e.dressedKg)} kg dressed · ${money(e.revenue)} cash`;case'openingUsage':return `${money(e.cost)} historical feed used · no new cash expense`;case'note':return e.note||'Farm note';default:return money(e.cost);}}
class BatchForm extends React.Component<any,any>{
  constructor(props:any){super(props);const b=props.batch;this.state={name:b?.name||'',placementDate:b?.placementDate||M.today(),initialBirds:b?.initialBirds||'',chickCost:b?.chickCost===undefined?'':b.chickCost,ageAtPlacement:b?.ageAtPlacement===null||b?.ageAtPlacement===undefined?'':b.ageAtPlacement,placementEstimated:!!b?.placementEstimated,status:b?.status||'active',error:''};}
  render(){const s=this.state,change=(k:string,v:any)=>this.setState({[k]:v,error:''});return <form onSubmit={ev=>{ev.preventDefault();try{this.props.onSave({...s,initialBirds:Number(s.initialBirds),chickCost:Number(s.chickCost),ageAtPlacement:s.ageAtPlacement===''?null:Number(s.ageAtPlacement)});}catch(e:any){change('error',e.message);}}}><div className="modal-heading"><h2>{this.props.batch?'Edit batch':'Start a new batch'}</h2><button type="button" className="icon-btn" aria-label="Close" onClick={this.props.onCancel}><Icon name="close"/></button></div><div className="form-grid"><Field label="Batch name" wide><input value={s.name} maxLength={120} required onChange={e=>change('name',e.target.value)} placeholder="e.g. October broilers"/></Field><Field label="Date chicks were purchased"><input type="date" required value={s.placementDate} onChange={e=>change('placementDate',e.target.value)}/></Field><Field label="Date confidence"><select value={String(s.placementEstimated)} onChange={e=>change('placementEstimated',e.target.value==='true')}><option value="false">Known date</option><option value="true">Approximate / needs correction</option></select></Field><Field label="Number of chicks purchased"><input type="number" min="1" step="1" required value={s.initialBirds} onChange={e=>change('initialBirds',e.target.value)}/></Field><Field label="Total chick cost (₱)"><input type="number" min="0" step="0.01" required value={s.chickCost} onChange={e=>change('chickCost',e.target.value)}/></Field><Field label="Chick age at purchase (days)" hint="Leave blank when unknown. The app then uses days since purchase."><input type="number" min="0" max="180" step="1" value={s.ageAtPlacement} onChange={e=>change('ageAtPlacement',e.target.value)}/></Field><Field label="Status"><select value={s.status} onChange={e=>change('status',e.target.value)}><option value="active">Active</option><option value="closed">Closed / harvested</option></select></Field></div>{s.error&&<Note tone="error">{s.error}</Note>}<div className="modal-actions"><button type="button" className="btn secondary" onClick={this.props.onCancel}>Cancel</button><button className="btn primary" type="submit">Save batch</button></div></form>;}
}
function ActionChooser({onPick,onCancel}:any){
  return <div><div className="modal-heading"><div><span className="eyebrow">ADD</span><h2>Choose an action</h2></div><button type="button" className="icon-btn" aria-label="Close form" onClick={onCancel}><Icon name="close"/></button></div><p className="muted small-text">Choose an action to record.</p><div className="chooser-grid">{CHOOSER.map(([action,label])=><button key={action} type="button" className="chooser-btn" onClick={()=>onPick(action)}>{label}</button>)}</div></div>;
}
class TaskForm extends React.Component<any,any>{
  constructor(props:any){super(props);this.state=props.draft||freshDraft(props.command);}
  componentDidMount(){this.emit();}
  emit=()=>{if(this.props.onDraft)this.props.onDraft(this.state);};
  set=(k:string,v:any)=>this.setState({[k]:v,error:''},this.emit);
  input=(k:string,opts:any={})=><input type="number" inputMode="decimal" step="any" min="0" value={this.state[k]} onChange={e=>this.set(k,e.target.value)} {...opts}/>;
  endDate=()=>this.state.date||'';
  resolvedKg=()=>{const s=this.state;if(s.qtyUnknown)return null;if(s.qtyMode==='sacks'){const a=Number(s.sacks),p=Number(s.packKg);return a>0&&p>0?a*p:NaN;}return s.kg===''?NaN:Number(s.kg);};
  build=()=>{
    const s=this.state,cmd=this.props.command,n=(k:string,optional=false)=>s[k]===''?(optional?null:NaN):Number(s[k]);
    const base:any={id:cmd.eventId||cmd.event?.id||M.uid(),type:cmd.action,date:s.date||null,createdAt:cmd.event?.createdAt||new Date().toISOString(),note:s.note};
    if(['feed','expense','budget','openingUsage'].includes(cmd.action)){base.cost=n('cost');base.name=s.name.trim()||({feed:'Feed purchase',expense:'Batch expense',budget:'Feed budget',openingUsage:'Historical feed used'} as any)[cmd.action];}
    if(cmd.action==='feed'){base.kg=s.qtyUnknown?null:this.resolvedKg();base.phase=s.phase;}
    if(cmd.action==='usage'){
      const rows=[{lotId:s.lotId,kg:n('kg')}].concat((s.extraLots||[]).filter((r:any)=>r.lotId&&r.kg!=='').map((r:any)=>({lotId:r.lotId,kg:Number(r.kg)})));
      return rows.map((r:any,i:number)=>({...base,id:i===0?base.id:M.uid(),type:'usage',kg:r.kg,lotId:r.lotId,startDate:s.startDate||null,date:s.date||null}));
    }
    if(cmd.action==='weigh'){const n=M.normalizeWeighDraft(s);Object.assign(base,M.serializeWeigh(n.weighMode,n));}
    if(['count','loss','harvest'].includes(cmd.action))base.count=n('count');
    if(cmd.action==='harvest'){base.liveKg=n('liveKg',true);base.dressedKg=n('dressedKg');base.revenue=s.dest==='home'?0:n('revenue');base.homeKg=s.dest==='home'?(s.homeKg===''?n('dressedKg'):n('homeKg')):n('homeKg');}
    if(cmd.action==='openingUsage')base.kg=n('kg',true);
    if(cmd.action==='note')base.name=s.name.trim()||'Farm note';
    return [base];
  };
  save=(ev:any,andAnother=false)=>{ev.preventDefault();try{if(['weigh','count','loss','harvest','usage'].includes(this.props.command.action)&&!M.validDate(this.state.date))throw new Error('Date is required.');this.props.onSave(this.build(),{andAnother,command:this.props.command,packKg:Number(this.state.packKg)||undefined});}catch(err:any){this.setState({error:err.message});}};
  renderFeed(batch:any){
    const s=this.state,suggestions=M.productSuggestions(batch).filter((p:any)=>!s.name||p.name.toLowerCase().includes(s.name.toLowerCase()));
    const kg=this.resolvedKg();
    return <>
      <Field label="Brand / product name" wide><input value={s.name} maxLength={180} placeholder="e.g. Sarimanok Finisher Pellet" onChange={e=>this.set('name',e.target.value)}/></Field>
      {!!suggestions.length&&<div className="wide suggest-row">{suggestions.slice(0,6).map((p:any)=><button type="button" key={p.name+p.phase} className="chip" onClick={()=>{const d=M.purchaseDefaults(p);this.setState({name:d.name,phase:d.phase,lastPriceOffer:p.lastKg&&p.lastCost?p.lastCost/p.lastKg:null,lastPriceDate:p.lastDate,error:''},this.emit);}}>{p.name} · {p.phase}</button>)}</div>}
      <Field label="Feed stage"><select value={s.phase} onChange={e=>this.set('phase',e.target.value)}>{['unknown','starter','grower','finisher','booster','other'].map(v=><option key={v} value={v}>{v[0].toUpperCase()+v.slice(1)}</option>)}</select></Field>
      <Field label="Date" hint="Leave empty only when the original date is unknown."><input type="date" value={s.date} min={batch.placementDate} onChange={e=>this.set('date',e.target.value)}/></Field>
      <div className="wide mode-tabs" role="tablist" aria-label="Quantity mode">
        <button type="button" className={s.qtyMode==='kg'&&!s.qtyUnknown?'active':''} onClick={()=>this.setState({qtyMode:'kg',qtyUnknown:false},this.emit)}>Total kilograms</button>
        <button type="button" className={s.qtyMode==='sacks'&&!s.qtyUnknown?'active':''} onClick={()=>this.setState({qtyMode:'sacks',qtyUnknown:false},this.emit)}>Sacks</button>
        <button type="button" className={s.qtyUnknown?'active':''} onClick={()=>this.setState({qtyUnknown:true,kg:''},this.emit)}>Quantity unknown</button>
      </div>
      {!s.qtyUnknown&&s.qtyMode==='kg'&&<Field label="Total kilograms purchased" hint="All sacks combined. Leave blank only by choosing Quantity unknown.">{this.input('kg',{placeholder:'e.g. 100'})}</Field>}
      {!s.qtyUnknown&&s.qtyMode==='sacks'&&<><Field label="Number of sacks">{this.input('sacks')}</Field><Field label="Kilograms per sack" hint="Enter the actual pack size. 50 kg is never assumed.">{this.input('packKg')}</Field><div className="field"><span>Total kilograms</span><strong className="calculated">{Number.isFinite(kg)?qty(kg)+' kg':'—'}</strong></div></>}
      {s.qtyUnknown&&<div className="wide"><Note tone="warn">Quantity unknown — unavailable for lot-based feed-use logging. The cash amount is still recorded.</Note></div>}
      <Field label="Total amount (₱)">{this.input('cost',{required:true,placeholder:'e.g. 3000'})}</Field>
      {Number.isFinite(kg)&&kg>0&&s.cost!==''&&<div className="field"><span>Calculated price</span><strong className="calculated">{money(Number(s.cost)/kg,2)} / kg</strong><small>{money(Number(s.cost)/kg*50)} per 50 kg equivalent (display only)</small></div>}
      {s.lastPriceOffer&&<div className="wide"><button type="button" className="text-btn" onClick={()=>{if(!Number.isFinite(kg)||kg<=0){this.setState({error:'Enter kilograms first to use the last recorded price.'});return;}this.setState({cost:String(Math.round(s.lastPriceOffer*kg*100)/100)},this.emit);}}>Last recorded price: {money(s.lastPriceOffer,2)}/kg{s.lastPriceDate?' · recorded on '+dateLabel(s.lastPriceDate):''} · Use this price</button></div>}
    </>;
  }
  renderUsage(batch:any){
    const s=this.state,end=this.endDate(),lots=M.eligibleLots(batch,end,this.props.command.event);
    const locked=!!this.props.command.lotId && !this.props.command.event;
    const selected=lots.find((p:any)=>p.id===s.lotId)||batch.events.find((e:any)=>e.id===s.lotId);
    const previewKg=s.kg===''?NaN:Number(s.kg);
    const previewEvent=s.lotId&&Number.isFinite(previewKg)&&previewKg>0?{id:this.props.command.event?.id||this.props.command.eventId||'preview-usage',type:'usage',lotId:s.lotId,kg:previewKg,startDate:s.startDate,date:end,createdAt:this.props.command.event?.createdAt||new Date().toISOString(),note:s.note||''}:null;
    const candidate=previewEvent?M.candidateBatch(batch,[previewEvent]):batch;
    const bal=s.lotId?M.lotBalances(candidate,s.lotId,end):null;
    const afterAll=s.lotId&&previewEvent?M.lotBalances(candidate,s.lotId):null;
    const prev=batch.events.filter((e:any)=>e.type==='usage').sort((a:any,c:any)=>(c.date||'').localeCompare(a.date||''))[0];
    const similar=s.lotId&&batch.events.find((e:any)=>e.type==='usage'&&e.lotId===s.lotId&&e.date===end&&e.startDate===s.startDate&&(!this.props.command.event||e.id!==this.props.command.event.id));
    return <>
      <Field label={s.periodMode==='period'?'Period end (inclusive)':'Date'}><input type="date" value={s.date} min={batch.placementDate} onChange={e=>{const date=e.target.value;this.setState({date,startDate:s.periodMode==='daily'&&date?M.addDays(date,-1):s.startDate},this.emit);}}/></Field>
      <div className="wide mode-tabs" role="tablist" aria-label="Usage period">
        <button type="button" className={s.periodMode==='daily'?'active':''} onClick={()=>this.setState({periodMode:'daily',startDate:s.date?M.addDays(s.date,-1):s.startDate},this.emit)}>Daily amount</button>
        <button type="button" className={s.periodMode==='period'?'active':''} onClick={()=>this.set('periodMode','period')}>Choose period</button>
        <button type="button" className={s.periodMode==='since'?'active':''} disabled={!prev} onClick={()=>this.setState({periodMode:'since',startDate:prev.date},this.emit)}>Since a previous log</button>
      </div>
      {s.periodMode==='daily'&&<div className="wide"><Note>Daily amount for {dateLabel(end)}. Feed used after {dateLabel(s.startDate)} through {dateLabel(end)} <details><summary>Why these dates?</summary>Usage is stored as (start date, end date]. Consecutive calendar dates are one day.</details></Note></div>}
      {s.periodMode!=='daily'&&<Field label="Period start (exclusive)"><input type="date" value={s.startDate} min={batch.placementDate} onChange={e=>this.set('startDate',e.target.value)}/></Field>}
      {s.periodMode==='since'&&prev&&<div className="wide"><Note>Previous logged endpoint: {dateLabel(prev.date)}. This is a convenience you chose, not an assumption that every unlogged day belongs here.</Note></div>}
      {locked&&selected&&<div className="wide entry-context"><strong>{selected.name||'Feed lot'}</strong><small>{dateLabel(selected.date)} · {(selected.id||'').slice(-6)}</small></div>}
      {!locked&&!lots.length&&<div className="wide"><Note tone="warn">No eligible purchase lot for this date. Buy feed with a known quantity first.</Note><button type="button" className="btn secondary small" onClick={this.props.onBuyFeed}>Buy feed</button></div>}
      {!locked&&lots.length>0&&<div className="wide lot-choices">{lots.map((p:any)=><button type="button" key={p.id} className={'lot-choice '+(s.lotId===p.id?'active':'')} onClick={()=>this.set('lotId',p.id)}><strong>{p.name}</strong><small>{dateLabel(p.date)} · {qty(p.remaining)} kg remaining</small></button>)}</div>}
      <Field label="Kilograms used in this period" hint="Include feed lost at the feeder. Unused stock stays in inventory.">{this.input('kg',{required:true})}</Field>
      {bal&&<div className="wide live-preview"><div>Stock recorded at this date: <strong>{qty(bal.balanceAtDate)} kg</strong></div><div>Quantity still available after all recorded usage: <strong>{qty((afterAll||bal).remainingAfterAll)} kg</strong></div>{afterAll&&<div>Recorded stock after this entry: <strong>{qty(afterAll.remainingAfterAll)} kg</strong></div>}</div>}
      {similar&&s.overlap!=='additional'&&<div className="wide"><Note tone="warn">A {qty(similar.kg)} kg entry already exists for this lot and period. <button type="button" className="text-btn" onClick={()=>this.props.onEdit(similar)}>Edit existing entry</button> · <button type="button" className="text-btn" onClick={()=>this.set('overlap','additional')}>Record an additional amount</button></Note></div>}
      <div className="wide"><button type="button" className="text-btn" onClick={()=>this.setState({extraLots:s.extraLots.concat([{lotId:'',kg:''}])},this.emit)}>Use another lot</button></div>
      {s.extraLots.map((row:any,i:number)=><div className="wide extra-lot" key={i}><Field label="Additional lot"><div className="lot-choices compact">{lots.filter((p:any)=>p.id!==s.lotId).map((p:any)=><button type="button" key={p.id} className={'lot-choice '+(row.lotId===p.id?'active':'')} onClick={()=>{const extraLots=s.extraLots.slice();extraLots[i]={...row,lotId:p.id};this.setState({extraLots},this.emit);}}>{p.name} · {qty(p.remaining)} kg</button>)}</div></Field><Field label="Kilograms from this lot"><input type="number" min="0" step="any" value={row.kg} onChange={e=>{const extraLots=s.extraLots.slice();extraLots[i]={...row,kg:e.target.value};this.setState({extraLots},this.emit);}}/></Field></div>)}
    </>;
  }
  renderWeigh(){
    const s=this.state,normalized=s.weighMode==='individual'?M.normalizeWeighDraft(s):null,parsed=normalized?M.parseWeightList(normalized.weights):null;
    const unit=s.weighUnit==='g'?'g':'kg';
    return <>
      <div className="wide mode-tabs" role="tablist" aria-label="Weighing mode">
        <button type="button" className={s.weighMode==='average'?'active':''} onClick={()=>this.set('weighMode','average')}>Measured average</button>
        <button type="button" className={s.weighMode==='individual'?'active':''} onClick={()=>this.set('weighMode','individual')}>Individual weights</button>
        <button type="button" className={s.weighMode==='estimate'?'active':''} onClick={()=>this.set('weighMode','estimate')}>Estimate</button>
      </div>
      <Field label="Date"><input type="date" value={s.date} min={this.props.batch.placementDate} onChange={e=>this.set('date',e.target.value)}/></Field>
      <Field label="Unit"><select aria-label="Unit" value={s.weighUnit} onChange={e=>this.set('weighUnit',e.target.value)}><option value="kg">Kilograms</option><option value="g">Grams (converted to kg)</option></select></Field>
      {s.weighMode==='average'&&<><Field label={`Average live weight (${unit})`}>{this.input('avgKg',{required:true})}</Field><Field label="Number of birds weighed" hint="Do not reuse a previous sample size as if it were observed again.">{this.input('sampleN',{step:1,required:true})}</Field></>}
      {s.weighMode==='individual'&&<><Field label={`Individual weights (${unit})`} wide hint="Separate birds with commas, spaces, or new lines. A period is the decimal mark."><textarea rows={3} placeholder={unit==='g'?'1000, 1100, 1200':'0.98, 1.04, 1.10, 0.95'} value={s.weights} onChange={e=>this.set('weights',e.target.value)}/></Field>
      <div className="wide live-preview">{parsed&&!parsed.error&&parsed.sampleN?<><div>Birds entered: <strong>{parsed.sampleN}</strong></div><div>Average: <strong>{qty(parsed.avgKg)} kg</strong></div><div>Minimum: <strong>{qty(parsed.minKg)} kg</strong></div><div>Maximum: <strong>{qty(parsed.maxKg)} kg</strong></div></>:<span className="muted">{parsed&&parsed.error?parsed.error:'Add weights to preview the sample.'}</span>}</div></>}
      {s.weighMode==='estimate'&&<><Field label={`Estimated average live weight (${unit})`}>{this.input('avgKg',{required:true})}</Field><div className="wide"><Note tone="warn">This stays an estimate. It is not a measured sample and will not create observed daily gain by itself.</Note></div></>}
    </>;
  }
  renderCount(batch:any){
    const s=this.state,live=M.headcount(batch,this.endDate()),same=batch.events.filter((e:any)=>['count','loss','harvest'].includes(e.type)&&e.date===s.date);
    const predicted=s.count===''?null:Number(s.count);
    return <>
      <Field label="Date"><input type="date" value={s.date} min={batch.placementDate} onChange={e=>this.set('date',e.target.value)}/></Field>
      <Field label="Birds actually alive and present" hint="This records a count. It does not subtract birds." wide>{this.input('count',{step:1,required:true})}</Field>
      <div className="wide"><Note>Currently recorded: {live.confirmed?live.count+' live birds, last counted, less subsequent recorded removals':live.count+' on the ledger; not a verified live count'}.</Note></div>
      <div className="wide"><button type="button" className="text-btn" onClick={()=>this.set('count',String(live.count))}>Use displayed ledger count ({live.count})</button></div>
      {!!same.length&&<div className="wide"><Note>Same-date count or removal records already exist. A later-created same-date loss will reduce an earlier count. Counts are not treated as end-of-day totals.</Note>{same.map((e:any)=><button key={e.id} type="button" className="text-btn" onClick={()=>this.props.onEdit(e)}>{TYPELABEL[e.type]} · {e.count} · {dateLabel(e.date)}</button>)}</div>}
      {predicted!==null&&live.confirmed===false&&<p className="muted small-text">Saving this count will become the verified live snapshot for later removals.</p>}
    </>;
  }
  renderLoss(batch:any){
    const s=this.state,previewCount=s.count===''?NaN:Number(s.count);
    const previewEvent=Number.isFinite(previewCount)?{id:this.props.command.event?.id||this.props.command.eventId||'preview-loss',type:'loss',count:previewCount,date:this.endDate(),createdAt:this.props.command.event?.createdAt||new Date().toISOString(),note:s.note||''}:null;
    const candidate=previewEvent?M.candidateBatch(batch,[previewEvent]):batch;
    const live=M.headcount(batch,this.endDate()),after=previewEvent?M.headcount(candidate,this.endDate()).count:null;
    const same=batch.events.filter((e:any)=>['count','loss','harvest'].includes(e.type)&&e.date===s.date);
    return <>
      <Field label="Date"><input type="date" value={s.date} min={batch.placementDate} onChange={e=>this.set('date',e.target.value)}/></Field>
      <Field label="Birds lost or removed" wide>{this.input('count',{step:1,required:true})}</Field>
      {after!==null&&<div className="wide live-preview">Predicted ledger count after this removal: <strong>{after}</strong> <small>({live.label})</small></div>}
      {!!same.length&&<div className="wide"><Note>A later-created same-date loss will reduce an earlier count from this date. This does not create a second count record.</Note></div>}
    </>;
  }
  renderHarvest(){
    const s=this.state;
    return <>
      <Field label="Date"><input type="date" value={s.date} min={this.props.batch.placementDate} onChange={e=>this.set('date',e.target.value)}/></Field>
      <Field label="Birds harvested">{this.input('count',{step:1,required:true})}</Field>
      <Field label="Total dressed kilograms">{this.input('dressedKg',{required:true})}</Field>
      <div className="wide mode-tabs" role="tablist" aria-label="Destination">
        <button type="button" className={s.dest==='cash'?'active':''} onClick={()=>this.set('dest','cash')}>Cash received</button>
        <button type="button" className={s.dest==='home'?'active':''} onClick={()=>this.setState({dest:'home',revenue:'0'},this.emit)}>Home consumption</button>
      </div>
      {s.dest==='cash'&&<Field label="Cash received for this harvest (₱)">{this.input('revenue',{required:true})}</Field>}
      {s.dest==='home'&&<Note>Home consumption is recorded as 0 cash, not a retail-equivalent estimate.</Note>}
      <Field label="Dressed kg kept for home">{this.input('homeKg',{required:true})}</Field>
    </>;
  }
  renderSimple(batch:any){
    const s=this.state,a=this.props.command.action;
    return <>
      <Field label="Date" hint={['feed','expense','budget','openingUsage','note'].includes(a)?'Leave empty only when the original date is unknown.':undefined}><input type="date" value={s.date} min={batch.placementDate} onChange={e=>this.set('date',e.target.value)}/></Field>
      {a!=='note'&&<Field label="Description"><input value={s.name} maxLength={180} onChange={e=>this.set('name',e.target.value)}/></Field>}
      {['expense','budget','openingUsage'].includes(a)&&<Field label={a==='openingUsage'?'Cost of feed already USED (₱)':'Total amount (₱)'} hint={a==='openingUsage'?'Not a new payment; must already appear in feed purchases.':undefined}>{this.input('cost',{required:true})}</Field>}
      {a==='openingUsage'&&<><div className="wide"><Note tone="warn">Use only for feed used before detailed tracking. Do not also log the same feed as lot usage. This entry adds production cost, not another cash payment.</Note></div><Field label="Historical kg used (optional)">{this.input('kg')}</Field></>}
    </>;
  }
  render(){
    const s=this.state,cmd=this.props.command,meta=ACTION_META[cmd.action],batch=this.props.batch,bname=batch.name;
    const details=cmd.action==='weigh'&&s.weighMode==='average'||cmd.action==='harvest'||cmd.action!=='note';
    return <form onSubmit={e=>this.save(e,false)}>
      <div className="modal-heading"><div><span className="eyebrow">{cmd.event?'EDIT':'TASK'}</span><h2>{meta.title}</h2></div><button type="button" className="icon-btn" aria-label="Close form" onClick={this.props.onCancel}><Icon name="close"/></button></div>
      <div className="entry-context"><span>{bname}</span><span>{s.date?dateLabel(s.date):(cmd.event?'Date unknown':'Date required')}</span></div>
      {cmd.convert&&<Note>Planned budget: {money(cmd.convert.cost)}. This plan will be replaced by the purchase you save. Enter the actual kilograms and amount paid, or <button type="button" className="text-btn" onClick={()=>this.set('cost',String(cmd.convert.cost))}>adopt the planned amount</button>.</Note>}
      <div className="form-grid">
        {cmd.action==='feed'&&this.renderFeed(batch)}
        {cmd.action==='usage'&&this.renderUsage(batch)}
        {cmd.action==='weigh'&&this.renderWeigh()}
        {cmd.action==='count'&&this.renderCount(batch)}
        {cmd.action==='loss'&&this.renderLoss(batch)}
        {cmd.action==='harvest'&&this.renderHarvest()}
        {['expense','budget','openingUsage','note'].includes(cmd.action)&&this.renderSimple(batch)}
        {cmd.action==='weigh'&&s.weighMode==='average'&&s.detailsOpen&&<><Field label="Smallest bird (kg, optional)">{this.input('minKg')}</Field><Field label="Largest bird (kg, optional)">{this.input('maxKg')}</Field></>}
        {cmd.action==='harvest'&&s.detailsOpen&&<Field label="Total live weight (kg, optional)">{this.input('liveKg')}</Field>}
        {cmd.action==='note'?<Field label="Notes" wide><textarea rows={5} maxLength={5000} value={s.note} onChange={e=>this.set('note',e.target.value)}/></Field>:s.detailsOpen?<Field label="Notes" wide><textarea rows={3} maxLength={5000} value={s.note} onChange={e=>this.set('note',e.target.value)} placeholder="Supplier, feed quality, flock health, or anything worth remembering."/></Field>:<div className="wide"><button type="button" className="text-btn" onClick={()=>this.set('detailsOpen',true)}>Optional details and notes</button></div>}
      </div>
      {s.error&&<Note tone="error">{s.error}{ /exceeds the birds/.test(s.error)&&(()=>{const block=M.blockingCountRecord(batch,Number(s.count),s.date||M.today());return block?<button type="button" className="text-btn" onClick={()=>block.id&&this.props.onEdit(block)}>Open earlier {block.type==='placement'?'placement':TYPELABEL[block.type]||block.type}</button>:null;})()}</Note>}
      <div className="modal-actions">
        <button type="button" className="btn secondary" onClick={this.props.onCancel}>Cancel</button>
        <button type="button" className="btn secondary" onClick={e=>this.save(e,true)}>Save and another</button>
        <button type="submit" className="btn primary"><Icon name="check"/>{meta.save}</button>
      </div>
    </form>;
  }
}
class App extends React.Component<any,any>{
  constructor(props:any){super(props);let data:any=null,error='';try{const raw=storeRead();data=raw?M.validateState(JSON.parse(raw)):M.seededState();if(!raw)storeWrite(data);}catch(e:any){error=e.message;}
    this.state={data,tab:'today',morePage:'menu',modal:null,toast:'',filter:'all',recordSearch:'',recordFrom:'',recordTo:'',recordsShown:50,scenarioDraft:null,selectedDay:null,showModelOverlay:false,forecastProposal:null,forecastStartReview:null,scenarioProvenance:null,importText:'',importError:'',storageError:error,loadError:!data?error:'',capitalDraft:{name:'',cost:'',date:''},selectedDate:M.today(),pendingDraft:null,lastSave:null};
  }
  componentDidMount(){(window as any).checkPendingImport=()=>{if(NATIVE){const text=nativeCall('take-import');if(text)(window as any).receiveNativeBackup(text);}};(window as any).receiveNativeBackup=(text:string)=>{const hasBatches=!!(this.state.data&&this.state.data.batches&&this.state.data.batches.length);this.setState({tab:hasBatches?'more':'backup',morePage:'backup',importText:text,importError:''});};(window as any).nativeNotice=(s:string)=>this.toast(s);(window as any).nativeBack=()=>{if(this.state.modal){this.dismissEditor();return true;}if(this.state.tab==='more'&&this.state.morePage!=='menu'){this.setState({morePage:'menu'});return true;}if(this.state.tab!=='today'){this.setState({tab:'today',morePage:'menu'});return true;}return false;};window.addEventListener('keydown',this.keydown);(window as any).checkPendingImport();}
  componentWillUnmount(){window.removeEventListener('keydown',this.keydown);}
  keydown=(e:KeyboardEvent)=>{if(e.key==='Escape'&&this.state.modal)this.dismissEditor();};
  b=()=>this.state.data.batches.find((b:any)=>b.id===this.state.data.selectedBatchId);
  toast=(msg:string)=>{if(!msg)return;this.setState({toast:msg});setTimeout(()=>this.setState({toast:''}),5200);};
  commit=(data:any,msg?:string)=>{M.validateState(data);storeWrite(data);this.setState({data,storageError:''});if(msg!=='')this.toast(msg===undefined?'Saved on this device':msg);};
  mutate=(fn:any,msg?:string)=>{const d=clone(this.state.data);fn(d,d.batches.find((b:any)=>b.id===d.selectedBatchId));this.commit(d,msg);};
  ui=()=>(this.state.data.settings&&this.state.data.settings.ui)||{};
  persistDraft=(cmd:any,draft:any)=>{try{this.mutate((d:any)=>{d.settings.ui=d.settings.ui||{};d.settings.ui.drafts=d.settings.ui.drafts||{};d.settings.ui.drafts[draftKey(cmd)]=draft;},'');}catch(e:any){this.toast(e.message);}};
  clearDraft=(cmd:any)=>{try{this.mutate((d:any)=>{if(!d.settings.ui||!d.settings.ui.drafts)return;delete d.settings.ui.drafts[draftKey(cmd)];},'');}catch(e){/* keep going */}};
  dismissEditor=()=>{const modal=this.state.modal;if(modal&&modal.kind==='task'&&this.state.pendingDraft&&draftDirty(modal.command,this.state.pendingDraft))this.persistDraft(modal.command,this.state.pendingDraft);this.setState({modal:null,pendingDraft:null});};
  openAction=(partial:any)=>{
    const batchId=partial.batchId||this.b()?.id;
    const date=partial.date!==undefined?partial.date:(this.state.selectedDate||M.today());
    const command:any={action:partial.action,batchId,date,lotId:partial.lotId,product:partial.product,packKg:partial.packKg||this.ui().packKg,event:partial.event||null,convert:partial.convert||null,eventId:partial.event?partial.event.id:M.uid(),budgetId:partial.convert&&partial.convert.id};
    if(partial.action==='usage'&&!command.lotId&&!command.event){
      const lots=M.eligibleLots(this.state.data.batches.find((b:any)=>b.id===batchId),date);
      if(lots.length===1)command.lotId=lots[0].id;
      else if(this.ui().lastLotId&&lots.some((p:any)=>p.id===this.ui().lastLotId))command.lotId=this.ui().lastLotId;
    }
    const stored=(this.ui().drafts||{})[draftKey(command)];
    this.setState({modal:{kind:'task',command},pendingDraft:stored||null});
  };
  openChooser=()=>this.setState({modal:{kind:'chooser'},pendingDraft:null});
  saveRecords=(records:any[],opts:any)=>{
    const cmd=opts.command,batchId=cmd.batchId;
    const snapshot=clone(this.state.data);
    const d=clone(this.state.data);
    const next=M.applyEvents(d,batchId,records,cmd.convert?[cmd.convert.id]:[]);
    const last=records[0];
    const ui={...(next.settings.ui||{})};ui.drafts={...(ui.drafts||{})};delete ui.drafts[draftKey(cmd)];
    if(last.type==='usage')ui.lastLotId=last.lotId;
    if(last.type==='feed'&&opts.packKg)ui.packKg=opts.packKg;
    next.settings.ui=ui;
    M.validateState(next);
    storeWrite(next);
    const b=next.batches.find((x:any)=>x.id===batchId);
    const msg=this.consequence(records,b);
    this.setState({data:next,storageError:'',lastSave:{events:records,batchId,message:msg,snapshot},pendingDraft:null});
    if(opts.andAnother){
      const again:any={action:cmd.action,batchId,date:cmd.date,lotId:cmd.action==='usage'?cmd.lotId||last.lotId:undefined};
      if(cmd.action==='feed')again.product={name:last.name,phase:last.phase,lastKg:last.kg,lastCost:last.cost,lastDate:last.date};
      this.openAction(again);
    } else this.setState({modal:null});
    this.toast(msg);
  };
  undoLastChange=()=>{
    const ls=this.state.lastSave;if(!ls||!ls.snapshot)return;
    try{storeWrite(ls.snapshot);this.setState({data:ls.snapshot,lastSave:null,storageError:''});this.toast('Last change undone');}catch(e:any){this.toast(e.message);}
  };
  consequence=(records:any[],b:any)=>{
    const e=records[0];
    if(e.type==='usage'){const lot=b.events.find((x:any)=>x.id===e.lotId);const rem=M.lotBalances(b,e.lotId);const total=M.sum(records.map((r:any)=>r.kg));return `Feed used: ${qty(total)} kg · ${lot?.name||'lot'} · ${qty(rem&&rem.remainingAfterAll)} kg recorded stock remaining`;}
    if(e.type==='feed')return `Feed purchased: ${e.kg===null?'quantity unknown':qty(e.kg)+' kg'} · ${money(e.cost)}`;
    if(e.type==='weigh')return e.method==='estimate'?`Weight estimate: ${qty(e.avgKg)} kg`:`Weighed: ${qty(e.avgKg)} kg average`;
    if(e.type==='count')return `Counted ${e.count} live birds`;
    if(e.type==='loss')return `Recorded ${e.count} birds removed`;
    return TYPELABEL[e.type]+' saved';
  };
  deleteRecord=(event:any)=>{
    const name=(event.name||TYPELABEL[event.type]||'record').toLowerCase();
    const extra=event.type==='usage'?' Recorded stock and production cost will change.':event.type==='feed'?' Usage entries that depend on this purchase will block deletion.':' This can change stock and costs.';
    if(!window.confirm(`Delete this ${name}?${extra}`))return;
    try{this.mutate((d:any,b:any)=>{b.events=b.events.filter((e:any)=>e.id!==event.id);},'Record deleted');this.setState({lastSave:null});}catch(e:any){this.toast(e.message);}
  };
  capital=()=>M.sum(this.state.data.settings.capital.map((a:any)=>a.cost));
  projection=()=>M.forecast(this.b(),this.state.scenarioDraft||this.b().forecast,this.capital(),this.state.data.settings.recoveryBatches);
  switchTab=(tab:string)=>{this.setState({tab,morePage:tab==='more'&&this.state.tab==='more'?this.state.morePage:'menu'});window.scrollTo(0,0);};
  openMore=(page:string)=>{this.setState({tab:'more',morePage:page});window.scrollTo(0,0);};
  workingDateBar=()=>{
    const date=this.state.selectedDate||M.today(),away=date!==M.today();
    return <div className="working-date"><Field label="Working date"><input type="date" aria-label="Selected date" value={date} onChange={e=>this.setState({selectedDate:e.target.value})}/></Field>{away&&<button type="button" className="btn secondary" onClick={()=>this.setState({selectedDate:M.today()})}>Return to today</button>}</div>;
  };
  renderLastSave(b:any){
    const ls=this.state.lastSave;if(!ls||ls.batchId!==b.id)return null;
    return <section className="card consequence"><strong>{ls.message}</strong><div className="button-row">{ls.events.map((e:any)=><button key={e.id} type="button" className="text-btn" onClick={()=>this.openAction({action:e.type,event:e})}>Edit</button>)}{ls.snapshot&&<button type="button" className="text-btn" onClick={this.undoLastChange}>Undo last change</button>}{ls.events[0].type==='feed'&&ls.events[0].kg!==null&&<button type="button" className="text-btn" onClick={()=>this.openAction({action:'usage',lotId:ls.events[0].id,date:this.state.selectedDate})}>Log use from this purchase</button>}</div></section>;
  }
  renderToday(){
    const b=this.b(),date=this.state.selectedDate||M.today(),s=M.summary(b,date),perf=M.recentPerformance(b,date),f=this.projection();
    const heading=workingDateTitle(date),preStart=M.validDate(date)&&date<b.placementDate;
    const pts=M.weighSeriesPoints(b).filter((w:any)=>!w.date||w.date<=date),live=M.headcount(b,date),age=M.days(b.placementDate,date);
    const series:any=[{label:'Measured sample',color:'#395a43',markAll:true,points:pts.filter((w:any)=>w.method==='measured')},{label:'Rough estimate',color:'#a57636',connect:false,open:true,points:pts.filter((w:any)=>w.method==='estimate')}];
    if(this.state.showModelOverlay&&f.rows.length)series.push({label:'Editable scenario, not a prediction',color:'#788570',dash:true,points:f.rows.filter((r:any)=>r.date<=date).map((r:any)=>({x:r.day,y:r.weight}))});
    const attention=M.attentionItems(b,date);
    const todayEntries=b.events.filter((e:any)=>e.date===date).sort((a:any,c:any)=>(c.createdAt||'').localeCompare(a.createdAt||''));
    const latestMeasured=M.latestWeigh(b,date,true);
    const latestAny=M.latestWeigh(b,date,false);
    const latestEstimate=latestAny&&latestAny.method==='estimate'?latestAny:null;
    const unknownLots=(s.inventoryIncomplete?b.events.filter((e:any)=>e.type==='feed'&&e.kg===null&&(!e.date||e.date<=date)).length:0);
    const birdValue=preStart?'—':(live.confirmed?live.count+' birds':'Not counted');
    const birdSub=preStart?'Batch not started on this date':(live.confirmed?`Counted ${dateLabel(live.confirmedOn)}, less later recorded removals`:`${b.initialBirds} purchased, less recorded removals`);
    const weightMain=latestMeasured?qty(latestMeasured.avgKg)+' kg':(latestEstimate?qty(latestEstimate.avgKg)+' kg':'Not recorded');
    const weightSub=latestMeasured?`Measured average · ${dateLabel(latestMeasured.date)}`:(latestEstimate?`Estimate · ${dateLabel(latestEstimate.date)}`:'No weighing recorded');
    const stockValue=preStart?'—':(!b.events.some((e:any)=>e.type==='feed'&&(!e.date||e.date<=date))?'No feed purchases recorded':qty(s.inventoryKg)+' kg known remaining');
    const stockSub=preStart?'Batch not started on this date':(unknownLots?`${unknownLots} purchase${unknownLots===1?' has':'s have'} an unknown quantity`:(s.inventoryKg===0?'0 kg recorded remaining':'Known remaining kilograms'));
    return <>
      <div className="batch-context"><div><span className="eyebrow">BATCH</span><strong>{b.name}</strong><p>{preStart?'Batch not started on this date':(age<0?'Purchase is in the future':`Day ${age} since purchase`)}{b.placementEstimated?' · Purchase date approximate':''} · {dateLabel(b.placementDate)}</p></div><button className="btn secondary" onClick={()=>this.setState({modal:{kind:'batch',batch:b}})}>Edit batch</button></div>
      <div className="page-title"><div><span className="eyebrow">{heading.eyebrow}</span><h1>{heading.h1}</h1></div></div>
      {this.workingDateBar()}
      <div className="quick-actions eight">
        <button className="primary-action" onClick={()=>this.openAction({action:'usage',date})}><Icon name="log"/><span>Use feed</span></button>
        <button onClick={()=>this.openAction({action:'feed',date})}><Icon name="feed"/><span>Buy feed</span></button>
        <button onClick={()=>this.openAction({action:'weigh',date})}><Icon name="weight"/><span>Weigh birds</span></button>
        <button onClick={()=>this.openAction({action:'count',date})}><Icon name="flock"/><span>Count birds</span></button>
        <button onClick={()=>this.openAction({action:'loss',date})}><Icon name="removal"/><span>Loss / removal</span></button>
        <button onClick={()=>this.openAction({action:'expense',date})}><Icon name="log"/><span>Expense</span></button>
        <button onClick={()=>this.openAction({action:'harvest',date})}><Icon name="arrow"/><span>Harvest</span></button>
        <button onClick={()=>this.openAction({action:'note',date})}><Icon name="edit"/><span>Note</span></button>
      </div>
      {preStart&&<Note>Batch not started on this date. Purchased birds and chick cost are not treated as already present.</Note>}
      <div className="metrics three"><Metric label="Birds" value={birdValue} sub={birdSub}/><Metric label="Average weight" value={weightMain} sub={<>{weightSub}{latestMeasured&&latestEstimate&&latestEstimate.date>latestMeasured.date&&<span className="estimate-line">Later estimate: {qty(latestEstimate.avgKg)} kg · {dateLabel(latestEstimate.date)}</span>}</>}/><Metric label="Recorded feed stock" value={stockValue} sub={stockSub}/></div>
      {this.renderLastSave(b)}
      <section className="card"><SectionTitle title="Entries" sub={dateLabel(date)}/>{!todayEntries.length?<div className="empty-log"><strong>No entries recorded for this date.</strong><p className="muted small-text">An empty log does not establish whether the work was performed.</p></div>:todayEntries.map((e:any)=><div className="log-row" key={e.id}><div><strong>{e.type==='weigh'&&e.method==='estimate'?'Estimated weighing':TYPELABEL[e.type]}</strong><small>{recordDescription(e,b)}</small></div><div className="log-row-meta"><span className="date">{dateLabel(e.date)}</span><button className="text-btn" onClick={()=>this.openAction({action:e.type,event:e})}>Edit</button></div></div>)}</section>
      {!!attention.length&&<section className="card"><SectionTitle title="Record gaps"/><div>{attention.map((item:any)=><div className="attention-item" key={item.key}><div><strong>{item.title}</strong>{item.detail&&<p>{item.detail}</p>}</div><button type="button" className="text-btn" onClick={()=>{if(item.actionType==='records')this.switchTab('records');else if(item.eventId)this.openAction({action:item.actionType,event:b.events.find((e:any)=>e.id===item.eventId)});else this.openAction({action:item.actionType,date});}}>{item.action}</button></div>)}</div></section>}
      <details className="card batch-summary"><summary>Batch summary</summary>
        <h3>Growth</h3>
        {pts.length?<LineChart series={series.filter((x:any)=>x.points.length)} title="Live weight over time" floorZero/>:<Empty title="Your growth chart starts here" text="Add a dated weighing to see progress."/>}
        <label className="overlay-toggle"><input type="checkbox" checked={!!this.state.showModelOverlay} onChange={e=>this.setState({showModelOverlay:e.target.checked})}/> Show modeled growth overlay</label>
        {!perf&&<p className="muted small-text">One estimated point is not a growth curve. No growth rate is inferred from it.</p>}
        <h3>Spending</h3>
        <div className="detail-grid"><div><small>Chicks</small><strong>{preStart?'—':money(b.chickCost)}</strong></div><div><small>Feed purchased</small><strong>{money(s.feedPaid)}</strong></div><div><small>Other expenses</small><strong>{money(s.otherPaid)}</strong></div><div><small>Batch cash recorded</small><strong>{money(s.cashPaid)}</strong></div></div>
        <p className="muted small-text">Budgets {money(s.budgets)} and infrastructure {money(this.capital())} stay out of this cash total.</p>
        <h3>Feed and production</h3>
        <div className="detail-grid"><div><small>Known feed bought</small><strong>{qty(s.knownPurchasedKg)} kg{s.inventoryIncomplete?' + unknown':''}</strong></div><div><small>Recorded feed used</small><strong>{qty(s.recordedUsedKg)} kg</strong></div><div><small>Known stock remaining</small><strong>{qty(s.inventoryKg)} kg</strong></div><div><small>Feed-use cost logged</small><strong>{money(s.usedFeed)}</strong></div></div>
        {perf&&<Note><strong>{qty(perf.gainG,1)} g/day</strong> observed sample growth ({dateLabel(perf.start)}–{dateLabel(perf.end)}). {perf.fcr!==null?`${qty(perf.fcr)} logged-feed ratio; incomplete usage logs can bias it.`:'No comparable logged-feed ratio is available yet.'}</Note>}
        <h3>Harvest results</h3>
        <div className="detail-grid"><div><small>Birds harvested</small><strong>{s.harvestedBirds}</strong></div><div><small>Dressed output</small><strong>{qty(s.dressedKg)} kg</strong></div><div><small>Cash received</small><strong>{money(s.revenue)}</strong></div><div><small>Kept for home</small><strong>{qty(s.homeKg)} kg</strong></div></div>
      </details>
    </>;
  }
  renderLotCard=(p:any,date:string,opts:any={})=>{
    const usable=p.kg!==null&&p.remaining!==null&&p.remaining>0.00001;
    const later=M.lotBalances(this.b(),p.id);
    const showSplit=later&&p.remaining!==null&&later.remainingAfterAll!==null&&Math.abs((p.remaining||0)-(later.remainingAfterAll||0))>0.00001;
    return <section className="card lot-card" key={p.id}>
      <h3>{p.name}</h3>
      <p>{p.phase} · {dateLabel(p.date)}</p>
      <div className="detail-grid"><div><small>Recorded remaining</small><strong>{qty(p.remaining)} kg</strong></div><div><small>Purchased</small><strong>{qty(p.kg)} kg</strong></div><div><small>Used</small><strong>{qty(p.used)} kg</strong></div><div><small>Recorded ₱/kg</small><strong>{money(p.price,2)}</strong></div></div>
      {showSplit&&<p className="muted small-text">Stock recorded at {dateLabel(date)}: {qty(p.remaining)} kg. Still available after all recorded usage: {qty(later.remainingAfterAll)} kg.</p>}
      {p.kg===null&&<Note tone="warn">Quantity unknown — unavailable for lot-based feed-use logging.</Note>}
      <div className="button-row">
        {p.kg!==null&&<button className="btn secondary" disabled={!usable} onClick={()=>usable&&this.openAction({action:'usage',lotId:p.id,date})}>Use feed</button>}
        <button className="btn secondary" onClick={()=>this.openAction({action:'feed',product:{name:p.name,phase:p.phase,lastKg:p.kg,lastCost:p.cost,lastDate:p.date},date})}>Buy again</button>
        <button className="text-btn" onClick={()=>this.openAction({action:'feed',event:p})}>Edit purchase</button>
      </div>
    </section>;
  };
  renderFeed(){
    const b=this.b(),date=this.state.selectedDate||M.today(),inv=M.feedInventory(b,date),budgets=b.events.filter((e:any)=>e.type==='budget');
    const heading=workingDateTitle(date);
    const available=inv.filter((p:any)=>p.kg!==null&&p.remaining!==null&&p.remaining>0.00001);
    const unknown=inv.filter((p:any)=>p.kg===null);
    const used=inv.filter((p:any)=>p.kg!==null&&(p.remaining===null||p.remaining<=0.00001));
    const known=M.sum(available.map((p:any)=>p.remaining).concat(used.map((p:any)=>p.remaining||0)));
    return <>
      <div className="page-title"><div><span className="eyebrow">FEED</span><h1>Lots on hand</h1><p>{heading.h1==='Today'?'Working date: today':heading.h1}. Each purchase stays its own lot.</p></div><button className="btn primary" onClick={()=>this.openAction({action:'feed',date})}><Icon name="plus"/>Buy feed</button></div>
      {this.workingDateBar()}
      <div className="feed-summary"><strong>{qty(known)} kg known remaining</strong>{unknown.length?<span className="muted">{unknown.length} purchase{unknown.length===1?' has':'s have'} an unknown quantity</span>:<span className="muted">Known remaining kilograms</span>}</div>
      {this.renderLastSave(b)}
      {!inv.length&&<Empty title="No purchase lots yet" text="Buy feed with a known quantity to create a lot you can use." action={<button className="btn secondary" onClick={()=>this.openAction({action:'feed',date})}>Buy feed</button>}/>}
      {!!available.length&&<><h2 className="group-heading">Available recorded stock</h2>{available.map((p:any)=>this.renderLotCard(p,date))}</>}
      {!!unknown.length&&<><h2 className="group-heading">Quantity unknown</h2>{unknown.map((p:any)=>this.renderLotCard(p,date))}</>}
      {!!used.length&&<details className="used-lots"><summary>Fully used ({used.length})</summary>{used.map((p:any)=>this.renderLotCard(p,date,{used:true}))}</details>}
      <section className="card budget-section"><SectionTitle title="Feed budgets" sub="Plans, not cash and not consumption"/>{!budgets.length?<p className="muted small-text">No feed budgets on this batch.</p>:budgets.map((e:any)=><div className="recent-row" key={e.id}><div><strong>{e.name||'Feed budget'}</strong><small>{money(e.cost)} planned · {dateLabel(e.date)}</small><div className="button-row"><button className="text-btn" onClick={()=>this.openAction({action:'feed',convert:e,date})}>Record actual purchase</button></div></div></div>)}</section>
    </>;
  }
  recordMatches=(e:any,b:any)=>{
    const st=this.state;
    if(st.filter!=='all'&&e.type!==st.filter)return false;
    if(st.recordFrom&&(!e.date||e.date<st.recordFrom))return false;
    if(st.recordTo&&(!e.date||e.date>st.recordTo))return false;
    const q=(st.recordSearch||'').trim().toLowerCase();
    if(!q)return true;
    const lot=b.events.find((x:any)=>x.id===e.lotId);
    const hay=[e.name,e.note,lot&&lot.name,TYPELABEL[e.type],e.phase].filter(Boolean).join(' ').toLowerCase();
    return hay.includes(q);
  };
  renderRecords(){
    const b=this.b(),st=this.state;
    const matched=b.events.filter((e:any)=>this.recordMatches(e,b)).sort((a:any,c:any)=>(c.date||'').localeCompare(a.date||'')||(c.createdAt||'').localeCompare(a.createdAt||''));
    const groups:any[]=[];
    const unknown=matched.filter((e:any)=>!e.date);
    const dated=matched.filter((e:any)=>e.date);
    const byDate:any={};
    dated.forEach((e:any)=>{byDate[e.date]=byDate[e.date]||[];byDate[e.date].push(e);});
    Object.keys(byDate).sort((a,c)=>c.localeCompare(a)).forEach(d=>groups.push({key:d,title:dateLabel(d),rows:byDate[d].sort((a:any,c:any)=>(c.createdAt||'').localeCompare(a.createdAt||''))}));
    if(unknown.length)groups.push({key:'unknown',title:'Date unknown',rows:unknown});
    let remaining=st.recordsShown||50;
    const visible:any[]=[];
    for(const g of groups){
      if(remaining<=0)break;
      const rows=g.rows.slice(0,remaining);
      remaining-=rows.length;
      visible.push({...g,rows});
    }
    const shown=visible.reduce((n,g)=>n+g.rows.length,0);
    const clear=()=>this.setState({filter:'all',recordSearch:'',recordFrom:'',recordTo:'',recordsShown:50});
    const filtersOn=st.filter!=='all'||st.recordSearch||st.recordFrom||st.recordTo;
    return <><div className="page-title"><div><span className="eyebrow">RECORDS</span><h1>Dated log</h1><p>Search and correct historical entries. Unknown dates stay in their own group.</p></div><button className="btn primary" onClick={this.openChooser}><Icon name="plus"/>Add record</button></div>
    {this.renderLastSave(b)}
    <section className="card"><div className="filter-row records-filters">
      <Field label="Search"><input aria-label="Search records" value={st.recordSearch} onChange={e=>this.setState({recordSearch:e.target.value,recordsShown:50})} placeholder="Name, note, or feed product"/></Field>
      <Field label="Record type"><select aria-label="Filter records" value={st.filter} onChange={e=>this.setState({filter:e.target.value,recordsShown:50})}><option value="all">All records</option>{Object.entries(TYPELABEL).map(([v,l])=><option key={v} value={v}>{l as string}</option>)}</select></Field>
      <Field label="From"><input type="date" aria-label="Records from date" value={st.recordFrom} onChange={e=>this.setState({recordFrom:e.target.value,recordsShown:50})}/></Field>
      <Field label="To"><input type="date" aria-label="Records to date" value={st.recordTo} onChange={e=>this.setState({recordTo:e.target.value,recordsShown:50})}/></Field>
      {filtersOn&&<button type="button" className="btn secondary" onClick={clear}>Clear filters</button>}
      <span className="muted">{matched.length} matching</span>
    </div>
    {!matched.length?<Empty title="No entries here yet" text="Add a record for this batch."/>:visible.map((g:any)=><div className="record-group" key={g.key}><h2>{g.title}</h2>{g.rows.map((e:any)=><article className="record" key={e.id}><div className="record-top"><Badge kind={e.type==='budget'||e.method==='estimate'?'warn':'muted'}>{e.type==='weigh'&&e.method==='estimate'?'Estimated weight':TYPELABEL[e.type]}</Badge><span>{dateLabel(e.date)}</span></div><h3>{e.name||TYPELABEL[e.type]}</h3><p>{recordDescription(e,b)}</p>{e.note&&e.type!=='note'&&<p className="record-note">{e.note}</p>}<div className="record-buttons">{e.type==='budget'&&<button className="text-btn" onClick={()=>this.openAction({action:'feed',convert:e,date:this.state.selectedDate})}>Record actual purchase <Icon name="arrow" size={15}/></button>}<div className="spacer"/><button className="icon-btn" title="Edit record" aria-label={'Edit '+(e.name||TYPELABEL[e.type])} onClick={()=>this.openAction({action:e.type,event:e})}><Icon name="edit" size={17}/></button><button className="icon-btn danger" title="Delete record" aria-label={'Delete '+(e.name||TYPELABEL[e.type])} onClick={()=>this.deleteRecord(e)}><Icon name="trash" size={17}/></button></div></article>)}</div>)}
    {shown<matched.length&&<button type="button" className="btn secondary" onClick={()=>this.setState({recordsShown:shown+50})}>Show more</button>}
    </section></>;
  }
  forecastInput=(key:string,label:string,hint:string,step:any='any')=>{const p=this.state.scenarioDraft||this.b().forecast;return <Field label={label} hint={hint}><input type="number" min="0" step={step} inputMode="decimal" value={p[key]===null?'':p[key]} onChange={e=>this.setState({scenarioDraft:{...p,[key]:e.target.value===''?null:Number(e.target.value)}})}/></Field>;};
  saveScenario=()=>{try{const p=this.state.scenarioDraft||this.b().forecast;this.mutate((d:any,b:any)=>{b.forecast=clone(p);},'Scenario saved');this.setState({scenarioDraft:null});}catch(e:any){this.toast(e.message);}};
  renderForecast(){const b=this.b(),p=this.state.scenarioDraft||b.forecast,f=this.projection(),s=M.summary(b,p.startDate||M.today()),perf=M.recentPerformance(b);const chosen=f.rows.find((r:any)=>r.day===this.state.selectedDay)||f.best;const important=f.rows.filter((r:any)=>[f.startDay,35,38,40,42,45,47,49,52,56,60,70,84,p.endDay,f.best?.day,this.state.selectedDay].includes(r.day));
    const dirty=!!this.state.scenarioDraft;
    const proposal=this.state.forecastProposal;
    const review=this.state.forecastStartReview;
    return <><div className="page-title"><div><span className="eyebrow">HARVEST PLANNER</span><h1>{f.rows.length?(dirty?'Unsaved scenario':'Harvest comparison'):'Set up a harvest comparison'}</h1><p>{f.rows.length?'Lowest modeled operating cost within this scenario and comparison range.':'Enter a starting flock state and the costs you want to model.'}</p></div><Badge kind="warn">Scenario, not a guarantee</Badge></div>
    {f.rows.length>0&&chosen&&<>
    <section className="card result-card"><SectionTitle title="Lowest modeled operating cost" sub="A low within the selected scenario and comparison range"/>
      <p className="primary-metric">{money(f.best.perKg,2)}/kg dressed</p>
      <p>{dateLabel(f.best.date)} · Day {f.best.day} since purchase</p>
      <p>Dates within 1% of that cost: {f.nearBest.map((r:any)=>dateShort(r.date)).filter((v:string,i:number,a:string[])=>a.indexOf(v)===i).join(', ')}</p>
      {f.atBoundary&&<Note tone="warn">This low is at the edge of the selected date range. It does not establish an interior optimum.</Note>}
    </section>
    </>}
    {f.rows.length>0&&chosen&&<>
    <section className="card"><SectionTitle title="Operating cost per dressed kilogram" sub={`${p.birds} birds · ${p.yieldPct}% dressed yield · no future deaths modeled`}/><LineChart unit="₱/kg" title="Projected cost per dressed kilogram" series={[{label:'Operating cost only',color:'#395a43',points:f.rows.map((r:any)=>({x:r.day,y:r.perKg}))},{label:`Including pen recovery over ${this.state.data.settings.recoveryBatches} batches`,color:'#a57636',dash:true,points:f.rows.map((r:any)=>({x:r.day,y:r.fullPerKg}))}]}/><Note>Further growth lowers the average cost only while <strong>marginal cost/kg is below the existing average cost/kg</strong>. A low scenario cost does not establish health, welfare or market suitability.</Note></section>
    <section className="card"><SectionTitle title="Compare slaughter dates" sub="Tap a row to update the annual comparison. All rows are modeled, not observations."/><Field label="Harvest date for annual comparison"><select value={chosen.day} onChange={e=>this.setState({selectedDay:Number(e.target.value)})}>{f.rows.map((r:any)=><option value={r.day} key={r.day}>Day {r.day} · {dateLabel(r.date)} · {money(r.perKg,2)}/kg</option>)}</select></Field><div className="table-wrap"><table className="forecast-table"><thead><tr><th>Date</th><th>Live kg/bird</th><th className="desk-only">Extra feed kg</th><th className="desk-only">Operating ₱</th><th className="desk-only">Dressed kg</th><th>Operating ₱/kg</th><th className="desk-only">Next-day marginal ₱/kg*</th></tr></thead><tbody>{important.map((r:any)=>{const next=f.rows.find((n:any)=>n.day===r.day+1);return <tr key={r.day} className={r.day===chosen.day?'selected':''} onClick={()=>this.setState({selectedDay:r.day})}><td><button className="day-pick" aria-label={'Select day '+r.day}>Day {r.day}</button><small>{dateLabel(r.date)}</small>{r.day===f.best.day&&<Badge kind="green">Scenario low</Badge>}</td><td>{qty(r.weight)}</td><td className="desk-only">{qty(r.feedKg,1)}</td><td className="desk-only">{money(r.cost)}</td><td className="desk-only">{qty(r.dressed,1)}</td><td><strong>{money(r.perKg,2)}</strong></td><td className="desk-only">{next?money(next.marginal,2):'—'}</td></tr>;})}</tbody></table></div>
    {chosen&&<div className="phone-row-detail"><h3>Selected day {chosen.day}</h3><div className="detail-grid"><div><small>Cumulative extra feed</small><strong>{qty(chosen.feedKg,1)} kg</strong></div><div><small>Operating cost</small><strong>{money(chosen.cost)}</strong></div><div><small>Dressed output</small><strong>{qty(chosen.dressed,1)} kg</strong></div><div><small>Next-day marginal cost</small><strong>{(()=>{const next=f.rows.find((n:any)=>n.day===chosen.day+1);return next?money(next.marginal,2):'—';})()}</strong></div></div></div>}<p className="muted small-text">*Cost of the additional dressed gain during the next modeled day. Extra feed is cumulative from the projection start. It is feed consumed, not necessarily new feed to purchase.</p><div className="button-row"><button className="btn secondary small" onClick={()=>this.exportForecast(f.rows)}>Export daily comparison CSV</button></div></section>
    </>}
    <section className="card"><SectionTitle title="Starting flock and cost" sub="The cost and flock state must refer to the same date."/><div className="form-grid three"><Field label="Starting date"><input type="date" min={b.placementDate} value={p.startDate||''} onChange={e=>{const next=e.target.value;const prev=p.startDate;this.setState({scenarioDraft:{...p,startDate:next},forecastStartReview:prev&&next&&prev!==next?{from:prev,to:next,birds:p.birds,weightKg:p.weightKg,baselineCost:p.baselineCost}:null,scenarioProvenance:this.state.scenarioProvenance==='records'?null:this.state.scenarioProvenance});}}/></Field>{this.forecastInput('birds','Birds remaining at start','Required; use a real count or an explicitly chosen scenario.',1)}{this.forecastInput('weightKg','Average live weight at start (kg)','Use a weighed sample average. Rough estimates are not measured samples.')}{this.forecastInput('baselineCost','Operating cost USED by start (₱)','Chicks + feed already used + other costs. Exclude unused feed, budgets and the pen.')}{this.forecastInput('feedPrice','Future feed price (₱ per kg)','Enter your actual purchase price, or your chosen scenario price.')}{this.forecastInput('yieldPct','Dressed yield (%)','70% is an editable illustration. Actual yield comes from harvest records.')}</div>
    {!this.state.scenarioProvenance&&!this.state.scenarioDraft&&<p className="muted small-text">Saved scenario values. How they were entered is not reconstructed.</p>}
    {review&&<Note tone="warn">Starting date changed from {dateLabel(review.from)} to {dateLabel(review.to)}. Birds, weight, and cost need review. <button type="button" className="text-btn" onClick={()=>{const prop=M.proposeForecastStart(b);this.setState({scenarioDraft:{...p,startDate:review.to,weightKg:prop.weightKg,birds:prop.birds,baselineCost:prop.baselineCost,feedPrice:prop.feedPrice??p.feedPrice},forecastStartReview:null,scenarioProvenance:'records',forecastProposal:null});}}>Reset date-dependent starting values from records</button> · <button type="button" className="text-btn" onClick={()=>this.setState({forecastStartReview:null,scenarioProvenance:'chosen'})}>Retain them as values chosen for the new date</button></Note>}
    <div className="button-row"><button className="btn secondary" onClick={()=>{const prop=M.proposeForecastStart(b);if(!prop.startDate){this.toast('Add a weighing first.');return;}this.setState({forecastProposal:prop});}}>Use latest records</button><button className="btn secondary" onClick={()=>this.setState({scenarioDraft:{...p,baselineCost:s.usedOperating}})}>Use logged production costs ({money(s.usedOperating)})</button></div>
    {proposal&&<div className="proposal-table"><h3>Values that will be copied</h3><table><tbody>
      <tr><th>Weight</th><td>{proposal.weightKg==null?'Not recorded':`${qty(proposal.weightKg)} kg · ${proposal.weightMethod} · ${dateLabel(proposal.startDate)}`}</td></tr>
      <tr><th>Bird count</th><td>{proposal.birds==null?'Not a verified count on this date':`${proposal.birds} birds from a count record, less later recorded removals. Not a physical count on the weigh date.`}</td></tr>
      <tr><th>Starting cost</th><td>{proposal.baselineCost==null?'Not recorded':money(proposal.baselineCost)+' consumption-based logged production cost at the starting date'}</td></tr>
      <tr><th>Feed price</th><td>{proposal.feedPrice==null?'Not recorded':`${money(proposal.feedPrice,2)}/kg${proposal.feedPriceDate?' · '+dateLabel(proposal.feedPriceDate):''}`}</td></tr>
    </tbody></table><p className="muted small-text">Logged production cost reflects entered records. Unrecorded feed use or expenses may make it incomplete. Missing values remain blank.</p>
    <div className="button-row"><button className="btn primary" onClick={()=>{this.setState({scenarioDraft:{...p,startDate:proposal.startDate,weightKg:proposal.weightKg,birds:proposal.birds,baselineCost:proposal.baselineCost,feedPrice:proposal.feedPrice},forecastProposal:null,scenarioProvenance:'records'});}}>Apply these values</button><button className="btn secondary" onClick={()=>this.setState({forecastProposal:null})}>Cancel</button></div></div>}
    <p className="muted small-text">Logged production costs may be incomplete. Include only chicks, feed already used, and other incurred costs at the projection start. Exclude unused feed, future budgets, and shared infrastructure.</p>
    {perf&&<Note>Observed {qty(perf.gainG,1)} g/day between the last two measured samples. Enter growth assumptions below; they are not filled automatically.</Note>}
    </section>
    <section className="card"><SectionTitle title="Growth and feed assumptions" sub="Editable scenario values, not a breed curve"/><div className="form-grid three">{this.forecastInput('gainG','Starting daily gain (g)','Live-weight gain on the first modeled day.')}{this.forecastInput('gainDeclinePct','Daily growth decline (%)','0 keeps gain constant.')}{this.forecastInput('fcr','Incremental FCR','Feed kilograms used for each additional kilogram of live weight.')}{this.forecastInput('fcrRise','Daily FCR increase','How quickly conversion worsens.')}{this.forecastInput('dailyOther','Extra daily flock costs (₱)','Charged once per elapsed modeled day.')}{this.forecastInput('endDay','Final day since purchase','Must be after the projection start.',1)}</div><div className="form-grid"><Field label="Dressed sale / replacement price (₱/kg)" hint="Leave blank to hide profit figures."><input type="number" min="0" step="any" value={p.salePrice===null?'':p.salePrice} onChange={e=>this.setState({scenarioDraft:{...p,salePrice:e.target.value===''?null:Number(e.target.value)}})}/></Field>{this.forecastInput('downtime','Days between batches','Turnaround after a full cycle.',1)}</div><div className="button-row"><button className="btn primary" onClick={this.saveScenario}>Save scenario</button></div></section>
    {dirty&&f.errors.length>0&&<section className="card"><div className="requirements">{f.errors.map((err:string)=><p key={err}>{err}</p>)}</div></section>}
    {b.events.some((e:any)=>e.type==='harvest')&&<Note tone="warn">This is a forward scenario for the remaining birds only. Allocate the starting cost to those birds; do not load the full batch cost after a partial harvest. The app does not infer that allocation.</Note>}

    {f.rows.length>0&&chosen&&<>
    <section className="card annual"><SectionTitle title={`Repeat-batch economics · day ${chosen.day}`} sub="365-day capacity scenario, not a calendar schedule or promised profit"/><div className="metrics compact"><Metric label="Full cycles in 365 days" value={chosen.cycles} sub={`${chosen.day} days growing + ${p.downtime} days turnaround each`}/><Metric label="Recurring batch cost" value={money(chosen.cost)} sub="Repeats this exact operating-cost scenario"/><Metric label="First-year break-even" value={money(chosen.annualBreakEven,2)+'/kg'} sub="Includes one full recovery of farm capital"/><Metric label="First-year cash margin*" value={money(chosen.annualMargin)} sub={p.salePrice===null?'Enter a selling price above':'After one capital recovery; listed costs only'}/></div><div className="detail-grid"><div><small>Annual dressed output</small><strong>{qty(chosen.annualKg,1)} kg</strong></div><div><small>Annual recurring cost</small><strong>{money(chosen.annualCost)}</strong></div><div><small>Capital recovered once</small><strong>{money(this.capital())}</strong></div><div><small>Per-batch operating margin*</small><strong>{money(chosen.margin)}</strong></div></div><p className="small-text muted">*Only cash profit if every modeled dressed kilogram is sold at the entered price. For home use it is replacement-value savings, not cash income. Excludes any labor, utilities, losses, taxes, selling or processing costs you have not entered. No overlapping flocks; downtime after each full cycle is counted conservatively. Repeating this batch's partial-age starting cost is a deliberate scenario, not a prediction for future flocks.</p></section>
    </>}
    <section className="card"><SectionTitle title="How this is calculated"/><div className="formula">Daily gain = starting gain × (1 − daily decline)<sup>days elapsed</sup><br/>Extra feed = live birds × daily live gain × incremental FCR<br/>Operating cost = starting used cost + extra feed cost + extra daily costs<br/>Dressed kg = live birds × projected average live kg × yield<br/>Cost/kg = operating cost ÷ dressed kg</div><p className="muted small-text">Weights, gain and FCR here are explicit assumptions. No automatic breeding-strain curve, compensatory-growth claim or age-specific nutritional prescription is built in. Costs can rise beyond the feed budget.</p></section>
    </>;
  }
  exportForecast=(rows:any[])=>{const keys=['day','date','weight','feedKg','cost','dressed','perKg','fullPerKg','marginal','cycles','annualBreakEven','annualMargin'];let csv=keys.join(',')+'\n'+rows.map(r=>keys.map(k=>r[k]===null?'':typeof r[k]==='number'?r[k].toFixed(4):r[k]).join(',')).join('\n');try{saveDownload('flock-ledger-forecast.csv',csv,'text/csv');}catch(e:any){this.toast(e.message);}};
  renderBatches(){const d=this.state.data;return <><div className="page-title"><div><span className="eyebrow">MORE</span><h1>Batches</h1><p>Keep each flock's records separate.</p></div><div className="button-row"><button type="button" className="btn secondary" onClick={()=>this.openMore('menu')}>Back</button><button className="btn primary" onClick={()=>this.setState({modal:{kind:'batch'}})}><Icon name="plus"/>New batch</button></div></div><div className="batch-grid">{d.batches.map((b:any)=>{const s=M.summary(b),selected=b.id===d.selectedBatchId;return <section className={'card batch-card '+(selected?'active':'')} key={b.id}><Badge kind={b.status==='active'?'green':'muted'}>{b.status}</Badge><h2>{b.name}</h2><p>{dateLabel(b.placementDate)}{b.placementEstimated?' · approximate':''}</p><div className="detail-grid"><div><small>Placed</small><strong>{b.initialBirds} birds</strong></div><div><small>Cash recorded</small><strong>{money(s.cashPaid)}</strong></div><div><small>Dressed output</small><strong>{qty(s.dressedKg)} kg</strong></div><div><small>Cash received</small><strong>{money(s.revenue)}</strong></div></div><div className="button-row"><button className={'btn small '+(selected?'secondary':'primary')} onClick={()=>{try{this.mutate((d:any)=>{d.selectedBatchId=b.id;});this.setState({scenarioDraft:null,selectedDay:null,tab:'today'});}catch(e:any){this.toast(e.message);}}}>{selected?'Open current batch':'Open batch'}</button><button className="icon-btn" aria-label={'Edit '+b.name} onClick={()=>this.setState({modal:{kind:'batch',batch:b}})}><Icon name="edit"/></button></div></section>;})}</div>
    </>;}
  renderInfrastructure(){const d=this.state.data;return <><div className="page-title"><div><span className="eyebrow">MORE</span><h1>Shared infrastructure</h1><p>One-time purchases, separate from feed and chicks.</p></div><button type="button" className="btn secondary" onClick={()=>this.openMore('menu')}>Back</button></div>
    <section className="card"><SectionTitle title="Capital items" sub="Not operating cost"/><div className="table-wrap"><table><thead><tr><th>Item</th><th>Date</th><th>Cost</th><th/></tr></thead><tbody>{d.settings.capital.map((a:any)=><tr key={a.id}><td>{a.name}</td><td>{dateLabel(a.date)}</td><td>{money(a.cost)}</td><td><button className="icon-btn danger" aria-label={'Remove capital '+a.name} onClick={()=>{if(!window.confirm('Remove this infrastructure record?'))return;try{this.mutate((d:any)=>{d.settings.capital=d.settings.capital.filter((x:any)=>x.id!==a.id);});}catch(e:any){this.toast(e.message);}}}><Icon name="trash" size={16}/></button></td></tr>)}</tbody></table></div><form onSubmit={e=>{e.preventDefault();const c=this.state.capitalDraft;try{this.mutate((d:any)=>{d.settings.capital.push({id:M.uid(),name:c.name,date:c.date||null,cost:Number(c.cost)});});this.setState({capitalDraft:{name:'',cost:'',date:''}});}catch(err:any){this.toast(err.message);}}}><div className="form-grid three"><Field label="New infrastructure item"><input required maxLength={180} value={this.state.capitalDraft.name} onChange={e=>this.setState({capitalDraft:{...this.state.capitalDraft,name:e.target.value}})}/></Field><Field label="Amount (₱)"><input required type="number" min="0" step="0.01" value={this.state.capitalDraft.cost} onChange={e=>this.setState({capitalDraft:{...this.state.capitalDraft,cost:e.target.value}})}/></Field><Field label="Purchase date (optional)"><input type="date" value={this.state.capitalDraft.date} onChange={e=>this.setState({capitalDraft:{...this.state.capitalDraft,date:e.target.value}})}/></Field></div><button className="btn secondary small" type="submit">Add infrastructure</button></form><hr/><Field label="Batches over which to show capital recovery" hint="A planning allocation, not tax depreciation. This never changes operating-only cost/kg."><input type="number" min="1" max="1000" step="1" value={d.settings.recoveryBatches} onChange={e=>{const n=Number(e.target.value);if(Number.isInteger(n)&&n>0&&n<=1000){try{this.mutate((d:any)=>{d.settings.recoveryBatches=n;});}catch(err:any){this.toast(err.message);}}}}/></Field><p>At {d.settings.recoveryBatches} batches, shared capital adds <strong>{money(this.capital()/d.settings.recoveryBatches,2)} per batch</strong> to the full-cost scenario, before dividing by dressed kilograms.</p></section></>;
  }
  backup=()=>{try{saveDownload('flock-ledger-backup-'+M.today()+'.json',JSON.stringify(this.state.data,null,2));if(!NATIVE)this.toast('Backup download started');}catch(e:any){this.toast(e.message);}};
  importBackup=()=>{try{const raw=this.state.importText;if(raw.length>4500000)throw new Error('Backup exceeds the 4.5 MB import limit.');const d=M.validateState(JSON.parse(raw));if(!window.confirm(`Replace the ledger on THIS device with ${d.batches.length} batch(es) from the backup? Export the current ledger first to keep it.`))return;this.commit(d,'Backup restored');this.setState({importText:'',importError:'',scenarioDraft:null,selectedDay:null,filter:'all'});}catch(e:any){this.setState({importError:e.message});}};
  chooseBackup=()=>{if(NATIVE){const result=nativeCall('import');if(result!=='pending')this.toast(result||'Import could not start.');}else(document.getElementById('backup-file') as HTMLInputElement).click();};
  renderBackup(){const nested=!!(this.state.data&&this.state.data.batches&&this.state.data.batches.length);return <><div className="page-title"><div><span className="eyebrow">{nested?'MORE':'BACKUP'}</span><h1>Backup & transfer</h1><p>Offline storage on this device. No account, subscription or cloud service.</p></div><div className="button-row">{nested&&<button type="button" className="btn secondary" onClick={()=>this.openMore('menu')}>Back</button>}<Badge kind="green">{NATIVE?'Android local storage':'Browser local storage'}</Badge></div></div>
    <Note tone="warn"><strong>Phone and tablet do not automatically sync.</strong> Export a JSON backup on the device with the newest data, then import it on the other device. Import replaces the whole local ledger; it does not merge records. Back up before uninstalling or clearing app data.</Note>
    <div className="two-col"><section className="card"><SectionTitle title="Save a backup" sub="All batches, entries, scenarios and infrastructure"/><p>Keep a dated JSON copy outside the app. You can restore it or transfer it to your other device.</p><button className="btn primary" onClick={this.backup}><Icon name="save"/>Export JSON backup</button></section><section className="card"><SectionTitle title="Restore or transfer" sub="Choose a backup file or paste its contents"/><button className="btn secondary" onClick={this.chooseBackup}>Choose JSON backup file</button><input hidden id="backup-file" type="file" accept=".json,application/json" onChange={e=>{const file=e.target.files?.[0];if(!file)return;if(file.size>4500000){this.setState({importError:'Backup exceeds 4.5 MB.'});return;}const reader=new FileReader();reader.onload=()=>this.setState({importText:String(reader.result),importError:''});reader.onerror=()=>this.setState({importError:'Could not read this file.'});reader.readAsText(file);e.target.value='';}}/><Field label="Backup JSON" wide><textarea rows={6} spellCheck={false} value={this.state.importText} placeholder="Paste a Flock Ledger backup here…" onChange={e=>this.setState({importText:e.target.value,importError:''})}/></Field>{this.state.importError&&<Note tone="error">{this.state.importError}</Note>}<button className="btn primary" disabled={!this.state.importText.trim()} onClick={this.importBackup}>Validate & restore backup</button></section></div>
    </>;}
  renderAbout(){return <><div className="page-title"><div><span className="eyebrow">MORE</span><h1>About & calculation definitions</h1><p>Flock Ledger 1.0 · offline records</p></div><button type="button" className="btn secondary" onClick={()=>this.openMore('menu')}>Back</button></div>
    <section className="card"><SectionTitle title="About this build" sub="Offline records on this device"/><p>Records and calculations run entirely on your device. The APK has no internet permission, analytics or advertising. No feed-price service or market-price feed is connected.</p><div className="detail-grid"><div><small>Currency</small><strong>Philippine pesos</strong></div><div><small>Date basis</small><strong>Device-local calendar dates</strong></div><div><small>Measured vs modeled</small><strong>Always labeled separately</strong></div><div><small>Weight basis</small><strong>Live and dressed kept separate</strong></div></div><hr/><h3>What “cost” means here</h3><p><strong>Recorded cash:</strong> chicks + feed purchases + expenses. Unused feed still belongs in this cash total.</p><p><strong>Logged production cost:</strong> chicks + priced feed-use logs + historical feed-use adjustments + expenses. Missing logs make this incomplete.</p><p><strong>Forecast cost:</strong> your entered starting production cost plus modeled future feed use and daily expenses. Budgets and shared capital are not silently added.</p><p><strong>Capital recovery:</strong> a separate allocation across your selected number of batches. First-year comparisons recover the shared capital once.</p><p><strong>Data quality:</strong> purchase date may be approximate; age at purchase, survivors, feed quantity and weights can remain unknown. No breed growth targets are embedded.</p></section>
    </>;
  }
  renderMore(){
    const page=this.state.morePage||'menu';
    if(page==='batches')return this.renderBatches();
    if(page==='infrastructure')return this.renderInfrastructure();
    if(page==='backup')return this.renderBackup();
    if(page==='about')return this.renderAbout();
    return <><div className="page-title"><div><span className="eyebrow">MORE</span><h1>More</h1><p>Batches, infrastructure, backup, and how the ledger calculates cost.</p></div></div>
      <nav className="more-menu" aria-label="More pages">
        <button type="button" className="more-link" aria-label="Batches" onClick={()=>this.openMore('batches')}><strong>Batches</strong><span>Add or open a flock</span></button>
        <button type="button" className="more-link" aria-label="Shared infrastructure" onClick={()=>this.openMore('infrastructure')}><strong>Shared infrastructure</strong><span>Capital, separate from operating cost</span></button>
        <button type="button" className="more-link" aria-label="Backup & transfer" onClick={()=>this.openMore('backup')}><strong>Backup & transfer</strong><span>Export or restore this device</span></button>
        <button type="button" className="more-link" aria-label="About & calculation definitions" onClick={()=>this.openMore('about')}><strong>About & calculation definitions</strong><span>What recorded cash, production cost, and forecast cost mean</span></button>
      </nav></>;
  }
  render(){const s=this.state;if(!s.data)return <main className="recovery"><h1>Your saved ledger could not be opened</h1><Note tone="error">{s.loadError}</Note><p>No stored data has been overwritten. Close and reopen the app, or restore a valid JSON backup. Keep a copy of the original data before replacing it.</p><textarea id="recovery-raw" readOnly rows={8} value={(()=>{try{return storeRead()||'';}catch(e){return '';}})()}/><p>Raw saved data is shown above for recovery.</p>{NATIVE&&<button className="btn secondary" onClick={this.chooseBackup}>Choose a JSON backup</button>}<Field label="Paste or selected backup"><textarea rows={6} value={s.importText} onChange={e=>this.setState({importText:e.target.value,importError:''})}/></Field>{s.importError&&<Note tone="error">{s.importError}</Note>}<button className="btn primary" disabled={!s.importText.trim()} onClick={this.importBackup}>Validate and restore</button></main>;
    if(!s.data.batches.length)return <main className="recovery">
      <span className="eyebrow">FLOCK LEDGER · OFFLINE RECORDS</span>
      <h1>Start your flock ledger</h1>
      <p>This public build starts empty. Enter your own batch details, or restore your private JSON backup. No farm records are bundled.</p>
      {s.storageError&&<Note tone="error">{s.storageError}</Note>}
      {s.tab==='backup'?<><button className="btn secondary" onClick={()=>this.setState({tab:'today'})}>Create a batch instead</button>{this.renderBackup()}</>:<>
        <section className="card"><BatchForm onCancel={()=>this.setState({tab:'backup'})} onSave={(values:any)=>{this.mutate((d:any)=>{const b=M.makeBatch(values);d.batches.push(b);d.selectedBatchId=b.id;},'First batch saved');this.setState({tab:'today',scenarioDraft:null,selectedDay:null});}}/></section>
        <button className="btn secondary" onClick={()=>this.setState({tab:'backup'})}>Restore an existing backup</button>
      </>}
      {s.toast&&<div className="toast" role="status">{s.toast}</div>}
    </main>;
    const b=this.b();const tabs=[['today','home','Today'],['feed','feed','Feed'],['records','log','Records'],['forecast','chart','Forecast'],['more','flock','More']];
    const commandBatch=s.modal&&s.modal.command?s.data.batches.find((x:any)=>x.id===s.modal.command.batchId):b;
    return <div className="app"><aside className="sidebar"><div className="wordmark"><div className="brand-symbol"><Icon name="flock" size={28}/></div><div>FLOCK<span>LEDGER</span></div></div><p className="side-caption">Know your flock.<br/>Know your real costs.</p><nav aria-label="Main navigation">{tabs.map(([key,icon,label])=><button key={key} className={s.tab===key?'active':''} onClick={()=>this.switchTab(key)}><Icon name={icon}/><span>{label}</span></button>)}</nav><div className="side-footer"><span className="status-dot"/>Works offline<small>OFFLINE · 1.0</small></div></aside>
    <div className="workspace"><header className="topbar"><div className="mobile-brand"><Icon name="flock" size={23}/>Flock Ledger</div><div className="batch-selector"><span className="eyebrow">BATCH</span><select aria-label="Selected batch" value={b.id} onChange={e=>{const v=e.target.value;if(v==='__manage'){this.openMore('batches');return;}if(v==='__new'){this.setState({modal:{kind:'batch'}});return;}try{this.mutate((d:any)=>{d.selectedBatchId=v;});this.setState({scenarioDraft:null,selectedDay:null,filter:'all'});}catch(err:any){this.toast(err.message);}}}>{s.data.batches.map((b:any)=><option key={b.id} value={b.id}>{b.name}{b.status==='closed'?' · closed':''}</option>)}<option value="__manage">Manage batches</option><option value="__new">New batch</option></select></div><div className="top-date">{dateLabel(M.today())}<span><i className="status-dot"/>Saved locally</span></div><button className="header-add" aria-label="Add record" onClick={this.openChooser}><Icon name="plus"/></button></header>
    <main>{s.storageError&&<Note tone="error">{s.storageError}</Note>}{s.tab==='today'?this.renderToday():s.tab==='feed'?this.renderFeed():s.tab==='records'?this.renderRecords():s.tab==='forecast'?this.renderForecast():s.tab==='backup'?this.renderBackup():this.renderMore()}<footer>Flock Ledger · {b.name} · Offline records</footer></main></div>
    <nav className="bottom-nav" aria-label="Mobile navigation">{tabs.map(([key,icon,label])=><button key={key} className={s.tab===key?'active':''} onClick={()=>this.switchTab(key)}><Icon name={icon}/><span>{label}</span></button>)}</nav>
    {s.toast&&<div className="toast" role="status"><Icon name="check" size={18}/>{s.toast}</div>}
    {s.modal&&<div className={'modal-backdrop '+(s.modal.kind==='batch'?'':'entry-backdrop')} role="presentation" onClick={e=>{if(e.target===e.currentTarget){if(s.modal.kind==='batch')this.setState({modal:null});else this.dismissEditor();}}}><section role="dialog" aria-modal="true" aria-label={s.modal.kind==='task'?(ACTION_META[s.modal.command.action]||{}).title||'Task':s.modal.kind==='chooser'?'Choose an action':'Batch editor'} className={'modal '+(s.modal.kind==='batch'?'':'entry-surface')}><>{s.modal.kind==='chooser'?<ActionChooser onCancel={this.dismissEditor} onPick={(action:string)=>this.openAction({action,date:this.state.selectedDate})}/>:s.modal.kind==='task'?<TaskForm key={draftKey(s.modal.command)+(s.modal.command.eventId||'')} command={s.modal.command} batch={commandBatch} draft={(this.ui().drafts||{})[draftKey(s.modal.command)]||null} onDraft={(draft:any)=>this.setState({pendingDraft:draft})} onCancel={this.dismissEditor} onSave={(records:any[],opts:any)=>{try{this.saveRecords(records,opts);}catch(err:any){throw err;}}} onBuyFeed={()=>this.openAction({action:'feed',date:s.modal.command.date})} onEdit={(event:any)=>this.openAction({action:event.type,event})}/>:<BatchForm batch={s.modal.batch} onCancel={()=>this.setState({modal:null})} onSave={(values:any)=>{this.mutate((d:any)=>{if(s.modal.batch){const index=d.batches.findIndex((x:any)=>x.id===s.modal.batch.id);d.batches[index]={...d.batches[index],...values};delete d.batches[index].error;}else{const n=M.makeBatch(values);d.batches.push(n);d.selectedBatchId=n.id;}});this.setState({modal:null,scenarioDraft:null,selectedDay:null});}}/>}</></section></div>}
    </div>;
  }
}
ReactDOM.render(<App/>,document.getElementById('root'));
