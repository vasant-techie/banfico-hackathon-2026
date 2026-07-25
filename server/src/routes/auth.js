import { Router } from 'express';
import axios from 'axios';
import { config, authBaseUrl } from '../config.js';

const router = Router();

async function requestToken(params) {
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    ...params,
  });

  const { data } = await axios.post(authBaseUrl, body, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  return data;
}

router.post('/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }

  try {
    const data = await requestToken({ grant_type: 'password', username, password });
    res.json(data);
  } catch (err) {
    const status = err.response?.status || 502;
    res.status(status).json({
      error: 'Authentication failed',
      details: err.response?.data || err.message,
    });
  }
});

router.post('/refresh', async (req, res) => {
  const { refresh_token } = req.body || {};
  if (!refresh_token) {
    return res.status(400).json({ error: 'refresh_token is required' });
  }

  try {
    const data = await requestToken({ grant_type: 'refresh_token', refresh_token });
    res.json(data);
  } catch (err) {
    const status = err.response?.status || 502;
    res.status(status).json({
      error: 'Token refresh failed',
      details: err.response?.data || err.message,
    });
  }
});

export default router;
