// Synthetic store and campaign records for product review. No Blackberrys actuals.
export const stores=[
  {code:'BB-DL-01',name:'South Extension',city:'Delhi',zone:'North',tier:'Tier 1',cohort:'Occasion',size:2100,channel:'High street',jarvis:true,control:'BB-DL-02'},
  {code:'BB-DL-02',name:'Rajouri Garden',city:'Delhi',zone:'North',tier:'Tier 1',cohort:'Occasion',size:2050,channel:'High street',jarvis:true,control:'BB-DL-01'},
  {code:'BB-MH-01',name:'Phoenix Marketcity',city:'Mumbai',zone:'West',tier:'Tier 1',cohort:'Formal',size:1950,channel:'Mall',jarvis:true,control:'BB-MH-02'},
  {code:'BB-MH-02',name:'R City Mall',city:'Mumbai',zone:'West',tier:'Tier 1',cohort:'Formal',size:1880,channel:'Mall',jarvis:true,control:'BB-MH-01'},
  {code:'BB-KA-01',name:'Indiranagar',city:'Bengaluru',zone:'South',tier:'Tier 2',cohort:'Casual',size:1650,channel:'High street',jarvis:false,control:'BB-KA-02'},
  {code:'BB-KA-02',name:'Jayanagar',city:'Bengaluru',zone:'South',tier:'Tier 2',cohort:'Casual',size:1600,channel:'High street',jarvis:false,control:'BB-KA-01'},
];
export const initialActivities=[
  {id:'ACT-01',name:'Delhi wedding edit · mall branding',objective:'Store visits and occasion sales',type:'Mall branding',owner:'Retail Marketing',start:'2026-09-22',end:'2026-09-28',cities:['Delhi'],storeCodes:['BB-DL-01'],costs:[{type:'Mall branding',planned:35000,actual:36000},{type:'Print / NPI',planned:8000,actual:7800},{type:'Production',planned:12000,actual:11500}],status:'Completed',asset:'Store execution photo and invoice reference pending upload',proof:'Completion checklist recorded; proof file unavailable in demo',controlCodes:['BB-DL-02']},
  {id:'ACT-02',name:'Mumbai occasion influencer visit',objective:'Reach and store visits',type:'Influencer',owner:'Brand Marketing',start:'2026-09-22',end:'2026-09-28',cities:['Mumbai'],storeCodes:['BB-MH-01'],costs:[{type:'Influencer',planned:45000,actual:44500},{type:'Production',planned:15000,actual:15300},{type:'OOH',planned:18000,actual:17000}],status:'Completed',asset:'Influencer creative reference pending upload',proof:'Posting link to be supplied',controlCodes:['BB-MH-02']},
  {id:'ACT-03',name:'Bengaluru store visit push',objective:'Drive measured store visits',type:'Store-visit campaign',owner:'Retail Marketing',start:'2026-09-25',end:'2026-10-04',cities:['Bengaluru'],storeCodes:['BB-KA-01'],costs:[{type:'Store-visit media',planned:25000,actual:24000},{type:'Agency',planned:5000,actual:5000}],status:'Live',asset:'In-store POS material to be confirmed',proof:'Live execution confirmation pending',controlCodes:['BB-KA-02']},
];
export const pos=[];export const nps=[];
for(let d=1;d<=28;d++)for(let s=0;s<stores.length;s++){
  const store=stores[s],date=`2026-09-${String(d).padStart(2,'0')}`,late=d>=22;
  const base=store.size*19.8*(1+(d%7)*.018);
  const uplift=late&&s===0?1.22:late&&s===2?1.15:late&&s===4?1.05:1;
  const revenue=Math.round(base*uplift),bills=Math.round(revenue/(2400+(s%3)*180));
  const footfall=store.jarvis?Math.round(bills*(3.2+(s%2)*.35)):null;
  const newCustomers=Math.round(bills*(s===0&&late?.37:.31));
  pos.push({id:`POS-${store.code}-${date}`,date,storeCode:store.code,revenue,bills,newCustomers,existingCustomers:bills-newCustomers,promise:Math.round(store.size*21.4),footfall});
  const responses=7+(s+d)%5,promoters=s===0&&late?Math.round(responses*.38):Math.round(responses*.55),detractors=s===0&&late?Math.round(responses*.39):Math.round(responses*.22);
  nps.push({id:`NPS-${store.code}-${date}`,date,storeCode:store.code,responses,promoters,detractors,negative:Math.max(0,detractors-1)});
}
export const sum=(rows,key)=>rows.reduce((t,r)=>t+(Number(r[key])||0),0);
export const within=(rows,p)=>rows.filter(r=>r.date>=p.start&&r.date<=p.end);
export const activityCost=a=>sum(a.costs,'actual');
export const activityPeriod=a=>({start:a.start,end:a.end});
export function storeMetrics(code,p){const rows=within(pos,p).filter(r=>r.storeCode===code),scores=within(nps,p).filter(r=>r.storeCode===code),revenue=sum(rows,'revenue'),bills=sum(rows,'bills'),promoters=sum(scores,'promoters'),detractors=sum(scores,'detractors'),responses=sum(scores,'responses');return {revenue,bills,promise:sum(rows,'promise'),newCustomers:sum(rows,'newCustomers'),existingCustomers:sum(rows,'existingCustomers'),footfall:stores.find(s=>s.code===code)?.jarvis?sum(rows,'footfall'):null,nps:responses?(promoters-detractors)/responses*100:null,responses,negative:sum(scores,'negative'),rows};}
export function activityResult(activity){
  const current=activityPeriod(activity),previous={start:'2026-09-15',end:'2026-09-21'};
  const participated=activity.storeCodes.map(code=>storeMetrics(code,current));
  const controls=activity.controlCodes.map(code=>storeMetrics(code,current));
  const priorParticipated=activity.storeCodes.map(code=>storeMetrics(code,previous));
  const priorControls=activity.controlCodes.map(code=>storeMetrics(code,previous));
  const observed=sum(participated,'revenue'),controlCurrent=sum(controls,'revenue'),participantPrior=sum(priorParticipated,'revenue'),controlPrior=sum(priorControls,'revenue');
  const expected=activity.status==='Completed'&&controlPrior?participantPrior*controlCurrent/controlPrior:null;
  return {observed,expected,incremental:expected===null?null:Math.round(observed-expected),participantPrior,controlPrior,controlCurrent,participantChange:participantPrior?observed/participantPrior-1:null,controlChange:controlPrior?controlCurrent/controlPrior-1:null,spend:activityCost(activity),promise:sum(participated,'promise'),newCustomers:sum(participated,'newCustomers'),existingCustomers:sum(participated,'existingCustomers'),footfall:participated.every(x=>x.footfall!==null)?sum(participated,'footfall'):null};
}
export function validateRetail(activities){return [
  {name:'POS records link to store master',pass:pos.every(r=>stores.some(s=>s.code===r.storeCode))},
  {name:'NPS records link to store master',pass:nps.every(r=>stores.some(s=>s.code===r.storeCode))},
  {name:'All activity stores and controls exist',pass:activities.every(a=>[...a.storeCodes,...a.controlCodes].every(code=>stores.some(s=>s.code===code)))},
  {name:'Participant and control cohorts match',pass:activities.every(a=>a.storeCodes.every((code,i)=>{const x=stores.find(s=>s.code===code),y=stores.find(s=>s.code===a.controlCodes[i]);return x?.tier===y?.tier&&x?.cohort===y?.cohort&&Math.abs(x.size-y.size)/x.size<.1}))},
  {name:'POS customer groups reconcile',pass:pos.every(r=>r.newCustomers+r.existingCustomers===r.bills)},
];}
