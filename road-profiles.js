export const roadProfiles={alley:{w:36,lanes:1,name:'路地'},local:{w:56,lanes:2,name:'生活道路'},main:{w:84,lanes:2,name:'幹線道路'},avenue:{w:122,lanes:4,name:'大通り'}};
export function profiledRoad(r){const key=r.lanes===4||r.w>=100?'avenue':r.w>=72?'main':r.w<=40?'alley':'local';return {...r,...roadProfiles[key],name:r.name,widthClass:key};}
