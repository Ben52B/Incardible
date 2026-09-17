// Fulfilment screen: paid orders first, what to print, what to ship, one sheet per order.
import Head from 'next/head';
import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Box, Button, Chip, Container, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControl,
  IconButton, InputLabel, MenuItem, Pagination, Select, Stack, Switch, Table, TableBody, TableCell, TableHead,
  TableRow, TextField, Tooltip, Typography, Card, CardContent, Alert,
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import RefreshIcon from '@mui/icons-material/Refresh';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import NextLink from 'next/link';
import { Layout as DashboardLayout } from '../layouts/dashboard/layout';
import { buildArUrl, qrPngDataUrl } from '../utils/qr';
import QRCodeGenerator from '../components/qrCode';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const headers = () => ({ 'x-access-token': typeof window !== 'undefined' ? localStorage.getItem('token') : '' });
const abs = (u) => (!u ? null : /^https?:\/\//i.test(u) ? u : `${BASE_URL}/${String(u).replace(/\\/g, '/').replace(/^\/+/, '')}`);
const fmtDate = (d) => (d ? new Date(d).toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' }) : '—');
const money = (n) => (n == null ? '—' : `$${Number(n).toFixed(2)}`);
const customerName = (o) => [o?.user_id?.firstName, o?.user_id?.lastName].filter(Boolean).join(' ') || o?.user_id?.email || '—';
const greeting = (o) => o?.cardCustomizationId?.arTemplateData || {};
const address = (o) => [o?.delivery_address, o?.suburb, o?.state, o?.postal_code].filter(Boolean).join(', ');

const SHIPPING = [
  { value: 'processing', label: 'To ship', color: '#6b7280' },
  { value: 'in_shipping', label: 'In transit', color: '#f59e0b' },
  { value: 'shipped', label: 'Delivered', color: '#22c55e' },
];

function OrdersPage() {
  const [filters, setFilters] = useState({ status: 'COMPLETED', shipping: 'all', printed: 'all', q: '' });
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], total: 0, limit: 25, queue: { toPrint: 0, toShip: 0 } });
  const [loading, setLoading] = useState(false);
  const [sheet, setSheet] = useState(null);       // order for the sheet dialog
  const [ship, setShip] = useState(null);         // {order, status}
  const [tracking, setTracking] = useState({ id: '', company: '' });
  const [qInput, setQInput] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ ...filters, page: String(page), limit: '25' });
      const r = await axios.get(`${BASE_URL}/api/transactions/orders?${params}`, { headers: headers() });
      setData(r.data.data);
    } catch (err) {
      toast.error(err?.response?.data?.msg || 'Could not load orders');
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const id = setInterval(load, 60000); return () => clearInterval(id); }, [load]);
  useEffect(() => { const t = setTimeout(() => setFilters((f) => ({ ...f, q: qInput })), 400); return () => clearTimeout(t); }, [qInput]);

  const pages = Math.max(1, Math.ceil(data.total / (data.limit || 25)));

  const setPrinted = async (order, printed) => {
    try {
      await axios.put(`${BASE_URL}/api/transactions/orders/${order._id}/printed`, { printed }, { headers: headers() });
      setData((d) => ({ ...d, items: d.items.map((o) => (o._id === order._id ? { ...o, printedAt: printed ? new Date().toISOString() : null } : o)), queue: { ...d.queue, toPrint: d.queue.toPrint + (printed ? -1 : 1) } }));
      if (sheet && sheet._id === order._id) setSheet((s) => ({ ...s, printedAt: printed ? new Date().toISOString() : null }));
    } catch (err) { toast.error('Could not update printed status'); }
  };

  const confirmShipping = async () => {
    if (!ship) return;
    const { order, status } = ship;
    try {
      if (status === 'in_shipping') {
        if (!tracking.id.trim()) return toast.error('Enter the tracking number');
        await axios.put(`${BASE_URL}/api/transactions/add-tracking-id/${order._id}`, { trackingId: tracking.id.trim(), shippingCompany: tracking.company.trim(), shippingStatus: 'in_shipping' }, { headers: headers() });
        toast.success('Marked in transit and tracking email sent');
      } else {
        await axios.put(`${BASE_URL}/api/transactions/update-shipping-status-new/${order._id}`, { shippingStatus: status }, { headers: headers() });
        toast.success(status === 'shipped' ? 'Marked delivered' : 'Updated');
      }
      setShip(null); setTracking({ id: '', company: '' });
      load();
    } catch (err) { toast.error(err?.response?.data?.msg || 'Could not update shipping'); }
  };

  const copyLink = async (order) => {
    const link = buildArUrl(order?.cardCustomizationId?._id);
    if (!link) return toast.error('Set NEXT_PUBLIC_AR_EXPERIENCE_LINK');
    await navigator.clipboard.writeText(link);
    toast.success('AR link copied');
  };

  // Print: page 1 = inside greeting (A4 landscape, the uploaded 3508×2480 artwork or rendered text), page 2 = QR label.
  const printOrder = async (order) => {
    const g = greeting(order);
    const link = buildArUrl(order?.cardCustomizationId?._id);
    const qr = link ? await qrPngDataUrl(link, 600) : null;
    const textImg = abs(order?.cardCustomizationId?.templateTextSS);
    const html = `<!doctype html><html><head><title>Order ${order.orderId}</title><style>
      @page { size: A4 landscape; margin: 0; }
      html, body { margin: 0; padding: 0; }
      .page { width: 297mm; height: 210mm; position: relative; page-break-after: always; overflow: hidden; }
      .page:last-child { page-break-after: auto; }
      .inside img { width: 297mm; height: 210mm; object-fit: contain; display: block; }
      .text { position: absolute; left: 0; top: 0; width: 148.5mm; height: 210mm; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 22mm; box-sizing: border-box; font-family: Georgia, serif; color: #2b2b2b; }
      .text h1 { font-size: 26pt; margin: 0 0 8mm; } .text p { font-size: 13pt; margin: 0 0 6mm; white-space: pre-wrap; } .text .sign { font-style: italic; }
      .qr { position: absolute; right: 25mm; bottom: 25mm; width: 34mm; height: 34mm; }
      .meta { position: absolute; left: 10mm; bottom: 10mm; font: 9pt sans-serif; color: #888; }
    </style></head><body>
      <section class="page inside">${textImg ? `<img src="${textImg}" alt="">` : `<div class="text"><h1>${esc(g.mainHeading)}</h1><p>${esc(g.paragraph1)}</p><p class="sign">${esc(g.paragraph2)}</p></div>`}</section>
      <section class="page">${qr ? `<img class="qr" src="${qr}" alt="QR">` : ''}<div class="meta">Order #${order.orderId} · ${esc(customerName(order))}</div></section>
    </body></html>`;
    const iframe = document.createElement('iframe');
    Object.assign(iframe.style, { position: 'fixed', width: '0', height: '0', border: '0', left: '-9999px' });
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument;
    doc.open(); doc.write(html); doc.close();
    const imgs = Array.from(doc.images);
    await Promise.all(imgs.map((im) => (im.complete ? null : new Promise((r) => { im.onload = r; im.onerror = r; }))));
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => document.body.removeChild(iframe), 60000);
  };

  return (
    <>
      <Head><title>Orders | Incardible Admin</title></Head>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} spacing={2} sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h4">Orders</Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <Chip color="warning" label={`${data.queue.toPrint} to print`} onClick={() => { setFilters((f) => ({ ...f, status: 'COMPLETED', printed: 'no', shipping: 'all' })); setPage(1); }} />
              <Chip color="info" label={`${data.queue.toShip} to ship`} onClick={() => { setFilters((f) => ({ ...f, status: 'COMPLETED', printed: 'all', shipping: 'processing' })); setPage(1); }} />
            </Stack>
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="center">
            <TextField size="small" placeholder="Order #, name, email, postcode" value={qInput} onChange={(e) => setQInput(e.target.value)} sx={{ minWidth: 240 }} />
            <FormControl size="small" sx={{ minWidth: 130 }}><InputLabel>Payment</InputLabel>
              <Select label="Payment" value={filters.status} onChange={(e) => { setFilters((f) => ({ ...f, status: e.target.value })); setPage(1); }}>
                <MenuItem value="COMPLETED">Paid</MenuItem><MenuItem value="PENDING">Unpaid / abandoned</MenuItem><MenuItem value="REFUNDED">Refunded</MenuItem><MenuItem value="all">All</MenuItem>
              </Select></FormControl>
            <FormControl size="small" sx={{ minWidth: 130 }}><InputLabel>Shipping</InputLabel>
              <Select label="Shipping" value={filters.shipping} onChange={(e) => { setFilters((f) => ({ ...f, shipping: e.target.value })); setPage(1); }}>
                <MenuItem value="all">All</MenuItem>{SHIPPING.map((s) => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
              </Select></FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}><InputLabel>Printed</InputLabel>
              <Select label="Printed" value={filters.printed} onChange={(e) => { setFilters((f) => ({ ...f, printed: e.target.value })); setPage(1); }}>
                <MenuItem value="all">All</MenuItem><MenuItem value="no">Not printed</MenuItem><MenuItem value="yes">Printed</MenuItem>
              </Select></FormControl>
            <IconButton onClick={load} aria-label="Refresh"><RefreshIcon /></IconButton>
          </Stack>
        </Stack>

        <Card>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 900 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Order</TableCell><TableCell>Paid</TableCell><TableCell>Customer</TableCell><TableCell>Card</TableCell>
                  <TableCell align="right">Total</TableCell><TableCell>Printed</TableCell><TableCell>Shipping</TableCell><TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.items.map((o) => {
                  const st = SHIPPING.find((s) => s.value === (o.shippingStatus || 'processing')) || SHIPPING[0];
                  const paid = o.status === 'COMPLETED' || o.status === 'PAID';
                  return (
                    <TableRow key={o._id} hover sx={{ opacity: paid ? 1 : 0.6 }}>
                      <TableCell><Typography sx={{ fontWeight: 700 }}>#{o.orderId}</Typography><Typography variant="caption" color="text.secondary">{fmtDate(o.paid_at || o.createdAt)}</Typography></TableCell>
                      <TableCell><Chip size="small" label={paid ? 'Paid' : o.status || 'Pending'} color={paid ? 'success' : o.status === 'REFUNDED' ? 'error' : 'default'} /></TableCell>
                      <TableCell>{customerName(o)}<br /><Typography variant="caption" color="text.secondary">{o.user_id?.email}</Typography></TableCell>
                      <TableCell>{o.cardCustomizationId?.cardId?.title || o.title}{o.quantity > 1 ? ` × ${o.quantity}` : ''}{o.expressShipping ? <Chip size="small" label="Express" color="warning" sx={{ ml: 1 }} /> : null}</TableCell>
                      <TableCell align="right">{money(o.total)}</TableCell>
                      <TableCell><Tooltip title={o.printedAt ? `Printed ${fmtDate(o.printedAt)}` : 'Not printed yet'}><Switch size="small" checked={!!o.printedAt} onChange={(e) => setPrinted(o, e.target.checked)} /></Tooltip></TableCell>
                      <TableCell>
                        <FormControl size="small"><Select value={st.value} onChange={(e) => setShip({ order: o, status: e.target.value })} sx={{ color: st.color, fontWeight: 600, minWidth: 130 }}>
                          {SHIPPING.map((s) => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
                        </Select></FormControl>
                        {o.trackingId && <Typography variant="caption" display="block" color="text.secondary">{o.shippingCompany ? `${o.shippingCompany} ` : ''}{o.trackingId}</Typography>}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Order sheet"><IconButton onClick={() => setSheet(o)}><ArticleOutlinedIcon /></IconButton></Tooltip>
                        <Tooltip title="Print inside + QR"><IconButton onClick={() => printOrder(o)}><PrintIcon /></IconButton></Tooltip>
                        <Tooltip title="Copy AR link"><IconButton onClick={() => copyLink(o)}><ContentCopyIcon /></IconButton></Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!data.items.length && <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.secondary' }}>{loading ? 'Loading…' : 'No orders match these filters.'}</TableCell></TableRow>}
              </TableBody>
            </Table>
          </Box>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">{data.total} order{data.total === 1 ? '' : 's'}</Typography>
            <Pagination page={page} count={pages} onChange={(e, p) => setPage(p)} size="small" />
          </Stack>
        </Card>

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
          Looking for the old order page? <NextLink href="/order">Open legacy view</NextLink>.
        </Typography>
      </Container>

      {/* Order sheet */}
      <Dialog open={!!sheet} onClose={() => setSheet(null)} fullWidth maxWidth="md">
        {sheet && (() => {
          const g = greeting(sheet); const link = buildArUrl(sheet?.cardCustomizationId?._id); const c = sheet.cardCustomizationId || {};
          return (
            <>
              <DialogTitle>Order #{sheet.orderId} — {customerName(sheet)}</DialogTitle>
              <DialogContent dividers>
                <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
                  <Box>
                    <Typography variant="overline">Print inside the card</Typography>
                    <Card variant="outlined" sx={{ p: 2, mb: 2, fontFamily: 'Georgia, serif' }}>
                      <Typography variant="h5" sx={{ fontFamily: 'inherit', fontWeight: 700 }}>{g.mainHeading || <em>no heading</em>}</Typography>
                      <Typography sx={{ fontFamily: 'inherit', whiteSpace: 'pre-wrap', mt: 1 }}>{g.paragraph1}</Typography>
                      <Typography sx={{ fontFamily: 'inherit', fontStyle: 'italic', mt: 1 }}>{g.paragraph2}</Typography>
                    </Card>
                    {c.templateTextSS ? <Alert severity="success" sx={{ mb: 2 }}>Print-ready artwork uploaded (A4 landscape).</Alert> : <Alert severity="warning" sx={{ mb: 2 }}>No print artwork uploaded; the print button renders the text above instead.</Alert>}
                    <Typography variant="overline">Ship to</Typography>
                    <Typography>{customerName(sheet)}</Typography>
                    <Typography>{address(sheet) || '—'}</Typography>
                    <Typography>{sheet.phone_number || ''}</Typography>
                    {sheet.expressShipping && <Chip size="small" color="warning" label="Express shipping" sx={{ mt: 1 }} />}
                  </Box>
                  <Box>
                    <Typography variant="overline">QR code for the card</Typography>
                    <Box sx={{ bgcolor: '#fff', p: 2, display: 'inline-block', border: '1px solid #eee', borderRadius: 1 }}>{link ? <QRCodeGenerator value={link} /> : <Typography color="error">NEXT_PUBLIC_AR_EXPERIENCE_LINK not set</Typography>}</Box>
                    <Typography variant="body2" sx={{ wordBreak: 'break-all', mt: 1 }}>{link}</Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      <Button size="small" startIcon={<OpenInNewIcon />} href={link || '#'} target="_blank" rel="noopener" disabled={!link}>Test AR</Button>
                      <Button size="small" startIcon={<ContentCopyIcon />} onClick={() => copyLink(sheet)}>Copy</Button>
                    </Stack>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="overline">Card</Typography>
                    <Stack direction="row" spacing={2} alignItems="center">
                      {c.cardId?.frontDesign && <img src={abs(c.cardId.frontDesign)} alt="" style={{ width: 72, borderRadius: 6 }} />}
                      <Box>
                        <Typography>{c.cardId?.title || sheet.title}</Typography>
                        <Typography variant="caption" color="text.secondary">AR target: {c.cardId?.trackingTarget?.status || 'not built'} · Photos: {[0, 1, 2].filter((i) => c[`templateImage${i}`]).length}+ · Video: {c.templateVideo || g.videoUrl ? 'yes' : 'no'}</Typography>
                      </Box>
                    </Stack>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="overline">Order</Typography>
                    <Typography variant="body2">Paid {fmtDate(sheet.paid_at)} · {money(sheet.total)} incl. GST{sheet.coupon_code ? ` · coupon ${sheet.coupon_code}` : ''}</Typography>
                    <Typography variant="body2">Printed: {sheet.printedAt ? fmtDate(sheet.printedAt) : 'not yet'} · Shipping: {(SHIPPING.find((s) => s.value === (sheet.shippingStatus || 'processing')) || SHIPPING[0]).label}{sheet.trackingId ? ` (${sheet.trackingId})` : ''}</Typography>
                  </Box>
                </Box>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setPrinted(sheet, !sheet.printedAt)}>{sheet.printedAt ? 'Mark not printed' : 'Mark printed'}</Button>
                <Button variant="contained" startIcon={<PrintIcon />} onClick={() => printOrder(sheet)}>Print</Button>
                <Button onClick={() => setSheet(null)}>Close</Button>
              </DialogActions>
            </>
          );
        })()}
      </Dialog>

      {/* Shipping change */}
      <Dialog open={!!ship} onClose={() => setShip(null)} fullWidth maxWidth="xs">
        <DialogTitle>Update shipping</DialogTitle>
        <DialogContent dividers>
          {ship?.status === 'in_shipping' ? (
            <Stack spacing={2}>
              <Typography variant="body2">The customer receives an email with the tracking number.</Typography>
              <TextField label="Tracking number" value={tracking.id} onChange={(e) => setTracking((t) => ({ ...t, id: e.target.value }))} autoFocus />
              <TextField label="Carrier (optional)" value={tracking.company} onChange={(e) => setTracking((t) => ({ ...t, company: e.target.value }))} />
            </Stack>
          ) : <Typography>Mark order #{ship?.order?.orderId} as {SHIPPING.find((s) => s.value === ship?.status)?.label}?</Typography>}
        </DialogContent>
        <DialogActions><Button onClick={() => setShip(null)}>Cancel</Button><Button variant="contained" onClick={confirmShipping}>Confirm</Button></DialogActions>
      </Dialog>
    </>
  );
}

function esc(s) { return String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

OrdersPage.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;
export default OrdersPage;
