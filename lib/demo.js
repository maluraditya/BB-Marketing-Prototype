// All records are synthetic. IDs and calculations are shared across every view.
export const campaigns = [
  {id:'M-P',platform:'Meta',name:'AW26 · New customer discovery',audience:'Prospecting · menswear interests',phase:'Acquisition',base:24000,ratio:1.85},
  {id:'M-R',platform:'Meta',name:'AW26 · Return to your favourites',audience:'Site visitors · 30 days',phase:'Retargeting',base:12000,ratio:3.5},
  {id:'G-S',platform:'Google',name:'Brand Search · Blackberrys',audience:'Brand search intent',phase:'Conversion',base:10000,ratio:5.2},
  {id:'G-P',platform:'Google',name:'Performance Max · Formalwear',audience:'New customer acquisition',phase:'Acquisition',base:24000,ratio:2.7},
  {id:'M-A',platform:'Meta',name:'AW26 · Collection awareness',audience:'Metro cities · broad',phase:'Awareness',base:5000,ratio:null}
];
export const products=[{id:'P01',name:'Structured formal shirt',category:'Shirts',price:2495,stock:260},{id:'P02',name:'Slim-fit chinos',category:'Trousers',price:2995,stock:210},{id:'P03',name:'Everyday polo',category:'Polos',price:1795,stock:320},{id:'P04',name:'Textured blazer',category:'Blazers',price:6995,stock:90}];
export const customers=[]; export const orders=[]; export const media=[]; export const days=[];
for(let i=0;i<480;i++) customers.push({id:`C${String(i+1).padStart(5,'0')}`,acquired:i<240?'2026-06':'2026-07',segment:i%2?'Occasion shoppers':'Everyday wardrobe',priorOrders:1+(i%3)});
for(let d=1;d<=28;d++){
  const date=`2026-09-${String(d).padStart(2,'0')}`;
  const late=d>21; const count=late?75+(d%7)*3:86+(d%7)*3;
  const newCount=Math.round(count*(late?.42:.48));
  for(let j=0;j<count;j++){
    let customer;
    if(j<newCount){customer={id:`C${String(customers.length+1).padStart(5,'0')}`,acquired:'2026-09',segment:j%2?'Occasion shoppers':'Everyday wardrobe',priorOrders:0};customers.push(customer);}
    else customer=customers[(d*13+j*7)%480];
    const p=products[(j+d)%4];
    const discount=Math.round(p.price*(late?.18:.12));
    const returned=j%29===0;
    orders.push({id:`BB-${d}-${String(j+1).padStart(3,'0')}`,date,customerId:customer.id,newCustomer:j<newCount,productId:p.id,gross:p.price,discount,refund:returned?p.price-discount:0,net:returned?0:p.price-discount});
  }
  const dayOrders=orders.filter(o=>o.date===date);
  for(const c of campaigns){
    const spend=Math.round(c.base*(1+(d%7)*.012)*(late?1.07:1));
    const impressions=Math.round(spend/(c.platform==='Meta'?130:210)*1000);
    const ctr=c.id==='M-P'?(late?.008:.012):c.id==='G-S'?.067:.018;
    const clicks=Math.round(impressions*ctr);
    media.push({id:`${c.id}-${date}`,date,campaignId:c.id,spend,impressions,clicks,attributedRevenue:c.ratio===null?null:Math.round(spend*c.ratio*(late?.9:1)),attributedOrders:c.ratio===null?null:Math.round(spend*c.ratio*(late?.9:1)/3000)});
  }
  const purchases=count-2; const checkout=Math.round(purchases/(late?.35:.43));
  days.push({date,sessions:5200+(d%7)*160,views:2900+(d%7)*90,cart:Math.round(checkout*1.65),checkout,purchases,gaRevenue:Math.round(sum(dayOrders,'net')*.96)});
}
export function sum(rows,key){return rows.reduce((s,r)=>s+(Number(r[key])||0),0)}
export function period(n=7,previous=false){const end=previous?28-n:28;return {start:`2026-09-${String(end-n+1).padStart(2,'0')}`,end:`2026-09-${String(end).padStart(2,'0')}`}}
export function within(rows,p){return rows.filter(r=>r.date>=p.start&&r.date<=p.end)}
export function metrics(p){
  const o=within(orders,p),m=within(media,p),f=within(days,p);
  const revenue=sum(o,'net'),spend=sum(m,'spend'),performanceSpend=sum(m.filter(r=>campaigns.find(c=>c.id===r.campaignId)?.phase!=='Awareness'),'spend'),awarenessSpend=spend-performanceSpend,newCustomers=new Set(o.filter(x=>x.newCustomer).map(x=>x.customerId)).size;
  const acquisitionSpend=sum(m.filter(r=>campaigns.find(c=>c.id===r.campaignId).phase==='Acquisition'),'spend');
  return {revenue,spend,performanceSpend,awarenessSpend,orders:o.length,roas:revenue/performanceSpend,aov:revenue/o.length,cpo:performanceSpend/o.length,newCustomers,acquisitionSpend,cac:acquisitionSpend/newCustomers,sessions:sum(f,'sessions'),views:sum(f,'views'),cart:sum(f,'cart'),checkout:sum(f,'checkout'),purchases:sum(f,'purchases'),conversion:sum(f,'purchases')/sum(f,'sessions'),completion:sum(f,'purchases')/sum(f,'checkout'),gaRevenue:sum(f,'gaRevenue'),newRevenue:sum(o.filter(x=>x.newCustomer),'net'),returnRevenue:sum(o.filter(x=>!x.newCustomer),'net'),returnOrders:o.filter(x=>!x.newCustomer).length};
}
export function campaignMetrics(id,p){const rows=within(media,p).filter(x=>x.campaignId===id),s=sum(rows,'spend'),c=campaigns.find(x=>x.id===id);return {...c,spend:s,impressions:sum(rows,'impressions'),clicks:sum(rows,'clicks'),revenue:c.ratio===null?null:sum(rows,'attributedRevenue'),orders:c.ratio===null?null:sum(rows,'attributedOrders'),ctr:sum(rows,'clicks')/sum(rows,'impressions'),roas:c.ratio===null?null:sum(rows,'attributedRevenue')/s,rows};}
export function creativeMetrics(id,p){const c=campaignMetrics(id,p);return [{id:id+'-C1',name:id==='M-P'?'Collection carousel · Version A':'Core collection · Version A',share:.65},{id:id+'-C2',name:'Occasion edit · Version B',share:.35}].map((x,i)=>{const spend=i?c.spend-Math.round(c.spend*.65):Math.round(c.spend*.65),clicks=i?c.clicks-Math.round(c.clicks*.6):Math.round(c.clicks*.6),impressions=i?c.impressions-Math.round(c.impressions*.65):Math.round(c.impressions*.65);return {...x,campaignId:id,spend,clicks,impressions,ctr:clicks/impressions};});}
export const initialActions=[
 {id:'A01',priority:'Urgent',title:'Investigate the checkout completion drop',area:'Shopify',evidence:'checkout',owner:'E-commerce',confidence:'Medium',status:'Proposed',review:'2026-10-06',action:'Review payment failures and checkout errors; test one fix against the current checkout.',impact:'Potential recovered orders; estimate is calculated from the completion gap.',hypothesis:'Removing an identified checkout issue will improve checkout completion without lowering order value.',control:'Existing checkout experience',duration:'14 days after implementation',success:'Checkout completion improves versus control; AOV does not decline.',history:[]},
 {id:'A02',priority:'High',title:'Test refreshed prospecting creative',area:'Meta',evidence:'M-P',owner:'Paid Media',confidence:'Medium',status:'Proposed',review:'2026-10-07',action:'Compare a refreshed message with the existing collection carousel at equal test budgets.',impact:'CTR recovery is a test hypothesis; revenue impact is not yet estimable.',hypothesis:'A new creative message improves CTR without increasing cost per new customer.',control:'Collection carousel · Version A',duration:'7 days after launch',success:'CTR improves and new-customer CAC does not worsen.',history:[]},
 {id:'A03',priority:'Medium',title:'Reconcile GA4 purchase measurement',area:'GA4',evidence:'reconcile',owner:'Analytics',confidence:'High',status:'Proposed',review:'2026-10-06',action:'Compare purchase IDs, refunds and the revenue definition before using GA4 for revenue decisions.',impact:'Improved reporting confidence. No direct revenue uplift estimate.',hypothesis:'Event and definition checks explain the measurement gap.',control:'Shopify order ledger',duration:'2 business days',success:'Unexplained order and revenue differences documented or resolved.',history:[]}
];
export function validateModel(){
 const p=period(28),m=metrics(p);const checks=[['Unique order IDs',new Set(orders.map(o=>o.id)).size===orders.length],['Orders link to customers',orders.every(o=>customers.some(c=>c.id===o.customerId))],['Orders link to products',orders.every(o=>products.some(c=>c.id===o.productId))],['Media links to campaigns',media.every(r=>campaigns.some(c=>c.id===r.campaignId))],['New and returning revenue reconcile',m.newRevenue+m.returnRevenue===m.revenue],['Campaign spend reconciles',campaigns.reduce((s,c)=>s+campaignMetrics(c.id,p).spend,0)===m.spend],['Website ROAS excludes awareness spend',Math.abs(m.roas-m.revenue/m.performanceSpend)<1e-10&&m.awarenessSpend>0],['Performance spend reconciles to non-awareness campaigns',m.performanceSpend===sum(within(media,p).filter(r=>campaigns.find(c=>c.id===r.campaignId)?.phase!=='Awareness'),'spend')],['Funnel stages are ordered',days.every(d=>d.sessions>=d.views&&d.views>=d.cart&&d.cart>=d.checkout&&d.checkout>=d.purchases)],['Creative spend reconciles',campaigns.every(c=>sum(creativeMetrics(c.id,p),'spend')===campaignMetrics(c.id,p).spend)]];return checks.map(([name,pass])=>({name,pass}));
}
