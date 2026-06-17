/**
 * Pollinations AI Service
 * Generates DIY project images using the free Pollinations.ai API
 */

const POLLINATIONS_BASE_URL = 'https://image.pollinations.ai/prompt/';
const DEFAULT_IMAGE_SIZE = { width: 900, height: 900 };
const DEFAULT_TIMEOUT_MS = 20000;

const normalizeText = (value) => String(value || '').trim();

const escapeXml = (value) =>
  normalizeText(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

/**
 * Builds a detailed image generation prompt from a DIY idea.
 * @param {string} wasteType - e.g. "plastic bottle"
 * @param {string} diyIdea - e.g. "Plant Pot"
 * @returns {string} Image prompt
 */
export const buildDIYImagePrompt = (wasteType, diyIdea) => {
  const waste = normalizeText(wasteType).toLowerCase();
  const idea = normalizeText(diyIdea);

  return [
    `A realistic eco-friendly DIY ${idea} made from a recycled ${waste}`,
    'emerald green accents',
    'plain white background',
    'isolated on white background',
    'handmade craft project',
    'sustainable reuse project',
    'home decoration',
    'highly detailed',
    'professional photography',
    'natural lighting',
    'high quality',
    'no text',
    'no watermark',
  ].join(', ');
};

const hashString = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const buildPollinationsImageUrl = (prompt, seed = null) => {
  const imageSeed = seed ?? hashString(prompt);
  const encodedPrompt = encodeURIComponent(prompt);

  return `${POLLINATIONS_BASE_URL}${encodedPrompt}?width=${DEFAULT_IMAGE_SIZE.width}&height=${DEFAULT_IMAGE_SIZE.height}&seed=${imageSeed}&nologo=true`;
};

const fetchImageAsDataUrl = async (imageUrl) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(imageUrl, {
      method: 'GET',
      headers: {
        Accept: 'image/*,*/*;q=0.8',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Pollinations returned ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || 'image/png';
    if (!contentType.startsWith('image/')) {
      throw new Error(`Unexpected content type: ${contentType}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    return {
      dataUrl: `data:${contentType};base64,${buffer.toString('base64')}`,
      contentType,
    };
  } finally {
    clearTimeout(timeout);
  }
};

const buildPlaceholderImageUrl = (wasteType, diyIdea, message = '') => {
  const title = escapeXml(diyIdea || 'DIY idea');
  const waste = escapeXml(wasteType || 'waste material');
  const note = escapeXml(message || 'Pollinations image unavailable');
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
      <rect width="1024" height="1024" rx="56" fill="#ffffff"/>
      <rect x="96" y="96" width="832" height="832" rx="40" fill="#ffffff" opacity="1"/>
      <circle cx="512" cy="300" r="126" fill="#10b981" opacity="0.12"/>
      <text x="512" y="410" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="56" fill="#0f172a" font-weight="700">
        ${title}
      </text>
      <text x="512" y="486" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="32" fill="#166534">
        Made from ${waste}
      </text>
      <text x="512" y="566" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="26" fill="#334155">
        ${note}
      </text>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const buildDIYPreviewImageUrl = (wasteType, diyIdea) => {
  const title = escapeXml(diyIdea || 'DIY idea');
  const waste = escapeXml(wasteType || 'recycled item');
  const key = normalizeText(diyIdea || '').toLowerCase();

  const art = (() => {
    if (key.includes('plant pot')) {
      return `
        <path d="M362 556c0-30 24-54 54-54h192c30 0 54 24 54 54l-28 154c-4 24-24 42-48 42H438c-24 0-44-18-48-42l-28-154Z" fill="#0f766e"/>
        <path d="M386 556h252l-16 78H402l-16-78Z" fill="#134e4a"/>
        <path d="M454 504c0-48 18-92 52-120 26 26 44 62 46 100-4 58-42 110-98 126-18-24-18-66 0-106Z" fill="#34d399"/>
        <path d="M546 506c0-44 18-84 52-112 22 22 34 52 36 86-4 52-34 98-84 114-16-20-16-56-4-88Z" fill="#86efac"/>
      `;
    }
    if (key.includes('bird feeder')) {
      return `
        <rect x="398" y="286" width="228" height="272" rx="42" fill="#0f766e"/>
        <rect x="372" y="256" width="280" height="48" rx="20" fill="#134e4a"/>
        <rect x="426" y="334" width="172" height="88" rx="18" fill="#d1fae5" opacity="0.94"/>
        <circle cx="520" cy="382" r="24" fill="#16a34a"/>
        <path d="M366 586h292c0 42-18 72-54 90H420c-38-18-54-48-54-90Z" fill="#10b981"/>
        <circle cx="706" cy="446" r="34" fill="#fbbf24"/>
        <path d="M676 446c20-14 42-20 64-18-4 18-14 34-30 44-16 10-32 12-48 8 0-12 4-22 14-34Z" fill="#1f2937"/>
      `;
    }
    if (key.includes('pen holder')) {
      return `
        <rect x="404" y="330" width="216" height="256" rx="28" fill="#0f766e"/>
        <rect x="392" y="578" width="240" height="42" rx="20" fill="#134e4a"/>
        <rect x="436" y="240" width="18" height="170" rx="9" fill="#e5eefc"/>
        <rect x="476" y="214" width="18" height="196" rx="9" fill="#34d399"/>
        <rect x="516" y="252" width="18" height="158" rx="9" fill="#a7f3d0"/>
        <rect x="556" y="228" width="18" height="182" rx="9" fill="#bbf7d0"/>
        <circle cx="522" cy="404" r="54" fill="#10b981" opacity="0.24"/>
      `;
    }
    if (key.includes('decorative lamp')) {
      return `
        <ellipse cx="522" cy="286" rx="98" ry="64" fill="#f59e0b" opacity="0.88"/>
        <path d="M456 308h132l32 232H424l32-232Z" fill="#0f766e"/>
        <path d="M438 540h168l-18 64H456l-18-64Z" fill="#134e4a"/>
        <circle cx="522" cy="286" r="62" fill="#fde68a" opacity="0.5"/>
      `;
    }
    if (key.includes('vase')) {
      return `
        <path d="M476 214h92v58c0 26 14 44 34 60 20 16 34 44 34 76 0 92-34 186-114 270-80-84-114-178-114-270 0-32 14-60 34-76 20-16 34-34 34-60v-58Z" fill="#0f766e"/>
        <path d="M450 326h144" stroke="#d1fae5" stroke-width="18" stroke-linecap="round"/>
        <circle cx="382" cy="302" r="26" fill="#34d399"/>
        <circle cx="652" cy="302" r="26" fill="#86efac"/>
        <path d="M346 270c38 10 64 36 72 72-34-6-62-22-80-48-10-14-10-20 8-24Z" fill="#22c55e"/>
        <path d="M678 270c-38 10-64 36-72 72 34-6 62-22 80-48 10-14 10-20-8-24Z" fill="#10b981"/>
      `;
    }
    if (key.includes('candle holder')) {
      return `
        <rect x="410" y="322" width="204" height="246" rx="34" fill="#0f766e"/>
        <rect x="434" y="278" width="156" height="72" rx="20" fill="#d1fae5"/>
        <path d="M522 210c24 26 38 48 38 74 0 28-17 52-38 52s-38-24-38-52c0-26 14-48 38-74Z" fill="#f59e0b"/>
        <circle cx="522" cy="278" r="28" fill="#fde68a" opacity="0.6"/>
        <rect x="394" y="584" width="256" height="38" rx="18" fill="#134e4a"/>
      `;
    }
    if (key.includes('desk organizer')) {
      return `
        <rect x="358" y="318" width="308" height="280" rx="34" fill="#0f766e"/>
        <rect x="382" y="346" width="80" height="224" rx="20" fill="#134e4a"/>
        <rect x="474" y="346" width="80" height="224" rx="20" fill="#134e4a"/>
        <rect x="566" y="346" width="80" height="224" rx="20" fill="#134e4a"/>
        <rect x="418" y="236" width="18" height="140" rx="9" fill="#34d399"/>
        <rect x="510" y="214" width="18" height="162" rx="9" fill="#a7f3d0"/>
        <rect x="602" y="248" width="18" height="128" rx="9" fill="#bbf7d0"/>
      `;
    }
    if (key.includes('planter')) {
      return `
        <path d="M380 546h264l-24 128c-4 24-24 42-48 42H452c-24 0-44-18-48-42l-24-128Z" fill="#0f766e"/>
        <rect x="366" y="510" width="292" height="46" rx="20" fill="#134e4a"/>
        <path d="M500 220c-56 30-90 86-90 148 50-10 90-44 112-92 6-26 2-42-22-56Z" fill="#34d399"/>
        <path d="M556 238c44 22 76 66 84 118-44-2-82-22-108-58-16-22-14-42 24-60Z" fill="#86efac"/>
      `;
    }
    if (key.includes('lantern')) {
      return `
        <path d="M474 208h96l24 40H450l24-40Z" fill="#134e4a"/>
        <rect x="404" y="248" width="216" height="292" rx="60" fill="#0f766e"/>
        <rect x="442" y="286" width="140" height="216" rx="32" fill="#fde68a" opacity="0.75"/>
        <circle cx="522" cy="388" r="68" fill="#fbbf24" opacity="0.48"/>
        <path d="M522 540v82" stroke="#134e4a" stroke-width="16" stroke-linecap="round"/>
        <path d="M466 602h112" stroke="#134e4a" stroke-width="16" stroke-linecap="round"/>
      `;
    }

    return `
      <rect x="400" y="324" width="224" height="232" rx="36" fill="#0f766e"/>
      <rect x="384" y="298" width="256" height="42" rx="18" fill="#134e4a"/>
      <circle cx="522" cy="420" r="92" fill="#34d399" opacity="0.22"/>
      <path d="M470 506c24-44 60-76 104-96" stroke="#bbf7d0" stroke-width="16" stroke-linecap="round" fill="none"/>
      <path d="M548 420c-18-18-44-28-76-30 4 34 16 62 36 84 24-10 38-28 40-54Z" fill="#86efac"/>
    `;
  })();

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
      <rect width="1024" height="1024" rx="56" fill="#ffffff"/>
      <rect x="78" y="78" width="868" height="868" rx="46" fill="#ffffff"/>
      <circle cx="512" cy="310" r="156" fill="#10b981" opacity="0.12"/>
      ${art}
      <text x="512" y="742" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="54" fill="#0f172a" font-weight="700">
        ${title}
      </text>
      <text x="512" y="802" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="30" fill="#166534">
        DIY from ${waste}
      </text>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

export { buildPlaceholderImageUrl };
export { buildDIYPreviewImageUrl };

/**
 * Generates a Pollinations image URL for a DIY idea.
 * Returns the generated image URL directly, with a placeholder fallback URL
 * only if the generated URL cannot be constructed.
 *
 * @param {string} wasteType
 * @param {string} diyIdea
 * @param {{ seed?: number }} [options]
 * @returns {Promise<{ success: boolean, imageUrl: string, imagePrompt: string, fallback: boolean, message: string | null }>}
 */
export const generateDIYImage = async (wasteType, diyIdea, options = {}) => {
  const imagePrompt = buildDIYImagePrompt(wasteType, diyIdea);
  const imageUrl = buildPollinationsImageUrl(imagePrompt, options.seed);
  const placeholderUrl = buildPlaceholderImageUrl(wasteType, diyIdea, 'Green eco preview');

  if (!imageUrl) {
    return {
      success: false,
      imageUrl: placeholderUrl,
      placeholderUrl,
      imagePrompt,
      fallback: true,
      message: 'Pollinations image URL could not be created.',
    };
  }

  try {
    const rendered = await fetchImageAsDataUrl(imageUrl);

    return {
      success: true,
      imageUrl: rendered.dataUrl,
      sourceUrl: imageUrl,
      placeholderUrl,
      imagePrompt,
      fallback: false,
      message: null,
    };
  } catch (error) {
    return {
      success: false,
      imageUrl: placeholderUrl,
      sourceUrl: imageUrl,
      placeholderUrl,
      imagePrompt,
      fallback: true,
      message: `Pollinations image generation failed: ${error.message}`,
    };
  }

};

export default {
  buildDIYImagePrompt,
  generateDIYImage,
};
