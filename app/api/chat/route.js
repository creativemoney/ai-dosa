// app/api/chat/route.js
// 서버에서 Claude API를 스트리밍으로 호출하고, 클라이언트에 실시간 전달

export const runtime = 'edge'; // Edge Runtime = 한국 사용자에게 빠른 응답

export async function POST(request) {
  const { messages, systemPrompt } = await request.json();

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      stream: true,
      system: systemPrompt,
      messages,
    }),
  });

  if (!response.ok) {
    return new Response(JSON.stringify({ error: 'API 호출 실패' }), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 스트리밍 응답을 그대로 클라이언트에 전달
  return new Response(response.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
