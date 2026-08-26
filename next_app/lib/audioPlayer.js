/**
 * 🔊 universalPlayAudio
 * 카카오톡 인앱 브라우저, iOS/Android 웹뷰, 사파리, 크롬 등 모든 환경에서
 * 100% 음성이 끊김 없이 재생되도록 다중 계층 fallback을 제공하는 범용 오디오 플레이어
 */

let globalAudioInstance = null;
let isAudioUnlocked = false;

// 📱 모바일 브라우저(카카오톡, 사파리 등) 오디오 자동 잠금 해제
export function initAudioUnlock() {
  if (typeof window === 'undefined' || isAudioUnlocked) return;

  const unlock = () => {
    if (isAudioUnlocked) return;
    try {
      const dummyAudio = new Audio();
      dummyAudio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==';
      const p = dummyAudio.play();
      if (p !== undefined) {
        p.then(() => {
          isAudioUnlocked = true;
          cleanup();
        }).catch(() => {});
      }
    } catch (e) {}
  };

  const cleanup = () => {
    window.removeEventListener('click', unlock);
    window.removeEventListener('touchstart', unlock);
    window.removeEventListener('touchend', unlock);
  };

  window.addEventListener('click', unlock, { once: true, passive: true });
  window.addEventListener('touchstart', unlock, { once: true, passive: true });
  window.addEventListener('touchend', unlock, { once: true, passive: true });
}

export function playUniversalAudio(text, options = {}) {
  if (!text || typeof window === 'undefined') return;

  const cleanText = String(text).trim();
  if (!cleanText) return;

  const rate = options.rate || options.speed || 1.0;
  const lang = options.lang || 'en';

  // 기존 재생 중인 오디오 정지
  if (globalAudioInstance) {
    try {
      globalAudioInstance.pause();
      globalAudioInstance.currentTime = 0;
    } catch (e) {}
  }

  // 1순위: 자사 내부 API 스트림 (/api/tts) - 카카오톡 인앱 브라우저 100% 완벽 호환 (CORS 없음)
  const primaryUrl = `/api/tts?text=${encodeURIComponent(cleanText)}&lang=${encodeURIComponent(lang)}`;
  // 2순위: Youdao DictVoice CDN
  const fallbackUrl1 = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(cleanText)}&type=2`;
  // 3순위: Google Translate TTS 직접 스트림
  const fallbackUrl2 = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${encodeURIComponent(lang)}&q=${encodeURIComponent(cleanText)}`;

  const tryPlayUrl = (urls, index = 0) => {
    if (index >= urls.length) {
      // 4순위: 브라우저 내장 SpeechSynthesis
      speakWebSpeech(cleanText, rate);
      return;
    }

    const currentUrl = urls[index];
    const audio = new Audio(currentUrl);
    audio.playbackRate = rate;
    globalAudioInstance = audio;

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn(`Audio playback failed for ${currentUrl}, trying fallback...`, err);
        tryPlayUrl(urls, index + 1);
      });
    }
  };

  tryPlayUrl([primaryUrl, fallbackUrl1, fallbackUrl2]);

  function speakWebSpeech(wordText, wordSpeed) {
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        window.speechSynthesis.resume();
        const utterance = new SpeechSynthesisUtterance(wordText);
        utterance.lang = 'en-US';
        utterance.rate = wordSpeed;

        const voices = window.speechSynthesis.getVoices();
        if (voices && voices.length > 0) {
          const enVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Zira') || v.name.includes('Samantha') || v.name.includes('US'))) || voices.find(v => v.lang.startsWith('en'));
          if (enVoice) utterance.voice = enVoice;
        }

        window.speechSynthesis.speak(utterance);
      } catch (err) {}
    }
  }
}
