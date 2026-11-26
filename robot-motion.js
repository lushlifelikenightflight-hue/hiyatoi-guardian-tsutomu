import {groundHeight} from './elevation.js?v=5.5.0';
export const rifleBarrel={reach:31.35,boreHeight:6.6,nativeNose:'-y'};
const clamp=x=>Math.max(0,Math.min(1,x)),mix=(a,b,t)=>a+(b-a)*t,smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
export const robotTimings={raise:.22,swordWindup:.24,swordHit:.36,swordEnd:.78};
export function updateRobotAttack(s,dt,firing){
 if(s.vehicle!==10||s.broken){s.robotSwingAt=undefined;s.robotRiflePending=false;return false;}
 const sword=s.hero.robot?.weapon==='sword';
 if(sword){s.robotAimAt=undefined;s.robotAimUntil=undefined;s.robotRiflePending=false;
  if(s.robotSwingAt!==undefined&&s.time-s.robotSwingAt>=robotTimings.swordEnd)s.robotSwingAt=undefined;
  if(s.robotSwingAt===undefined&&firing){s.robotSwingAt=s.time;s.robotSwingHit=false;s.robotSwingTargets=[];s.robotWindupAt=s.time;}
  if(s.robotSwingAt===undefined)return false;
  if(s.time-s.robotSwingAt>=robotTimings.swordHit&&s.time-s.robotSwingAt<.46){s.robotSwingHit=true;return true;}return false;
 }
 s.robotSwingAt=undefined;
 if(firing){if(s.robotAimAt===undefined||s.time>(s.robotAimUntil??-99)+.22){s.robotAimAt=s.time;s.robotRiflePending=true;}s.robotAimUntil=Math.max(s.robotAimUntil??0,s.time+.22,s.robotAimAt+.48);}
 if(s.robotAimAt===undefined||s.time-s.robotAimAt<robotTimings.raise)return false;
 if(s.robotRiflePending){s.robotRiflePending=false;return true;}return firing;
}
export function robotPose(s){
 const moving=Math.abs(s.speed)>4,run=Math.abs(s.speed)>170,phase=s.robotGaitPhase??(s.distance??0)/12,hurt=s.time-(s.robotHurtAt??-99)<.25,collapse=s.broken?Math.min(1,(s.time-(s.breakdownAt??s.time))/1.2):0;
 const swingAge=s.robotSwingAt===undefined?Infinity:s.time-s.robotSwingAt,swordActive=swingAge>=0&&swingAge<robotTimings.swordEnd;
 const swordStage=!swordActive?'none':swingAge<.24?'windup':swingAge<.44?'strike':'recover',swordT=swordStage==='windup'?smooth(swingAge/.24):swordStage==='strike'?smooth((swingAge-.24)/.20):swordStage==='recover'?smooth((swingAge-.44)/.34):0;
 const aim=s.robotAimAt===undefined?0:smooth((s.time-s.robotAimAt)/.22)*smooth(((s.robotAimUntil??s.time)-s.time+.22)/.22),recoil=Math.max(0,1-(s.time-(s.robotShotAt??-99))/.14),attack=swordActive?1-swingAge/.78:aim;
 let action=s.broken?'collapse':hurt?'hurt':swordActive?'sword-'+swordStage:aim>0?(aim<.99?(s.time<(s.robotAimUntil??0)?'rifle-raise':'rifle-lower'):recoil>0?'rifle-fire':'rifle-aim'):moving?(run?'run':'walk'):'idle';
 const m=s.hero?.monster,delta=m?Math.atan2(m.y-s.y,m.x-s.x)-s.heading:0,yaw=Math.atan2(Math.sin(delta),Math.cos(delta)),aimYaw=m&&Math.abs(yaw)<1.1?yaw*aim:0,twist=swordStage==='windup'?-swordT*.38:swordStage==='strike'?mix(-.38,.48,swordT):swordStage==='recover'?.48*(1-swordT):0;
 return {moving,run,phase,stride:moving?(run?23:13):0,lift:moving?(run?15:9):0,attack,hurt,collapse,action,aim,recoil,swordStage,swordT,upperYaw:aimYaw+twist,bob:moving?Math.abs(Math.sin(phase))*2:0};
}
export function robotArm(pose,part){const side=part===2?-1:1,wave=Math.cos(pose.phase+(side<0?Math.PI:0)),neutral={shoulder:[side*39,0,122],elbow:[side*39,4-wave*pose.stride*.2,91],hand:[side*39,8-wave*pose.stride*.5,62]};
 if(pose.aim>0){const t=pose.aim,other=side<0,elbow=other?[-24,24,100]:[40,22,113],hand=other?[26,40,106]:[39,48-pose.recoil*7,108];for(let i=0;i<3;i++){neutral.elbow[i]=mix(neutral.elbow[i],elbow[i],t);neutral.hand[i]=mix(neutral.hand[i],hand[i],t);}}
 if(pose.swordStage!=='none'){
  const t=pose.swordT,raised={elbow:[-42,-8,146],hand:[-37,-26,172]},cut={elbow:[-28,32,113],hand:[-21,66,85]};
  if(part===2){for(let i=0;i<3;i++){neutral.elbow[i]=pose.swordStage==='windup'?mix(neutral.elbow[i],raised.elbow[i],t):pose.swordStage==='strike'?mix(raised.elbow[i],cut.elbow[i],t):mix(cut.elbow[i],neutral.elbow[i],t);neutral.hand[i]=pose.swordStage==='windup'?mix(neutral.hand[i],raised.hand[i],t):pose.swordStage==='strike'?mix(raised.hand[i],cut.hand[i],t):mix(cut.hand[i],neutral.hand[i],t);}}
  else {const brace=pose.swordStage==='recover'?1-t:pose.swordStage==='windup'?t:1;neutral.hand[1]-=brace*20;neutral.hand[2]+=brace*18;}
 }return neutral;
}
export function robotLayerOffset(pose,part,z){let forward=0,lift=0,lateral=0;
 if(part>=4){const phase=pose.phase+(part===4?Math.PI:0),p=((phase%(Math.PI*2))+Math.PI*2)%(Math.PI*2),t=Math.max(0,1-z/39),foot=-Math.cos(p)*pose.stride;forward=foot*t;lift=(p<Math.PI?Math.sin(p)*pose.lift:0)*t;}
 else if(part===2||part===3){const arm=robotArm(pose,part),upper=z>=49,t=clamp(upper?(66-z)/17:(49-z)/21),a=upper?arm.shoulder:arm.elbow,b=upper?arm.elbow:arm.hand;lateral=mix(a[0],b[0],t)-(part===2?-39:39);forward=mix(a[1],b[1],t);lift=mix(a[2],b[2],t)-z*1.9;}
 else {lift=pose.bob??0;if(pose.run)forward=z*.06;}
 return {forward,lift,lateral};
}
export function robotWeapon(s){const pose=robotPose(s),sword=s.hero.robot?.weapon==='sword',hand=robotArm(pose,sword?2:3).hand,heading=s.heading+pose.upperYaw,c=Math.cos(heading),n=Math.sin(heading),world=(side,forward,height)=>({x:s.x+c*forward+n*side,y:s.y+n*forward-c*side,height});
 const grip=world(hand[0],hand[1],hand[2]);let barrelHeading=heading,barrelPitch=0;
 const target=s.hero?.monster,delta=target?Math.atan2(target.y-s.y,target.x-s.x)-s.heading:0;
 if(!sword&&target?.hp>0&&Math.hypot(target.x-s.x,target.y-s.y)<=700&&Math.abs(Math.atan2(Math.sin(delta),Math.cos(delta)))<1.1){barrelHeading=Math.atan2(target.y-grip.y,target.x-grip.x);const distance=Math.hypot(target.x-grip.x,target.y-grip.y),height=groundHeight(target.x,target.y)+80-(groundHeight(grip.x,grip.y)+(s.deck??0)+(s.z??0)+grip.height+rifleBarrel.boreHeight);barrelPitch=Math.max(-.65,Math.min(.65,Math.atan2(height,distance)));}
 const muzzle={x:grip.x+Math.cos(barrelHeading)*rifleBarrel.reach*Math.cos(barrelPitch),y:grip.y+Math.sin(barrelHeading)*rifleBarrel.reach*Math.cos(barrelPitch),height:grip.height+rifleBarrel.boreHeight+rifleBarrel.reach*Math.sin(barrelPitch)};muzzle.height+=groundHeight(grip.x,grip.y)-groundHeight(muzzle.x,muzzle.y);let tipForward=65,tipHeight=35;
 if(pose.swordStage==='windup'){tipForward=mix(65,-20,pose.swordT);tipHeight=mix(35,88,pose.swordT);}else if(pose.swordStage==='strike'){tipForward=mix(-20,100,pose.swordT);tipHeight=mix(88,-82,pose.swordT);}else if(pose.swordStage==='recover'){tipForward=mix(100,65,pose.swordT);tipHeight=mix(-82,35,pose.swordT);}
 return {pose,heading,barrelHeading,barrelPitch,grip,muzzle:sword?grip:muzzle,tip:world(hand[0],hand[1]+tipForward,hand[2]+tipHeight)};
}
export function weaponMuzzle(s){return s.vehicle===10?robotWeapon(s).muzzle:{x:s.x,y:s.y,height:17};}
