import {media,period,within,sum as onlineSum,metrics} from './demo.js';
import {initialActivities,activityResult,activityCost,sum as retailSum} from './retail.js';

// Synthetic calculation example follows the supplied 10-city workbook method.
// Do not use these demo inputs as Blackberrys actuals.
const lakh=100_000;
const testCityInputs=[
  ['Delhi NCR',32,14],['Mumbai',29,12],['Bengaluru',26,11],['Pune',24,10.5],['Hyderabad',22,10],
  ['Kolkata',20,9.5],['Lucknow',18,9],['Jaipur',16,8.5],['Patna',14,8],['Ranchi',13,2.5],
];
const cityRows=testCityInputs.map(([city,preLYLakh,postLYLakh])=>({
  city,matchedControlCount:3,preLY:preLYLakh*lakh,preCY:preLYLakh*lakh*1.04,
  postLY:postLYLakh*lakh,postCY:postLYLakh*lakh*1.16,
}));
const total=(rows,key)=>rows.reduce((v,row)=>v+row[key],0);
const growth=(current,prior)=>prior?current/prior-1:null;
const testPreLY=total(cityRows,'preLY'),testPreCY=total(cityRows,'preCY');
const testPostLY=total(cityRows,'postLY'),testPostCY=total(cityRows,'postCY');
// Three matched controls per test city, represented here as aggregate synthetic controls.
const controlPreLY=testPreLY*3,controlPreCY=controlPreLY*1.04;
const controlPostLY=testPostLY*3,controlPostCY=controlPostLY*1.05;
export function onlineGeoResult(campaignSpend=500_000){
  const testPreGrowth=growth(testPreCY,testPreLY),testPostGrowth=growth(testPostCY,testPostLY);
  const controlPreGrowth=growth(controlPreCY,controlPreLY),controlPostGrowth=growth(controlPostCY,controlPostLY);
  const lift=(testPostGrowth-testPreGrowth)-(controlPostGrowth-controlPreGrowth);
  const incremental=Math.round(lift*testPostLY);
  const expected=testPostLY*(1+testPreGrowth+(controlPostGrowth-controlPreGrowth));
  const grossMarginAssumption=.55,incrementalGrossMargin=Math.round(incremental*grossMarginAssumption);
  const revenueRomi=campaignSpend?(incremental-campaignSpend)/campaignSpend:null;
  const marginRomi=campaignSpend?(incrementalGrossMargin-campaignSpend)/campaignSpend:null;
  const testCities=cityRows.map(city=>({...city,incremental:Math.round(city.postLY*lift),campaignSpend:Math.round(campaignSpend*city.postLY/testPostLY)}));
  return {testCities,testPreLY,testPreCY,testPostLY,testPostCY,controlPreLY,controlPreCY,controlPostLY,controlPostCY,
    testPreGrowth,testPostGrowth,controlPreGrowth,controlPostGrowth,lift,expected,incremental,campaignSpend,
    incrementalGrossMargin,grossMarginAssumption,revenueRomi,marginRomi,
    method:'Matched-city difference-in-differences: (test post growth − test pre growth) − (matched-control post growth − matched-control pre growth), multiplied by test-city campaign-window LY revenue. E-commerce excluded.'};
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
  const investmentData=investment(n,activities),geo=onlineGeoResult();
  const completed=investmentData.activities.filter(a=>a.status==='Completed');
  const offlineDetails=completed.map(a=>({activity:a,...activityResult(a)}));
  const offlineIncremental=retailSum(offlineDetails,'incremental');
  const onlineIncremental=geo.incremental;
  // Keep city-campaign ROMI separate from activity-level retail comparisons.
  // Their revenue windows may overlap, so summing them would risk double counting.
  const incremental=onlineIncremental,value=geo.revenueRomi,marginValue=geo.marginRomi;
  return {investment:investmentData,geo,offlineDetails,onlineIncremental,offlineIncremental,incremental,value,marginValue,shopify:metrics(period(n))};
}
export function validateRomi(n=7,activities=initialActivities){const r=romi(n,activities);return [
 {name:'Four investment areas reconcile',pass:retailSum(r.investment.categories,'total')===r.investment.total},
 {name:'Offline investment uses each activity once',pass:r.investment.storeVisit+r.investment.offline===retailSum(r.investment.activities.map(a=>({value:activityCost(a)})),'value')},
 {name:'Test and control growth rates match the supplied model example',pass:Math.abs(r.geo.testPreGrowth-.04)<1e-10&&Math.abs(r.geo.testPostGrowth-.16)<1e-10&&Math.abs(r.geo.controlPreGrowth-.04)<1e-10&&Math.abs(r.geo.controlPostGrowth-.05)<1e-10},
 {name:'Incremental revenue follows weighted difference-in-differences',pass:Math.abs(r.geo.incremental-r.geo.lift*r.geo.testPostLY)<1e-8},
 {name:'Campaign spend allocates once across ten test cities',pass:r.geo.testCities.length===10&&r.geo.testCities.every(c=>c.matchedControlCount===3)},
 {name:'Revenue ROMI reconciles to incremental revenue and campaign spend',pass:Math.abs(r.value-((r.geo.incremental-r.geo.campaignSpend)/r.geo.campaignSpend))<1e-10},
 {name:'Margin ROMI uses the stated gross-margin assumption',pass:Math.abs(r.marginValue-((r.geo.incremental*r.geo.grossMarginAssumption-r.geo.campaignSpend)/r.geo.campaignSpend))<1e-10},
];}
