import {makeCanvas} from './canvas-factory.js?v=5.6.1';
import {C,S,PITCH,project} from './art.js?v=5.6.1';
import {elevations,groundHeight} from './elevation.js?v=5.6.1';

export function warpGroundTile(tx,ty,size,flatTile){
 const regions=elevations.filter(r=>{
  const p=project(r.x,r.y),w=Math.abs(C*r.rx)+Math.abs(S*r.ry);
  const h=PITCH*(Math.abs(S*r.rx)+Math.abs(C*r.ry));
  return tx+size>p.x-w&&tx<p.x+w&&ty+size>p.y-h-r.h&&ty<p.y+h;
 });
 const base=flatTile(tx,ty);
 if(!regions.length)return base;
 const canvas=makeCanvas();canvas.width=canvas.height=size;
 const g=canvas.getContext('2d'),img=g.createImageData(size,size),out=new Uint32Array(img.data.buffer);
 const layers=new Map();
 const source=y=>{
  if(!layers.has(y)){
   const src=flatTile(tx,y).getContext('2d').getImageData(0,0,size,size);
   layers.set(y,new Uint32Array(src.data.buffer));
  }
  return layers.get(y);
 };
 const stride=4;
 const heights=(x,y)=>{
  let flat=y;
  for(let pass=0;pass<8;pass++){
   const z=groundHeight(C*x+S*flat/PITCH,-S*x+C*flat/PITCH,regions);
   const next=y+z;
   if(Math.abs(next-flat)<.1)return next-y;
   flat=next;
  }
  return flat-y;
 };
 let row=Array.from({length:size/stride+1},(_,i)=>heights(tx+i*stride,ty));
 for(let y=0;y<size;y+=stride){
  const next=Array.from({length:row.length},(_,i)=>heights(tx+i*stride,ty+y+stride));
  for(let j=0;j<stride;j++)for(let x=0;x<size;x++){
   const i=Math.floor(x/stride),u=(x%stride)/stride,t=j/stride;
   const dz=(row[i]*(1-u)+row[i+1]*u)*(1-t)+(next[i]*(1-u)+next[i+1]*u)*t;
   const from=Math.round(y+j+dz),tile=ty+Math.floor(from/size)*size;
   out[(y+j)*size+x]=source(tile)[(from%size)*size+x];
  }
  row=next;
 }
 g.putImageData(img,0,0);return canvas;
}
