import {decodeSave,encodeSave,createState} from './physics.js?v=5.5.0';
export function readResume(storage,key){try{return decodeSave(storage.getItem(key));}catch{return null;}}
export function beginNewSave(storage,key){
 const previous=storage.getItem(key),trial=storage.getItem(key+'-park-record');
 if(previous!==null)storage.setItem(key+'-before-new-game',previous);
 if(trial!==null)storage.setItem(key+'-park-record-before-new-game',trial);
 const state=createState(),raw=encodeSave(state);
 try{storage.setItem(key,raw);storage.removeItem(key+'-park-record');}
 catch(error){if(previous!==null)storage.setItem(key,previous);else storage.removeItem(key);if(trial!==null)storage.setItem(key+'-park-record',trial);throw error;}
 return state;
}
export function frontTransition(phase,event){
 if(phase==='movie'&&['skip','ended','error'].includes(event))return 'title';
 if(phase==='title'&&event==='activate')return 'menu';
 if(phase==='menu'&&event==='back')return 'title';
 if(phase==='menu'&&event==='new-confirm')return 'confirm';
 if(phase==='confirm'&&event==='cancel')return 'menu';
 if(['menu','confirm'].includes(phase)&&event==='play')return 'playing';
 if(phase==='playing'&&event==='return')return 'title';
 return phase;
}
