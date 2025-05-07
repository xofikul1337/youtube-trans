const https = require('https');

module.exports = async (req, res) => {
  try {
    const { video_id } = req.query;
    if (!video_id) throw new Error('Missing video_id');
    
    const options = {
      method: 'GET',
      hostname: 'notegpt.io',
      path: `/api/v2/video-transcript?platform=youtube&video_id=${video_id}`,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36',
        'sec-fetch-site': 'same-origin',
        'sec-fetch-mode': 'cors',
        'sec-fetch-dest': 'empty',
        'referer': 'https://notegpt.io/youtube-transcript-generator',
        'accept-language': 'en-AS,en;q=0.9,ar-AE;q=0.8,ar;q=0.7,en-GB;q=0.6,en-US;q=0.5,bn;q=0.4',
        'Cookie': process.env.API_COOKIE  // Vercel environment variable for cookie
      }
    };

    const request = https.request(options, (response) => {
      let data = '';

      response.on('data', (chunk) => {
        data += chunk;
      });

      response.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const result = {
            thumbnail: parsed?.data?.videoInfo?.thumbnailUrl || '',
            transcript: []
          };

          const transcripts = parsed?.data?.transcripts || {};
          for (const lang in transcripts) {
            const auto = transcripts[lang]?.auto || [];
            result.transcript.push(...auto.map(t => t.text));
          }

          res.status(200).json(result);
        } catch (err) {
          console.error('Parsing error:', err);
          res.status(500).json({ error: 'Failed to parse response' });
        }
      });
    });

    request.on('error', (error) => {
      console.error('Request error:', error);
      res.status(500).json({ error: error.message });
    });

    request.end();
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
};
