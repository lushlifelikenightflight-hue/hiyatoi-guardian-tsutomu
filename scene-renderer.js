import {drawNightVisibility} from './night-visibility.js?v=5.4.0';
import {drawMonsterVfx} from './monster-vfx.js?v=5.4.0';
import {cityObjectActive} from './city-evolution.js?v=5.4.0';
import {drawRobot,robotIcon,loadRobotAsset} from './robot-art.js?v=5.4.0';
import {paintCityLots} from './lot-art.js?v=5.4.0';
import {roadColor,junctionRadius,paintRoadJoins} from './road-finish.js?v=5.4.0';
import {SceneStream} from './scene-stream.js?v=5.4.0';
import {makeCanvas} from './canvas-factory.js?v=5.4.0';
import {sidewalkWidth} from './street-space.js?v=5.4.0';
import {drawGarageGlow,drawCityMarkers} from './city-markers.js?v=5.4.0';
import {machineGarages} from './garage-sites.js?v=5.4.0';
import {garageStack,drawGarage} from './garage-art.js?v=5.4.0';
import {industrialStack,drawNightGround,drawWindows,drawWeather} from './environment-render.js?v=5.4.0';
import {heroVehicleStack,widenStack,facilityStack} from './hero-art.js?v=5.4.0';
import {drawMonster,drawHeroGround,drawHeroEffects,drawWeaponMount,drawRebuilding,drawWeaponAim} from './hero-render.js?v=5.4.0';
import {railSurface,railEntrances,railAccessPoints} from './rail-drive.js?v=5.4.0';
import {serviceVisuals} from './job-service.js?v=5.4.0';
import {RoadGuidance,guidanceTarget} from './road-guidance.js?v=5.4.0';
import {jobTarget} from './jobs.js?v=5.4.0';
import {stationForecourts} from './city-upgrade.js?v=5.4.0';
import {groundHeight,roadGrade} from './elevation.js?v=5.4.0';
import {warpGroundTile} from './terrain-warp.js?v=5.4.0';
import {civicLight,civicSignals} from './city-upgrade.js?v=5.4.0';
import {LandscapeRenderer,groundCorners} from './landscape-renderer.js?v=5.4.0';
import {ambulanceVisible,stretcherAt} from './ambulance.js?v=5.4.0';
import {pursuitGoal} from './pursuit.js?v=5.4.0';
import {parkGates} from './park-trial.js?v=5.4.0';
import {pedestrianIncidents} from './pedestrian-incidents.js?v=5.4.0';
import {districtAt,districtStyles,groundDistricts} from './neighborhoods.js?v=5.4.0';
import {bodyOpacity} from './wreckage.js?v=5.4.0';
import {plaza} from './frontages.js?v=5.4.0';
import {markedCrossings} from './pedestrians.js?v=5.4.0';
import {NORTH_LIMIT,southNames,southPlazas,southernWater} from './south.js?v=5.4.0';
import {railSegments,stations} from './rail-layout.js?v=5.4.0';
import {mapView} from './map-view.js?v=5.4.0';
import {intersectionCrossings,signalState} from './signals.js?v=5.4.0';
import {SIZE,WEST_EDGE,destinations,SPAWN,STATION,RAIL,world,roads,spots,random,pond,pondPolygon,parkAreas,crossings,surfaces,junctions,isDestroyed,navigationPath,serviceBays,SERVICE_RADIUS} from './world.js?v=5.4.0';
import {YAW,PITCH,C,S,project,buildingStack,treeStack,pedestrianStack,parcelStack,fallenPedestrianStack,serviceOfficeStack,ambulanceStack,patrolStack,cityVehicleStack,landmarkStack,civicStack,scooterStack,sportStack,imageStack,bakeStack,bakeShadow,streetDetailStack,trainStack,stationStack,rampStack,drawSprite} from './art.js?v=5.4.0';
import {vehicles} from './physics.js?v=5.4.0';import {trainsAt,trainInView,crossingActive} from './railway.js?v=5.4.0';
const make=(w,h)=>{const c=makeCanvas();c.width=Math.ceil(w);c.height=Math.ceil(h);return c;};
function polygon(g,points){g.beginPath();points.forEach((p,i)=>(i?g.lineTo(...p):g.moveTo(...p)));g.closePath();}
function line(g,a,b){g.beginPath();g.moveTo(...a);g.lineTo(...b);g.stroke();}
export class Renderer{
 constructor(canvas){this.canvas=canvas;this.g=canvas.getContext('2d',{alpha:false});this.camera={...SPAWN};this.zoom=1;this.targetZoom=1;this.mode='golden';this.time=0;this.static=[];this.cars=[];this.particles=[];this.wrecks=new WeakMap();this.rubble=new Map();this.gates=new Map();this.pathCache=null;this.roadGuidance=new RoadGuidance();this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;this.groundTiles=new Map();this.flatTiles=new Map();this.landscape=new LandscapeRenderer();this.peopleSprites=new Map();this.parcelSprite=null;this.resize();}
 resize(){this.cssW=innerWidth;this.cssH=innerHeight;this.pixelScale=innerWidth<700?1.5:2;this.canvas.width=Math.ceil(innerWidth/this.pixelScale);this.canvas.height=Math.ceil(innerHeight/this.pixelScale);this.g.imageSmoothingEnabled=false;}
 async init(onProgress){
  await loadRobotAsset();
  const textures=await Promise.all(vehicles.map(async(v,i)=>{if(v.id==='destroyking')return null;if(v.id==='scooter')return scooterStack();if(['sport','taxi','firetruck','rescuevan','guardian'].includes(v.id))return heroVehicleStack(v.id);if(v.id==='dozer')return cityVehicleStack(v.id);const im=new Image();im.src=`assets/${v.id}.png`;await im.decode();const stack=imageStack(im,v.slices??32);return v.id==='bus'?widenStack(stack):stack;}));
  for(let n=0;n<vehicles.length;n++){if(vehicles[n].id==='destroyking'){this.cars[n]=Array(96).fill(robotIcon());continue;}this.cars[n]=[];for(let a=0;a<96;a++)this.cars[n].push(bakeStack(textures[n],a/96*Math.PI*2,vehicles[n].scale));}
  this.parcelSprite=bakeStack(parcelStack(),YAW,1);
  this.ambulanceModel=ambulanceStack();this.ambulanceSprites=new Map();
  this.patrolModel=patrolStack();this.patrolSprites=new Map();
  this.trainStacks=[trainStack(false),trainStack(true)];this.trainSprites=new Map();
  let n=0,total=world.buildings.length+world.trees.length+world.props.length;
  for(const o of [...world.buildings,...world.trees,...world.props]){
   const entry={x:o.x,y:o.y,kind:o.kind,data:o,height:o.h,p:project(o.x,o.y,groundHeight(o.x,o.y))};
   if(Math.hypot(o.x-SPAWN.x,o.y-SPAWN.y)<950)this.bakeObject(entry);
   this.static.push(entry);
   if(++n%24===0){onProgress(n/total);await new Promise(resolve=>setTimeout(resolve,0));}
  }
  for(const pad of surfaces.filter(x=>x.type==='ramp')){const stack=rampStack(pad);this.static.push({x:pad.x,y:pad.y,kind:'ramp',data:pad,height:stack.layers.length*stack.unit,p:project(pad.x,pad.y,groundHeight(pad.x,pad.y)),sprite:bakeStack(stack,YAW+pad.angle,stack.unit)});}
  this.static.sort((a,b)=>a.p.y-b.p.y);this.stream=new SceneStream(this);await this.stream.prepare(this.camera);onProgress(1);
 }
 bakeObject(entry){
   const o=entry.data;
   const stack=o.type==='parkedCar'?{...heroVehicleStack(o.id.endsWith('0')?'taxi':'sport'),unit:.75}:o.type==='machineGarage'?garageStack():o.kind==='station'?stationStack():o.kind==='building'?(o.industrial?industrialStack(o):o.facility?facilityStack(o):o.landmark?landmarkStack(o):buildingStack(o)):o.kind==='tree'?treeStack(o):o.type==='serviceOffice'?serviceOfficeStack(o.district):['mailbox','busStop'].includes(o.type)?civicStack(o.type):streetDetailStack(o.type);
   const angle=YAW+(o.angle??0);
   entry.sprite=bakeStack(stack,angle,stack.unit);
   entry.shadow=bakeShadow(stack,stack.unit,angle);
 }
 groundTile(tx,ty){
  const key=tx+','+ty;
  if(this.groundTiles.has(key)){
   const tile=this.groundTiles.get(key);this.groundTiles.delete(key);this.groundTiles.set(key,tile);
   return tile;
  }
  if(this.stream?.active){this.stream.request('ground',key,{x:tx,y:ty,visible:true});if(!this.stream.preview.has(key)){const im=make(768,768),g=im.getContext('2d');g.fillStyle='#879b78';g.fillRect(0,0,768,768);g.setTransform(C,S*PITCH,-S,C*PITCH,-tx,-ty);for(const r of roads){g.strokeStyle='#c2c5a5';g.lineWidth=r.w+sidewalkWidth(r)*2;g.lineCap='round';line(g,r.a,r.b);g.strokeStyle='#76877c';g.lineWidth=r.w;line(g,r.a,r.b);}this.stream.preview.set(key,im);}return this.stream.preview.get(key);}
  const started=performance.now();
  const tile=warpGroundTile(tx,ty,768,(x,y)=>this.flatGround(x,y));
  (this.tileMetrics??=[]).push({key,ms:performance.now()-started});if(this.tileMetrics.length>200)this.tileMetrics.shift();
  this.groundTiles.set(key,tile);
  if(this.groundTiles.size>24)this.groundTiles.delete(this.groundTiles.keys().next().value);
  return tile;
 }
 flatGround(tx,ty){
  const key=tx+','+ty;
  if(this.flatTiles.has(key))return this.flatTiles.get(key);
  const tile=this.buildGround(tx,ty);
  if(this.flatTiles.size>=16)this.flatTiles.delete(this.flatTiles.keys().next().value);
  this.flatTiles.set(key,tile);
  return tile;
 }
 buildGround(tx,ty){
  const size=768,im=make(size,size),g=im.getContext('2d'),rng=random(302);
  g.fillStyle='#879b78';g.fillRect(0,0,size,size);
  g.setTransform(C,S*PITCH,-S,C*PITCH,-tx,-ty);
  for(const [id,x,y,w,h] of groundDistricts){g.fillStyle=districtStyles[id].ground;g.fillRect(x,y,w,h);}
  const corners=groundCorners(tx,ty,size);
  this.landscape.paintTerrain(g,tx,ty,size,corners);
  paintCityLots(g,world.cityLots);
  for(const park of world.pocketParks){g.fillStyle='#c5c09b';g.fillRect(park.x-park.w/2-3,park.y-park.d/2-3,park.w+6,park.d+6);g.fillStyle='#76956d';g.fillRect(park.x-park.w/2,park.y-park.d/2,park.w,park.d);g.fillStyle='#d0c6a0';g.fillRect(park.x-6,park.y-park.d/2,12,park.d);g.fillRect(park.x-park.w/2,park.y-5,park.w,10);g.fillStyle='#9fb17a';for(let k=0;k<8;k++)g.fillRect(park.x-48+k*13,park.y+34,6,3);}
  for(const park of parkAreas){
   g.fillStyle=park.color;polygon(g,park.points);g.fill();
   if(park.id==='south-terraces'){
    g.save();polygon(g,park.points);g.clip();g.strokeStyle='#abb477';g.lineWidth=12;
    for(let y=4660;y<5740;y+=62)line(g,[3900,y],[5980,y+320]);
    g.strokeStyle='#bea28b';g.lineWidth=3;
    for(let y=4660;y<5740;y+=124)line(g,[3960,y+9],[5910,y+311]);
    g.restore();
   }
  }
  // Seed world cells so neighboring tiles agree on grass texture.
  const minX=Math.max(WEST_EDGE+110,Math.min(...corners.map(p=>p[0]))-8);
  const maxX=Math.min(SIZE.w-110,Math.max(...corners.map(p=>p[0]))+8);
  const minY=Math.max(130,Math.min(...corners.map(p=>p[1]))-8);
  const maxY=Math.min(SIZE.h-130,Math.max(...corners.map(p=>p[1]))+8);
  for(let x=Math.floor(minX/64)*64;x<maxX;x+=64)for(let y=Math.floor(minY/64)*64;y<maxY;y+=64){
   const cell=random(x*1957+y*3943+302),flecks=districtStyles[districtAt(x+32,y+32)].flecks;
   for(let i=0;i<20;i++){
    const px=x+cell()*64,py=y+cell()*64,w=2+cell()*4,h=1+cell()*3;
    if(px<WEST_EDGE+110||px>SIZE.w-110||py<130||py>SIZE.h-130)continue;
    g.fillStyle=flecks[i%flecks.length];g.fillRect(px,py,w,h);
   }
  }
  g.lineJoin='round';g.lineCap='round';g.strokeStyle='#b6bb93';g.lineWidth=20;polygon(g,pondPolygon);g.stroke();g.fillStyle='#4e9288';g.fill();g.strokeStyle='#6ba99a';g.lineWidth=6;g.stroke();
  for(let i=0;i<950;i++){const x=1600+rng()*1350,y=1710+rng()*430;if(pond(x,y)){g.fillStyle=i%4?'#6aa395':'#8bb8a3';g.fillRect(x,y,5+rng()*17,1);}}
  if(maxY>5200&&minY<6280&&maxX>650&&minX<3120){
   g.strokeStyle='#a5b195';g.lineWidth=19;polygon(g,southernWater);g.stroke();g.fillStyle='#508e89';g.fill();
   g.strokeStyle='#7bb1a2';g.lineWidth=5;g.stroke();
   const waterRandom=random(3435);
   for(let i=0;i<665;i++){
    const x=680+waterRandom()*2440,y=5220+waterRandom()*1060;
    if(pond(x,y)){g.fillStyle=i%4?'#6ea59b':'#9dc1aa';g.fillRect(x,y,5+waterRandom()*29,1.3);}
   }
  }
  for(const p of southPlazas){
   if(p.x+p.w/2<minX||p.x-p.w/2>maxX||p.y+p.h/2<minY||p.y-p.h/2>maxY)continue;
   const x=p.x-p.w/2,y=p.y-p.h/2;
   const pattern={
    market:['#ceae85','#b9987a','#e1c29a'],lock:['#a8bba9','#87aa9c','#d2ddd0'],
    hill:['#c8baac','#b8a5aa','#e1c5bd'],station:['#c2c6ad','#a9ad97','#d6cfaf']
   }[p.id];
   const [floor,joints,border]=pattern;
   g.fillStyle=floor;g.fillRect(x,y,p.w,p.h);
   g.strokeStyle=border;g.lineWidth=4;g.strokeRect(x+5,y+5,p.w-10,p.h-10);
   for(let dy=12;dy<p.h-10;dy+=13)for(let dx=12+(Math.floor(dy/13)%2)*7;dx<p.w-12;dx+=14){
    g.fillStyle=(dx+dy)%5===0?border:joints;
    if(p.id==='lock')g.fillRect(x+dx,y+dy,12,2);
    else if(p.id==='hill')g.fillRect(x+dx,y+dy,5,4);
    else g.fillRect(x+dx,y+dy,10,1.4);
   }
  }
  g.lineWidth=3;
  for(const [x,y,w,h,ground,border] of [[-1583,6710,264,119,'#8d9a64','#b8ab79'],
   [-1340,6665,190,156,'#a28d63','#b7a979'],[-2958,6971,160,198,'#95958a','#b6b5a1'],
   [1330,752,273,88,'#aab7ac','#b7c6b7']]){
   if(x+w<minX||x>maxX||y+h<minY||y>maxY)continue;
   g.fillStyle=ground;g.fillRect(x,y,w,h);g.strokeStyle=border;g.strokeRect(x,y,w,h);
   g.strokeStyle=border;g.lineWidth=2;
   for(let i=12;i<w-7;i+=17)line(g,[x+i,y+7],[x+i,y+h-7]);
   if(x===-1583){
    g.fillStyle='#c7c99d';for(let j=17;j<h-8;j+=22)for(let i=15;i<w-8;i+=27)g.fillRect(x+i,y+j,4,3);
   }
  }
  // The east forecourt uses paving aligned to the avenue and a stone basin.
  for(const court of stationForecourts){
   g.fillStyle='#c1b89c';g.fillRect(court.x,court.y,court.w,court.d);
   g.strokeStyle='#aca78f';g.lineWidth=1;
   for(let x=court.x;x<court.x+court.w;x+=16)line(g,[x,court.y],[x,court.y+court.d]);
   for(let y=court.y;y<court.y+court.d;y+=16)line(g,[court.x,y],[court.x+court.w,y]);
  }
  g.fillStyle='#c7c4aa';polygon(g,plaza.points);g.fill();
  g.save();polygon(g,plaza.points);g.clip();
  g.translate(...plaza.center);g.rotate(plaza.angle);
  for(let x=-203;x<204;x+=17)for(let y=-113;y<114;y+=17){
   g.fillStyle=((x+y)%5===0)?'#abae99':'#bebfa8';g.fillRect(x,y,16,16);
  }
  g.strokeStyle='#d8d3ad';g.lineWidth=4;g.strokeRect(-177,-94,354,188);
  g.strokeStyle='#9ca997';g.lineWidth=2;for(const x of [-142,142])line(g,[x,-80],[x,85]);
  g.restore();
  const tileRoads=roads.filter(r=>Math.min(r.a[0],r.b[0])<maxX+100&&Math.max(r.a[0],r.b[0])>minX-100&&
   Math.min(r.a[1],r.b[1])<maxY+100&&Math.max(r.a[1],r.b[1])>minY-100);
  const tileJunctions=junctions.filter(n=>n.x>=minX-145&&n.x<=maxX+145&&n.y>=minY-145&&n.y<=maxY+145);
  // Three shared surface passes make each intersection a continuous piece of road.
  for(const [extra,color] of [[18,'#c2c5a5'],[3,'#617469'],[0,null]])for(const r of tileRoads){g.lineCap='round';g.strokeStyle=color??roadColor(r);g.lineWidth=r.w+(extra===18?sidewalkWidth(r)*2:extra);line(g,r.a,r.b);}
  const majorJunctions=tileJunctions.filter(n=>n.roads.length>2||!roads[n.roads[0]].curve||
   roads[n.roads[0]].curve!==roads[n.roads[1]].curve);
  paintRoadJoins(g,tileRoads,majorJunctions,roads);
  // Paint markers on the same sampled curves as the drive surface.
  g.lineCap='butt';
  for(const r of tileRoads.filter(r=>!r.park&&(r.w>=60||r.curve)&&!r.bridge)){
   const dx=r.b[0]-r.a[0],dy=r.b[1]-r.a[1],len=Math.hypot(dx,dy),c=dx/len,n=dy/len;
   const at=(t,offset)=>[r.a[0]+c*t-n*offset,r.a[1]+n*t+c*offset];
   const lanes=r.lanes===4?[-r.w*.245,r.w*.245]:[0];
   if(r.lanes===4){
    g.strokeStyle='#cfbc86';g.lineWidth=1.45;
    for(const offset of [-2.9,2.9]){
     let begin=null;
     for(let t=0;t<=len+10;t+=10){
      const u=Math.min(t,len),p=at(u,offset);
      const clear=!majorJunctions.some(j=>Math.hypot(j.x-p[0],j.y-p[1])<junctionRadius(j,roads));
      if(clear){begin??=u;}else if(begin!==null){if(t-10>begin)line(g,at(begin,offset),at(t-10,offset));begin=null;}
      if(u===len){if(begin!==null&&u>begin)line(g,at(begin,offset),at(u,offset));break;}
     }
    }
   }
   g.strokeStyle='#ddd8b3';g.lineWidth=1.5;
   const start=r.curve?-((r.curveOffset??0)%31):14;
   for(let t=start;t<len;t+=31){
    const from=Math.max(0,t),to=Math.min(len,t+12);if(to<=from)continue;
    const [x,y]=at((from+to)/2,0);
    if(majorJunctions.some(j=>Math.hypot(j.x-x,j.y-y)<Math.max(...j.roads.map(i=>roads[i].w))*.64+10))continue;
    for(const offset of lanes)line(g,at(from,offset),at(to,offset));
   }
  }
  g.fillStyle='#a2ab78';polygon(g,[[-2620,2445],[-2540,2370],[-2345,2360],[-2245,2450],[-2390,2500]]);g.fill();
  g.fillStyle='#bdbea1';polygon(g,[[5220,2430],[5510,2330],[5690,2480],[5550,2690],[5275,2650]]);g.fill();
  // Broad grassy spaces, with paths continuing beyond the pond into both western districts.
  g.strokeStyle='#c2c99d';g.lineWidth=3;g.strokeRect(680,2580,220,125);g.strokeRect(1140,2800,180,120);g.fillStyle='#8eaa78';g.fillRect(680,2580,220,125);g.fillRect(1140,2800,180,120);
  for(const crossing of markedCrossings){
   g.save();g.translate(...crossing.center);g.rotate(crossing.angle);
   g.fillStyle='#e5ddbd';
   for(let y=-crossing.width/2+3;y<crossing.width/2-3;y+=7)g.fillRect(-9,y,18,4);
   if(!crossing.group)g.fillRect(-27,-crossing.width/2+3,2,crossing.width/2-5);
   g.fillRect(26,2,2,crossing.width/2-5);
   g.restore();
  }
  g.fillStyle='#aeb99b';g.fillRect(2010,1280,205,150);for(let x=2012;x<2215;x+=15)for(let y=1282;y<1430;y+=15){g.fillStyle='#c1c5a3';g.fillRect(x,y,14,14);}
  this.paintTrack(g,railSegments.filter(r=>r.a[2]===0&&r.b[2]===0
   &&Math.min(r.a[1],r.b[1])<maxY+85&&Math.max(r.a[1],r.b[1])>minY-85),false);
  for(const c of crossings){
   if(c.y<minY-75||c.y>maxY+75)continue;
   g.fillStyle='#819183';g.fillRect(c.x-c.w/2,c.y-49,c.w,98);
   g.strokeStyle='#d1c7a1';g.lineWidth=2;
   for(const y of [-31,-4,4,31])line(g,[c.x-c.w/2,c.y+y],[c.x+c.w/2,c.y+y]);
   g.fillStyle='#ddc78d';for(const side of [-1,1])for(let x=-c.w/2;x<c.w/2;x+=10)g.fillRect(c.x+x,c.y+side*53,6,4);
  }
  for(const r of tileRoads.filter(r=>r.bridge)){
   const length=Math.hypot(r.b[0]-r.a[0],r.b[1]-r.a[1]);
   g.save();g.translate(...r.a);g.rotate(Math.atan2(r.b[1]-r.a[1],r.b[0]-r.a[0]));
   g.fillStyle='#746952';g.fillRect(0,-r.w/2-3,length,r.w+6);
   g.fillStyle='#c6ac7c';g.fillRect(0,-r.w/2,length,r.w);
   g.fillStyle='#9b875e';for(let x=0;x<length;x+=10)g.fillRect(x,-r.w/2,2,r.w);
   g.strokeStyle='#e0cca0';g.lineWidth=2;for(const y of [-r.w/2,r.w/2])line(g,[0,y],[length,y]);
   g.restore();
  }
  for(const b of world.buildings){
   if(b.kind==='station'||b.x<minX-100||b.x>maxX+100||b.y<minY-100||b.y>maxY+100)continue;
   if(!b.use){g.fillStyle='#a6ad91';g.fillRect(b.x-b.w/2-3,b.y-b.d/2-3,b.w+6,b.d+6);continue;}
   g.save();g.translate(b.x,b.y);g.rotate(b.angle);
   g.fillStyle=b.theme==='west'?'#b4a180':'#c5c9b4';
   g.fillRect(-b.w/2-3,-b.d/2-3,b.w+6,b.d+15);
   if(b.use==='wood-shop'){g.fillStyle='#98866c';for(let x=-b.w/2;x<b.w/2;x+=8)g.fillRect(x,b.d/2+1,5,7);}
   g.restore();
  }
  for(const pad of surfaces){g.save();g.translate(pad.x,pad.y);g.rotate(pad.angle);g.fillStyle=pad.type==='boost'?'#4d8576':'#ad8959';g.fillRect(-pad.d/2,-pad.w/2,pad.d,pad.w);g.strokeStyle=pad.type==='boost'?'#ead28b':'#eee0af';g.lineWidth=3;for(let x=-pad.d/2+8;x<pad.d/2-3;x+=13){g.beginPath();g.moveTo(x-4,-pad.w*.25);g.lineTo(x+3,0);g.lineTo(x-4,pad.w*.25);g.stroke();}g.restore();}
  for(const bay of serviceBays){
   if(bay.x<minX-75||bay.x>maxX+75||bay.y<minY-75||bay.y>maxY+75)continue;
   const r=SERVICE_RADIUS,accent=districtStyles[bay.district].accent;
   g.save();g.translate(bay.x,bay.y);g.rotate(bay.heading);
   g.fillStyle='#68887f';g.fillRect(-r,-r,r*2,r*2);
   g.fillStyle='#829e8d';g.fillRect(-r+5,-r+5,r*2-10,r*2-10);
   g.strokeStyle=accent;g.lineWidth=3;
   g.strokeRect(-r+4,-r+4,r*2-8,r*2-8);
   g.fillStyle='#ebebcb';g.fillRect(-3,-13,6,26);g.fillRect(-13,-3,26,6);
   g.fillStyle=accent;for(const y of [-r+7,r-10])for(let x=-r+8;x<r-6;x+=10)g.fillRect(x,y,5,3);
   g.restore();
  }
  g.fillStyle='#d6d3ac';g.font='bold 17px "Yu Gothic UI", sans-serif';g.textAlign='center';g.fillText('木漏れ日駅',2110,1330);g.fillStyle='#b7c29c';g.font='16px "Yu Gothic UI", sans-serif';g.fillText('風紡ぎ広場',1070,2630);g.fillText('南のこなら林',1120,3410);g.fillText('花帆駅',5030,7280);
  return im;
 }
 paintTrack(g,sections,elevated,supports=false){
  if(elevated)sections=sections.flatMap(r=>{const length=r.end-r.start,count=Math.ceil(length/90),mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);return Array.from({length:count},(_,i)=>({...r,a:mix(r.a,r.b,i/count),b:mix(r.a,r.b,(i+1)/count),start:r.start+length*i/count,end:r.start+length*(i+1)/count,startNormal:mix(r.startNormal,r.endNormal,i/count),endNormal:mix(r.startNormal,r.endNormal,(i+1)/count)}));});
  const at=(x,y,z)=>elevated?this.screen(x,y,z):{x,y};
  const zoom=elevated?this.zoom:1;
  for(const r of sections){
   const n=Math.sin(r.angle),c=Math.cos(r.angle),length=r.end-r.start;
   const point=(p,offset)=>{
    const normal=p===r.a?r.startNormal:p===r.b?r.endNormal:[n,-c];
    return at(p[0]-normal[0]*offset,p[1]-normal[1]*offset,p[2]);
   };
   const trackLine=(offset)=>{const a=point(r.a,offset),b=point(r.b,offset);line(g,[a.x,a.y],[b.x,b.y]);};
   g.lineCap='round';
   if(elevated){
    const a=at(...r.a),b=at(...r.b);
    if(Math.max(a.x,b.x)<-120||Math.min(a.x,b.x)>this.canvas.width+120||
     Math.max(a.y,b.y)<-200||Math.min(a.y,b.y)>this.canvas.height+180)continue;
    if(supports)for(let t=70;t<length;t+=142){
     const q=t/length,x=r.a[0]+(r.b[0]-r.a[0])*q,y=r.a[1]+(r.b[1]-r.a[1])*q,z=r.a[2]+(r.b[2]-r.a[2])*q;
     if(z<24)continue;
     const base=at(x,y,0),top=at(x,y,z);
     g.strokeStyle='#7c9184';g.lineWidth=13*zoom;line(g,[base.x,base.y],[top.x,top.y]);
     g.strokeStyle='#a9b1a0';g.lineWidth=3*zoom;line(g,[base.x-4*zoom,base.y],[top.x-4*zoom,top.y]);
    }
   }
   if(supports)continue;
   const near=point(r.a,-44),far=point(r.a,44),nearEnd=point(r.b,-44),farEnd=point(r.b,44);
   if(elevated){
    const pair=near.y+nearEnd.y>=far.y+farEnd.y?[near,nearEnd]:[far,farEnd];
    const [a,b]=pair,da=Math.min(8,r.a[2])*zoom,db=Math.min(8,r.b[2])*zoom;
    g.fillStyle='#52655e';polygon(g,[[a.x,a.y],[b.x,b.y],[b.x,b.y+db],[a.x,a.y+da]]);g.fill();
   }
   g.fillStyle=elevated?'#737f74':'#596d61';
   polygon(g,[[near.x,near.y],[far.x,far.y],[farEnd.x,farEnd.y],[nearEnd.x,nearEnd.y]]);g.fill();
   g.strokeStyle='#9da99a';g.lineWidth=2*zoom;
   for(const edge of [-44,44])trackLine(edge);
   g.strokeStyle=elevated?'#a59f86':'#879485';g.lineWidth=3*zoom;
   for(let t=7;t<length;t+=15){
    const q=t/length,p=r.a.map((v,i)=>v+(r.b[i]-v)*q);
    for(const [from,to] of [[-36,-1],[1,36]]){
     const a=point(p,from),b=point(p,to);line(g,[a.x,a.y],[b.x,b.y]);
    }
   }
   g.strokeStyle='#d1d6bf';g.lineWidth=1.8*zoom;
   for(const rail of [-31,-4,4,31])trackLine(rail);
  }
 }
 screen(x,y,z=0){const p=project(x,y,z+groundHeight(x,y)),cp=project(this.camera.x,this.camera.y,this.camera.z??0);return {x:(p.x-cp.x)*this.zoom+this.canvas.width/2,y:(p.y-cp.y)*this.zoom+this.canvas.height*(this.frameY??.55)};}
 burst(x,y,time){
  const rng=random(Math.round(time*300)+(x|0));
  if(!this.reduced)this.particles.push({x,y,z:16,vx:0,vy:0,vz:0,life:.34,color:'#ffd173',size:16,flash:true});
  const count=this.reduced?15:46;
  for(let i=0;i<count&&this.particles.length<240;i++){
   const smoke=i>count*.40,angle=rng()*Math.PI*2,speed=(smoke?25:92)*rng()+13;
   const colors=smoke?['#79817a','#5e6962','#484f4c']:['#eb9151','#f7c575','#f8deb0','#c95e47'];
   this.particles.push({x,y,z:12,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,
    vz:smoke?12+rng()*18:30+rng()*65,life:smoke?1.4+rng():.26+rng()*.46,
    color:colors[i%colors.length],size:smoke?7+rng()*12:3+rng()*7,smoke});
  }
 }
 addEffects(s,dt){
  for(const car of [...(s.traffic??[]),...(s.responses??[]),...(s.pursuit?.cars??[])]){
   if(car.health!==0||this.wrecks.get(car)===car.wreckedAt)continue;
   this.wrecks.set(car,car.wreckedAt);
   if(Math.hypot(s.x-car.x,s.y-car.y)<850)this.burst(car.x,car.y,car.wreckedAt);
  }
  for(const e of s.events.splice(0)){
   if(e.type==='breakdown'||e.type==='hero-victory'){this.burst(e.x,e.y,e.time);continue;}
   if(['object-break','object-hit','train-hit','traffic-hit','land','boost','jump'].includes(e.type)){const rng=random(Math.round(e.time*1000)+(e.x|0));const count=this.reduced?3:e.type==='object-break'?28:e.type==='train-hit'?18:7;for(let i=0;i<count&&this.particles.length<240;i++)this.particles.push({x:e.x,y:e.y,z:Math.max(2,e.z??0),vx:(rng()-.5)*85,vy:(rng()-.5)*85,vz:25+rng()*75,life:.5+rng()*.8,color:e.type==='boost'?'#e8cc89':e.material==='wood'?'#b19662':e.type==='train-hit'?'#e4b977':'#c4b799',size:2+rng()*3});}}
  if(dt<=0)return;for(const p of this.particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vz-=(p.smoke?8:160)*dt;p.z=Math.max(0,p.z+p.vz*dt);}this.particles=this.particles.filter(p=>p.life>0);
 }
 rubbleSprite(o){if(this.rubble.has(o.id))return this.rubble.get(o.id);const w=o.w??20,d=o.d??20,extent=Math.ceil(Math.hypot(w,d)+20),im=make(extent,extent*PITCH+20),g=im.getContext('2d'),anchor={x:extent/2,y:extent*PITCH/2+10},rng=random(o.seed??o.x+o.y);const colors=o.material==='wood'?['#706b4d','#a08658','#c4a36b']:['#727d6d','#9b9c80','#c3b995'];for(let i=0;i<(o.kind==='building'||o.kind==='station'?44:12);i++){const p=project((rng()-.5)*w,(rng()-.5)*d);g.fillStyle=colors[i%3];g.fillRect(anchor.x+p.x,anchor.y+p.y-rng()*8,3+rng()*7,2+rng()*5);}const out={image:im,anchor};this.rubble.set(o.id,out);return out;}
 draw(s,dt,{paused=false,photo=false,target=null}={}){
  this.time=s.time;const time=s.time,g=this.g,W=this.canvas.width,H=this.canvas.height,follow=1-Math.exp(-dt*4);
  const monster=!photo&&s.hero.monster,combatWeight=monster?Math.max(0,Math.min(1,(900-Math.hypot(monster.x-s.x,monster.y-s.y))/250)):0,portrait=H>W;
  const focusShare=portrait?.4:.22,focusX=s.x+s.vx*.28+(monster?(monster.x-s.x)*focusShare*combatWeight:0),focusY=s.y+s.vy*.28+(monster?(monster.y-s.y)*focusShare*combatWeight:0);
  this.camera.x+=(focusX-this.camera.x)*follow;this.camera.y+=(focusY-this.camera.y)*follow;
  this.frameY??=.55;this.frameY+=(.55+(s.vehicle===10?.03:0)+(portrait?.12:.18)*combatWeight-this.frameY)*follow;
  const zoomGoal=this.targetZoom*(s.vehicle===10?.85:1)*(1-(portrait?.46:.42)*combatWeight);this.zoom+=(zoomGoal-this.zoom)*(1-Math.exp(-dt*6));this.addEffects(s,paused?0:dt);
  this.camera.z??=groundHeight(this.camera.x,this.camera.y);this.camera.z+=(groundHeight(s.x,s.y)+(s.deck??0)+(s.vehicle===10?28:0)-this.camera.z)*follow;
  const cp=project(this.camera.x,this.camera.y,this.camera.z),ox=W/2-cp.x*this.zoom,oy=H*(this.frameY??.55)-cp.y*this.zoom;g.fillStyle='#405b48';g.fillRect(0,0,W,H);g.imageSmoothingEnabled=false;
  this.stream?.update(cp,W,H,this.zoom,ox,oy,this.camera);
  const tileSize=768;
  for(let x=Math.floor(-ox/this.zoom/tileSize)*tileSize;x<(W-ox)/this.zoom;x+=tileSize){
   for(let y=Math.floor(-oy/this.zoom/tileSize)*tileSize;y<(H-oy)/this.zoom;y+=tileSize){
    const left=Math.round(ox+x*this.zoom),top=Math.round(oy+y*this.zoom);
    const right=Math.round(ox+(x+tileSize)*this.zoom),bottom=Math.round(oy+(y+tileSize)*this.zoom);
    g.drawImage(this.groundTile(x,y),left,top,right-left,bottom-top);
   }
  }
  const clouds=this.landscape.cloudsInView(this.camera,W,H,this.zoom,time,this.reduced);
  const cloudScreen=(x,y,z)=>{const p=project(x,y,z);return {x:p.x*this.zoom+ox,y:p.y*this.zoom+oy};};
  const playerGround=this.screen(s.x,s.y);
  this.landscape.drawClouds(g,clouds,cloudScreen,this.zoom,playerGround,true);
  this.drawTerrainSteps(g);
  drawNightGround(this,s);this.drawRepairZones(g,s,time);drawGarageGlow(this,s);
  if(!photo){drawHeroGround(this,s);this.drawRoadGuidance(g,s,target);}
  let visible=this.static.filter(o=>{if(!cityObjectActive(s,o.data))return false;const x=o.p.x*this.zoom+ox,y=o.p.y*this.zoom+oy;return x>-260&&x<W+260&&y>-50&&y<H+260;});
  for(const o of visible)if(!o.sprite){if(this.stream?.active)this.stream.request('object','object:'+o.data.id,{id:o.data.id});else this.bakeObject(o);}
  visible=visible.filter(o=>o.sprite);
  for(const o of visible)if(o.shadow&&!isDestroyed(s,o.data.id)){const p=this.screen(o.x,o.y);drawSprite(g,o.shadow,p.x,p.y,this.zoom);}
  const elevatedSections=railSegments.filter(r=>r.a[2]>0||r.b[2]>0);
  this.paintTrack(g,elevatedSections,true,true);
  g.strokeStyle='#a7c3a0';g.lineWidth=1;for(let i=0;i<18;i++){const x=1700+i*61,y=1880+Math.sin(i*11)*90;if(!pond(x,y))continue;const p=this.screen(x+(this.reduced?0:Math.sin(time*.6+i)*8),y);line(g,[p.x,p.y],[p.x+11*this.zoom,p.y-2*this.zoom]);}
  if(!photo&&!s.pursuit)for(const p of destinations){if(s.collected.has(p.id)||(!spots.includes(p)&&p.id!==target))continue;const a=this.screen(p.x,p.y),active=target===p.id;g.strokeStyle=active?'#f0d799':'#c8bd8f';g.lineWidth=active?2:1;g.beginPath();g.ellipse(a.x,a.y,22*this.zoom,13*this.zoom,0,0,Math.PI*2);g.stroke();g.fillStyle='#e8d19a';g.beginPath();g.moveTo(a.x,a.y-23*this.zoom);g.lineTo(a.x+4*this.zoom,a.y-18*this.zoom);g.lineTo(a.x,a.y-13*this.zoom);g.lineTo(a.x-4*this.zoom,a.y-18*this.zoom);g.fill();}
  const gate=(s.serviceGuide?null:jobTarget(s))??parkGates[s.trial?.gate]??(s.pursuit?pursuitGoal:null);
  if(gate&&!photo)this.drawTrialGate(gate,Boolean(s.work?.hold>0));
  const objects=visible.map(o=>({...o,depth:o.p.y})),raisedTrains=[];
  const service=serviceVisuals(s,this.reduced);
  for(const actor of service.actors)if(actor.opacity>.02)objects.push({...actor,depth:project(actor.x,actor.y,groundHeight(actor.x,actor.y)).y});
  if(service.active)objects.push({kind:'jobDoor',...service.active,depth:project(service.active.door.x,service.active.door.y,groundHeight(service.active.door.x,service.active.door.y)).y+2});
  for(const parcel of service.parcels)objects.push({kind:'jobParcel',...parcel,depth:project(parcel.x,parcel.y,groundHeight(parcel.x,parcel.y)).y+2});
  if(s.work?.id==='demolition'){
   const b=world.byId.get(s.work.stops[0].building);
   if(b){const q=this.screen(b.x,b.y,b.h+12);g.fillStyle='#f4d698';g.font='bold 11px sans-serif';g.textAlign='center';g.fillText('解体対象',q.x,q.y);g.textAlign='start';}
  }
  for(const t of trainsAt(time)){
   if(!trainInView(t))continue;
   const p=this.screen(t.x,t.y,t.z);
   if(p.x<=-140||p.x>=W+140||p.y<=-100||p.y>=H+100)continue;
   (t.z>0?raisedTrains:objects).push({...t,depth:project(t.x,t.y,t.z+groundHeight(t.x,t.y)).y});
  }
  for(const car of s.traffic??[]){
   const opacity=bodyOpacity(car,time);
   if(opacity===0)continue;
   const p=project(car.x,car.y,groundHeight(car.x,car.y)),x=p.x*this.zoom+ox,y=p.y*this.zoom+oy;
   if(x>=-90&&x<W+90&&y>=-30&&y<H+80)objects.push({...car,kind:'traffic',depth:p.y,opacity});
  }
  for(const rescue of s.responses??[]){
   if(!ambulanceVisible(rescue,time))continue;
   const p=this.screen(rescue.x,rescue.y);
   if(p.x<-85||p.x>W+85||p.y<-60||p.y>H+90)continue;
   objects.push({...rescue,kind:'ambulance',depth:project(rescue.x,rescue.y).y});
   const cot=stretcherAt(rescue,time);
   if(cot)objects.push({...cot,kind:'stretcher',depth:project(cot.x,cot.y).y});
  }
  for(const patrol of s.pursuit?.cars??[]){
   if(patrol.health<=0)continue;
   const p=this.screen(patrol.x,patrol.y);
   if(p.x>=-75&&p.x<=W+75&&p.y>=-60&&p.y<=H+80)
    objects.push({...patrol,kind:'patrol',depth:project(patrol.x,patrol.y,groundHeight(patrol.x,patrol.y)).y});
  }
  const fallen=pedestrianIncidents(s,time).map(person=>({...person,pose:'fallen'}));
  for(const person of [...(s.crowd?.people??[]),...fallen]){
   if(person.pose!=='fallen'&&(s.struck?.get(person.id)?.recoverAt??0)>time)continue;
   const p=project(person.x,person.y,groundHeight(person.x,person.y)),x=p.x*this.zoom+ox,y=p.y*this.zoom+oy;
   // The seated body belongs in front of the bench backrest.
   if(x>=-35&&x<W+35&&y>=-25&&y<H+40)objects.push({...person,kind:'pedestrian',depth:p.y+(person.pose==='sit'?8:0)});
  }
  for(const crossing of intersectionCrossings){
   const [x,y]=crossing.center;
   const c=Math.cos(crossing.angle),n=Math.sin(crossing.angle);
   for(const side of [-1,1]){
    const curb=side*(crossing.width/2+10);
    const px=x-n*curb+c*12,py=y+c*curb+n*12;
    const point=project(px,py);
    if(point.x*this.zoom+ox< -45||point.x*this.zoom+ox>W+45||
       point.y*this.zoom+oy< -40||point.y*this.zoom+oy>H+100)continue;
    objects.push({kind:'signals',x:px,y:py,depth:point.y,group:crossing.group,side});
   }
  }
  for(const signal of civicSignals)for(const arm of signal.arms){
   const [dx,dy]=arm,axis=Math.abs(dx)>=Math.abs(dy)?0:1;
   const x=signal.x+dx*60+dy*23,y=signal.y+dy*60-dx*59,p=this.screen(x,y);
   if(p.x< -40||p.x>W+40||p.y< -40||p.y>H+80)continue;
   objects.push({kind:'civicSignal',x,y,depth:project(x,y,groundHeight(x,y)).y,signal,axis});
  }
  for(const c of crossings)objects.push({kind:'crossing',x:c.x,y:c.y,data:c,depth:project(c.x,c.y+65).y});
  const playerOpacity=bodyOpacity(s,time);
  const upperPlayer=s.surface==='rail'&&s.deck>0||s.z>75;
  if(playerOpacity>0&&!upperPlayer)objects.push({kind:'car',x:s.x,y:s.y,depth:project(s.x,s.y,groundHeight(s.x,s.y)).y});
  if(s.hero.monster&&Math.hypot(s.hero.monster.x-s.x,s.hero.monster.y-s.y)<1200)objects.push({kind:'monster',x:s.hero.monster.x,y:s.hero.monster.y,depth:project(s.hero.monster.x,s.hero.monster.y,groundHeight(s.hero.monster.x,s.hero.monster.y)).y});
  objects.sort((a,b)=>a.depth-b.depth);
  const player=this.screen(s.x,s.y,s.z+(s.deck??0)),playerDepth=project(s.x,s.y,groundHeight(s.x,s.y)+(s.deck??0)).y;
  const stationMasks=visible.filter(o=>o.kind==='station'&&!isDestroyed(s,o.data.id));
  for(const o of objects){const p=this.screen(o.x,o.y);
   if(o.data?.type==='machineGarage'){drawGarage(this,s,o,p);
   }else if(o.kind==='monster'){drawMonster(this,s);
   }else if(o.kind==='car'){
    this.drawPlayer(s,playerOpacity);
   }else if(o.kind==='pedestrian'){
    const phase=Math.floor(time*5)%2;
    const pose=o.pose==='fallen'?'fallen':this.reduced&&o.pose!=='sit'?'stand':
     o.id.startsWith('plaza-walk')?(phase?'walk-a':'walk-b'):o.pose;
    const angle=o.heading-Math.PI/2+YAW;
    const facing=((Math.round(angle/(Math.PI*2)*12)%12)+12)%12;
    const key=o.style+'-'+pose+'-'+facing;
    if(!this.peopleSprites.has(key)){
     const stack=pose==='fallen'?fallenPedestrianStack(o.style):pedestrianStack(o.style,pose);
     this.peopleSprites.set(key,bakeStack(stack,facing/12*Math.PI*2,stack.unit));
    }
    if(pose!=='sit'){
     g.fillStyle='rgba(20,43,35,'+(.32*(o.opacity??1))+')';g.beginPath();g.ellipse(p.x+1,p.y+2,5*this.zoom,3*this.zoom,0,0,Math.PI*2);g.fill();
    }
    drawSprite(g,this.peopleSprites.get(key),p.x,p.y,this.zoom,o.opacity??1);
    if(o.parcel){const q=this.screen(o.x+Math.cos(o.heading)*4,o.y+Math.sin(o.heading)*4,8);drawSprite(g,this.parcelSprite,q.x,q.y,this.zoom,o.opacity??1);}
   }else if(o.kind==='jobDoor'){
    this.drawJobDoor(g,o);
   }else if(o.kind==='jobParcel'){
    const q=this.screen(o.x,o.y,o.z);drawSprite(g,this.parcelSprite,q.x,q.y,this.zoom,o.opacity);
   }else if(o.kind==='ambulance'){
    this.drawEmergency(o,p,time);
   }else if(o.kind==='patrol'){
    this.drawEmergency(o,p,time,true);
   }else if(o.kind==='stretcher'){
    const a=this.screen(o.x-Math.cos(o.heading)*10,o.y-Math.sin(o.heading)*10,4);
    const b=this.screen(o.x+Math.cos(o.heading)*10,o.y+Math.sin(o.heading)*10,4);
    g.strokeStyle='#315652';g.lineWidth=8*this.zoom;line(g,[a.x,a.y],[b.x,b.y]);
    g.strokeStyle=o.loaded?'#c8e4d4':'#e1c188';g.lineWidth=5*this.zoom;line(g,[a.x,a.y],[b.x,b.y]);
    if(o.loaded){g.fillStyle='#cca889';g.fillRect(b.x-1.5*this.zoom,b.y-1.5*this.zoom,3*this.zoom,3*this.zoom);}
   }else if(o.kind==='civicSignal'){
    this.drawCivicSignal(g,o,p,time);
   }else if(o.kind==='signals'){
    this.drawSignal(o,p,time);
   }else if(o.kind==='traffic'){
    const angle=((o.heading-Math.PI/2+YAW)%(Math.PI*2)+Math.PI*2)%(Math.PI*2);
    g.fillStyle='rgba(20,43,35,'+(.28*o.opacity)+')';g.beginPath();g.ellipse(p.x,p.y+3,13*this.zoom,6*this.zoom,angle,0,Math.PI*2);g.fill();
    drawSprite(g,this.cars[o.vehicle][Math.round(angle/(Math.PI*2)*96)%96],p.x,p.y,this.zoom,o.opacity);
    if(o.incidentBraking||o.yielding){
     const c=Math.cos(o.heading),n=Math.sin(o.heading);
     g.fillStyle='#fa826a';
     for(const side of [-1,1]){
      const lamp=this.screen(o.x-c*12-n*side*6,o.y-n*12+c*side*6,4);
      g.fillRect(Math.round(lamp.x),Math.round(lamp.y),3*this.zoom,2*this.zoom);
     }
    }
    if(o.signal&&(this.reduced||Math.floor(time*3.1)%2===0)){
     const c=Math.cos(o.heading),n=Math.sin(o.heading),side=o.signal==='right'?1:-1;
     for(const end of [-1,1]){
      const lamp=this.screen(o.x+c*end*12-n*side*7,o.y+n*end*12+c*side*7,5);
      g.fillStyle='#ffd381';g.fillRect(Math.round(lamp.x),Math.round(lamp.y),4*this.zoom,3*this.zoom);
     }
    }
   }else if(o.kind==='train'){
    this.drawTrain(g,o,stationMasks);
   }else if(o.kind==='crossing')this.drawCrossing(g,o.data,s,dt);
   else if(isDestroyed(s,o.data.id)){if(o.kind!=='ramp'){drawSprite(g,this.rubbleSprite(o.data),p.x,p.y,this.zoom);drawRebuilding(this,s,o,p);}}
   else{
    let alpha=1;const spr=o.sprite,top=p.y-spr.anchor.y*this.zoom,left=p.x-spr.anchor.x*this.zoom,bottom=top+spr.image.height*this.zoom;if(o.kind!=='station'&&o.depth>playerDepth&&player.x>left&&player.x<left+spr.image.width*this.zoom&&player.y>top&&player.y<bottom)alpha=.40;
    drawSprite(g,spr,p.x,p.y,this.zoom,alpha);
    const damage=s.damage[o.data.id]??0;if(damage>0){g.strokeStyle='#435647';g.lineWidth=1.4;const q=this.screen(o.x,o.y+o.data.d/2,o.height*.55);line(g,[q.x-8,q.y-12],[q.x-1,q.y-3]);line(g,[q.x-1,q.y-3],[q.x-5,q.y+6]);if(damage/o.data.hp>.5)line(g,[q.x+9,q.y-15],[q.x-4,q.y+13]);}
    if(o.kind==='building')drawWindows(this,s,o);
    if(this.mode==='night'&&o.kind==='station'){const q=this.screen(o.x,o.y+o.data.d/2,o.height*.58);g.fillStyle='#e4c083';g.fillRect(q.x-5,q.y,3*this.zoom,2*this.zoom);}
   }
  }
  // Deck and train plate sit over the street layer. Pillars remain within the ground layer.
  this.paintTrack(g,elevatedSections,true);
  if(!photo)this.drawRoadGuidance(g,s,target,true);
  this.descendingEntry=destinations.find(p=>p.id===(s.serviceGuide??target)&&p.railExit)?.entryId;
  for(const entry of railEntrances)this.drawRailEntrance(entry,time,true);
  if(s.hero.monster)raisedTrains.push({kind:'monsterHead',depth:project(s.hero.monster.x,s.hero.monster.y,groundHeight(s.hero.monster.x,s.hero.monster.y)).y});
  if(upperPlayer&&playerOpacity>0)raisedTrains.push({kind:'railPlayer',depth:playerDepth});
  for(const entry of railEntrances)raisedTrains.push({kind:'railEntrance',entry,depth:project(entry.x-16,entry.y-76,groundHeight(entry.x-16,entry.y-76)).y});
  for(const train of raisedTrains.sort((a,b)=>a.depth-b.depth)){if(train.kind==='monsterHead')drawMonster(this,s,true);else if(train.kind==='railPlayer')this.drawPlayer(s,playerOpacity);else if(train.kind==='railEntrance')this.drawRailEntrance(train.entry,time,false);else this.drawTrain(g,train);}
  drawNightVisibility(this,s);
  if(!photo)drawWeaponAim(this,s);
  drawCityMarkers(this,s);
  if(service.active&&!photo)this.drawJobPhase(g,service.active);
  if(!photo)drawHeroEffects(this,s);
  for(const p of this.particles){
   const q=this.screen(p.x,p.y,p.z);
   if(p.flash)continue;
   g.globalAlpha=Math.min(p.smoke?.70:1,p.life*2);
   g.fillStyle=p.color;
   g.fillRect(Math.round(q.x),Math.round(q.y),p.size*this.zoom,p.size*this.zoom);
   g.globalAlpha=1;
  }
  for(const p of this.particles.filter(p=>p.flash)){
   const q=this.screen(p.x,p.y,p.z);
   const r=(12+(1-p.life/.34)*12)*this.zoom;
   g.globalAlpha=Math.min(.95,p.life*4);
   g.fillStyle='#e4824b';g.fillRect(q.x-r,q.y-r*.35,r*2,r*.70);
   g.fillRect(q.x-r*.40,q.y-r*.8,r*.8,r*1.6);
   g.fillStyle='#ffd173';g.fillRect(q.x-r*.62,q.y-r*.23,r*1.24,r*.46);
   g.fillRect(q.x-r*.23,q.y-r*.58,r*.46,r*1.16);
   g.fillStyle='#fff0c0';g.fillRect(q.x-r*.26,q.y-r*.22,r*.52,r*.44);
   g.globalAlpha=1;
  }
  this.landscape.drawClouds(g,clouds,cloudScreen,this.zoom,playerGround);
  if(this.mode==='golden'){g.fillStyle='rgba(239,174,80,.055)';g.fillRect(0,0,W,H);}
  drawWeather(this,s);
  const vignette=g.createRadialGradient(W/2,H/2,H*.25,W/2,H/2,Math.max(W,H)*.66);vignette.addColorStop(0,'rgba(15,36,31,0)');vignette.addColorStop(1,'rgba(15,36,31,.27)');g.fillStyle=vignette;g.fillRect(0,0,W,H);
  drawNightVisibility(this,s);
  if(!photo)drawMonsterVfx(this,s);
  if(!photo)drawWeaponAim(this,s);
  drawCityMarkers(this,s);
  if(!photo){const a=this.screen(s.x,s.y);g.strokeStyle=s.broken?'#d58f6c':'#e7d5a4';g.lineWidth=1;g.beginPath();g.ellipse(a.x,a.y+3,18*this.zoom,10*this.zoom,0,0,Math.PI*2);g.stroke();}
 }
 drawTrain(g,train,stationMasks=[]){
  const turn=((Math.round(train.angle/(Math.PI*2)*48)%48)+48)%48,key=turn+':'+Number(train.head);
  if(!this.trainSprites.has(key))this.trainSprites.set(key,bakeStack(this.trainStacks[Number(train.head)],YAW+turn/48*Math.PI*2,1.5));
  const p=this.screen(train.x,train.y,train.z);
  const masks=stationMasks.filter(o=>Math.abs(train.x-o.x)<o.data.w/2+110&&Math.abs(train.y-o.y)<o.data.d/2+35);
  if(!masks.length){drawSprite(g,this.trainSprites.get(key),p.x,p.y,this.zoom);return;}
  // Cut out the actual roof/wall pixels, not the convex screen-space bounding box.
  // This keeps the train nose visible right up to the dark portal.
  const layer=this.trainPortalLayer??=make(this.canvas.width,this.canvas.height);
  if(layer.width!==this.canvas.width||layer.height!==this.canvas.height){layer.width=this.canvas.width;layer.height=this.canvas.height;}
  const ink=layer.getContext('2d');ink.clearRect(0,0,layer.width,layer.height);ink.imageSmoothingEnabled=false;
  drawSprite(ink,this.trainSprites.get(key),p.x,p.y,this.zoom);
  ink.globalCompositeOperation='destination-out';
  for(const mask of masks){const q=this.screen(mask.x,mask.y);drawSprite(ink,mask.sprite,q.x,q.y,this.zoom);}
  ink.globalCompositeOperation='source-over';g.drawImage(layer,0,0);
 }
 drawCrossing(g,c,s,dt){const active=crossingActive(c,s.time),previous=this.gates.get(c.id)??Number(active),amount=previous+(Number(active)-previous)*Math.min(1,dt*5);this.gates.set(c.id,amount);for(const side of [-1,1]){const postX=c.x-side*(c.w/2+5),postY=c.y+side*64,base=this.screen(postX,postY),top=this.screen(postX,postY,28);g.strokeStyle='#3b5547';g.lineWidth=3*this.zoom;line(g,[base.x,base.y],[top.x,top.y]);const destroyed=isDestroyed(s,c.id+'-gate-'+side);if(!destroyed){const angle=(1-amount)*Math.PI/2;for(let n=0;n<12;n++){const a=n/12,b=(n+1)/12,p=this.screen(postX+side*Math.cos(angle)*c.w*a,postY,8+Math.sin(angle)*c.w*a),q=this.screen(postX+side*Math.cos(angle)*c.w*b,postY,8+Math.sin(angle)*c.w*b);g.strokeStyle=n%2?'#384c3d':'#ddba68';g.lineWidth=3*this.zoom;line(g,[p.x,p.y],[q.x,q.y]);}}g.fillStyle=active&&(this.reduced||Math.floor(s.time*5)%2===0)?'#ee8762':'#817157';g.beginPath();g.arc(top.x,top.y,3*this.zoom,0,Math.PI*2);g.fill();}}
 drawCivicSignal(g,o,p,time){
  const z=this.zoom,light=civicLight(o.signal,o.axis,time),arm=o.axis===0?1:-1;
  g.strokeStyle='#50675f';g.lineWidth=2.7*z;
  line(g,[p.x,p.y],[p.x,p.y-40*z]);line(g,[p.x,p.y-40*z],[p.x+arm*15*z,p.y-40*z]);
  const x=p.x+arm*13*z,y=p.y-40*z;
  g.fillStyle='#293e3d';g.fillRect(x-9*z,y-4*z,18*z,8*z);
  for(const [i,[kind,on,off]] of [['red','#f4856e','#604741'],['yellow','#efce7d','#6a6041'],['green','#a0deb7','#43645a']].entries()){
   g.fillStyle=kind===light?on:off;g.fillRect(x+(i*5-6)*z,y-1.6*z,3*z,3.2*z);
  }
 }
 drawRepairZones(g,s,time){
  const phase=this.reduced?0:time*.82%1;
  for(const bay of serviceBays){
   const p=this.screen(bay.x,bay.y);
   if(p.x<-100||p.x>this.canvas.width+100||p.y<-120||p.y>this.canvas.height+100)continue;
   const active=s.repairSite===bay.id, radius=SERVICE_RADIUS*this.zoom;
   const ring=(r,alpha,width)=>{
    g.strokeStyle='rgba(161,234,203,'+alpha+')';g.lineWidth=width*this.zoom;
    g.beginPath();g.ellipse(p.x,p.y,r,r*.71,YAW*.06,0,Math.PI*2);g.stroke();
   };
   g.fillStyle=active?'rgba(143,227,193,.25)':'rgba(109,190,166,.17)';
   g.beginPath();g.ellipse(p.x,p.y,radius,radius*.71,0,0,Math.PI*2);g.fill();
   ring(radius,.84,2);if(!this.reduced)ring(radius*(.52+.46*phase),(.68-phase*.51),1.4);
   for(const side of [-1,1]){
    const x=p.x+side*radius*.76,top=p.y-(active?34:27)*this.zoom;
    g.strokeStyle='rgba(166,240,204,.51)';g.lineWidth=1.8*this.zoom;line(g,[x,p.y],[x,top]);
    g.fillStyle='#bde9c4';g.fillRect(x-3*this.zoom,top-1.5*this.zoom,6*this.zoom,3*this.zoom);
   }
  }
 }
 drawTerrainSteps(g){
  for(const [x,y,dx,dy] of [[5225,5720,1,0],[-2834,6950,0,1],[-1436,6695,1,0]]){
   const p=this.screen(x,y);
   if(p.x< -120||p.x>this.canvas.width+120||p.y< -100||p.y>this.canvas.height+110)continue;
   const point=(along,across,z)=>{
    const px=x+along*dx-across*dy,py=y+along*dy+across*dx;
    const q=this.screen(px,py,z-groundHeight(px,py));return [q.x,q.y];
   };
   for(let i=0;i<10;i++){
    const a=i*6,b=a+6,h=groundHeight(x+(a+3)*dx,y+(a+3)*dy),next=groundHeight(x+(b+3)*dx,y+(b+3)*dy);
    g.fillStyle=i%2?'#adac92':'#bbb99e';polygon(g,[point(a,-10,h),point(b,-10,h),point(b,10,h),point(a,10,h)]);g.fill();
    g.fillStyle='#788a7b';polygon(g,[point(b,-10,h),point(b,-10,next),point(b,10,next),point(b,10,h)]);g.fill();
   }
  }
 }
 drawSignal(object,point,time){
  const g=this.g,zoom=this.zoom,{vehicle,pedestrian}=signalState(object.group,time);
  const x=point.x,y=point.y,top=y-46*zoom,small=y-26*zoom;
  g.strokeStyle='#48534a';g.lineWidth=2.5*zoom;
  line(g,[x,y],[x,top]);
  g.fillStyle='#46504b';g.fillRect(x-3*zoom,y-3*zoom,6*zoom,3*zoom);
  g.fillStyle='#303d3a';g.fillRect(x-11*zoom,top-4.5*zoom,22*zoom,9*zoom);
  const lamps=[['green','#87dbc4','#39524d'],['yellow','#f0c96b','#534f3a'],['red','#ef795c','#563d36']];
  lamps.forEach(([state,bright,dark],i)=>{
   g.fillStyle=vehicle===state?bright:dark;
   g.beginPath();g.arc(x+(i-1)*6*zoom,top,2.45*zoom,0,Math.PI*2);g.fill();
  });
  const walkX=x+object.side*5*zoom;
  g.fillStyle='#303d3a';g.fillRect(walkX-4*zoom,small-6*zoom,8*zoom,12*zoom);
  const walkLit=pedestrian==='green'||(pedestrian==='flash'&&(this.reduced||Math.floor(time*4)%2===0));
  g.fillStyle=pedestrian==='red'?'#f48a70':'#563d36';
  g.fillRect(walkX-1.5*zoom,small-4*zoom,3*zoom,3.2*zoom);
  g.fillStyle=walkLit?'#89dfc9':'#39524d';
  g.fillRect(walkX-.6*zoom,small+.5*zoom,1.3*zoom,2.8*zoom);
  g.strokeStyle=g.fillStyle;g.lineWidth=1*zoom;
  line(g,[walkX,small+2*zoom],[walkX-2*zoom,small+4.1*zoom]);
  line(g,[walkX,small+2*zoom],[walkX+2*zoom,small+4.1*zoom]);
 }
 drawEmergency(o,p,time,patrol=false){
  const g=this.g,zoom=this.zoom;
  const a=o.heading-Math.PI/2+YAW,angle=(Math.round(a*48/Math.PI)%96+96)%96;
  const model=patrol?this.patrolModel:this.ambulanceModel,sprites=patrol?this.patrolSprites:this.ambulanceSprites;
  if(!sprites.has(angle))sprites.set(angle,bakeStack(model,angle/96*Math.PI*2,model.unit));
  g.fillStyle='rgba(20,43,35,.33)';g.beginPath();g.ellipse(p.x,p.y+2,15*zoom,7*zoom,a,0,Math.PI*2);g.fill();
  drawSprite(g,sprites.get(angle),p.x,p.y,zoom,bodyOpacity(o,time));
  if(o.health!==undefined){g.fillStyle='#203d43';g.fillRect(p.x-17*zoom,p.y-33*zoom,34*zoom,4*zoom);g.fillStyle=o.health>0?'#9de0bf':'#e28a6e';g.fillRect(p.x-17*zoom,p.y-33*zoom,34*zoom*Math.max(0,o.health)/(o.maxHealth??640),4*zoom);}
  if(o.health===0)return;
  const side=Math.floor(time*3.4)%2?1:-1;
  for(const n of [-1,1]){
   const along=patrol?3:6;
   const lamp=this.screen(o.x+Math.cos(o.heading)*along-Math.sin(o.heading)*n*6,o.y+Math.sin(o.heading)*along+Math.cos(o.heading)*n*6,patrol?15:18);
   g.fillStyle=this.reduced||n===side?'#ff846b':'#a8534b';
   g.fillRect(lamp.x-2*zoom,lamp.y-zoom,4*zoom,2*zoom);
  }
 }
 drawJobDoor(g,service){
  if(service.open<.02)return;
  const c=Math.cos(service.heading),n=Math.sin(service.heading),angle=service.open*1.05;
  const a={x:service.door.x+c*5,y:service.door.y+n*5};
  const b={x:a.x-c*12*Math.cos(angle)-n*service.side*12*Math.sin(angle),y:a.y-n*12*Math.cos(angle)+c*service.side*12*Math.sin(angle)};
  const points=[this.screen(a.x,a.y,4),this.screen(b.x,b.y,4),this.screen(b.x,b.y,16),this.screen(a.x,a.y,16)];
  polygon(g,points.map(p=>[p.x,p.y]));g.fillStyle=vehicles[service.vehicle].color;g.fill();g.strokeStyle='#3c5950';g.lineWidth=this.zoom;g.stroke();
  const glass=[this.screen(a.x,a.y,10),this.screen(b.x,b.y,10),this.screen(b.x,b.y,15),this.screen(a.x,a.y,15)];
  polygon(g,glass.map(p=>[p.x,p.y]));g.fillStyle='#9fc2b5';g.fill();
 }
 drawJobPhase(g,service){
  const p=this.screen(service.x,service.y,43),text=service.phase,z=this.zoom;
  g.save();g.font=`bold ${9*z}px sans-serif`;g.textAlign='center';const w=g.measureText(text).width+12*z;
  g.fillStyle='#203f35';g.fillRect(p.x-w/2,p.y-10*z,w,15*z);g.fillStyle='#ffe1a0';g.fillText(text,p.x,p.y+z);
  g.fillStyle='#78b79c';g.fillRect(p.x-w/2,p.y+5*z,w*service.progress,2*z);g.restore();
 }
 drawRoadGuidance(g,s,target,upper=false){
  const route=this.roadGuidance.update(s,target);if(!route||Boolean(route.goal.railRoute)!==upper)return;
  const color=route.goal.railExit?'#ffe1a0':route.goal.serviceRoute?'#a6eddf':'#ffe1a0';
  g.save();g.lineCap='round';g.lineJoin='round';
  for(const arrow of route.arrows){
   const c=Math.cos(arrow.angle),n=Math.sin(arrow.angle);
   const points=[[-8,-7],[3,0],[-8,7]].map(([u,v])=>this.screen(arrow.x+c*u-n*v,arrow.y+n*u+c*v,(upper?(railSurface(arrow.x+c*u-n*v,arrow.y+n*u+c*v)?.height??0):0)+1.8));
   if(points.every(p=>p.x< -30||p.x>this.canvas.width+30||p.y< -30||p.y>this.canvas.height+30))continue;
   g.globalAlpha=Math.max(.42,.95-arrow.ahead/1450);
   g.beginPath();points.forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y));
   g.strokeStyle='#294b42';g.lineWidth=5*this.zoom;g.stroke();
   g.strokeStyle=color;g.lineWidth=2.5*this.zoom;g.stroke();
  }
  g.globalAlpha=1;
  if(route.goal.serviceRoute&&!upper){
   const p=this.screen(route.goal.x,route.goal.y,1.5);
   g.strokeStyle=color;g.lineWidth=2*this.zoom;g.beginPath();g.ellipse(p.x,p.y,19*this.zoom,10*this.zoom,0,0,Math.PI*2);g.stroke();
  }
  g.restore();
 }
 drawRailEntrance(entry,time,markers){
  const g=this.g,z=this.zoom,descending=this.descendingEntry===entry.id,center=this.screen(entry.x+110,entry.y,40);
  if(center.x< -350||center.x>this.canvas.width+350||center.y< -280||center.y>this.canvas.height+280)return;
  g.save();
  if(markers){
   const pulse=this.reduced?1:.8+.2*Math.sin(time*2.6),p=this.screen(entry.x,entry.y,2);
   g.fillStyle='rgba(166,237,223,.16)';g.beginPath();g.ellipse(p.x,p.y,53*z,31*z,0,0,Math.PI*2);g.fill();
   g.strokeStyle='#a6eddf';g.lineWidth=(2+2*pulse)*z;g.beginPath();g.ellipse(p.x,p.y,42*z,25*z,0,0,Math.PI*2);g.stroke();
   for(let i=0;i<9;i++){
    const along=-45+i*44,x=entry.x+Math.cos(entry.heading)*along,y=entry.y+Math.sin(entry.heading)*along,height=railSurface(x,y)?.height??0;
    const direction=entry.heading+(descending?Math.PI:0),c=Math.cos(direction),n=Math.sin(direction),points=[[-10,-9],[4,0],[-10,9]].map(([u,v])=>this.screen(x+c*u-n*v,y+n*u+c*v,height+3));
    g.globalAlpha=this.reduced?.95:.55+.4*Math.max(0,Math.cos(time*2.2+(descending?1:-1)*i*.65));g.beginPath();points.forEach((p,j)=>j?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y));g.lineCap='round';g.lineJoin='round';g.strokeStyle='#294b42';g.lineWidth=6*z;g.stroke();g.strokeStyle=descending?'#ffe1a0':'#b3f4df';g.lineWidth=3*z;g.stroke();
   }
  }else{
   const sx=entry.x-16,sy=entry.y-76,base=this.screen(sx,sy),board=this.screen(sx,sy,77);
   g.strokeStyle='#50685c';g.lineWidth=5*z;for(const side of [-1,1])line(g,[base.x+side*46*z,base.y],[board.x+side*46*z,board.y+19*z]);
   g.fillStyle='#203f35';g.fillRect(board.x-77*z,board.y-24*z,154*z,48*z);g.strokeStyle='#b3ebd9';g.lineWidth=2*z;g.strokeRect(board.x-77*z,board.y-24*z,154*z,48*z);
   g.textAlign='center';g.fillStyle='#fff0be';g.font=`bold ${14*z}px sans-serif`;g.fillText(entry.name,board.x,board.y-5*z);g.font=`${11*z}px sans-serif`;g.fillStyle='#b3ebd9';g.fillText(descending?'下り案内中':'上りスロープ',board.x-9*z,board.y+13*z);
   g.strokeStyle='#b3ebd9';g.lineWidth=2*z;line(g,[board.x+43*z,board.y+9*z],[board.x+59*z,board.y+9*z]);line(g,[board.x+53*z,board.y+3*z],[board.x+59*z,board.y+9*z]);line(g,[board.x+59*z,board.y+9*z],[board.x+53*z,board.y+15*z]);
   for(const side of [-1,1]){const bottom=this.screen(entry.x,entry.y+side*50),top=this.screen(entry.x,entry.y+side*50,31);g.strokeStyle='#526b5e';g.lineWidth=4*z;line(g,[bottom.x,bottom.y],[top.x,top.y]);g.fillStyle='#a6eddf';g.beginPath();g.arc(top.x,top.y,(this.reduced?5:5+Math.sin(time*2.6)*.7)*z,0,Math.PI*2);g.fill();g.fillStyle='#fff0be';g.beginPath();g.arc(top.x,top.y,2*z,0,Math.PI*2);g.fill();}
  }
  g.restore();
 }
 drawPlayer(s,playerOpacity){
  if(s.vehicle===10){drawRobot(this,s,playerOpacity);return;}
  const g=this.g,player=this.screen(s.x,s.y,s.z+(s.deck??0)),p=this.screen(s.x,s.y,s.deck??0);
    const angle=((s.heading-Math.PI/2+YAW)%(Math.PI*2)+Math.PI*2)%(Math.PI*2),i=Math.round(angle/(Math.PI*2)*96)%96;
    g.fillStyle=`rgba(20,43,35,${(Math.max(.10,.30-s.z*.002)*playerOpacity)})`;g.beginPath();g.ellipse(p.x+s.z*.25*this.zoom,p.y+s.z*.15*this.zoom,(vehicles[s.vehicle].r+4)*this.zoom,8*this.zoom,angle,0,Math.PI*2);g.fill();
    const grade=s.z>0?0:roadGrade(s.x,s.y,s.heading)*Math.cos(s.heading+YAW);
    g.save();g.translate(player.x,player.y);g.rotate(-Math.max(-.21,Math.min(.21,grade)));
    drawSprite(g,this.cars[s.vehicle][i],0,0,this.zoom,playerOpacity);g.restore();
    drawWeaponMount(this,s);
    if(s.boost>0){const tail=this.screen(s.x-Math.cos(s.heading)*21,s.y-Math.sin(s.heading)*21,s.z+(s.deck??0)+3);g.strokeStyle='#ecd293';g.lineWidth=2;for(const n of [-1,1])line(g,[tail.x+n*4,tail.y],[tail.x-Math.cos(s.heading+YAW)*14+n*4,tail.y-Math.sin(s.heading+YAW)*7]);}
 }
 drawTrialGate(gate,servicing=false){
  const g=this.g,p=this.screen(gate.x,gate.y),z=this.zoom;
  g.strokeStyle='#354b47';g.lineWidth=5*z;g.beginPath();g.ellipse(p.x,p.y,26*z,13*z,0,0,Math.PI*2);g.stroke();
  g.strokeStyle='#f4d698';g.lineWidth=2*z;g.stroke();
  if(servicing||p.x<0||p.x>this.canvas.width||p.y<0||p.y>this.canvas.height)return;
  const y=p.y-28*z;
  g.fillStyle='#284b40';g.fillRect(p.x-9*z,y-6*z,18*z,12*z);
  for(let row=0;row<2;row++)for(let col=0;col<3;col++)if((row+col)%2===0){
   g.fillStyle='#f4d698';g.fillRect(p.x+(col*6-9)*z,y+(row*6-6)*z,6*z,6*z);
  }
 }
 minimap(canvas,s,target,focus=null){
  const g=canvas.getContext('2d'),W=canvas.width,H=canvas.height,large=canvas.id==='large-map';
  const pixelRatio=W/(canvas.clientWidth||W),worldWidth=SIZE.w-WEST_EDGE;
  const {scale,ox,oy,at}=mapView(W,H,s,{large,focus});
  g.fillStyle='#233c33';g.fillRect(0,0,W,H);if(large){g.fillStyle='rgba(142,203,146,.13)';for(const cell of s.hero.robot?.cells??[]){const [x,y]=cell.split(',').map(Number),p=at(WEST_EDGE+x*600,y*600);g.fillRect(p[0],p[1],600*scale,600*scale);}}
  g.save();g.translate(ox,oy);g.scale(scale,scale);
  g.fillStyle='#3b5947';g.fillRect(WEST_EDGE+100,120,worldWidth-200,SIZE.h-240);
  g.fillStyle='#455e46';g.fillRect(WEST_EDGE+100,NORTH_LIMIT,worldWidth-200,SIZE.h-NORTH_LIMIT-120);
  this.landscape.paintMap(g);
  for(const p of parkAreas){g.fillStyle=p.id==='west'?'#668963':'#50774f';polygon(g,p.points);g.fill();}
  g.fillStyle='#579b94';for(const water of [pondPolygon,southernWater]){polygon(g,water);g.fill();}
  if(!large||focus){
   const center=focus??s,halfX=W/scale/2+130,halfY=H/scale/2+130;
   for(const b of world.buildings){
    if(!cityObjectActive(s,b)||Math.abs(b.x-center.x)>halfX||Math.abs(b.y-center.y)>halfY||b.kind==='station')continue;
    g.save();g.translate(b.x,b.y);g.rotate(b.angle??0);
    g.fillStyle=isDestroyed(s,b.id)?'#465c48':b.landmark?'#c7a676':districtStyles[b.district??'station'].wall;
    g.fillRect(-b.w/2,-b.d/2,b.w,b.d);
    g.strokeStyle='#314c41';g.lineWidth=1/scale;g.strokeRect(-b.w/2,-b.d/2,b.w,b.d);g.restore();
   }
   g.fillStyle='#436c4a';
   for(let i=0;i<world.trees.length;i+=3){const t=world.trees[i];if(Math.abs(t.x-center.x)>halfX||Math.abs(t.y-center.y)>halfY||isDestroyed(s,t.id))continue;g.beginPath();g.arc(t.x,t.y,t.size*.55,0,Math.PI*2);g.fill();}
  }
  const cx=focus?.x??s.x,cy=focus?.y??s.y,halfW=large&&!focus?(SIZE.w-WEST_EDGE)/2:W/scale/2+320,halfH=large&&!focus?SIZE.h/2:H/scale/2+320;
  const minX=large&&!focus?WEST_EDGE:cx-halfW,maxX=large&&!focus?SIZE.w:cx+halfW,minY=large&&!focus?0:cy-halfH,maxY=large&&!focus?SIZE.h:cy+halfH;
  g.globalAlpha=.32;
  for(let x=Math.floor(minX/320)*320;x<maxX;x+=320)for(let y=Math.floor(minY/320)*320;y<maxY;y+=320){const h=groundHeight(x+160,y+160);if(h<8)continue;g.fillStyle=h>90?'#cbac76':h>55?'#b0a579':h>25?'#879b70':'#648264';g.fillRect(x,y,320,320);}
  g.globalAlpha=.5;g.strokeStyle='#d1c69c';g.lineWidth=1/scale;
  for(let x=Math.floor(minX/160)*160;x<maxX;x+=160)for(let y=Math.floor(minY/160)*160;y<maxY;y+=160){
   const corners=[[x,y],[x+160,y],[x+160,y+160],[x,y+160]],heights=corners.map(p=>groundHeight(...p));
   for(let level=20;level<=120;level+=20){const hits=[];for(let i=0;i<4;i++){const j=(i+1)%4,a=heights[i],b=heights[j];if((a<level)===(b<level))continue;const t=(level-a)/(b-a);hits.push(corners[i].map((v,k)=>v+(corners[j][k]-v)*t));}for(let i=0;i+1<hits.length;i+=2)line(g,hits[i],hits[i+1]);}
  }
  g.globalAlpha=1;
  g.lineCap='round';
  for(const r of roads){
   g.strokeStyle=r.theme==='west'?(r.alley?'#b9a982':'#d3c095'):r.theme==='east'?(r.alley?'#a0ada9':'#b6d0cc'):
    r.theme==='south-market'?'#d4b98f':r.theme==='south-water'?'#a2c2ab':r.theme==='south-hill'?'#cdc6a0':r.park?'#a9b98d':'#a7af94';
   g.lineWidth=large?r.w*.68:Math.max(r.w*.78,(r.lanes===4?2.4:1.6)*pixelRatio/scale);line(g,r.a,r.b);
  }
  for(const r of railSegments){
   if(Math.max(r.a[2],r.b[2])<=5){g.strokeStyle='#d0ac81';g.lineWidth=Math.max(15,1.5*pixelRatio/scale);line(g,r.a,r.b);continue;}
   const width=Math.max(48,5*pixelRatio/scale);g.strokeStyle='#153e50';g.lineWidth=width+2*pixelRatio/scale;line(g,r.a,r.b);g.strokeStyle='#74d5f1';g.lineWidth=width;line(g,r.a,r.b);g.strokeStyle='#274e63';g.lineWidth=width*.42;line(g,r.a,r.b);
  }
  g.fillStyle='#e4d6ac';for(const st of stations)g.fillRect(st.x-st.w/2,st.y-45,st.w,90);
  g.restore();
  const gate=(s.serviceGuide?null:jobTarget(s))??parkGates[s.trial?.gate]??(s.pursuit?pursuitGoal:null);
  const guided=guidanceTarget(s,target)?this.roadGuidance.update(s,target):null;
  const targetSpot=guided?.goal??gate??(s.pursuit?null:destinations.find(p=>p.id===target));if(targetSpot){const key=targetSpot.id+'-'+Math.round(s.x/100)+','+Math.round(s.y/100)+':'+(guided?this.roadGuidance.builds:0);if(this.pathCache?.key!==key)this.pathCache={key,points:guided?.points??navigationPath(s.x,s.y,targetSpot.x,targetSpot.y)};g.strokeStyle=guided?.goal.railExit?'#ffe1a0':guided?.goal.serviceRoute?'#a6eddf':'#efd18e';g.lineWidth=2*pixelRatio;g.setLineDash([5*pixelRatio,4*pixelRatio]);g.beginPath();this.pathCache.points.forEach((p,i)=>(i?g.lineTo(...at(...p)):g.moveTo(...at(...p))));g.stroke();g.setLineDash([]);}
  if(large){g.fillStyle='#b7c6a2';g.font=`${12*pixelRatio}px "Yu Gothic UI", sans-serif`;g.textAlign='center';for(const [label,x,y] of [['西の街',-1700,2870],['東の街',4970,2870],['風待ち公園',1730,2800],...southNames]){const p=at(x,y);g.fillText(label,p[0],p[1]);}}
  for(const bay of machineGarages){const p=at(bay.x,bay.y);if(!large&&Math.hypot(bay.x-s.x,bay.y-s.y)<200)p[0]+=16*pixelRatio;g.fillStyle='#f2cd77';g.fillRect(p[0]-7*pixelRatio,p[1]-7*pixelRatio,14*pixelRatio,14*pixelRatio);g.fillStyle='#233e43';g.font=`bold ${11*pixelRatio}px sans-serif`;g.textAlign='center';g.fillText('G',p[0],p[1]+4*pixelRatio);if(large){g.fillStyle='#f4dfae';g.fillText(bay.name,p[0],p[1]-12*pixelRatio);}}
  for(const [index,spot] of destinations.entries()){if(spot.railEntry||spot.railExit||spot.garage)continue;const p=at(spot.x,spot.y);if(!large&&(p[0]<0||p[0]>W||p[1]<0||p[1]>H))continue;const selected=spot.id===target;g.fillStyle=selected?(spot.service||spot.id==='garage'?'#a6eddf':'#edcb83'):spot.service?'#ade0c8':s.collected.has(spot.id)?'#8aa776':'#d3c69c';g.beginPath();g.arc(p[0],p[1],(large?7:spot.service?4:2.5)*pixelRatio,0,Math.PI*2);g.fill();if(!large&&spot.service){g.strokeStyle='#28483e';g.lineWidth=pixelRatio;line(g,[p[0]-2.5*pixelRatio,p[1]],[p[0]+2.5*pixelRatio,p[1]]);line(g,[p[0],p[1]-2.5*pixelRatio],[p[0],p[1]+2.5*pixelRatio]);}if(large){g.font=`bold ${10*pixelRatio}px "Yu Gothic UI", sans-serif`;g.textAlign='center';g.textBaseline='middle';g.fillStyle='#233c33';g.fillText(String(index+1),p[0],p[1]+.5*pixelRatio);g.textBaseline='alphabetic';}}
  if(gate){
   const [x,y]=at(gate.x,gate.y),r=5*pixelRatio;
   g.fillStyle='#f4d698';polygon(g,[[x,y-r],[x+r,y],[x,y+r],[x-r,y]]);g.fill();if(s.pursuit&&large){g.font=`bold ${14*pixelRatio}px sans-serif`;g.textAlign='center';g.fillText('ゴール',x,y-12*pixelRatio);}
  }
  if(!large){
   const labels=[];
   const label=(text,x,y,active=false)=>{
    const [px,py]=at(x,y);g.font=`${active?'bold ':''}${11*pixelRatio}px "Yu Gothic UI", sans-serif`;
    const width=g.measureText(text).width+6*pixelRatio,height=15*pixelRatio;
    const box={x:px-width/2,y:py-18*pixelRatio,w:width,h:height};
    if(box.x<4||box.y<4||box.x+box.w>W-4||box.y+box.h>H-4||Math.hypot(px-W/2,py-H/2)<20*pixelRatio||labels.some(b=>box.x<b.x+b.w+3&&box.x+box.w>b.x-3&&box.y<b.y+b.h+3&&box.y+box.h>b.y-3))return;
    labels.push(box);g.fillStyle='#203f35';g.fillRect(box.x,box.y,box.w,box.h);
    g.fillStyle=active?'#f5d998':'#d7ddc2';g.textAlign='center';g.fillText(text,px,box.y+11*pixelRatio);
   };
   if(targetSpot)label(targetSpot.name,targetSpot.x,targetSpot.y,true);
   for(const [i,st] of stations.entries())label(i?'花帆駅':'木漏れ日駅',st.x,st.y);
   for(const spot of destinations)if(spot.service)label('整備所',spot.x,spot.y);
   const named=new Set();
   for(const road of roads){if(!road.name||road.park||named.has(road.name))continue;const x=(road.a[0]+road.b[0])/2,y=(road.a[1]+road.b[1])/2;if(Math.hypot(x-s.x,y-s.y)>1300)continue;label(road.name,x,y);named.add(road.name);}
   for(const car of s.traffic??[]){if(car.health===0)continue;const [x,y]=at(car.x,car.y);if(x<2||x>W-2||y<2||y>H-2)continue;g.fillStyle='#d4e2d6';g.fillRect(x-pixelRatio,y-pixelRatio,2*pixelRatio,2*pixelRatio);}
   if(targetSpot){const [x,y]=at(targetSpot.x,targetSpot.y);if(x<6||x>W-6||y<6||y>H-6){const px=Math.max(8*pixelRatio,Math.min(W-8*pixelRatio,x)),py=Math.max(8*pixelRatio,Math.min(H-8*pixelRatio,y));g.save();g.translate(px,py);g.rotate(Math.atan2(y-H/2,x-W/2));g.fillStyle='#f5d998';polygon(g,[[5*pixelRatio,0],[-4*pixelRatio,-4*pixelRatio],[-4*pixelRatio,4*pixelRatio]]);g.fill();g.restore();if(s.pursuit){g.font=`bold ${10*pixelRatio}px sans-serif`;g.textAlign=px>W/2?'right':'left';g.fillText('ゴール',px+(px>W/2?-9:9)*pixelRatio,Math.max(14*pixelRatio,Math.min(H-8*pixelRatio,py)));}}}
   g.textAlign='start';
  }
  for(const patrol of s.pursuit?.cars??[]){
   if(patrol.health<=0)continue;
   const [x,y]=at(patrol.x,patrol.y),size=4*pixelRatio;
   g.fillStyle='#f48a70';g.fillRect(x-size/2,y-size/2,size,size);
  }
  if(large)for(const pad of surfaces){
   const [x,y]=at(pad.x,pad.y);
   g.save();g.translate(x,y);g.scale(pixelRatio,pixelRatio);g.lineWidth=1.7;
   g.beginPath();
   if(pad.type==='boost'){
    g.strokeStyle='#9fd3ba';g.moveTo(-3,-3);g.lineTo(2,0);g.lineTo(-3,3);g.stroke();
   }else{
    g.fillStyle='#e0b98c';g.moveTo(-3.5,2.5);g.lineTo(0,-3.5);g.lineTo(3.5,2.5);g.fill();
   }
   g.restore();
  }
  for(const entry of railAccessPoints){const q=at(entry.x,entry.y);if(!large&&(q[0]<0||q[0]>W||q[1]<0||q[1]>H))continue;g.fillStyle=entry.railExit?'#ffe1a0':'#b3ebd9';g.beginPath();if(entry.railExit){const r=(entry.id===target?9:7)*pixelRatio;g.moveTo(q[0]-r,q[1]-r*.6);g.lineTo(q[0]+r,q[1]-r*.6);g.lineTo(q[0],q[1]+r);g.closePath();}else g.arc(q[0],q[1],(entry.id===target?8:6)*pixelRatio,0,Math.PI*2);g.fill();if(entry.id===target){g.strokeStyle='#fff0be';g.lineWidth=2*pixelRatio;g.stroke();}if(large){g.font=`bold ${11*pixelRatio}px sans-serif`;g.textAlign='center';g.fillText(entry.name,q[0],q[1]+(entry.railExit?22:-10)*pixelRatio);}}
  if(s.hero.monster){const m=s.hero.monster,q=at(m.x,m.y),r=8*pixelRatio;g.fillStyle='#ed9779';g.strokeStyle='#fff0c4';g.lineWidth=2*pixelRatio;g.beginPath();g.moveTo(q[0],q[1]-r);g.lineTo(q[0]+r,q[1]);g.lineTo(q[0],q[1]+r);g.lineTo(q[0]-r,q[1]);g.closePath();g.fill();g.stroke();if(large){g.fillStyle='#ffe0a8';g.font=`bold ${12*pixelRatio}px sans-serif`;g.textAlign='center';g.fillText('怪獣',q[0],q[1]-12*pixelRatio);}}
  const falling=s.hero.monster?.projectiles??[],forecast=s.hero.monster?.attack?.targets??[];
  for(const strike of [...forecast,...falling]){const q=at(strike.targetX??strike.x,strike.targetY??strike.y);if(q[0]<0||q[0]>W||q[1]<0||q[1]>H)continue;g.strokeStyle='#f0c4ff';g.fillStyle='#b36cbb88';g.lineWidth=2*pixelRatio;g.beginPath();g.arc(q[0],q[1],7*pixelRatio,0,Math.PI*2);g.fill();g.stroke();if(large){g.fillStyle='#f5d6ff';g.font=`bold ${10*pixelRatio}px sans-serif`;g.textAlign='center';g.fillText('メテオ',q[0],q[1]-10*pixelRatio);}}
  const here=at(s.x,s.y);g.fillStyle='#183e38';g.strokeStyle='#fff5ce';g.lineWidth=2.5*pixelRatio;g.beginPath();g.arc(here[0],here[1],11*pixelRatio,0,Math.PI*2);g.fill();g.stroke();g.font=`bold ${12*pixelRatio}px sans-serif`;g.textAlign='center';g.lineWidth=4*pixelRatio;g.strokeStyle='#183e38';g.strokeText(s.surface==='rail'&&s.deck>4?'現在地 / 高架':'現在地',here[0],here[1]+25*pixelRatio);g.fillStyle='#fff5ce';g.fillText(s.surface==='rail'&&s.deck>4?'現在地 / 高架':'現在地',here[0],here[1]+25*pixelRatio);g.textAlign='start';
  const p=at(s.x,s.y);g.save();g.translate(...p);g.rotate(s.heading);g.fillStyle='#fff0be';g.strokeStyle='#263f32';g.lineWidth=pixelRatio;g.beginPath();g.moveTo(7*pixelRatio,0);g.lineTo(-5*pixelRatio,-4*pixelRatio);g.lineTo(-3*pixelRatio,0);g.lineTo(-5*pixelRatio,4*pixelRatio);g.closePath();g.fill();g.stroke();g.restore();
 }
 vehicleIcon(index){const c=make(110,74),g=c.getContext('2d');g.imageSmoothingEnabled=false;drawSprite(g,this.cars[index][86],57,57,index===10?1:index===2?1.3:1.65);return c.toDataURL();}
}
