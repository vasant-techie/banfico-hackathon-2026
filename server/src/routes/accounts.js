import { Router } from 'express';
import { bankClient, forwardError } from '../lib/bankClient.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();
router.use(requireAuth);

// Create account
router.post('/', async (req, res) => {
  try {
    const { data } = await bankClient(req.accessToken).post('/accounts', req.body);
    res.json(data);
  } catch (err) {
    forwardError(res, err);
  }
});

// List accounts
router.get('/', async (req, res) => {
  try {
    const { data } = await bankClient(req.accessToken).get('/accounts', { params: req.query });
    res.json(data);
  } catch (err) {
    forwardError(res, err);
  }
});

// Get single account
router.get('/:accountId', async (req, res) => {
  try {
    const { data } = await bankClient(req.accessToken).get(`/accounts/${req.params.accountId}`);
    res.json(data);
  } catch (err) {
    forwardError(res, err);
  }
});

// Get balances
router.get('/:accountId/balances', async (req, res) => {
  try {
    const { data } = await bankClient(req.accessToken).get(`/accounts/${req.params.accountId}/balances`);
    res.json(data);
  } catch (err) {
    forwardError(res, err);
  }
});

// Create transaction
router.post('/:accountId/transactions', async (req, res) => {
  try {
    const { data } = await bankClient(req.accessToken).post(
      `/accounts/${req.params.accountId}/transactions`,
      req.body
    );
    res.json(data);
  } catch (err) {
    forwardError(res, err);
  }
});

// List transactions
router.get('/:accountId/transactions', async (req, res) => {
  try {
    const { data } = await bankClient(req.accessToken).get(`/accounts/${req.params.accountId}/transactions`);
    res.json(data);
  } catch (err) {
    forwardError(res, err);
  }
});

export default router;
