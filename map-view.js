import {SIZE,WEST_EDGE} from './world.js?v=5.6.0';

const HUD_VIEW_WIDTH=3000;

export function mapView(width,height,state,{large=false,focus=null}={}){
 const worldWidth=SIZE.w-WEST_EDGE;
 const scale=large&&!focus?Math.min((width-42)/worldWidth,(height-42)/SIZE.h):
  width/(large?3300:HUD_VIEW_WIDTH);
 const center=large?(focus??{x:WEST_EDGE+worldWidth/2,y:SIZE.h/2}):state;
 const ox=width/2-center.x*scale,oy=height/2-center.y*scale;
 return {scale,ox,oy,at:(x,y)=>[ox+x*scale,oy+y*scale]};
}
