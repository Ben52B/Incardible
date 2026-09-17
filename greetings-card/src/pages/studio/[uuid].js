// Mobile-first design studio. Replaces the Unity iframe editor.
// URL: /studio/<customisation uuid>?selected=<card uuid>
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Box, Button, Chip, CircularProgress, Container, IconButton, LinearProgress, Stack,
  Step, StepLabel, Stepper, TextField, Typography, ToggleButton, ToggleButtonGroup, Alert,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined';
import VideocamOutlinedIcon from '@mui/icons-material/VideocamOutlined';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/use-auth';
import { useLoginModal } from '../../contexts/loginContext';
import LandingNav from '../../layouts/landing-nav/landingLayout';
import * as api from '../../studio/api';
import { preparePhoto, humanSize } from '../../studio/imageTools';
import { renderPrintArtwork } from '../../studio/printArtwork';
import { draftToPayload } from '../../studio/Preview';

const Preview = dynamic(() => import('../../studio/Preview'), { ssr: false, loading: () => <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress size={28} /></Box> });

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Incardible';
const STEPS = ['Message', 'Photos & video', 'Style', 'Review'];

const emptyDraft = {
  templateId: 'classic', heading: '', paragraph1: '', paragraph2: '',
  effect: 'sparkles', musicUrl: null, musicName: null, musicIndex: null, complete: false,
};

function fromArTemplateData(t = {}, templates) {
  const tpl = templates.find((x) => x.id === t.templateId) || templates[t.templateIndex] || templates[0];
  return {
    ...emptyDraft,
    templateId: tpl?.id || 'classic',
    heading: t.mainHeading || '',
    paragraph1: t.paragraph1 || '',
    paragraph2: t.paragraph2 || '',
    effect: t.effectName || t.effect || tpl?.effect || 'sparkles',
    musicUrl: t.musicUrl || null,
    musicName: t.musicName || null,
    musicIndex: t.musicIndex ?? null,
    complete: !!t.isCustomizationComplete,
  };
}

function toArTemplateData(draft, templates) {
  const idx = Math.max(0, templates.findIndex((t) => t.id === draft.templateId));
  const tpl = templates[idx] || templates[0] || {};
  return {
    version: 2,
    templateId: draft.templateId,
    templateIndex: idx,
    templateName: tpl.name || draft.templateId,
    mainHeading: draft.heading,
    paragraph1: draft.paragraph1,
    paragraph2: draft.paragraph2,
    textColor: tpl.textColor,
    fontName: tpl.font,
    effectName: draft.effect,
    musicUrl: draft.musicUrl,
    musicName: draft.musicName,
    musicIndex: draft.musicIndex,
    isCustomizationComplete: draft.complete,
  };
}

export default function StudioPage() {
  const router = useRouter();
  const auth = useAuth();
  const { openLogin } = useLoginModal();
  const { uuid, selected: cardUuid } = router.query;

  const [step, setStep] = useState(0);
  const [card, setCard] = useState(null);
  const [catalogue, setCatalogue] = useState({ templates: [], fonts: {}, limits: { photos: 11, videoBytes: 60 * 1024 * 1024, headingChars: 60, paragraphChars: 400 } });
  const [music, setMusic] = useState([]);
  const [customization, setCustomization] = useState(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [photos, setPhotos] = useState([]); // [{index, url}]
  const [video, setVideo] = useState(null); // url
  const [busy, setBusy] = useState({ photo: 0, video: 0 });
  const [saveState, setSaveState] = useState('idle'); // idle | saving | saved | error
  const [loadError, setLoadError] = useState(null);
  const [muted, setMuted] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [ready, setReady] = useState(false);
  const audioRef = useRef(null);
  const [playingIdx, setPlayingIdx] = useState(null);
  const saveTimer = useRef(null);
  const loadedRef = useRef(false);

  const templates = catalogue.templates;
  const limits = catalogue.limits;
  const template = useMemo(() => templates.find((t) => t.id === draft.templateId) || templates[0] || {}, [templates, draft.templateId]);

  // ---- load ---------------------------------------------------------------
  useEffect(() => {
    if (!router.isReady || !uuid || !cardUuid || auth.isLoading) return;
    let cancelled = false;
    (async () => {
      try {
        const [c, cat, m] = await Promise.all([api.fetchCard(cardUuid), api.fetchTemplates(), api.fetchMusic().catch(() => [])]);
        if (cancelled) return;
        setCard(c); setCatalogue(cat); setMusic(m);
        const cust = await api.ensureCustomization({ cardUuid, uuid, user: auth.isAuthenticated ? auth.user : null });
        if (cancelled) return;
        setCustomization(cust);
        if (!loadedRef.current) {
          setDraft(fromArTemplateData(cust?.arTemplateData || {}, cat.templates));
          const p = [];
          for (let i = 0; i <= 10; i++) if (cust?.[`templateImage${i}`]) p.push({ index: i, url: api.absUrl(cust[`templateImage${i}`]) });
          setPhotos(p);
          setVideo(api.absUrl(cust?.templateVideo || cust?.arTemplateData?.videoUrl) || null);
          loadedRef.current = true;
        }
        setReady(true);
      } catch (err) {
        console.error(err);
        if (!cancelled) setLoadError(err?.response?.data?.msg || 'We could not open this card. Please go back and try again.');
      }
    })();
    return () => { cancelled = true; };
  }, [router.isReady, uuid, cardUuid, auth.isLoading, auth.isAuthenticated]);

  // ---- autosave -----------------------------------------------------------
  const persist = useCallback(async (nextDraft) => {
    if (!uuid || !templates.length) return;
    setSaveState('saving');
    try {
      await api.saveArData(uuid, toArTemplateData(nextDraft, templates));
      setSaveState('saved');
    } catch (err) {
      console.error(err);
      setSaveState('error');
    }
  }, [uuid, templates]);

  const update = useCallback((patch) => {
    setDraft((prev) => {
      const next = { ...prev, ...patch };
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => persist(next), 700);
      return next;
    });
  }, [persist]);

  // ---- media --------------------------------------------------------------
  const nextPhotoIndex = () => { for (let i = 0; i <= 10; i++) if (!photos.some((p) => p.index === i)) return i; return -1; };

  const onAddPhotos = async (files) => {
    const list = Array.from(files || []);
    for (const f of list) {
      const idx = nextPhotoIndex();
      if (idx < 0 || photos.length >= limits.photos) { toast.error(`You can add up to ${limits.photos} photos.`); break; }
      try {
        setBusy((b) => ({ ...b, photo: 0.05 }));
        const prepared = await preparePhoto(f);
        const url = await api.uploadPhoto(uuid, idx, prepared, (p) => setBusy((b) => ({ ...b, photo: Math.max(0.05, p) })));
        setPhotos((prev) => [...prev.filter((p) => p.index !== idx), { index: idx, url: `${url}${url.includes('?') ? '&' : '?'}v=${Date.now()}` }].sort((a, b) => a.index - b.index));
      } catch (err) {
        console.error(err);
        toast.error(err?.response?.data?.msg || err.message || 'That photo could not be uploaded.');
      } finally {
        setBusy((b) => ({ ...b, photo: 0 }));
      }
    }
  };

  const onRemovePhoto = async (index) => {
    try {
      await api.removeMedia(uuid, { isImage: true, index });
      setPhotos((prev) => prev.filter((p) => p.index !== index));
    } catch (err) { toast.error('Could not remove that photo.'); }
  };

  const onAddVideo = async (file) => {
    if (!file) return;
    if (!/^video\//.test(file.type)) return toast.error('Please choose a video file.');
    if (file.size > limits.videoBytes) return toast.error(`Videos must be under ${humanSize(limits.videoBytes)}. Try a shorter clip.`);
    try {
      setBusy((b) => ({ ...b, video: 0.05 }));
      const url = await api.uploadVideo(uuid, file, (p) => setBusy((b) => ({ ...b, video: Math.max(0.05, p) })));
      setVideo(url);
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.msg || 'The video could not be uploaded.');
    } finally {
      setBusy((b) => ({ ...b, video: 0 }));
    }
  };

  const onRemoveVideo = async () => {
    try { await api.removeMedia(uuid, { isImage: false }); setVideo(null); } catch (err) { toast.error('Could not remove the video.'); }
  };

  // ---- music preview ------------------------------------------------------
  const togglePlay = (m) => {
    if (playingIdx === m.index) { audioRef.current?.pause(); setPlayingIdx(null); return; }
    if (!audioRef.current) audioRef.current = new Audio();
    audioRef.current.src = m.url; audioRef.current.volume = 0.7;
    audioRef.current.play().catch(() => {});
    audioRef.current.onended = () => setPlayingIdx(null);
    setPlayingIdx(m.index);
  };
  useEffect(() => () => audioRef.current?.pause(), []);

  // ---- checkout -----------------------------------------------------------
  const onCheckout = async () => {
    if (!auth.isAuthenticated) {
      toast('Create an account or log in to order your card. Your design is saved.', { icon: '🔐' });
      localStorage.setItem('redirectToCheckout', 'true');
      openLogin();
      return;
    }
    setCheckingOut(true);
    try {
      // Make sure the draft is attached to this account (guest -> user migration).
      const cust = await api.ensureCustomization({ cardUuid, uuid, user: auth.user });
      setCustomization(cust);
      const finalDraft = { ...draft, complete: true };
      await api.saveArData(uuid, toArTemplateData(finalDraft, templates));
      setDraft(finalDraft);
      const blob = await renderPrintArtwork({
        heading: draft.heading, paragraph1: draft.paragraph1, paragraph2: draft.paragraph2,
        fontFamily: catalogue.fonts[template.printStyle?.font || template.font] || catalogue.fonts.sans,
        color: template.printStyle?.color || '#2b2b2b',
      });
      await api.uploadPrintArtwork(uuid, blob);
      router.push(`/checkout/${cust._id}`);
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.msg || 'Something went wrong preparing your order. Please try again.');
      setCheckingOut(false);
    }
  };

  // After a guest logs in mid-design, continue to checkout automatically.
  useEffect(() => {
    if (ready && auth.isAuthenticated && templates.length && localStorage.getItem('redirectToCheckout') === 'true') {
      localStorage.removeItem('redirectToCheckout');
      onCheckout();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, auth.isAuthenticated, templates.length]);

  const payload = useMemo(() => draftToPayload({ ...draft, _id: customization?._id }, card, { photos: photos.map((p) => p.url), video }), [draft, card, photos, video, customization]);

  const canContinue = step !== 0 || draft.heading.trim().length > 0 || draft.paragraph1.trim().length > 0;

  // ---- render -------------------------------------------------------------
  const PreviewPane = (
    <Box sx={{ position: 'relative', borderRadius: 3, overflow: 'hidden', bgcolor: '#14161e', height: { xs: 340, md: '100%' }, minHeight: { md: 520 } }}>
      {card && templates.length ? <Preview payload={payload} apiBase={API_BASE} muted={muted} /> : <Box sx={{ p: 6, textAlign: 'center' }}><CircularProgress /></Box>}
      <IconButton aria-label={muted ? 'Unmute preview' : 'Mute preview'} onClick={() => setMuted((m) => !m)} sx={{ position: 'absolute', right: 8, top: 8, bgcolor: 'rgba(0,0,0,.45)', color: '#fff' }} size="small">
        {muted ? <VolumeOffIcon fontSize="small" /> : <VolumeUpIcon fontSize="small" />}
      </IconButton>
      <Typography variant="caption" sx={{ position: 'absolute', left: 12, bottom: 8, color: 'rgba(255,255,255,.7)' }}>Live preview of what they&apos;ll see</Typography>
    </Box>
  );

  return (
    <>
      <Head>
        <title>Design your card | {APP_NAME}</title>
        {/* The site enables smooth scrolling globally; on a form-heavy page it only makes taps feel laggy. */}
        <style>{`html { scroll-behavior: auto !important; } body { overflow-x: hidden; }`}</style>
      </Head>
      <LandingNav />
      <Container maxWidth="lg" sx={{ pt: { xs: 10, md: 12 }, pb: 12 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <IconButton aria-label="Back" onClick={() => router.back()}><ArrowBackIcon /></IconButton>
          <Typography variant="h5" sx={{ fontWeight: 700, flex: 1 }}>{card?.title || 'Your card'}</Typography>
          <Chip size="small" label={saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved' : saveState === 'error' ? 'Not saved' : 'Auto-save on'} color={saveState === 'error' ? 'error' : saveState === 'saved' ? 'success' : 'default'} variant="outlined" />
        </Stack>

        {loadError && <Alert severity="error" sx={{ mb: 2 }}>{loadError}</Alert>}

        <Stepper activeStep={step} alternativeLabel sx={{ mb: 3, '& .MuiStepLabel-label': { fontSize: { xs: 11, sm: 13 } } }}>
          {STEPS.map((s) => <Step key={s}><StepLabel>{s}</StepLabel></Step>)}
        </Stepper>

        <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '5fr 6fr' }, alignItems: 'start' }}>
          {/* Preview: top on phones, left on desktop */}
          <Box sx={{ order: { xs: 0, md: 0 } }}>{PreviewPane}</Box>

          <Box sx={{ display: 'grid', gap: 2 }}>
            {step === 0 && (
              <>
                <Typography variant="h6">Write your greeting</Typography>
                <TextField label="Heading" placeholder="Happy Birthday, Sam!" value={draft.heading} onChange={(e) => update({ heading: e.target.value.slice(0, limits.headingChars) })} helperText={`${draft.heading.length}/${limits.headingChars}`} fullWidth />
                <TextField label="Your message" placeholder="Write something they'll remember…" value={draft.paragraph1} onChange={(e) => update({ paragraph1: e.target.value.slice(0, limits.paragraphChars) })} helperText={`${draft.paragraph1.length}/${limits.paragraphChars}`} multiline minRows={4} fullWidth />
                <TextField label="Sign-off" placeholder="With love, Ben" value={draft.paragraph2} onChange={(e) => update({ paragraph2: e.target.value.slice(0, 120) })} fullWidth />
                <Typography variant="body2" color="text.secondary">This text appears in AR and is printed inside your card.</Typography>
              </>
            )}

            {step === 1 && (
              <>
                <Typography variant="h6">Add photos and a video</Typography>
                <Typography variant="body2" color="text.secondary">Photos float above the card, the video plays on it. Up to {limits.photos} photos and one video under {humanSize(limits.videoBytes)}.</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))', gap: 1 }}>
                  {photos.map((p) => (
                    <Box key={p.index} sx={{ position: 'relative', aspectRatio: '1', borderRadius: 2, overflow: 'hidden', bgcolor: '#eee' }}>
                      <img src={p.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <IconButton size="small" aria-label="Remove photo" onClick={() => onRemovePhoto(p.index)} sx={{ position: 'absolute', top: 2, right: 2, bgcolor: 'rgba(0,0,0,.5)', color: '#fff' }}><DeleteOutlineIcon fontSize="small" /></IconButton>
                    </Box>
                  ))}
                  {photos.length < limits.photos && (
                    <Button component="label" variant="outlined" sx={{ aspectRatio: '1', borderRadius: 2, flexDirection: 'column', gap: .5 }} disabled={busy.photo > 0}>
                      <AddPhotoAlternateOutlinedIcon />
                      <span style={{ fontSize: 12 }}>Add</span>
                      <input hidden type="file" accept="image/*" multiple onChange={(e) => { onAddPhotos(e.target.files); e.target.value = ''; }} />
                    </Button>
                  )}
                </Box>
                {busy.photo > 0 && <LinearProgress variant="determinate" value={busy.photo * 100} />}

                <Box sx={{ mt: 1 }}>
                  {video ? (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <video src={video} controls playsInline style={{ width: 200, borderRadius: 8, background: '#000' }} />
                      <Button color="error" startIcon={<DeleteOutlineIcon />} onClick={onRemoveVideo}>Remove video</Button>
                    </Stack>
                  ) : (
                    <Button component="label" variant="outlined" startIcon={<VideocamOutlinedIcon />} disabled={busy.video > 0}>
                      Add a video
                      <input hidden type="file" accept="video/*" capture="environment" onChange={(e) => { onAddVideo(e.target.files?.[0]); e.target.value = ''; }} />
                    </Button>
                  )}
                  {busy.video > 0 && <LinearProgress variant="determinate" value={busy.video * 100} sx={{ mt: 1 }} />}
                </Box>
              </>
            )}

            {step === 2 && (
              <>
                <Typography variant="h6">Choose a style</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 1.5 }}>
                  {templates.map((t) => (
                    <Box key={t.id} role="button" tabIndex={0} onClick={() => update({ templateId: t.id, effect: t.effect })} onKeyDown={(e) => e.key === 'Enter' && update({ templateId: t.id, effect: t.effect })}
                      sx={{ p: 1.5, borderRadius: 2, cursor: 'pointer', border: 2, borderColor: draft.templateId === t.id ? 'primary.main' : 'divider', background: `linear-gradient(135deg, ${t.accent}22, transparent)` }}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Typography sx={{ fontWeight: 700 }}>{t.name}</Typography>
                        {draft.templateId === t.id && <CheckCircleIcon color="primary" fontSize="small" />}
                      </Stack>
                      <Typography variant="caption" color="text.secondary">{t.description}</Typography>
                    </Box>
                  ))}
                </Box>

                <Typography variant="subtitle1" sx={{ mt: 1 }}>Effect</Typography>
                <ToggleButtonGroup exclusive size="small" value={draft.effect} onChange={(e, v) => v && update({ effect: v })}>
                  <ToggleButton value="sparkles">Sparkles</ToggleButton>
                  <ToggleButton value="hearts">Hearts</ToggleButton>
                  <ToggleButton value="confetti">Confetti</ToggleButton>
                  <ToggleButton value="none">None</ToggleButton>
                </ToggleButtonGroup>

                <Typography variant="subtitle1" sx={{ mt: 1 }}>Music</Typography>
                <Stack spacing={.5} sx={{ maxHeight: 260, overflowY: 'auto', pr: 1 }}>
                  <Button size="small" variant={draft.musicUrl ? 'text' : 'contained'} onClick={() => update({ musicUrl: null, musicName: null, musicIndex: null })} sx={{ alignSelf: 'flex-start' }}>No music</Button>
                  {music.map((m) => (
                    <Stack key={m.index} direction="row" alignItems="center" spacing={1}>
                      <IconButton size="small" aria-label={playingIdx === m.index ? 'Pause' : 'Play'} onClick={() => togglePlay(m)}>{playingIdx === m.index ? <PauseIcon /> : <PlayArrowIcon />}</IconButton>
                      <Button size="small" variant={draft.musicUrl === m.url ? 'contained' : 'outlined'} onClick={() => update({ musicUrl: m.url, musicName: m.name, musicIndex: m.index })} sx={{ textTransform: 'none', justifyContent: 'flex-start', flex: 1 }}>{m.name?.replace(/\.[^.]+$/, '') || `Track ${m.index + 1}`}</Button>
                    </Stack>
                  ))}
                </Stack>
              </>
            )}

            {step === 3 && (
              <>
                <Typography variant="h6">Ready to order?</Typography>
                <Stack spacing={1}>
                  <Typography><b>Heading:</b> {draft.heading || <em>none</em>}</Typography>
                  <Typography sx={{ whiteSpace: 'pre-wrap' }}><b>Message:</b> {draft.paragraph1 || <em>none</em>}</Typography>
                  <Typography><b>Sign-off:</b> {draft.paragraph2 || <em>none</em>}</Typography>
                  <Typography><b>Photos:</b> {photos.length} · <b>Video:</b> {video ? 'yes' : 'no'} · <b>Style:</b> {template.name} · <b>Music:</b> {draft.musicName?.replace(/\.[^.]+$/, '') || 'none'}</Typography>
                </Stack>
                <Alert severity="info">Your greeting is printed inside the card. The recipient scans the QR code on the card to see the AR experience shown in the preview.</Alert>
                <Button size="large" variant="contained" onClick={onCheckout} disabled={checkingOut || !templates.length} sx={{ py: 1.5 }}>
                  {checkingOut ? 'Preparing your order…' : auth.isAuthenticated ? 'Continue to checkout' : 'Log in and continue to checkout'}
                </Button>
              </>
            )}

            <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
              <Button disabled={step === 0} onClick={() => setStep((s) => s - 1)}>Back</Button>
              {step < STEPS.length - 1 && <Button variant="contained" disabled={!canContinue} onClick={() => setStep((s) => s + 1)}>Next</Button>}
            </Stack>
          </Box>
        </Box>
      </Container>
    </>
  );
}
