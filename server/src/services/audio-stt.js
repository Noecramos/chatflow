/**
 * Audio Transcription Service (Speech-to-Text)
 * Uses Google Cloud Speech-to-Text API with the client's own API key.
 * Downloads WhatsApp/IG audio from Meta, sends to Google STT for transcription.
 */
const axios = require('axios');

const STT_ENDPOINT = 'https://speech.googleapis.com/v1/speech:recognize';

/**
 * Transcribe a WhatsApp/IG audio message using Google Cloud Speech-to-Text.
 * 
 * Flow:
 * 1. Get media URL from Meta Graph API using the media ID
 * 2. Download the audio binary
 * 3. Send base64 audio to Google Cloud STT
 * 4. Return the transcribed text
 * 
 * @param {string} mediaId - Meta media ID from the webhook payload
 * @param {string} accessToken - Meta access token for downloading media
 * @param {string} googleApiKey - Google Cloud API key (GOOGLE_TTS_API_KEY)
 * @returns {string} Transcribed text, or empty string on failure
 */
async function transcribeAudio(mediaId, accessToken, googleApiKey) {
  if (!googleApiKey || !accessToken || !mediaId) {
    console.warn('[Audio STT] Missing required params:', { 
      hasKey: !!googleApiKey, hasToken: !!accessToken, hasMediaId: !!mediaId 
    });
    return '';
  }

  try {
    // Step 1: Get media URL from Meta Graph API
    console.log(`[Audio STT] Getting media URL for ID: ${mediaId}`);
    const metaRes = await axios.get(`https://graph.facebook.com/v21.0/${mediaId}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    const downloadUrl = metaRes.data.url;
    const mimeType = metaRes.data.mime_type || 'audio/ogg';
    console.log(`[Audio STT] Media URL obtained. MIME: ${mimeType}`);

    // Step 2: Download the audio binary
    const audioRes = await axios.get(downloadUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
      responseType: 'arraybuffer'
    });
    
    const base64Audio = Buffer.from(audioRes.data).toString('base64');
    const sizeKB = Math.round(audioRes.data.byteLength / 1024);
    console.log(`[Audio STT] Audio downloaded: ${sizeKB}KB`);

    // Step 3: Determine encoding from MIME type
    let encoding = 'OGG_OPUS';
    if (mimeType.includes('ogg')) encoding = 'OGG_OPUS';
    else if (mimeType.includes('amr')) encoding = 'AMR';
    else if (mimeType.includes('mp3') || mimeType.includes('mpeg')) encoding = 'MP3';
    else if (mimeType.includes('wav')) encoding = 'LINEAR16';
    else if (mimeType.includes('webm')) encoding = 'WEBM_OPUS';

    // Step 4: Call Google Cloud Speech-to-Text API
    const sttResponse = await axios.post(`${STT_ENDPOINT}?key=${googleApiKey}`, {
      config: {
        encoding: encoding,
        sampleRateHertz: encoding === 'OGG_OPUS' ? 16000 : 8000,
        languageCode: 'pt-BR',
        model: 'latest_long',
        enableAutomaticPunctuation: true,
        alternativeLanguageCodes: ['en-US', 'es-ES']
      },
      audio: {
        content: base64Audio
      }
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });

    // Step 5: Extract transcription
    const results = sttResponse.data.results;
    if (!results || results.length === 0) {
      console.log('[Audio STT] No transcription results (empty audio or silence)');
      return '';
    }

    const transcription = results
      .map(r => r.alternatives?.[0]?.transcript || '')
      .join(' ')
      .trim();

    console.log(`[Audio STT] Transcribed: "${transcription.substring(0, 100)}${transcription.length > 100 ? '...' : ''}"`);
    return transcription;

  } catch (e) {
    if (e.response) {
      console.error('[Audio STT] API Error:', e.response.status, JSON.stringify(e.response.data));
    } else {
      console.error('[Audio STT] Error:', e.message);
    }
    return '';
  }
}

module.exports = { transcribeAudio };
