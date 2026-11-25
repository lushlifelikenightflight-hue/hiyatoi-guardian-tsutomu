export function chooseMusicScene({hidden,enabled,started,monster,paused,map,photo,broken,night}){
 if(hidden||!enabled)return null;
 if(!started)return paused?'menu':'title';
 if(monster)return 'battle';
 if(paused)return 'menu';if(map)return 'map';if(photo)return 'photo';if(broken)return 'repair';return night?'night':'drive';
}
