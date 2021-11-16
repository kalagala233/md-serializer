export interface SerialItem {
  firstNumText: string
  format: string
}

// 1 => '1'
const baseNumFn = (num: number) => num.toString();

// 1 => '一' 中文
const convertToChinese = createCacheForFn(toChineseNumber);

const convertFns = [baseNumFn, convertToChinese];



export function createSerialGenerator(serialInfo: SerialItem): (num: number) => string {
  let matchFn: undefined | ((arg: number) => string ) = undefined;

  for(let fn of convertFns) {
    if(fn(1) === (serialInfo.firstNumText + '').trim()) {
      matchFn = fn;
      break;
    };
  }

  if(!matchFn) {
    matchFn = baseNumFn;
    console.log('unknown firstNumText:' + serialInfo.firstNumText); 
  };

  return serialInfo.format
    ? (num: number) => serialInfo.format.replace('$', matchFn!(num))
    : (num: number) => matchFn!(num);
}

// base fn 

function createCacheForFn(fn: Function) {
  const _map = new Map();

  return (arg: number) => {
    if(_map.has(arg)) {return _map.get(arg);};

    const _result = fn(arg);
    _map.set(arg, _result);
  
    return _result;
  };
}


// 生成中文序号
function toChineseNumber(num: number) {
  if (!Number.isInteger(num) && num < 0) {
    throw Error('请输入自然数');
  }

  const digits = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
  const positions = ['', '十', '百', '千', '万', '十万', '百万', '千万', '亿', '十亿', '百亿', '千亿'];
  const charArray = String(num).split('');
  let result = '';
  let prevIsZero = false;
  //处理0  deal zero
  for (let i = 0; i < charArray.length; i++) {
    const ch = charArray[i];
    if (ch !== '0' && !prevIsZero) {
      result += digits[parseInt(ch)] + positions[charArray.length - i - 1];
    } else if (ch === '0') {
      prevIsZero = true;
    } else if (ch !== '0' && prevIsZero) {
      result += '零' + digits[parseInt(ch)] + positions[charArray.length - i - 1];
    }
  }
  //处理十 deal ten
  if (num < 100) {
    result = result.replace('一十', '十');
  }
  return result;
}