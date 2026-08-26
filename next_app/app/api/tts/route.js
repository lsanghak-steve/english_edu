export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const text = searchParams.get('text') || searchParams.get('q') || searchParams.get('word') || '';
    const lang = searchParams.get('lang') || 'en';

    if (!text || text.trim() === '') {
      return new Response('Missing text parameter', { status: 400 });
    }

    const cleanText = text.trim();

    // 1순위: Google Translate TTS API (tw-ob client - 가장 표준적이고 발음이 명확함)
    try {
      const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${encodeURIComponent(lang)}&q=${encodeURIComponent(cleanText)}`;
      const res = await fetch(googleTtsUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://translate.google.com/'
        }
      });

      if (res.ok) {
        const audioBuffer = await res.arrayBuffer();
        return new Response(audioBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'audio/mpeg',
            'Cache-Control': 'public, max-age=31536000, immutable',
            'Accept-Ranges': 'bytes'
          }
        });
      }
    } catch (gErr) {
      console.warn('Google TTS server fetch error, trying fallback', gErr);
    }

    // 2순위: Youdao DictVoice API
    try {
      const youdaoUrl = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(cleanText)}&type=2`;
      const res = await fetch(youdaoUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://dict.youdao.com/'
        }
      });

      if (res.ok) {
        const audioBuffer = await res.arrayBuffer();
        return new Response(audioBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'audio/mpeg',
            'Cache-Control': 'public, max-age=31536000, immutable',
            'Accept-Ranges': 'bytes'
          }
        });
      }
    } catch (yErr) {
      console.warn('Youdao TTS server fetch error', yErr);
    }

    return new Response('TTS fetch failed', { status: 502 });
  } catch (error) {
    return new Response(`TTS Server Error: ${error.message}`, { status: 500 });
  }
}
