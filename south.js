// Authored road loops, waterfront and public spaces south of the original map.
export const NORTH_LIMIT=3900;
export const SOUTH_LIMIT=7800;
const west=[[-2810,4660],[-1770,4350],[-700,4570],[350,4750],[420,5480],[-420,5810],[-1550,5520],[-2760,5720]];
const shore=[[350,4750],[1650,4650],[2690,4780],[3570,5060],[3650,6170],[2830,6540],[1650,6600],[720,6380],[-420,5810],[420,5480]];
const hill=[[3570,5060],[4140,4660],[5200,4410],[6070,4770],[6140,5810],[6160,6680],[5650,7020],[4910,6850],[3650,6170]];
const low=[[-2760,5720],[-2850,6840],[-1760,7280],[-530,7060],[720,6380],[1650,6600],[2830,6540],[3650,6170],[4910,6850],[5650,7020],[6160,6680]];
export const southTraffic=[
 {points:west,alleys:[6],count:3},
 {points:shore,alleys:[],count:4},
 {points:hill,alleys:[1],count:4}
];
const connectors=[
 [[-2750,3480],[-2860,4020],west[0]],
 [[-380,3340],[-330,4020],west[2]],
 [[1380,3540],[1525,4070],shore[1]],
 [[3470,3540],[3260,4150],shore[2]],
 [[4590,3500],[4530,4050],hill[1]],
 [[5970,3470],[6110,4100],hill[3]],
 [west[7],low[1],low[2],low[3],low[4]],
 [west[6],[-1560,6460],low[2]],
 [west[5],[-560,6490],low[3]],
 [low[5],[1690,7350],[2900,7220],low[6]],
 [[1690,7350],[520,7330],low[3]],
 [low[6],[3620,7220],[4520,7040],hill[7]],
 [hill[4],[5250,5870],[4580,5650],hill[0]],
 [[5250,5870],[5400,6540],hill[6]],
 [hill[6],[5520,7210],[5520,7590]],
 [[5520,7210],[5070,7220],[4770,7220],[4520,7040]],
 [low[2],[-2480,7490],[-2850,6840]]
];
export const southernWater=[
 [910,5350],[1460,5220],[2040,5265],[2700,5400],[3020,5600],[3060,5990],
 [2700,6230],[2110,6250],[1580,6120],[1070,6185],[720,5950],[750,5580]
];
const bridge=[[1650,5160],[1650,6300]];
export const southRoads=[];
const edges=new Set();
function addRoad(a,b,theme,alley=false,overWater=false){
 const key=[a.join(','),b.join(',')].sort().join('/');
 if(edges.has(key))return;
 edges.add(key);
 southRoads.push({a,b,w:overWater?76:alley?48:76,name:'南の街',theme,park:false,alley,bridge:overWater});
}
for(const [i,{points,alleys}] of southTraffic.entries()){
 const theme=['south-market','south-water','south-hill'][i];
 points.forEach((a,j)=>addRoad(a,points[(j+1)%points.length],theme,alleys.includes(j)));
}
for(const path of connectors)path.slice(1).forEach((b,i)=>addRoad(path[i],b,'south-lane',i>0&&path.length>=4));
addRoad(shore[1],bridge[0],'south-water');
addRoad(...bridge,'south-water',false,true);
addRoad(bridge[1],shore[6],'south-water');

export const southDestinations=[
 {id:'south-market',name:'杏灯の市',x:-1450,y:4420},
 {id:'south-lock',name:'白波水門',x:1650,y:6460},
 {id:'south-hill',name:'花帆の丘',x:5250,y:5870},
 {id:'south-station',name:'花帆駅前',x:5070,y:7220}
];
export const southNames=[
 ['杏灯の市',-1550,4750],['白波水門',1900,5790],['花帆の丘',5060,5180],['花帆駅',5020,7420]
];
export const southParks=[
 {id:'south-orchard',color:'#8d995e',points:[[-2750,4990],[-1890,4810],[-1290,5230],[-1500,5480],[-2700,5550]]},
 {id:'south-wetland',color:'#759b80',points:[[660,5520],[1280,5240],[2860,5340],[3320,5880],[2860,6430],[720,6530],[290,6070]]},
 {id:'south-terraces',color:'#9caa73',points:[[3870,4950],[4820,4620],[5350,4720],[5940,5220],[5970,5730],[5410,5760],[4750,5440],[3940,5470]]},
 {id:'south-pine',color:'#758f68',points:[[-2700,5870],[-1870,5700],[-1560,6450],[-1850,7120],[-2600,6780]]}
];
function plaza(id,x,y,w,h,color){
 return {id,x,y,w,h,color,points:[[x-w/2,y-h/2],[x+w/2,y-h/2],[x+w/2,y+h/2],[x-w/2,y+h/2]]};
}
export const southPlazas=[
 plaza('market',-1350,4630,325,190,'#c3ae8a'),
 plaza('lock',1920,6430,280,122,'#b7c4ae'),
 plaza('hill',4990,5780,300,154,'#c9bd9c'),
 plaza('station',5030,7310,340,100,'#c9c3a8')
];
const styles=['awning','bikeRack','kiosk','flowerBed','parasol','noticeboard','hydrant','hedge'];
export const southFixtures=southPlazas.flatMap((p,i)=>[
 ...[-1,1].flatMap(side=>[-1,0,1].map((k,j)=>({id:'south-'+p.id+'-'+side+'-'+j,type:styles[(i*2+j+(side===1?3:0))%styles.length],x:p.x+k*p.w*.31,y:p.y+side*p.h*.32}))),
 {id:'south-'+p.id+'-center',type:i===1?'fountain':i===3?'noticeboard':'flowerBed',x:p.x,y:p.y},
 ...[-1,1].map(side=>({id:'south-'+p.id+'-lamp-'+side,type:'lantern',x:p.x+side*p.w*.47,y:p.y}))
]);
export const southWalks=southPlazas.map(({x,y,w,h},i)=>({
 id:'south-walk-'+i,count:6,
 points:[[x-w*.44,y-h*.14],[x-w*.23,y-h*.16],[x+w*.26,y-h*.16],[x+w*.43,y-h*.10],
 [x+w*.43,y+h*.17],[x+w*.23,y+h*.18],[x-w*.23,y+h*.18],[x-w*.44,y+h*.12]]
}));
