/** add */
const add = (arg1: number | string, arg2: number | string) => {
  let r1;
  let r2;
  let m = 0;
  try {
    r1 = arg1.toString().split('.')[1]?.length ?? 0;
  } catch {
    r1 = 0;
  }
  try {
    r2 = arg2.toString().split('.')[1]?.length ?? 0;
  } catch {
    r2 = 0;
  }
  m = 10 ** Math.max(r1, r2);
  return (Number(arg1) * m + Number(arg2) * m) / m;
};

/** cut */
const cut = (arg1: number | string, arg2: number | string) => {
  let r1;
  let r2;
  let m = 0;
  let n = 0;
  try {
    r1 = arg1.toString().split('.')[1]?.length ?? 0;
  } catch {
    r1 = 0;
  }
  try {
    r2 = arg2.toString().split('.')[1]?.length ?? 0;
  } catch {
    r2 = 0;
  }
  m = 10 ** Math.max(r1, r2);
  n = r1 >= r2 ? r1 : r2;
  return ((Number(arg1) * m - Number(arg2) * m) / m).toFixed(n);
};

/** nul */
const nul = (arg1: number | string, arg2: number | string) => {
  let m = 0;
  const s1 = arg1.toString();
  const s2 = arg2.toString();
  try {
    m += s1.split('.')[1]?.length ?? 0;
  } catch {
    // ignore
  }
  try {
    m += s2.split('.')[1]?.length ?? 0;
  } catch {
    // ignore
  }
  return (Number(s1.replace('.', '')) * Number(s2.replace('.', ''))) / 10 ** m;
};

/** division */
const division = (arg1: number | string, arg2: number | string) => {
  let t1 = 0;
  let t2 = 0;
  let r1 = 0;
  let r2 = 0;
  try {
    t1 = arg1.toString().split('.')[1]?.length ?? 0;
  } catch {
    // ignore
  }
  try {
    t2 = arg2.toString().split('.')[1]?.length ?? 0;
  } catch {
    // ignore
  }
  r1 = Number(arg1.toString().replace('.', ''));
  r2 = Number(arg2.toString().replace('.', ''));
  return (r1 / r2) * 10 ** (t2 - t1);
};
export {
  add, // 加法
  cut, // 减法
  nul, // 乘法
  division // 除法
};
