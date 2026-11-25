import {world,roads,destinations,blocked,isDestroyed,responseRoadPath} from './world.js?v=5.3.0';

export function roadside(o,radius=11){
 let best=null,gap=Infinity;
 for(const r of roads){
  const dx=r.b[0]-r.a[0],dy=r.b[1]-r.a[1],t=Math.max(.02,Math.min(.98,((o.x-r.a[0])*dx+(o.y-r.a[1])*dy)/(dx*dx+dy*dy)));
  const x=r.a[0]+dx*t,y=r.a[1]+dy*t,d=Math.hypot(x-o.x,y-o.y);
  if(d<gap&&!blocked(x,y,radius)){best={x,y};gap=d;}
 }
 return best;
}
export function validJobHistory(h){return Array.isArray(h)&&h.length<=8&&h.every(r=>r&&['taxi','mail','bus','demolition'].includes(r.type)&&Array.isArray(r.stops)&&(r.type==='demolition'?r.stops.length===1:r.type==='taxi'?r.stops.length===2:r.stops.length>=2&&r.stops.length<=(r.type==='bus'?6:5))&&new Set(r.stops).size===r.stops.length&&r.stops.every(id=>typeof id==='string'&&/^[a-z0-9-]{1,80}$/.test(id))&&Array.isArray(r.cells)&&r.cells.length<=96&&r.cells.every(c=>typeof c==='string'&&/^-?\d{1,3},-?\d{1,3}$/.test(c)));}
export function rememberJob(s,job){
 if(!['taxi','mail','bus','demolition'].includes(job.id))return;
 s.jobHistory=[...(s.jobHistory??[]),{type:job.id,stops:job.stops.map(p=>p.id),cells:(job.routeCells??[]).slice(0,96)}].slice(-8);
}
export function contractReward(id,metres,count){return Math.ceil((id==='taxi'?110+metres*.50:id==='bus'?80+count*90+metres*.40:70+count*80+metres*.45)/10)*10;}
export function demolitionEstimate(b,damage=0){
 const area=b.w*b.d*.12**2,height=b.h*.12,remaining=Math.max(0,b.hp-damage);
 const strength=b.resistance??1,work=remaining/Math.max(1,b.hp);
 return {area:Math.round(area),height:Math.round(height*10)/10,remainingHp:Math.ceil(remaining),maximumHp:b.hp,strength,reward:Math.ceil((100+(area*.8+area*height*.08)*work+remaining*strength*.35)*1.8/10)*10};
}
export function demolitionContract(s,random=Math.random){
 const recent=(s.jobHistory??[]).filter(h=>h.type==='demolition'),last=recent.at(-1);
 const pool=world.buildings.filter(b=>b.kind==='building'&&b.demolitionSite&&b.vacant&&!isDestroyed(s,b.id));
 const fresh=pool.filter(b=>!last?.stops.includes(b.id)),eligible=fresh.length?fresh:pool;
 const choices=eligible.map(b=>({b,k:random()})).sort((a,b)=>a.k-b.k);let best=null,score=Infinity;
 for(const {b} of choices.slice(0,64)){
  const stop=roadside(b,14);if(!stop||Math.hypot(stop.x-b.x,stop.y-b.y)>Math.max(b.w,b.d)/2+85)continue;
  const name=b.vacant?(b.sign+'（無人）'):b.sign??({wood:'木造',brick:'レンガ造',concrete:'鉄筋コンクリート造'}[b.material]??'')+'建物';
  const near=destinations.reduce((a,p)=>Math.hypot(p.x-b.x,p.y-b.y)<Math.hypot(a.x-b.x,a.y-b.y)?p:a);
  const stops=[{...stop,id:b.id,building:b.id,name:near.name+'近くの'+name}],quote=route(s,stops);if(!quote)continue;
  const overlap=quote.routeCells.filter(c=>last?.cells.includes(c)).length/Math.max(1,quote.routeCells.length),reused=recent.slice(-3).some(h=>h.stops.includes(b.id))?1:0;
  if(overlap+reused<score){score=overlap+reused;best={stops,...quote,demolition:demolitionEstimate(b,s.damage?.[b.id]??0)};best.reward=best.demolition.reward;}
  if(score===0)break;
 }
 return best;
}
export function jobPool(s,id){
 const pool=id==='taxi'?destinations.filter(p=>!p.railEntry&&!p.railExit&&!p.heroFacility).map(p=>({...p,id:'taxi-'+p.id})):world.props.filter(p=>p.job===id&&!isDestroyed(s,p.id));
 return pool.flatMap(p=>{
  const stop=id==='bus'&&Number.isFinite(p.stopX)?{x:p.stopX,y:p.stopY}:roadside(p,id==='bus'?15:12);if(!stop)return [];
  let site=p;
  if(id==='taxi'){
   const heading=Math.atan2(p.y-stop.y,p.x-stop.x);
   site=Array.from({length:16},(_,i)=>{const a=heading+i*Math.PI/8;return {x:stop.x+Math.cos(a)*43,y:stop.y+Math.sin(a)*43};}).find(c=>!blocked(c.x,c.y,4))??stop;
  }
  return [{id:p.id,area:p.busArea??({'bus-station':'station','bus-castle':'castle','bus-farm':'farm','bus-hill':'hill'}[p.id]),roadAngle:p.roadAngle,name:p.jobName??p.name??({'bus-station':'駅北バス停','bus-castle':'宵影城バス停','bus-farm':'ひばり牧場バス停','bus-hill':'花帆の丘バス停','post-station':'駅北のポスト','post-west':'西町のポスト','post-farm':'牧場のポスト','post-hill':'花帆のポスト'}[p.id])??'街角のポスト',siteX:site.x,siteY:site.y,...stop}];
 });
}
function route(s,stops){
 let from=s,distance=0;const cells=new Set();
 for(const stop of stops){
  const path=responseRoadPath(stop.x,stop.y,[from]);if(!path)return null;
  distance+=path.distance;
  for(let i=1;i<path.points.length;i++){const a=path.points[i-1],b=path.points[i],n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/250));for(let j=0;j<=n;j++)cells.add(Math.floor((a[0]+(b[0]-a[0])*j/n)/500)+','+Math.floor((a[1]+(b[1]-a[1])*j/n)/500));}
  from=stop;
 }
 return {plannedMetres:Math.max(1,Math.round(distance*.12)),routeCells:[...cells].slice(0,96)};
}
export function variedContract(s,id,random=Math.random){
 if(id==='bus')return busContract(s,random);
 const recent=(s.jobHistory??[]).filter(h=>h.type===id),last=recent.at(-1),pool=jobPool(s,id);
 if(pool.length<2)return null;
 const maximum=Math.min(id==='bus'?4:5,pool.length);
 let count=id==='taxi'?2:2+Math.floor(random()*(maximum-1));
 if(id!=='taxi'&&count===last?.stops.length&&maximum>2)count=count===maximum?2:count+1;
 const fresh=pool.filter(p=>!last?.stops.includes(p.id));
 const eligible=fresh.length>=count?fresh:pool;
 const previousCells=new Set(last?.cells??[]);let best=null,bestScore=Infinity;
 for(let attempt=0;attempt<4;attempt++){
  const choices=eligible.map(p=>({p,k:random()})).sort((a,b)=>a.k-b.k).map(a=>a.p);
  let stops;
  if(id==='taxi'){
   const pickup=choices[0],drop=choices.find(p=>p.id!==pickup.id&&Math.hypot(p.x-pickup.x,p.y-pickup.y)>500)??choices[1];stops=[pickup,drop];
  }else{
   const remaining=choices.slice(0,count);stops=[];let from=s;
   while(remaining.length){remaining.sort((a,b)=>Math.hypot(a.x-from.x,a.y-from.y)-Math.hypot(b.x-from.x,b.y-from.y));from=remaining.shift();stops.push(from);}
  }
  const quote=route(s,stops);if(!quote)continue;
  const overlap=quote.routeCells.filter(c=>previousCells.has(c)).length/Math.max(1,quote.routeCells.length);
  const reused=stops.filter(p=>recent.slice(-3).some(h=>h.stops.includes(p.id))).length;
  const score=overlap*5+reused/count;
  if(score<bestScore){bestScore=score;best={stops,...quote,reward:contractReward(id,quote.plannedMetres,count)};}
 }
 return best;
}

export function busContract(s,random=Math.random){
 const pool=jobPool(s,'bus');if(pool.length<2)return null;
 const recent=(s.jobHistory??[]).filter(h=>h.type==='bus'),last=recent.at(-1);
 const previousClass=!last?'long':last.stops.length<=3?'short':last.stops.length===4?'medium':'long';
 const routeClass=previousClass==='short'?'medium':previousClass==='medium'?'long':'short';
 const desired=routeClass==='short'?2+Math.floor(random()*2):routeClass==='medium'?4:5+Math.floor(random()*2);
 const count=Math.min(desired,pool.length),fresh=pool.filter(p=>!last?.stops.includes(p.id));
 const visits=p=>recent.reduce((sum,h,i)=>sum+(h.stops.includes(p.id)?i+1:0),0);
 const target=routeClass==='short'?350:routeClass==='medium'?950:2200;
 let best=null,score=Infinity;
 // Try unused stops first; a local route may reuse a stop if destruction leaves no short option.
 for(const candidates of [fresh.length>=count?fresh:pool,pool]){
  for(let attempt=0;attempt<12;attempt++){
   const candidateCount=routeClass==='short'&&attempt>=6?2:count;
   const shuffled=candidates.map(p=>({p,k:random()+visits(p)*.45})).sort((a,b)=>a.k-b.k).map(o=>o.p);
   let selected;
   if(routeClass==='long')selected=shuffled.slice(0,candidateCount);
   else{
    const near=shuffled.slice().sort((a,b)=>Math.hypot(a.x-s.x,a.y-s.y)-Math.hypot(b.x-s.x,b.y-s.y));
    const seed=near[attempt%Math.min(8,near.length)];
    selected=[seed,...shuffled.filter(p=>p!==seed).sort((a,b)=>(Math.hypot(a.x-seed.x,a.y-seed.y)+visits(a)*400)-(Math.hypot(b.x-seed.x,b.y-seed.y)+visits(b)*400)).slice(0,candidateCount-1)];
   }
   let from=s;const stops=[];
   while(selected.length){selected.sort((a,b)=>Math.hypot(a.x-from.x,a.y-from.y)-Math.hypot(b.x-from.x,b.y-from.y));from=selected.shift();stops.push(from);}
   const quote=route(s,stops);if(!quote)continue;
   if(routeClass==='short'&&quote.plannedMetres>650)continue;
   if(routeClass==='long'&&pool.length>=8&&quote.plannedMetres<1400)continue;
   const overlap=quote.routeCells.filter(c=>last?.cells.includes(c)).length/Math.max(1,quote.routeCells.length);
   const reuse=stops.reduce((sum,p)=>sum+visits(p),0)/stops.length;
   const value=Math.abs(quote.plannedMetres-target)/700+reuse*1.5+overlap;
   if(value<score){score=value;best={stops,...quote,routeClass,routeLabel:{short:'近隣便',medium:'エリア連絡便',long:'街めぐり便'}[routeClass],reward:contractReward('bus',quote.plannedMetres,stops.length)};}
  }
  if(best)break;
 }
 // With a sparse/damaged network, offer the closest feasible service instead of a dead menu.
 if(!best){const stops=pool.slice().sort((a,b)=>Math.hypot(a.x-s.x,a.y-s.y)-Math.hypot(b.x-s.x,b.y-s.y)).slice(0,Math.min(2,pool.length)),quote=route(s,stops);if(quote)best={stops,...quote,routeClass:'limited',routeLabel:'臨時便',reward:contractReward('bus',quote.plannedMetres,stops.length)};}
 return best;
}
