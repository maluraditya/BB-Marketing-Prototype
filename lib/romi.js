import {campaigns,orders,media,period,within,sum as onlineSum,metrics} from './demo.js';
import {initialActivities,activityResult,activityCost,sum as retailSum} from './retail.js';

// Illustrative geography mapping solely for a working prototype. Production joins
// require approved delivery city and campaign city IDs from Blackberrys.
export const orderCity=order=>['Delhi','Mumbai','Bengaluru','Other India'][Number(order.customerId.slice(1))%4];
export const cityGroup=order=>['Delhi','Mumbai'].includes(orderCity(order))?'Campaign cities':'Rest of country';
export function onlineGeoResult(n=7){
  const current=period(n),previous=period(n,true);
  const by=(p,group)=>onlineSum(within(orders,p).filter(o=>cityGroup(o)===group),'net');
  const testCurrent=by(current,'Campaign cities'),testPrior=by(previous,'Campaign cities'),controlCurrent=by(current,'Rest of country'),controlPrior=by(previous,'Rest of country');
  const expected=controlPrior?testPrior*controlCurrent/controlPrior:null;
  return {testCurrent,testPrior,controlCurrent,controlPrior,expected,incremental:expected===null?null:Math.round(testCurrent-expected),testChange:testPrior?testCurrent/testPrior-1:null,controlChange:controlPrior?controlCurrent/controlPrior-1:null,method:'Illustrative campaign-city vs rest-of-country like-to-like comparison; selection and normalization pending Week 1 charter.'};
}
export function investment(n=7,activities=initialActivities){
  const p=period(n),paid=within(media,p),awareness=onlineSum(paid.filter(r=>r.campaignId==='M-A'),'spend'),performanceMedia=onlineSum(paid.filter(r=>r.campaignId!=='M-A'),'spend');
  // CRM is a separate cost record, never added to platform spend or Shopify revenue.
  const crm=1200*n;
  const relevant=activities.filter(a=>a.start<=p.end&&a.end>=p.start);
  const storeVisit=retailSum(relevant.filter(a=>a.type==='Store-visit campaign').map(a=>({value:activityCost(a)})),'value');
  const offline=retailSum(relevant.filter(a=>a.type!=='Store-visit campaign').map(a=>({value:activityCost(a)})),'value');
  const categories=[{id:'brand',name:'Brand awareness',total:awareness,source:'Meta awareness campaign M-A'},{id:'performance',name:'Performance marketing',total:performanceMedia+crm,source:'Meta/Google conversion media + CRM cost'},{id:'visit',name:'Store-visit campaigns',total:storeVisit,source:'Activity ACT-03 actual-to-date cost'},{id:'offline',name:'Offline activations',total:offline,source:'Activities ACT-01 and ACT-02; mall, OOH, print, influencer, production'}];
  return {categories,total:retailSum(categories,'total'),crm,performanceMedia,awareness,storeVisit,offline,activities:relevant};
}
export function romi(n=7,activities=initialActivities){
  const investmentData=investment(n,activities),geo=onlineGeoResult(n);
  const completed=investmentData.activities.filter(a=>a.status==='Completed');
  const offlineDetails=completed.map(a=>({activity:a,...activityResult(a)}));
  const offlineIncremental=retailSum(offlineDetails,'incremental');
  const onlineIncremental=geo.incremental||0;
  const incremental=onlineIncremental+offlineIncremental;
  // Prototype assumption: net incremental revenue less total cost / total cost.
  // Commercial return basis and attribution are not signed and must be agreed in W1.
  const value=investmentData.total?(incremental-investmentData.total)/investmentData.total:null;
  return {investment:investmentData,geo,offlineDetails,onlineIncremental,offlineIncremental,incremental,value,shopify:metrics(period(n))};
}
export function validateRomi(n=7,activities=initialActivities){const r=romi(n,activities);return [
 {name:'Four investment areas reconcile',pass:retailSum(r.investment.categories,'total')===r.investment.total},
 {name:'Offline investment uses each activity once',pass:r.investment.storeVisit+r.investment.offline===retailSum(r.investment.activities.map(a=>({value:activityCost(a)})),'value')},
 {name:'Online incremental delta uses control expectation',pass:r.geo.incremental===Math.round(r.geo.testCurrent-r.geo.expected)},
 {name:'Incremental components reconcile',pass:r.onlineIncremental+r.offlineIncremental===r.incremental},
 {name:'ROMI uses one investment denominator',pass:Math.abs(r.value-((r.incremental-r.investment.total)/r.investment.total))<1e-10},
];}
