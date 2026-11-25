// Terrain and materials follow the same district boundaries as the places on the map.
export const districtStyles={
 station:{ground:'#9fa387',flecks:['#90977e','#b1b199','#a39884'],wall:'#bdac99',roof:'#546d69',accent:'#c79966'},
 west:{ground:'#a69a79',flecks:['#93886b','#b6a381','#8f946e'],wall:'#b69871',roof:'#73574e',accent:'#c28257'},
 east:{ground:'#a1aaa1',flecks:['#879d95','#b4b9a8','#9caaa1'],wall:'#a7bcb8',roof:'#557c83',accent:'#92bbba'},
 park:{ground:'#899e75',flecks:['#718d62','#a1ad7e','#659379'],wall:'#b5ab85',roof:'#506f63',accent:'#a6c69f'},
 market:{ground:'#b6a37b',flecks:['#9f946d','#c2af88','#a99b77'],wall:'#d1ad8b',roof:'#7d6454',accent:'#d79f6a'},
 water:{ground:'#8fa898',flecks:['#809c8d','#9bb2a1','#91a883'],wall:'#bbc8b4',roof:'#507b78',accent:'#89bcaf'},
 hill:{ground:'#a7ab80',flecks:['#919c70','#bcc494','#aa9fa0'],wall:'#d8ccae',roof:'#776f85',accent:'#c0a6bd'},
 terminus:{ground:'#adb09b',flecks:['#969f89','#bebba3','#9ea69a'],wall:'#c2c4af',roof:'#5c7770',accent:'#d3b880'}
};

export function districtAt(x,y){
 if(y>=6900&&x>=3800)return 'terminus';
 if(y>=3900)return x<400?'market':x<3750?'water':'hill';
 if(x<0)return 'west';
 if(x>3300)return 'east';
 return y>=1580?'park':'station';
}

export const groundDistricts=[
 ['west',-3200,120,3200,3780],['station',0,120,3300,1460],
 ['park',0,1580,3300,2320],['east',3300,120,3200,3780],
 ['market',-3200,3900,3600,3780],['water',400,3900,3350,3780],
 ['hill',3750,3900,2750,3780],['terminus',3800,6900,2700,780]
];
