import {FALLEN_DURATION,RECOVERY_DELAY} from './pedestrian-incidents.js?v=5.6.0';
import {recordAbsence} from './citizen-recovery.js?v=5.6.0';
// Persistent weekly town decisions. Pure definitions also used by collision/render/save.
export const cityChoices=[
 ['arrival','人口が増えた','新しい住民を迎える','新住民を迎え、交通も少し増える。',{population:240,reward:.02,traffic:.05},'livelihood','population'],
 ['quiet','人口が減った','静かな暮らしを選ぶ','税収は減るが、道と復興に余裕が生まれる。',{population:-140,traffic:-.12,rebuild:.15},'livelihood','traffic'],
 ['traffic-up','交通量が増えた','にぎわう街へ','営業の機会と交通が一緒に増える。',{traffic:.12,reward:.07,population:100},'livelihood','reward'],
 ['traffic-down','交通量が減った','ゆったり走れる街へ','走りやすくなる代わりに営業の機会が少し減る。',{traffic:-.12,reward:-.02},'defense','traffic'],
 ['build-up','建物が増えた','新しい街区を育てる','住宅と住民が増え、交通も少し増える。',{buildings:1,population:100,traffic:.04},'livelihood','buildings'],
 ['build-down','建物が減った','広い空間を取り戻す','住宅と人口は減るが、走行と復興を優先できる。',{buildings:-1,population:-90,traffic:-.06,rebuild:.15},'landscape','buildings'],
 ['green-up','自然が増えた','緑を育てる','緑と住民が増え、車も少し増える。',{nature:1,population:130,traffic:.025},'landscape','nature'],
 ['green-down','自然が減った','見通しをよくする','木々を間引き、見通しと仕事の効率を優先する。',{nature:-1,traffic:-.04,reward:.025},'landscape','nature'],
 ['fortify','建物の強度があがった','丈夫な街並みに','補強に人手を回す分、仕事の取り分は少し減る。',{buildingArmor:.2,reward:-.015},'defense','buildingArmor'],
 ['citizens','市民が強くなった','転んでも立ち上がる街へ','市民の復活を増やす。人出と支援の負担も増える。',{resilience:1,crowd:.06,reward:-.02},'defense','resilience'],
 ['roots','自然がタフになった','たくましい木々に','丈夫な木々で災害を和らげる。通行の障害も壊れにくくなる。',{natureArmor:.3,disaster:.15},'defense','natureArmor'],
 ['rainy','梅雨になった','雨の街を楽しむ','7日間は雨が多く滑りやすい。仕事に雨天手当 +14%。',{season:'rainy'},'landscape','season'],
 ['winter','冬になった','雪景色の街へ','7日間は雪が多く滑りやすい。仕事に冬季手当 +22%。',{season:'winter'},'landscape','season'],
 ['spring','春になった','花咲く春の街へ','7日間は晴れが多い。住民を少し迎える。',{season:'spring',population:70},'landscape','season'],
 ['calm','災害が減った','穏やかな日々をつくる','防災に人手を回す分、仕事の取り分は少し減る。',{disaster:.3,reward:-.015},'defense','disaster'],
 ['repair','再建が速くなった','復興を応援する','復興を早める分、仕事の取り分は少し減る。',{rebuild:.25,reward:-.015},'defense','rebuild'],
 ['festival','働きがいが増えた','日雇い応援制度','報酬は増えるが、仕事を求める車と人も増える。',{reward:.08,traffic:.06,crowd:.06},'livelihood','reward'],
 ['neighbors','歩く人が増えた','歩いて楽しい街へ','歩道のにぎわいを育てる。歩行者には気を配ろう。',{crowd:.12,population:180},'livelihood','crowd']
].map(([id,title,name,detail,effect,group,primary])=>({id,title,name,detail,effect,group,primary}));
export const newCity=()=>({seed:Math.floor(Math.random()*4294967295),week:0,offers:[],history:[],population:0,traffic:1,buildings:0,nature:0,buildingArmor:1,natureArmor:1,resilience:0,season:'normal',seasonUntil:0,disaster:1,rebuild:1,reward:1,crowd:1,recoveries:{}});
export function validCity(c){if(c===undefined)return true;if(!c||!Number.isInteger(c.seed)||c.seed<0||c.seed>4294967295||!Number.isInteger(c.week)||c.week<0||c.week>14285)return false;
 const bounds={population:[-5000,10000],traffic:[.5,1.65],buildings:[-5,6],nature:[-5,6],buildingArmor:[1,4],natureArmor:[1,4],resilience:[0,3],seasonUntil:[0,100003],disaster:[1,5],rebuild:[1,4],reward:[.7,3],crowd:[.6,1.6]};for(const [k,[lo,hi]] of Object.entries(bounds))if(!Number.isFinite(c[k])||c[k]<lo||c[k]>hi)return false;
 if(!['normal','rainy','winter','spring'].includes(c.season)||!Array.isArray(c.offers)||![0,3].includes(c.offers.length)||new Set(c.offers).size!==c.offers.length||c.offers.some(id=>!cityChoices.some(x=>x.id===id)))return false;
 if(['population','buildings','nature','resilience','seasonUntil'].some(k=>!Number.isInteger(c[k])))return false;
 if(!Array.isArray(c.history)||c.history.length>14||c.history.some((x,i)=>!x||!Number.isInteger(x.week)||x.week<1||x.week>14||!cityChoices.some(o=>o.id===x.id)||i&&c.history[i-1].week>=x.week))return false;
 if(c.offers.length&&(c.week<1||c.week>14||c.history.some(x=>x.week===c.week)))return false;
 return c.recoveries&&Object.keys(c.recoveries).length<=10000&&Object.entries(c.recoveries).every(([id,n])=>id.length<160&&Number.isInteger(n)&&n>=0&&n<=3);
}
export const cityHash=id=>{let h=2166136261;for(const c of String(id))h=Math.imul(h^c.charCodeAt(0),16777619);return (h>>>0)/4294967296;};
const limits={population:[-5000,10000],traffic:[.5,1.65],buildings:[-5,6],nature:[-5,6],buildingArmor:[1,4],natureArmor:[1,4],resilience:[0,3],disaster:[1,5],rebuild:[1,4],reward:[.7,1.65],crowd:[.6,1.6]};
export function choiceEffect(c,id){const o=cityChoices.find(o=>o.id===id),repeats=c.history.filter(h=>h.id===id).length,scale=1/(1+repeats*.7),effect={};
 for(const [key,value] of Object.entries(o.effect)){if(key==='season'){effect[key]=value;continue;}const raw=['buildings','nature','resilience'].includes(key)?value:key==='population'?Math.round(value*scale):value*scale,[lo,hi]=limits[key],next=Math.max(Math.min(c[key],lo),Math.min(Math.max(c[key],hi),c[key]+raw));effect[key]=Math.round((next-c[key])*1000)/1000;}return effect;}
export function choiceDetail(s,id){const c=s.hero.city,o=cityChoices.find(o=>o.id===id),fx=choiceEffect(c,id),labels={population:'人口',traffic:'交通',buildings:'住宅段階',nature:'緑の段階',buildingArmor:'建物強度',natureArmor:'自然強度',resilience:'復活',disaster:'災害間隔',rebuild:'再建',reward:'仕事報酬',crowd:'人出'};
 const actual=Object.entries(fx).filter(([k,v])=>k!=='season'&&v!==0).map(([k,v])=>labels[k]+' '+(v>0?'+':'')+(['population','buildings','nature','resilience'].includes(k)?v+(k==='population'?'人':k==='resilience'?'回':''):Math.round(v*1000)/10+'%')).join(' / ');return o.detail+(actual?'\n'+actual:'')+(c.history.some(h=>h.id===id)?'\n同じ施策の人口・倍率効果は逓減。':'');}
export function offerCityWeek(h){const c=h.city,week=h.lastTaxWeek;if(week>14||week<1||c.offers.length||c.history.some(x=>x.week===week))return false;
 const eligible=cityChoices.filter(o=>!c.history.slice(-2).some(x=>x.id===o.id)&&(o.primary==='season'?c.season!==o.effect.season||h.day>=c.seasonUntil:choiceEffect(c,o.id)[o.primary]!==0));
 const ordered=eligible.map(o=>({o,n:cityHash(c.seed+':'+week+':'+o.id)})).sort((a,b)=>a.n-b.n);c.week=week;c.offers=[];for(const group of ['livelihood','defense','landscape']){const item=ordered.find(x=>x.o.group===group);if(item)c.offers.push(item.o.id);}for(const item of ordered)if(c.offers.length<3&&!c.offers.includes(item.o.id))c.offers.push(item.o.id);return true;}
export function chooseCity(s,id){const c=s.hero.city;if(!c.offers.includes(id)||c.history.some(x=>x.week===c.week))return false;const choice=cityChoices.find(x=>x.id===id);
 for(const [k,v] of Object.entries(choiceEffect(c,id))){if(k==='season'){c.season=v;c.seasonUntil=s.hero.day+7;s.hero.weather.until=0;}else c[k]=Math.round((c[k]+v)*1000)/1000;}
 c.history.push({week:c.week,id});c.offers=[];s.cityRevision=(s.cityRevision??0)+1;return true;}
export function cityObjectActive(s,o){const c=s?.hero?.city;if(o?.evolutionReserve)return (c?.[o.kind==='tree'?'nature':'buildings']??0)>=o.evolutionReserve;
 if(o?.kind==='tree'&&(c?.nature??0)<0)return cityHash(o.id)>(-c.nature)*.1;
 if(o?.kind==='building'&&!o.facility&&!o.landmark&&!o.vacant&&!o.job&&(c?.buildings??0)<0)return cityHash(o.id)>(-c.buildings)*.05;return true;}
export function cityArmor(s,o){return o?.kind==='building'?(s.hero?.city?.buildingArmor??1):o?.kind==='tree'?(s.hero?.city?.natureArmor??1):1;}
export function harmCitizen(s,p,player=false){if(!p||s.struck.has(p.id))return false;const c=s.hero.city,used=c.recoveries[p.id]??0,survived=used<c.resilience;if(survived)c.recoveries[p.id]=used+1;
 s.struck.set(p.id,{...p,hitAt:s.time,fallenUntil:s.time+(survived?4:FALLEN_DURATION),recoverAt:s.time+(survived?6:FALLEN_DURATION+RECOVERY_DELAY),survived});
 if(player){s.pedestrianHits=Math.min(Number.MAX_SAFE_INTEGER,s.pedestrianHits+1);s.hero.lastHits=s.pedestrianHits;}if(!survived)recordAbsence(s);return true;}
