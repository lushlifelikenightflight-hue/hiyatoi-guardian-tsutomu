import {roadside} from './job-contracts.js?v=5.6.0';
import {world,civicSites,responseRoadPath,blocked} from './world.js?v=5.6.0';
export const extraJobTypes=[{id:'survey',name:'道路・設備の巡回点検',vehicle:0,reward:320},{id:'food',name:'スクーターの出前',vehicle:3,reward:240},{id:'race',name:'スポーツカーの市街地レース',vehicle:4,reward:280},{id:'security',name:'装甲車の警備輸送',vehicle:9,reward:650},{id:'restoration',name:'ロボの災害復旧',vehicle:10,reward:1000}];
export function extraContract(s,spec,random=Math.random){
 const serial=(s.hero.jobCount??0)+Math.floor(random()*1000),all=world.props.filter(p=>p.job==='bus'||p.job==='mail');
 let pool=all.map(p=>({id:p.id,name:spec.id==='food'?'注文先':'巡回地点',...roadside(p,spec.vehicle===10?24:12),siteX:p.x,siteY:p.y}));
 if(spec.id==='security'||spec.id==='restoration')pool=civicSites.map(p=>({id:p.id,name:spec.id==='security'?'警備拠点・荷物を引き渡す':'災害復旧・作業地点',x:p.x,y:p.y,siteX:p.bx,siteY:p.by}));
 if(spec.id==='race'){const circuit=serial%4>=2?[{x:1700,y:1460},{x:2600,y:1460},{x:2600,y:910},{x:1700,y:910},{x:1700,y:1460}]:[{x:580,y:1460},{x:1700,y:1460},{x:1700,y:910},{x:580,y:910},{x:580,y:1460}];const reverse=serial%2===1,points=reverse?circuit.slice().reverse():circuit;pool=points.map((p,i)=>({...p,id:'race-gate-'+i,name:i===points.length-1?'フィニッシュ':'チェックポイント '+(i+1)}));}
 pool=pool.filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)&&!blocked(p.x,p.y,spec.vehicle===10?24:12));if(pool.length<2)return null;
 let stops=spec.id==='race'?pool:pool.map((p,i)=>({...p,order:((i*57+serial*23)%131)})).sort((a,b)=>a.order-b.order).slice(0,spec.id==='food'?3:3+serial%2);
 if(spec.id==='food'){const shop=civicSites.find(p=>p.type==='market')??civicSites.find(p=>p.type==='workshop');stops=[{id:'food-pickup',name:'お店で出前を受け取る',x:shop.x,y:shop.y,siteX:shop.bx,siteY:shop.by},...stops.slice(0,2)];}
 let previous=spec.id==='race'?stops[0]:s,length=0;for(const p of stops){length+=responseRoadPath(p.x,p.y,[previous])?.distance??Math.hypot(p.x-previous.x,p.y-previous.y);previous=p;}
 const plannedMetres=Math.round(length*.12);return {...spec,stops,index:0,hold:0,passengers:0,service:null,plannedMetres,serviceDuration:spec.id==='restoration'?3:1.8,passThrough:spec.id==='race',timeLimit:spec.id==='race'?120:spec.id==='food'?Math.max(120,plannedMetres/3+60):null,reward:Math.ceil((spec.reward+plannedMetres*(spec.id==='race'?.32:spec.id==='food'?.5:spec.id==='survey'?.45:spec.id==='restoration'?.45:spec.id==='security'?.5:.4)+(spec.id==='food'?(stops.length-1)*90:0))/10)*10};
}