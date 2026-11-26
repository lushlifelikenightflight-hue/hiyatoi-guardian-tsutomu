import {makeCanvas} from './canvas-factory.js?v=5.4.0';
import {C,S,PITCH,project,treeStack,bakeStack,drawSprite} from './art.js?v=5.4.0';
import {DRIVE_BOUNDS} from './world.js?v=5.4.0';
import {hillHeight,outskirtsHash,smooth,terrainProfile,visibleClouds} from './outskirts.js?v=5.4.0';

const mix=(a,b,t)=>a+(b-a)*t;
const point=(x,y)=>[C*x+S*y/PITCH,-S*x+C*y/PITCH];
export function groundCorners(x,y,size){
 return [point(x,y),point(x+size,y),point(x,y+size),point(x+size,y+size)];
}
const field=[133,151,111],gravel=[163,161,139],dune=[181,179,120],sand=[216,189,142],wet=[193,175,136],
 shallow=[104,165,155],reef=[71,137,141],sea=[55,111,128],deep=[50,94,115],foothill=[101,129,96],ridge=[82,111,103];

function shade(p,ripple,noise,ch){
 const land=mix(field[ch],foothill[ch],smooth(12,330,p.hill));
 const upland=mix(land,ridge[ch],smooth(360,1200,p.hill));
 let coast;
 if(p.shore<0){
  coast=mix(dune[ch],sand[ch],smooth(-178,-92,p.shore));
  coast=mix(coast,wet[ch],smooth(-29,-2,p.shore));
  coast=mix(field[ch],coast,smooth(-90,53,p.sea));
  coast=mix(coast,gravel[ch],p.port*smooth(-58,-20,p.shore));
 }else{
  coast=mix(shallow[ch],reef[ch],smooth(7,143,p.shore));
  coast=mix(coast,sea[ch],smooth(105,530,p.shore));
  coast=mix(coast,deep[ch],smooth(650,1670,p.shore));
 }
 return mix(upland,coast,p.shoreBlend)+noise+ripple*p.shoreBlend;
}

function terrainColor(x,y,p){
 const cell=outskirtsHash(Math.floor(x/7),Math.floor(y/7));
 const blotch=outskirtsHash(Math.floor(x/34),Math.floor(y/29));
 const noise=(cell-.5)*8+(blotch-.5)*5;
 const swell=p.shore+8*Math.sin(p.along/81)+4*Math.sin(p.along/38);
 const foam=p.shore>1&&p.shore<26&&Math.sin(swell*.44)>.58?20*(1-p.shore/29):0;
 const ripple=p.shore>14&&Math.sin(swell*.115)> .79?(2+cell*9)*Math.max(.25,1-p.shore/465):0;
 return {noise,ripple:foam+ripple};
}

function polygon(g,points,fill){
 g.fillStyle=fill;g.beginPath();
 for(let i=0;i<points.length;i++){const {x,y}=points[i];if(i)g.lineTo(x,y);else g.moveTo(x,y);}
 g.closePath();g.fill();
}

const paleRock='#a6ab9a',stone='#89968d',darkRock='#617b78',lightRock='#bcbeaa';
function concreteBlock(g,at,angle,scale){
 const pieces=[];
 for(let i=0;i<3;i++){
  const a=angle+i*Math.PI*2/3,c=Math.cos(a)*scale,s=Math.sin(a)*scale;
  const points=[[0,5,10],[18,4,4],[20,-3,3],[9,-7,13],[15,3,0],[17,-4,0]]
   .map(([x,y,z])=>at(x*c-y*s,x*s+y*c,z*scale));
  pieces.push({i,points,depth:points[1].y});
 }
 for(const {points:p,i} of pieces.sort((a,b)=>a.depth-b.depth)){
  polygon(g,[p[0],p[1],p[4],p[5],p[2]],i===0?stone:darkRock);
  polygon(g,[p[0],p[3],p[2],p[1]],i===1?paleRock:lightRock);
 }
 polygon(g,[at(-5*scale,0,8*scale),at(-4*scale,3*scale,22*scale),at(3*scale,4*scale,24*scale),
  at(7*scale,0,19*scale),at(4*scale,-1,8*scale)],stone);
 polygon(g,[at(-4*scale,3*scale,22*scale),at(-2*scale,-4*scale,22*scale),at(4*scale,-4*scale,23*scale),
  at(3*scale,4*scale,24*scale)],lightRock);
}

export class LandscapeRenderer{
 constructor(bounds=DRIVE_BOUNDS){
  this.bounds=bounds;
  this.trees=new Map();
  this.clouds=new Map();
  this.mask=makeCanvas();
  this.mask.width=this.mask.height=192;
  this.maskContext=this.mask.getContext('2d');
 }
 paintTerrain(g,tx,ty,size,corners){
  const {bounds}=this;
  const [minX,maxX,minY,maxY]=[Math.min(...corners.map(p=>p[0])),Math.max(...corners.map(p=>p[0])),
   Math.min(...corners.map(p=>p[1])),Math.max(...corners.map(p=>p[1]))];
  if(minX>bounds.west+82&&maxX<bounds.east-82&&minY>bounds.north+82&&maxY<bounds.south-82)return;
  const w=this.mask.width,scale=size/w,image=this.maskContext.createImageData(w,w),data=image.data,p={};
  for(let iy=0;iy<w;iy++)for(let ix=0;ix<w;ix++){
   const [x,y]=point(tx+(ix+.5)*scale,ty+(iy+.5)*scale);
   terrainProfile(bounds,x,y,p);
   if(p.distance<-80)continue;
   const {noise,ripple}=terrainColor(x,y,p),i=(iy*w+ix)*4;
   for(let ch=0;ch<3;ch++)data[i+ch]=shade(p,ripple,noise,ch);
   data[i+3]=255*smooth(-80,28,p.distance);
  }
  this.maskContext.putImageData(image,0,0);
  g.save();g.setTransform(1,0,0,1,0,0);g.imageSmoothingEnabled=false;
  g.drawImage(this.mask,0,0,size,size);
  const at=(x,y,z=0)=>{const p=project(x,y,z);return {x:p.x-tx,y:p.y-ty};};
  this.hills(g,at,minX,maxX,minY,maxY,size);
  this.edgeDetails(g,at,minX,maxX,minY,maxY,size);
  g.restore();
 }
 hills(g,at,minX,maxX,minY,maxY,size){
  const {bounds}=this;
  if(minX>bounds.west&&minY>bounds.north)return;
  const step=102,faces=[],points=new Map();
  const vertex=(i,j)=>{
   const key=i+','+j;
   if(!points.has(key)){
    const x=i*step+(outskirtsHash(i,j)-.5)*53,y=j*step+(outskirtsHash(j,i+2)-.5)*53;
    const z=hillHeight(bounds,x,y);
    points.set(key,{x,y,z,p:at(x,y,z)});
   }
   return points.get(key);
  };
  for(let i=Math.floor((minX-510)/step);i<Math.ceil((maxX+220)/step);i++)
   for(let j=Math.floor((minY-190)/step);j<Math.ceil((maxY+760)/step);j++){
    const a=vertex(i,j),b=vertex(i+1,j),c=vertex(i+1,j+1),d=vertex(i,j+1);
    for(const face of [[a,b,c],[a,c,d]]){
     const z=face.reduce((n,v)=>n+v.z,0)/3;
     if(z<1||face.every(v=>v.p.x<0)||face.every(v=>v.p.x>size)||
      face.every(v=>v.p.y<0)||face.every(v=>v.p.y>size))continue;
     const depth=face.reduce((n,v)=>n+v.p.y+v.z,0)/3;
     const lit=(face[2].z-face[0].z)*.23+(face[1].z-face[0].z)*.12;
     const peak=smooth(90,430,z);
     const values=[101+peak*28+lit,130-peak*8+lit*.84,99+peak*20+lit*.73];
     faces.push({pts:face.map(v=>v.p),depth,z,color:'rgb('+values.map(v=>Math.round(v)).join(',')+')'});
    }
   }
  for(const f of faces.sort((a,b)=>a.depth-b.depth)){
   g.globalAlpha=smooth(0,65,f.z);
   polygon(g,f.pts,f.color);
  }
  g.globalAlpha=1;
 }
 edgeDetails(g,at,minX,maxX,minY,maxY,size){
  const {bounds}=this,details=[],spacing=48;
  for(let i=Math.floor((minX-90)/spacing);i<=Math.ceil((maxX+75)/spacing);i++)
   for(let j=Math.floor((minY-75)/spacing);j<=Math.ceil((maxY+325)/spacing);j++){
    const seed=outskirtsHash(i,j);
    const x=i*spacing+outskirtsHash(i,j+1)*39,y=j*spacing+outskirtsHash(i+1,j)*39;
    const p=terrainProfile(bounds,x,y);
    const rock=p.port>.72&&Math.abs(p.shore-9)<30&&p.shoreBlend>.75;
    const tree=p.hill>18&&p.hill<590&&p.shoreBlend<.37&&seed>.39&&
     (Math.sin(x/180)+Math.cos(y/111)>.8||seed>.78);
    const scrub=p.shoreBlend>.7&&p.sea>23&&p.shore<-72&&seed>.60;
    if(!rock&&!tree&&!scrub)continue;
    const z=tree?hillHeight(bounds,x,y):0,q=at(x,y,z);
    if(q.x<-67||q.x>size+67||q.y<-35||q.y>size+97)continue;
    details.push({x,y,z,q,seed,rock,tree,depth:q.y+z});
   }
  for(const {x,y,q,seed,rock,tree} of details.sort((a,b)=>a.depth-b.depth)){
   if(rock){
    g.fillStyle='rgba(26,73,75,.25)';g.beginPath();g.ellipse(q.x,q.y+2,20,8,.13,0,Math.PI*2);g.fill();
    concreteBlock(g,(dx,dy,z)=>at(x+dx,y+dy,z),seed*6.28,.62+seed*.47);
   }else if(tree){
    const type=seed>.96?2:1,variant=(Math.floor(seed*11)%3)+type*3;
    if(!this.trees.has(variant)){
     const stack=treeStack({size:23+variant%3*7,type,seed:variant*17+42});
     this.trees.set(variant,bakeStack(stack));
    }
    g.fillStyle='rgba(26,63,49,.19)';g.beginPath();g.ellipse(q.x+9,q.y+3,14,6,.16,0,Math.PI*2);g.fill();
    drawSprite(g,this.trees.get(variant),q.x,q.y,.76+seed*.48);
   }else{
    g.strokeStyle=seed>.8?'#a9a768':'#8f9a63';g.lineWidth=2;
    g.beginPath();
    for(const side of [-1,0,1]){g.moveTo(q.x,q.y);g.lineTo(q.x+side*6,q.y-10+Math.abs(side)*3);}
    g.stroke();
   }
  }
 }
 paintMap(g){
  if(!this.map){
   const {bounds}=this,pad=3300,unit=26,x=bounds.west-pad,y=bounds.north-pad;
   const img=makeCanvas();
   img.width=Math.ceil((bounds.east+pad-x)/unit);img.height=Math.ceil((bounds.south+pad-y)/unit);
   const cg=img.getContext('2d'),paint=cg.createImageData(img.width,img.height),p={};
   for(let j=0;j<img.height;j++)for(let i=0;i<img.width;i++){
    const wx=x+(i+.5)*unit,wy=y+(j+.5)*unit;
    terrainProfile(bounds,wx,wy,p);
    if(p.distance<-48)continue;
    const h=hillHeight(bounds,wx,wy),offset=(j*img.width+i)*4;
    const relief=(Math.round(h/28)*28-h)*.24;
    for(let c=0;c<3;c++)paint.data[offset+c]=shade(p,0,relief,c)*.68;
    paint.data[offset+3]=255*smooth(-48,60,p.distance);
   }
   cg.putImageData(paint,0,0);this.map={img,x,y,unit};
  }
  const {img,x,y,unit}=this.map;
  g.save();g.imageSmoothingEnabled=true;g.drawImage(img,x,y,img.width*unit,img.height*unit);g.restore();
 }
 cloudSprite(variant){
  if(this.clouds.has(variant))return this.clouds.get(variant);
  const image=makeCanvas();image.width=104;image.height=48;
  const g=image.getContext('2d'),lobes=[];
  for(let i=0;i<9;i++){
   const t=outskirtsHash(i,variant+7);
   lobes.push({x:19+i*8.4,y:26+Math.sin(i*.9+variant)*3.7,r:7+t*8,top:5+t*10});
  }
  for(let y=0;y<48;y++)for(let x=0;x<104;x++){
   let form=-1,light=0;
   for(const b of lobes){
    const value=1-((x-b.x)/b.r)**2-((y-b.y)/b.top)**2;
    if(value>form){form=value;light=(b.y-y)/b.top+(b.x-x)/b.r*.18;}
   }
   if(form<=0)continue;
   g.fillStyle=light<-.42?'#c3d1cc':light<.06?'#e0e7df':light>.46?'#fff8e1':'#f5efdb';
   g.globalAlpha=Math.min(1,.68+form*.42);g.fillRect(x,y,1,1);
  }
  this.clouds.set(variant,image);
  return image;
 }
 cloudsInView(camera,width,height,zoom,time,reduced){
  return visibleClouds(this.bounds,camera.x,camera.y,Math.max(width,height)/zoom*1.45+380,time,reduced);
 }
 drawClouds(g,clouds,screen,zoom,player,shadow=false){
  const W=g.canvas.width,H=g.canvas.height;
  g.save();
  for(const c of clouds){
   const z=shadow?0:c.z,p=screen(c.x+(shadow?83:0),c.y+(shadow?45:0),z);
   const w=238*c.scale*zoom,h=108*c.scale*zoom;
   if(p.x<-w/2||p.x>W+w/2||p.y<-h/2||p.y>H+h/2)continue;
   const opacity=smooth(w*.17,w*.58,Math.hypot(p.x-player.x,(p.y-player.y)*1.5));
   const image=this.cloudSprite(c.variant);
   if(shadow){
    g.globalAlpha=.15;g.filter='brightness(0)';g.drawImage(image,Math.round(p.x-w*.5),Math.round(p.y-h*.19),w,h*.49);g.filter='none';
   }else{
    g.globalAlpha=.28+opacity*.44;g.drawImage(image,Math.round(p.x-w*.5),Math.round(p.y-h*.50),w,h);
   }
  }
  g.restore();
 }
}
