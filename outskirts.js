import {clamp} from './geometry.js?v=5.6.0';

export function travelBounds(west,east,height){
 return {west:west+110,east:east-110,north:130,south:height-130};
}

export function smooth(a,b,x){
 const t=clamp((x-a)/(b-a),0,1);
 return t*t*(3-2*t);
}

export function terrainProfile(bounds,x,y,result={}){
 const east=x-bounds.east,south=y-bounds.south,west=bounds.west-x,north=bounds.north-y;
 const seaDistance=east>0&&south>0?Math.hypot(east,south):Math.max(east,south);
 const hillDistance=Math.max(west,north);
 const shoreBlend=smooth(-215,215,seaDistance-hillDistance);
 const eastSide=smooth(-220,220,east-south);
 const along=x*.75+y*.62;
 const port=eastSide*smooth(.35,.41,(y-bounds.north)/(bounds.south-bounds.north))*
  (1-smooth(.51,.57,(y-bounds.north)/(bounds.south-bounds.north)));
 const bend=n=>43*Math.sin(n/330)+24*Math.sin(n/149+.6);
 const shoreline=190-106*port+bend(x)*(1-eastSide)+bend(y)*eastSide;
 result.distance=Math.max(seaDistance,hillDistance);
 result.hill=hillDistance;
 result.sea=seaDistance;
 result.shoreBlend=shoreBlend;
 result.shore=seaDistance-shoreline;
 result.port=port;
 result.along=along;
 return result;
}

export function hillHeight(bounds,x,y){
 const p=terrainProfile(bounds,x,y);
 if(p.hill<48||p.shoreBlend>=.995)return 0;
 const rise=smooth(48,598,p.hill);
 const broad=(Math.sin(x/312+y/280)+1)/2;
 const ridge=(Math.sin(x/186-y/161+Math.cos(x/370)*1.3)+1)/2;
 const small=(Math.sin(x/81+y/125)+1)/2;
 return rise*(145+245*broad+105*ridge+30*small)*(1-p.shoreBlend);
}

export function visibleClouds(bounds,x,y,radius,time,reduced){
 const shift=reduced?0:time*7,step=555;
 const clouds=[];
 const start=Math.floor((x-radius-shift)/step),end=Math.floor((x+radius-shift)/step);
 for(let i=start;i<=end;i++)for(let j=Math.floor((y-radius)/step);j<=Math.floor((y+radius)/step);j++){
  const seed=outskirtsHash(i,j);
  if(seed<.23)continue;
  const px=i*step+shift+45+outskirtsHash(i+9,j)*380;
  const py=j*step+45+outskirtsHash(i,j+5)*410;
  if(px<bounds.west-1500||px>bounds.east+1500||py<bounds.north-1500||py>bounds.south+1500)continue;
  clouds.push({x:px,y:py,z:158+seed*113,variant:Math.floor(seed*7)%5,scale:.65+seed*.67});
 }
 return clouds;
}

export function outskirtsHash(x,y){
 let n=Math.imul(x,1597334677)^Math.imul(y,3812015801);
 n=Math.imul(n^(n>>>16),0x45d9f3b);
 return ((n^(n>>>16))>>>0)/4294967296;
}
