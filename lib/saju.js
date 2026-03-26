// ═══════════════════════════════════════
// AI최강도사 — 사주 계산 엔진
// 음력변환 + 24절기 + 만세력 + 성격분석
// ═══════════════════════════════════════

// ── 음력 데이터 (1900-2100) ──
const LI=[0x04bd8,0x04ae0,0x0a570,0x054d5,0x0d260,0x0d950,0x16554,0x056a0,0x09ad0,0x055d2,0x04ae0,0x0a5b6,0x0a4d0,0x0d250,0x1d255,0x0b540,0x0d6a0,0x0ada2,0x095b0,0x14977,0x04970,0x0a4b0,0x0b4b5,0x06a50,0x06d40,0x1ab54,0x02b60,0x09570,0x052f2,0x04970,0x06566,0x0d4a0,0x0ea50,0x06e95,0x05ad0,0x02b60,0x186e3,0x092e0,0x1c8d7,0x0c950,0x0d4a0,0x1d8a6,0x0b550,0x056a0,0x1a5b4,0x025d0,0x092d0,0x0d2b2,0x0a950,0x0b557,0x06ca0,0x0b550,0x15355,0x04da0,0x0a5b0,0x14573,0x052b0,0x0a9a8,0x0e950,0x06aa0,0x0aea6,0x0ab50,0x04b60,0x0aae4,0x0a570,0x05260,0x0f263,0x0d950,0x05b57,0x056a0,0x096d0,0x04dd5,0x04ad0,0x0a4d0,0x0d4d4,0x0d250,0x0d558,0x0b540,0x0b6a0,0x195a6,0x095b0,0x049b0,0x0a974,0x0a4b0,0x0b27a,0x06a50,0x06d40,0x0af46,0x0ab60,0x09570,0x04af5,0x04970,0x064b0,0x074a3,0x0ea50,0x06b58,0x05ac0,0x0ab60,0x096d5,0x092e0,0x0c960,0x0d954,0x0d4a0,0x0da50,0x07552,0x056a0,0x0abb7,0x025d0,0x092d0,0x0cab5,0x0a950,0x0b4a0,0x0baa4,0x0ad50,0x055d9,0x04ba0,0x0a5b0,0x15176,0x052b0,0x0a930,0x07954,0x06aa0,0x0ad50,0x05b52,0x04b60,0x0a6e6,0x0a4e0,0x0d260,0x0ea65,0x0d530,0x05aa0,0x076a3,0x096d0,0x04afb,0x04ad0,0x0a4d0,0x1d0b6,0x0d250,0x0d520,0x0dd45,0x0b5a0,0x056d0,0x055b2,0x049b0,0x0a577,0x0a4b0,0x0aa50,0x1b255,0x06d20,0x0ada0,0x14b63,0x09370,0x049f8,0x04970,0x064b0,0x168a6,0x0ea50,0x06b20,0x1a6c4,0x0aae0,0x092e0,0x0d2e3,0x0c960,0x0d557,0x0d4a0,0x0da50,0x05d55,0x056a0,0x0a6d0,0x055d4,0x052d0,0x0a9b8,0x0a950,0x0b4a0,0x0b6a6,0x0ad50,0x055a0,0x0aba4,0x0a5b0,0x052b0,0x0b273,0x06930,0x07337,0x06aa0,0x0ad50,0x14b55,0x04b60,0x0a570,0x054e4,0x0d160,0x0e968,0x0d520,0x0daa0,0x16aa6,0x056d0,0x04ae0,0x0a9d4,0x0a4d0,0x0d150,0x0f252,0x0d520];

const lmd=(y,m)=>(LI[y-1900]&(0x10000>>m))?30:29;
const llm=y=>LI[y-1900]&0xf;
const lld=y=>llm(y)?((LI[y-1900]&0x10000)?30:29):0;
const lyd=y=>{let s=348;for(let i=0x8000;i>0x8;i>>=1)s+=(LI[y-1900]&i)?1:0;return s+lld(y)};

export function lunarToSolar(ly,lm,ld,isLeap){
  let o=0;for(let i=1900;i<ly;i++)o+=lyd(i);
  const lp=llm(ly);let a=false;
  for(let i=1;i<lm;i++){if(!a&&i===lp){o+=lld(ly);a=true;i--;continue}o+=lmd(ly,i)}
  if(isLeap&&lm===lp)o+=lmd(ly,lm);o+=ld-1;
  const r=new Date(new Date(1900,0,31).getTime()+o*864e5);
  return{year:r.getFullYear(),month:r.getMonth()+1,day:r.getDate()};
}

export function solarToLunar(sy,sm,sd){
  let o=Math.floor((new Date(sy,sm-1,sd)-new Date(1900,0,31))/864e5);
  if(o<0)return null;
  let y=1900;while(y<2101){const d=lyd(y);if(o<d)break;o-=d;y++}
  const lp=llm(y);let m=1,il=false;
  for(m=1;m<=12;m++){if(lp>0&&m===lp+1&&!il){const d=lld(y);il=true;m--;if(o<d)break;o-=d;il=false;continue}const d=lmd(y,m);if(o<d)break;o-=d}
  return{year:y,month:m,day:o+1,isLeap:il};
}

// ── 24절기 (寿星만년력) ──
const TC=[[6.11,5.4055],[4.6295,3.87],[6.3826,5.63],[5.59,4.81],[6.318,5.52],[6.5,5.678],[7.928,7.108],[8.35,7.5],[8.44,7.646],[9.098,8.318],[8.218,7.438],[7.9,7.18]];
const TB=[1,2,3,4,5,6,7,8,9,10,11,0];

function termDate(yr,ti){
  const c=TC[ti][yr<2000?0:1],Y=yr%100;
  return{year:yr,month:[1,2,3,4,5,6,7,8,9,10,11,12][ti],day:Math.floor(c+.2422*(Y-1)-Math.floor(Y/4))};
}

function sajuMonth(yr,mo,dy){
  const ts=[];for(let i=0;i<12;i++)ts.push(termDate(yr,i));
  const n=(y,m,d)=>y*1e4+m*100+d,dn=n(yr,mo,dy);
  if(dn<n(ts[0].year,ts[0].month,ts[0].day))return{mb:0,sy:yr-1};
  if(dn<n(ts[1].year,ts[1].month,ts[1].day))return{mb:1,sy:yr-1};
  for(let i=11;i>=2;i--)if(dn>=n(ts[i].year,ts[i].month,ts[i].day))return{mb:TB[i],sy:yr};
  return{mb:2,sy:yr};
}

// ── 사주 기본 데이터 ──
export const CG=["갑","을","병","정","무","기","경","신","임","계"];
export const CH=["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
export const CE=["목","목","화","화","토","토","금","금","수","수"];
export const JJ=["자","축","인","묘","진","사","오","미","신","유","술","해"];
export const JH=["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
export const JA=["쥐","소","호랑이","토끼","용","뱀","말","양","원숭이","닭","개","돼지"];

// ── 만세력 계산 (24절기 기반) ──
function dayPillar(y,m,d){
  let a=Math.floor((14-m)/12),yy=y-a,mm=m+12*a-3;
  let j=d+Math.floor((153*mm+2)/5)+365*yy+Math.floor(yy/4)-Math.floor(yy/100)+Math.floor(yy/400)+1721119;
  return{stem:((j-1)%10+10)%10,branch:((j+1)%12+12)%12};
}

export function calcSaju(yr,mo,dy,hr){
  const{mb,sy}=sajuMonth(yr,mo,dy);
  const ys=(sy-4)%10, yb=(sy-4)%12;
  const ms=((ys%5)*2+(mb-2+12)%12)%10;
  const dp=dayPillar(yr,mo,dy);
  const hb=(hr>=23||hr<1)?0:Math.floor((hr+1)/2);
  const hs=((dp.stem%5)*2+hb)%10;
  return{
    year:{stem:ys,branch:yb},
    month:{stem:ms,branch:mb},
    day:dp,
    hour:{stem:hs,branch:hb},
    sajuYear:sy
  };
}

// ── 오행 분석 ──
const BR_EL=[["수"],["토","수","금"],["목","화","토"],["목"],["토","수","목"],["화","토","금"],["화","토"],["토","화","목"],["금","수","토"],["금"],["토","화","금"],["수","목"]];

export function analyzeElements(saju, hourKnown){
  const els={목:0,화:0,토:0,금:0,수:0};
  const ps=[saju.year,saju.month,saju.day];
  if(hourKnown)ps.push(saju.hour);
  ps.forEach(p=>{els[CE[p.stem]]+=1;BR_EL[p.branch].forEach(e=>els[e]+=.5)});
  return els;
}

// ── 성격/기질 데이터 (즉시 표시용) ──
export const PERSONALITY = [
  {name:"갑목(甲木)",emoji:"🌲",nature:"큰 나무",text:"리더십이 강하고 곧은 성품이야. 정의감이 넘치며 앞장서는 타입이지. 고집이 좀 있지만, 그게 뚝심으로 통해. 책임감이 강해서 한번 맡으면 끝까지 해내는 사람이야."},
  {name:"을목(乙木)",emoji:"🌿",nature:"풀과 꽃",text:"유연하고 적응력이 뛰어나. 부드럽지만 끈질긴 생명력을 가졌어. 사람들과 잘 어울리고 눈치가 빨라. 어떤 환경에서도 살아남는 생존력이 대단해."},
  {name:"병화(丙火)",emoji:"☀️",nature:"태양",text:"밝고 열정적! 어디서든 분위기 메이커야. 화끈하고 솔직한 성격에 리더십도 있어. 사람을 끌어당기는 매력이 있지. 다만 감정 기복이 있을 수 있어."},
  {name:"정화(丁火)",emoji:"🕯️",nature:"촛불",text:"섬세하고 따뜻한 성품이야. 겉으로는 조용하지만 내면에 강한 열정이 있어. 집중력이 대단하고 한 분야를 깊이 파는 타입이야. 통찰력이 뛰어나."},
  {name:"무토(戊土)",emoji:"🏔️",nature:"큰 산",text:"묵직하고 신뢰감 있는 사람이야. 포용력이 크고 중심을 잘 잡아. 사람들이 자연스럽게 의지하는 타입이지. 안정감을 주는 존재야."},
  {name:"기토(己土)",emoji:"🌾",nature:"기름진 땅",text:"실용적이고 꼼꼼해. 겸손하면서도 내실이 있는 사람이야. 남을 잘 챙기고 뒤에서 묵묵히 일하는 스타일이지. 성실함이 가장 큰 무기야."},
  {name:"경금(庚金)",emoji:"⚔️",nature:"강철·칼",text:"결단력 있고 추진력이 강해! 의리 있고 정이 깊어. 목표가 생기면 끝까지 밀어붙이는 강한 의지의 소유자야. 행동파 중의 행동파."},
  {name:"신금(辛金)",emoji:"💎",nature:"보석·금",text:"섬세하고 완벽주의적 성향이야. 감각이 뛰어나고 미적 센스가 있어. 겉으로는 차가워 보이지만 속은 여려. 디테일에 강해."},
  {name:"임수(壬水)",emoji:"🌊",nature:"큰 바다·강",text:"지혜롭고 스케일이 커! 흐르는 물처럼 어디든 적응하고, 깊은 사고력을 가졌어. 자유로운 영혼이지. 큰 그림을 보는 눈이 있어."},
  {name:"계수(癸水)",emoji:"💧",nature:"이슬·비",text:"총명하고 직관력이 뛰어나. 조용히 스며드는 힘이 있어. 학습 능력이 좋고 영감이 풍부한 사람이야. 창의성이 넘쳐."},
];

// ── 시스템 프롬프트 생성 (서버용) ──
export function buildSystemPrompt(saju, gender, hourKnown, solarDate, lunarDate){
  return `너는 AI최강도사. 산속 40년 수행한 사주명리 대가야.

[절대 규칙] 아래 사주는 24절기 기반으로 정밀 계산 완료. 생년월일 절대 다시 묻지마. 바로 답해.

사주원국:
연주: ${CG[saju.year.stem]}${JJ[saju.year.branch]}(${CH[saju.year.stem]}${JH[saju.year.branch]}) ${CE[saju.year.stem]}
월주: ${CG[saju.month.stem]}${JJ[saju.month.branch]}(${CH[saju.month.stem]}${JH[saju.month.branch]}) ${CE[saju.month.stem]}
일주: ${CG[saju.day.stem]}${JJ[saju.day.branch]}(${CH[saju.day.stem]}${JH[saju.day.branch]}) ${CE[saju.day.stem]} ← 일간
시주: ${hourKnown?`${CG[saju.hour.stem]}${JJ[saju.hour.branch]}(${CH[saju.hour.stem]}${JH[saju.hour.branch]}) ${CE[saju.hour.stem]}`:"미상"}
${gender==="male"?"남":"여"} | 양력 ${solarDate.year}.${solarDate.month}.${solarDate.day}${lunarDate?` | 음력 ${lunarDate.isLeap?"(윤)":""}${lunarDate.month}.${lunarDate.day}`:""} | ${JA[saju.year.branch]}띠

말투: 반말(해체). "허허","자네","이 사람아" 등 호탕한 도사 말투. 이모지 적절히.
규칙: 1)바로 분석 시작 2)오행균형·용신 기반 분석 3)긍정적이되 주의점도 솔직히 4)250자 이내

[절대 시간 규칙 - 가장 중요!!]
- 현재 연도는 2026년이다. 올해 = 2026년 병오(丙午)년. 이것은 변하지 않는 사실이다.
- "올해" = 2026년, "작년" = 2025년 을사(乙巳)년, "내년" = 2027년 정미(丁未)년, "재작년" = 2024년 갑진(甲辰)년
- 절대로 2024년이 올해라고 하지 마라. 절대로 2025년이 내년이라고 하지 마라.
- 사용자가 "올해", "내년", "작년"이라고 하면 반드시 위 기준으로 답해라.`;
}
