import {cityObjectActive} from './city-evolution.js?v=5.5.0';
import {createCityLots} from './lot-layout.js?v=5.5.0';
import {machineGarages} from './garage-sites.js?v=5.5.0';
import {profiledRoad} from './road-profiles.js?v=5.5.0';
import {laneBoostPads} from './stunt-layout.js?v=5.5.0';
import {heroFacilities} from './hero-city.js?v=5.5.0';
import {busStopAnchors} from './bus-network.js?v=5.5.0';
import {railAccessPoints} from './rail-drive.js?v=5.5.0';
import {civicPoints,curvedRoads,landmarks,stationShops,stationForecourts} from './city-upgrade.js?v=5.5.0';
import {travelBounds} from './outskirts.js?v=5.5.0';
import {serviceBays,quietSpawn,serviceDriveways,SERVICE_RADIUS} from './service-bays.js?v=5.5.0';
import {districtAt} from './neighborhoods.js?v=5.5.0';
export {serviceBays,SERVICE_RADIUS};
import {NORTH_LIMIT,SOUTH_LIMIT,southRoads,southParks,southDestinations,southPlazas,southFixtures,southernWater} from './south.js?v=5.5.0';
import {RAIL,STATION,SOUTH_STATION,crossings,railClearance} from './rail-layout.js?v=5.5.0';
export {RAIL,STATION,SOUTH_STATION,crossings};
import {frontages,plaza,streetProps} from './frontages.js?v=5.5.0';
import {WEST_EDGE,EAST_EDGE,districts,districtRoads,districtParks,districtDestinations} from './districts.js?v=5.5.0';
export {WEST_EDGE,districts};
import {segmentDistance,insidePolygon,intersection,circleRect,roadFootprintOverlap} from './geometry.js?v=5.5.0';
export {segmentDistance};
export const SIZE={w:EAST_EDGE,h:SOUTH_LIMIT};
export const DRIVE_BOUNDS=travelBounds(WEST_EDGE,SIZE.w,SIZE.h);
export const SPAWN={x:quietSpawn.x,y:quietSpawn.y,heading:quietSpawn.heading};
export const GARAGE={x:1120,y:1460,heading:0};
export const spots=[
 {id:'station',name:'木漏れ日駅前',caption:'線路の向こうから、公園の緑まで。',x:2260,y:1390},
 {id:'market',name:'こだま横丁',caption:'色とりどりの店先を、ゆっくり抜けよう。',x:2110,y:690},
 {id:'avenue',name:'灯葉の森',caption:'深い木陰をつないで、公園の奥へ。',x:1440,y:2060},
 {id:'pond',name:'鏡羽池',caption:'池を渡る橋と、水辺の回り道。',x:2240,y:2090},
 {id:'west',name:'風紡ぎ広場',caption:'池の先にも、まだまだ公園が続く。',x:1050,y:2690},
 {id:'second',name:'南のこなら林の出口',caption:'森を通り抜けて、街の南側に着いた。',x:1130,y:3540},
 {id:'hill',name:'東の住宅街',caption:'公園を一周したら、別の道で駅へ。',x:3020,y:2510},
 {id:'garage',name:'西町整備広場',caption:'止まって修理。次の乗り物で、もう一周。',...GARAGE}
];
export const destinations=[...spots,...districtDestinations,
 {id:'old-market',name:'西の軒先商店街',x:-2170,y:2068},
 {id:'kotei-plaza',name:'東の光庭広場',x:4830,y:1530},...southDestinations,...serviceBays.map(b=>machineGarages.find(g=>g.id===b.id)??b),...landmarks.map(({id,name,x,y})=>({id,name,x,y})),...railAccessPoints
];
// A hand-authored fictional plan, informed by the four park districts and reference maps.
export const parkAreas=[
 {id:'pond',name:'鏡羽池',points:[[1690,1540],[2930,1570],[3130,2160],[2720,2390],[1700,2340],[1490,1970]],color:'#78966a'},
 {id:'goten',name:'灯葉の森',points:[[760,1700],[1690,1540],[1870,2340],[1490,2690],[680,2570],[480,2100]],color:'#557d57'},
 {id:'west',name:'風紡ぎ広場',points:[[400,2460],[1490,2490],[1680,3050],[1340,3260],[450,3190],[250,2830]],color:'#86a477'},
 {id:'second',name:'南のこなら林',points:[[640,3160],[1430,3070],[1640,3490],[1400,3730],[650,3720],[450,3440]],color:'#688d63'},
 ...districtParks,...southParks
];
export const pondPolygon=[[1630,1870],[1680,1760],[1830,1730],[1940,1775],[2080,1770],[2240,1720],[2430,1740],[2590,1810],[2790,1850],[2900,1940],[2800,2020],[2640,2030],[2490,2100],[2330,2080],[2180,2040],[2040,2070],[1910,2010],[1800,2020],[1710,1960]];
const road=(a,b,w=64,name='',park=false,bridge=false)=>({a,b,w,name,park,bridge});
const coreRoads=[
 road([200,340],[3080,340],66,'北町通り'),road([200,910],[3090,910],78,'けやき通り'),road([200,1460],[3120,1460],82,'木漏れ日通り'),
 road([580,210],[580,1800],70),road([1700,210],[1700,1630],82),road([2600,210],[2600,1580],70),road([3060,210],[3060,2510],70),
 road([200,570],[3090,570],48),road([200,1060],[3090,1060],56),road([1110,340],[1110,1060],54),
 road([1950,570],[1950,910],30),road([2110,570],[2110,910],30),road([2330,570],[2330,910],34),road([2260,1265],[2260,1580],60,'駅前'),
 road([2260,1580],[2240,1670],44,'公園へ'),road([1700,1580],[3060,1580],50,'公園通り'),
 road([2240,1670],[2840,1680],40,'池の北岸',true),road([2840,1680],[3020,1940],40,'東の水辺',true),road([3020,1940],[2840,2220],42,'池の南岸',true),
 road([2840,2220],[2240,2200],42,'池の南岸',true),road([2240,2200],[1710,2180],42,'水辺の木立',true),road([1710,2180],[1510,1880],42,'池の西岸',true),road([1510,1880],[1730,1640],40,'池の西岸',true),road([1730,1640],[2240,1670],42,'池の北岸',true),
 road([2240,1670],[2240,2200],42,'鏡羽橋',true,true),
 road([1510,1880],[1440,2060],48,'灯葉の森の道',true),road([1440,2060],[1030,2240],50,'灯葉の森の道',true),road([1030,2240],[730,2490],50,'風紡ぎ広場への道',true),
 road([1710,2180],[1440,2060],48,'灯葉の森の道',true),road([2840,1680],[2840,1580],44,'東の公園入口',true),
 road([730,2490],[500,2720],50,'風紡ぎ広場の周回路',true),road([500,2720],[650,3010],48,'風紡ぎ広場の周回路',true),road([650,3010],[1290,3010],48,'風紡ぎ広場の周回路',true),road([1290,3010],[1490,2700],50,'風紡ぎ広場の周回路',true),road([1490,2700],[1270,2480],50,'風紡ぎ広場の周回路',true),road([1270,2480],[730,2490],50,'風紡ぎ広場の周回路',true),
 road([500,2720],[1490,2700],55,'風紡ぎ広場',true),road([1050,2490],[1050,3010],52,'風紡ぎ広場',true),
 road([1050,3010],[1050,3230],46,'南のこなら林へ',true),road([1050,3230],[700,3330],46,'南のこなら林の道',true),road([700,3330],[700,3540],46,'南のこなら林の道',true),road([700,3540],[1380,3540],50,'南の抜け道',true),road([1380,3540],[1480,3270],46,'南のこなら林の道',true),road([1480,3270],[1050,3230],46,'南のこなら林の道',true),
 road([1380,3540],[2400,3540],58,'南町通り'),road([2400,3540],[3020,2510],64,'東の住宅街'),road([3020,2510],[2840,2220],52),
 road([580,1800],[730,2490],62,'公園西通り'),road([240,1800],[580,1800],58),road([240,1800],[240,3540],58,'西の外周'),road([240,3540],[700,3540],58),
 road([2240,2200],[2430,2510],46,'南東の並木道',true),road([2430,2510],[3020,2510],58)
];
const legacyBaseRoads=[...coreRoads,...districtRoads,...southRoads];
const lanes=(r,n,w)=>({...r,w,lanes:n});
const isNorthAvenue=r=>r.a[1]===r.b[1]&&[340,910].includes(r.a[1]);
const isSouthAvenue=r=>r.a[0]===1650&&r.a[1]===4650&&r.b[0]===2690;
const baseRoads=[...coreRoads.map(r=>isNorthAvenue(r)?lanes(r,4,122):r),...districtRoads,
 ...southRoads.map(r=>isSouthAvenue(r)?lanes(r,4,115):r),...curvedRoads];
export const roads=[...baseRoads,...serviceDriveways(legacyBaseRoads)].map(profiledRoad);
// The station forecourt begins outside the hall, including the rounded road cap.
for(const r of roads)if(r.a[0]===2260&&r.a[1]===1265)r.a=[2260,STATION.y+STATION.d/2+r.w/2+6];
export const civicSites=[];
for(const f of heroFacilities){
 const candidates=roads.filter(r=>!r.park&&!r.curve).map(r=>{const dx=r.b[0]-r.a[0],dy=r.b[1]-r.a[1],length=Math.hypot(dx,dy),t=Math.max(.12,Math.min(.88,((f.x-r.a[0])*dx+(f.y-r.a[1])*dy)/length**2));return {r,x:r.a[0]+dx*t,y:r.a[1]+dy*t,nx:-dy/length,ny:dx/length};}).sort((a,b)=>Math.hypot(a.x-f.x,a.y-f.y)-Math.hypot(b.x-f.x,b.y-f.y));
 let chosen;
 for(const c of candidates.slice(0,30)){for(const side of [1,-1]){
  const offset=c.r.w/2+Math.hypot(f.w,f.d)/2+22,bx=c.x+c.nx*offset*side,by=c.y+c.ny*offset*side;
  if(bx<WEST_EDGE+160||bx>SIZE.w-160||by<170||by>SIZE.h-170||pond(bx,by)||railClearance(bx,by,Math.max(f.w,f.d)/2+25,500)||roadContains(roads,bx,by,Math.hypot(f.w,f.d)/2+5)||parkAreas.some(p=>insidePolygon(bx,by,p.points))||civicSites.some(p=>Math.hypot(p.bx-bx,p.by-by)<220))continue;
  chosen={...f,x:c.x,y:c.y,bx,by,heroFacility:true};break;
 }if(chosen)break;}
 if(chosen)civicSites.push(chosen);
}
destinations.push(...civicSites.map(({id,name,x,y,heroFacility})=>({id,name,x,y,heroFacility})));
function stuntPad(id,type,a,b,position,w,d,shortJump=false){
 const dx=b[0]-a[0],dy=b[1]-a[1];
 return {id,type,x:a[0]+dx*position,y:a[1]+dy*position,w,d,angle:Math.atan2(dy,dx),shortJump};
}
const dash=(id,a,b,position,w=40)=>stuntPad(id,'boost',a,b,position,w,56);
const jump=(id,a,b,position,shortJump=false)=>stuntPad(id,'ramp',a,b,position,38,56,shortJump);
const surfaceDesigns=[
 {id:'dash-station',type:'boost',x:2260,y:1540,w:44,d:60,angle:Math.PI/2},
 {id:'jump-pond',type:'ramp',x:2240,y:1820,w:36,d:58,angle:Math.PI/2},
 {id:'dash-west',type:'boost',x:950,y:2711,w:44,d:70,angle:0},
 {id:'jump-west',type:'ramp',x:1230,y:2705,w:50,d:68,angle:0},
 {id:'dash-south',type:'boost',x:980,y:3540,w:44,d:70,angle:0},
 {id:'jump-south',type:'ramp',x:1270,y:3540,w:48,d:66,angle:0},
 {id:'dash-north',type:'boost',x:1400,y:910,w:48,d:70,angle:0},
 jump('jump-market',[200,340],[3080,340],.64),
 jump('jump-station',[200,1460],[3120,1460],.44),
 dash('dash-pond',[2840,2220],[3020,1940],.28,36),
 dash('dash-forest',[730,2490],[1030,2240],.37,36),
 jump('jump-forest',[1440,2060],[1030,2240],.26,true),
 dash('dash-housing',[3020,2510],[2400,3540],.29),
 jump('jump-housing',[3020,2510],[2400,3540],.56,true),
 dash('dash-west-north',[-1930,320],[-1090,590],.20),
 jump('jump-west-north',[-1930,320],[-1090,590],.49,true),
 dash('dash-west-market',[-2970,1480],[-2240,1350],.23),
 jump('jump-west-market',[-2970,1480],[-2240,1350],.51,true),
 dash('dash-west-south',[-1040,2540],[-290,2770],.20),
 jump('jump-west-south',[-1040,2540],[-290,2770],.49,true),
 dash('dash-east-north',[5050,460],[6150,300],.23),
 jump('jump-east-north',[5050,460],[6150,300],.51,true),
 dash('dash-east-avenue',[5160,1420],[6110,1270],.31),
 jump('jump-east-avenue',[5160,1420],[6110,1270],.58,true),
 dash('dash-east-orchard',[4950,2370],[5850,2510],.22),
 jump('jump-east-orchard',[4950,2370],[5850,2510],.49,true),
 dash('dash-south-market',[-700,4570],[350,4750],.20),
 jump('jump-south-market',[-700,4570],[350,4750],.48,true),
 dash('dash-south-water',[1650,6600],[2830,6540],.22),
 jump('jump-south-water',[1650,6600],[2830,6540],.55,true),
 dash('dash-south-hill',[6070,4770],[6140,5810],.22),
 jump('jump-south-hill',[6070,4770],[6140,5810],.53,true)
];
export const surfaces=laneBoostPads(surfaceDesigns.filter(p=>p.type!=='ramp'),roads);
export function isRoad(x,y,extra=0){return roadContains(roads,x,y,extra);}
function baseIsRoad(x,y,extra=0){return roadContains(legacyBaseRoads,x,y,extra);}
function roadContains(list,x,y,extra){return list.some(r=>segmentDistance(x,y,r)<r.w/2+extra);}
export function inPark(x,y){return parkAreas.some(p=>insidePolygon(x,y,p.points));}
export function pond(x,y){if(!insidePolygon(x,y,pondPolygon)&&!insidePolygon(x,y,southernWater))return false;return !roads.some(r=>r.bridge&&segmentDistance(x,y,r)<r.w/2);}
export function random(seed=21){return ()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
export const junctions=[];for(let i=0;i<roads.length;i++)for(let j=i+1;j<roads.length;j++){const p=intersection(roads[i],roads[j]);if(!p)continue;let n=junctions.find(n=>Math.hypot(n.x-p[0],n.y-p[1])<2);if(!n){n={x:p[0],y:p[1],roads:[]};junctions.push(n);}if(!n.roads.includes(i))n.roads.push(i);if(!n.roads.includes(j))n.roads.push(j);}
export function createWorld(){
 const rng=random(2042),buildings=[],trees=[],props=[],solids=[],byId=new Map();
 function add(o){solids.push(o);byId.set(o.id,o);return o;}
 function building(x,y,w,d,h,style,seed,kind='building',material=null,identity=null){const m=material??(style%3===0?'wood':style%3===1?'brick':'concrete'),hp=m==='wood'?155:m==='brick'?320:780;const b=add({id:identity?.id??(kind==='station'?'station-hall':'building-'+buildings.length),theme:identity?.theme,angle:identity?.angle,use:identity?.use,sign:identity?.sign,kind,x,y,w,d,h,style,seed,material:m,hp:kind==='station'?1800:hp,resistance:m==='wood'?.65:m==='brick'?1.15:2.1});buildings.push(b);return b;}
 building(STATION.x,STATION.y,STATION.w,STATION.d,STATION.h,8,100,'station','concrete');
 // Northern urban fabric, with clear rail crossings and market lanes.
 for(let y=230;y<1520;y+=124)for(let x=285;x<3140;x+=126){
  if(y>1105&&y<1290)continue;const w=65+rng()*27,d=60+rng()*27;
  if(roadContains(coreRoads,x,y,Math.max(w,d)*.65+8)||Math.hypot(x-GARAGE.x,y-GARAGE.y)<100||Math.hypot(x-2260,y-1380)<140)continue;
  building(x+rng()*8,y+rng()*8,w,d,40+rng()*80,Math.floor(rng()*8),Math.floor(rng()*999));
 }
 for(const x of [2030,2190,2420])for(const y of [650,780])if(!roadContains(coreRoads,x,y,32))building(x,y,66,62,45+rng()*20,Math.floor(rng()*5),Math.floor(rng()*999),'building','wood');
 building(1040,1540,104,72,48,9,21,'building','brick');
 // Houses outside the park leave the complete wooded corridor open.
 for(let y=1700;y<3680;y+=145)for(let x=180;x<3170;x+=142){if(inPark(x,y)||pond(x,y)||roadContains(coreRoads,x,y,66)||rng()<.5)continue;building(x,y,65+rng()*22,58+rng()*20,38+rng()*30,Math.floor(rng()*8),Math.floor(rng()*999));}
 function tree(x,y,size,type,seed,id){const t=add({id:id??'tree-'+trees.length,kind:'tree',circle:true,x,y,r:6,w:14,d:14,h:size*1.8,size,type,seed,material:'wood',hp:38,resistance:.45});trees.push(t);}
 for(let i=0;i<1200;i++){
  const x=130+rng()*(3300-260),y=170+rng()*(NORTH_LIMIT-340),park=inPark(x,y);
  if((!park&&rng()<.9)||roadContains(coreRoads,x,y,22)||pond(x,y)||buildings.some(b=>Math.abs(x-b.x)<b.w/2+21&&Math.abs(y-b.y)<b.d/2+21)||Math.abs(y-1200)<90)continue;
  tree(x,y,21+rng()*17,rng()<.16?2:Math.floor(rng()*2),Math.floor(rng()*1000));
 }
 for(const r of coreRoads.filter(r=>!r.park&&r.w>=70)){const length=Math.hypot(r.b[0]-r.a[0],r.b[1]-r.a[1]),dx=(r.b[0]-r.a[0])/length,dy=(r.b[1]-r.a[1])/length;for(let t=50;t<length;t+=120){const x=r.a[0]+dx*t-dy*(r.w/2+17),y=r.a[1]+dy*t+dx*(r.w/2+17);if(roadContains(coreRoads,x,y,9)||Math.abs(y-1200)<95||buildings.some(b=>Math.abs(x-b.x)<b.w/2+18&&Math.abs(y-b.y)<b.d/2+18))continue;tree(x,y,25+rng()*8,Math.floor(rng()*3),Math.floor(rng()*1000));}}
 const decor={
  awning:[31,20,24],bikeRack:[29,11,15],kiosk:[21,17,32],flowerBed:[26,17,10],
  parasol:[21,22,24],noticeboard:[19,8,26],hydrant:[9,9,17],hedge:[29,13,16],serviceOffice:[55,38,48],busStop:[37,19,31],mailbox:[12,10,22],cargoStall:[27,20,21],cycleShelter:[39,22,30],lampSign:[13,8,32]
 };
 function prop(x,y,type,id,angle){const o=add({id:id??'prop-'+props.length,kind:'prop',type,x,y,angle,w:decor[type]?.[0]??(type==='fountain'?54:type==='bench'?29:type==='lantern'?7:18),d:decor[type]?.[1]??(type==='fountain'?44:type==='lantern'?7:14),h:decor[type]?.[2]??(type==='lamp'||type==='lantern'?42:type==='vending'?35:20),material:type==='vending'?'metal':'wood',hp:type==='vending'?85:type==='lamp'?32:24,resistance:type==='vending'?1.2:.45});props.push(o);return o;}
 for(const b of buildings.filter(b=>b.style<5&&b.seed%3===0))prop(b.x+b.w*.28,b.y+b.d*.5+12,'planter');
 for(const p of [[2050,1300,'bench'],[2110,1300,'vending'],[2320,1330,'planter'],[2380,1340,'bench'],[2240,1650,'lamp'],[1430,2105,'bench'],[1000,2640,'vending'],[1100,3490,'bench']])if(!roadContains(coreRoads,p[0],p[1],-15))prop(...p);
 for(const c of crossings){for(const side of [-1,1])add({id:c.id+'-gate-'+side,kind:'barrier',x:c.x,y:c.y+side*64,w:c.w+6,d:7,h:13,material:'metal',hp:95,resistance:1.7,crossing:c.id});}

 // Keep the shop frontages out of junctions and preserve clear drive lanes.
 const developed=frontages.filter(lot=>{
  const c=Math.cos(lot.angle),s=Math.sin(lot.angle);
  return [-1,0,1].every(i=>[-1,0,1].every(j=>{
   const u=i*lot.w/2,v=j*lot.d/2;
   return !baseIsRoad(lot.x+c*u-s*v,lot.y+s*u+c*v,7);
  }));
 });
 for(const plot of developed){
  const material=plot.theme==='west'?'wood':'concrete';
  building(plot.x,plot.y,plot.w,plot.d,plot.h,plot.style,plot.seed,'building',material,plot);
 }
 const conflictsWithFrontage=(x,y,r)=>insidePolygon(x,y,plaza.points)||
  developed.some(p=>objectHits(p,x,y,r+12));
 for(const item of streetProps){
  const [x,y]=item.position;
  if(!baseIsRoad(x,y,7)&&!developed.some(b=>objectHits(b,x,y,item.type==='lantern'?4:12)))prop(x,y,item.type,item.id);
 }
 // New plots carry their own IDs. Legacy core objects keep their old IDs.
 const sideRandom=random(79124);
 for(const area of districts){
  const west=area.theme==='west';
  const xStep=west?120:162,yStep=west?134:159;
  for(let y=345;y<3650;y+=yStep)for(let x=area.min+175;x<area.max-120;x+=xStep){
   const px=x+(sideRandom()-.5)*(west?61:40),py=y+(sideRandom()-.5)*62;
   const id=area.theme+'-'+(x-area.min)+'-'+y;
   const style=Math.floor(sideRandom()*3);
   const width=(west?49:77)+sideRandom()*30,depth=(west?45:63)+sideRandom()*29;
   const height=(west?26:49)+sideRandom()*(west?25:92);
   const clearance=Math.hypot(width,depth)/2;
   if(baseIsRoad(px,py,clearance+12)||conflictsWithFrontage(px,py,clearance))continue;
   if(inPark(px,py)||sideRandom()<(west?.28:.13)){
    tree(px,py,22+sideRandom()*16,west?style%2:2,Math.floor(sideRandom()*999),id+'-tree');
    continue;
   }
   if(buildings.some(b=>Math.abs(b.x-px)<(b.w+width)/2+5&&Math.abs(b.y-py)<(b.d+depth)/2+5))continue;
   const material=west?(style===2?'brick':'wood'):(style===2?'brick':'concrete');
   const b=building(px,py,width,depth,height,style,Math.floor(sideRandom()*999),'building',material,{id:id+'-house',theme:area.theme});
   const pxProp=b.x+b.w*.23,pyProp=b.y+b.d/2+12;
   if(sideRandom()<.34&&!baseIsRoad(pxProp,pyProp,13))prop(pxProp,pyProp,west?'planter':'vending',id+'-prop');
  }
 }
 for(let x=5270;x<=5500;x+=49)for(let y=2420;y<=2670;y+=48){
  if(!baseIsRoad(x,y,12)&&!conflictsWithFrontage(x,y,12)&&!trees.some(o=>Math.hypot(o.x-x,o.y-y)<23))tree(x,y,21,2,Math.floor(sideRandom()*999),'east-orchard-'+x+'-'+y);
 }
 // Keep IDs available for saves while replacing scenery in the railway corridor.
 const cleared=new Set();
 for(const o of [...buildings,...trees,...props]){
  if(o.kind==='station'||!railClearance(o.x,o.y,Math.max(o.w,o.d)*.53,o.h))continue;
  if(o.x<RAIL.x1-40)continue;
  cleared.add(o.id);
 }
 for(const list of [buildings,trees,props,solids]){
  for(let i=list.length-1;i>=0;i--)if(cleared.has(list[i].id))list.splice(i,1);
 }
 building(SOUTH_STATION.x,SOUTH_STATION.y,SOUTH_STATION.w,SOUTH_STATION.d,SOUTH_STATION.h,8,227,'station','concrete',{id:'south-station-hall'});
 const dressRandom=random(16651);
 const closeToExisting=(x,y,r)=>solids.some(o=>Math.abs(o.x-x)<o.w/2+r&&Math.abs(o.y-y)<o.d/2+r);
 const openGround=(x,y,r)=>!boundaryBlocked(x,y,r)&&!pond(x,y)&&!baseIsRoad(x,y,r+5)&&
  !closeToExisting(x,y,r)&&!railClearance(x,y,r,40);
 // Closely spaced storefronts give the market and station a continuous street edge.
 for(const [a,b,theme,signs] of [
  [[-1770,4350],[-700,4570],'west',['杏灯の青果','帆布店','琥珀茶房','季節の花','小さな食堂']],
  [[4770,7220],[5070,7220],'east',['花帆ベーカリー','丘の案内所','灯り書店']]
 ]){
  const dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy),c=dx/length,n=dy/length;
  const spacing=theme==='west'?99:83,start=theme==='west'?248:48;
  for(const [i,sign] of signs.entries()){
   const u=start+i*spacing,w=theme==='west'?76:69,d=56;
   const x=a[0]+c*u+n*91,y=a[1]+n*u-c*91;
   if(!openGround(x,y,43))continue;
   const plot={id:'south-front-'+theme+'-'+i,theme,angle:Math.atan2(dy,dx),use:theme==='west'?'wood-shop':'avenue-store',sign};
   building(x,y,w,d,37+i%3*6,i%3,127+i*97,'building',theme==='west'?'wood':'brick',plot);
   const px=x+n*-39,py=y+c*39;
   if(openGround(px,py,9))prop(px,py,i%2?'flowerBed':'planter','south-front-prop-'+theme+'-'+i,plot.angle);
  }
 }
 for(const [i,r] of legacyBaseRoads.entries()){
  if(r.bridge||r.alley||r.park||r.w<58)continue;
  const dx=r.b[0]-r.a[0],dy=r.b[1]-r.a[1],length=Math.hypot(dx,dy),c=dx/length,n=dy/length;
  for(let u=100,j=0;u<length-90;u+=r.theme?.startsWith('south')?105:148,j++){
   const side=(i+j)%2?1:-1,offset=r.w/2+24;
   const x=r.a[0]+c*u-n*side*offset,y=r.a[1]+n*u+c*side*offset;
   if(openGround(x,y,13)&&!southPlazas.some(p=>insidePolygon(x,y,p.points)))
    prop(x,y,['flowerBed','bikeRack','noticeboard','hydrant','hedge','lantern','planter','parasol'][((i+j*3)%8)],'street-detail-'+i+'-'+j,Math.atan2(dy,dx));
  }
 }
 for(let row=0,y=4100;y<7550;y+=145,row++)for(let x=WEST_EDGE+185,col=0;x<SIZE.w-170;x+=142,col++){
  const px=x+(dressRandom()-.5)*66,py=y+(dressRandom()-.5)*62;
  const id='south-lot-'+row+'-'+col,style=Math.floor(dressRandom()*8);
  const r=37+dressRandom()*12;
  if(!openGround(px,py,r)||southPlazas.some(p=>Math.abs(px-p.x)<p.w/2+r&&Math.abs(py-p.y)<p.h/2+r))continue;
  const isGreen=inPark(px,py),nearRoad=baseIsRoad(px,py,190);
  if(isGreen||!nearRoad||dressRandom()<.44){
   if(!nearRoad&&!isGreen&&dressRandom()<.40)continue;
   const size=17+dressRandom()*19;
   tree(px,py,size,px>3750?1:style%3,Math.floor(dressRandom()*1000),id+'-tree');
   if(openGround(px+34,py+12,10))prop(px+34,py+12,style%2?'hedge':'flowerBed',id+'-plant');
   continue;
  }
  const material=px<400?'wood':px<3500?'brick':'concrete';
  const height=(material==='concrete'?43:28)+dressRandom()*38;
  if(railClearance(px,py,r,height))continue;
  building(px,py,r*1.34,r*1.25,height,style,Math.floor(dressRandom()*999),'building',material,{id:id+'-house'});
  if(openGround(px+r*.5,py+r*.78+12,11))prop(px+r*.5,py+r*.78+12,'planter',id+'-prop');
 }
 for(const o of southFixtures)if(openGround(o.x,o.y,15))prop(o.x,o.y,o.type,o.id,0);
 for(const bay of serviceBays){
  const c=Math.cos(bay.heading),n=Math.sin(bay.heading);
  const candidates=[1,-1].map(side=>[bay.x-21*c-57*n*side,bay.y-21*n+57*c*side]);
  if(bay===quietSpawn)candidates.push([1398,2165]);
  for(const [x,y] of candidates){
   if(!openGround(x,y,30)||Math.hypot(x-bay.x,y-bay.y)<57)continue;
   const office=prop(x,y,'serviceOffice',bay.id+'-office',bay.heading-Math.PI/2);
   // Service offices use stable IDs and their own silhouettes and materials.
   office.district=bay.district;office.hp=155;office.resistance=.65;
   break;
  }
 }
 // Fill gaps beside busy streets, while keeping the park and all road widths intact.
 const shopSigns=['茶房 木陰','小箱文具','青空食堂','野の花','布と糸','日暮れ書房','豆と灯り','パンの小窓'];
 const dressRoads=legacyBaseRoads.filter(r=>r.theme==='east'&&r.a[1]>1240&&r.a[1]<2320||
  r.theme==='west'&&r.a[1]>1320&&r.a[1]<2290||r.theme==='south-market'&&r.w>=60);
 for(const [i,road] of dressRoads.entries()){
  const dx=road.b[0]-road.a[0],dy=road.b[1]-road.a[1],length=Math.hypot(dx,dy);
  const c=dx/length,n=dy/length,angle=Math.atan2(dy,dx),west=road.theme!=='east';
  for(let u=85,j=0;u<length-80;u+=109,j++)for(const side of [-1,1]){
   const point=offset=>[road.a[0]+c*u-n*offset*side,road.a[1]+n*u+c*offset*side];
   const id='infill-'+i+'-'+j+'-'+side;
   const [x,y]=point(road.w/2+74+(j%2)*13);
   const height=west?37+(i+j)%4*5:47+(i+j)%4*11;
   if(!inPark(x,y)&&openGround(x,y,38)&&!baseIsRoad(x,y,40)&&!railClearance(x,y,40,height)&&
      !southPlazas.some(p=>insidePolygon(x,y,p.points))){
    const material=west?(j%3?'wood':'brick'):(j%2?'brick':'concrete');
    const layout={id:id+'-shop',theme:west?'west':'east',angle:side===1?angle+Math.PI:angle,
     sign:shopSigns[(i+j)%shopSigns.length],use:west?'wood-shop':j%2?'avenue-store':'apartment'};
    building(x,y,66,48,height,(i+j)%3,513+i*100+j,'building',material,layout);
   }
   const type=['cargoStall','cycleShelter','lampSign','flowerBed','bench'][(i+j+(side===1?1:0))%5];
   const [px,py]=point(road.w/2+24);
   const clearance=type==='cycleShelter'?20:type==='cargoStall'?15:11;
   if(openGround(px,py,clearance)&&!baseIsRoad(px,py,clearance))prop(px,py,type,id+'-street',angle);
  }
 }
 // Keep moved objects addressable so existing damage records still decode.
 const replacementRoads=baseRoads.filter(r=>r.curve||r.lanes===4);
 const shopLots=stationShops.map(([x,y,sign],i)=>[x,y,44,26,34+i%4*7,sign]);
 const overLot=(o,lot)=>Math.abs(o.x-lot[0])<(o.w+lot[2])/2+14&&Math.abs(o.y-lot[1])<(o.d+lot[3])/2+14;
 const civicProps=civicPoints.map(p=>{
  const candidates=[[0,0],[0,12],[0,-12],[15,0],[-15,0],[0,31],[24,-20],[-28,17]];
  const chosen=candidates.map(([dx,dy])=>({...p,x:p.x+dx,y:p.y+dy}))
   .find(q=>!baseIsRoad(q.x,q.y,q.type==='busStop'?20:8));
  return chosen;
 }).filter(Boolean);
 for(const o of solids){
  if(o.kind==='station'||o.kind==='barrier'||o.type==='serviceOffice')continue;
  if(replacementRoads.some(r=>segmentDistance(o.x,o.y,r)<r.w/2+Math.min(o.w,o.d)*.36+3)||
     landmarks.some(p=>p.lots.some(lot=>overLot(o,lot)))||shopLots.some(lot=>overLot(o,lot))||
     civicProps.some(p=>Math.hypot(p.x-o.x,p.y-o.y)<Math.min(o.w,o.d)*.45+12))cleared.add(o.id);
 }
 for(const list of [buildings,trees,props,solids]){
  for(let i=list.length-1;i>=0;i--)if(cleared.has(list[i].id))list.splice(i,1);
 }
 for(const site of landmarks)for(const [i,[x,y,w,d,h,use,hp]] of site.lots.entries()){
  const m=use==='barn'?'wood':use==='castle'||use==='turret'?'brick':'concrete';
  const lot=building(x,y,w,d,h,i,413+i,'building',m,{id:site.id+'-'+i,sign:site.name});
  lot.landmark=use;lot.hp=hp;
  if(use==='castle'||use==='turret')lot.resistance=2.4;
 }
 for(const [i,[x,y,w,d,h,sign]] of shopLots.entries()){
  building(x,y,w,d,h,i%3,823+i,'building',i%4===0?'wood':'brick',
   {id:'station-shop-'+i,theme:i%3?'west':'east',angle:y>1460?Math.PI:0,
    use:i%3?'wood-shop':'avenue-store',sign});
 }
 for(const p of civicProps){
  const fixture=prop(p.x,p.y,p.type,p.id,0);
  fixture.job=p.job;fixture.material='metal';fixture.hp=p.type==='busStop'?105:66;
 }
 // Give every district a delivery address without moving existing lots or IDs.
 for(const bay of serviceBays){
  const dx=bay.roadX-bay.x,dy=bay.roadY-bay.y,len=Math.hypot(dx,dy),c=dx/len,n=dy/len;
  let address=null;
  for(const t of [.65,.85,.40])for(const side of [1,-1])for(const along of [0,20,-20]){
   const x=bay.x+dx*t+c*along-n*side*33,y=bay.y+dy*t+n*along+c*side*33;
   if(address||roadContains(roads,x,y,10)||pond(x,y)||railClearance(x,y,12,24)||solids.some(o=>objectHits(o,x,y,10)))continue;
   address={x,y};
  }
  if(address){const p=prop(address.x,address.y,'mailbox','post-'+bay.id,0);p.job='mail';p.jobName=bay.name.replace('の整備所','')+'のポスト';p.hp=66;p.material='metal';}
 }
 // Layer the station pavements with shop displays, seats and small gardens.
 const forecourtLegacy=solids.filter(o=>o.kind!=='station'&&!o.id.startsWith('station-shop-')&&stationForecourts.some(p=>o.x>p.x&&o.x<p.x+p.w&&o.y>p.y&&o.y<p.y+p.d));
 for(const o of forecourtLegacy)cleared.add(o.id);
 for(const list of [buildings,trees,props,solids])for(let i=list.length-1;i>=0;i--)if(forecourtLegacy.includes(list[i]))list.splice(i,1);
 // Stable IDs preserve existing save records; the carriageway stays unobstructed.
 const stationDecor=(x,y,type,id,angle=0)=>{
  const radius=type==='lantern'?4:type==='flowerBed'?10:13;
  if(baseIsRoad(x,y,radius+3)||solids.some(o=>objectHits(o,x,y,radius)))return;
  prop(x,y,type,'station-decor-'+id,angle);
 };
 for(const [i,[x,y]] of stationShops.entries()){
  const front=y>1460?-1:1;
  stationDecor(x-12,y+front*28,i%3===0?'awning':i%3===1?'flowerBed':'bikeRack','display-'+i);
  stationDecor(x+17,y+front*28,'planter','pot-'+i);
 }
 for(const [i,x] of [1780,1880,2010,2120,2360,2470].entries()){
  stationDecor(x,1415,i%2?'bench':'flowerBed','north-seat-'+i);
  stationDecor(x+35,1414,'lantern','light-'+i);
 }
 for(const [i,[x,y]] of [[2040,1335],[2125,1338],[2370,1338],[2460,1332],[1810,1552],[1960,1552],[2410,1552]].entries()){
  if(!baseIsRoad(x,y,19)&&!solids.some(o=>objectHits(o,x,y,16)))tree(x,y,24+i%3*3,i%2,700+i,'station-garden-'+i);
  stationDecor(x+28,y+6,'bench','garden-seat-'+i);
  stationDecor(x-22,y+8,'flowerBed','garden-flower-'+i);
 }
 for(const [i,[x,y,type]] of [[2000,1300,'flowerBed'],[2070,1300,'bench'],[2140,1300,'flowerBed'],[2190,1300,'lantern'],[2000,1380,'parasol'],[2060,1390,'bench'],[2130,1400,'flowerBed'],[2190,1390,'noticeboard'],[2338,1300,'flowerBed'],[2400,1300,'bench'],[2470,1300,'flowerBed'],[2515,1320,'bikeRack'],[2000,1345,'awning'],[2188,1350,'kiosk']].entries())stationDecor(x,y,type,'forecourt-'+i);
 // Add signs after set dressing so their boarding areas and stable IDs survive future map growth.
 for(const anchor of busStopAnchors){
  let best=null;
  for(const r of roads){
   if(r.w<42||r.theme==='service'||r.bridge||r.park&&anchor.area!=='park')continue;
   const dx=r.b[0]-r.a[0],dy=r.b[1]-r.a[1],len=Math.hypot(dx,dy),c=dx/len,n=dy/len;
   if(len<60)continue;
   const t=Math.max(.08,Math.min(.92,((anchor.x-r.a[0])*dx+(anchor.y-r.a[1])*dy)/(len*len)));
   for(const along of [0,45,-45,90,-90])for(const side of [1,-1]){
    const u=Math.max(.08,Math.min(.92,t+along/len)),stopX=r.a[0]+dx*u,stopY=r.a[1]+dy*u;
    const x=stopX-n*side*(r.w/2+17),y=stopY+c*side*(r.w/2+17),gap=Math.hypot(x-anchor.x,y-anchor.y);
    if(best&&gap>=best.gap||gap>650||pond(x,y)||railClearance(x,y,16,42)||roadContains(roads,x,y,12)||props.some(p=>p.job==='bus'&&Math.hypot(x-p.x,y-p.y)<155))continue;
    if(solids.some(o=>objectHits(o,x,y,14)||[-12,0,12].some(a=>objectHits(o,stopX+c*a,stopY+n*a,16))))continue;
    best={x,y,stopX,stopY,gap,angle:Math.atan2(dy,dx)};
   }
  }
  if(best){const p=prop(best.x,best.y,'busStop',anchor.id,0);Object.assign(p,{job:'bus',jobName:anchor.name+'バス停',busArea:anchor.area,stopX:best.stopX,stopY:best.stopY,roadAngle:best.angle,material:'metal',hp:105});}
 }
 for(const b of buildings)b.district=districtAt(b.x,b.y);
 // Reserve large public lots, keeping old IDs addressable for save migration.
 for(const site of civicSites){
  const overlaps=o=>o.kind!=='station'&&o.type!=='serviceOffice'&&!o.landmark&&Math.abs(o.x-site.bx)<(o.w+site.w)/2+12&&Math.abs(o.y-site.by)<(o.d+site.d)/2+12;
  for(const list of [buildings,trees,props,solids])for(let i=list.length-1;i>=0;i--)if(overlaps(list[i])){cleared.add(list[i].id);list.splice(i,1);}
  const b=building(site.bx,site.by,site.w,site.d,site.h,0,1700+civicSites.indexOf(site),'building','concrete',{id:site.id,sign:site.name});
  b.landmark=site.type;b.facility=site;b.hp=site.hp;b.resistance=site.type==='home'?2:2.6;
 }
 let infill=0;
 for(let y=980;y<1730;y+=54)for(let x=1180;x<2830;x+=56){
  const w=40,d=30;
  if(inPark(x,y)||pond(x,y)||roadContains(roads,x,y,Math.hypot(w,d)/2+5)||railClearance(x,y,44,500)||stationForecourts.some(p=>x>p.x-35&&x<p.x+p.w+35&&y>p.y-35&&y<p.y+p.d+35)||solids.some(o=>o.kind!=='tree'&&Math.abs(o.x-x)<(o.w+w)/2+6&&Math.abs(o.y-y)<(o.d+d)/2+6))continue;
  for(const list of [trees,solids])for(let k=list.length-1;k>=0;k--){const o=list[k];if(o.kind==='tree'&&Math.abs(o.x-x)<w/2+20&&Math.abs(o.y-y)<d/2+20){cleared.add(o.id);list.splice(k,1);}}
  const names=['日和食料品','森の薬房','珈琲ひかり','駅前カメラ','針と糸','こもれび青果','街角パン屋','雨宿り書店'];
  building(x,y,w,d,38+(infill%4)*13,infill%3,2100+infill,'building','brick',{id:'station-infill-'+infill,theme:'east',use:'avenue-store',sign:names[infill%names.length]});infill++;
 }
 // Enforce the final asphalt footprint after every road/lot/landmark is authored.
 const roadClear=b=>!roads.some(r=>roadFootprintOverlap(b,r,5));
 for(const b of buildings.slice()){
  if(roadClear(b))continue;
  const hit=roads.filter(r=>roadFootprintOverlap(b,r,5)).sort((a,c)=>segmentDistance(b.x,b.y,a)-segmentDistance(b.x,b.y,c))[0],dx=hit.b[0]-hit.a[0],dy=hit.b[1]-hit.a[1],len=Math.hypot(dx,dy),c=dx/len,n=dy/len,t=Math.max(.04,Math.min(.96,((b.x-hit.a[0])*dx+(b.y-hit.a[1])*dy)/len**2)),cx=hit.a[0]+dx*t,cy=hit.a[1]+dy*t;
  let placed=false;
  for(const side of [1,-1])for(const along of [0,70,-70,140,-140]){if(placed)break;const offset=hit.w/2+Math.hypot(b.w,b.d)/2+18,q={...b,x:cx-n*offset*side+c*along,y:cy+c*offset*side+n*along};
   if(q.x<WEST_EDGE+110||q.x>SIZE.w-110||q.y<150||q.y>SIZE.h-150||!roadClear(q)||pond(q.x,q.y)||railClearance(q.x,q.y,Math.max(q.w,q.d)/2+12,500)||solids.some(o=>o!==b&&o.kind!=='tree'&&Math.abs(o.x-q.x)<(o.w+q.w)/2+8&&Math.abs(o.y-q.y)<(o.d+q.d)/2+8))continue;
   b.x=q.x;b.y=q.y;if(b.facility){b.facility.bx=q.x;b.facility.by=q.y;}placed=true;
  }
  if(!placed&&(b.landmark||b.facility||b.id.startsWith('station-shop-'))){
   for(let radius=80;radius<=1200&&!placed;radius+=80)for(let i=0;i<32&&!placed;i++){
    const a=i*Math.PI/16,q={...b,x:b.x+Math.cos(a)*radius,y:b.y+Math.sin(a)*radius};
    if(q.x<WEST_EDGE+110||q.x>SIZE.w-110||q.y<150||q.y>SIZE.h-150||!roadClear(q)||pond(q.x,q.y)||inPark(q.x,q.y)||railClearance(q.x,q.y,Math.max(q.w,q.d)/2+12,500)||solids.some(o=>o!==b&&o.kind!=='tree'&&Math.abs(o.x-q.x)<(o.w+q.w)/2+8&&Math.abs(o.y-q.y)<(o.d+q.d)/2+8))continue;
    b.x=q.x;b.y=q.y;if(b.facility){b.facility.bx=q.x;b.facility.by=q.y;}placed=true;
   }
  }
  if(!placed){cleared.add(b.id);for(const list of [buildings,solids]){const i=list.indexOf(b);if(i>=0)list.splice(i,1);}}
 }
 // Vacant industrial work sites are the only demolition contracts.
 let workLot=0;
 for(const road of roads.filter(r=>!r.park&&!r.curve&&Math.hypot(r.b[0]-r.a[0],r.b[1]-r.a[1])>320)){
  if(workLot>=24)break;const dx=road.b[0]-road.a[0],dy=road.b[1]-road.a[1],len=Math.hypot(dx,dy),c=dx/len,n=dy/len;
  for(const side of [1,-1]){if(workLot>=24)break;const x=(road.a[0]+road.b[0])/2-n*(road.w/2+58)*side,y=(road.a[1]+road.b[1])/2+c*(road.w/2+58)*side,lot={x,y,w:56+(workLot%4)*12,d:40+(workLot%3)*8,angle:0};
   if(x<WEST_EDGE+150||x>SIZE.w-150||y<200||y>SIZE.h-200||inPark(x,y)||pond(x,y)||!roadClear(lot)||railClearance(x,y,60,500)||solids.some(o=>Math.abs(o.x-x)<(o.w+lot.w)/2+10&&Math.abs(o.y-y)<(o.d+lot.d)/2+10))continue;
   const type=['scrap','ruin','abandoned'][workLot%3],b=building(x,y,lot.w,lot.d,type==='scrap'?22+workLot%5*4:45+workLot%5*8,0,3300+workLot,'building',type==='scrap'?'metal':'brick',{id:'vacant-work-'+workLot,sign:({scrap:'工場の廃材置場',ruin:'無人の廃墟施設',abandoned:'閉鎖倉庫'})[type]});b.vacant=true;b.demolitionSite=true;b.industrial=type;b.hp=(type==='scrap'?260:460)+workLot%6*75;b.resistance=type==='scrap'?.8:1.15;workLot++;
  }
 }
 // Streetlight poles stay on the pavement edge, outside every driving lane.
 let light=0;
 for(const road of roads.filter(r=>!r.curve)){
  const dx=road.b[0]-road.a[0],dy=road.b[1]-road.a[1],len=Math.hypot(dx,dy),c=dx/len,n=dy/len;
  for(let at=80;at<len-50;at+=230)for(const side of [1,-1]){const x=road.a[0]+c*at-n*(road.w/2+15)*side,y=road.a[1]+n*at+c*(road.w/2+15)*side;if(baseIsRoad(x,y,-5)||roads.some(r=>segmentDistance(x,y,r)<r.w/2+8)||solids.some(o=>objectHits(o,x,y,8))||pond(x,y)||railClearance(x,y,8,500))continue;prop(x,y,'lamp','streetlight-'+light++,0);}
 }
 for(const p of props)if(p.type==='busStop'&&Number.isFinite(p.roadAngle)){p.angle=p.roadAngle;if(p.id==='bus-station-front')p.x=2170;}
 for(const bay of machineGarages){
  const angle=bay.angle,c=Math.cos(angle),n=Math.sin(angle);
  for(const list of [buildings,trees,props,solids])for(let i=list.length-1;i>=0;i--){const o=list[i];if(Math.abs(o.x-bay.x)<74&&Math.abs(o.y-bay.y)<74){if(o.job){o.x=bay.x+Math.sin(bay.heading)*88;o.y=bay.y-Math.cos(bay.heading)*88;continue;}cleared.add(o.id);list.splice(i,1);}}
  const shell={...bay,id:bay.id+'-garage-shell',kind:'prop',type:'machineGarage',material:'metal',hp:Infinity};props.push(shell);byId.set(shell.id,shell);
  for(const [j,shape] of [[-49,0,6,96],[49,0,6,96],[0,-47,98,6]].entries()){const [x,y,w,d]=shape;add({id:bay.id+'-wall-'+j,kind:'prop',type:'garageWall',x:bay.x+c*x-n*y,y:bay.y+n*x+c*y,w,d,h:60,angle,material:'metal',hp:Infinity,resistance:3});}
 }
 const pocketParks=[];
 for(let y=350;y<SIZE.h-260;y+=280)for(let x=WEST_EDGE+300;x<SIZE.w-260;x+=300){
  if(pocketParks.length>=42)break;const lot={x,y,w:112,d:86,angle:0};
  if(inPark(x,y)||pond(x,y)||[[-56,-43],[56,43],[-56,43],[56,-43]].some(([dx,dy])=>pond(x+dx,y+dy))||railClearance(x,y,85,500)||roads.some(r=>roadFootprintOverlap(lot,r,18))||pocketParks.some(p=>Math.hypot(p.x-x,p.y-y)<620)||solids.some(o=>Math.abs(o.x-x)<(o.w+lot.w)/2+16&&Math.abs(o.y-y)<(o.d+lot.d)/2+16))continue;
  const gap=Math.min(...roads.filter(r=>!r.park&&!r.bridge).map(r=>segmentDistance(x,y,r)));if(gap>210)continue;
  const id='pocket-park-'+pocketParks.length;pocketParks.push({...lot,id,name:'街角の小公園'});
  tree(x-35,y-24,21,0,4300+pocketParks.length,id+'-tree-0');tree(x+34,y+24,23,1,4400+pocketParks.length,id+'-tree-1');
  prop(x-25,y+24,'bench',id+'-bench-0',0);prop(x+25,y-24,'bench',id+'-bench-1',Math.PI);prop(x-38,y+6,'flowerBed',id+'-flowers-0',0);prop(x+38,y-6,'flowerBed',id+'-flowers-1',0);prop(x,y-32,'lamp',id+'-lamp',0);
 }
 const cityLots=createCityLots({roads,solids,pond,inPark,railClearance,west:WEST_EDGE,width:SIZE.w,height:SIZE.h,reserved:pocketParks});
 for(let i=solids.length-1;i>=0;i--){const o=solids[i];if(!['tree','prop'].includes(o.kind)||o.job||o.type==='serviceOffice')continue;if(cityLots.some(p=>Math.abs(o.x-p.x)<p.w/2+6&&Math.abs(o.y-p.y)<p.d/2+6)){solids.splice(i,1);byId.delete(o.id);cleared.add(o.id);const array=o.kind==='tree'?trees:props;const index=array.indexOf(o);if(index>=0)array.splice(index,1);}}
 for(const lot of cityLots){const type=lot.kind==='plaza'?'fountain':lot.kind==='yard'?'cargoStall':lot.kind==='sale'?'noticeboard':lot.kind==='orchard'?'planter':'bench';prop(lot.x-lot.w/2+18,lot.y-lot.d/2+18,type,lot.id+'-detail',0);if(['farm','orchard','backlot'].includes(lot.kind))prop(lot.x+lot.w/2-13,lot.y+lot.d/2-13,'planter',lot.id+'-green',0);}
 for(const lot of cityLots){if(lot.kind==='orchard')for(const x of [-.3,0,.3])for(const y of [-.28,.28])tree(lot.x+lot.w*x,lot.y+lot.d*y,25,1,lot.seed+Math.round((x+y)*100),lot.id+'-orchard-'+x+'-'+y);
  if(['ballpark','field'].includes(lot.kind))for(const [i,[x,y]] of [[-.46,-.45],[.46,-.45],[-.46,.45],[.46,.45]].entries())prop(lot.x+x*lot.w,lot.y+y*lot.d,'lamp',lot.id+'-light-'+i,0);
  if(lot.kind==='parking')for(let i=0;i<4;i++){const o=prop(lot.x-lot.w/2+23+i*46,lot.y-lot.d/2+26,'parkedCar',lot.id+'-car-'+i,0);Object.assign(o,{w:18,d:32,h:22,hp:130,material:'metal'});}
 }
 // Reserve infill uses real collision-grid objects and never touches a road or authored landmark lot.
 let evolutionBuildings=0,evolutionTrees=0;
 for(const road of roads){const len=Math.hypot(road.b[0]-road.a[0],road.b[1]-road.a[1]),co=(road.b[0]-road.a[0])/len,si=(road.b[1]-road.a[1])/len;
  for(let along=130;along<len-90;along+=195)for(const side of [-1,1])for(const offset of [road.w/2+100,road.w/2+190]){
   if(evolutionBuildings>=48&&evolutionTrees>=90)continue;const x=road.a[0]+co*along-si*offset*side,y=road.a[1]+si*along+co*offset*side,lot={x,y,w:48,d:44,h:42};
   if(x<WEST_EDGE+140||x>SIZE.w-140||y<150||y>SIZE.h-150||pond(x,y)||railClearance(x,y,52,500)||roads.some(r=>roadFootprintOverlap(lot,r,18))||cityLots.some(p=>Math.abs(p.x-x)<p.w/2+45&&Math.abs(p.y-y)<p.d/2+45)||pocketParks.some(p=>Math.hypot(p.x-x,p.y-y)<100)||solids.some(o=>objectHits(o,x,y,42)))continue;
   if(evolutionBuildings<48&&!inPark(x,y)&&Math.hypot(x-SPAWN.x,y-SPAWN.y)>400){const i=evolutionBuildings++,b=building(x,y,48,44,34+(i%4)*15,i%3,9200+i,'building',i%2?'brick':'wood',{id:'evolution-house-'+i,theme:x<0?'west':'east'});b.evolutionReserve=1+Math.floor(i/8);b.district=districtAt(x,y);}
   else if(evolutionTrees<90){const i=evolutionTrees++;tree(x,y,22+i%4*3,i%3,9300+i,'evolution-tree-'+i);trees.at(-1).evolutionReserve=1+Math.floor(i/15);}
  }
 }
 const grid=new Map(),cell=128;for(const o of solids){const hw=(o.angle===undefined?o.w:Math.hypot(o.w,o.d))/2+24,hd=(o.angle===undefined?o.d:Math.hypot(o.w,o.d))/2+24;for(let x=Math.floor((o.x-hw)/cell);x<=Math.floor((o.x+hw)/cell);x++)for(let y=Math.floor((o.y-hd)/cell);y<=Math.floor((o.y+hd)/cell);y++){const k=x+','+y;if(!grid.has(k))grid.set(k,[]);grid.get(k).push(o);}}
 return {buildings,trees,props,solids,byId,grid,cell,cleared,pocketParks,cityLots};
}
export const world=createWorld();
export function nearby(x,y){return world.grid.get(Math.floor(x/world.cell)+','+Math.floor(y/world.cell))??[];}
export function isDestroyed(s,id){if(!cityObjectActive(s,world.byId.get(id)))return true;return (s?.damage?.[id]??0)>=(world.byId.get(id)?.hp??Infinity);}
export function objectHits(o,x,y,r){
 if(o.circle)return Math.hypot(x-o.x,y-o.y)<o.r+r;
 if(o.angle===undefined)return circleRect(x,y,r,o);
 const dx=x-o.x,dy=y-o.y,c=Math.cos(o.angle),s=Math.sin(o.angle);
 return circleRect(c*dx+s*dy,-s*dx+c*dy,r,{x:0,y:0,w:o.w,d:o.d});
}
export function boundaryBlocked(x,y,r=11){return x<DRIVE_BOUNDS.west+r||y<DRIVE_BOUNDS.north+r||x>DRIVE_BOUNDS.east-r||y>DRIVE_BOUNDS.south-r;}
export function blocked(x,y,r=11,state=null,z=0){if(boundaryBlocked(x,y,r)||(z<3&&pond(x,y)))return true;for(const o of nearby(x,y)){if(o.kind==='barrier'||isDestroyed(state,o.id)||z>o.h)continue;if(objectHits(o,x,y,r))return true;}return false;}
// Graph split at every road intersection; navigation follows bridges and park paths.
const navNodes=[],nodeMap=new Map(),links=[],roadEdges=[];
function node(p){const k=Math.round(p[0])+','+Math.round(p[1]);if(!nodeMap.has(k)){nodeMap.set(k,navNodes.length);navNodes.push(p);links.push([]);}return nodeMap.get(k);}
for(let i=0;i<roads.length;i++){const r=roads[i],points=[r.a,r.b,...junctions.filter(n=>n.roads.includes(i)).map(n=>[n.x,n.y])];const dx=r.b[0]-r.a[0],dy=r.b[1]-r.a[1];points.sort((a,b)=>(a[0]-b[0])*dx+(a[1]-b[1])*dy);let prev=null;for(const p of points){const n=node(p);if(prev!==null&&prev!==n){const d=Math.hypot(...navNodes[n].map((v,k)=>v-navNodes[prev][k]));links[n].push([prev,d]);roadEdges.push({a:prev,b:n,d});links[prev].push([n,d]);}prev=n;}}
export function navigationPath(x,y,tx,ty){const nearest=(x,y)=>{let best=0,d=Infinity;navNodes.forEach((p,i)=>{const n=Math.hypot(x-p[0],y-p[1]);if(n<d){best=i;d=n;}});return best;};const start=nearest(x,y),goal=nearest(tx,ty),dist=new Array(navNodes.length).fill(Infinity),prev=new Array(navNodes.length).fill(-1),open=new Set([start]);dist[start]=0;while(open.size){let u=-1,best=Infinity;for(const n of open)if(dist[n]<best){best=dist[n];u=n;}if(u<0||u===goal)break;open.delete(u);for(const [v,d] of links[u])if(dist[u]+d<dist[v]){dist[v]=dist[u]+d;prev[v]=u;open.add(v);}}if(!Number.isFinite(dist[goal]))return [];const p=[[tx,ty]];for(let n=goal;n>=0;n=prev[n]){p.push(navNodes[n]);if(n===start)break;}p.push([x,y]);return p.reverse();}

// Snap to the actual drivable segment, including locations between two junctions.
function roadAnchor(x,y){
 let best=null;
 for(const edge of roadEdges){
  const a=navNodes[edge.a],b=navNodes[edge.b];
  const t=Math.max(0,Math.min(1,((x-a[0])*(b[0]-a[0])+(y-a[1])*(b[1]-a[1]))/edge.d**2));
  const point=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
  const gap=Math.hypot(x-point[0],y-point[1]);
  if(!best||gap<best.gap)best={edge,point,gap,t};
 }
 return best;
}

export function responseRoadPath(x,y,depots){
 const scene=roadAnchor(x,y);
 const {edge,point,t}=scene;
 const distances=new Float64Array(navNodes.length).fill(Infinity),next=[];
 distances[edge.a]=edge.d*t;distances[edge.b]=edge.d*(1-t);
 const open=new Set(navNodes.keys());
 while(open.size){
  let node=-1,distance=Infinity;
  for(const n of open)if(distances[n]<distance){distance=distances[n];node=n;}
  if(node<0)break;
  open.delete(node);
  for(const [neighbor,cost] of links[node]){
   if(distance+cost>=distances[neighbor])continue;
   distances[neighbor]=distance+cost;next[neighbor]=node;
  }
 }
 let best=null;
 for(const depot of depots){
  const start=roadAnchor(depot.x,depot.y);
  const {a,b,d}=start.edge;
  const options=[[a,d*start.t+distances[a]],[b,d*(1-start.t)+distances[b]]];
  if(start.edge===edge)options.push([undefined,d*Math.abs(start.t-t)]);
  for(const [node,distance] of options){
   if(!Number.isFinite(distance)||best&&best.distance<=distance)continue;
   best={node,distance,depot,start};
  }
 }
 if(!best)return null;
 const points=[best.start.point];
 for(let n=best.node;n!==undefined;n=next[n])points.push(navNodes[n]);
 points.push(point);
 return {...best,points:points.filter((p,i)=>!i||Math.hypot(p[0]-points[i-1][0],p[1]-points[i-1][1])>.1)};
}
