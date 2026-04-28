import Head from 'next/head';
import {
  Card,
  CardContent,
  Container,
  Typography,
  Grid, Box, useMediaQuery, useTheme
} from '@mui/material';
import { useEffect, useState } from 'react';
import * as React from 'react';
import StarIcon from '@mui/icons-material/Star';

// Import Swiper React components
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';

// import required modules

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const Clients = () => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL;
  const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME;
  const testimonials = [
    {
      name: 'Emily G, VIC',
      title: 'Absolutely loved it!',
      review: 'Such a clever idea. It made the card feel so personal and everyone who saw it was amazed. Will definitely be buying more.'
    },
    {
      name: 'Sarah L, VIC',
      title: 'Really touched by it',
      review: 'This made the whole message feel so much more personal. It’s a simple idea but it adds a lot of emotion, and the reaction was so warm. It felt meaningful in a way traditional cards don’t, and I love that it creates a moment people actually remember.'
    },
    {
      name: 'Daniel K, NSW',
      title: 'A lovely way to share a message',
      review: 'The card looked beautiful, and the added experience just made everything more heartfelt. It’s soft, warm, and such a nice way to make someone feel appreciated. It really lifts the whole gesture.'
    },
    {
      name: 'Nick R, WA',
      title: 'Highly recommend',
      review: 'Great quality, quick delivery, and such a creative idea. It’s a perfect gift when you want to make someone feel special.'
    },
    {
      name: 'Tara L, VIC',
      title: '',
      review: 'I love that you can hold it and also have something digital to remember it by.'
    },
    {
      name: 'Matthew D, SA',
      title: 'A really thoughtful gift',
      review: 'It’s the kind of thing people remember because it stands out. I’ll be ordering more whenever I want to send something with a bit more meaning behind it.'
    },
    {
      name: 'Alicia M, QLD',
      title: 'Made me smile straight away',
      review: 'It’s such a sweet concept. Simple, thoughtful, and really makes an impression. I was honestly surprised by how beautiful it looked. Great quality and such a nice way to share a message. Everyone I’ve shown wants to try it now.'
    }
  ];

  return (
    <>
      <Head>
        <title>Homepage | {APP_NAME}</title>
      </Head>
      <Box
        sx={{
          overflowX: 'hidden',
          width: '100%',
          overflowY: 'hidden',
          // pl:'20%', pr:'20%',
          // bgcolor:'red',
          height: '100%',
          // bgcolor:'red',
          // height: {md: '100vh', xs:'100%' },
          // minHeight: '100vh',
          // bgcolor:"black",
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
          // backgroundImage: `url(${WEB_URL}/bg1.png)`,
          // backgroundSize: 'cover',
          // backgroundPosition: 'center',
          // backgroundRepeat: 'no-repeat'
        }}
      >
        <Container
          data-aos="zoom-in"
          data-aos-duration="600"
          data-aos-easing="ease-in"
          sx={{
            pt: {md: 5, xs:0 },
            pb: {md: 5, xs:0 },
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column',
            height: '100%'
          }}
        >
          <Typography
            // gutterBottom
            // variant="h3"
            padding="10px"
            sx={{
              textAlign: 'center',
              fontWeight: 900,
              color: { xs: '#c165a0', md: '#1A1D25' },
              fontSize: { md: '40px',xs: '25px'},
              userSelect: 'none',   // ❌ prevent text selection
              caretColor: 'transparent', // ❌ hide cursor
              pointerEvents: 'auto',
              cursor: 'default',
            }}
          >
            Our Happy Clients
          </Typography>
          <Swiper
            autoplay={{ delay: 3000 }}
            loop={true}
            modules={[Pagination, Autoplay]}
            spaceBetween={30}
            className="mySwiper"
            slidesPerView={1}
            breakpoints={{
              640: { slidesPerView: 1 },
              768: { slidesPerView: 1 },
              1024: { slidesPerView: 1 },
              1400: { slidesPerView: 1 },
              2000: { slidesPerView: 1 }
            }}
            pagination={{
              clickable: true,
              type: 'bullets',
              bulletClass: 'swiper-pagination-bullet',
              renderBullet: (index, className) => {
                return `<span class="${className}" style="width: 15px; height: 15px;"></span>`;
              }
            }}
          >
            {(isSmallScreen
                ? testimonials.map((testimonial) => [testimonial]) // 1 per slide
                : Array.from({ length: Math.ceil(testimonials.length / 2) }, (_, i) =>
                  testimonials.slice(i * 2, i * 2 + 2)
                ) // 2 per slide
            ).map((group, index) => (
              <SwiperSlide key={index}>
                <Grid container spacing={3} sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  flexDirection: 'row',
                  height: '100%',
                  my: {md: 10, xs:5 }
                }}>
                  {group.map((client, i) => (
                    <Grid item xs={12} md={6} lg={6} key={i} sx={{ display: 'flex' }}>
                      <Card sx={{ 
                        p: 3, 
                        display: 'flex',
                        flexDirection: 'column',
                        width: '100%',
                        minHeight: { xs: '280px', md: '320px' },
                        height: '100%'
                      }}>
                        <Typography
                          gutterBottom
                          variant="h5"
                          // padding="10px"
                          sx={{ fontWeight: 900, textAlign: 'left' }}
                        >
                          {client.name}
                          {/* <span style={{ color: '#ff002e' }}> ★</span> */}
                        </Typography>
                        <Box sx={{ display: 'flex', mb: 1 }}>
                          {[...Array(5)].map((_, j) => (
                            <StarIcon key={j} sx={{ color: '#e79552' }}/>
                          ))}
                        </Box>
                        {client.title && (
                          <Typography
                            sx={{
                              fontWeight: 900,
                              fontSize: { xs: '14px', md: '18px' },
                              mt: 2,
                              color: 'black',
                              textAlign: 'left',
                              alignSelf: 'flex-start',
                              width: '100%'
                            }}
                          >
                            “{client.title}”
                          </Typography>
                        )}
                        <Typography
                          sx={{
                            textAlign: 'justify',
                            mt: 2,
                            mb: 3,
                            fontSize: { xs: '13px', md: '16px' },
                            fontWeight: 900,
                            flexGrow: 1,
                            display: 'flex',
                            alignItems: 'flex-start'
                          }}
                        >
                          {client.review}
                        </Typography>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </SwiperSlide>
            ))}
          </Swiper>

        </Container>
      </Box>

    </>
  );
};
export default Clients;