import {destinations,responseRoadPath,SERVICE_RADIUS} from './world.js?v=5.6.0';
import {jobTarget} from './jobs.js?v=5.6.0';
import {railExitPath} from './rail-drive.js?v=5.6.0';

export function guidanceTarget(s,target){
 if(s.trial||s.pursuit||s.broken)return null;
 if(s.hero?.guideMonster&&s.hero.monster){const m=s.hero.monster;return {id:'monster-'+Math.round(m.x/100)+'-'+Math.round(m.y/100),name:'怪獣の防衛地点',x:m.x,y:m.y,serviceRoute:false};}
 const selected=destinations.find(p=>p.id===(s.serviceGuide??target));
 const selectedGoal=selected?.railExit?{...selected,x:selected.landing[0],y:selected.landing[1],railRoute:s.surface==='rail'}:selected;
 if(s.serviceGuide&&selectedGoal)return {...selectedGoal,serviceRoute:true};
 const job=jobTarget(s);
 if(job)return {...job,serviceRoute:false};
 return selectedGoal&&(selectedGoal.service||selectedGoal.railEntry||selectedGoal.railExit||selectedGoal.heroFacility||selectedGoal.id==='garage')?{...selectedGoal,serviceRoute:true}:null;
}

function segments(points){
 let total=0;
 return points.slice(1).map((b,i)=>{
  const a=points[i],length=Math.hypot(b[0]-a[0],b[1]-a[1]),start=total;total+=length;
  return {a,b,length,start,end:total,angle:Math.atan2(b[1]-a[1],b[0]-a[0])};
 }).filter(p=>p.length>.01);
}
export function routeProjection(lines,x,y){
 let best={distance:Infinity,along:0};
 for(const p of lines){
  const t=Math.max(0,Math.min(1,((x-p.a[0])*(p.b[0]-p.a[0])+(y-p.a[1])*(p.b[1]-p.a[1]))/p.length**2));
  const distance=Math.hypot(x-p.a[0]-(p.b[0]-p.a[0])*t,y-p.a[1]-(p.b[1]-p.a[1])*t);
  if(distance<=best.distance)best={distance,along:p.start+t*p.length};
 }
 return best;
}
export function routeArrows(points,x,y,{spacing=54,reach=760}={}){
 const lines=segments(points),near=routeProjection(lines,x,y),length=lines.at(-1)?.end??0,arrows=[];
 for(let at=near.along+24;at<Math.min(length-12,near.along+reach);at+=spacing){
  const line=lines.find(p=>p.end>=at);if(!line)continue;
  const t=(at-line.start)/line.length;
  arrows.push({x:line.a[0]+(line.b[0]-line.a[0])*t,y:line.a[1]+(line.b[1]-line.a[1])*t,angle:line.angle,ahead:at-near.along});
 }
 return {arrows,remaining:Math.max(0,length-near.along),distance:near.distance};
}
export class RoadGuidance{
 constructor(){this.cache=null;this.last=null;this.builds=0;}
 update(s,target){
  const goal=guidanceTarget(s,target);
  if(!goal){this.cache=null;return this.last=null;}
  const key=goal.id+':'+goal.x+','+goal.y+':'+Boolean(goal.railRoute),c=this.cache;
  const moved=c?Math.hypot(s.x-c.x,s.y-c.y):Infinity;
  const off=c?routeProjection(c.lines,s.x,s.y).distance:Infinity;
  if(!c||c.key!==key||moved>500||((moved>80||off>32&&moved>20)&&s.time-c.time>.35)){
   const join=goal.railEntry?goal.approach[0]:[goal.x,goal.y];
   const points=goal.railRoute?railExitPath(s.x,s.y,goal):(responseRoadPath(join[0],join[1],[{x:s.x,y:s.y}])?.points??[]);
   if(goal.railEntry&&points.length)for(const p of goal.approach.slice(1)){if(Math.hypot(p[0]-points.at(-1)[0],p[1]-points.at(-1)[1])>.1)points.push(p);}
   this.cache={key,x:s.x,y:s.y,time:s.time,points,lines:segments(points)};this.builds++;
  }
  const route=routeArrows(this.cache.points,s.x,s.y);
  const arrived=(!goal.railExit||((s.deck??0)<5&&s.z<4))&&Math.hypot(s.x-goal.x,s.y-goal.y)<(goal.railEntry?26:goal.railExit?32:goal.serviceRoute?(goal.service?SERVICE_RADIUS:65):30);
  return this.last={...route,arrows:arrived?[]:route.arrows,arrived,goal,points:this.cache.points};
 }
}
