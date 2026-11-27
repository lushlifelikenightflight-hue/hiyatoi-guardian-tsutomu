import {makeCanvas} from './canvas-factory.js?v=5.6.1';
const canvas=(w,d)=>{const im=makeCanvas();im.width=w;im.height=d;return im;};
const tint=(hex,n)=>'#'+hex.slice(1).match(/../g).map(v=>Math.max(0,Math.min(255,Math.round(parseInt(v,16)*n))).toString(16).padStart(2,'0')).join('');
export function heroVehicleStack(kind){
 const sport=kind==='sport',taxi=kind==='taxi',fire=kind==='firetruck',armor=kind==='guardian',w=fire?34:armor?34:28,d=fire?62:52,h=sport?22:fire?27:armor?24:24,layers=[];
 const shell=sport?'#df654b':taxi?'#f4c455':fire?'#bf493e':armor?'#64858c':'#e2e1ce';
 for(let z=0;z<h;z++){
  const im=canvas(w,d),g=im.getContext('2d'),box=(x,y,w,d,c)=>{g.fillStyle=c;g.fillRect(x,y,w,d);};
  if(z<7)for(const x of [1,w-6])for(const y of fire?[8,37,48]:[7,36]){box(x,y,5,8,'#233c40');if(z>1&&z<5)box(x,y+2,5,4,'#afc3be');}
  const paint=tint(shell,.70+z*.025);
  if(z>=4&&z<=11){const inset=sport?(z>8?3:2):3;box(inset,3,w-2*inset,sport?34:d-7,paint);box(2,10,w-4,sport?23:d-22,paint);
   if(sport&&z<=9){box(3,30,w-6,18,paint);box(5,46,w-10,4,tint(paint,1.06));}
   box(inset,4,1,sport?32:d-10,tint(paint,.7));
   if(z===5){box(3,d-6,w-6,2,'#263e40');box(3,2,w-6,2,'#3d4b4b');}
   if(z>=7&&z<=9){for(const x of [4,w-9]){box(x,d-5,5,3,'#fff4c5');box(x,2,5,2,'#ed6252');}box(9,d-3,w-18,2,'#294347');}
   if(z===11){box(4,d-17,w-8,2,'#f4dfb3');if(sport){box(6,d-22,5,3,'#37575a');box(w-11,d-22,5,3,'#37575a');}}
  }
  if(sport){
   if(z>=10&&z<20){const inset=Math.floor((z-10)/3);box(6+inset,12,16-inset*2,19-inset,z>=18?tint(shell,1.08):'#31545b');if(z<18){box(7+inset,29-inset,14-inset*2,2,'#98c7c2');box(6+inset,14,2,13,paint);box(w-8-inset,14,2,13,paint);}}
   if(z>=11&&z<=18){box(3,5,3,3,'#294347');box(w-6,5,3,3,'#294347');if(z>=17){box(1,2,w-2,4,z===18?'#607476':'#263e46');}}
   if(z===10)for(let i=0;i<4;i++)box(6,7+i*2,w-12,1,'#2b4144');
   if(z>=7&&z<=9){box(11,33,2,13,'#f5dbab');box(16,33,2,13,'#f5dbab');}
   if(z===19){box(11,16,2,10,'#f5dbab');box(16,16,2,10,'#f5dbab');}
   if(z===9){box(4,34,4,5,'#253f43');box(w-8,34,4,5,'#253f43');}
  }else if(fire){
   if(z>=10&&z<=23){box(5,5,w-10,29,z>=21?'#a44038':shell);box(5,39,w-10,15,z>=22?shell:'#375962');if(z<21)for(let y=7;y<32;y+=6)box(4,y,w-8,1,'#afbbb1');}
   if(z>=23&&z<=25){box(7,7,4,28,'#c5cbc0');box(w-11,7,4,28,'#c5cbc0');for(let y=9;y<34;y+=5)box(9,y,w-18,2,'#dce0c8');}
   if(z>=23)box(8,40,w-16,3,z===26?'#ffd794':'#e37459');
  }else{
   if(z>=10&&z<21){box(6,12,w-12,25,z>=19?shell:'#345761');if(z<19){box(6,12,2,25,shell);box(w-8,12,2,25,shell);box(8,34,w-16,2,'#9ac7c4');}}
   if(taxi&&z>=20){box(8,20,w-16,5,z===23?'#fff0ad':'#51756e');if(z===23)box(12,20,4,3,'#294744');}
   if(!taxi&&!armor&&z>=20){box(7,14,w-14,3,z%2?'#f2ad91':'#d55b4c');box(7,25,w-14,3,'#d55b4c');if(z===23){box(12,17,4,12,'#db6b56');box(8,21,12,4,'#db6b56');}}
   if(armor&&z>=19){box(8,17,w-16,13,z>21?'#b1b9a1':'#44656b');if(z>=22)box(w/2-2,30,4,17,'#38545e');}
   if(!taxi&&!armor&&z===10){box(3,9,w-6,3,'#c65e4e');box(3,39,w-6,3,'#c65e4e');}
  }
  layers.push(im);
 }
 return {layers,w,d,unit:1};
}
export function widenStack(stack,factor=1.16){const w=Math.round(stack.w*factor);return {...stack,w,layers:stack.layers.map(layer=>{const im=canvas(w,stack.d),g=im.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(layer,0,0,w,stack.d);return im;})};}
export function monsterStack(kind=0,pose=0){
 const w=100,d=154,h=143,layers=[],skin=kind?'#497b82':'#667958',shade=kind?'#315963':'#465a43',light=kind?'#79aaa4':'#98a673';
 for(let z=0;z<h;z++){
  const im=canvas(w,d),g=im.getContext('2d');
  const ellipse=(x,y,rx,ry,c)=>{g.fillStyle=c;g.beginPath();g.ellipse(x,y,Math.max(1,rx),Math.max(1,ry),0,0,Math.PI*2);g.fill();};
  const box=(x,y,w,d,c)=>{g.fillStyle=c;g.fillRect(x,y,w,d);};
  if(z<42){for(const side of [-1,1]){const stride=Math.sin(pose*Math.PI/2)*side,shift=stride*13,lift=Math.max(0,stride)*7,legZ=z-lift;if(legZ>=0){ellipse(50+side*19,93+shift,legZ<10?17:12,legZ<10?26:17,legZ<8?shade:skin);if(legZ<7)for(let i=0;i<3;i++)box(38+side*19+i*7,111+shift,4,9,'#d9c9a0');}}}
  if(z>=22&&z<95){const bulk=z<45?(z-22)/23:z<70?1:(106-z)/36;ellipse(50,82,27*bulk+4,35*bulk+3,skin);ellipse(50,103,17*bulk,8,light);if(z%7<2)for(let y=58;y<104;y+=12)ellipse(34+(z%3)*9,y,3,4,shade);}
  if(z<53){const tip=Math.max(0,1-z/53);ellipse(50,39,9*tip,36*tip,skin);ellipse(50,14,4*tip,13*tip,shade);}
  if(z>=62&&z<94)for(const side of [-1,1]){ellipse(50+side*30,101,10,19,skin);if(z<70)for(let i=0;i<3;i++)box(43+side*30+i*4,113,3,9,'#ded2b4');}
  if(z>=78&&z<125){const width=z<104?19:Math.max(5,19-(z-104)*.55);ellipse(50,z<98?89:98,width,z<104?23:29,skin);if(z>99&&z<111){box(34,120,32,3,shade);for(let x=35;x<65;x+=6)box(x,121,3,3,'#e1d5ad');}if(z>=113&&z<118){box(33,108,5,6,'#edb56c');box(62,108,5,6,'#edb56c');box(35,109,2,4,'#403b35');box(63,109,2,4,'#403b35');}}
  if(z>=117)for(const side of [-1,1])ellipse(50+side*15,92,Math.max(1,(143-z)*.25),Math.max(1,(143-z)*.35),kind?'#a9cbc1':'#ddd1ac');
  if(z>43&&z<112)for(const y of [48,61,74]){const radius=Math.max(1,10-Math.abs(z-(y+20))*.3);box(48-radius/2,y,radius,5,kind?'#a5cbb7':'#b5ac80');}
  layers.push(im);
 }
 return {layers,w,d,unit:2};
}
export function facilityStack(b){
 const {type,color}=b.facility,w=Math.round(b.w/2),d=Math.round(b.d/2),h=Math.round(b.h/2),layers=[],pad=5;
 const sign=canvas(w,13),sg=sign.getContext('2d');sg.fillStyle=type==='home'?'#234c43':'#304c51';sg.fillRect(0,0,w,13);sg.fillStyle='#f9e7b9';sg.textAlign='center';sg.font='bold 7px sans-serif';sg.fillText(b.sign,w/2,9,w-2);
 for(let z=0;z<h+8;z++){
  const im=canvas(w+10,d+10),g=im.getContext('2d'),box=(x,y,w,d,c)=>{g.fillStyle=c;g.fillRect(x+pad,y+pad,w,d);};
  const setback=z>h*.65&&['hospital','police','power'].includes(type)?7:0;
  if(z<h){box(setback,setback,w-setback*2,d-setback*2,color);box(setback,0,2,d,'#667b75');if(z%14>=5&&z%14<=11)for(let x=7+setback;x<w-setback-6;x+=11){box(x,d-setback-2,7,2,'#41666c');box(x,0,7,2,'#557f80');}if(z<13){box(w*.4,d-2,w*.2,2,'#315b59');if(type==='firehouse')for(let x=6;x<w-8;x+=17)box(x,d-2,13,2,'#596e71');}if(z%14===12)box(0,d-1,w,3,'#e4d6b5');}
  else{
   const roof=type==='home'||type==='market'||type==='workshop',inset=roof?Math.min(w/2-4,(z-h)*2):0;
   box(inset,-1,Math.max(6,w-inset*2),d+2,type==='home'?'#4d816f':type==='firehouse'?'#8d4d48':type==='school'?'#718f7b':'#647e7b');
   if(type==='museum'||type==='theatre'){g.fillStyle='#b3b99d';g.beginPath();g.ellipse(w/2+pad,d/2+pad,w*.3-(z-h),d*.33,0,0,Math.PI*2);g.fill();}
   if(type==='stadium'){box(8,8,w-16,d-16,'#5c9667');box(w/2-1,8,2,d-16,'#dedbbc');}
   if(type==='hospital'){box(w/2-3,d/2-14,6,28,'#c0695b');box(w/2-13,d/2-3,26,6,'#c0695b');}
   if(type==='police'){box(w/2-5,d/2-5,10,10,'#d6c283');box(w/2-2,d/2-10,4,20,'#e9d3a1');}
   if(type==='power'){for(const x of [9,w-21]){box(x,6,12,d-12,'#385c71');for(let y=8;y<d-7;y+=5)box(x+1,y,10,1,'#9bb8bd');}}
  }
  if(z===h-2)g.drawImage(sign,pad,pad+d-2);
  if(type==='school'&&z>h-10&&z<h-3){box(w/2-5,d-3,10,3,'#f2e7c8');box(w/2,d-3,1,3,'#35534c');}
  layers.push(im);
 }
 return {layers,w:w+10,d:d+10,unit:2};
}
