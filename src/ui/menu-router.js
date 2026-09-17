import { MENU_CONFIG, menuRows } from './menu-config.js';
import { inlineKeyboard, button, brandedText } from './telegram-ui.js';

export function menuKeyboard(name){
  return inlineKeyboard(menuRows(name,(text,callback_data)=>button(text,callback_data)));
}

export function menuPage(name,{title,body='',back='menu_main'}={}){
  const rows=menuRows(name,(text,callback_data)=>button(text,callback_data));
  if(back)rows.push([button('⬅️ BACK',back)]);
  return {text:brandedText(body,{title}),reply_markup:inlineKeyboard(rows)};
}

export function hasMenu(name){return Array.isArray(MENU_CONFIG[name]);}

export function menuNames(){return Object.keys(MENU_CONFIG);}
