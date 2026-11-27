import {segmentDistance} from './geometry.js?v=5.6.0';

export const parkGates=[
 [1050,2709],[1438,2701],[1306,2984],[680,3010],[535,2788],[1050,2709]
].map(([x,y],i)=>({x,y,id:'park-gate-'+i,name:i===0?'スタート':i===5?'ゴール':i+' / 4'}));

export function beginParkTrial(){
 return {gate:0,startedAt:null};
}

export function updateParkTrial(trial,player,previous){
 const gate=parkGates[trial.gate];
 if(player.broken)return {type:'failed'};
 if(!gate||player.z>18||Math.hypot(player.x-previous[0],player.y-previous[1])<.02||
    Math.hypot(player.x-previous[0],player.y-previous[1])>140)return null;
 if(segmentDistance(gate.x,gate.y,{a:previous,b:[player.x,player.y]})>34)return null;
 trial.gate++;
 if(trial.startedAt===null){trial.startedAt=player.time;return {type:'started'};}
 if(trial.gate===parkGates.length)return {type:'finished',seconds:player.time-trial.startedAt};
 return {type:'gate'};
}
