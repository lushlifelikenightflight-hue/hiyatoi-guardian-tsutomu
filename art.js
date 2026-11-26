import {makeCanvas} from './canvas-factory.js?v=5.4.0';
import {districtStyles} from './neighborhoods.js?v=5.4.0';
import {random} from './world.js?v=5.4.0';
export const PALETTE={ink:'#233c3c',shadow:'#243e3d',grass:'#597a54',road:'#75827c',paving:'#b7baa0',water:'#548e87'};
export const YAW=-Math.PI/5,PITCH=.72,C=Math.cos(YAW),S=Math.sin(YAW);
export function project(x,y,z=0){return {x:C*x-S*y,y:(S*x+C*y)*PITCH-z};}
function canvas(w,h){const c=makeCanvas();c.width=w;c.height=h;return c;}
function tint(hex,n){let a=hex.match(/[a-f\d]{2}/gi).map(v=>parseInt(v,16));return `rgb(${a.map(x=>Math.max(0,Math.min(255,Math.round(x*n)))).join(',')})`;}
// Real horizontal slice strips; every object shares the same stacking projection.
export function buildingStack(b){
 if(b.use)return frontageStack(b);
 const w=Math.round(b.w/2),d=Math.round(b.d/2),h=Math.round(b.h/2),layers=[],rng=random(b.seed);
 const walls=['#cdba91','#9ca58e','#c59076','#cfc7a6','#8b9a96','#c6b79c','#9fa797','#bca08b','#cebc9b','#7e9d8d'];
 const roofs=['#587b75','#566c6b','#9b6652','#617d70','#bba480','#496a69','#a8785a','#6a7770','#668b8a','#65736b'];
 const west=b.theme==='west',east=b.theme==='east',pitched=west||(!east&&b.style%3===0);
 const district=districtStyles[b.district],localMaterials=district&&b.seed%4<2;
 const wall=localMaterials?district.wall:west?['#9d7456','#cfb586','#ad8570'][b.style]:east?['#bd8791','#a5b9b1','#d1ad95'][b.style]:walls[b.style];
 const roof=localMaterials?district.roof:west?['#495d52','#6c5149','#475d62'][b.style]:east?['#647b86','#819c9c','#8b7176'][b.style]:roofs[b.style];
 const floorCount=Math.max(1,Math.floor(h/15));
 const sign=canvas(w,8),sg=sign.getContext('2d');sg.fillStyle=['#567b70','#a95d43','#dfc18b','#475f60'][b.seed%4];sg.fillRect(0,0,w,8);sg.fillStyle=b.seed%4===2?'#3d5551':'#eee1bd';sg.textAlign='center';sg.font='bold 6px "Yu Gothic UI", sans-serif';sg.fillText(['こだま','喫茶 余白','小春堂','レコード','やまねこ','木と本','花 こもれび','夕凪商店'][b.seed%8],w/2,6);
 for(let z=0;z<h+8;z++){
   const im=canvas(w+8,d+8),g=im.getContext('2d');let inset=0;
   if(z<3)inset=-1;
   if(z>=h)inset=pitched?Math.floor((z-h)*1.1):-2;
   if(z>=h+3&&!pitched){
     if(z<h+7){g.fillStyle=z===h+6?'#c5c4a7':'#8d9d91';g.fillRect(w*.62,d*.27,7,7);g.fillStyle='#667c76';g.fillRect(w*.62+1,d*.27+1,5,1);}
     if(z<h+6&&b.seed%3===0){g.fillStyle='#71857d';g.fillRect(8,8,5,5);}
     layers.push(im);continue;
   }
   const x=4+inset,y=4+inset,ww=w-inset*2,dd=d-inset*2;
   g.fillStyle=z>=h?roof:tint(wall,.88+(z/h)*.14);g.fillRect(x,y,ww,dd);
   g.fillStyle=z>=h?tint(roof,.72):tint(wall,.70);g.fillRect(x,y,2,dd);
   g.fillStyle=z>=h?tint(roof,1.16):tint(wall,1.08);g.fillRect(x,y+dd-2,ww,2);
   if(z<h&&z>6){
     for(let floor=0;floor<floorCount;floor++){
       const base=8+floor*14;if(z<base||z>base+7)continue;
       for(let a=6;a<w-4;a+=9){g.fillStyle=z===base||z===base+7?'#d9caa5':(b.seed+a)%4===0?'#ddbb7b':'#506d69';g.fillRect(a,4+d-2,6,2);if(z===base+6){g.fillStyle='#b0c4af';g.fillRect(a+1,4+d-2,4,1);}g.fillStyle=z===base||z===base+7?'#b2b598':'#3b5c5b';g.fillRect(4,a%d,2,5);}
     }
   }
   if(west&&z>5&&z<h-2){
     g.fillStyle=tint(wall,.65);g.fillRect(w*.34,y+dd-2,2,2);g.fillRect(w*.72,y+dd-2,2,2);
     if(z%11===0)g.fillRect(x,y+dd-2,ww,2);
   }
   if(east&&z>9&&z<h-4&&z%14<2){
     g.fillStyle='#c4cfbd';g.fillRect(x-1,y+dd-2,ww+2,3);
     g.fillStyle='#759691';g.fillRect(x+3,y+dd,ww-6,1);
   }
   if(z===h-1||z===3){g.fillStyle='#e1d1ac';g.fillRect(2,2,w+4,2);g.fillRect(2,d+4,w+4,2);}
   if(z<11&&z>2){g.fillStyle=z===10?'#d6bd83':'#3a5e58';g.fillRect(w*.42,d+2,7,2);if(z<9){g.fillStyle='#d3b87e';g.fillRect(w*.65,d+2,9,2);g.fillStyle='#6b8980';g.fillRect(w*.66,d+3,3,1);}}
   if(z>6&&z<19&&b.seed%3===0){g.fillStyle=z%4?'#568066':'#6f966c';g.fillRect(w+2,8,2,8);g.fillRect(w-1,13,4,3);}
   if(z===h&&b.style===8){g.fillStyle='#be7347';g.fillRect(1,d+2,w+6,3);g.fillStyle='#eee0b8';g.fillRect(w*.25,d+2,w*.5,3);}
   if(z===10&&b.style!==8&&(!east||b.seed%4===0)){g.drawImage(sign,4,d+3);}
   if(z>=8&&z<10&&b.style<5&&!east){g.fillStyle=b.seed%2?'#b95d43':'#587e75';g.fillRect(2,d+3,w+4,7);for(let a=3;a<w;a+=5){g.fillStyle='#ddd1a8';g.fillRect(a,d+3,2,7);}}
   if(z===h&&!pitched){g.fillStyle=tint(roof,1.18);for(let a=8;a<w;a+=6)g.fillRect(a,5,1,d-2);}
   layers.push(im);
 }
 return {layers,w:w+8,d:d+8,unit:2};
}
function frontageStack(b){
 const west=b.theme==='west',shop=b.use==='wood-shop'||b.use==='avenue-store';
 const w=Math.round(b.w/2),d=Math.round(b.d/2),h=Math.round(b.h/2),pad=7,layers=[];
 const style=b.style%3;
 const wood=['#80624e','#ab8162','#b08f68'][style];
 const trim=west?'#533e36':'#6e8b89';
 const wall=west?wood:['#cbb7aa','#a9c0b9','#d4c8b6'][style];
 const roof=west?['#4d5c55','#62504a','#4e6163'][style]:'#839a96';
 const awning=west?['#ad6148','#627c69','#d3ae76'][style]:['#486d70','#6f696c','#668881'][style];
 const sign=canvas(w-4,8),label=sign.getContext('2d');
 label.fillStyle=west?'#dec095':'#305b58';label.fillRect(0,0,sign.width,8);
 label.fillStyle=west?'#594539':'#e5e2bc';label.font='bold 6px "Yu Gothic UI", sans-serif';
 label.textAlign='center';label.fillText(b.sign??'',sign.width/2,6,sign.width-2);
 for(let z=0;z<h+8;z++){
  const tile=canvas(w+pad*2,d+pad*2),g=tile.getContext('2d');
  const front=pad+d-1;
  if(z<h){
   g.fillStyle=tint(wall,.86+z/h*.16);g.fillRect(pad,pad,w,d);
   g.fillStyle=tint(wall,.72);g.fillRect(pad,pad,2,d);
   g.fillStyle=trim;g.fillRect(pad,front-1,w,2);
   if(west){
    for(let x=pad+3;x<pad+w;x+=5){
     g.fillStyle=tint(wood,x%2?.94:1.14);g.fillRect(x,front-1,3,2);
    }
    g.fillStyle=trim;for(const x of [pad,pad+Math.floor(w/2),pad+w-2])g.fillRect(x,front-2,2,3);
    if(z>=4&&z<=11){
     g.fillStyle=b.use==='wood-home'?'#bcb69b':'#e2b481';g.fillRect(pad+4,front-1,w-8,2);
     g.fillStyle=trim;for(let x=pad+4;x<pad+w-4;x+=4)g.fillRect(x,front,1,2);
    }
    if(!shop&&z>=6&&z<=12){
     g.fillStyle='#575e52';g.fillRect(pad+4,pad,7,2);g.fillRect(pad+w-11,pad,7,2);
     g.fillRect(pad,pad+d*.32,2,8);g.fillRect(pad+w-2,pad+d*.32,2,8);
     if(z===6||z===12){g.fillStyle='#bcaa87';g.fillRect(pad+4,pad,7,1);g.fillRect(pad+w-11,pad,7,1);}
    }
    if(shop&&z>=9&&z<=11){
     g.fillStyle=awning;g.fillRect(pad-1,front+1,w+2,5);
     g.fillStyle='#eacfaa';for(let x=pad;x<pad+w;x+=5)g.fillRect(x,front+2,1,4);
    }
    if(shop&&z===12)g.drawImage(sign,pad+2,front-1);
    if(!shop&&z===5){g.fillStyle='#a19b7b';g.fillRect(pad+w/3,front+1,w/3,4);}
   }else{
    const floor=z%13;
    if(z>2&&floor<9){
     g.fillStyle=z<11?'#6b9c9a':'#567c7c';
     for(let x=pad+4;x<pad+w-5;x+=10){
      g.fillRect(x,front-1,7,2);
      g.fillRect(x,pad,6,2);
      if(floor===7){g.fillStyle='#bdd1be';g.fillRect(x,front,7,1);g.fillRect(x,pad,6,1);g.fillStyle='#567c7c';}
     }
     for(let y=pad+6;y<front-4;y+=11){g.fillRect(pad,y,2,6);g.fillRect(pad+w-2,y,2,6);}
    }
    if(!shop&&z>=12&&floor<3){
     g.fillStyle='#d5d7bc';g.fillRect(pad-1,front+1,w+2,4);
     g.fillRect(pad-1,pad-3,w+2,3);
     g.fillStyle='#779693';for(let x=pad+3;x<pad+w-3;x+=9)g.fillRect(x,front+4,3,1);
    }
    if(shop&&z===11){g.fillStyle=awning;g.fillRect(pad-1,front+1,w+2,5);}
    if(shop&&z===12)g.drawImage(sign,pad+2,front-1);
   }
  }else if(west){
   const inset=(z-h)*1.35;
   g.fillStyle=tint(roof,1+(z-h)*.025);g.fillRect(pad-2,pad-2+inset,w+4,d+4-inset*2);
   g.fillStyle=tint(roof,.72);for(let x=pad;x<pad+w;x+=4)g.fillRect(x,pad+d+1-inset,1,1);
  }else if(z<h+3){
   g.fillStyle=roof;g.fillRect(pad-1,pad-1,w+2,d+2);
   g.fillStyle='#b4bda7';g.fillRect(pad+2,pad+2,w-4,d-4);
   g.fillStyle='#829892';g.fillRect(pad+4,pad+4,w-8,d-8);
  }else{
   g.fillStyle='#a1ada0';g.fillRect(pad+7,pad+7,8,7);g.fillRect(pad+w-16,pad+d-16,10,8);
  }
  layers.push(tile);
 }
 return {layers,w:w+pad*2,d:d+pad*2,unit:2};
}
export function treeStack(t){
 const radius=Math.round(t.size*.55),w=radius*2+6,h=Math.round(t.size*1.4),layers=[],rng=random(t.seed);
 const warm=t.type===2,colors=warm?['#ad793e','#c6954a','#d2ad5c','#dfc77e']:['#315a47','#427451','#608854','#8a9e60'];
 const noise=[];for(let i=0;i<100;i++)noise.push([rng(),rng(),rng()]);
 for(let z=0;z<h;z++){
  const im=canvas(w,w),g=im.getContext('2d');const cx=w/2;
  if(z<h*.55){g.fillStyle=z%4===0?'#9e9270':'#756f52';g.fillRect(cx-2,cx-2,4,4);}
  if(z>h*.28){
   const nz=(z-h*.64)/(h*.38),r=radius*Math.sqrt(Math.max(0,1-nz*nz));
   for(const [a,b,c] of noise){const px=Math.round((a*2-1)*radius),py=Math.round((b*2-1)*radius);if(px*px+py*py>r*r)continue;g.fillStyle=colors[Math.min(3,Math.floor(c*2+z/h*2))];g.fillRect(cx+px-3,cx+py-3,7,7);}
  }
  layers.push(im);
 }return {layers,w,d:w,unit:1.45};
}
export function pedestrianStack(style,pose){
 const outfits=['#bd725e','#52878a','#d2ad63','#696886','#708958','#ca8f7b'];
 const skin=['#e6bb91','#c88f6c','#a66c51'];
 const shirt=outfits[style%outfits.length],face=skin[style%skin.length];
 const hair=style%4===2?'#695044':'#383e37',pants=style%2?'#445e61':'#655e56';
 const seated=pose==='sit',walking=pose==='walk-a'||pose==='walk-b';
 const stride=walking?(pose==='walk-a'?1:-1):0;
 const w=13,d=13,h=seated?15:20,layers=[];
 for(let z=0;z<h;z++){
  const im=canvas(w,d),g=im.getContext('2d');
  if(z<(seated?6:8)){
   g.fillStyle=z<2?'#344842':pants;
   const lean=seated?Math.max(0,3-Math.floor(z/2)):0;
   g.fillRect(4,6+stride+lean,2,3);
   g.fillRect(7,6-stride+lean,2,3);
  }else if(z<h-5){
   g.fillStyle=tint(shirt,.88+z/h*.14);g.fillRect(3,4,7,5);
   g.fillStyle=tint(shirt,1.12);g.fillRect(3,8,7,1);
   g.fillStyle=z%4===0?face:shirt;
   g.fillRect(2,6-stride,2,3);g.fillRect(9,6+stride,2,3);
   if(pose==='gesture'&&z>h-10){g.fillStyle=face;g.fillRect(9,8,3,3);}
   if(style%3===1){g.fillStyle='#d9ba87';g.fillRect(8,4,2,5);}
  }else{
   g.fillStyle=z>=h-2?hair:face;g.fillRect(4,4,5,5);
   g.fillStyle=hair;g.fillRect(4,4,5,1);
   if(z===h-2&&style%3===2){g.fillStyle='#d6bb89';g.fillRect(3,4,7,6);}
   if(z===h-4){g.fillStyle='#65473b';g.fillRect(5,8,1,1);g.fillRect(7,8,1,1);}
  }
  layers.push(im);
 }
 return {layers,w,d,unit:1.22};
}
export function scooterStack(){
 const w=17,d=33,h=30,layers=[];
 for(let z=0;z<h;z++){
  const im=canvas(w,d),g=im.getContext('2d');const rect=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(x,y,w,h);};
  if(z<8){for(const y of [4,25]){rect(7,y,4,7,'#293f40');if(z>2&&z<6)rect(8,y+1,2,5,'#c7c9af');}}
  if(z>=5&&z<=14){rect(4,11,10,15,'#67988d');rect(5,23,8,6,'#94b6a0');rect(5,6,8,5,'#81b4a3');}
  if(z>=10&&z<=18){rect(6,8,6,8,'#84b5a2');rect(7,7,4,2,'#f2d8a2');}
  if(z===17){rect(2,9,14,2,'#3a5651');}
  if(z>=13&&z<=16)rect(5,17,8,9,'#4b5551');
  if(z>=16&&z<=23){rect(5,16,8,7,'#d8b578');rect(3,14,4,7,'#d8b578');rect(11,14,4,7,'#d8b578');}
  if(z>=23&&z<=29){rect(5,16,8,7,z===29?'#e8dfbf':'#d0d5b5');if(z===24)rect(5,15,8,2,'#445f5b');}
  layers.push(im);
 }return {layers,w,d,unit:1};
}
export function sportStack(){
 const w=26,d=47,h=16,layers=[];
 for(let z=0;z<h;z++){
  const im=canvas(w,d),g=im.getContext('2d');
  const rect=(x,y,w,d,color)=>{g.fillStyle=color;g.fillRect(x,y,w,d);};
  if(z<7)for(const x of [1,20])for(const y of [7,32]){
   rect(x,y,5,8,'#263b40');
   if(z>=2&&z<=4)rect(x+(x===1?0:4),y+2,1,4,'#b2c3b5');
  }
  if(z>=3&&z<=9){
   const shell=['#733c3b','#a8463c','#be4b3f','#d95844','#e4664c','#ed7658','#ed8a65'][z-3];
   rect(3,5,20,34,shell);rect(1,9,24,25,shell);
   rect(2,4,22,10,shell);rect(5,38,16,4,shell);rect(7,42,12,3,shell);
   rect(11,6,3,35,z>7?'#f4d4a1':'#c6aa8c');
   if(z>=6&&z<=7){rect(4,5,4,2,'#803f37');rect(18,5,4,2,'#803f37');}
   if(z>=7){rect(5,39,3,4,'#e9e2bc');rect(18,39,3,4,'#e9e2bc');}
   if(z===8){rect(2,10,3,24,'#b04d3f');rect(21,10,3,24,'#b04d3f');}
  }
  if(z>=9){
   const inset=Math.floor((z-9)/3);
   rect(6+inset,11+inset,14-inset*2,21-inset*2,z>=14?'#e96850':'#38575a');
   if(z<14){rect(7+inset,28-inset,12-2*inset,1,'#87adab');rect(8+inset,13+inset,10-2*inset,1,'#67918f');}
   if(z>=14)rect(11,14,3,12,'#f3d29d');
   if(z<=12)for(const x of [4,19])rect(x,6,3,2,'#584544');
   if(z>=12&&z<=13)rect(3,4,20,3,z===13?'#58433f':'#8e4039');
   if(z===10){rect(3,26,3,3,'#dc654f');rect(20,26,3,3,'#dc654f');}
  }
  layers.push(im);
 }
 return {layers,w,d,unit:1};
}
export function imageStack(image,count){
 if(image.width%count!==0)throw Error('断面PNGの枚数が一致しません。');
 const w=image.width/count,d=image.height,layers=[];
 for(let z=0;z<count;z++){const im=canvas(w,d);im.getContext('2d').drawImage(image,z*w,0,w,d,0,0,w,d);layers.push(im);}return {layers,w,d,unit:1};
}
export function bakeStack(stack,turn=YAW,scale=1,spacing=1){
 const {w,d,layers}=stack,extent=Math.ceil(Math.hypot(w,d)*scale)+8,height=Math.ceil(extent*PITCH+layers.length*scale*spacing)+10;
 const im=canvas(extent,height),g=im.getContext('2d'),anchor={x:extent/2,y:height-extent*PITCH/2-3};g.imageSmoothingEnabled=false;
 for(let z=0;z<layers.length;z++){
  g.save();g.translate(anchor.x,anchor.y-z*scale*spacing);g.scale(scale,scale*PITCH);g.rotate(turn);g.drawImage(layers[z],-(w-1)/2,-(d-1)/2);g.restore();
 }
 return {image:im,anchor};
}
export function drawSprite(g,s,x,y,scale=1,alpha=1){g.globalAlpha=alpha;g.drawImage(s.image,Math.round(x-s.anchor.x*scale),Math.round(y-s.anchor.y*scale),s.image.width*scale,s.image.height*scale);g.globalAlpha=1;}
export function bakeShadow(stack,scale,angle=YAW){
 const e=Math.ceil(Math.hypot(stack.w,stack.d)*scale),reach=stack.layers.length*scale,im=canvas(Math.ceil(e+reach*.95+8),Math.ceil(e*PITCH+reach*.55+8)),g=im.getContext('2d'),anchor={x:e/2+3,y:e*PITCH/2+3};
 g.imageSmoothingEnabled=false;
 for(let z=0;z<stack.layers.length;z++){g.save();g.translate(anchor.x+z*scale*.75,anchor.y+z*scale*.4);g.scale(scale,scale*PITCH);g.rotate(angle);g.drawImage(stack.layers[z],-(stack.w-1)/2,-(stack.d-1)/2);g.restore();}
 g.globalCompositeOperation='source-in';g.fillStyle='rgba(28,56,44,.24)';g.fillRect(0,0,im.width,im.height);
 const data=g.getImageData(0,0,im.width,im.height),a=data.data,copy=new Uint8ClampedArray(a),bayer=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
 for(let y=1;y<im.height-1;y++)for(let x=1;x<im.width-1;x++){let i=(y*im.width+x)*4;if(copy[i+3]&&(!copy[i-1]||!copy[i+7]||!copy[i-im.width*4+3]||!copy[i+im.width*4+3])&&bayer[(y%4)*4+x%4]<5)a[i+3]=0;}g.putImageData(data,0,0);return {image:im,anchor};
}
const detailDimensions={
 awning:[25,16,17],bikeRack:[24,10,12],kiosk:[17,13,22],flowerBed:[22,14,8],
 parasol:[17,18,18],noticeboard:[16,6,18],hydrant:[8,8,13],hedge:[23,10,12]
};
function neighborhoodStack(type){
 const [w,d,h]=detailDimensions[type],layers=[];
 for(let z=0;z<h;z++){
  const im=canvas(w,d),g=im.getContext('2d');
  const rect=(x,y,w,d,color)=>{g.fillStyle=color;g.fillRect(x,y,w,d);};
  if(type==='awning'){
   for(const x of [2,w-4])for(const y of [2,d-4])rect(x,y,2,2,'#745946');
   if(z>=4&&z<8){rect(1,4,w-2,7,'#9a704e');if(z===7)for(let x=3;x<23;x+=4)rect(x,5,2,4,x%3?'#dbb274':'#96a76d');}
   if(z>=14)for(let x=1;x<w-1;x+=3)rect(x,z-14,3,d-2*(z-14),x%2?'#dcbf89':'#ae624d');
  }else if(type==='parasol'){
   rect(8,8,2,2,'#725d4a');
   if(z>=13){const inset=(z-13)*1.4;g.fillStyle=z%2?'#e6c385':'#b36c55';g.beginPath();g.ellipse(8.5,8.5,8-inset,8-inset,0,0,Math.PI*2);g.fill();}
  }else if(type==='bikeRack'){
   for(const x of [1,10,19]){
    if(z<7){rect(x,1,2,3,'#304644');rect(x,6,2,3,'#304644');}
    if(z>=3&&z<=8)rect(x,3,2,5,x===10?'#8b9a65':'#b56d55');
    if(z===9)rect(x-1,1,4,2,'#829791');
   }
  }else if(type==='hydrant'){
   rect(z<3?1:2,2,z<3?6:4,4,z>=11?'#d6a76b':'#b76750');if(z>=5&&z<=8)rect(1,3,6,2,'#d08160');
  }else if(type==='noticeboard'){
   for(const x of [2,13])rect(x,2,2,2,'#765b47');
   if(z>=7){rect(1,1,w-2,4,'#9a7455');rect(2,4,w-4,1,z>14?'#82614a':'#dfcba0');if(z%4<2)rect(5,4,5,1,'#a08a6f');}
  }else if(type==='kiosk'){
   if(z<18){rect(2,2,w-4,d-4,'#898e70');if(z>7&&z<17)rect(4,d-3,9,1,'#cdd8b8');}
   else{rect(0,z-18,w,d-(z-18)*2,z%2?'#af6b4d':'#d29a6b');}
  }else{
   if(z<3)rect(0,0,w,d,'#a2875f');
   else{
    const green=type==='hedge',shade=z%2?'#8fa367':'#658651';
    for(let x=1;x<w-3;x+=4){
     const y=1+(x+z)%3;
     rect(x,y,4,d-y-1-z%3,shade);
     if(!green&&z>4)rect(x+1,y+2,2,2,x%3?'#e7ba8f':'#b2858b');
    }
   }
  }
  layers.push(im);
 }
 return {layers,w,d,unit:1.25};
}
export function serviceOfficeStack(theme){
 const style=districtStyles[theme],w=40,d=28,h=34,layers=[];
 const pitched=['park','west','market','hill'].includes(theme);
 for(let z=0;z<h;z++){
  const tile=canvas(w,d),g=tile.getContext('2d');
  const rect=(x,y,w,d,color)=>{g.fillStyle=color;g.fillRect(x,y,w,d);};
  if(z<3)rect(1,1,w-2,d-2,'#a8a28e');
  if(z>=3&&z<26){
   rect(2,2,w-4,d-3,tint(style.wall,.78+z*.009));
   rect(2,2,2,d-4,'#68766a');
   rect(4,24,14,3,z<17?'#3e5a54':'#628075');
   rect(23,24,12,3,z>8&&z<19?'#aecfc1':style.accent);
   if(z===16||z===20)rect(22,25,14,2,'#e7ddba');
   if(z>=21&&z<=24){
    rect(2,25,w-4,3,style.accent);
    for(let x=4;x<w-3;x+=6)rect(x,25,2,2,'#e2d7ac');
   }
  }
  if(z>=25){
   const inset=pitched?(z-25)*1.15:0;
   if(!pitched&&z>28){if(z===29)rect(23,6,10,8,'#aeb3a1');}
   else{
    rect(0,Math.round(inset),w,d-Math.round(inset)*2,z%2?tint(style.roof,1.07):style.roof);
    if(z>25)rect(0,Math.round(inset),w,1,tint(style.roof,1.23));
   }
  }
  layers.push(tile);
 }
 return {layers,w,d,unit:1.4};
}
export function fallenPedestrianStack(style){
 const w=9,d=21,layers=[];
 const colors=['#b4725b','#6c8d84','#c3a46d','#7f889e','#87975f','#9b786b'];
 for(let z=0;z<4;z++){
  const tile=canvas(w,d),g=tile.getContext('2d');
  g.fillStyle='#374e49';g.fillRect(2,2,2,7);g.fillRect(5,1,2,8);
  g.fillStyle=colors[style%colors.length];g.fillRect(1,8,7,7);
  g.fillStyle='#c9a17e';g.fillRect(2,15,5,4);
  g.fillStyle='#4e4b40';g.fillRect(2,18,5,2);
  layers.push(tile);
 }
 return {layers,w,d,unit:1.15};
}
function frontageDetail(type){
 const [w,d,h]=type==='cycleShelter'?[30,18,22]:type==='cargoStall'?[20,14,16]:[10,7,24];
 const layers=[];
 for(let z=0;z<h;z++){
  const im=canvas(w,d),g=im.getContext('2d');
  const box=(x,y,w,h,color)=>{g.fillStyle=color;g.fillRect(x,y,w,h);};
  if(type==='cycleShelter'){
   for(const x of [2,w-4])for(const y of [2,d-4])if(z<19)box(x,y,2,2,'#557773');
   if(z>=18)box(0,0,w,d,z<21?'#4a736e':'#a2b6a0');
   if(z>=2&&z<=9)for(let x=5;x<w-6;x+=7){
    box(x,5,2,9,'#585c4d');if(z%3===0)box(x-1,6,4,6,'#c28b64');
   }
  }else if(type==='cargoStall'){
   if(z<6)box(1,2,w-2,d-4,z<4?'#866246':'#c19a65');
   if(z>=6&&z<13)for(let x=3;x<w-3;x+=5)box(x,4,4,6,z%2?'#d6a65b':'#98a260');
   if(z<14)for(const x of [1,w-3])box(x,2,2,2,'#725748');
   if(z>=14)for(let x=0;x<w;x+=4)box(x,0,4,d,x%8?'#e8d3a1':'#b76151');
  }else{
   box(4,2,2,4,'#4e635a');
   if(z>=13){box(0,1,w,d-2,'#496f67');if(z>14&&z<23)box(1,0,w-2,1,z%3?'#e9d399':'#7e9c87');}
  }
  layers.push(im);
 }
 return {layers,w,d,unit:1.3};
}
export function streetDetailStack(type){
 if(['cycleShelter','cargoStall','lampSign'].includes(type))return frontageDetail(type);
 if(detailDimensions[type])return neighborhoodStack(type);
 const w=type==='fountain'?38:type==='bench'?22:14,d=type==='fountain'?31:10,h=type==='lamp'||type==='lantern'?30:type==='fountain'?14:type==='vending'?25:type==='planter'?15:12,layers=[];
 for(let z=0;z<h;z++){const im=canvas(w,d),g=im.getContext('2d');
  if(type==='vending'){g.fillStyle=z===h-1?'#dcbe92':'#b25740';g.fillRect(1,1,w-2,d-2);g.fillStyle=z>7&&z<21?'#b6d4bc':'#b9694c';g.fillRect(2,d-2,w-5,2);if(z%4===0&&z>7&&z<21){g.fillStyle='#e6d496';for(let x=3;x<w-4;x+=3)g.fillRect(x,d-2,2,1);}g.fillStyle='#3c5a51';g.fillRect(w-3,d-2,1,1);}
  if(type==='bench'){if(z<4){g.fillStyle='#4a685a';g.fillRect(3,2,2,6);g.fillRect(w-5,2,2,6);}if(z===4||z>7){g.fillStyle=z%2?'#bd9262':'#a68158';g.fillRect(1,z===4?1:1,w-2,z===4?8:2);}}
  if(type==='planter'){if(z<5){g.fillStyle=z===4?'#cead79':'#a07b53';g.fillRect(1,1,w-2,d-2);}else{g.fillStyle=z>10?'#86a161':'#4b8055';g.fillRect(2+(z%3),1+(z%2),w-5-(z%3),d-3);if(z===10||z===12){g.fillStyle='#e1bc79';g.fillRect(4,2,2,2);g.fillStyle='#bb7957';g.fillRect(9,5,2,2);}}}
  if(type==='lantern'){
   g.fillStyle='#594937';g.fillRect(6,4,2,3);
   if(z>=19&&z<=25){g.fillStyle=z===25?'#8e5840':'#d7a76d';g.fillRect(4,2,7,7);}
  }
  if(type==='fountain'){
   if(z<5){g.fillStyle=z===4?'#b1c0aa':'#879c90';g.beginPath();g.ellipse(19,15,17,13,0,0,Math.PI*2);g.fill();}
   if(z===5){g.fillStyle='#689c93';g.beginPath();g.ellipse(19,15,13,10,0,0,Math.PI*2);g.fill();}
   if(z>=5&&z<12){g.fillStyle='#c3d6bf';g.fillRect(17,13,4,4);}
   if(z===12){g.fillStyle='#d2dfc8';g.fillRect(15,11,8,8);}
  }
  if(type==='lamp'){g.fillStyle='#496759';g.fillRect(5,4,z<3?5:3,z<3?5:3);if(z>26){g.fillStyle=z===29?'#7b8c70':'#e3ca91';g.fillRect(5,4,8,3);}}
  layers.push(im);
 }return {layers,w,d,unit:1.4};
}
export function trainStack(head=false){
 const w=56,d=20,h=25,layers=[];
 for(let z=0;z<h;z++){const im=canvas(w,d),g=im.getContext('2d');
  if(z<4){g.fillStyle='#263e3d';for(const x of [9,39])g.fillRect(x,2,8,16);g.fillStyle='#a6b29c';g.fillRect(2,5,w-4,10);}
  else{const inset=z>21?Math.floor((z-21)*.8):0;g.fillStyle=z>21?'#c9c8ad':z<10?'#b66f45':'#d1c5a5';g.fillRect(1+inset,1+inset,w-2-inset*2,d-2-inset*2);g.fillStyle=z>21?'#dcd3b2':'#b79f7c';g.fillRect(1+inset,1+inset,w-2-inset*2,2);g.fillStyle=z<10?'#df9b56':'#ede0b8';g.fillRect(1+inset,d-3-inset,w-2-inset*2,2);
   if(z>=11&&z<=19){g.fillStyle=z===19?'#98afa4':'#42665f';for(let x=6;x<49;x+=10){g.fillRect(x,1,7,2);g.fillRect(x,d-3,7,2);}if(head){g.fillStyle='#365d59';g.fillRect(w-3,4,2,d-8);}}
   if(z>=5&&z<=18){g.fillStyle='#a2b29f';for(const x of [17,36]){g.fillRect(x,d-3,1,2);g.fillRect(x,1,1,2);}}
   if(z===8&&head){g.fillStyle='#f3d696';g.fillRect(w-2,4,1,3);g.fillRect(w-2,d-7,1,3);}
   if(z===24){g.fillStyle='#7d9288';for(const x of [14,35])g.fillRect(x,7,7,6);}
  }layers.push(im);
 }return {layers,w,d,unit:1.5};
}
export function stationStack(){
 const w=219,d=62,h=53,layers=[];
 for(let z=0;z<h;z++){
  const im=canvas(w+8,d+8),g=im.getContext('2d');
  if(z<3){g.fillStyle='#22332f';g.fillRect(2,2,w+4,d+4);g.fillStyle='#b6b495';g.fillRect(2,d-2,w+4,7);}
  if(z>=3&&z<45){
   // Open rail tunnel: dark ends, side walls and structural piers, never a solid box.
    g.fillStyle='#b5ad8d';g.fillRect(4,3,w,4);g.fillStyle=z<29?'#c2b28f':'#d7c69f';g.fillRect(4,d+1,w,5);
    // Only the two track portals are dark. The public frontage is a solid facade.
    g.fillStyle=z<27?'#152823':'#b5ad8d';g.fillRect(3,9,2,d-11);g.fillRect(w+3,9,2,d-11);
    if(z>6&&z<22){g.fillStyle='#52776e';for(let x=17;x<w-10;x+=23)g.fillRect(x,d+3,12,2);}
    if(z<23){g.fillStyle='#344f48';g.fillRect(97,d+3,24,3);}
   g.fillStyle='#8e947c';for(const x of [4,55,110,165,w])g.fillRect(x,3,4,4);
   g.fillStyle='#b8b797';for(const x of [4,55,110,165,w])g.fillRect(x,d+1,5,5);
   if(z>32&&z<40){g.fillStyle=z>38?'#a8b49b':'#486e67';for(let x=16;x<w-10;x+=19)g.fillRect(x,d+3,11,2);}
   if(z===30){g.fillStyle='#bc784b';g.fillRect(4,d+2,w,4);}
  }
  if(z>=45){const inset=z>50?2:0;g.fillStyle=z===52?'#8d9d87':z===45?'#314c45':'#5d7f73';g.fillRect(1+inset,1+inset,w+6-inset*2,d+6-inset*2);g.fillStyle='#93a28a';for(let x=8;x<w;x+=13)g.fillRect(x,3,1,d+2);}
  layers.push(im);
 }return {layers,w:w+8,d:d+8,unit:2};
}
export function rampStack(pad){
 const w=Math.round(pad.d),d=Math.round(pad.w),h=pad.shortJump?6:10,layers=[];
 for(let z=0;z<h;z++){
  const im=canvas(w,d),g=im.getContext('2d'),start=Math.floor(z*w/(h+1));
  g.fillStyle=z%2?'#a87847':'#c69b62';g.fillRect(start,1,w-start,d-2);
  g.fillStyle='#e5bd76';g.fillRect(start,1,2,d-2);
  for(const y of [3,d-5]){g.fillStyle='#61766a';g.fillRect(start,y,w-start,2);}
  layers.push(im);
 }
 return {layers,w,d,unit:1.8};
}
export function ambulanceStack(){
 const w=29,d=51,layers=[];
 for(let z=0;z<24;z++){
  const im=canvas(w,d),g=im.getContext('2d');
  const box=(x,y,w,h,color)=>{g.fillStyle=color;g.fillRect(x,y,w,h);};
  if(z<8)for(const x of [1,23])for(const y of [8,34]){
   box(x,y,5,9,'#253a3d');
   if(z>=2&&z<=4)box(x+(x>10?4:0),y+2,1,5,'#a6beb4');
  }
  if(z>=4&&z<15){
   box(4,4,21,43,z<7?'#a5b8ac':'#e9e8d6');
   box(6,44,17,5,'#d4d9c5');
   if(z>=7&&z<10)box(4,4,21,41,'#b8534c');
   if(z>9){box(5,3,4,2,'#b6534a');box(20,3,4,2,'#b6534a');box(6,47,4,2,'#fff1ba');box(19,47,4,2,'#fff1ba');}
  }
  if(z>=12&&z<21){
   box(4,4,21,31,z===20?'#f6efd9':'#dedeca');
   if(z>=14&&z<19){
    box(4,10,2,11,'#4e7272');box(23,10,2,11,'#4e7272');
    box(7,4,6,2,'#5b7e7c');box(16,4,6,2,'#5b7e7c');
   }
   if(z<18){box(6,35,17,z>15?7:10,z===17?'#d2e3d6':'#496e73');}
   if(z===20){box(13,10,3,12,'#ad4944');box(9,14,11,4,'#ad4944');}
  }
  if(z>=21&&z<=23){box(6,32,17,4,'#4e5e59');box(5,32,5,4,'#ac403a');box(19,32,5,4,'#ac403a');}
  layers.push(im);
 }
 return {layers,w,d,unit:.78};
}
export function patrolStack(){
 const w=24,d=43,layers=[];
 for(let z=0;z<18;z++){
  const im=canvas(w,d),g=im.getContext('2d');
  const box=(x,y,w,h,color)=>{g.fillStyle=color;g.fillRect(x,y,w,h);};
  if(z<6)for(const x of [1,19])for(const y of [6,29]){
   box(x,y,4,8,'#26373d');
   if(z>=2&&z<=3)box(x+(x>10?3:0),y+2,1,4,'#a4b1a9');
  }
  if(z>=3&&z<10){
   box(3,3,18,37,z<=6?'#304146':'#eeead9');
   box(5,1,14,41,z<=6?'#374b4c':'#f3e8cd');
   if(z===7){box(4,2,4,2,'#ba594d');box(16,2,4,2,'#ba594d');box(5,39,4,2,'#f8dda6');box(15,39,4,2,'#f8dda6');}
   if(z===8){box(3,13,2,17,'#354f57');box(19,13,2,17,'#354f57');}
  }
  if(z>=9&&z<15){
   const trim=z>=13?1:0;
   box(5+trim,11+trim,14-2*trim,21-2*trim,z>=13?'#eee8d7':'#517479');
   if(z===14){box(9,16,6,8,'#283f49');box(10,17,4,6,'#b8c9b8');}
  }
  if(z>=15){box(5,23,14,4,'#506667');box(5,23,5,4,'#a24a49');box(14,23,5,4,'#a24a49');}
  layers.push(im);
 }
 return {layers,w,d,unit:.91};
}
export function cityVehicleStack(kind){
 const dozer=kind==='dozer',w=dozer?36:29,d=49,h=dozer?26:20,layers=[];
 for(let z=0;z<h;z++){
  const im=canvas(w,d),g=im.getContext('2d');
  const fill=(x,y,w,d,c)=>{g.fillStyle=c;g.fillRect(x,y,w,d);};
  const pale=dozer?'#e6b260':'#ffd66e',gold=dozer?'#b97c3d':'#eeb34d';
  if(z<8&&dozer)for(const x of [1,27]){
   fill(x,7,8,34,'#293d3d');
   for(let y=7;y<40;y+=4)fill(x,y,8,1,z<5?'#667370':'#48595b');
  }
  if(z<7&&!dozer)for(const x of [2,22])for(const y of [7,33]){
   fill(x,y,5,8,'#283e42');if(z===3)fill(x,y+2,5,4,'#b7b9a8');
  }
  if(z>=4&&z<=12){
   fill(dozer?8:4,dozer?6:2,dozer?20:21,dozer?36:44,z>8?pale:gold);
   if(!dozer&&z>6){fill(4,17,21,3,'#524f42');fill(5,42,5,2,'#fff5c9');fill(19,42,5,2,'#fff5c9');}
   if(dozer){fill(5,25,5,17,'#927141');fill(26,25,5,17,'#927141');}
  }
  if(dozer&&z>=2&&z<=10){
   fill(0,44,w,3,z===10?'#cbd0ba':'#687c77');fill(2,43,w-4,1,'#a3aaa0');
   if(z<=4)fill(0,47,w,1,'#354b4d');
  }
  if(z>=10&&z<(dozer?23:18)){
   const inset=z>15?1:0,cy=dozer?12:14,ch=dozer?15:22;
   fill(8+inset,cy,dozer?19:13-inset*2,ch,z>=(dozer?21:16)?pale:'#45676a');
   if(z<(dozer?21:16)){fill(8+inset,cy,2,ch,gold);fill(dozer?25:18,cy,2,ch,gold);}
   if(dozer)fill(23,34,3,3,'#445b5b');
  }
  if(!dozer&&z>=17)fill(10,21,9,4,z===19?'#f6ecd1':'#76a9a3');
  if(dozer&&z>=22)fill(13,14,12,4,z===25?'#eac27a':'#986a43');
  layers.push(im);
 }
 return {layers,w,d,unit:1};
}

export function landmarkStack(b){
 const w=Math.round(b.w/2),d=Math.round(b.d/2),h=Math.round(b.h/2),layers=[];
 const kind=b.landmark,round=kind==='turret'||kind==='silo';
 for(let z=0;z<h;z++){
  const im=canvas(w+6,d+6),g=im.getContext('2d');
  const box=(x,y,w,d,c)=>{g.fillStyle=c;g.fillRect(x+3,y+3,w,d);};
  if(kind==='tower'){
   const level=z<h*.7?0:z<h*.88?4:8;
   const cap=z%7===0,zRoof=z>h-3;
   box(level,level,w-level*2,d-level*2,zRoof?'#d5ded0':cap?'#aebcb0':'#527b81');
   if(!zRoof){
    box(level,d-level-2,w-level*2,2,cap?'#bbccc2':'#6a959b');
    box(w-level-2,level,2,d-level*2,cap?'#869f9b':'#3b626a');
    if(!cap)for(let x=level+3;x<w-level-3;x+=6)box(x,d-level-2,1,2,'#b9cab6');
   }
  }else if(round){
   const taper=kind==='turret'&&z>h*.74?Math.round((z-h*.74)*.72):kind==='silo'&&z>h*.72?Math.round((z-h*.72)*.68):0;
   g.fillStyle=kind==='silo'?(z%4===0?'#a9c1b4':'#849d91'):z>h*.74?'#4c5364':z%6===0?'#92968d':'#737c7c';
   g.beginPath();g.ellipse(w/2+3,d/2+3,Math.max(2,w*.49-taper),Math.max(2,d*.48-taper),0,0,2*Math.PI);g.fill();
   if(kind==='turret'&&z%21>=9&&z%21<15&&z<h*.68)box(w*.46,d-3,3,2,'#3d4c53');
  }else if(kind==='castle'){
   box(0,0,w,d,z%6===0?'#939890':'#707c7a');
   for(let x=5;x<w-4;x+=11)if(z%19>7&&z%19<13)box(x,d-2,3,2,'#4a585e');
   if(z<19)box(w*.41,d-2,w*.18,2,'#4c575e');
   if(z>h-5){g.clearRect(4,4,w-2,d-2);for(let x=0;x<w-4;x+=9)for(const y of [0,d-4])box(x,y,5,4,'#a0a19a');}
  }else{
   const roof=z>h*.55,margin=roof?Math.floor((z-h*.55)*1.21):0;
   box(roof?margin:1,0,Math.max(3,w-margin*2),d,roof?(z%2?'#664c45':'#79584b'):'#a85146');
   if(!roof){box(w*.34,d-2,w*.32,2,'#574e44');for(let x=4;x<w;x+=6)box(x,0,1,2,'#cb886e');}
  }
  layers.push(im);
 }
 return {layers,w:w+6,d:d+6,unit:2};
}

export function civicStack(type){
 const bus=type==='busStop',w=bus?30:11,d=bus?15:9,h=bus?24:18,layers=[];
 for(let z=0;z<h;z++){
  const im=canvas(w,d),g=im.getContext('2d');
  const box=(x,y,w,d,c)=>{g.fillStyle=c;g.fillRect(x,y,w,d);};
  if(bus){
   for(const x of [2,25])box(x,2,2,2,'#4a6768');
   if(z>6&&z<20)box(3,2,23,1,z%4?'#819e97':'#a8b8a5');
   if(z===6)box(4,6,20,5,'#ab8969');
   if(z>=20)box(0,0,w,d,z===23?'#96baad':'#506e6d');
   box(27,11,2,2,'#537572');if(z>11&&z<19)box(25,11,5,3,'#dce3b8');
  }else{
   box(3,2,5,5,'#69756c');
   if(z>4){box(0,1,11,7,z>15?'#db8366':'#bb584a');if(z===12)box(2,7,7,1,'#564a41');}
  }
  layers.push(im);
 }
 return {layers,w,d,unit:1.35};
}

export function parcelStack(){
 const layers=[],w=10,d=9;
 for(let z=0;z<7;z++){
  const im=canvas(w,d),g=im.getContext('2d');
  g.fillStyle=z===6?'#dbb783':z%2?'#aa8056':'#b68b5d';g.fillRect(1,1,8,7);
  g.fillStyle='#efddb6';g.fillRect(4,1,2,7);
  if(z===6){g.fillStyle='#fbefd0';g.fillRect(2,3,2,3);}
  layers.push(im);
 }
 return {layers,w,d,unit:1};
}
