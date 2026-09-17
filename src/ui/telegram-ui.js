import { THEME, bannerId, label } from './theme.js';

export const inlineKeyboard=(rows=[])=>({inline_keyboard:rows});

export function bannerPhoto(key='main'){return bannerId(key);}

export function brandedText(body='',{title=THEME.brand,footer=true}={}){
  const head=title?`*${title}*\n\n`:'';
  const foot=footer&&THEME.footer?`\n\n_${THEME.footer}_`:'';
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

export function themedLabel(key,fallback){return label(key,fallback);}
