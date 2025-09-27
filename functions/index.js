const { onRequest } = require('firebase-functions/v2/https');

exports.ping = onRequest({ cors: true, region: 'europe-west3' }, (req, res) => {
  res.json({ ok: true, ts: Date.now() });
});
