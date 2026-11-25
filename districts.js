export const WEST_EDGE = -3300;
export const EAST_EDGE = 6600;
export const districtDestinations = [
 {id:'west-terrace',name:'西の並木広場',x:-2550,y:2510},
 {id:'east-orchard',name:'東の果樹園通り',x:5850,y:2510}
];
export const districts = [
 {name:'西の街', min:WEST_EDGE, max:0, theme:'west'},
 {name:'東の街', min:3300, max:EAST_EDGE, theme:'east'}
];

// Use the same waypoints for the road surface, navigation and traffic.
const westNorth=[[-2880,420],[-1930,320],[-1090,590],[-340,485],[200,340],[580,340],[580,910],[200,910],[-430,980],[-1190,1130],[-2260,960],[-2990,1160]];
const westMarket=[[-2970,1480],[-2240,1350],[-1390,1570],[-410,1460],[-150,1460],[-110,1700],[-430,1910],[-1060,2150],[-1830,1950],[-2580,2210],[-3020,1980]];
const westGarden=[[-2550,2510],[-1830,2670],[-1040,2540],[-290,2770],[-380,3340],[-1130,3540],[-1910,3320],[-2750,3480],[-3020,3000]];
const eastNorth=[[2600,340],[3080,340],[3630,460],[4250,690],[5050,460],[6150,300],[6330,920],[5450,1130],[4800,980],[4090,1220],[3510,1060],[3090,910],[2600,910]];
const eastMarket=[[3690,1460],[4380,1680],[5160,1420],[6110,1270],[6360,1880],[5730,2210],[5080,1940],[4480,2130],[3850,1920],[3490,1870],[3520,1650]];
const eastGarden=[[3850,2430],[4500,2600],[4950,2370],[5850,2510],[6280,2840],[5970,3470],[5270,3260],[4590,3500],[3800,3300],[3470,2770]];

export const districtTraffic = [
 {theme:'west',points:westNorth,alleys:[0,8,9]},
 {theme:'west',points:westMarket,alleys:[1,7,8,10]},
 {theme:'west',points:westGarden,alleys:[0,1,5,6,8]},
 {theme:'east',points:eastNorth,alleys:[6,7,8]},
 {theme:'east',points:eastMarket,alleys:[3,6,7,10]},
 {theme:'east',points:eastGarden,alleys:[0,1,5,6,7],count:6}
];
// This route crosses the avenue using the existing north and south side streets.
export const sideStreetTraffic={
 points:[eastNorth[8],eastMarket[2],eastMarket[6],eastMarket[5],eastMarket[4],eastMarket[3],
  [6180,1090],eastNorth[6],eastNorth[7]],
 alleys:[0,1,2,4,7,8],count:1
};
export const turningTraffic=[
 {points:[eastMarket[1],eastMarket[2],eastNorth[8],eastNorth[9]],alleys:[1,2,3],count:1},
 {points:[eastMarket[1],eastMarket[2],eastMarket[6],eastMarket[7],eastGarden[1],
  eastGarden[0],eastMarket[9],eastMarket[10],eastMarket[0]],alleys:[1,2,3,4,5,6,7],count:1}
];
const connectors = [
 ['west',[westNorth[0],[-3050,870],westNorth.at(-1),westMarket[0],westMarket.at(-1),westGarden.at(-1)]],
 ['west',[westNorth[1],[-1740,675],westNorth[9],westMarket[2],[-1500,1820],westMarket[8],westGarden[1]]],
 ['west',[westNorth[3],westNorth[8],westMarket[3],westMarket[6],westGarden[3]]],
 ['west',[westMarket[9],[-2770,2410],westGarden[0],[-2220,2860],westGarden[6]]],
 ['west',[westGarden[2],[-1330,2980],westGarden[5]]],
 ['west',[westMarket[4],[200,1460]]],
 ['west',[westGarden[4],[240,3540]]],
 ['east',[eastNorth[3],[4470,1000],eastNorth[9],eastMarket[1],eastMarket[7],eastGarden[1]]],
 ['east',[eastNorth[6],[6180,1090],eastMarket[3]]],
 ['east',[eastNorth[8],eastMarket[2],eastMarket[6],eastGarden[2],eastGarden[6]]],
 ['east',[[3120,1460],[3690,1460]]],
 ['east',[[3020,1940],eastMarket[9],eastGarden[0],eastGarden.at(-1),[3020,2510]]],
 ['east',[eastMarket[5],[5660,2390],eastGarden[3],[5610,2850],eastGarden[6]]],
 ['east',[[2400,3540],[3470,3540],eastGarden[8]]]
];
const isCoreRun=([x],[u])=>x>=0&&x<=3300&&u>=0&&u<=3300;
const road=(a,b,w,theme,alley)=>({
 a,b,w,name:theme==='west'?'西の街':'東の街',theme,alley,park:false,bridge:false
});
export const districtRoads = [
 ...districtTraffic.flatMap(({theme,points,alleys})=>points.flatMap((a,i)=>{
  const b=points[(i+1)%points.length];
  if(isCoreRun(a,b)&&a[0]!==b[0])return [];
  if(isCoreRun(a,b)&&a[0]===b[0]&&[580,2600].includes(a[0]))return [];
  const alley=alleys.includes(i);
  return [road(a,b,alley?44:72,theme,alley)];
 })),
 ...connectors.flatMap(([theme,points],route)=>points.slice(1).map((b,i)=>{
  const alley=![2,5,6,10,11,13].includes(route);
  return road(points[i],b,alley?42:68,theme,alley);
 }))
];

export const districtParks = [
 {id:'west-terrace-green',name:'西の木立',color:'#6d875d',points:[[-2760,2350],[-2460,2250],[-1970,2130],[-1810,2570],[-2440,2460]]},
 {id:'west-lower-green',name:'西の斜面',color:'#779163',points:[[-2570,2960],[-2240,2810],[-1900,2900],[-1940,3250],[-2610,3380]]},
 {id:'east-orchard-green',name:'東の果樹園',color:'#a2aa77',points:[[5210,2330],[5490,2290],[5700,2520],[5530,2830],[5190,2810]]},
 {id:'east-court',name:'東の中庭',color:'#9da687',points:[[4760,2710],[4980,2500],[5190,2800],[5120,3070],[4810,3200]]}
];
