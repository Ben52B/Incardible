import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Box, Button, Card, CardContent, Chip, CircularProgress, Container, Stack, Typography } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import QRCode from 'react-qr-code';
import LandingNav from '../layouts/landing-nav/landingLayout';

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const AR_LINK = process.env.NEXT_PUBLIC_AR_EXPERIENCE_LINK || 'https://ar.incardible.com.au';
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Incardible';

const arUrl = (customizationId) => {
  if (!customizationId) return null;
  try { const u = new URL(AR_LINK); u.searchParams.set('templateId', String(customizationId)); return u.toString(); } catch (_) { return `${AR_LINK}?templateId=${customizationId}`; }
};

export default function SuccessPage() {
  const router = useRouter();
  const { order: orderId } = router.query;
  const [order, setOrder] = useState(null);
  const [state, setState] = useState('loading');

  useEffect(() => {
    if (!router.isReady) return;
    if (!orderId) { setState('none'); return; }
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    axios.get(`${API_URL}/api/payment/order/${orderId}`, { headers: token ? { 'x-access-token': token } : {} })
      .then((r) => { setOrder(r.data.order); setState('ok'); })
      .catch(() => setState('none'));
  }, [router.isReady, orderId]);

  const custId = order?.cardCustomizationId?._id || order?.cardCustomizationId;
  const link = arUrl(custId);
  const title = order?.cardCustomizationId?.cardId?.title || order?.title;

  return (
    <>
      <Head><title>Thank you | {APP_NAME}</title></Head>
      <LandingNav />
      <Container maxWidth="sm" sx={{ pt: { xs: 12, md: 14 }, pb: 10, textAlign: 'center' }}>
        <CheckCircleOutlineIcon sx={{ color: 'success.main', fontSize: 72, mb: 1 }} />
        <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>Thank you for your order</Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          We&apos;ll print your greeting inside the card and post it to you. You&apos;ll receive an email with the details.
        </Typography>

        {state === 'loading' && <CircularProgress />}

        {state === 'ok' && order && (
          <Card variant="outlined" sx={{ textAlign: 'left', mb: 3 }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="h6">Order #{order.orderId}</Typography>
                <Chip size="small" color={order.status === 'COMPLETED' ? 'success' : 'default'} label={order.status === 'COMPLETED' ? 'Paid' : order.status} />
              </Stack>
              {title && <Typography><b>Card:</b> {title}{order.quantity > 1 ? ` × ${order.quantity}` : ''}</Typography>}
              {order.total != null && <Typography><b>Total:</b> ${Number(order.total).toFixed(2)} AUD</Typography>}
              {order.delivery_address && <Typography><b>Ship to:</b> {[order.delivery_address, order.suburb, order.state, order.postal_code].filter(Boolean).join(', ')}</Typography>}
              {link && (
                <Box sx={{ mt: 2, p: 2, borderRadius: 2, bgcolor: 'grey.50', display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Box sx={{ bgcolor: '#fff', p: 1, borderRadius: 1 }}><QRCode value={link} size={96} /></Box>
                  <Box sx={{ flex: 1, minWidth: 200 }}>
                    <Typography variant="subtitle2">Your AR experience</Typography>
                    <Typography variant="body2" color="text.secondary">This is the code we print on your card. You can preview the experience now on your phone.</Typography>
                    <Button size="small" href={link} target="_blank" rel="noopener" sx={{ mt: 1 }}>Open preview</Button>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        )}

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="center">
          <Button variant="contained" onClick={() => router.push('/myCards')}>My cards</Button>
          <Button variant="outlined" onClick={() => router.push('/')}>Back to the website</Button>
        </Stack>
      </Container>
    </>
  );
}
