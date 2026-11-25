export const avenueJunction=[5160,1420];
const approaches=[
 {id:'avenue-west',toward:[4380,1680],group:'avenue',width:72,first:16.4,person:4},
 {id:'avenue-east',toward:[6110,1270],group:'avenue',width:72},
 {id:'side-north',toward:[4800,980],group:'side',width:42,first:11.1,person:2},
 {id:'side-south',toward:[5080,1940],group:'side',width:42}
];

export const intersectionCrossings=approaches.map(({toward,id,group,width,first,person})=>{
 const junction=avenueJunction;
 const angle=Math.atan2(toward[1]-junction[1],toward[0]-junction[0]);
 const x=junction[0]+Math.cos(angle)*73,y=junction[1]+Math.sin(angle)*73;
 const curb=width/2+10,nx=-Math.sin(angle),ny=Math.cos(angle);
 return {
  id,group,width,angle,center:[x,y],junction,first,person,interval:20,
  ends:[[x-nx*curb,y-ny*curb],[x+nx*curb,y+ny*curb]],
  length:width+20
 };
});

export function signalState(group,time){
 const phase=((time%33)+33)%33;
 const walk=phase>=11&&phase<17;
 const flash=phase>=17&&phase<18.5;
 const green=group==='avenue'?phase>=18.5&&phase<29:phase<7;
 const yellow=group==='avenue'?phase>=29&&phase<31:phase>=7&&phase<9;
 return {
  vehicle:green?'green':yellow?'yellow':'red',
  pedestrian:walk?'green':flash?'flash':'red'
 };
}

export const mayStartCrossing=(crossing,time)=>!crossing.group||signalState(crossing.group,time).pedestrian==='green';
