import Head from 'next/head';
import {
  Card,
  CardContent,
  Container,
  Typography, Tab, IconButton, Menu, CircularProgress, Pagination, Stack,
  Grid, Box, useMediaQuery, useTheme, Button, MenuItem, Select
} from '@mui/material';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import * as React from 'react';
import { useEffect, useState, useMemo, useRef } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import NextLink from 'next/link';
import ReactPaginate from 'react-paginate';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/use-auth';
import LandingNav from '../layouts/landing-nav/landingLayout';
import { v4 as uuidv4 } from 'uuid';
import CardsCarousel from '../utils/swiper';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL;
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME;
const LoginUserCards = () => {
  const auth = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const isIpadScreen = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const [allCards, setAllCards] = useState([]);
  const [loading, setLoading] = useState(false);

  const getUserEmail = () => {
    if (!auth?.isAuthenticated) {
      console.log('User is not authenticated');
      return null;
    }

    if (auth.user?.email) {
      console.log('Using auth.user.email:', auth.user.email);
      return auth.user.email;
    }

    if (auth.loginUserData?.email) {
      console.log('Using auth.loginUserData.email:', auth.loginUserData.email);
      return auth.loginUserData.email;
    }

    console.log('No email found in auth object');
    return null;
  };

  const getAllLoginUserCards = async () => {
    const token = localStorage.getItem('token');
    const email = getUserEmail();
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/api/user/get-all-cards/${email}`, {
        headers: {
          'Content-Type': 'Application/json',
          'x-access-token': token
        }
      });
      setAllCards(res.data.data);
      setLoading(false);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getAllLoginUserCards();
  }, []);

  // Filter out deleted cards
  const filteredCards = allCards.filter(card => !card?.deleteMyCard);

  console.log('allCards', allCards);
  console.log('filteredCards', filteredCards);

  const gotoEditor = (uuid, cardUUID) => {
    router.push(`/card-editor/${uuid}?selected=${cardUUID}`);
  };

  return (
    <>
      <Head>
        <title>My Cards | {APP_NAME}</title>
      </Head>
      <LandingNav/>
      <Box sx={{
        width: '100%',
        height: '100%',
        minHeight: '100vh',
        // bgcolor:'#eee3ea',
        backgroundImage: {
          xs: `url(${WEB_URL}/portrate.png)`,
          md: `url(${WEB_URL}/bg1.png)`
        },
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}>
        <Box
          // data-aos="zoom-in"
          // data-aos-duration="600"
          // data-aos-easing="ease-in"
          sx={{
            pl: { md: '20%', laptop: '10%', lg: '10%', xl: '10%', xs: '5%', ipad: '25%' },
            pr: { md: '20%', laptop: '10%', lg: '10%', xl: '10%', xs: '5%', ipad: '25%' },
            // pl: { md: '15%', laptop: '15%', lg: '15%', xl: '20%', xs: '5%', ipad: '25%' },
            // pr: { md: '15%', laptop: '15%', lg: '15%', xl: '20%', xs: '5%', ipad: '25%' },
            // bgcolor:"blue",
            pt: { md: 15, xs: 10 },
            pb: 5,
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            // bgcolor:'red',
            flexDirection: 'column', height: '100%',   minHeight: '100vh'
          }}
        >
          <Box sx={{
            // mb: { md: 3, xs: 3 },
            borderRadius: '30px !important',
            fontSize: { md: '45px', xs: '25px' },
            color: { xs: '#c165a0', md: '#1A1D25' },
            fontWeight: 'bolder'
          }}>
            My Cards
          </Box>

          <Grid container>
            <Grid md={12} xs={12}>
              <Box sx={{
                width: '100%',
                // bgcolor:'red',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'column'
              }}>

                <Grid container sx={{ mt: 2 }}>
                  {loading ? (
                    <Box sx={{ width: '100%', textAlign: 'center' }}>
                      <CircularProgress/>
                    </Box>
                  ) : (
                    <>
                      {filteredCards.length === 0 ? (
                        <Box sx={{ width: '100%', textAlign: 'center' }}>
                          <Typography>No cards found.</Typography>
                        </Box>
                      ) : (
                          <CardsCarousel
                            allCards={filteredCards}
                          />
                        )}
                    </>
                  )}

                  <Box sx={{
                    display:'flex', justifyContent: {md: 'flex-end', xs:'center' }, alignItems:'center', width:'100%'
                  }}>
                  <Button
                    variant="contained"
                    onClick={() => {
                      router.push('/#section1').then(() => {
                        // Clean up the hash from URL after navigation
                        setTimeout(() => {
                          window.history.replaceState(null, '', '/');
                        }, 100);
                      });
                    }}
                    sx={{
                      mt:5,
                      width: 150,
                      // px: 3,
                      // borderRadius: '20px !important',
                      backgroundColor: '#c165a0',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: '#c165a0',
                        color: 'white'
                      }
                    }}
                  >
                    Back
                  </Button></Box>
                </Grid>

              </Box>
            </Grid>
          </Grid>
        </Box>
      </Box>

    </>
  );
};
export default LoginUserCards;