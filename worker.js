// Cloudflare Worker — Anthropic API 프록시
// 역할: 브라우저(index.html)가 이 Worker를 호출하면,
//       Worker가 진짜 API 키를 붙여서 Anthropic API에 대신 요청하고 결과를 돌려줍니다.
// 이렇게 하면 API 키가 절대 브라우저(클라이언트)에 노출되지 않습니다.

export default {
  async fetch(request, env) {
    // 1) CORS preflight(OPTIONS) 요청 처리
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(env) });
    }

    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405, headers: corsHeaders(env) });
    }

    try {
      const body = await request.text();

      const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": env.ANTHROPIC_API_KEY,   // Worker 환경변수(시크릿)에서 가져옴
          "anthropic-version": "2023-06-01",
        },
        body,
      });

      const text = await anthropicRes.text();

      return new Response(text, {
        status: anthropicRes.status,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders(env),
        },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: String(err) }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders(env) },
      });
    }
  },
};

function corsHeaders(env) {
  return {
    // 배포 후엔 "*" 대신 본인 GitHub Pages 주소로 좁혀주는 걸 권장합니다.
    // 예: "https://your-username.github.io"
    "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}
