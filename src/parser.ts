import { SerialItem, createSerialGenerator } from "./serialUtils";
import * as vscode from 'vscode';

const workbenchConfig = vscode.workspace.getConfiguration('workbench');
const config = vscode.workspace.getConfiguration('mdSerializer'); // 获取 setting 里面的配置

const fs = require("fs");

const serialInfos: SerialItem[] = [
  {
    firstNumText: '一', 
    format: '$、'
  },
  {
    firstNumText: '一', 
    format: '（$）'
  },
  {
    firstNumText: '1', 
    format: '$.'
  },
  {
    firstNumText: '1', 
    format: '（$）'
  }
];

const serialGenerators = serialInfos.map(createSerialGenerator);

const directoryStartText =  '<!-- # directory-start -->';
const directoryEndText =  '<!-- # directory-end -->';
const noTocTips = '<!-- no toc ; preventing directory content from being formatted by markdown-all-in-one -->'; // 阻止 markdown-all-in-one 自动添加标题

 // 标题 # 数量少于这个数字，会被忽略；比如设置为 2 的时候，一个 '#'的 标题会忽略
let  baseLevel = 2;

const serialClass = 'serial-header';
let shouldAddDirectory = true; // 是否要目录
let shouldDirectoryLink = true; // 目录是否要跳转
const idType: 'unique' | 'titleRelative' = 'titleRelative'; // titleRelative 标题相关的 : unique 递增

// regExp
const headReg = new RegExp(`^(#{1,})\\s+(.*)$`, 'mg');

const serializedHeaderReg = new RegExp('(<span[^>]+' + serialClass + '[^>]+>)[^<]+(<\\/span>)(.*)$', 'g'); 

const serialSpanReg = new RegExp('(<span [^>]+' + serialClass + '[^>]+>)[^<]+(<\\/span>)', 'g');

const idReg = /id="([^"]+?)"/;

let serialIndexList: number[] = [];
let offset = -1;
let directoryText = directoryStartText;

const idGenerator = createIdGenerator();

export function parser(t: string)  {
  reset();

  if(idType === 'titleRelative') {
    // 基于标题的，要清空
    t = clearSerial(t);
  } else {
    // 唯一 id 模式下，尽量复用 id
    t = clearDirectoryText(t); // 去掉之前的目录
  }

  // 匹配所有标题 ‘###’，解析信息
  t = t.replace(headReg, (m: string, m1: string, m2: string) => {
    if(m1.length < baseLevel) {return m;};
    if(offset === -1) {offset = m1.length;};
  
    const _currentIndex = m1.length - offset;
    let _id = '';
    let _titleText = '';
    let _headerText = '';
  
    serialIndexList[_currentIndex] = serialIndexList[_currentIndex] === undefined ? 0 : (serialIndexList[_currentIndex] + 1); 
  
    serialIndexList = serialIndexList.slice(0, _currentIndex + 1); // 后面的重置
  
    const serialGen = serialGenerators[_currentIndex]; // get serial generator

    const _serialText = serialGen(serialIndexList[_currentIndex] + 1); // serial text, something like "（一）"

    if(m.indexOf(serialClass) > -1) {
      const matches = m.match(idReg);

      _headerText =  m.replace(serializedHeaderReg, (_: string, subM1: string, subM2: string, subM3: string) => {

        _titleText = subM3;
        
        if(matches && matches[1]) {
          _id = matches[1];
    
          return subM1 + _serialText + subM2 + subM3; // 仅仅是替换 序号

        } else {
          _id = idGenerator();

          return createSerialTitle(_id, _serialText, _titleText);

        }

      });

    } else {
      _titleText = m2;

      _id = idType === 'titleRelative' 
        ? titleNormalizer(_serialText + _titleText)
        : idGenerator();

      _headerText =  (
        m1 + 
        ' ' + 
        createSerialTitle(_id, _serialText, _titleText)
      );
    }

    // 生成目录信息
    if(shouldAddDirectory) {
      directoryText += (
        '\n' + 
        ' '.repeat(_currentIndex * 2) + 
        '- ' + 
        (shouldDirectoryLink ?  createLinkText(_id, _serialText, _titleText) : (_serialText + _titleText))
      );  
    }

    return _headerText;
  });

  t.replace(/(\S) ?$/mg, '$1  ');

  return shouldAddDirectory
    ? (directoryText + '\n' + directoryEndText + '\n' + t)
    : t;
}

export function clearSerial(text: string) {
  return clearDirectoryText(text)
    .replace(serialSpanReg, '');
}

// # fn ↓↓↓ 

function reset() {
  serialIndexList = [];
  offset = -1;
  directoryText = directoryStartText + '\n' + noTocTips;
  const options: {[key: string]: any} | undefined = config.get('options') || {} ;

  // 从哪一级开始处理
  baseLevel = Object.hasOwnProperty.call(options, 'startLevel')
    ? Number(options.startLevel)
    : 2;

  // 是否需要添加目录
  shouldAddDirectory = Object.hasOwnProperty.call(options, 'addDirectory')
    ? !!(options.addDirectory)
    : true;

  // 目录是否需要添加 link
  shouldDirectoryLink = Object.hasOwnProperty.call(options, 'directoryLink')
    ? !!(options.directoryLink)
    : true;
}

function createSerialTitle(id: string, serial: string, title: string){
  id = encodeURIComponent(id);
  
  return (
    `<span class="${serialClass}" id="${id}">` + 
    serial + 
    '</span>' + 
    title
  );
}

function clearDirectoryText(text: string) {
  const _startIndex = text.indexOf(directoryStartText);
  const _endIndex = text.indexOf(directoryEndText);
  console.log(_startIndex);

  console.log(_endIndex); 

  if(_startIndex > -1 && _endIndex > -1) {
    text = text.substring(0, _startIndex) + text.substring(_endIndex + directoryEndText.length + 1);
  }

  return text;
}

// []()
function createLinkText(id: string, serial: string,  title: string){
  id = encodeURIComponent(id);
  return `[${serial + title}](#${id})`;
}

// 把标题的 特殊符号去掉（比如 中英括号、顿号），
// 比如 gitlab wiki 就是要把这些符号去掉的
function titleNormalizer(title: string) {
  return title.replace(/[()（）、.\s]/g, '');
}

function createIdGenerator() {
  let num = Date.now();

  return () => {
    num += 1;
    return 'serial' + num;
  };
}