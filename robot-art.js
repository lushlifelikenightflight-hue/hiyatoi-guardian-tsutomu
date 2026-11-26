import {makeCanvas} from './canvas-factory.js?v=5.5.0';
import {project,YAW,PITCH,drawSprite,bakeStack} from './art.js?v=5.5.0';
let asset=null;
const sprites=new Map(),UNIT=1.9;
import {robotPose,robotLayerOffset,robotWeapon,rifleBarrel} from './robot-motion.js?v=5.5.0';
export {robotPose,robotLayerOffset};
export async function loadRobotAsset(){if(asset)return;const image=new Image();image.src='assets/robot/destroyking-parts.png?v=5.5.0';await image.decode();const count=80,w=53,d=34;if(image.width!==count*w||image.height!==d*6||image.width%count)throw new Error('ロボの積層画像の寸法が不正です');
 const parts=Array.from({length:6},()=>[]);for(let part=0;part<6;part++)for(let z=0;z<count;z++){const im=makeCanvas(w,d),g=im.getContext('2d');g.drawImage(image,z*w,part*d,w,d,0,0,w,d);if(g.getImageData(0,0,w,d).data.some((v,i)=>i%4===3&&v))parts[part].push({z,image:im});}
 asset={parts,w,d,count};
}
function weaponStack(){const layers=[];for(let z=0;z<12;z++){const im=makeCanvas(18,60),g=im.getContext('2d');g.fillStyle=z<2?'#203744':z>9?'#aab9b0':'#425c6e';g.fillRect(5,3,8,52);g.fillStyle='#243c48';g.fillRect(2,37,14,18);g.fillStyle='#809c9c';g.fillRect(3,20,12,18);g.fillStyle='#d0d1b9';g.fillRect(2,22,3,13);g.fillRect(13,22,3,13);g.fillStyle='#b58e48';g.fillRect(5,30,8,4);g.fillStyle='#25414e';g.fillRect(3,1,5,15);g.fillRect(10,1,5,15);g.fillStyle='#7ce7df';g.fillRect(4,2,3,3);g.fillRect(11,2,3,3);if(z>6){g.fillRect(7,19,4,9);g.fillStyle='#e2d9b7';g.fillRect(6,40,6,7);}if(z>9){g.fillStyle='#263d49';g.fillRect(6,34,6,12);g.fillStyle='#79e9df';g.fillRect(7,33,4,3);}layers.push(im);}return {layers,w:18,d:60};}
export const rifleSpriteTurn=heading=>heading+Math.PI/2+YAW;
let rifle=null;const rifleSprites=new Map();
function bakeRobot(s,pose){
 const frame=Math.floor((((pose.phase%(Math.PI*2))+Math.PI*2)%(Math.PI*2))/(Math.PI*2)*16),angleIndex=((Math.round((s.heading-Math.PI/2+YAW)/(Math.PI*2)*96)%96)+96)%96,weapon=s.hero.robot?.weapon??'rifle',attackStep=Math.round(pose.attack*8),key=[angleIndex,pose.action,frame,attackStep,Math.round(pose.collapse*8),Math.round(pose.aim*8),Math.round(pose.recoil*4),pose.swordStage,Math.round(pose.swordT*8),Math.round(pose.upperYaw*16),weapon].join(':');
 if(sprites.has(key))return sprites.get(key);const image=makeCanvas(230,254),g=image.getContext('2d',{willReadFrequently:true}),anchor={x:115,y:225},angle=angleIndex/96*Math.PI*2;
 const fixed={...pose,phase:frame/16*Math.PI*2,attack:attackStep/8,aim:Math.round(pose.aim*8)/8,recoil:Math.round(pose.recoil*4)/4,swordT:Math.round(pose.swordT*8)/8,upperYaw:Math.round(pose.upperYaw*16)/16},batches=[];
 for(let p=0;p<6;p++)for(const layer of asset.parts[p]){const off=robotLayerOffset(fixed,p,layer.z,weapon),partAngle=angle+(p<4?fixed.upperYaw:0),localX=off.lateral/UNIT,localY=off.forward/UNIT,px=Math.cos(partAngle)*localX-Math.sin(partAngle)*localY,py=Math.sin(partAngle)*localX+Math.cos(partAngle)*localY;let h=layer.z*UNIT+off.lift;if(pose.hurt)h-=2;
 batches.push({layer,px,py,h:h*(1-pose.collapse*.65),depth:h+py*UNIT*PITCH,lean:pose.collapse*h*.3,angle:partAngle});}
 g.imageSmoothingEnabled=false;
 for(const b of batches.sort((a,b)=>a.depth-b.depth)){g.save();g.translate(anchor.x+b.px*UNIT+b.lean,anchor.y+b.py*UNIT*PITCH-b.h);g.scale(UNIT,UNIT*PITCH);g.rotate(b.angle);g.drawImage(b.layer.image,-(asset.w-1)/2,-(asset.d-1)/2);g.restore();}
 // Outline the completed silhouette once, never individual slices.
 const pixels=g.getImageData(0,0,image.width,image.height),copy=new Uint8ClampedArray(pixels.data),w=image.width;
 for(let y=1;y<image.height-1;y++)for(let x=1;x<w-1;x++){const i=(y*w+x)*4;if(copy[i+3])continue;if(copy[i-1]||copy[i+7]||copy[i-w*4+3]||copy[i+w*4+3]){pixels.data[i]=38;pixels.data[i+1]=56;pixels.data[i+2]=58;pixels.data[i+3]=150;}}
 g.putImageData(pixels,0,0);const sprite={image,anchor};sprites.set(key,sprite);if(sprites.size>96)sprites.delete(sprites.keys().next().value);return sprite;
}
export function drawRobot(r,s,alpha=1){if(!asset)return;const pose=robotPose(s),p=r.screen(s.x,s.y,(s.deck??0)+s.z),g=r.g,z=r.zoom;
 g.save();g.fillStyle='rgba(20,42,41,.29)';g.beginPath();g.ellipse(p.x+8*z,p.y+5*z,42*z,22*z,0,0,Math.PI*2);g.fill();drawSprite(g,bakeRobot(s,pose),p.x,p.y,z,alpha);
 const weapon=s.hero.robot?.weapon??'rifle',rig=robotWeapon(s),hand=r.screen(rig.grip.x,rig.grip.y,(s.deck??0)+s.z+rig.grip.height),c=Math.cos(rig.heading),n=Math.sin(rig.heading);
 if(!pose.collapse){if(weapon==='rifle'){rifle??=weaponStack();const key=Math.round(rifleSpriteTurn(rig.barrelHeading)*96/(Math.PI*2)),sprite=rifleSprites.get(key)??bakeStack(rifle,key*Math.PI*2/96,1.1);if(!rifleSprites.has(key)){rifleSprites.set(key,sprite);if(rifleSprites.size>96)rifleSprites.delete(rifleSprites.keys().next().value);}
 const bore=r.screen(rig.grip.x,rig.grip.y,(s.deck??0)+s.z+rig.grip.height+rifleBarrel.boreHeight),muzzle=r.screen(rig.muzzle.x,rig.muzzle.y,(s.deck??0)+s.z+rig.muzzle.height),flat=project(Math.cos(rig.barrelHeading),Math.sin(rig.barrelHeading)),flatAngle=Math.atan2(flat.y,flat.x),shotAngle=Math.atan2(muzzle.y-bore.y,muzzle.x-bore.x),scale=Math.hypot(muzzle.x-bore.x,muzzle.y-bore.y)/(rifleBarrel.reach*z*Math.hypot(flat.x,flat.y));
 g.save();g.translate(bore.x,bore.y);g.rotate(shotAngle);g.scale(Math.max(.1,scale),1);g.rotate(-flatAngle);drawSprite(g,sprite,0,rifleBarrel.boreHeight*z,z,alpha);g.restore();}else{const tip=r.screen(rig.tip.x,rig.tip.y,(s.deck??0)+s.z+rig.tip.height);g.strokeStyle='#d660b1';g.lineWidth=10*z;g.beginPath();g.moveTo(hand.x,hand.y);g.lineTo(tip.x,tip.y);g.stroke();g.strokeStyle='#fff3fb';g.lineWidth=3.5*z;g.stroke();g.fillStyle='#405565';g.fillRect(hand.x-5*z,hand.y-4*z,11*z,8*z);}}
 if(pose.moving&&!r.reduced){const phase=((pose.phase%Math.PI)+Math.PI)%Math.PI,t=phase/.7;if(t<1){const leg=Math.floor(pose.phase/Math.PI)%2?5:4,off=robotLayerOffset(pose,leg,0),side=leg===4?-20:20,c=Math.cos(s.heading),n=Math.sin(s.heading),foot=r.screen(s.x+c*off.forward+n*side,s.y+n*off.forward-c*side,1);g.globalAlpha=alpha*(1-t)*.3;g.fillStyle='#bca98a';g.beginPath();g.ellipse(foot.x,foot.y,(8+t*20)*z,(4+t*10)*z,0,0,Math.PI*2);g.fill();g.globalAlpha=alpha;}}
 const chest=r.screen(s.x+c*15,s.y+n*15,(s.deck??0)+s.z+113);g.fillStyle='#c8ffff';g.globalAlpha=alpha*.8;g.fillRect(chest.x-2*z,chest.y-2*z,4*z,4*z);g.restore();
}
export function robotIcon(){if(!asset)return {image:makeCanvas(1,1),anchor:{x:0,y:0}};const s={heading:2.5,speed:0,distance:0,time:0,hero:{robot:{weapon:'rifle'}}},sprite=bakeRobot(s,robotPose(s)),image=makeCanvas(110,84),g=image.getContext('2d');drawSprite(g,sprite,55,80,.48);return {image,anchor:{x:55,y:80}};}
