// Locally synthesized engine, road texture and breakdown effects.
const motors=[
 {idle:29,rise:1.05,upper:2,filter:170},
 {idle:25,rise:.83,upper:1.5,filter:129},
 {idle:21,rise:.76,upper:2,filter:110},
 {idle:46,rise:1.41,upper:2,filter:220},
 {idle:36,rise:1.27,upper:2.5,filter:250},
 {idle:19,rise:.62,upper:1.7,filter:110},
 {idle:31,rise:1.19,upper:2.2,filter:213},
 {idle:20,rise:.75,upper:1.7,filter:125},
 {idle:27,rise:.98,upper:1.9,filter:160},
 {idle:18,rise:.72,upper:1.6,filter:120},
 {idle:47,rise:.35,upper:1.45,filter:280}
];
export class DriveSound {
 constructor(context){
  this.context=context;
  const buffer=context.createBuffer(1,context.sampleRate,context.sampleRate);
  const data=buffer.getChannelData(0);
  for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
  this.noise=buffer;
  this.master=context.createGain();
  this.master.gain.value=0;
  this.master.connect(context.destination);
  this.filter=context.createBiquadFilter();
  this.filter.type='lowpass';
  this.filter.connect(this.master);
  this.engine=context.createOscillator();
  this.engine.type='triangle';
  this.engine.connect(this.filter);
  this.harmonic=context.createOscillator();
  this.harmonic.type='sawtooth';
  const harmonicGain=context.createGain();
  harmonicGain.gain.value=.22;
  this.harmonic.connect(harmonicGain).connect(this.filter);
  this.road=context.createBufferSource();
  this.road.buffer=buffer;
  this.road.loop=true;
  const roadFilter=context.createBiquadFilter();
  roadFilter.type='bandpass';
  roadFilter.frequency.value=560;
  this.roadGain=context.createGain();
  this.roadGain.gain.value=0;
  this.road.connect(roadFilter).connect(this.roadGain).connect(this.master);
  this.siren=context.createOscillator();
  this.siren.type='sine';
  this.sirenLevel=context.createGain();
  this.sirenLevel.gain.value=0;
  this.siren.connect(this.sirenLevel).connect(context.destination);
  this.siren.start();
  this.engine.start();
  this.harmonic.start();
  this.road.start();
 }
 pause(){
  this.master.gain.setTargetAtTime(0,this.context.currentTime,.055);
  this.sirenLevel.gain.setTargetAtTime(0,this.context.currentTime,.055);
 }
 emergency(distance,phase){
  const now=this.context.currentTime,level=Math.max(0,1-distance/320)*.031;
  this.siren.frequency.setTargetAtTime(630+195*Math.sin(phase*5),now,.065);
  this.sirenLevel.gain.setTargetAtTime(level,now,.085);
 }
 robotTone(kind){const context=this.context,now=context.currentTime;if(context.state!=='running')return;const osc=context.createOscillator(),gain=context.createGain();osc.type=kind==='step'?'triangle':'sawtooth';const f=({step:90,slash:700,hit:180,run:330,start:850,servo:380,stop:140,laser:1350})[kind]??520;osc.frequency.setValueAtTime(f,now);osc.frequency.exponentialRampToValueAtTime(kind==='step'?32:kind==='slash'?160:f*.48,now+.15);gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(kind==='step'?.045:.022,now+.012);gain.gain.exponentialRampToValueAtTime(.0001,now+.18);osc.connect(gain).connect(context.destination);osc.start(now);osc.stop(now+.20);}
 drive(state,input){
  if(state.broken){this.pause();return;}
  const time=this.context.currentTime,motor=motors[state.vehicle]??motors[0],speed=Math.abs(state.speed);
  if(state.vehicle===10){
   if(!this.robotActive){this.robotTone('start');this.robotActive=true;this.robotFoot=Math.floor((state.robotGaitPhase??state.distance/12)/Math.PI);this.robotHeading=state.heading;}
   const foot=Math.floor((state.robotGaitPhase??state.distance/12)/Math.PI);if(state.robotAimAt!==undefined&&state.robotAimAt!==this.robotAimAt){this.robotAimAt=state.robotAimAt;this.robotTone('servo');}if(state.robotWindupAt!==this.robotWindupAt&&state.robotWindupAt!==undefined){this.robotWindupAt=state.robotWindupAt;this.robotTone('servo');}if(speed>4&&foot!==this.robotFoot){this.robotFoot=foot;this.robotTone('step');}
   const running=speed>170;if(running&&!this.robotRunning)this.robotTone('run');if(speed<4&&(this.robotSpeed??0)>10)this.robotTone('stop');if(Math.abs(state.heading-this.robotHeading)>.3&&time>(this.robotServoAt??0)){this.robotTone('servo');this.robotHeading=state.heading;this.robotServoAt=time+.3;}
   if(this.robotHealth!==undefined&&state.health[10]<this.robotHealth&&time>(this.robotHitAt??0)){this.robotTone('hit');this.robotHitAt=time+.2;}this.robotHealth=state.health[10];this.robotRunning=running;this.robotSpeed=speed;
  }else this.robotActive=false;
  const shift=Math.floor(speed/48);
  const rpm=motor.idle+(speed-shift*27)*motor.rise+Math.max(0,input.throttle)*13;
  this.engine.frequency.setTargetAtTime(rpm,time,.075);
  this.harmonic.frequency.setTargetAtTime(rpm*motor.upper,time,.075);
  this.filter.frequency.setTargetAtTime(motor.filter+speed*3+Math.max(0,input.throttle)*62,time,.075);
  this.roadGain.gain.setTargetAtTime(Math.min(.40,speed*.0017)*(state.z>0?.12:1),time,.10);
  this.master.gain.setTargetAtTime(.032+Math.min(.036,speed*.00019),time,.075);
 }
 impact(heavy,level=1){
  const context=this.context,now=context.currentTime;
  if(context.state!=='running')return;
  const duration=heavy?.62:.16;
  const source=context.createBufferSource();
  source.buffer=this.noise;
  const low=context.createBiquadFilter();
  low.type='lowpass';
  low.frequency.setValueAtTime(heavy?560:280,now);
  low.frequency.exponentialRampToValueAtTime(heavy?48:85,now+duration);
  const gain=context.createGain();
  gain.gain.setValueAtTime(.0001,now);
  gain.gain.exponentialRampToValueAtTime((heavy?.17:.068)*level,now+.015);
  gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
  source.connect(low).connect(gain).connect(context.destination);
  source.start(now);source.stop(now+duration+.02);
 }
 weapon(kind){
  if(kind==='robot-rifle'||kind==='beam-sword'){const now=this.context.currentTime;if(now<(this.nextRobotAttack??0))return;this.nextRobotAttack=now+(kind==='beam-sword'?.24:.14);this.robotTone(kind==='beam-sword'?'slash':'laser');return;}
  const context=this.context,now=context.currentTime;if(context.state!=='running'||now<(this.nextWeapon??0))return;
  this.nextWeapon=now+.11;const source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();source.buffer=this.noise;filter.type='bandpass';filter.frequency.value=kind==='machinegun'?1600:kind==='saw'?480:220;filter.Q.value=.7;gain.gain.setValueAtTime(.018,now);gain.gain.exponentialRampToValueAtTime(.0001,now+.10);source.connect(filter).connect(gain).connect(context.destination);source.start(now);source.stop(now+.12);
 }
}
