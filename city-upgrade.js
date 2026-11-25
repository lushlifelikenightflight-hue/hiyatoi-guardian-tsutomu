export const landmarks=[
 {id:'glass-quarter',name:'風環タワー',x:1530,y:910,lots:[
  [1450,800,93,79,242,'tower',1850],[1570,787,102,77,193,'tower',1580],[1390,1002,78,46,156,'tower',1320]
 ]},
 {id:'dusk-castle',name:'宵影城',x:-2850,y:6840,lots:[
  [-2860,7100,127,94,112,'castle',2250],[-2911,7073,51,51,171,'turret',1420],[-2811,7132,49,49,158,'turret',1420]
 ]},
 {id:'milk-farm',name:'ひばり牧場',x:-1590,y:6540,lots:[
  [-1455,6565,109,66,56,'barn',220],[-1341,6600,44,44,65,'silo',360],[-1470,6680,71,46,35,'barn',190]
 ]}
];

const curves=[
 {id:'hill-sweep',a:[4140,4660],control:[4534,4285],b:[5200,4410],w:69,theme:'south-hill'},
 {id:'castle-sweep',a:[-2850,6840],control:[-2490,6710],b:[-1760,7280],w:61,theme:'south-market'},
 {id:'coast-sweep',a:[5250,5870],control:[5570,6150],b:[5400,6540],w:68,theme:'south-hill'}
];

export function curveSegments({a,control,b,id,...attributes}){
 const steps=Math.ceil((Math.hypot(control[0]-a[0],control[1]-a[1])+Math.hypot(b[0]-control[0],b[1]-control[1]))/36);
 const point=t=>a.map((v,i)=>(1-t)**2*v+2*(1-t)*t*control[i]+t*t*b[i]);
 const segments=[];
 let last=a,distance=0;
 for(let i=1;i<=steps;i++){
  const next=i===steps?b:point(i/steps);
  segments.push({...attributes,a:last,b:next,curve:id,curveOffset:distance});
  distance+=Math.hypot(next[0]-last[0],next[1]-last[1]);last=next;
 }
 return segments;
}
export const curvedRoads=curves.flatMap(curveSegments);

export const civicPoints=[
 {id:'bus-station',type:'busStop',x:1640,y:973,job:'bus'},
 {id:'bus-castle',type:'busStop',x:-2900,y:6803,job:'bus'},
 {id:'bus-farm',type:'busStop',x:-1518,y:6450,job:'bus'},
 {id:'bus-hill',type:'busStop',x:5246,y:5804,job:'bus'},
 {id:'post-station',type:'mailbox',x:1194,y:988,job:'mail'},
 {id:'post-west',type:'mailbox',x:-2170,y:2030,job:'mail'},
 {id:'post-farm',type:'mailbox',x:-1660,y:6540,job:'mail'},
 {id:'post-hill',type:'mailbox',x:5187,y:5905,job:'mail'}
];

export const civicSignals=[
 {id:'signal-north',x:1110,y:340,arms:[[1,0],[-1,0],[0,1]],offset:0,job:'traffic'},
 {id:'signal-cedar',x:1700,y:910,arms:[[1,0],[-1,0],[0,1],[0,-1]],offset:9,job:'traffic'},
 {id:'signal-south',x:1650,y:4650,arms:[[1,.12],[-1,.08],[0,-1]],offset:15,job:'traffic'}
];
export function civicLight(signal,axis,time){
 const t=(time+signal.offset)%30,phase=axis===0?t:(t+15)%30;
 return phase<11?'green':phase<13?'yellow':'red';
}
export const stationShops=[
 [1774,1519,'喫茶こもれび'],[1831,1519,'駅前書房'],[1888,1519,'街の花屋'],[1945,1519,'小麦堂'],
 [2002,1519,'夕凪食堂'],[2059,1519,'雨音レコード'],[2116,1519,'靴の工房'],[2173,1519,'菓子舗ひより'],
 [2332,1519,'茶舗みどり'],[2389,1519,'自転車と風'],[2446,1519,'青果なずな'],[2503,1519,'まちの文具'],
 [2413,1388,'朝露ベーカリー'],[2470,1388,'日々の器'],[2527,1388,'花時計'],
 [1776,1388,'切符と珈琲'],[1834,1388,'山の道具店'],[1892,1388,'桃色洋品店'],[1950,1388,'風鈴屋']
];
export const stationForecourts=[{x:1980,y:1286,w:228,d:128},{x:2320,y:1286,w:225,d:60}];
