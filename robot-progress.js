import {queueVehicleTalk} from './vehicle-talk.js?v=5.6.0';
import {roads,WEST_EDGE,SIZE,world,spots} from './world.js?v=5.6.0';
import {segmentDistance} from './geometry.js?v=5.6.0';
export const ROBOT_INDEX=10;
export const robotParts=[
 {id:'right-arm',name:'封印されしロボの右腕',cost:18000,condition:'4日目に到達',test:(s,p)=>s.hero.day>=4},
 {id:'left-arm',name:'封印されしロボの左腕',cost:22000,condition:'怪獣を2回撃退',test:(s,p)=>s.hero.raids>=2},
 {id:'head',name:'封印されしロボのあたま',cost:24000,condition:'マップ占有率25%以上',test:(s,p)=>occupancy(p)>=25},
 {id:'torso',name:'封印されしロボの胴体',cost:30000,condition:'武器を合計4回強化',test:(s,p)=>p.weaponUpgrades>=4},
 {id:'left-leg',name:'封印されしロボの左足',cost:20000,condition:'指定の無人解体施設を5回破壊',test:(s,p)=>p.demolitions>=5},
 {id:'right-leg',name:'封印されしロボの右足',cost:24000,condition:'人口が一度でも6,000人以上',test:(s,p)=>p.peakPopulation>=6000}
];
export const surveyCells=[];for(let y=0;y<Math.ceil(SIZE.h/600);y++)for(let x=0;x<Math.ceil((SIZE.w-WEST_EDGE)/600);x++){const px=WEST_EDGE+(x+.5)*600,py=(y+.5)*600;if(roads.some(r=>segmentDistance(px,py,r)<460))surveyCells.push(x+','+y);}
const allowedCells=new Set(surveyCells),ids=robotParts.map(p=>p.id);
export const newRobotProgress=()=>({parts:[],unlocks:[],cells:[],weaponUpgrades:0,demolitions:0,peakPopulation:0,weapon:'rifle'});
export const occupancy=p=>Math.min(100,(p?.cells?.length??0)/surveyCells.length*100);
export function validRobotProgress(p){return p&&['parts','unlocks','cells'].every(k=>Array.isArray(p[k])&&new Set(p[k]).size===p[k].length)&&p.parts.every(id=>ids.includes(id))&&p.unlocks.every(id=>ids.includes(id))&&p.parts.every(id=>p.unlocks.includes(id))&&p.cells.every(id=>allowedCells.has(id))&&['weaponUpgrades','demolitions','peakPopulation'].every(k=>Number.isSafeInteger(p[k])&&p[k]>=0&&p[k]<=1e9)&&['rifle','sword'].includes(p.weapon);}
export function updateRobotProgress(s,population){const p=s.hero.robot??=newRobotProgress();p.weaponUpgrades=Math.max(p.weaponUpgrades,s.hero.weaponLevels.reduce((a,b)=>a+b,0));p.peakPopulation=Math.max(p.peakPopulation,population);const cell=Math.floor((s.x-WEST_EDGE)/600)+','+Math.floor(s.y/600);if(allowedCells.has(cell)&&!p.cells.includes(cell))p.cells.push(cell);
 for(const part of robotParts)if(!p.unlocks.includes(part.id)&&part.test(s,p))p.unlocks.push(part.id);
 if(robotParts.every(part=>p.parts.includes(part.id)))s.hero.owned[ROBOT_INDEX]=true;return p;
}
export function recordDemolition(s,b){if(b?.demolitionSite&&b.vacant)(s.hero.robot??=newRobotProgress()).demolitions++;}
export function buyRobotPart(s,id,population){const p=updateRobotProgress(s,population),part=robotParts.find(p=>p.id===id);if(!part||!p.unlocks.includes(id))return {ok:false,message:'封印解除の条件を満たしていません。'};if(p.parts.includes(id))return {ok:false,message:'購入済みです。'};if(!Number.isSafeInteger(s.points)||s.points<part.cost)return {ok:false,message:'ポイントが足りません。'};s.points-=part.cost;p.parts.push(id);const assembled=p.parts.length===6;if(assembled){s.hero.owned[ROBOT_INDEX]=true;queueVehicleTalk(s,ROBOT_INDEX);}return {ok:true,message:assembled?'封印解除！ デストロイキングが完成。乗り換えから出動できます。':part.name+'を購入しました。'};}
