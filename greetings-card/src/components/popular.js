import Head from 'next/head';
import {
  Card,
  CardContent,
  Container,
  Typography,
  Grid, Box, useTheme, useMediaQuery, Tooltip
} from '@mui/material';
import { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import * as React from 'react';
import NextLink from 'next/link';
import CardActions from '@mui/material/CardActions';
import CardMedia from '@mui/material/CardMedia';
import Button from '@mui/material/Button';
import { useRouter } from 'next/router';
import { v4 as uuidv4 } from 'uuid';

import 'swiper/css';
import 'swiper/css/pagination';
import { Pagination, Autoplay } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const PopularCards = () => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL;
  const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME;
  const router = useRouter();

  const [popularCards, setPopularCards] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Raw card array for when no popular cards are available
  const rawCardArray = [
    { _id: 'raw-1', frontDesign: `${WEB_URL}/1.png`, title: 'Birthday Card 1' },
    { _id: 'raw-2', frontDesign: `${WEB_URL}/2.png`, title: 'Birthday Card 2' },
    { _id: 'raw-3', frontDesign: `${WEB_URL}/3.png`, title: 'Birthday Card 3' },
    { _id: 'raw-4', frontDesign: `${WEB_URL}/4.png`, title: 'Birthday Card 4' },
    { _id: 'raw-5', frontDesign: `${WEB_URL}/1.png`, title: 'Birthday Card 5' },
    { _id: 'raw-6', frontDesign: `${WEB_URL}/2.png`, title: 'Birthday Card 6' },
    { _id: 'raw-7', frontDesign: `${WEB_URL}/3.png`, title: 'Birthday Card 7' }
  ];

  // Resolve full image URL from path or absolute
  const resolveImageUrl = (value) => {
    if (!value || typeof value !== 'string') return '';
    if (value.startsWith('http://') || value.startsWith('https://')) return value;
    const base = (API_BASE_URL || '').replace(/\/$/, '');
    const path = value.startsWith('/') ? value : `/${value}`;
    return `${base}${path}`;
  };

  const gotoEditor = (cardUUID) => {
    const uuid = uuidv4();
    router.push(`/studio/${uuid}?selected=${cardUUID}`);
  };

  // Simple logic: show popular cards if available, otherwise show empty array
  const getDisplayCards = () => {
    if (popularCards.length > 0) {
      // If we have popular cards, show them
      console.log('Showing popular cards:', popularCards.length);
      return popularCards;
    } else {
      // If no popular cards, return empty array to show "no cards found" message
      console.log('No popular cards found');
      return [];
    }
  };

  useEffect(() => {
    const fetchPopularCards = async () => {
      try {
        setLoading(true);
        console.log('Fetching popular cards from:', `${API_BASE_URL}/api/statistics/popular-cards?limit=15`);
        
        const response = await axios.get(`${API_BASE_URL}/api/statistics/popular-cards?limit=15`);
        
        if (response.data && response.data.success && response.data.data) {
          console.log('Popular cards fetched successfully:', response.data.data);
          setPopularCards(response.data.data);
        } else {
          console.log('No popular cards data received');
          setPopularCards([]);
        }
      } catch (error) {
        console.error('Error fetching popular cards:', error);
        setPopularCards([]);
        // Don't show error toast to users, just fall back to raw cards
      } finally {
        setLoading(false);
      }
    };

    fetchPopularCards();
  }, []);

  console.log("popularCards", popularCards);

  return (
    <>
      <Head>
        <title>Homepage | {APP_NAME}</title>
      </Head>
      <Box
        sx={{
          overflowX: 'hidden',
          width: '100%',
          height:'100%',
          backgroundColor: '#1a1d25 !important',
          pl: '3%',
          pr: '3%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Box
          data-aos="zoom-in"
          data-aos-duration="600"
          data-aos-easing="ease-in"
          sx={{
            pt:5, pb:5,
            width: '100%',
            height:"100%"
          }}
        >
          {/* Button */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Box
              sx={{
                color:'#c09b9b',
                borderRadius: '30px !important',
                fontSize: { md: '45px', xs: '25px' },
                fontWeight:'bolder',
                userSelect: 'none',   // ❌ prevent text selection
                caretColor: 'transparent', // ❌ hide cursor
                pointerEvents: 'auto',
                cursor: 'default'
              }}
            >
              Popular Cards
            </Box>
          </Box>

          {/* Swiper */}
          <Box sx={{ mt: 3 }}>
            {loading ? (
              <Box sx={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight: 200 }}>
                <Typography variant="h6" sx={{ color: '#c9cbd3', textAlign: 'center' }}>
                  Loading popular cards...
                </Typography>
              </Box>
            ) : getDisplayCards().length === 0 ? (
              <Box sx={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight: 200 }}>
                <Typography variant="h6" sx={{ color: '#c9cbd3', textAlign: 'center' }}>
                  No popular cards found
                </Typography>
              </Box>
            ) : (
              <Swiper
                dir="rtl"
                direction="horizontal"
                autoplay={{ delay: 1500 }}
                loop={getDisplayCards().length > 1}
                breakpoints={{
                  360:{slidesPerView: 2, spaceBetween: 10},
                  344:{slidesPerView: 2, spaceBetween: 10},
                  375:{slidesPerView: 3, spaceBetween: 20},
                  640: { slidesPerView: 3, spaceBetween: 0 },
                  768: { slidesPerView: 4, spaceBetween: 20 },
                  1024: { slidesPerView: 4, spaceBetween: 20 },
                  1400: { slidesPerView: 7, spaceBetween: 20 },
                  2000:{ slidesPerView: 8, spaceBetween: 20},
                  3000:{ slidesPerView: 13, spaceBetween: 20},
                }}
                pagination={{
                  clickable: true,
                  type: 'bullets',
                  bulletClass: 'swiper-pagination-bullet',
                  renderBullet: (index, className) => {
                    return `<span class="${className}" style="width: 15px; height: 15px;"></span>`;
                  },
                }}
                modules={[Pagination, Autoplay]}
                className="mySwiper"
              >
                {getDisplayCards().map((card, index) => {
                  console.log('Rendering card:', card._id, card.title, card.frontDesign);
                  return (
//                     <SwiperSlide key={card._id || index}>
//   <Box
//     onClick={() => gotoEditor(card._id)}
//     sx={{
//       position: 'relative',
//       display: 'grid',
//       placeItems: 'center',
//       py: 5,              // extra vertical space so top/bottom cut na ho
//       mb: 6,
//       cursor: 'pointer',
//       overflow: 'visible',
//       minHeight: { xs: 260, md: 300 } // enough room for rotated envelope
//     }}
//   >
//     {card.envelope && (
//       <Box
//         component="img"
//         src={resolveImageUrl(card.envelope)}
//         alt="Envelope"
//         sx={{
//           position: 'absolute',
//           top: 24,                       // tweak if needed
//           left: '50%',                   // center horizontally
//           transform: 'translateX(-50%) rotate(-15deg)',
//           // width: { xs: '92%', md: '100%' },
//           zIndex: 0,
//           borderRadius: 1,
//           filter: 'drop-shadow(0 8px 18px rgba(0,0,0,0.35))',
//           pointerEvents: 'none',
//         }}
//       />
//     )}
//  <Box
//                           component="img"
//                           src={card.frontDesign ? resolveImageUrl(card.frontDesign) : (card.url || `${WEB_URL}/1.png`)}
//                           alt={card.title || `card${index}`}
//                           sx={{
//                             width:'100%',
//                             // width: {
//                             //   xs: '100%',
//                             //   md: '40%',
//                             //   lg:'30%',
//                             //   xl:'20%'
//                             // },
//                             height: 'auto',
//                             display: 'block',
//                             mx: 'auto',
//                             my: 2,
//                             // borderRadius: 2,
//                             boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
//                             transition: 'transform 0.3s ease, box-shadow 0.3s ease',
//                             '&:hover': {
//                               transform: 'scale(1.05)',
//                               boxShadow: '0 8px 16px rgba(0,0,0,0.4)',
//                             }
//                           }}
//                         />
//   </Box>
// </SwiperSlide>

<SwiperSlide key={card._id || index}>
  {(card?.insideLeftDesign || card?.insideRightDesign) ? (
    <Tooltip
      title={
        <Box sx={{
          display: 'flex',
          gap: 1,
          p: 1,
          flexDirection: { xs: 'column', md: 'row' }
        }}>
          {card?.insideLeftDesign && (
            <Box
              component="img"
              src={`${BASE_URL}/${card.insideLeftDesign.replace(/\\/g, '/')}`}
              alt="Inside Left"
              sx={{
                width: { xs: '150px', md: '200px' },
                aspectRatio: '1 / 1.414',
                objectFit: 'contain',
                borderRadius: 1,
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
              }}
            />
          )}
          {card?.insideRightDesign && (
            <Box
              component="img"
              src={`${BASE_URL}/${card.insideRightDesign.replace(/\\/g, '/')}`}
              alt="Inside Right"
              sx={{
                width: { xs: '150px', md: '200px' },
                aspectRatio: '1 / 1.414',
                objectFit: 'contain',
                borderRadius: 1,
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
              }}
            />
          )}
        </Box>
      }
      arrow={false}
      enterDelay={300}
      leaveDelay={100}
      PopperProps={{
        placement: 'top',
        modifiers: [
          {
            name: 'offset',
            options: {
              offset: ({ placement, reference, popper }) => {
                // Get actual card dimensions (responsive)
                const cardHeight = reference.height || 0;
                const cardWidth = reference.width || 0;
                
                // Calculate card height based on screen size if not available
                // Popular cards use: xs: '140px', sm: '180px', md: '220px', lg: '260px'
                const calculatedCardHeight = cardHeight || (cardWidth * 1.414) || 260;
                
                // Center tooltip on card (no title overlay in popular cards)
                const offsetX = 0; // Horizontally centered by default
                const offsetY = -(calculatedCardHeight / 2);
                
                return [offsetX, offsetY];
              },
            },
          },
          {
            name: 'flip',
            enabled: false,
          },
          {
            name: 'preventOverflow',
            enabled: true,
            options: {
              boundary: 'viewport',
              padding: 8,
              altAxis: true,
            },
          },
        ],
        style: {
          pointerEvents: 'none'
        }
      }}
      componentsProps={{
        tooltip: {
          sx: {
            backgroundColor: '#EEE3EA',
            border: '2px solid #E697B1',
            borderRadius: 2,
            maxWidth: 'none',
            p: 1.5,
            m: 0
          }
        }
      }}
    >
      <Box
        onClick={() => gotoEditor(card.uuid)}
        sx={{
          position: 'relative',
          display: 'inline-flex',
          justifyContent: 'center',
          alignItems: 'center',
          mt: 5, mb: 6,
          cursor: 'pointer',
          overflow: 'visible',
          '&:hover': {
            transform: 'scale(1.05)',
            boxShadow: '0 12px 20px rgba(0,0,0,0.45)',
          },
          // ONE source of truth
          '--cardH': { xs: '140px', sm: '180px', md: '220px', lg: '260px' },
          '--cardW': 'calc(var(--cardH) * 0.7)',
          minHeight: 'calc(var(--cardH) + 20px)',
        }}
      >
        {/* Envelope (behind, tilted) */}
        {card.envelope && (
          <Box
            component="img"
            src={resolveImageUrl(card.envelope)}
            alt="Envelope"
            sx={{
              position: 'absolute',
              top: 10,
              left: '50%',
              width: 'var(--cardW) !important',
              height: 'var(--cardH) !important',
              objectFit: 'cover',
              transform: 'translateX(-50%) rotate(-30deg)',
              transformOrigin: 'center',
              zIndex: 0,
              display: 'block',
              filter: 'drop-shadow(0 8px 18px rgba(0,0,0,0.35))',
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Card (straight, aligned on top) */}
        <Box
          sx={{
            position: 'relative',
            zIndex: 2,
            width: 'var(--cardW)',
            height: 'var(--cardH)',
            overflow: 'hidden',
            boxShadow: '0 6px 12px rgba(0,0,0,0.35)',
          }}
        >
          <Box
            component="img"
            src={card.frontDesign ? resolveImageUrl(card.frontDesign) : (card.url || `${WEB_URL}/1.png`)}
            alt={card.title || `card${index}`}
            sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block'}}
          />
        </Box>
      </Box>
    </Tooltip>
  ) : (
    <Box
      onClick={() => gotoEditor(card.uuid)}
      sx={{
        position: 'relative',
        display: 'inline-flex',
        justifyContent: 'center',
        alignItems: 'center',
        mt: 5, mb: 6,
        cursor: 'pointer',
        overflow: 'visible',
        '&:hover': {
          transform: 'scale(1.05)',
          boxShadow: '0 12px 20px rgba(0,0,0,0.45)',
        },
        // ONE source of truth
        '--cardH': { xs: '140px', sm: '180px', md: '220px', lg: '260px' },
        '--cardW': 'calc(var(--cardH) * 0.7)',
        minHeight: 'calc(var(--cardH) + 20px)',
      }}
    >
      {/* Envelope (behind, tilted) */}
      {card.envelope && (
        <Box
          component="img"
          src={resolveImageUrl(card.envelope)}
          alt="Envelope"
          sx={{
            position: 'absolute',
            top: 10,
            left: '50%',
            width: 'var(--cardW) !important',
            height: 'var(--cardH) !important',
            objectFit: 'cover',
            transform: 'translateX(-50%) rotate(-30deg)',
            transformOrigin: 'center',
            zIndex: 0,
            display: 'block',
            filter: 'drop-shadow(0 8px 18px rgba(0,0,0,0.35))',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Card (straight, aligned on top) */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 2,
          width: 'var(--cardW)',
          height: 'var(--cardH)',
          overflow: 'hidden',
          boxShadow: '0 6px 12px rgba(0,0,0,0.35)',
        }}
      >
        <Box
          component="img"
          src={card.frontDesign ? resolveImageUrl(card.frontDesign) : (card.url || `${WEB_URL}/1.png`)}
          alt={card.title || `card${index}`}
          sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block'}}
        />
      </Box>
    </Box>
  )}
</SwiperSlide>




//  <SwiperSlide key={card._id || index}>
//   <Box
//     onClick={() => gotoEditor(card.uuid)}
//     sx={{
//       position: 'relative',
//       display: 'grid',
//       placeItems: 'center',
//       py: 5,
//       mb: 6,
//       cursor: 'pointer',
//       overflow: 'visible',

//       // 🔑 fixed size for all screens
//       '--cardH': '350px',
//       // '--cardW': '300px', // adjust as per ratio
//     }}
//   >

//     {card.envelope && (
//       <Box
//         component="img"
//         src={resolveImageUrl(card.envelope)}
//         alt="Envelope"
//         sx={{
//           position: 'absolute',
//           top: 24,
//           left: '50%',
//           // width: 'var(--cardW)',
//           height: 'var(--cardH)',     // ✅ fixed 400px
//           // objectFit: 'covesr',
//           transform: 'translateX(-50%) rotate(-15deg)',
//           zIndex: 0,
//           filter: 'drop-shadow(0 8px 18px rgba(0,0,0,0.35))',
//           pointerEvents: 'none',
//         }}
//       />
//     )}

  
//     <Box
//       sx={{
//         position: 'relative',
//         zIndex: 2,
//         // width: 'var(--cardW)',
//         height: 'var(--cardH)',       // ✅ fixed 400px
//         // borderRadius: 2,
//         overflow: 'hidden',
//         // boxShadow: '0 6px 12px rgba(0,0,0,0.35)',
//         transition: 'transform .3s ease, box-shadow .3s ease',
//         '&:hover': {
//           transform: 'scale(1.05)',
//           boxShadow: '0 12px 20px rgba(0,0,0,0.45)',
//         },
//       }}
//     >
//       <Box
//         component="img"
//         src={card.frontDesign ? resolveImageUrl(card.frontDesign) : (card.url || `${WEB_URL}/1.png`)}
//         alt={card.title || `card${index}`}
//         sx={{
//           width:'100%',
//           // width: 'var(--cardW)',
//           height: 'var(--cardH)',  
//           // width: '100%',
//           // height: '100%',
//           // objectFit: 'cover',
//           display: 'block',
//         }}
//       />
//     </Box>
//   </Box>
// </SwiperSlide> 



          
//  <SwiperSlide key={card._id || index} >
// <Box
//   onClick={() => gotoEditor(card.uuid)}
//   sx={{
//     position: 'relative',
//     display: 'grid',
//     placeItems: 'center',
//     py: 5,
//     mb: 6,
//     cursor: 'pointer',
//     overflow: 'visible',
//     // minHeight: { xs: 260, md: 500 }
//   }}
// >

//   {card.envelope && (
//     <Box
//       component="img"
//       src={resolveImageUrl(card.envelope)}
//       alt="Envelope"
//       sx={{
//         position: 'absolute',
//         top: 28,
//         left: '50%',
//         width: { xs: '74%', md: '70%' }, // Same width as card
//         height: 'auto',
//         transform: 'translateX(-50%) rotate(-20deg)',
//         zIndex: 0,                       // ✅ always behind
//         borderRadius: 1,
//         filter: 'drop-shadow(0 8px 18px rgba(0,0,0,0.35))',
//         pointerEvents: 'none'
//       }}
//     />
//   )}

//   <Box
//     component="img"
//     src={card.frontDesign ? resolveImageUrl(card.frontDesign) : (card.url || `${WEB_URL}/1.png`)}
//     alt={card.title || `card${index}`}
//     sx={{
//       position: 'relative',
//       zIndex: 2,                       // ✅ always above envelope
//       width: { xs: '74%', md: '70%' }, // Same width as envelope
//       height: 200,
//       display: 'block',
//       mx: 'auto',
//       my: 2,
//       borderRadius: 2,
//       boxShadow: '0 6px 12px rgba(0,0,0,0.35)',
//       transition: 'transform 0.3s ease, box-shadow 0.3s ease',
//       '&:hover': {
//         transform: 'scale(1.05)',
//         boxShadow: '0 12px 20px rgba(0,0,0,0.45)',
//       }
//     }}
//   />
// </Box>
// </SwiperSlide> 
  




                  );
                })}
              </Swiper>
            )}
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default PopularCards;


                    // <SwiperSlide key={card._id || index}>
                    //   <Box 
                    //     sx={{ 
                    //       display:'flex', 
                    //       flexDirection:'column', 
                    //       alignItems:'center', 
                    //       py: 2, 
                    //       mb:5,
                    //       cursor: 'pointer'
                    //     }}
                    //     onClick={() => gotoEditor(card._id)}
                    //   >
                    //     <Box
                    //       component="img"
                    //       src={card.frontDesign ? resolveImageUrl(card.frontDesign) : (card.url || `${WEB_URL}/1.png`)}
                    //       alt={card.title || `card${index}`}
                    //       sx={{
                    //         width:'100%',
                    //         // width: {
                    //         //   xs: '100%',
                    //         //   md: '40%',
                    //         //   lg:'30%',
                    //         //   xl:'20%'
                    //         // },
                    //         height: 'auto',
                    //         display: 'block',
                    //         mx: 'auto',
                    //         my: 2,
                    //         borderRadius: 2,
                    //         boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                    //         transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    //         '&:hover': {
                    //           transform: 'scale(1.05)',
                    //           boxShadow: '0 8px 16px rgba(0,0,0,0.4)',
                    //         }
                    //       }}
                    //     />
                        {/* {card.title && (
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: '#c9cbd3', 
                              textAlign: 'center',
                              mt: 1,
                              fontSize: '0.9rem'
                            }}
                          >
                            {card.title}
                          </Typography>
                        )} */}
                      {/* </Box>
                    </SwiperSlide> */}