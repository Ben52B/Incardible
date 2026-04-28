// import { useRouter } from 'next/router';
// import * as React from 'react';
// import { Fragment } from 'react';
// import {
//   Box,
//   Card,
//   CardActionArea,
//   CardMedia,
//   CardContent,
//   Typography,
//   Button,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   DialogContentText
// } from '@mui/material';
// import { Swiper, SwiperSlide } from 'swiper/react';
// import { Navigation, Autoplay } from 'swiper/modules';
// import EditIcon from '@mui/icons-material/Edit';
// import IconButton from '@mui/material/IconButton';
// import Tooltip from '@mui/material/Tooltip';
// import 'swiper/css';
// import 'swiper/css/navigation';
// import Link from 'next/link';

// const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
// let WEB_URL = process.env.NEXT_PUBLIC_WEB_URL;
// import DeleteIcon from '@mui/icons-material/Delete';
// import toast from 'react-hot-toast';
// import axios from 'axios';
// export default function CardsCarousel({ allCards = [] }) {
//   const router = useRouter();
//   // keep local copy so we can remove deleted cards from UI
//   const [cards, setCards] = React.useState(Array.isArray(allCards) ? allCards : []);
//   const [loadingId, setLoadingId] = React.useState(null);
//   const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
//   const [cardToDelete, setCardToDelete] = React.useState(null);
//   const gotoEditor = (uuid, cardUUID) => router.push(`/card-editor/${uuid}?selected=${cardUUID}`);

//   // check here the user created card if is pass 30 days than hide that cards
//   // also hide cards that are marked for deletion

//   const validCards = (Array.isArray(allCards) ? allCards : []).filter((data) => {
//     const createdDate = new Date(data?.createdAt);
//     const now = new Date();
//     const diffInDays = (now - createdDate) / (1000 * 60 * 60 * 24);
    
//     // Hide cards older than 30 days or marked for deletion
//     const isValid = diffInDays <= 30 && !data?.deleteMyCard;
    
//     // Debug logging
//     if (data?.deleteMyCard) {
//       console.log('Hiding deleted card:', data?.cardId?.title, data);
//     }
    
//     return isValid;
//   });

//   console.log('Total cards:', allCards.length, 'Valid cards:', validCards.length);

//   const handleDeleteClick = (card) => {
//     setCardToDelete(card);
//     setDeleteDialogOpen(true);
//   };

//   const handleDeleteConfirm = async () => {
//     if (!cardToDelete) return;
    
//     try {
//       setLoadingId(cardToDelete._id);
//       await axios.delete(`${BASE_URL}/api/user/ar-experience/remove-card/${cardToDelete._id}`);
      
//       // Update the card to mark it as deleted instead of removing it completely
//       setCards(prev => {
//         const updatedCards = prev.map(c => 
//           c._id === cardToDelete._id 
//             ? { ...c, deleteMyCard: true }
//             : c
//         );

        
//         console.log('Card marked as deleted:', cardToDelete._id);
//         console.log('Updated cards:', updatedCards);
//         return updatedCards;
//       });
      
//       toast.success('Card deleted successfully');
//     } catch (err) {
//       const msg = err?.response?.data?.msg || err?.response?.data?.message || 'Failed to delete card';
//       toast.error(msg);
//       console.error('delete card error', err);
//     } finally {
//       setLoadingId(null);
//       setDeleteDialogOpen(false);
//       setCardToDelete(null);
//     }
//   };

//   const handleDeleteCancel = () => {
//     setDeleteDialogOpen(false);
//     setCardToDelete(null);
//   };

//   return (
//     <Fragment>
//       <Swiper
//         modules={[Navigation, Autoplay]}
//         navigation
//         autoplay={{ delay: 3000, disableOnInteraction: false }}
//         spaceBetween={16}
//         slidesPerView={1}
//         breakpoints={{
//           0: { slidesPerView: 1 },   // phones — exactly one card
//           768: { slidesPerView: 1 },   // tablets
//           1024: { slidesPerView: 4 },   // small desktop
//           1280: { slidesPerView: 4 }   // large desktop
//         }}
//         style={{ paddingInline: 8, marginTop: '20px' }}
//       >
//         {(
//           validCards.map((data, idx) => {
//             const key = data?.uuid || idx;
//             const img = `${BASE_URL}/${data?.cardId?.frontDesign}`;
//             const title = data?.cardId?.title;
//             const price = data?.cardId?.price;

//           // Array.isArray(allCards) ? allCards : []).map((data, idx) => {
//           // const key = data?.uuid || idx;
//           // const img = `${BASE_URL}/${data?.cardId?.frontDesign}`;
//           // const title = data?.cardId?.title || 'Untitled';
//           // const price = data?.cardId?.price;
//           // const cardCreatedDate = data?.createdAt;
//           // console.log("cardCreatedDate", cardCreatedDate);

//           return (
//             <SwiperSlide key={key}>
//               <Card
//                 elevation={3}
//                 sx={{
//                   // height: '100%',
//                   display: 'flex',
//                   flexDirection: 'column',
//                   transition: 'transform 120ms ease, box-shadow 120ms ease',
//                   '&:hover': { boxShadow: 6, transform: 'translateY(-2px)' }
//                 }}
//               >
//                 <CardActionArea onClick={() => gotoEditor(data?.uuid, data?.cardId?.uuid)}>
//                   <CardMedia
//                     component="img"
//                     src={img}
//                     alt={title}
//                     loading="lazy"
//                     // sx={{ width: '100%', aspectRatio: '1 / 1.414', objectFit: 'cover' }}
//                     sx={{     width: '100%',
//                       height: { xs: '100% !important', md: '350px !important',  xl:'100% !important' }, // smaller height for mobile, bigger for desktop
//                       objectFit: 'cover',
//                       borderRadius: 2}}
//                     // sx={{ width: '100%',height:300, objectFit: 'cover' }}
//                   />
//                   <CardContent sx={{ pb: 1.5, pt: 1 }}>
//                     <Typography variant="h6"
//                                 sx={{ color: '#c165a0', fontWeight: 600, mb: 1, textAlign: 'left' }}>
//                       {title}
//                     </Typography>
//                     <Box
//                       sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
//                     >
//                       {/* Price on left */}
//                       <Typography
//                         variant="h6"
//                         color="text.secondary"
//                         sx={{ fontWeight: 'bolder' }}
//                       >
//                         {`${price} AUD`}
//                       </Typography>

//                       {/* Buttons on right */}
//                       <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                         <Tooltip title="Edit Card">
//                           <IconButton onClick={() => gotoEditor(data?.uuid, data?.cardId?.uuid)}>
//                             <EditIcon sx={{ color: '#c165a0' }}/>
//                           </IconButton>
//                         </Tooltip>



//                         <Button
//                           onClick={(e) => {
//                             e.stopPropagation();
//                             router.push(`/checkout/${data._id}`);
//                           }}
//                           variant="outlined"
//                           sx={{
//                             borderRadius: '20px !important',
//                             color: '#c165a0',
//                             px: 2,
//                             '&:hover': { backgroundColor: '#c165a0', color: 'white' }
//                           }}
//                         >
//                           Buy Now
//                         </Button>
//                         <Tooltip title="Delete Card Permanently">
//                           <IconButton
//                             disabled={loadingId === data._id}
//                             onClick={(e) => {
//                               e.stopPropagation();
//                               handleDeleteClick(data);
//                             }}
//                           >
//                             <DeleteIcon sx={{ color: loadingId === data._id ? 'gray' : '#c165a0' }}/>
//                           </IconButton>
//                         </Tooltip>
//                       </Box>

//                     </Box>
//                   </CardContent>
//                 </CardActionArea>
//               </Card>
//             </SwiperSlide>
//           );
//         }))}
//       </Swiper>

//       {/* Delete Confirmation Dialog */}
//       <Dialog
//         open={deleteDialogOpen}
//         onClose={handleDeleteCancel}
//         aria-labelledby="delete-dialog-title"
//         aria-describedby="delete-dialog-description"
//       >
//         <DialogTitle id="delete-dialog-title">
//           Delete Card
//         </DialogTitle>
//         <DialogContent>
//           <DialogContentText id="delete-dialog-description">
//             Are you sure you want to delete this card? This action cannot be reversible.
//           </DialogContentText>
//         </DialogContent>
//         <DialogActions>
//           <Button onClick={handleDeleteCancel} color="primary">
//             Cancel
//           </Button>
//           <Button 
//             onClick={handleDeleteConfirm} 
//             variant="contained"
//             disabled={loadingId === cardToDelete?._id}
//             sx={{
//               backgroundColor: '#c165a0',
//               color: 'white',
//               '&:hover': {
//                 backgroundColor: '#c165a0',
//                 color: 'white'
//               },
//               '&:disabled': {
//                 backgroundColor: '#c165a0',
//                 color: 'white',
//                 opacity: 0.6
//               }
//             }}
//           >
//             {loadingId === cardToDelete?._id ? 'Deleting...' : 'Delete'}
//           </Button>
//         </DialogActions>
//       </Dialog>
//     </Fragment>
//   );
// }
import { useRouter } from 'next/router';
import * as React from 'react';
import { Fragment, useMemo, useRef, useEffect, useState } from 'react';
import {
  Box, Card, CardActionArea, CardMedia, CardContent, Typography, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText, Tooltip, IconButton
} from '@mui/material';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import 'swiper/css';
import 'swiper/css/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function CardsCarousel({ allCards = [] }) {
  const router = useRouter();

  // local state + keep in sync if parent updates
  const [cards, setCards] = React.useState(Array.isArray(allCards) ? allCards : []);
  useEffect(() => setCards(Array.isArray(allCards) ? allCards : []), [allCards]);

  const [loadingId, setLoadingId] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cardToDelete, setCardToDelete] = useState(null);

  // ✅ define swiper ref
  const swiperRef = useRef(null);

  const gotoEditor = (uuid, cardUUID) =>
    router.push(`/card-editor/${uuid}?selected=${cardUUID}`);

  // ✅ derive from STATE
  const validCards = useMemo(() => {
    return (Array.isArray(cards) ? cards : []).filter((data) => {
      if (data?.deleteMyCard) return false;

      const createdDate = data?.createdAt ? new Date(data.createdAt) : null;
      if (!createdDate || Number.isNaN(createdDate.getTime())) return false;

      const now = new Date();
      const diffInDays = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
      const isPaid =
        data?.isPaid === true ||
        data?.isPaid === 'true' ||
        data?.isPaid === 1 ||
        data?.isPaid === '1';
      const maxAgeDays = isPaid ? 90 : 7;

      return diffInDays <= maxAgeDays;
    });
  }, [cards]);

  const handleDeleteClick = (card) => {
    setCardToDelete(card);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!cardToDelete) return;
    try {
      setLoadingId(cardToDelete._id);
      await axios.delete(`${BASE_URL}/api/user/ar-experience/remove-card/${cardToDelete._id}`);

      // ✅ optimistic UI: mark then remove
      setCards((prev) => {
        const next = prev
          .map((c) => (c._id === cardToDelete._id ? { ...c, deleteMyCard: true } : c))
          .filter((c) => !c.deleteMyCard);

        // after DOM updates, refresh Swiper layout safely
        requestAnimationFrame(() => swiperRef.current?.update?.());
        return next;
      });

      toast.success('Card deleted successfully');
    } catch (err) {
      const msg = err?.response?.data?.msg || err?.response?.data?.message || 'Failed to delete card';
      toast.error(msg);
      console.error('delete card error', err);
    } finally {
      setLoadingId(null);
      setDeleteDialogOpen(false);
      setCardToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setCardToDelete(null);
  };

  return (
    <Fragment>
      <Swiper
        modules={[Navigation, Autoplay]}
        navigation
        autoplay={{ delay: 3000, disableOnInteraction: false }}
        spaceBetween={16}
        slidesPerView={1}
        breakpoints={{ 0: { slidesPerView: 1 }, 768: { slidesPerView: 1 }, 1024: { slidesPerView: 4 }, 1280: { slidesPerView: 4 } }}
        style={{ paddingInline: 8, marginTop: '20px' }}
        onSwiper={(s) => (swiperRef.current = s)} // ✅ capture instance
      >
        {validCards.map((data) => {
          const key = data?._id || data?.uuid;
          const img = `${BASE_URL}/${data?.cardId?.frontDesign}`;
          const title = data?.cardId?.title;
          const price = data?.cardId?.price;
          const isPaid =
            data?.isPaid === true ||
            data?.isPaid === 'true' ||
            data?.isPaid === 1 ||
            data?.isPaid === '1';

          return (
            <SwiperSlide key={key}>
              <Card
                elevation={3}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  transition: 'opacity 160ms ease, transform 160ms ease, box-shadow 120ms ease',
                  '&:hover': { boxShadow: 6, transform: 'translateY(-2px)' }
                }}
              >
                <CardActionArea
                  disabled={isPaid}
                  onClick={() => {
                    if (isPaid) return;
                    gotoEditor(data?.uuid, data?.cardId?.uuid);
                  }}
                  sx={{
                    cursor: isPaid ? 'not-allowed' : 'pointer',
                    opacity: isPaid ? 0.85 : 1
                  }}
                >
                  <CardMedia
                    component="img"
                    src={img}
                    alt={title}
                    loading="lazy"
                    sx={{
                      width: '100%',
                      height: { xs: '350px !important', md: '350px !important', lg:'350px' , xl: '100% !important' },
                      objectFit: 'cover',
                      borderRadius: 2
                    }}
                  />
                  <CardContent sx={{ pb: 1.5, pt: 1, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                    <Typography variant="h6" sx={{ color: '#c165a0', fontWeight: 600, mb: 1, textAlign: 'left' }}>
                      {title}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 'bolder' }}>
                        {`${price} $`}
                      </Typography>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Tooltip title={isPaid ? 'Paid cards cannot be edited' : 'Edit Card'}>
                          <span>
                            <IconButton
                              disabled={isPaid}
                              onClick={(e) => {
                                if (isPaid) return;
                                e.stopPropagation();
                                gotoEditor(data?.uuid, data?.cardId?.uuid);
                              }}
                              sx={{ color: isPaid ? 'rgba(0,0,0,0.26)' : '#c165a0' }}
                            >
                              <EditIcon />
                            </IconButton>
                          </span>
                        </Tooltip>

                        {isPaid ? (
                          // Show as Badge when paid
                          <Box
                            sx={{
                              backgroundColor: '#28a745',
                              color: 'white',
                              px: 2,
                              py: 0.5,
                              borderRadius: '20px',
                              fontSize: '0.875rem',
                              fontWeight: 500,
                              textAlign: 'center',
                              minWidth: '80px',
                              height: '32px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            ✓ Paid
                          </Box>
                        ) : (
                          // Show as Badge when not paid
                          <Box
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/checkout/${data._id}`);
                            }}
                            sx={{
                              backgroundColor: '#c165a0',
                              color: 'white',
                              px: 2,
                              py: 0.5,
                              borderRadius: '20px',
                              fontSize: '0.875rem',
                              fontWeight: 500,
                              textAlign: 'center',
                              minWidth: '80px',
                              height: '32px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                backgroundColor: '#a0528a',
                                transform: 'translateY(-1px)'
                              }
                            }}
                          >
                            Buy Now
                          </Box>
                        )}

                        <Tooltip title="Delete Card Permanently">
                          <IconButton
                            disabled={loadingId === data._id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(data);
                            }}
                          >
                            <DeleteIcon sx={{ color: loadingId === data._id ? 'gray' : '#c165a0' }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </SwiperSlide>
          );
        })}
      </Swiper>

      {validCards.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
          <Typography>No cards to show.</Typography>
        </Box>
      )}

      <Dialog 
        open={deleteDialogOpen} 
        onClose={handleDeleteCancel} 
        aria-labelledby="delete-dialog-title" 
        aria-describedby="delete-dialog-description"
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            width: 500,
            backgroundColor: '#FDF7FB',
            border: '2px solid #E697B1',
            borderRadius: 3
          }
        }}
      >
        <DialogTitle id="delete-dialog-title">Delete Card</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete this card? 
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleDeleteCancel}
            variant="contained"
            sx={{
              borderRadius: '16px !important',
              backgroundColor: '#d9d9d9',
              color: '#444444',
              px: 4,
              py: 1,
              fontSize: '16px',
              '&:hover': { 
                backgroundColor: '#d9d9d9',
                color: '#444444',
              },
              transition: 'all 0.2s ease'
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            disabled={loadingId === cardToDelete?._id}
            sx={{
              borderRadius: '16px !important',
              backgroundColor: '#C1649F',
              color: '#ffffff',
              px: 4,
              py: 1,
              fontSize: '16px',
              '&:hover': { 
                backgroundColor: '#C1649F',
                boxShadow: '0 4px 12px rgba(230, 151, 177, 0.3)'
              },
              '&:disabled': { 
                backgroundColor: '#C1649F', 
                color: '#ffffff', 
                opacity: 0.6 
              },
              transition: 'all 0.2s ease'
            }}
          >
            {loadingId === cardToDelete?._id ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Fragment>
  );
}
