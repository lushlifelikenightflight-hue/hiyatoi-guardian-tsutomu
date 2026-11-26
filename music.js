// Original eight-bar scores. Entries are MIDI notes; null marks a rest.
const themes={
 battle:{bpm:144,roots:[50,46,53,45,50,48,46,45],minor:[0,4],melody:[[74,77,81,79],[77,81,84,81],[81,79,77,74],[76,77,79,81],[86,84,81,79],[77,76,73,76],[81,84,86,84],[81,79,76,73]]},
 title:{bpm:82,roots:[48,45,41,43,48,45,41,43],minor:[1,5],melody:[
  [72,null,76,79],[76,74,72,null],[69,72,76,74],[71,null,74,67],
  [72,76,81,79],[76,null,74,72],[69,72,74,76],[74,71,67,null]]},
 drive:{bpm:112,roots:[50,55,48,53,50,55,48,57],minor:[0,4],melody:[
  [74,77,81,79],[79,74,71,74],[72,76,79,76],[77,81,84,81],
  [81,77,74,77],[79,83,81,74],[76,72,76,79],[76,73,69,null]]},
 night:{bpm:78,roots:[45,41,48,43,45,41,48,43],minor:[0,4],melody:[
  [69,null,72,76],[77,76,72,null],[67,72,null,76],[74,71,67,null],
  [69,72,76,79],[77,null,76,72],[76,74,72,67],[71,74,67,null]]},
 map:{bpm:92,roots:[53,48,50,45,53,48,55,48],minor:[2,3],melody:[
  [77,null,81,84],[79,76,72,76],[74,null,77,81],[76,72,69,null],
  [77,81,84,81],[79,null,76,72],[74,79,77,71],[72,null,76,null]]},
 menu:{bpm:66,roots:[48,52,41,43,48,52,41,43],minor:[1,5],melody:[
  [76,null,72,null],[71,76,null,null],[72,null,69,65],[67,null,71,null],
  [72,76,null,79],[76,null,71,null],[69,null,72,74],[71,null,67,null]]},
 photo:{bpm:104,roots:[48,43,45,41,48,43,45,41],minor:[2,6],melody:[
  [84,79,null,76],[83,null,79,74],[81,76,72,null],[77,null,81,84],
  [88,null,84,79],[83,79,null,74],[81,84,76,null],[77,81,72,null]]},
 repair:{bpm:72,roots:[50,46,53,48,50,46,53,48],minor:[0,4],melody:[
  [69,null,65,62],[65,70,null,69],[65,null,69,72],[67,64,60,null],
  [62,65,69,null],[70,null,74,72],[69,65,60,null],[64,67,72,null]]}
};

const studioTracks={title:'assets/opening-title.ogg',drive:'assets/town-drive.ogg',night:'assets/town-night.ogg',battle:'assets/guardian-battle-instrumental.ogg'};
export const defaultBgmGain=.9;

export class SceneMusic {
 constructor(context){
  this.context=context;
  this.master=context.createGain();
  this.master.gain.value=defaultBgmGain;
  this.master.connect(context.destination);
  this.scene=null;
  this.bus=null;
  this.timer=null;
  this.track=null;
  this.trackCache=new Map();
  this.trackStarts=0;this.trackStartedAt=0;
 }
 setScene(scene){
  if(scene===this.scene)return;
  const context=this.context,now=context.currentTime;
  clearInterval(this.timer);
  if(this.bus){
   const old=this.bus,track=this.track;
   old.gain.cancelScheduledValues(now);
   old.gain.setTargetAtTime(0,now,.095);
   setTimeout(()=>{if(track){track.stop();track.disconnect();}old.disconnect();},1100);
  }
  this.bus=null;
  this.scene=scene;this.track=null;
  if(!scene)return;
  const theme=themes[scene],beat=60/theme.bpm,bus=context.createGain();
  bus.gain.value=0;
  bus.gain.setTargetAtTime(1,now,.16);
  bus.connect(this.master);
  this.bus=bus;
  let bar=0,next=now+.045;
  const schedule=()=>{
   if(context.state!=='running')return;
   const now=context.currentTime;
   if(next<now-.08)next=now+.035;
   while(next<now+.55){
    const chord=bar%8,root=theme.roots[chord],third=theme.minor.includes(chord)?3:4;
    theme.melody[chord].forEach((note,i)=>{
     if(note!==null)this.tone(bus,note,next+i*beat,beat*.83,.084,'sine');
    });
    this.tone(bus,root-12,next,beat*1.5,.09,'sine');
    this.tone(bus,root-5,next+2*beat,beat*1.35,.071,'sine');
    [0,7,third,12,7,third,12,7].forEach((interval,i)=>{
     if((scene==='menu'||scene==='repair')&&i%2===1)return;
     this.tone(bus,root+12+interval,next+i*beat*.5,beat*.66,.029,scene==='drive'?'triangle':'sine');
    });
    if(scene==='drive'||scene==='map'){
     this.tone(bus,31,next,beat*.24,.075,'sine');
     this.tone(bus,81,next+beat*2,beat*.09,.028,'triangle');
    }
    next+=beat*4;
    bar++;
   }
  };
  const track=studioTracks[scene];
  if(!track){schedule();this.timer=setInterval(schedule,95);}
  if(track){
   if(!this.trackCache.has(track)){
    const data=fetch(track).then(r=>{if(!r.ok)throw Error('BGM unavailable');return r.arrayBuffer();})
     .then(bytes=>context.decodeAudioData(bytes)).catch(()=>null);
    this.trackCache.set(track,data);
   }
   this.trackCache.get(track).then(buffer=>{
    if(this.bus!==bus)return;
    if(!buffer){schedule();this.timer=setInterval(schedule,95);return;}
    clearInterval(this.timer);
    const source=context.createBufferSource(),fade=context.createGain();
    source.buffer=buffer;source.loop=true;
    fade.gain.value=0;fade.gain.setTargetAtTime(.80,context.currentTime,.24);
    source.connect(fade).connect(bus);source.start();
    this.track=source;this.trackStartedAt=context.currentTime;this.trackStarts++;
   });
  }
 }
 status(){return {scene:this.scene,context:this.context.state,recorded:Boolean(this.track),loop:this.track?.loop??false,duration:this.track?.buffer?.duration??0,asset:studioTracks[this.scene]??null,starts:this.trackStarts,position:this.track?(this.context.currentTime-this.trackStartedAt)%this.track.buffer.duration:0};}
 tone(bus,midi,start,length,volume,type){
  const context=this.context,osc=context.createOscillator(),gain=context.createGain();
  osc.type=type;
  osc.frequency.value=440*2**((midi-69)/12);
  gain.gain.setValueAtTime(.0001,start);
  gain.gain.exponentialRampToValueAtTime(volume,start+.014);
  gain.gain.exponentialRampToValueAtTime(.0001,start+length+.075);
  osc.connect(gain);
  gain.connect(bus);
  osc.start(start);
  osc.stop(start+length+.09);
  osc.onended=()=>{osc.disconnect();gain.disconnect();};
 }
}
