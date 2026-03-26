'use client';
import { useState, useRef, useEffect } from 'react';
import { calcSaju, lunarToSolar, solarToLunar, analyzeElements, buildSystemPrompt, PERSONALITY, CG, CH, CE, JJ, JH, JA } from '../lib/saju';

const EC = { 목:'#4CAF50', 화:'#EF5350', 토:'#FFA726', 금:'#E0E0E0', 수:'#42A5F5' };
const EI = { 목:'🌿', 화:'🔥', 토:'⛰️', 금:'⚔️', 수:'🌊' };
const CC = ['#4CAF50','#66BB6A','#EF5350','#E53935','#FFA726','#FB8C00','#BDBDBD','#9E9E9E','#42A5F5','#1E88E5'];

function Pillar({ label, stem, branch, delay }) {
  const c = CC[stem];
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, animation:`fadeUp .6s ease ${delay}s both` }}>
      <span style={{ fontSize:11, color:'#8B8680', letterSpacing:1 }}>{label}</span>
      <div style={{ width:72, height:72, borderRadius:12, background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.08)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:2, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:40, height:2, borderRadius:1, background:c, opacity:.6 }}/>
        <span style={{ fontSize:22, color:c, fontWeight:600 }}>{CH[stem]}</span>
        <span style={{ fontSize:18, color:'#C4BFB6' }}>{JH[branch]}</span>
      </div>
      <span style={{ fontSize:12, color:c }}>{CG[stem]}{JJ[branch]}</span>
      <span style={{ fontSize:10, color:EC[CE[stem]], background:`${EC[CE[stem]]}15`, padding:'2px 8px', borderRadius:20 }}>{CE[stem]}</span>
    </div>
  );
}

function OhBar({ els }) {
  const mx = Math.max(...Object.values(els));
  return (
    <div style={{ display:'flex', gap:6, justifyContent:'center', padding:'8px 0' }}>
      {['목','화','토','금','수'].map(n => (
        <div key={n} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, width:48 }}>
          <div style={{ width:32, height:60, background:'rgba(255,255,255,.04)', borderRadius:6, position:'relative', overflow:'hidden', border:'1px solid rgba(255,255,255,.06)' }}>
            <div style={{ position:'absolute', bottom:0, width:'100%', height:`${(els[n]/mx)*100}%`, background:EC[n], opacity:.5, borderRadius:'0 0 5px 5px', transition:'height .8s ease' }}/>
          </div>
          <span style={{ fontSize:11, color:EC[n] }}>{EI[n]}{n}</span>
          <span style={{ fontSize:10, color:'#5A5650' }}>{els[n].toFixed(1)}</span>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const [step, setStep] = useState('input');
  const [form, setForm] = useState({ year:'', month:'', day:'', hour:'-1', gender:'', cal:'solar', leap:false });
  const [saju, setSaju] = useState(null);
  const [sol, setSol] = useState(null);
  const [lun, setLun] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [inp, setInp] = useState('');
  const [typing, setTyping] = useState(false);
  const [err, setErr] = useState('');
  const endRef = useRef(null);
  const sysRef = useRef('');

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:'smooth' }); }, [msgs, typing]);

  const hrs = [
    {v:'-1',l:'모름'},{v:'0',l:'자시 (23:30~01:30)'},{v:'2',l:'축시 (01:30~03:30)'},
    {v:'4',l:'인시 (03:30~05:30)'},{v:'6',l:'묘시 (05:30~07:30)'},{v:'8',l:'진시 (07:30~09:30)'},
    {v:'10',l:'사시 (09:30~11:30)'},{v:'12',l:'오시 (11:30~13:30)'},{v:'14',l:'미시 (13:30~15:30)'},
    {v:'16',l:'신시 (15:30~17:30)'},{v:'18',l:'유시 (17:30~19:30)'},{v:'20',l:'술시 (19:30~21:30)'},
    {v:'22',l:'해시 (21:30~23:30)'},
  ];
  const ok = form.year && form.month && form.day && form.gender;
  const is = { padding:'14px 12px', fontSize:16, background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:10, color:'#E8E4DD', fontFamily:'inherit' };

  function submit() {
    if (!ok) return;
    setErr('');
    const y=+form.year, m=+form.month, d=+form.day, h=+form.hour;
    if (y<1920||y>2050||m<1||m>12||d<1||d>31) { setErr('올바른 날짜를 입력해주세요.'); return; }

    let solar, lunar;
    if (form.cal === 'lunar') {
      try { solar = lunarToSolar(y,m,d,form.leap); if (!solar?.year) { setErr('음력 변환 실패'); return; }
        lunar = {year:y,month:m,day:d,isLeap:form.leap};
      } catch { setErr('음력 변환 실패'); return; }
    } else { solar = {year:y,month:m,day:d}; lunar = solarToLunar(y,m,d); }

    setSol(solar); setLun(lunar);
    const s = calcSaju(solar.year, solar.month, solar.day, h===-1?12:h);
    setSaju(s);
    sysRef.current = buildSystemPrompt(s, form.gender, h!==-1, solar, lunar);
    setMsgs([]);
    setStep('result');
  }

  // 스트리밍 채팅 (서버 API를 통해 Claude 호출)
  async function chat(customMsg) {
    const userMsg = customMsg || inp.trim();
    if (!userMsg || typing) return;
    if (!customMsg) setInp('');

    const newMsgs = [...msgs, { role:'user', content:userMsg }];
    setMsgs([...newMsgs, { role:'assistant', content:'' }]);
    setTyping(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMsgs.map(m => ({ role:m.role, content:m.content })),
          systemPrompt: sysRef.current,
        }),
      });

      if (!res.ok) throw new Error('API 오류');

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let full = '', buf = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop();
        for (const ln of lines) {
          if (!ln.startsWith('data: ')) continue;
          const d = ln.slice(6).trim();
          if (!d || d === '[DONE]') continue;
          try {
            const p = JSON.parse(d);
            if (p.type === 'content_block_delta' && p.delta?.text) {
              full += p.delta.text;
              setMsgs(prev => {
                const copy = [...prev];
                copy[copy.length - 1] = { role:'assistant', content: full };
                return copy;
              });
            }
          } catch {}
        }
      }

      if (!full) {
        setMsgs(prev => {
          const copy = [...prev];
          copy[copy.length - 1] = { role:'assistant', content:'허허... 다시 물어봐줘.' };
          return copy;
        });
      }
    } catch {
      setMsgs(prev => {
        const copy = [...prev];
        copy[copy.length - 1] = { role:'assistant', content:'기운이 잠시 끊겼구만. 다시 시도해봐! 🌀' };
        return copy;
      });
    }
    setTyping(false);
  }

  const ds = saju?.day?.stem ?? 0;
  const persona = PERSONALITY[ds];
  const quickQ = ['2026년 재물운은? 💰','직장운·적성은? 🎯','연애운은? ❤️','건강 주의할 점은? 🏥','이직·이사 시기는?','올해 운세 총평은?'];

  return (
    <div style={{ minHeight:'100vh' }}>
      {/* 헤더 */}
      <div style={{ textAlign:'center', padding:'40px 20px 20px', animation:'fadeIn .8s' }}>
        <div style={{ fontSize:11, color:'#C6A96C', letterSpacing:6, marginBottom:8 }}>황성진의</div>
        <h1 style={{ fontSize:28, fontWeight:300, letterSpacing:2 }}>AI 최강도사</h1>
        <div style={{ width:40, height:1, background:'linear-gradient(90deg,transparent,#C6A96C,transparent)', margin:'12px auto 0' }}/>
        <p style={{ fontSize:12, color:'#5A5650', marginTop:10 }}>24절기 기반 정밀 사주 · AI 실시간 상담 ✨</p>
      </div>

      {/* 입력 폼 */}
      {step === 'input' && (
        <div style={{ maxWidth:400, margin:'0 auto', padding:'20px 24px 40px', animation:'fadeUp .6s' }}>
          <div style={{ marginBottom:24 }}>
            <label style={{ fontSize:12, color:'#8B8680', letterSpacing:1, display:'block', marginBottom:10 }}>달력 구분</label>
            <div style={{ display:'flex', gap:8 }}>
              {[{v:'solar',l:'양력',s:'陽曆'},{v:'lunar',l:'음력',s:'陰曆'}].map(c => (
                <button key={c.v} onClick={() => setForm({...form, cal:c.v, leap:false})}
                  style={{ flex:1, padding:'14px', fontSize:15, background:form.cal===c.v?'rgba(198,169,108,.12)':'rgba(255,255,255,.04)', border:form.cal===c.v?'1px solid rgba(198,169,108,.4)':'1px solid rgba(255,255,255,.08)', borderRadius:10, color:form.cal===c.v?'#C6A96C':'#8B8680', cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                  <span>{c.l}</span><span style={{ fontSize:12, opacity:.5 }}>{c.s}</span>
                </button>
              ))}
            </div>
            {form.cal === 'lunar' && (
              <div onClick={() => setForm({...form, leap:!form.leap})}
                style={{ display:'flex', alignItems:'center', gap:8, marginTop:10, fontSize:13, color:'#8B8680', cursor:'pointer' }}>
                <div style={{ width:18, height:18, borderRadius:4, border:form.leap?'1px solid #C6A96C':'1px solid rgba(255,255,255,.15)', background:form.leap?'rgba(198,169,108,.2)':'transparent', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {form.leap && <span style={{ color:'#C6A96C' }}>✓</span>}
                </div>
                <span>윤달 (閏月)</span>
              </div>
            )}
          </div>

          <div style={{ marginBottom:24 }}>
            <label style={{ fontSize:12, color:'#8B8680', letterSpacing:1, display:'block', marginBottom:10 }}>
              {form.cal === 'lunar' ? '음력 생년월일' : '양력 생년월일'}
            </label>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
              <input type="number" placeholder="1990" value={form.year} onChange={e => setForm({...form, year:e.target.value})} style={{...is, width:'100%', textAlign:'center'}}/>
              <input type="number" placeholder="월" value={form.month} onChange={e => setForm({...form, month:e.target.value})} style={{...is, width:'100%', textAlign:'center'}}/>
              <input type="number" placeholder="일" value={form.day} onChange={e => setForm({...form, day:e.target.value})} style={{...is, width:'100%', textAlign:'center'}}/>
            </div>
          </div>

          <div style={{ marginBottom:24 }}>
            <label style={{ fontSize:12, color:'#8B8680', letterSpacing:1, display:'block', marginBottom:10 }}>태어난 시간</label>
            <select value={form.hour} onChange={e => setForm({...form, hour:e.target.value})}
              style={{...is, width:'100%', fontSize:15, background:'#1A1916', appearance:'none',
                backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M3 5l3 3 3-3' fill='none' stroke='%238B8680' stroke-width='1.5'/%3E%3C/svg%3E")`,
                backgroundRepeat:'no-repeat', backgroundPosition:'right 14px center' }}>
              {hrs.map(h => <option key={h.v} value={h.v}>{h.l}</option>)}
            </select>
          </div>

          <div style={{ marginBottom:32 }}>
            <label style={{ fontSize:12, color:'#8B8680', letterSpacing:1, display:'block', marginBottom:10 }}>성별</label>
            <div style={{ display:'flex', gap:10 }}>
              {[{v:'male',l:'남성',i:'♂'},{v:'female',l:'여성',i:'♀'}].map(g => (
                <button key={g.v} onClick={() => setForm({...form, gender:g.v})}
                  style={{ flex:1, padding:'14px', fontSize:15, background:form.gender===g.v?'rgba(198,169,108,.12)':'rgba(255,255,255,.04)', border:form.gender===g.v?'1px solid rgba(198,169,108,.4)':'1px solid rgba(255,255,255,.08)', borderRadius:10, color:form.gender===g.v?'#C6A96C':'#8B8680', cursor:'pointer', fontFamily:'inherit' }}>
                  {g.i} {g.l}
                </button>
              ))}
            </div>
          </div>

          {err && <div style={{ color:'#EF5350', fontSize:13, marginBottom:16, textAlign:'center' }}>{err}</div>}

          <button onClick={submit} disabled={!ok}
            style={{ width:'100%', padding:'16px', fontSize:16, fontFamily:'inherit', background:ok?'linear-gradient(135deg,#C6A96C,#A68B4B)':'rgba(255,255,255,.06)', color:ok?'#0F0E0C':'#5A5650', border:'none', borderRadius:12, cursor:ok?'pointer':'default', fontWeight:500, letterSpacing:1 }}>
            AI최강도사에게 사주 보기 🔮
          </button>
        </div>
      )}

      {/* 결과 + 채팅 */}
      {step === 'result' && saju && (
        <div style={{ maxWidth:480, margin:'0 auto', padding:'0 16px 140px', animation:'fadeUp .4s' }}>
          {/* 사주 카드 */}
          <div style={{ display:'flex', justifyContent:'center', gap:12, padding:'12px 0 16px' }}>
            <Pillar label="시주" stem={saju.hour.stem} branch={saju.hour.branch} delay={.1}/>
            <Pillar label="일주" stem={saju.day.stem} branch={saju.day.branch} delay={.2}/>
            <Pillar label="월주" stem={saju.month.stem} branch={saju.month.branch} delay={.3}/>
            <Pillar label="연주" stem={saju.year.stem} branch={saju.year.branch} delay={.4}/>
          </div>
          <div style={{ fontSize:12, color:'#5A5650', textAlign:'center', marginBottom:2 }}>
            양력 {sol.year}.{sol.month}.{sol.day}{lun && ` · 음력 ${lun.isLeap?'(윤)':''}${lun.month}.${lun.day}`}
          </div>
          <div style={{ fontSize:12, color:'#5A5650', textAlign:'center', marginBottom:12 }}>
            {JA[saju.year.branch]}띠 · {form.gender==='male'?'남':'여'} · 일간 {CG[ds]}({CE[ds]})
          </div>

          <OhBar els={analyzeElements(saju, form.hour !== '-1')}/>

          {/* 성격/기질 카드 (즉시 표시) */}
          <div style={{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.06)', borderRadius:16, padding:'20px 18px', margin:'16px 0', animation:'fadeUp .5s ease .3s both' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
              <span style={{ fontSize:20 }}>{persona.emoji}</span>
              <span style={{ fontSize:15, color:'#C6A96C', fontWeight:500 }}>성격과 기질 — {persona.name}</span>
            </div>
            <div style={{ fontSize:14, lineHeight:1.8, color:'#C4BFB6' }}>
              허허, {form.gender==='male'?'형':'자매'}의 일간은 {persona.name}이구만! {persona.nature}의 기운을 타고났어.
              <br/><br/>{persona.text}
            </div>
          </div>

          {/* AI 도사 채팅 */}
          <div style={{ marginTop:16 }}>
            <div style={{ fontSize:13, color:'#8B8680', marginBottom:12, display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ fontSize:16 }}>🔮</span> AI최강도사에게 무엇이든 물어보세요
            </div>

            {/* 빠른 질문 */}
            {msgs.length === 0 && (
              <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:16, animation:'fadeUp .5s ease .5s both' }}>
                {quickQ.map((q, i) => (
                  <button key={i} onClick={() => chat(q)}
                    style={{ padding:'8px 14px', fontSize:13, background:'rgba(198,169,108,.08)', border:'1px solid rgba(198,169,108,.15)', borderRadius:20, color:'#C6A96C', cursor:'pointer', fontFamily:'inherit' }}>
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* 채팅 메시지 */}
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {msgs.map((m, i) => (
                <div key={i} style={{ display:'flex', justifyContent:m.role==='user'?'flex-end':'flex-start', animation:'fadeUp .3s' }}>
                  {m.role === 'assistant' && m.content && (
                    <div style={{ width:32, height:32, borderRadius:'50%', background:'rgba(198,169,108,.15)', border:'1px solid rgba(198,169,108,.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, marginRight:8, flexShrink:0, marginTop:4 }}>🔮</div>
                  )}
                  {m.content && (
                    <div style={{
                      maxWidth:'80%', padding:'14px 16px',
                      background: m.role==='user' ? 'rgba(198,169,108,.15)' : 'rgba(255,255,255,.04)',
                      border: m.role==='user' ? '1px solid rgba(198,169,108,.2)' : '1px solid rgba(255,255,255,.06)',
                      borderRadius: m.role==='user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      fontSize:14, lineHeight:1.8, color:'#D4D0C8', whiteSpace:'pre-wrap',
                    }}>{m.content}</div>
                  )}
                </div>
              ))}
              {typing && msgs[msgs.length-1]?.content === '' && (
                <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 0' }}>
                  <div style={{ width:32, height:32, borderRadius:'50%', background:'rgba(198,169,108,.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>🔮</div>
                  <div style={{ display:'flex', gap:6 }}>
                    {[0,1,2].map(i => <div key={i} style={{ width:6, height:6, borderRadius:'50%', background:'#C6A96C', animation:`pulse 1.2s ease ${i*.2}s infinite` }}/>)}
                  </div>
                </div>
              )}
              <div ref={endRef}/>
            </div>
          </div>

          {/* 채팅 입력창 (하단 고정) */}
          <div style={{ position:'fixed', bottom:0, left:0, right:0, padding:'12px 16px 20px', background:'linear-gradient(transparent, #0F0E0C 30%)' }}>
            <div style={{ maxWidth:480, margin:'0 auto', display:'flex', gap:8 }}>
              <input value={inp} onChange={e => setInp(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && chat()}
                placeholder="도사님에게 물어보세요..."
                style={{ flex:1, padding:'14px 16px', fontSize:15, background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.1)', borderRadius:12, color:'#E8E4DD', fontFamily:'inherit' }}/>
              <button onClick={() => chat()} disabled={!inp.trim() || typing}
                style={{ padding:'14px 20px', fontSize:14, background:inp.trim()&&!typing?'#C6A96C':'rgba(255,255,255,.06)', color:inp.trim()&&!typing?'#0F0E0C':'#5A5650', border:'none', borderRadius:12, cursor:'pointer', fontFamily:'inherit', fontWeight:500 }}>
                전송
              </button>
            </div>
          </div>

          {/* 다시하기 */}
          <div style={{ textAlign:'center', marginTop:24 }}>
            <button onClick={() => { setStep('input'); setSaju(null); setMsgs([]); }}
              style={{ padding:'10px 20px', fontSize:13, background:'transparent', border:'1px solid rgba(255,255,255,.1)', borderRadius:10, color:'#5A5650', cursor:'pointer', fontFamily:'inherit' }}>
              다른 사주 보기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
