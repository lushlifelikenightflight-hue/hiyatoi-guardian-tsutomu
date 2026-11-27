import {modificationCost} from './economy.js?v=5.6.0';
import {machineGarages,stoppedGarage} from './garage-sites.js?v=5.6.0';
import {vehicles} from './vehicle-specs.js?v=5.6.0';
import {GARAGE,serviceBays,SERVICE_RADIUS,civicSites} from './world.js?v=5.6.0';

export const upgradeLimit=5;
export const upgradeTypes=[
 {id:'speed',name:'最高速',baseCost:900,unit:'km/h',value:v=>v.max*.432},
 {id:'acceleration',name:'加速',baseCost:800,unit:'km/h / 秒',value:v=>v.accel*.432},
 {id:'cornering',name:'コーナリング',baseCost:700,unit:'度 / 秒',value:v=>v.steer*180/Math.PI},
 {id:'durability',name:'耐久力',baseCost:800,unit:'HP',value:v=>v.hp}
];
export const newUpgrades=()=>vehicles.map(()=>upgradeTypes.map(()=>0));
export const validUpgrades=levels=>Array.isArray(levels)&&levels.length===vehicles.length&&
 levels.every(row=>Array.isArray(row)&&row.length===4&&row.every(n=>Number.isInteger(n)&&n>=0&&n<=upgradeLimit));
export function vehicleStats(s,index=s.vehicle){
 const base=vehicles[index],level=s.upgrades?.[index]??[0,0,0,0];
 return {...base,max:base.max*(1+level[0]*.08),accel:base.accel*(1+level[1]*.10),
  steer:base.steer*(1+level[2]*.08),grip:base.grip*(1+level[2]*.04),hp:base.hp*(1+level[3]*.20)};
}
export const garageSites=machineGarages;
export const garageAt=stoppedGarage;
export function upgradeOffer(s,index,kind){
 const item=upgradeTypes.find(p=>p.id===kind),slot=upgradeTypes.indexOf(item);
 if(!item||!Number.isInteger(index)||index<0||index>=vehicles.length)return null;
 const level=s.upgrades[index][slot],current=vehicleStats(s,index);
 const nextLevels=s.upgrades.map(row=>row.slice());
 nextLevels[index][slot]=Math.min(upgradeLimit,level+1);
 return {item,level,cost:modificationCost(item,index,level),current,next:vehicleStats({upgrades:nextLevels},index),maxed:level===upgradeLimit};
}
export function buyUpgrade(s,index,kind){
 const offer=upgradeOffer(s,index,kind);
 if(!offer)return {ok:false,message:'強化項目を確認してください。'};
 if(s.hero?.owned[index]===false)return {ok:false,message:'先にこの乗り物を購入してください。'};
 if(!garageAt(s))return {ok:false,message:'ガレージの中で停車してください。'};
 if(offer.maxed)return {ok:false,message:'最大まで強化済みです。'};
 if(!Number.isSafeInteger(s.points)||s.points<offer.cost)return {ok:false,message:'ポイントが足りません。'};
 if(s.health[index]<=0)return {ok:false,message:'この乗り物を修理してから強化してください。'};
 const ratio=Math.min(1,s.health[index]/offer.current.hp);
 s.points-=offer.cost;
 s.upgrades[index][upgradeTypes.indexOf(offer.item)]++;
 s.health[index]=ratio*offer.next.hp;
 return {ok:true,message:offer.item.name+'をLv.'+(offer.level+1)+'に強化しました。'};
}
