import { UI_THEME } from './theme.js';

export const inlineKeyboard=(rows=[])=>({inline_keyboard:rows});

export function bannerPhoto(){return UI_THEME.banner?.fileId||null;}

export function brandedText(body='',{title=UI_THEME.name,footer=true}={}){
  const head=title?`*${title}*\n\n`:'';
  const foot=footer&&UI_THEME.footer?`\n\n_${UI_THEME.footer}_`:'';
  return `${head}${body}${foot}`;
}

export function button(text,callback_data){return {text,callback_data};}
export function row(...buttons){return buttons;}

export function backButton(callback_data='menu_main',text='⬅️ BACK'){
  return button(text,callback_data);
}

export function menuPage({title,body='',rows=[],back='menu_main'}={}){
  const finalRows=[...rows];
  if(back)finalRows.push(row(backButton(back)));
  return {text:brandedText(body,{title}),reply_markup:inlineKeyboard(finalRows)};
}
