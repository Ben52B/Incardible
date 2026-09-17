import Head from 'next/head';
import {
  Card,
  CardContent,
  Container,
  Typography, IconButton,
  Grid, Box, TextField, InputLabel, OutlinedInput, FormControl, SvgIcon, useTheme, useMediaQuery
} from '@mui/material';
import { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import * as React from 'react';
import NextLink from 'next/link';
import CardActions from '@mui/material/CardActions';
import CardMedia from '@mui/material/CardMedia';
import Button from '@mui/material/Button';
import LandingNav from '../layouts/landing-nav/landingLayout';
import { alpha, styled } from '@mui/material/styles';
import InputBase from '@mui/material/InputBase';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PinterestIcon from '@mui/icons-material/Pinterest';
import FacebookOutlinedIcon from '@mui/icons-material/FacebookOutlined';
import InstagramIcon from '@mui/icons-material/Instagram';
import YouTubeIcon from '@mui/icons-material/YouTube';
import { useRouter } from 'next/router';
import Footer from '../components/footer';
// import TelegramIcon from '@mui/icons-material/Telegram';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
import TikTokIcon from "../components/tiktokIcon";
import { useFormik } from 'formik';
import * as Yup from 'yup';

const Contact = () => {
  const router = useRouter();
  const pathname = router.pathname;
  const isContact = pathname === '/contact';
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [loading, setLoading] = useState(false);
  const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL;
  const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME;

  // const BootstrapInput = styled(InputBase)(({ theme }) => ({
  //   'label + &': {
  //     marginTop: theme.spacing(3)
  //   },
  //   '& .MuiInputBase-input': {
  //     // fontFamily: 'Open Sans',
  //     fontWeight: 700,
  //     lineHeight: '17.6px',
  //     letterSpacing: '0%',
  //     fontSize: '16px',
  //     borderRadius: 10,
  //     position: 'relative',
  //     // backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#F3F6F9',
  //     border: '1px solid',
  //     borderColor: 'white',
  //     width: '100%',
  //     padding: '10px 12px',
  //     color: 'white',
  //     transition: theme.transitions.create(['border-color', 'background-color', 'box-shadow']),
  //     '&:focus': {
  //       // boxShadow: '#C595FF 0 0 0 0.2rem ',
  //       borderColor: 'white'
  //     }
  //   }
  // }));
  const BootstrapInput = styled(InputBase)(({ theme }) => ({
    'label + &': { marginTop: theme.spacing(3) },

    // typed text = white
    '& .MuiInputBase-input, & .MuiInputBase-inputMultiline': {
      fontWeight: 700,
      lineHeight: '17.6px',
      fontSize: 16,
      borderRadius: 10,
      border: '1px solid',
      borderColor: 'white',
      width: '100%',
      padding: '10px 12px',
      color: 'white',
      transition: theme.transitions.create(['border-color','background-color','box-shadow']),
    },

    // placeholder = grey
    '& input::placeholder, & textarea::placeholder': {
      color: 'grey',
      opacity: 1,
    },

    // (optional) border highlight on focus
    '& .MuiInputBase-input:focus, & .MuiInputBase-inputMultiline:focus': {
      borderColor: 'white',
    },
  }));

  const buttonSize = isSmallScreen ? 'small' : 'large';
// put near the top of your file
  const formBg = '#1a1d25';

  const textFieldSx = {
    // input text + placeholder
    '& .MuiInputBase-input': { color: 'white' },
    '& .MuiInputBase-input::placeholder': { color: 'grey', opacity: 1 },

    // outline colors
    '& .MuiOutlinedInput-root': {
      // '& fieldset': { borderColor: 'white' },
      // '&:hover fieldset': { borderColor: 'white' },
      // '&.Mui-focused fieldset': { borderColor: 'white' },
    },

    // keep helper text aligned
    '& .MuiFormHelperText-root': { ml: 0 },

    // >>> KEY PART: stop border/label overlap
    '& .MuiInputLabel-root': { color: 'white' },
    '& .MuiInputLabel-shrink': {
      backgroundColor: formBg,   // same as container
      // paddingLeft: 6,
      // paddingRight: 6,
      zIndex: 1,
      lineHeight: 1,             // keeps the patch tight
    },
  };



  const formik = useFormik({
    initialValues: { name:'', email:'', phoneNumber:'', message:'' },
    validationSchema: Yup.object({
      name: Yup.string().trim().required('Name is required'),
      email: Yup.string().trim().email('Enter a valid email').required('Email is required'),
      phoneNumber: Yup.string().matches(/^\+?[0-9\s()-]{7,20}$/, 'Enter a valid phone number').required('Phone number is required'),
      message: Yup.string().trim().required('Message is required'),
    }),
    onSubmit: async (values, { resetForm, setSubmitting }) => {
      const id = toast.loading('Sending message…');
      try {
        await axios.post(`${API_BASE_URL}/api/contact-us/message`, {
          name: values.name.trim(),
          email: values.email.trim(),
          phoneNumber: values.phoneNumber.trim(),
          message: values.message.trim(),
        });
        toast.success('Message sent successfully');
        resetForm();
      } catch (err) {
        toast.error(err?.response?.data?.message || err.message || 'Failed to send');
      } finally {
        toast.dismiss(id);
        setSubmitting(false);
      }
    },
  });

  const errSx = (field) => ({
    '& .MuiInputBase-input': {
      borderColor: formik.touched[field] && formik.errors[field] ? '#ef4444' : 'white',
    }
  });

  return (
    <>
    <Head>
      <title>Homepage | {APP_NAME}</title>
    </Head>
    {
      isContact && (
        <LandingNav/>
      )
    }

    <Box
      id="contact"
      sx={{
        overflowX: 'hidden',
        overflowY: 'hidden',
        width: '100%',
        height: isContact ? '100vh' : '100%',
        // minHeight: '100vh',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        // backgroundColor: '#e6e6e7 !important'
        backgroundColor: '#1a1d25 !important'
      }}>
      <Container

        data-aos="zoom-out"
        data-aos-duration="600"
        data-aos-easing="ease-in"

        sx={{ width: '100%', mt: 5, mb: 5 }}>
        <Grid container spacing={2}>
          <Grid item md={6} xs={12} >
            <Typography gutterBottom variant="h4" padding="10px" sx={{
              // textAlign: 'center',
              fontWeight: 900,
              fontSize: { xs: '25px', md: '32px' },
              color: 'white'
              // color:''
            }}>
              Contact Us
            </Typography>
            <Typography gutterBottom variant="body1" padding="10px" sx={{
              // textAlign: 'center',
              // fontWeight:900,
              // color: 'grey'
              fontSize: { md: '1.3rem', xs: '13px' },
              color: 'white'
            }}>
              Feel free to use the form or drop us an email Old fashioned cell phone work too
            </Typography>
            <Box>
              {/* <Box sx={{
                mt: { md: 3, xs: 3 },
                display: 'flex',
                gap: 2,
                height: '100%',
                alignItems: 'center'
              }}>
                <PhoneIcon sx={{
                  color: '#c165a0', fontSize: { xs: '20px', md:'35px' }
                }}/>
                {/*<Box component='image' src={`${WEB_URL}/phone.png`}  />*/}
                {/* <Typography variant="body1" sx={{
                  fontWeight: '900',
                  justifyContent: 'center',
                  fontSize: { md: '1.3rem', xs: '13px' },
                  alignItems: 'center',
                  color: 'white',
                  height: '100%'
                }}>+1 (555) 123-4567</Typography>  */}
              {/* </Box> */}
              <Box sx={{
                mt: { md: 3, xs: 3 },
                display: 'flex',
                gap: 2,
                height: '100%',
                alignItems: 'center'
              }}>
                <EmailIcon sx={{
                  color: '#c165a0', fontSize: { xs: '20px', md:'35px' }
                }}/>
                {/*<img src={`${WEB_URL}/mail.png`}/>*/}
                <Typography variant="body1" sx={{
                  fontWeight: '900',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: { md: '1.3rem', xs: '13px' },
                  alignItems: 'center',
                  height: '100%'
                }}>Info@incardible.com.au</Typography>
              </Box>
              {/*</Box>*/}
              <Box sx={{
                mt: { md: 3, xs: 3 },
                // mb: 5,
                display: 'flex',
                gap: 3,
                height: '100%',
                justifyContent: { xs: 'center', md: 'flex-start' },
                alignItems: 'center',
                ml: { md: 5 }
              }}>
                {/* <NextLink 
                  href="https://www.facebook.com/share/1B7XouSJau/" 
                  passHref
                  legacyBehavior
               >
                  <a target="_blank" rel="noopener noreferrer">
                  <PinterestIcon sx={{
                    color: '#c165a0', fontSize: { xs: '20px', md:'35px' }
                  }}/>
                  </a>
                  </NextLink> */}

                <NextLink 
                  href="https://www.facebook.com/share/1B7XouSJau/" 
                  passHref
                  legacyBehavior
                
                >
                  <a target="_blank" rel="noopener noreferrer">
                  <FacebookOutlinedIcon sx={{
                    color: '#c165a0', fontSize: { xs: '20px', md:'35px' }
                  }}/>
                  </a>
                  </NextLink>
                <NextLink 
                   href="https://youtube.com/@incardible?si=lS-YcZbi5Ub6Z9uT" 
                   passHref
                   legacyBehavior
            
                >
                  <a target="_blank" rel="noopener noreferrer">
                  <YouTubeIcon sx={{
                    color: '#c165a0', fontSize: { xs: '20px', md:'35px' }
                  }}/>
                  </a>
                  </NextLink>
                  <NextLink 
  href="https://www.instagram.com/in_card_ible?igsh=bWw1aTgycmhoNDA5" 
  passHref
  legacyBehavior
>
  <a target="_blank" rel="noopener noreferrer">
    <InstagramIcon 
      sx={{ color: '#c165a0', fontSize: { xs: '20px', md: '35px' } }} 
    />
  </a>
</NextLink>

                {/* <NextLink href="/">
                  <InstagramIcon sx={{
                    color: '#c165a0', fontSize: { xs: '20px', md:'35px' }
                  }}/></NextLink> */}

                <NextLink 
                  href="https://www.tiktok.com/@incardible?_t=ZS-909pcNzlviE&_r=1" 
                  passHref
                  legacyBehavior
                >
                    <a target="_blank" rel="noopener noreferrer">
                  <TikTokIcon  sx={{
                    color: '#c165a0', fontSize: { xs: '20px', md:'30px' }
                  }}/>
                  </a>
                  </NextLink>
                {/* <NextLink 
                    href="https://www.tiktok.com/@incardible?_t=ZS-909pcNzlviE&_r=1" 
                    passHref
                    legacyBehavior
                >
                    <a target="_blank" rel="noopener noreferrer">
                  <WhatsAppIcon sx={{
                    color: '#c165a0', fontSize: { xs: '20px', md:'35px' }
                  }}/>
                  </a>
                  </NextLink> */}
              </Box>
            </Box>
          </Grid>
          <Grid item md={6} xs={12}>
            <Box component="form" id="contactForm" onSubmit={formik.handleSubmit} noValidate sx={{ mt: { md: 2, xs: 2 }, display: 'flex', flexDirection: 'column', gap: 2 }}>

              <TextField
                fullWidth
                variant="outlined"
                label="Full Name"
                name="name"
                placeholder="First Last"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.name && Boolean(formik.errors.name)}
                helperText={formik.touched.name && formik.errors.name}
                InputLabelProps={{ shrink: true, sx: { color: 'white' } }}
                // inputProps={{ maxLength: 80 }}
                sx={textFieldSx}
              />

              {/* Email */}
              <TextField
                fullWidth
                variant="outlined"
                label="Email"
                name="email"
                type="email"
                placeholder="example@gmail.com"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
                InputLabelProps={{ shrink: true, sx: { color: 'white' } }}
                sx={textFieldSx}
              />

              {/* Phone Number */}
              <TextField
                fullWidth
                variant="outlined"
                label="Phone Number"
                name="phoneNumber"
                type="tel"
                placeholder="Enter your phone number"
                value={formik.values.phoneNumber}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.phoneNumber && Boolean(formik.errors.phoneNumber)}
                helperText={formik.touched.phoneNumber && formik.errors.phoneNumber}
                InputLabelProps={{ shrink: true, sx: { color: 'white' } }}
                inputProps={{ maxLength: 20 }}
                sx={textFieldSx}
              />

              {/* Message */}
              <TextField
                fullWidth
                variant="outlined"
                label="Message"
                name="message"
                placeholder="Type your message…"
                multiline
                rows={5}
                value={formik.values.message}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.message && Boolean(formik.errors.message)}
                helperText={formik.touched.message && formik.errors.message}
                InputLabelProps={{ shrink: true, sx: { color: 'white' } }}
                sx={textFieldSx} />
              <Grid md={12} xs={12}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    mt: { md: 4, xs: 2 }
                  }}
                >
                  <Button
                    type="submit"
                    form="contactForm"
                    variant="contained"               // ← fix typo: 'contained'
                    disableElevation
                    disabled={formik.isSubmitting}
                    sx={{
                      minWidth: 120,
                      // height: 36,
                      px: 3,                          // compact width
                      borderRadius: '12px',           // rounded corners like screenshot
                      textTransform: 'none',
                      // fontSize: 12,
                      fontWeight: 700,
                      backgroundColor: '#c165a0',
                      color: 'white',
                      boxShadow: '0 2px 0 rgba(0,0,0,0.15)',
                      '&:hover': { backgroundColor: '#c165a0' },
                      '&:disabled': { opacity: 0.8 }
                    }}
                  >
                    {formik.isSubmitting ? 'Sending…' : 'Submit'}
                  </Button>
                </Box>
              </Grid>

            {/*<Grid md={12} xs={12}>*/}
            {/*  <Box sx={{*/}
            {/*    display: 'flex',*/}
            {/*    justifyContent: 'center',*/}
            {/*    alignItems: 'center',*/}
            {/*    // bgcolor:'red',*/}
            {/*    // width: '100%',*/}
            {/*    mt: {md: 5 , xs:2}*/}
            {/*  }}>*/}
            {/*    /!*<NextLink href="/">*!/*/}
            {/*    <Button*/}
            {/*      type='submit'*/}
            {/*      size={buttonSize}*/}
            {/*      disabled={formik.isSubmitting}*/}
            {/*      // fullwidth*/}
            {/*      variant='conatined'*/}
            {/*      form="contactForm"*/}
            {/*      sx={{*/}
            {/*        // px: 6,*/}
            {/*        display: 'flex',*/}
            {/*        justifyContent: 'center',*/}
            {/*        alignItems: 'center',*/}
            {/*        minWidth: { md: '150px', xs: '150px' },// horizontal padding (left and right)*/}
            {/*        // py: 2,*/}
            {/*        // borderRadius: '30px !important',*/}
            {/*        backgroundColor: '#c165a0',*/}
            {/*        color: 'white',*/}
            {/*        width: '100% !important',*/}
            {/*        // boxShadow: '0px 4px 12px #d8c0ca',*/}
            {/*        '&:hover': {*/}
            {/*          backgroundColor: '#c165a0',*/}
            {/*          color: 'white'*/}
            {/*        }*/}
            {/*      }}*/}
            {/*    >*/}
            {/*      {formik.isSubmitting ? 'Sending…' : 'Submit'}*/}
            {/*    </Button>*/}
            {/*    /!*</NextLink>*!/*/}
            {/*  </Box>*/}
            {/*</Grid>*/}
            </Box>
          </Grid>
          {/*<Grid md={12} xs={12}>*/}
          {/*  <Box sx={{*/}
          {/*    display: 'flex',*/}
          {/*    justifyContent: 'center',*/}
          {/*    alignItems: 'center',*/}
          {/*    // width: '100%',*/}
          {/*    mt: {md: 5 , xs:2}*/}
          {/*  }}>*/}
          {/*    /!*<NextLink href="/">*!/*/}
          {/*      <Button*/}
          {/*        type='submit'*/}
          {/*        size={buttonSize}*/}
          {/*        disabled={formik.isSubmitting}*/}
          {/*        // fullwidth*/}
          {/*        variant='conatined'*/}
          {/*        form="contactForm"*/}
          {/*        sx={{*/}
          {/*          // px: 6,*/}
          {/*          minWidth: { md: '150px', xs: '150px' },// horizontal padding (left and right)*/}
          {/*          // py: 2,*/}
          {/*          // borderRadius: '30px !important',*/}
          {/*          backgroundColor: '#c165a0',*/}
          {/*          color: 'white',*/}
          {/*          width: '100% !important',*/}
          {/*          // boxShadow: '0px 4px 12px #d8c0ca',*/}
          {/*          '&:hover': {*/}
          {/*            backgroundColor: '#c165a0',*/}
          {/*            color: 'white'*/}
          {/*          }*/}
          {/*        }}*/}
          {/*      >*/}
          {/*        {formik.isSubmitting ? 'Sending…' : 'Submit'}*/}
          {/*      </Button>*/}
          {/*    /!*</NextLink>*!/*/}
          {/*  </Box>*/}
          {/*</Grid>*/}

    {/*      <Grid item md={6} xs={12}>*/}
    {/*        <Box*/}
    {/*          // component="form"*/}
    {/*          sx={{*/}
    {/*            mt: { md: 5, xs: 2 },*/}
    {/*            display: 'flex',*/}
    {/*            justifyContent: 'center',*/}
    {/*            alignItems: 'center',*/}
    {/*            gap: 2,*/}
    {/*            flexDirection: 'column'*/}
    {/*          }}*/}
    {/*          // noValidate*/}
    {/*          // autoComplete="off"*/}
    {/*        >*/}
    {/*          <FormControl variant="standard" sx={{ width: '100%' }}>*/}
    {/*            <InputLabel*/}
    {/*              shrink*/}
    {/*              htmlFor="bootstrap-input1"*/}
    {/*              sx={{*/}
    {/*                // fontFamily: 'Open Sans',*/}
    {/*                fontWeight: 700,*/}
    {/*                lineHeight: '17.6px',*/}
    {/*                letterSpacing: '0%',*/}
    {/*                fontSize: { xs: '15px', md: '20px' },*/}
    {/*                width: '100% !important',*/}
    {/*                // color: 'black !important',*/}
    {/*                color: 'white !important'*/}
    {/*              }}*/}
    {/*            >*/}
    {/*              Full Name*/}
    {/*            </InputLabel>*/}
    {/*            <BootstrapInput*/}
    {/*              placeholder="First Last"*/}
    {/*              id="bootstrap-input1"*/}
    {/*              sx={{*/}
    {/*                color: 'black !important',*/}
    {/*                '& input::placeholder': {*/}
    {/*                  color: 'grey !important',*/}
    {/*                  opacity: 1 // important for some browsers to show color*/}
    {/*                }*/}
    {/*              }}*/}
    {/*            />*/}
    {/*          </FormControl>*/}
    {/*          <FormControl variant="standard" sx={{ width: '100%' }}>*/}
    {/*            <InputLabel*/}
    {/*              shrink*/}
    {/*              htmlFor="bootstrap-input2"*/}
    {/*              sx={{*/}
    {/*                // fontFamily: 'Open Sans',*/}
    {/*                fontWeight: 700,*/}
    {/*                lineHeight: '17.6px',*/}
    {/*                letterSpacing: '0%',*/}
    {/*                fontSize: { xs: '15px', md: '20px' },*/}
    {/*                width: '100% !important',*/}
    {/*                color: 'white !important'*/}
    {/*              }}*/}
    {/*            >*/}
    {/*              Email*/}
    {/*            </InputLabel>*/}
    {/*            <BootstrapInput*/}
    {/*              placeholder="example@gmail.com"*/}
    {/*              id="bootstrap-input2"*/}
    {/*              sx={{*/}
    {/*                // color: 'black !important',*/}
    {/*                '& input::placeholder': {*/}
    {/*                  color: 'grey !important',*/}
    {/*                  opacity: 1 // important for some browsers to show color*/}
    {/*                }*/}
    {/*              }}*/}
    {/*            />*/}
    {/*          </FormControl>*/}
    {/*          <FormControl variant="standard" sx={{ width: '100%' }}>*/}
    {/*            <InputLabel*/}
    {/*              shrink*/}
    {/*              htmlFor="bootstrap-input3"*/}
    {/*              sx={{*/}
    {/*                // fontFamily: 'Open Sans',*/}
    {/*                fontWeight: 700,*/}
    {/*                lineHeight: '17.6px',*/}
    {/*                letterSpacing: '0%',*/}
    {/*                fontSize: { xs: '15px', md: '20px' },*/}
    {/*                width: '100% !important',*/}
    {/*                color: 'white !important'*/}
    {/*              }}*/}
    {/*            >*/}
    {/*              Phone Number*/}
    {/*            </InputLabel>*/}
    {/*            <BootstrapInput*/}
    {/*              placeholder="Enter your phone number"*/}
    {/*              id="bootstrap-input3"*/}
    {/*              sx={{*/}
    {/*                // color: 'black !important',*/}
    {/*                '& input::placeholder': {*/}
    {/*                  color: 'grey !important',*/}
    {/*                  opacity: 1 // important for some browsers to show color*/}
    {/*                }*/}
    {/*              }}*/}
    {/*            />*/}
    {/*          </FormControl>*/}
    {/*          <FormControl variant="standard" sx={{ width: '100%' }}>*/}
    {/*            <InputLabel*/}
    {/*              shrink*/}
    {/*              htmlFor="bootstrap-input4"*/}
    {/*              sx={{*/}
    {/*                // fontFamily: 'Open Sans',*/}
    {/*                fontWeight: 700,*/}
    {/*                lineHeight: '17.6px',*/}
    {/*                letterSpacing: '0%',*/}
    {/*                fontSize: { xs: '15px', md: '20px' },*/}
    {/*                width: '100% !important',*/}
    {/*                color: 'white !important'*/}
    {/*              }}*/}
    {/*            >*/}
    {/*              Message*/}
    {/*            </InputLabel>*/}
    {/*            <BootstrapInput*/}
    {/*              multiline*/}
    {/*              rows={5}*/}
    {/*              placeholder="Type your message...."*/}
    {/*              id="bootstrap-input4"*/}
    {/*              sx={{*/}
    {/*                // color: 'grey !important',*/}
    {/*                '& textarea::placeholder': {*/}
    {/*                  color: 'grey !important',*/}
    {/*                  opacity: 1 // important for some browsers to show color*/}
    {/*                }*/}
    {/*              }}*/}
    {/*            />*/}
    {/*          </FormControl>*/}
    {/*        </Box>*/}
    {/*      </Grid>*/}
    {/*      <Grid md={12} xs={12}>*/}
    {/*        <Box sx={{*/}
    {/*          display: 'flex',*/}
    {/*          justifyContent: 'center',*/}
    {/*          alignItems: 'center',*/}
    {/*          width: '100%',*/}
    {/*          mt: {md: 5 , xs:2}*/}
    {/*        }}>*/}
    {/*          <NextLink href="/">*/}
    {/*            <Button*/}
    {/*              type='submit'*/}
    {/*              size={buttonSize}*/}
    {/*            fullwidth*/}
    {/*            variant='conatined'*/}
    {/*            sx={{*/}
    {/*            // px: 6,*/}
    {/*            minWidth: { md: '150px', xs: '150px' },// horizontal padding (left and right)*/}
    {/*            // py: 2,*/}
    {/*            // borderRadius: '30px !important',*/}
    {/*            backgroundColor: '#c165a0',*/}
    {/*            color: 'white',*/}
    {/*            width: '100% !important',*/}
    {/*            // boxShadow: '0px 4px 12px #d8c0ca',*/}
    {/*            '&:hover': {*/}
    {/*              backgroundColor: '#c165a0',*/}
    {/*              color: 'white'*/}
    {/*            }*/}
    {/*          }}*/}
    {/*            >*/}
    {/*              {formik.isSubmitting ? 'Sending…' : 'Submit'}*/}
    {/*          </Button>*/}
    {/*        </NextLink>*/}
    {/*</Box>*/}
    {/*</Grid>*/}
</Grid>
</Container>
</Box>
  {
    isContact && (
      <Footer/>)
  }

</>
)
  ;
};
export default Contact;