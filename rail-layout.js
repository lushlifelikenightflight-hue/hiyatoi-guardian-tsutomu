import {segmentDistance} from './geometry.js?v=5.6.1';

export const STATION={x:2180,y:1200,w:454,d:140,h:106};
export const SOUTH_STATION={x:4960,y:7400,w:454,d:140,h:106};
export const stations=[STATION,SOUTH_STATION];
export const RAIL={y:1200,x0:110,x1:3190};
export const railPoints=[
 [RAIL.x0,1200,0],[3190,1200,0],[3490,1200,138],[3990,1200,160],
 [5970,1200,160],[6210,1230,160],[6390,1360,160],[6460,1590,160],
 [6460,6820,160],[6430,7120,155],[6300,7310,132],[6070,7390,106],
 [5810,7400,70],[5610,7400,0],[4130,7400,0]
];
let length=0;
export const railSegments=railPoints.slice(1).map((b,i)=>{
 const a=railPoints[i],start=length;
 const dx=b[0]-a[0],dy=b[1]-a[1];
 length+=Math.hypot(dx,dy);
 return {a,b,start,end:length,angle:Math.atan2(dy,dx)};
});
export const railLength=length;
function railNormal(before,after){
 const a=before?.angle??after.angle,b=after?.angle??before.angle;
 const factor=1+Math.cos(a-b);
 return [(Math.sin(a)+Math.sin(b))/factor,(-Math.cos(a)-Math.cos(b))/factor];
}
for(const [i,segment] of railSegments.entries()){
 segment.startNormal=railNormal(railSegments[i-1],segment);
 segment.endNormal=railNormal(segment,railSegments[i+1]);
}

export function railPose(distance){
 const first=railSegments[0],last=railSegments.at(-1);
 const segment=distance<0?first:railSegments.find(s=>distance<=s.end)??last;
 const t=(distance-segment.start)/(segment.end-segment.start);
 const [x,y,z]=segment.a.map((v,i)=>v+(segment.b[i]-v)*t);
 const u=Math.max(0,Math.min(1,t)),blend=segment.startNormal.map((v,i)=>v+(segment.endNormal[i]-v)*u);
 return {x,y,z,angle:segment.angle,normal:blend};
}
export function railClearance(x,y,r=0,height=0){
 return railSegments.some(s=>{
  if(segmentDistance(x,y,s)>r+51)return false;
  const dx=s.b[0]-s.a[0],dy=s.b[1]-s.a[1];
  const t=Math.max(0,Math.min(1,((x-s.a[0])*dx+(y-s.a[1])*dy)/(dx*dx+dy*dy)));
  return s.a[2]+(s.b[2]-s.a[2])*t<height+13;
 });
}
export const crossings=[
 ...[580,1700,2600,3060].map((x,i)=>({id:'crossing-'+i,x,y:RAIL.y,w:i===1?82:70})),
 {id:'crossing-south',x:5520,y:7400,w:76}
];
