import { SerialItem, createSerialGenerator } from "./serialUtils";

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
const baseLevel = 2; // 标题 # 数量少于这个数字，会被忽略；比如 2 的时候，‘#’ 会忽略
const serialClass = 'serial-header';
const shouldAddDirectory = true; // 是否要目录
const shouldDirectoryLink = true; // 目录是否要跳转
const idType: 'unique' | 'titleRelative' = 'titleRelative'; // titleRelative 标题相关的 : unique 递增

// regExp
const headReg = new RegExp(`^(#{1,})\\s*(.*)$`, 'mg');
const serializedHeaderReg = new RegExp('(<span [^>]+' + serialClass + '[^>]+>)[^<]+(<\\/span>)(.*)$', 'g'); 
const serialSpanReg = new RegExp('(<span [^>]+' + serialClass + '[^>]+>)[^<]+(<\\/span>)', 'g');
const idReg = /id="([^"]+?)"/;

let serialIndexList: number[] = [];
let offset = -1;
let directoryText = directoryStartText;

const idGenerator = createIdGenerator();

const t = `
<!-- # directory-start -->
- <a href="#serial1631441691483">一、ok</a>
- <a href="#serial1631441691484">二、标题</a>
  - <a href="#serial1631441691485">(一)小标题</a>
- <a href="#serial1631441691486">三、标题</a>
  - <a href="#serial1631441691487">(一)小标题 </a>
- <a href="#serial1631441691488">四、标题</a>
  - <a href="#serial1631441691489">(一)小标题</a>
- <a href="#serial1631441691490">五、标题</a>
- <a href="#serial1631441691491">六、标题</a>
- <a href="#serial1631441691492">七、标题</a>
  - <a href="#serial1631441691493">(一)小标题</a>
  - <a href="#serial1631441691494">(二)小标题</a>
  - <a href="#serial1631441691495">(三)小标题</a>
<!-- # directory-end -->
## <span class="serial-header" id="serial1631441691483">一、</span>ok
## <span class="serial-header" id="serial1631441691484">二、</span>标题

### <span class="serial-header" id="serial1631441691485">(一)</span>小标题

## <span class="serial-header" id="serial1631441691486">三、</span>标题

### <span class="serial-header" id="serial1631441691487">(一)</span>小标题 
## <span class="serial-header" id="serial1631441691488">四、</span>标题

### <span class="serial-header" id="serial1631441691489">(一)</span>小标题

## <span class="serial-header" id="serial1631441691490">五、</span>标题
## <span class="serial-header" id="serial1631441691491">六、</span>标题
## <span class="serial-header" id="serial1631441691492">七、</span>标题

### <span class="serial-header" id="serial1631441691493">(一)</span>小标题
### <span class="serial-header" id="serial1631441691494">(二)</span>小标题
### <span class="serial-header" id="serial1631441691495">(三)</span>小标题
`;

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

console.time('a');
console.log(parser(t)); 
console.timeEnd('a');

export function clearSerial(text: string) {
  return clearDirectoryText(text)
    .replace(serialSpanReg, '');
}

console.time('b');
console.log(clearSerial(t)); 
console.timeEnd('b');

// # fn ↓↓↓ 

function reset() {
  serialIndexList = [];
  offset = -1;
  directoryText = directoryStartText;
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