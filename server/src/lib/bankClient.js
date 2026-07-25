import axios from 'axios';
import { coreApiBaseUrl } from '../config.js';

export function bankClient(token) {
  return axios.create({
    baseURL: coreApiBaseUrl,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json, text/plain, */*',
      'Content-Type': 'application/json',
    },
  });
}

// Never pass a raw axios error to a client or an LLM tool_result — the error's
// `config` embeds the Authorization header used to make the request.
export function scrubError(err) {
  return {
    status: err.response?.status || 502,
    body: err.response?.data || { message: err.message },
  };
}

export function forwardError(res, err) {
  const { status, body } = scrubError(err);
  res.status(status).json({ error: 'Upstream bank API error', details: body });
}
