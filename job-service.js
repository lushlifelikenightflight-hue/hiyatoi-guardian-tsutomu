import {blocked} from './world.js?v=5.5.0';
import {vehicles} from './vehicle-specs.js?v=5.5.0';

export const serviceSeconds=1.5,jobFeedbackSeconds=3.4;
const clamp=t=>Math.max(0,Math.min(1,t));
const smooth=t=>{t=clamp(t);return t*t*(3-2*t);};
const mix=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});

export function serviceCounts(job){
 if(job.id==='ambulance')return {board:job.index===0?1:0,alight:job.index===0?0:1};
 if(job.id==='taxi')return {board:job.index===0?1:0,alight:job.index===0?0:1};
 if(job.id==='bus')return {board:job.index===job.stops.length-1?0:3,alight:job.index===job.stops.length-1?(job.passengers??0):Math.min(2,job.passengers??0)};
 return {board:0,alight:0};
}
export function captureService(s,job,stop){
 const v=vehicles[job.vehicle],c=Math.cos(s.heading),n=Math.sin(s.heading);
 const site={x:stop.siteX??stop.x-43,y:stop.siteY??stop.y};
 const toCar=Math.atan2(stop.y-site.y,stop.x-site.x);
 const offset=job.id==='taxi'?0:job.id==='bus'?-14:14;
 const preferred={x:site.x+Math.cos(toCar)*offset,y:site.y+Math.sin(toCar)*offset};
 const candidates=[[0,0],[0,12],[0,-12],[12,0],[-12,0],[18,12],[-18,-12]].map(([dx,dy])=>({x:preferred.x+dx,y:preferred.y+dy}));
 const curb=candidates.find(p=>!blocked(p.x,p.y,4,s))??preferred;
 const side=(curb.x-s.x)*(-n)+(curb.y-s.y)*c>=0?1:-1;
 const door={x:s.x-n*side*(v.r+2),y:s.y+c*side*(v.r+2)};
 return {id:job.id,index:job.index,total:job.stops.length,vehicle:job.vehicle,x:s.x,y:s.y,heading:s.heading,queueHeading:toCar+Math.PI/2,side,curb,door,site,...serviceCounts(job)};
}
export function servicePhase(job){
 if(['survey','food','race','security','restoration'].includes(job.id))return {survey:'設備を点検中',food:job.index===0?'出前を受け取り中':'料理を届けています',race:'チェックポイント',security:'警備荷物の引き渡し中',restoration:'がれき撤去作業中'}[job.id];
 if(job.id==='fire')return '放水・消火中';
 if(job.id==='ambulance')return job.index===0?'救護・収容中':'病院へ搬送中';
 if(job.id==='taxi')return job.index===0?'乗車中':'降車中';
 return job.id==='bus'?'乗り降り中':job.id==='mail'?'配達中':'解体中';
}
export function serviceCompletion(snapshot,finished){
 if(['survey','food','race','security','restoration'].includes(snapshot.id))return {label:finished?'仕事完了':'目的地完了',detail:({survey:'点検',food:'出前',race:'チェックポイント',security:'警備輸送',restoration:'復旧作業'}[snapshot.id])+' '+(snapshot.index+1)+' / '+snapshot.total};
 if(snapshot.id==='fire'||snapshot.id==='ambulance')return {label:finished?'救援完了':'救護完了',detail:snapshot.id==='fire'?'火災を鎮火しました':finished?'病院へ搬送しました':'負傷者を収容。病院へ向かおう。'};
 const label=snapshot.id==='taxi'?(snapshot.board?'乗車完了':'降車完了'):snapshot.id==='bus'?'乗降完了':snapshot.id==='mail'?'配達完了':'解体完了';
 const detail=snapshot.id==='mail'?(snapshot.index+1)+' / '+snapshot.total+' 件を配達':snapshot.id==='demolition'?'指定建物の解体が完了':
  (snapshot.alight?'降車 '+snapshot.alight+'人　':'')+(snapshot.board?'乗車 '+snapshot.board+'人':'');
 return {label:finished?'仕事完了':label,detail:(snapshot.id==='bus'?(snapshot.index+1)+' / '+snapshot.total+' 停留所　':'')+detail+(finished?'':snapshot.id==='taxi'?'　次は送迎先へ':'　次の目的地へ')};
}

// Presentation actors stay separate from traffic/crowd simulation and never award points.
export function serviceVisuals(s,reduced=false){
 const actors=[],parcels=[];let active=null;
 const job=s.work;
 if(job&&!job.stops[job.index].building&&Math.hypot(s.x-job.stops[job.index].x,s.y-job.stops[job.index].y)<500){
  const snap=job.service??captureService(s,job,job.stops[job.index]);
  const p=clamp(job.hold/(job.serviceDuration??serviceSeconds)),t=reduced ? .5 : p;
  const waiting=job.hold===0;
  const c=Math.cos(snap.queueHeading),n=Math.sin(snap.queueHeading);
  const add=(id,point,heading,style,opacity=1,parcel=false,moving=true)=>actors.push({id:'service-'+id,kind:'pedestrian',...point,heading,style,pose:waiting||reduced||!moving?'stand':Math.floor(s.time*7+style)%2?'walk-a':'walk-b',opacity,parcel});
  for(let i=0;i<snap.board;i++){
   const curb={x:snap.curb.x+c*i*9,y:snap.curb.y+n*i*9};
   const progress=waiting?0:smooth((t-.10-i*.10)/(.76-i*.08));
   add('board-'+i,mix(curb,snap.door,progress),Math.atan2(snap.door.y-curb.y,snap.door.x-curb.x),snap.id==='taxi'?0:i+2,1-smooth((progress-.8)/.2),false,progress>0&&progress<1);
  }
  if(!waiting)for(let i=0;i<snap.alight;i++){
   const curb={x:snap.curb.x-c*(i+1)*9,y:snap.curb.y-n*(i+1)*9};
   const progress=smooth((t-.04-i*.08)/.53);
   add('alight-'+i,mix(snap.door,curb,progress),Math.atan2(curb.y-snap.door.y,curb.x-snap.door.x),snap.id==='taxi'?0:i+4,smooth(progress/.18),false,progress<1);
  }
  if((snap.id==='mail'||snap.id==='food')&&!waiting){
   const progress=smooth((t-.08)/.70),point=mix(snap.door,snap.curb,progress);
   add('courier',point,Math.atan2(snap.curb.y-snap.door.y,snap.curb.x-snap.door.x),1,1,t<.84,progress<1);
   if(t>=.84)parcels.push({...snap.site,z:18,opacity:1-smooth((t-.84)/.16)});
  }
  if(!waiting)active={...snap,progress:p,phase:servicePhase(job),open:reduced?1:smooth(p/.18)*(1-smooth((p-.80)/.20))};
 }
 const effect=s.jobEffect,age=effect?s.time-effect.at:Infinity;
 if(effect&&age>=0&&age<jobFeedbackSeconds){
  const opacity=1-smooth((age-2)/1.4),c=Math.cos(effect.queueHeading),n=Math.sin(effect.queueHeading);
  for(let i=0;i<effect.alight;i++)actors.push({id:'service-depart-'+i,kind:'pedestrian',x:effect.curb.x-c*(i+1)*9+(reduced?0:c*age*8),y:effect.curb.y-n*(i+1)*9+(reduced?0:n*age*8),heading:effect.queueHeading,style:effect.id==='taxi'?0:i+4,pose:reduced?'stand':Math.floor(s.time*5+i)%2?'walk-a':'walk-b',opacity});
  if(effect.id==='mail'&&age<1.6){
   const progress=reduced?1:smooth(age/1.5),point=mix(effect.curb,effect.door,progress);
   actors.push({id:'service-courier-return',kind:'pedestrian',...point,heading:Math.atan2(effect.door.y-effect.curb.y,effect.door.x-effect.curb.x),style:1,pose:reduced?'stand':Math.floor(s.time*7)%2?'walk-a':'walk-b',opacity:1-progress});
  }
 }
 return {actors,parcels,active};
}
