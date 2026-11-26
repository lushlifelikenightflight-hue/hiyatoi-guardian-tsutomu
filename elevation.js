import {clamp} from './geometry.js?v=5.5.0';

export const elevations=[
 {id:'west-residential-rise',x:-1860,y:480,rx:1880,ry:1230,h:62},
 {id:'west-garden-terrace',x:-1800,y:2880,rx:1590,ry:1250,h:54},
 {id:'station-upland',x:1080,y:290,rx:1540,ry:980,h:34},
 {id:'park-woodland',x:780,y:2850,rx:1000,ry:1250,h:32},
 {id:'east-avenue-rise',x:4740,y:620,rx:1570,ry:1050,h:78},
 {id:'east-orchard-slope',x:4830,y:2830,rx:1610,ry:1300,h:72},
 {id:'apricot-terraces',x:-1750,y:4460,rx:1620,ry:1250,h:64},
 {id:'watergate-bank',x:1220,y:5660,rx:1100,ry:1000,h:35},
 {id:'hill-approach',x:4770,y:4570,rx:1340,ry:1230,h:65},
 {id:'terminus-terrace',x:4370,y:7000,rx:990,ry:870,h:44},
 {id:'castle-ridge',x:-2760,y:6940,rx:395,ry:430,h:129},
 {id:'hill-heights',x:5250,y:5860,rx:485,ry:385,h:108},
 {id:'farm-knoll',x:-1290,y:6750,rx:420,ry:330,h:58}
];

export function groundHeight(x,y,regions=elevations){
 let height=0;
 for(const b of regions){
  if(Math.abs(x-b.x)>=b.rx||Math.abs(y-b.y)>=b.ry)continue;
  const radius=Math.hypot((x-b.x)/b.rx,(y-b.y)/b.ry);
  const t=clamp((1-radius)/.79,0,1);
  height=Math.max(height,b.h*t*t*(3-2*t));
 }
 return height;
}

export function roadGrade(x,y,heading){
 const dx=Math.cos(heading)*18,dy=Math.sin(heading)*18;
 return (groundHeight(x+dx,y+dy)-groundHeight(x-dx,y-dy))/36;
}
