import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import authRoutes from './routes/auth.js';
import accountsRoutes from './routes/accounts.js';
import insightsRoutes from './routes/insights.js';
import assistantRoutes from './routes/assistant.js';

const app = express();

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountsRoutes);
app.use('/api/insights', insightsRoutes);
app.use('/api/assistant', assistantRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(config.port, () => {
  console.log(`Fintech dashboard API listening on http://localhost:${config.port}`);
});
