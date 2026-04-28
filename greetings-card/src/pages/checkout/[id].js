// CheckoutPage.jsx
import * as React from 'react';
import {
  Radio, RadioGroup,
  Box, Container, Grid, Card, CardContent, CardMedia, TextField, Typography, InputBase,Autocomplete,
  Select, MenuItem, FormControlLabel, Checkbox, Divider, IconButton, InputAdornment, Button, Stack
} from '@mui/material';
import Add from '@mui/icons-material/Add';
import Remove from '@mui/icons-material/Remove';
import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded';
import Close from '@mui/icons-material/Close';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
// PAYPAL INTEGRATION COMMENTED OUT - SWITCHING TO STRIPE
// import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import AddressAutocompleteLocationIQ from '../../components/locationIqAutocomplete';

// NEW: STRIPE ELEMENTS FOR DIRECT PAYMENT
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import StripeCardElement from '../../components/StripeCardElement';

const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL;
const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_key_here';
const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
const ACCENT = '#000'; // headings in mock are black; change if needed
import axios from 'axios';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import NextLink from 'next/link';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import toast from 'react-hot-toast';
import AddressAutocompleteGoogleAU from '../../components/AddressAutocompleteGoogleAU'
import 'react-phone-input-2/lib/material.css';
import PhoneInput from 'react-phone-input-2';
import { FormControl, FormHelperText, InputLabel } from '@mui/material';
import { Visibility, VisibilityOff  } from '@mui/icons-material';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import PaymentIcon from '@mui/icons-material/Payment';

import InfoOutlined from '@mui/icons-material/InfoOutlined';

// === OrderItem (defensive) ===s
// import AddressAutocomplete from '../../components/AddressAutocompleteGoogleAU';
function OrderItem({ item, onQty }) {
  const line = (item.price * item.qty);
  // const stackOnMd = Number(item.qty) >= 1000000;
  const stackOnMd = Number(item.qty) >= 100000;
  return (
    // <Card variant="outlined" sx={{ borderRadius: 1.5, mb: 1.5 }}>
    //   <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.25 }}>
    //     <Box sx={{ flex: 1 }}>
    //       <CardMedia
    //         component="img"
    //         image={item.image}
    //         alt={item.title}
    //         sx={{
    //           width: 80,
    //           height: 80,
    //           borderRadius: 1,
    //           objectFit: 'cover',
    //           border: '1px solid #ddd'
    //         }}
    //       />
    //       <Typography fontWeight={700} sx={{ ml: 0.5 }} noWrap>{item.title}</Typography>
    //     </Box>
    //
    //     <Stack alignItems="flex-end" sx={{ minWidth: 100 }}>
    //       <Typography fontWeight={700}>
    //         ${item.price.toFixed(2)} <Typography component="span" variant="caption">Per
    //         Card</Typography>
    //       </Typography>
    //       <Typography variant="caption" color="text.secondary">
    //         ${item.price.toFixed(2)} × {item.qty} = <b>${line}</b>
    //       </Typography>
    //     </Stack>
    //     <Box
    //       sx={{
    //         display: 'inline-flex',
    //         alignItems: 'center',
    //         border: '1px solid',
    //         borderColor: 'divider',
    //         borderRadius: 2,
    //         height: 36,
    //         px: 0.5,
    //         gap: 0.5,
    //         flexShrink: 0              // don’t squish the control
    //       }}
    //     >
    //       <IconButton
    //         size="small"
    //         onClick={() => onQty(item.id, Math.max(1, item.qty - 1))}
    //         sx={{ p: 0.5 }}
    //         aria-label="decrease quantity"
    //       >
    //         <Remove fontSize="small"/>
    //       </IconButton>
    //
    //       <InputBase
    //         value={item.qty}
    //         onChange={(e) => {
    //           const v = e.target.value.replace(/\D+/g, '');      // numeric only
    //           onQty(item.id, Math.max(1, Number(v || 1)));
    //         }}
    //         inputMode="numeric"
    //         sx={{
    //           textAlign: 'center',
    //           fontWeight: 600,
    //           lineHeight: 1,
    //           px: 0.5,
    //           // Grow with digits so the full value is always visible
    //           width: `clamp(28px, ${String(item.qty).length + 1}ch, 220px)`
    //         }}
    //       />
    //
    //       <IconButton
    //         size="small"
    //         onClick={() => onQty(item.id, item.qty + 1)}
    //         sx={{ p: 0.5 }}
    //         aria-label="increase quantity"
    //       >
    //         <Add fontSize="small"/>
    //       </IconButton>
    //     </Box>
    //   </CardContent>
    // </Card>
    <Card variant="outlined" sx={{
      borderRadius: 1.5,
      // minWidth:{md:400, lg: 600, xl:700, '4k': 1000},
      minWidth:{md:400, lg: 300, xl:500, '4k': 600},
      minHeight:{'4k':400},
      mb: 2.5,
      width: '100%',
      // display: 'flex',
      // justifyContent:'center',
      // alignItems:'center',
      height: '100%'
    }}>
      <CardContent sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        p: 1.25,
        flexDirection: stackOnMd ? 'column' : 'row'
      }}>
        <Box sx={{ width:'100%', display:'flex', justifyContent:'center', alignItems:'flex-start', height:'100%', flexDirection:'column'}}>
          <CardMedia
            component="img"
            image={item.image}
            alt={item.title}
            sx={{
              // mt:1,
              width: { md: 80, xs: 100 , xl:150, '4k':200},
              height: { md: 80, xs: 100 , xl:150, '4k':200},

              borderRadius: 1,
              objectFit: 'cover',
              border: '1px solid #ddd'
            }}
          />
          <Typography fontWeight={700} sx={{ ml: 0.5,
            alignItems: 'baseline',
            gap: 0.5,
            fontSize:{xl:'25px','4k':'30px'},
            whiteSpace: 'wrap'}} noWrap>{item.title}</Typography>
        </Box>
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'column' },
          justifyContent: 'center',
          // bgcolor:'red',
          width:'100%',
          gap: 2,
          alignItems: 'flex-start',
          height: '100%'
        }}>
          <Stack alignItems="flex-start" sx={{ width: '100%' }}>
            <Typography
              variant='h4'
              fontWeight={700}
              noWrap
              sx={{
                display: 'inline-flex',
                alignItems: 'baseline',
                gap: 0.5,
                whiteSpace: 'nowrap'
              }}
              >
                $ {Number(item?.price).toFixed(2)}
              <Typography
                // variant='h5'
                component="span"
                variant="caption"
                sx={{ display: 'inline', whiteSpace: 'nowrap', fontSize:{'4k':'30px'} }}
              >
                Per Card
              </Typography>
            </Typography>

            <Typography variant="h7" sx={{mt:1, fontSize:{xl:'25px','4k':'30px'},}} color="text.secondary">
              ${Number(item?.price).toFixed(2)} × {item.qty} = <b> ${Number(line).toFixed(2)}</b>
            </Typography>
          </Stack>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              border: '1px solid',
              borderColor: 'divider' ,
              // bgcolor:"red",
              borderRadius: 2,
              height: 36,
              px: {md:0.5, xl:2, '4k':4},
              gap: 0.5,
              flexShrink: 0              // don’t squish the control
            }}
          >
            <IconButton
              size="small"
              onClick={() => onQty(item.id, Math.max(1, item.qty - 1))}
              sx={{ p: 0.5 }}
              aria-label="decrease quantity"
            >
              <Remove fontSize="small"/>
            </IconButton>

            <InputBase
              value={item.qty}
              onChange={(e) => {
                const v = e.target.value.replace(/\D+/g, '');      // numeric only
                onQty(item.id, Math.max(1, Number(v || 1)));
              }}
              inputMode="numeric"
              sx={{
                textAlign: 'center',
                fontSize:{xl:'25px'},
                fontWeight: 600,
                lineHeight: 1,

                px: 0.5,
                // Grow with digits so the full value is always visible
                width: `clamp(28px, ${String(item.qty).length + 1}ch, 220px)`
              }}
            />

            <IconButton
              size="small"
              onClick={() => onQty(item.id, item.qty + 1)}
              sx={{ p: 0.5 }}
              aria-label="increase quantity"
            >
              <Add fontSize="small"/>
            </IconButton>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { id } = router.query;
  const [open, setOpen] = useState(false);
  const [expressShipping, setExpressShipping] = useState(false);
  const [shippingMethod, setShippingMethod] = useState('normal');
  const SHIPPING_PRICES= { normal: 5, express: 4 };
  const shippingRate = SHIPPING_PRICES[shippingMethod];

  const [state, setState] = useState('South Australia');
  const [items, setItems] = React.useState([
    {
      id: 1,
      title: '',
      price: 0,
      qty: 1,
      image: ''

    }
  ]);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const getData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/api/transactions/get-single-transaction-detail/${id}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'x-access-token': token
          }
        }
      );

      const d = response?.data?.data;
      setData(d);

      if (d?.cardId) {
        setItems([
          {
            id: d?.cardId?._id || d?._id || 'line-1',
            title: d?.cardId?.title,
            price: Number(d?.cardId?.price) || 0,
            qty: 1,
            image: `${API_URL}/${d?.cardId?.frontDesign}`
          }
        ]);
      }
    } catch (error) {
      console.log('Error in get user card customization for checkout', error);
    }
  };

  const getUserNewsAndOffersPreference = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/api/transactions/get-user-news-offers-preference`,
        {
          headers: {
            'Content-Type': 'application/json',
            'x-access-token': token
          }
        }
      );

      const preference = response?.data?.data?.newsAndOffers;
      if (preference !== undefined) {
        // Update the formik values with the user's previous preference
        formik.setFieldValue('newsAndOffers', preference);
      }
    } catch (error) {
      console.log('Error in get user news and offers preference', error);
    }
  };

  useEffect(() => {
    getData();
    getUserNewsAndOffersPreference();
  }, [id]);

// calculate gst on shipping and express shipping price too
  // const shipping = 10;
  // const expressShippingRate = 10;
  // const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  // const gst = expressShipping ? (subtotal + shipping + expressShippingRate) * 0.1 : (subtotal + shipping) * 0.1;
  // const total = expressShipping ? Number(subtotal + shipping + gst + expressShippingRate).toFixed(2) : Number(subtotal + shipping + gst).toFixed(2);


  //latest calculation:
  const shipping = 5;
  const expressShippingRate = 4;
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const gst = expressShipping ? (subtotal + shipping + expressShippingRate) * 0.1 : (subtotal + shipping) * 0.1;
  const withoutGst = expressShipping ? (subtotal + shipping + expressShippingRate) : (subtotal + shipping);
  // const gst = (subtotal) * 0.1;
  const total = expressShipping
    ? Number(subtotal + shipping + gst + expressShippingRate).toFixed(2)
    : Number(subtotal + shipping + gst).toFixed(2);

  // const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  // const gst = (subtotal + shippingRate) * 0.1;
  // const total = Number(subtotal + shippingRate + gst).toFixed(2);

  const onQty = (id, qty) => setItems((prev) => prev.map(i => i.id === id ? { ...i, qty } : i));
  const formatPrice = (value) => Number(value).toFixed(2);
  // which country to fetch states for
  // const COUNTRY = 'Australia';

  const [states, setStates] = useState([]);
  const [data, setData] = useState('');
  const [loading, setLoading] = useState(false);
  const [australiaStates, setAustraliaStates] = useState('');
  const [loadingStates, setLoadingStates] = useState(false);
  const [statesError, setStatesError] = useState('');
  const [currency, setCurrency] = useState({});
  const [news, setNews] = useState(false);
  const [termAndConditions, setTermAndConditions] = useState(false);
  const [message, setMessage] = useState('');
  const [showShippingDays, setShowShippingDays] = useState(false);
  const [showShippingDetails, setShowShippingDetails] = useState(false);

  //get stats of australia
  // React.useEffect(() => {
  //   let mounted = true;
  //   const loadStates = async () => {
  //     try {
  //       setLoadingStates(true);
  //       setStatesError('');
  //       // Public endpoint: returns { data: { name, states:[{name}...] } }
  //       const res = await fetch('https://countriesnow.space/api/v0.1/countries/states', {
  //         method: 'POST',
  //         headers: { 'Content-Type': 'application/json' },
  //         body: JSON.stringify({ country: 'Australia' })
  //       });
  //       const data = await res.json();
  //
  //       const list = data?.data?.states?.map((s) => s.name).filter(Boolean) ?? [];
  //
  //       if (mounted) {
  //         setStates(list.sort());
  //       }
  //     } catch (e) {
  //       if (mounted) {
  //         setAustraliaStates([]);
  //         setStatesError('Failed to load states');
  //       }
  //     } finally {
  //       if (mounted) {
  //         setLoadingStates(false);
  //       }
  //     }
  //   };
  //   loadStates();
  //   return () => { mounted = false; };
  // }, [COUNTRY]);

  const fetchOtherCurrencies = async () => {
    try {
      const response = await axios.get(`https://open.er-api.com/v6/latest/EUR`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      setCurrency(response.data.rates);
    } catch (error) {
      console.log(error);
      toast.error(error.response.data.msg);
    }
  };
  // console.log('currency=', currency);
  useEffect(() => {
    fetchOtherCurrencies();
  }, []);

  // ========================================
  // OLD: STRIPE CHECKOUT SESSION (Redirect to Stripe)
  // COMMENTED OUT - KEEPING FOR REFERENCE
  // ========================================
  /*
  const handleCheckout = async (audCalculatedTotalPrice) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login to continue with checkout');
        return;
      }

      // Use backend URL for images (images are stored in backend)
      const frontCardImage = data?.cardId?.frontDesign 
        ? `${API_URL}/${data.cardId.frontDesign}`
        : null;

      console.log('frontCardImage', frontCardImage);
      console.log('data.cardId.frontDesign', data?.cardId?.frontDesign);
      console.log('API_URL', API_URL);
      console.log('Constructed URL:', `${API_URL}/${data?.cardId?.frontDesign}`);
      console.log('Full data object:', data);
      
      // Test if image URL is accessible
      if (frontCardImage) {
        console.log('Testing image accessibility...');
        fetch(frontCardImage)
          .then(response => {
            console.log('Image response status:', response.status);
            if (response.ok) {
              console.log('✅ Image is accessible');
            } else {
              console.log('❌ Image is not accessible');
            }
          })
          .catch(error => {
            console.log('❌ Image fetch error:', error);
          });
      }

      const productPayload = {
        title: data?.cardId?.title,
        price: audCalculatedTotalPrice,
        frontCardImage: frontCardImage,
        userId: data?.user_id,
        cardCustomizationId: data?._id
      };
      
      console.log('Stripe checkout payload:', productPayload);
      
      const res = await fetch(`${API_URL}/api/payment/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': token
        },
        body: JSON.stringify({ 
          product: productPayload,
          userId: data?.user_id,
          cardCustomizationId: data?._id
        })
      });

      const response = await res.json();
      console.log('Stripe checkout response:', response);
      
      if (response.url) {
        window.location.href = response.url;
      } else {
        toast.error('Failed to create checkout session');
      }
    } catch (error) {
      console.error('Stripe checkout error:', error);
      toast.error('Error initiating checkout');
    }
  };
  */

  // put near top of CheckoutPage.jsx

  //
  // useEffect(() => {
  //   if (auth?.isAuthenticated) {
  //     const shouldRedirect = localStorage.getItem('redirectToCheckout');
  //     if (shouldRedirect === 'true') {
  //       localStorage.removeItem('redirectToCheckout');
  //       handleCheckout();
  //     }
  //   }
  // }, [auth?.isAuthenticated]);

  //create checkout details in transaction

  // console.log('items[0].qty', items[0].qty);
  console.log("currency", currency);
// put near the top of the component file
  const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  // State for discount/coupon
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [stripeReady, setStripeReady] = useState(false);

  const formik = useFormik({
    initialValues: {
      cardCustomizationId: '',
      delivery_address: '',
      suburb: '',
      aud: '',
      price: '',
      quantity: '',
      state: '',
      title: '',
      postal_code: '',
      phone_number: '',
      newsAndOffers: false,
    //   shippingMethod:'',
    // shippingRate:'',
      expressShipping: false,
      expressShippingRate: '',
      termsAccepted: false,
      shipping: '',
      total: '',
      gst: '',
      submit: null,
      // Coupon fields
      coupon_code: '',
      discount_price: 0
    },
    validationSchema: Yup.object({
      // title: Yup.string().trim().required('Title is required'),
      delivery_address: Yup.string().trim().required(' Street address is required'),
      suburb: Yup.string().trim().required('Suburb is required'),
      state: Yup.string().trim().required('State is required'),
      postal_code: Yup.string()
                      .matches(/^\d{3,10}$/, 'Postal code must be 3–10 digits')
                      .required('Postal code is required'),
      phone_number: Yup.string()
                       .matches(/^\+?[1-9]\d{6,14}$/, 'Enter a valid phone number')
                       .required('Phone number is required'),

      // phone_number: Yup.string()
      //                  .matches(/^\+?[0-9\s()-]{7,20}$/, 'Enter a valid phone number')
      //                  .required('Phone number is required'),
      newsAndOffers: Yup.boolean(),
      expressShipping: Yup.boolean(),
      termsAccepted: Yup.boolean().oneOf([true], 'Please accept the terms and conditions'),
      // Coupon fields
      coupon_code: Yup.string().nullable(),
      discount_price: Yup.number().min(0).default(0)

    }),
    onSubmit: async (values, helpers) => {
      // This will be handled by CheckoutFormWithStripe component
      // See the implementation in the return statement below
    }

  });

  // ========================================
  // OLD ONSUBMIT HANDLER (Redirect to Stripe)
  // COMMENTED OUT - KEEPING FOR REFERENCE
  // ========================================
  /*
  const oldOnSubmit = async (values, helpers) => {
      const loading = toast.loading(
        'order is  in process......',
        { duration: 15000 });
;

      const audCalculatedTotalPrice = Number((total * currency['AUD']).toFixed(2));

      try {

        // setLoading(true)
        const token = localStorage.getItem('token');
        
        // Prepare transaction data (not created in DB yet)
        const transactionData = {
          cardCustomizationId: data?._id,
          title: data?.cardId?.title,
          price: data?.cardId?.price,
          quantity: items[0].qty,
          aud: audCalculatedTotalPrice,
          delivery_address: values.delivery_address,
          suburb: values.suburb,
          state: values.state,
          postal_code: values.postal_code,
          phone_number: values.phone_number,
          newsAndOffers: values.newsAndOffers,
          // shippingMethod,
          // shippingRate,
          expressShipping: values.expressShipping,
          expressShippingRate: expressShipping ? expressShippingRate : 0,
          shipping,
          // Create shipping days object based on user selection (standard or express)
          // This object stores both Victoria and Interstate shipping information
          shippingDays: {
            inVictoria: expressShipping ? "1-2+ business days" : "3-5 business days",    // Express: 1-2 days, Standard: 3-5 days
            interstate: expressShipping ? "1-3+ business days" : "4-7 business days"     // Express: 2-3 days, Standard: 4-7 days
          },
          total,
          gst: formatPrice(gst),
          // Coupon fields
          coupon_code: values.coupon_code || null,
          discount_price: values.discount_price || 0
        };

  
        // const imgURL = (p) =>
          // p ? `${(API_URL || '').replace(/\/+$/,'').replace(/^http:\/\//,'https://')}/${String(p).replace(/^[\/\\]+/,'').replace(/\\/g,'/')}` : null;
        
        // 2) When preparing the payload in onSubmit:
        // const frontCardImage = imgURL(data?.cardId?.frontDesign);
        // const frontCardImage =`${API_URL}/${data?.cardId?.frontDesign}`;
        const frontCardImage =
        `${(API_URL || '').replace(/^http:\/\//, 'https://').replace(/\/+$/, '')}/${String(
          data?.cardId?.frontDesign || ''
        ).replace(/^\/+/, '')}`;

        console.log('frontCardImage', frontCardImage);
        // Get userId from token or data
        let userId = data?.user_id;
        if (!userId) {
          // Try to get userId from the token (decode JWT)
          try {
            const tokenPayload = JSON.parse(atob(token.split('.')[1]));
            userId = tokenPayload.user_id;
          } catch (e) {
            console.log('Could not decode token for userId');
          }
        }

        const productPayload = {
          title: data?.cardId?.title || 'AR Greeting Card',
          price: audCalculatedTotalPrice,
          frontCardImage: frontCardImage,
          userId: userId,
          cardCustomizationId: data?._id
        };
        
        console.log('Stripe checkout payload:', productPayload);
        console.log('User ID from data:', data?.user_id);
        console.log('User ID from token:', userId);
        
        const res = await fetch(`${API_URL}/api/payment/create-checkout-session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-access-token': token
          },
          body: JSON.stringify({ 
            product: productPayload,
            userId: userId,
            cardCustomizationId: data?._id,
            transactionData: transactionData // Include the transaction data from the form
          })
        });

        const response = await res.json();
        console.log('Stripe checkout response:', response);
        
        if (response.url) {
          toast.dismiss(loading);
          window.location.href = response.url;
        } else {
          throw new Error('Failed to create checkout session');
        }



        // setItems([{
        //   id: 1,
        //   title: '',
        //   // price: 0,
        //   qty: 1,
        //   image: ''
        //
        // }]);
        setExpressShipping(false);
        // setLoading(false);
        // await handleCheckout(audCalculatedTotalPrice);
        setMessage('');
      } catch (err) {
        console.log('Stripe checkout error:', err);
        toast.dismiss(loading);
        toast.error(err.message || 'Error initiating checkout', { duration: 5000 });
        formik.resetForm();
      }
      toast.dismiss(loading);
      setLoading(false);
    };
  */

  // Handle coupon validation
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }

    setValidatingCoupon(true);
    try {
      const response = await axios.post(`${API_URL}/api/payment/validate-coupon`, {
        couponCode: couponCode.trim()
      });

      if (response.data.valid) {
        setCouponApplied(true);
        setCouponDiscount(response.data.coupon);
        formik.setFieldValue('coupon_code', couponCode.trim());
        
        // Calculate discount based on current total
        let discountAmount = 0;
        if (response.data.coupon.percent_off) {
          discountAmount = (total * response.data.coupon.percent_off) / 100;
        } else if (response.data.coupon.amount_off) {
          discountAmount = response.data.coupon.amount_off / 100; // Stripe amounts are in cents
        }
        formik.setFieldValue('discount_price', discountAmount);
        
        toast.success(`Coupon applied! You saved $${discountAmount.toFixed(2)}`);
      }
    } catch (error) {
      console.error('Error validating coupon:', error);
      toast.error(error.response?.data?.error || 'Invalid coupon code');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode('');
    setCouponApplied(false);
    setCouponDiscount(null);
    formik.setFieldValue('coupon_code', '');
    formik.setFieldValue('discount_price', 0);
    toast.success('Coupon removed');
  };
// helpers (top of file, inside component)
// inside component (before return)
  const phoneError =
    Boolean(formik.touched.phone_number && formik.errors.phone_number);



  const STATE_SHIPPING_DAYS = {
    "New South Wales": "2–4 business days",
    "Victoria": "3–5 business days",
    "Queensland": "4–6 business days",
    "South Australia": "3–5 business days",
    "Western Australia": "5–8 business days",
    "Tasmania": "4–7 business days",
    "Northern Territory": "6–10 business days",
    "Australian Capital Territory": "2–4 business days",
  };

  // Calculate final total with discount
  const finalTotal = Number(total) - (formik.values.discount_price || 0);
  // Fix: Since prices are already in AUD, don't multiply by currency rate
  const audCalculatedTotalPrice = Number(finalTotal.toFixed(2));

  return (
    <Elements stripe={stripePromise}>
      <CheckoutFormContent 
        formik={formik}
        items={items}
        onQty={onQty}
        data={data}
        expressShipping={expressShipping}
        setExpressShipping={setExpressShipping}
        expressShippingRate={expressShippingRate}
        shipping={shipping}
        total={total}
        finalTotal={finalTotal}
        withoutGst={withoutGst}
        gst={gst}
        formatPrice={formatPrice}
        ACCENT={ACCENT}
        WEB_URL={WEB_URL}
        API_URL={API_URL}
        open={open}
        handleClickOpen={handleClickOpen}
        handleClose={handleClose}
        setShowShippingDetails={setShowShippingDetails}
        showShippingDetails={showShippingDetails}
        phoneError={phoneError}
        couponCode={couponCode}
        setCouponCode={setCouponCode}
        couponApplied={couponApplied}
        couponDiscount={couponDiscount}
        validatingCoupon={validatingCoupon}
        handleApplyCoupon={handleApplyCoupon}
        handleRemoveCoupon={handleRemoveCoupon}
        audCalculatedTotalPrice={audCalculatedTotalPrice}
        setLoading={setLoading}
        loading={loading}
        currency={currency}
      />
    </Elements>
  );
}

// Checkout form component that uses Stripe hooks
function CheckoutFormContent({
  formik,
  items,
  onQty,
  data,
  expressShipping,
  setExpressShipping,
  expressShippingRate,
  shipping,
  total,
  finalTotal,
  withoutGst,
  gst,
  formatPrice,
  ACCENT,
  WEB_URL,
  API_URL,
  open,
  handleClickOpen,
  handleClose,
  setShowShippingDetails,
  showShippingDetails,
  phoneError,
  couponCode,
  setCouponCode,
  couponApplied,
  couponDiscount,
  validatingCoupon,
  handleApplyCoupon,
  handleRemoveCoupon,
  audCalculatedTotalPrice,
  setLoading,
  loading,
  currency
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [processing, setProcessing] = useState(false);

  const handlePayment = async (e) => {
    e.preventDefault();
    
    // Validate form first
    const errors = await formik.validateForm();
    if (Object.keys(errors).length > 0) {
      formik.setTouched(
        Object.keys(errors).reduce((acc, key) => ({ ...acc, [key]: true }), {})
      );
      toast.error('Please fill in all required fields');
      return;
    }

    if (!stripe || !elements) {
      toast.error('Stripe is not loaded yet. Please try again.');
      return;
    }

    setProcessing(true);
    const loadingToast = toast.loading('Processing payment...');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login to continue with checkout');
        setProcessing(false);
        toast.dismiss(loadingToast);
        return;
      }

      // Get userId from token
      let userId = data?.user_id;
      if (!userId) {
        try {
          const tokenPayload = JSON.parse(atob(token.split('.')[1]));
          userId = tokenPayload.user_id;
        } catch (e) {
          console.log('Could not decode token for userId');
        }
      }

      // Prepare transaction data
      const transactionData = {
        cardCustomizationId: data?._id,
        title: data?.cardId?.title,
        price: data?.cardId?.price,
        quantity: items[0].qty,
        aud: audCalculatedTotalPrice,
        delivery_address: formik.values.delivery_address,
        suburb: formik.values.suburb,
        state: formik.values.state,
        postal_code: formik.values.postal_code,
        phone_number: formik.values.phone_number,
        newsAndOffers: formik.values.newsAndOffers,
        expressShipping: formik.values.expressShipping,
        expressShippingRate: expressShipping ? expressShippingRate : 0,
        shipping,
        shippingDays: {
          inVictoria: expressShipping ? "1-2+ business days" : "3-5 business days",
          interstate: expressShipping ? "1-3+ business days" : "4-7 business days"
        },
        total: total, // Original total BEFORE discount
        gst: formatPrice(gst),
        coupon_code: formik.values.coupon_code || null,
        discount_price: formik.values.discount_price || 0
      };

      // Create Payment Intent
      const paymentIntentResponse = await axios.post(
        `${API_URL}/api/payment/create-payment-intent`,
        {
          amount: audCalculatedTotalPrice, // This is the final discounted amount
          userId: userId,
          cardCustomizationId: data?._id,
          transactionData: transactionData,
          couponCode: formik.values.coupon_code || null // Send coupon code for reference
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-access-token': token
          }
        }
      );

      const { clientSecret, transactionId, paymentIntentId } = paymentIntentResponse.data;

      // Confirm payment with Stripe
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            address: {
              line1: formik.values.delivery_address,
              city: formik.values.suburb,
              state: formik.values.state,
              postal_code: formik.values.postal_code,
              country: 'AU',
            },
            phone: formik.values.phone_number,
          },
        },
      });

      if (error) {
        console.error('Payment error:', error);
        toast.dismiss(loadingToast);
        toast.error(error.message || 'Payment failed');
        setProcessing(false);
        return;
      }

      if (paymentIntent.status === 'succeeded') {
        // Confirm payment on backend
        await axios.post(
          `${API_URL}/api/payment/confirm-payment`,
          {
            paymentIntentId: paymentIntent.id,
            transactionId: transactionId
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'x-access-token': token
            }
          }
        );

        toast.dismiss(loadingToast);
        toast.success('Payment successful!');
        
        // Redirect to success page
        router.push('/success');
      }

    } catch (error) {
      console.error('Payment processing error:', error);
      toast.dismiss(loadingToast);
      toast.error(error.response?.data?.error || error.message || 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
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
        <Box  sx={{
          pl: { md: '20%', laptop: '10%', lg: '15%', xl: '10%', xs: '5%', ipad: '25%' },
          pr: { md: '20%', laptop: '10%', lg: '15%', xl: '10%', xs: '5%', ipad: '25%' },
          mt: { xs: 5, md: 5 },
          mb: { xs: 5, md: 5 },
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          minHeight: '100vh'
        }}>
          <form noValidate
                onSubmit={formik.handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ borderRadius: 1.5, pb: '0 !important', width:'100%',
                  minWidth:{md:400, lg: 300, xl:500, '4k':600},
                  height:'100%',  minHeight:{'4k':600}}}>
                  <CardContent sx={{ p: 2, pb: '0 !important' }}>
                    <Typography variant="h6" fontWeight={800}
                                sx={{ mb: {md: 2 , xs:2, '4k':4}, color: ACCENT ,  fontSize:{xl:'25px','4k':'50px'} }}>Delivery Address</Typography>
                    {/*<TextField fullWidth label="Street Address"*/}
                    {/*           error={!!(formik.touched.delivery_address*/}
                    {/*             && formik.errors.delivery_address)}*/}
                    {/*           helperText={formik.touched.delivery_address*/}
                    {/*             && formik.errors.delivery_address}*/}
                    {/*           name="delivery_address"*/}
                    {/*           onBlur={formik.handleBlur}*/}
                    {/*           onChange={formik.handleChange}*/}
                    {/*           value={formik.values.delivery_address}*/}
                    {/*           sx={{ mb: 3 }}*/}
                    {/*/>*/}

                    {/*<AddressAutocompleteLocationIQ*/}
                    {/*  formik={formik}*/}
                    {/*  stateValue={formik.values.state}     // pass selected state*/}
                    {/*  name="delivery_address"*/}
                    {/*  label="Street Address"*/}
                    {/*  sx={{*/}
                    {/*     mb: 0*/}
                    {/*  }}*/}
                    {/*/>*/}


                    <AddressAutocompleteGoogleAU
                      formik={formik}
                      stateValue={formik.values.state}   // biases results if state chosen
                      name="delivery_address"
                      label="Street Address"
                      sx={{ mb: { md: 0, xl: 3 } }}
                    />



                    <Box
                      sx={{ 
                        display: 'flex', 
                        gap: { md: 1, xs: 2.5, xl: 3 }, 
                        flexDirection: { xs: 'column', md: 'row' },
                        mb: { md: 0, '4k': 4, xs: 2.5 }
                      }}>
                      <TextField 
                        fullWidth 
                        label="Suburb"
                        error={!!(formik.touched.suburb && formik.errors.suburb)}
                        helperText={formik.touched.suburb && formik.errors.suburb}
                        name="suburb"
                        onBlur={formik.handleBlur}
                        onChange={formik.handleChange}
                        value={formik.values.suburb}
                      />
                      
                      <Autocomplete
                        id="state"
                        fullWidth
                        options={[
                          "Australian Capital Territory",
                          "New South Wales",
                          "Victoria",
                          "Queensland",
                          "Northern Territory",
                          "South Australia",
                          "Tasmania",
                          "Western Australia"
                        ]}
                        value={formik.values.state || null}
                        onChange={(_, newValue) => formik.setFieldValue("state", newValue)}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="State"
                            name="state"
                            onBlur={formik.handleBlur}
                            error={Boolean(formik.touched.state && formik.errors.state)}
                            helperText={(formik.touched.state && formik.errors.state) || " "}
                            InputLabelProps={{ shrink: true }}
                          />
                        )}
                      />
                    </Box>
                    <Box sx={{
                      display: 'flex',
                      flexDirection: { xs: 'column', md: 'row' , xl:'row'},
                      gap: { md: 1, xs: 2.5, xl:3 },
                      mb: {md:0, '4k':4}
                    }}>
                      <TextField fullWidth label="Postal Code"
                                 error={!!(formik.touched.postal_code
                                   && formik.errors.postal_code)}
                                 helperText={formik.touched.postal_code
                                   && formik.errors.postal_code}
                                 name="postal_code"
                                 onBlur={formik.handleBlur}
                                 onChange={formik.handleChange}
                                 value={formik.values.postal_code}
                      />



                      <FormControl
                        fullWidth
                        error={phoneError}
                        // sx={{ mb: { md: 2, xs: 2.5 } }}
                      >
                        <PhoneInput
                          country="au"
                          value={formik.values.phone_number}
                          onChange={(v) =>
                            formik.setFieldValue('phone_number', `+${v.replace(/^\+/, '')}`)
                          }
                          enableSearch={false}
                          countryCodeEditable={false}
                          inputProps={{
                            name: 'phone_number',
                            onBlur: formik.handleBlur,
                            autoComplete: 'tel',
                          }}

                          // size & look = MUI TextField
                          containerClass="rp2-ctr"
                          buttonClass="rp2-btn"
                          inputClass={`rp2-input ${phoneError ? 'rp2-error' : ''}`}

                          containerStyle={{ width: '100%' }}
                          inputStyle={{
                            width: '100%',
                            height: 56,
                            fontSize: 16,
                            // border: '1px solid #c4c4c4 !important',
                            borderRadius: 8,
                            paddingLeft: 52,
                          }}
                          buttonStyle={{
                            border: 'none',
                            borderRight: '1px solid rgba(0, 0, 0, 0.10)',
                            borderRadius: '4px 0 0 4px',
                            width: 52,
                            background: 'transparent',
                          }}

                          // dropdown overlays on top (like MUI menus)
                          dropdownStyle={{
                            position: 'fixed',
                            zIndex: 2000,
                            maxHeight: 260,
                            overflowY: 'auto',
                            borderRadius: 8,
                            boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
                          }}
                        />

                        {/* Reserve space ALWAYS so layout stable stays */}
                        <FormHelperText
                          sx={{
                            minHeight: 20,            // fixed one-line space
                            lineHeight: '20px',
                            mt: 0.5,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {(formik.touched.phone_number && formik.errors.phone_number) || ' '}
                        </FormHelperText>
                      </FormControl>

              
                    </Box>

                    <Box
                      sx={{
                        display: 'flex',
                        width: '100%',
                        mb: 4,
                        mt:{xs:2, md:0},
                        flexDirection: { xs: 'column', md: 'row' },
                        // gap: 2,
                        alignItems: { md: 'left', xs: 'left' }
                      }}
                    >
                      <FormControlLabel
                        control={
                          <Checkbox
                            sx={{ '& .MuiSvgIcon-root': { fontSize: {md: 15, xl:20 , '4k':25} } }}
                            size="small"
                            name="newsAndOffers"
                            checked={formik.values.newsAndOffers}
                            onChange={formik.handleChange}
                          />
                        }
                        label="Email me with news and offers"
                        sx={{
                          '& .MuiFormControlLabel-label': {
                            fontSize: {md: '16px', xl:'20px', '4k':'25px' }
                          }
                        }}
                      />

                      <FormControl
                        error={Boolean(formik.touched.termsAccepted && formik.errors.termsAccepted)}
                        sx={{
                          display: 'flex',
                          flexDirection: 'row',
                          alignItems: 'center', // ✅ keeps checkbox + label vertically centered
                          m: 0 // remove extra margin
                        }}
                      >
                        <FormControlLabel
                          control={
                            <Checkbox
                              sx={{ '& .MuiSvgIcon-root': { fontSize:  {md: 15, xl:20, '4k':25 } } }}
                              size="small"
                              name="termsAccepted"
                              checked={formik.values.termsAccepted}
                              onChange={formik.handleChange}
                              onBlur={formik.handleBlur}
                            />
                          }
                          label={
                            <Typography
                              onClick={handleClickOpen}
                              sx={{ cursor: 'pointer',  fontSize: {md: '16px', xl:'20px', '4k':'25px' } }}
                            >
                              Terms and conditions
                            </Typography>
                          }
                        />
                        <FormHelperText
                          sx={{ position: 'absolute', mt: 4, display: 'flex', whiteSpace: 'nowrap', fontSize: {md: '10px', xl:'14px' }}}>
                          {(formik.touched.termsAccepted && formik.errors.termsAccepted) || ' '}
                        </FormHelperText>
                      </FormControl>


                    </Box>

                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined"
                      sx={{ borderRadius: 1.5, width: '100%' }}>
                  <CardContent sx={{ p: 2 }}>
                    {items.map(i => <OrderItem key={i.id} item={i} onQty={onQty}/>)}

                    {/* COMMENTED OUT - Card details moved to 3rd box below */}
                    {/* Card Customization Details would go here */}


                      {/*<Box sx={{ display: 'flex', width: '100%', alignItems: 'center' }}>*/}
                      {/*  <RadioGroup*/}
                      {/*    row*/}
                      {/*    name="shippingMethod"*/}
                      {/*    value={shippingMethod}*/}
                      {/*    onChange={(e) => {*/}
                      {/*      const method = e.target.value === 'express' ? 'express' : 'normal';*/}
                      {/*      setShippingMethod(method);*/}
                      {/*      formik.setFieldValue('shippingMethod', method);*/}
                      {/*      formik.setFieldValue('shippingRate', SHIPPING_PRICES[method]);*/}
                      {/*    }}*/}
                      {/*  >*/}
                      {/*    <FormControlLabel*/}
                      {/*      value="normal"*/}
                      {/*      control={<Radio size="small" sx={{*/}
                      {/*        '& .MuiSvgIcon-root': {*/}
                      {/*          fontSize: 16,*/}
                      {/*        },*/}
                      {/*      }} />}*/}
                      {/*      label="Normal shipping (AUD 10)"*/}
                      {/*      sx={{*/}
                      {/*        '& .MuiFormControlLabel-label': {*/}
                      {/*          // fontSize: '0.8rem', // smaller label text*/}
                      {/*          fontWeight: 600*/}
                      {/*        }*/}
                      {/*      }}*/}
                      {/*    />*/}
                      {/*    <FormControlLabel*/}
                      {/*      value="express"*/}
                      {/*      control={<Radio size="small" sx={{*/}
                      {/*        '& .MuiSvgIcon-root': {*/}
                      {/*          fontSize: 16,*/}
                      {/*        },*/}
                      {/*      }} />}*/}
                      {/*      label="Express shipping (AUD 20)"*/}
                      {/*      sx={{*/}
                      {/*        '& .MuiFormControlLabel-label': {*/}
                      {/*          // fontSize: '0.8rem', // smaller label text*/}
                      {/*          fontWeight: 600*/}
                      {/*        }*/}
                      {/*      }}*/}
                      {/*    />*/}
                      {/*  </RadioGroup>*/}
                      {/*</Box>*/}



                      <Divider sx={{ mt: {md:1, xl:5, '4k':0} }}/>
                      {/*<Typography fontWeight={700}>AUD {shippingRate.toFixed(2)}</Typography>*/}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography fontWeight={800} sx={{ mb: .5, color: ACCENT, fontSize:{'4k':25} }}>Shipping
                          Price:</Typography>
                         <Typography  sx={{ fontSize:{'4k':25}}} fontWeight={700}>$ {Number(shipping).toFixed(2)}</Typography></Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', mt: '3' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              sx={{
                                '& .MuiSvgIcon-root': {
                                  // fontSize: 14,
                                  fontSize:{md:14,'4k':25} , // size of the checkbox
                                  strokeWidth: 2.5   // makes the tick bolder
                                },
                                '&.Mui-checked .MuiSvgIcon-root': {
                                  fontWeight: 900 ,   // simulates a "bold" look on checked state

                                }
                              }}
                              size="small"
                              name="expressShipping"
                              // checked={formik.values.expressShipping}
                              checked={expressShipping}
                              // onChange={formik.handleChange}
                              onChange={(e) => {
                                setExpressShipping(e.target.checked);   // toggle true/false
                                formik.setFieldValue('expressShipping', e.target.checked); // keep in formik
                              }}
                            />
                          }
                          label="Express shipping"
                          sx={{
                            '& .MuiFormControlLabel-label': {
                              fontWeight: 900  ,     // bold label
                              fontSize:{'4k':25}
                            },
                            marginLeft: '-10px'
                          }}
                        />
                          <Typography sx={{ fontSize:{'4k':25}}} fontWeight={700}>
                           {`$ ${Number(expressShippingRate).toFixed(2)}`}
                          </Typography>
                      </Box>
                      
                    
                      {formik.values.state && (
                        <Box sx={{  mb: 1 }}>
                          <Box 
                            sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              cursor: 'pointer',
                              // p: 1,
                              borderRadius: 1,
                              // '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' }
                            }}
                            onClick={() => setShowShippingDetails(!showShippingDetails)}
                          >
                          <Typography 
                        
                            sx={{ 
                              fontSize: {md: '14px', xl: '16px', '4k': '20px' },
                              fontWeight: 900,
                              color: '#333',
                              flex: 1
                            }}
                          >
                            <strong>Delivery Information</strong>
                          </Typography>
                            <IconButton size="small" sx={{ p: 0.5 }}>
                              {showShippingDetails ? <Remove  sx={{fontWeight: 900,
                              color: '#333'}}/> : <Add sx={{fontWeight: 900,
                                color: '#333'}}/>}
                            </IconButton>
                          </Box>
                          
                          {showShippingDetails && (
                            <Box sx={{ 
                              mt: 1, 
                              p: 1, 
                              // width:300,s
                              bgcolor: '#f8f9fa', 
                              borderRadius: 1.5,
                              border: '1px solid #e9ecef'
                            }}>
                              {/* Show delivery info based on shipping method and selected state */}
                              {!expressShipping ? (
                                // Standard Shipping
                                <Box sx={{ mb: 1 }}>
                                  <Typography 
                                    sx={{ 
                                      fontSize: {md: '14px', xl: '16px', '4k': '20px' },
                                      fontWeight: 700,
                                      mb: 1,
                                      color: '#333'
                                    }}
                                  >
                                    Standard Delivery
                                  </Typography>
                                  
                                  <Box sx={{ mb: 0.5, display: 'flex', flexDirection: 'column', gap: 0.5, flexWrap: 'wrap' }}>
                                    <Typography 
                                      sx={{ 
                                        fontSize: {md: '12px', xl: '14px', '4k': '16px' },
                                        fontWeight: 600,
                                        color: '#555'
                                      }}
                                    >
                                      In Victoria: 3-5 business days
                                    </Typography>
                                    <Typography 
                                      sx={{ 
                                        fontSize: {md: '12px', xl: '14px', '4k': '16px' },
                                        fontWeight: 600,
                                        color: '#555'
                                      }}
                                    >
                                      Interstate: 4-7 business days
                                    </Typography>
                                  </Box>
                                </Box>
                              ) : (
                                // Express Shipping
                                <Box sx={{ mb: 1 }}>
                                  <Typography 
                                    sx={{ 
                                      fontSize: {md: '14px', xl: '16px', '4k': '20px' },
                                      fontWeight: 700,
                                      mb: 1,
                                      color: '#333'
                                    }}
                                  >
                                    Express Delivery
                                  </Typography>
                                  
                                  <Box sx={{ mb: 0.5, display: 'flex', flexDirection: 'row', gap: 2, flexWrap: 'wrap' }}>
                                    <Typography 
                                      sx={{ 
                                        fontSize: {md: '12px', xl: '14px', '4k': '16px' },
                                        fontWeight: 600,
                                        color: '#555'
                                      }}
                                    >
                                      In Victoria: 1-2+ business days
                                    </Typography>
                                    <Typography 
                                      sx={{ 
                                        fontSize: {md: '12px', xl: '14px', '4k': '16px' },
                                        fontWeight: 600,
                                        color: '#555'
                                      }}
                                    >
                                      Interstate: 1-3+ business days
                                    </Typography>
                                  </Box>
                                </Box>
                              )}
                              
                              {/* Australia Post link */}
                              <Box sx={{ 
                                display: 'flex', 
                                flexDirection: {xs:'column', md:'row'},
                                justifyContent: 'space-between', 
                                alignItems: { xs:'flex-start', md:'center'},
                                pt: 1,
                                borderTop: '1px solid #dee2e6'
                              }}>
                                <Typography 
                                  sx={{ 
                                    fontSize: {md: '11px', xl: '13px', '4k': '15px' },
                                    color: '#666'
                                  }}
                                >
                                 Delivery times may vary — please check the latest estimates on the  <a style={{color: '#1976d2', textDecoration: 'underline', '&:hover': { textDecoration: 'none' }}} href="https://share.google/Cnu1S0f4NUZknEHE9" target="_blank" rel="noopener noreferrer">Delivery speeds and coverage - Australia Posts</a>
                                </Typography>
                                {/* <Typography 
                                  component="a"
                                  href="https://share.google/Cnu1S0f4NUZknEHE9"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  sx={{ 
                                    fontSize: {md: '12px', xl: '14px', '4k': '16px' },
                                    color: '#1976d2',
                                    textDecoration: 'underline',
                                    '&:hover': { textDecoration: 'none' }
                                  }}
                                >
                                  Delivery speeds and coverage - Australia Post
                                </Typography> */}
                              </Box>
                            </Box>
                          )}
                        </Box>
                      )}
                      
                      {/* <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          mb: 1,
                        }}
                      >
                      
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography fontWeight={700} sx={{ color: ACCENT }}>
                            Approximate Shipping Days
                          </Typography>
                          <InfoOutlined
                            fontSize="small"
                            sx={{ color: '#555', cursor: 'pointer' }}
                            onClick={() => setShowShippingDays(v => !v)}
                          />
                        </Box>

                   
                        {showShippingDays && (
                          <Typography
                            variant="body2"
                            sx={{ color: 'text.secondary', fontWeight: 600 }}
                          >
                            {STATE_SHIPPING_DAYS[formik.values.state] || 'Select a state'}
                          </Typography>
                        )}
                      </Box> */}

                      {/*<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb:1 }}>*/}
                      {/*  <Typography*/}
                      {/*    fontWeight={700}*/}
                      {/*    sx={{ color: ACCENT, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}*/}
                      {/*  >*/}
                      {/*    <IconButton*/}
                      {/*      onClick={() => setShowShippingDays(v => !v)}*/}
                      {/*      size="small"*/}

                      {/*      aria-label="Show shipping info"*/}
                      {/*    >*/}
                      {/*      <InfoOutlined fontSize="small"    sx={{ color: '#555' , fontWeight:900}} />*/}
                      {/*    </IconButton>*/}

                      {/*    Approximate Shipping Days*/}
                      {/*    {showShippingDays && (*/}
                      {/*      <Typography*/}
                      {/*        component="span"*/}
                      {/*        variant="body2"*/}
                      {/*        sx={{ color: 'text.secondary', fontWeight: 600 }}*/}
                      {/*      >*/}
                      {/*        — {STATE_SHIPPING_DAYS[formik.values.state] || 'Select a state to see estimated shipping days'}*/}
                      {/*      </Typography>*/}
                      {/*    )}*/}
                      {/*  </Typography>*/}

                      {/*</Box>*/}

                      {/*<Box*/}
                      {/*  sx={{*/}
                      {/*    // mt: 2,*/}
                      {/*    p: 1,*/}
                      {/*    border: '1px solid',*/}
                      {/*    borderColor: 'divider',*/}
                      {/*    borderRadius: 2,*/}
                      {/*    bgcolor: '#fafafa',*/}
                      {/*  }}*/}
                      {/*>*/}
                      {/*  <Box*/}
                      {/*    sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}*/}
                      {/*  >*/}
                      {/*    <Typography fontWeight={700} sx={{ color: ACCENT }}>*/}
                      {/*      Approx Shipping*/}
                      {/*    </Typography>*/}

                      {/*    <IconButton*/}
                      {/*      onClick={() => setShowShippingDays(!showShippingDays)}*/}
                      {/*      size="small"*/}
                      {/*      sx={{ color: '#555' }}*/}
                      {/*    >*/}
                      {/*      {showShippingDays ? (*/}
                      {/*        <VisibilityOff fontSize="small" />*/}
                      {/*      ) : (*/}
                      {/*        <Visibility fontSize="small" />*/}
                      {/*      )}*/}
                      {/*    </IconButton>*/}
                      {/*  </Box>*/}

                      {/*  {showShippingDays && (*/}
                      {/*    <Typography*/}
                      {/*      variant="body2"*/}
                      {/*      sx={{ mt: 1, color: 'text.secondary', transition: '0.3s ease' }}*/}
                      {/*    >*/}
                      {/*      {STATE_SHIPPING_DAYS[formik.values.state] ||*/}
                      {/*        "Select a state to see estimated shipping days"}*/}
                      {/*    </Typography>*/}
                      {/*  )}*/}
                      {/*</Box>*/}
{/* Subtotal (without GST) */}
<Box sx={{ display: 'flex', justifyContent: 'space-between' }}> 
                        <Typography fontWeight={800} variant="body2"
                                    sx={{ mb: .5, color: ACCENT , fontSize:{'4k':25} }}>Subtotal (excl. GST):</Typography>
                                        <Typography variant="body2" sx={{ fontSize:{'4k':25}}} fontWeight={700}>$ {Number(withoutGst).toFixed(2)}</Typography>
                        {/* <Typography variant="body2" sx={{ fontSize:{'4k':25}}} fontWeight={700}>$ {formatPrice(Number(total) - gst)}</Typography> */}
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography fontWeight={800} variant="body2"
                                    sx={{ mb: .5, color: ACCENT , fontSize:{'4k':25} }}>GST (10%):</Typography>
                         <Typography variant="body2" sx={{ fontSize:{'4k':25}}} fontWeight={700}>$ {Number(gst).toFixed(2)}</Typography></Box>

                      

                      {/*<Box sx={{ display: 'flex', justifyContent: 'space-between' }}>*/}
                      {/*  <Typography fontWeight={800} sx={{ mb: .5, color: ACCENT }}>*/}
                      {/*    Shipping Price:*/}
                      {/*  </Typography>*/}
                      {/*  -  <Typography fontWeight={700}>AUD {shipping.toFixed(2)}</Typography>*/}
                      {/*  +  <Typography fontWeight={700}>AUD {shippingCost.toFixed(2)}</Typography>*/}
                      {/*</Box>*/}


                      <Divider sx={{ mt: {md: 1, '4k':0 } }}/>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography  variant="h6" fontWeight={900}
                                    sx={{ color: ACCENT }}>Total:</Typography>
                         <Typography variant="h6" fontWeight={900}>$ {Number(total).toFixed(2)}</Typography>
                      </Box>
                    </Box>
                    {/*<Divider sx={{ mt: 2, mb: 1 }} />*/}

                    {/*  <Box*/}
                    {/*    sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}*/}
                    {/*  >*/}
                    {/*    <Typography fontWeight={700} sx={{ color: ACCENT }}>*/}
                    {/*      Approx Shipping Days*/}
                    {/*    </Typography>*/}

                    {/*    <IconButton*/}
                    {/*      onClick={() => setShowShippingDays(!showShippingDays)}*/}
                    {/*      size="small"*/}
                    {/*      sx={{ color: '#555' }}*/}
                    {/*    >*/}
                    {/*      {showShippingDays ? (*/}
                    {/*        <Remove fontSize="small" />*/}
                    {/*      ) : (*/}
                    {/*        <Add fontSize="small" />*/}
                    {/*      )}*/}
                    {/*    </IconButton>*/}
                    {/*  </Box>*/}

                    {/*  {showShippingDays && (*/}
                    {/*    <Typography*/}
                    {/*      variant="body2"*/}
                    {/*      sx={{ mt: 1, color: 'text.secondary', transition: '0.3s ease' }}*/}
                    {/*    >*/}
                    {/*      {STATE_SHIPPING_DAYS[formik.values.state] ||*/}
                    {/*        "Select a state to see estimated shipping days"}*/}
                    {/*    </Typography>*/}
                    {/*  )}*/}
                    {/*</Box>*/}

                    {/*PayPal Buttons */}
                    {/*<PayPalScriptProvider options={{ clientId: PAYPAL_CLIENT_ID, currency: 'AUD', intent: 'capture' }}>*/}
                    {/*  <PayPalButtons*/}
                    {/*    style={{ layout: 'vertical' }}*/}
                    {/*    createOrder={async () => {*/}
                    {/*      // ✅ amount already in AUD*/}
                    {/*      const amountAud = Number(total).toFixed(2);*/}

                    {/*      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';*/}
                    {/*      const transactionId = (data && data._id) || undefined;*/}

                    {/*      const resp = await fetch(`${API_URL}/api/paypal/create-order`, {*/}
                    {/*        method: 'POST',*/}
                    {/*        headers: {*/}
                    {/*          'Content-Type': 'application/json',*/}
                    {/*          ...(token ? { 'x-access-token': token } : {})*/}
                    {/*        },*/}
                    {/*        body: JSON.stringify({*/}
                    {/*          amount: amountAud,*/}
                    {/*          currency: 'AUD',*/}
                    {/*          transactionId,*/}
                    {/*          meta: { title: data?.cardId?.title }*/}
                    {/*        }),*/}
                    {/*      });*/}

                    {/*      if (!resp.ok) {*/}
                    {/*        const err = await resp.json().catch(() => ({}));*/}
                    {/*        console.error('create-order failed', err);*/}
                    {/*        throw new Error(err?.error || 'Failed to create order');*/}
                    {/*      }*/}

                    {/*      const json = await resp.json();*/}
                    {/*      if (!json?.id) throw new Error('No order id returned');*/}
                    {/*      return json.id; // ✅ MUST return the order id*/}
                    {/*    }}*/}
                    {/*    onApprove={async ({ orderID }) => {*/}
                    {/*      const resp = await fetch(`${API_URL}/api/paypal/capture/${orderID}`, { method: 'POST' });*/}
                    {/*      const json = await resp.json();*/}

                    {/*      if (json?.status === 'COMPLETED') {*/}
                    {/*        toast.success('Payment completed ✅');*/}
                    {/*        window.location.href = `${WEB_URL}/success`;*/}
                    {/*      } else {*/}
                    {/*        toast.error(`Payment status: ${json?.status || 'Unknown'}`);*/}
                    {/*      }*/}
                    {/*    }}*/}
                    {/*    onError={(err) => {*/}
                    {/*      console.error('PayPal error', err);*/}
                    {/*      toast.error('Payment failed');*/}
                    {/*    }}*/}
                    {/*    onCancel={() => toast('Payment cancelled')}*/}
                    {/*  />*/}
                    {/*</PayPalScriptProvider>*/}
                    {/*<PayPalButtons*/}
                    {/*  style={{ layout: 'vertical' }}*/}
                    {/*  createOrder={async () => {*/}
                    {/*    const amountAud = Number(total).toFixed(2);*/}
                    {/*    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';*/}
                    {/*    const transactionId = (data && data._id) || undefined;*/}
                    
                    {/*    const resp = await fetch(`${API_URL}/api/paypal/create-order`, {*/}
                    {/*      method: 'POST',*/}
                    {/*      headers: { 'Content-Type': 'application/json', ...(token ? { 'x-access-token': token } : {}) },*/}
                    {/*      body: JSON.stringify({*/}
                    {/*        amount: amountAud,*/}
                    {/*        currency: 'AUD',*/}
                    {/*        quantity: items[0].qty,*/}
                    {/*        transactionId,*/}
                    {/*        meta: { title: data?.cardId?.title }*/}
                    {/*      }),*/}
                    {/*    });*/}
                    {/*    const json = await resp.json();*/}
                    {/*    if (!resp.ok || !json?.id) throw new Error(json?.error || 'Failed to create order');*/}
                    {/*    return json.id; // must return order id*/}
                    {/*  }}*/}
                    
                    {/*  onApprove={async ({ orderID }, actions) => {*/}
                    {/*    const resp = await fetch(`${API_URL}/api/paypal/capture/${orderID}`, { method: 'POST' });*/}
                    
                    {/*    // If server bubbled PayPal error back, handle instrument_declined by restarting:*/}
                    {/*    if (!resp.ok) {*/}
                    {/*      const err = await resp.json().catch(() => ({}));*/}
                    {/*      const issue = err?.paypal?.details?.[0]?.issue || err?.issue;*/}
                    {/*      if (issue === 'INSTRUMENT_DECLINED') {*/}
                    {/*        return actions.restart(); // let buyer choose another way to pay*/}
                    {/*      }*/}
                    {/*      toast.error(err?.message || 'Payment failed');*/}
                    {/*      return;*/}
                    {/*    }*/}
                    
                    {/*    const json = await resp.json();*/}
                    {/*    if (json?.status === 'COMPLETED') {*/}
                    {/*      toast.success('Payment completed ✅');*/}
                    {/*      window.location.href = `${WEB_URL}/success`;*/}
                    {/*    } else {*/}
                    {/*      toast.error(`Payment status: ${json?.status || 'Unknown'}`);*/}
                    {/*    }*/}
                    {/*  }}*/}
                    
                    {/*  onError={(err) => {*/}
                    {/*    console.error('PayPal error', err);*/}
                    {/*    toast.error('Payment failed');*/}
                    {/*  }}*/}
                    {/*  onCancel={() => toast('Payment cancelled')}*/}
                    {/*/>*/}

                    {/* COMMENTED OUT - Moved to 3rd card below */}
                    {/* ========================================
                        DISCOUNT/COUPON FIELD (MOVED TO 3RD CARD)
                        ======================================== */}
                    {/* <Divider sx={{ mt: 2, mb: 2 }} />
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography fontWeight={800} variant="body2" sx={{ mb: 1.5, color: ACCENT, fontSize: {'4k': 25} }}>
                        Have a discount code?
                      </Typography>
                      
                      {!couponApplied ? (
                        <TextField
                          variant="outlined"
                          fullWidth
                          placeholder="Enter coupon code"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && couponCode.trim()) {
                              handleApplyCoupon();
                            }
                          }}
                          disabled={validatingCoupon}
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                <Button
                                  variant="contained"
                                  onClick={handleApplyCoupon}
                                  disabled={validatingCoupon || !couponCode.trim()}
                                  sx={{
                                    bgcolor: '#c165a0',
                                    color: 'white',
                                    minWidth: 80,
                                    height: 36,
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                    textTransform: 'none',
                                    borderRadius: 1,
                                    '&:hover': {
                                      bgcolor: '#a0528a'
                                    },
                                    '&:disabled': {
                                      bgcolor: '#e0e0e0',
                                      color: '#9e9e9e'
                                    }
                                  }}
                                >
                                  {validatingCoupon ? 'Checking...' : 'Apply'}
                                </Button>
                              </InputAdornment>
                            )
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              paddingRight: 1,
                              '& fieldset': {
                                borderColor: 'divider'
                              },
                              '&:hover fieldset': {
                                borderColor: '#c165a0'
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#c165a0'
                              }
                            }
                          }}
                        />
                      ) : (
                        <Box sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          p: 1.5,
                          backgroundColor: '#e8f5e9',
                          borderRadius: 1,
                          border: '1px solid #4caf50'
                        }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" fontWeight={600} color="#2e7d32">
                              ✓ Coupon &quot;{couponCode}&quot; applied
                            </Typography>
                            {couponDiscount && (
                              <Typography variant="caption" color="text.secondary">
                                {couponDiscount.percent_off
                                  ? `${couponDiscount.percent_off}% off`
                                  : `$${(couponDiscount.amount_off / 100).toFixed(2)} off`}
                              </Typography>
                            )}
                          </Box>
                          <Button
                            size="small"
                            onClick={handleRemoveCoupon}
                            sx={{
                              color: '#2e7d32',
                              minWidth: 'auto',
                              fontSize: '0.75rem',
                              textTransform: 'none',
                              '&:hover': {
                                bgcolor: 'rgba(46, 125, 50, 0.08)',
                                color: '#2e7d32',
                              }
                            }}
                          >
                            Remove
                          </Button>
                        </Box>
                      )}
                      
                      {formik.values.discount_price > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1.5, p: 1, bgcolor: '#f1f8e9', borderRadius: 1 }}>
                          <Typography variant="body2" fontWeight={600} color="success.main" sx={{ fontSize: {'4k': 20} }}>
                            You Save:
                          </Typography>
                          <Typography variant="body2" fontWeight={700} color="success.main" sx={{ fontSize: {'4k': 20} }}>
                            -$ {Number(formik.values.discount_price).toFixed(2)}
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    <Divider sx={{ mb: 2 }} />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6" fontWeight={900} sx={{ color: ACCENT }}>
                        Final Total:
                      </Typography>
                      <Typography variant="h6" fontWeight={900} color="primary">
                        $ {Number(finalTotal).toFixed(2)}
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography fontWeight={800} variant="body2" sx={{ mb: 1.5, color: ACCENT, fontSize: {'4k': 25} }}>
                        Payment Information
                      </Typography>
                      <Box
                        sx={{
                          border: '1px solid #e0e0e0',
                          borderRadius: 1,
                          p: 2,
                          backgroundColor: '#fff',
                          '&:hover': {
                            borderColor: '#c165a0',
                          },
                          '&:focus-within': {
                            borderColor: '#c165a0',
                            borderWidth: '2px',
                          },
                        }}
                      >
                        <CardElement
                          options={{
                            style: {
                              base: {
                                fontSize: '16px',
                                color: '#424770',
                                fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
                                fontSmoothing: 'antialiased',
                                '::placeholder': {
                                  color: '#aab7c4',
                                },
                              },
                              invalid: {
                                color: '#fa755a',
                                iconColor: '#fa755a',
                              },
                            },
                            hidePostalCode: true,
                          }}
                        />
                      </Box>
                    </Box>

                    <Button
                      fullWidth
                      onClick={handlePayment}
                      variant="contained"
                      disabled={processing || !stripe || !elements}
                      sx={{
                        mt: { md:2, '4k':1 , xs:2 },
                        borderRadius: 1.5,
                        bgcolor: '#c165a0',
                        '&:hover': { bgcolor: '#a0528a' },
                        '&:disabled': {
                          bgcolor: '#ccc',
                          color: '#666'
                        }
                      }}
                    >
                      {processing ? 'Processing...' : 'Pay Now'}
                    </Button> */}
                  </CardContent>

                </Card>
              </Grid>

              {/* Third Box - Card Details (Centered) */}
              <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Card 
                  variant="outlined" 
                  sx={{ 
                    borderRadius: 1.5, 
                    width: '100%',
                    maxWidth: { md: '50%', xs: '100%' },
                    minWidth: { md: 400, lg: 300, xl: 500, '4k': 600 }
                  }}
                >
                  <CardContent sx={{ p: 2 }}>
                    {/* ========================================
                        DISCOUNT/COUPON FIELD
                        ======================================== */}
                    <Typography fontWeight={800} variant="body2" sx={{ mb: 1.5, color: ACCENT, fontSize: {'4k': 25} }}>
                      Have a discount code?
                    </Typography>
                    
                    {!couponApplied ? (
                      <TextField
                        variant="outlined"
                        fullWidth
                        placeholder="Enter coupon code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && couponCode.trim()) {
                            handleApplyCoupon();
                          }
                        }}
                        disabled={validatingCoupon}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <Button
                                variant="contained"
                                onClick={handleApplyCoupon}
                                disabled={validatingCoupon || !couponCode.trim()}
                                sx={{
                                  bgcolor: '#c165a0',
                                  color: 'white',
                                  minWidth: 80,
                                  height: 36,
                                  fontSize: '0.875rem',
                                  fontWeight: 600,
                                  textTransform: 'none',
                                  borderRadius: 1,
                                  '&:hover': {
                                    bgcolor: '#a0528a'
                                  },
                                  '&:disabled': {
                                    bgcolor: '#e0e0e0',
                                    color: '#9e9e9e'
                                  }
                                }}
                              >
                                {validatingCoupon ? 'Checking...' : 'Apply'}
                              </Button>
                            </InputAdornment>
                          )
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            paddingRight: 1,
                            '& fieldset': {
                              borderColor: 'divider'
                            },
                            '&:hover fieldset': {
                              borderColor: '#c165a0'
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#c165a0'
                            }
                          }
                        }}
                      />
                    ) : (
                      <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        p: 1.5,
                        backgroundColor: '#e8f5e9',
                        borderRadius: 1,
                        border: '1px solid #4caf50'
                      }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" fontWeight={600} color="#2e7d32">
                            ✓ Coupon &quot;{couponCode}&quot; applied
                          </Typography>
                          {couponDiscount && (
                            <Typography variant="caption" color="text.secondary">
                              {couponDiscount.percent_off
                                ? `${couponDiscount.percent_off}% off`
                                : `$${(couponDiscount.amount_off / 100).toFixed(2)} off`}
                            </Typography>
                          )}
                        </Box>
                        <Button
                          size="small"
                          onClick={handleRemoveCoupon}
                          sx={{
                            color: '#2e7d32',
                            minWidth: 'auto',
                            fontSize: '0.75rem',
                            textTransform: 'none',
                            '&:hover': {
                              bgcolor: 'rgba(46, 125, 50, 0.08)',
                              color: '#2e7d32',
                            }
                          }}
                        >
                          Remove
                        </Button>
                      </Box>
                    )}
                    
                    {formik.values.discount_price > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1.5, p: 1, bgcolor: '#f1f8e9', borderRadius: 1 }}>
                        <Typography variant="body2" fontWeight={600} color="success.main" sx={{ fontSize: {'4k': 20} }}>
                          You Save:
                        </Typography>
                        <Typography variant="body2" fontWeight={700} color="success.main" sx={{ fontSize: {'4k': 20} }}>
                          -$ {Number(formik.values.discount_price).toFixed(2)}
                        </Typography>
                      </Box>
                    )}

                    <Divider sx={{ mt: 2, mb: 2 }} />

                    {/* Display Final Total */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6" fontWeight={900} sx={{ color: ACCENT }}>
                        Final Total:
                      </Typography>
                      <Typography variant="h6" fontWeight={900} color="primary">
                        $ {Number(finalTotal).toFixed(2)}
                      </Typography>
                    </Box>

                    {/* ========================================
                        STRIPE CARD ELEMENT
                        ======================================== */}
                    <Box sx={{ mb: 2 }}>
                    <Typography fontWeight={800} variant="body2" sx={{ color: ACCENT, fontSize: {'4k': 25} }}>
                          Payment Information
                        </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                        <Typography fontWeight={800} variant="body2" sx={{ color: ACCENT, fontSize: {'4k': 25} }}>
                          Supported Cards
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                          {/* Mastercard Icon */}
                          <Box sx={{ 
                            // width: { xs: '40px', md: '48px', '4k': '56px' },
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <img 
                              src="https://img.icons8.com/color/48/mastercard.png" 
                              alt="Mastercard"
                              style={{ 
                                width: '100%', 
                                height: '100%', 
                                objectFit: 'contain' 
                              }}
                            />
                          </Box>
                          
                          {/* Credit Card Icon */}
                          <Box sx={{ 
                            // width: { xs: '40px', md: '48px', '4k': '56px' },
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <img 
                              src="https://img.icons8.com/color/48/visa.png" 
                              alt="Credit Card"
                              style={{ 
                                width: '100%', 
                                height: '100%', 
                                objectFit: 'contain' 
                              }}
                            />
                          </Box>
                          
                          {/* Debit Card Icon */}
                          <Box sx={{ 
                            // width: { xs: '40px', md: '48px', '4k': '56px' },
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <img 
                              src="https://img.icons8.com/color/48/amex.png" 
                              alt="Debit Card"
                              style={{ 
                                width: '100%', 
                                height: '100%', 
                                objectFit: 'contain' 
                              }}
                            />
                          </Box>
                        </Box>
                      </Box>
                     <Box
                        sx={{
                          border: '1px solid #e0e0e0',
                          borderRadius: 1,
                          p: 2,
                          backgroundColor: '#fff',
                          '&:hover': {
                            borderColor: '#c165a0',
                          },
                          '&:focus-within': {
                            borderColor: '#c165a0',
                            borderWidth: '2px',
                          },
                        }}
                      >
                        <CardElement options={{ style: { base: { fontSize: '16px', color: '#424770', fontFamily: '"Helvetica Neue", Helvetica, sans-serif', fontSmoothing: 'antialiased', '::placeholder': { color: '#aab7c4', }, }, invalid: { color: '#fa755a', iconColor: '#fa755a', }, }, hidePostalCode: true, }} />
                      </Box>
                    </Box>
                   

                    <Button
                      fullWidth
                      onClick={handlePayment}
                      variant="contained"
                      disabled={processing || !stripe || !elements}
                      sx={{
                        mt: { md:2, '4k':1 , xs:2 },
                        borderRadius: 1.5,
                        bgcolor: '#c165a0',
                        '&:hover': { bgcolor: '#a0528a' },
                        '&:disabled': {
                          bgcolor: '#ccc',
                          color: '#666'
                        }
                      }}
                    >
                      {processing ? 'Processing...' : 'Pay Now'}
                    </Button>

                  </CardContent>
                </Card>
              </Grid>

            </Grid>
          </form>
        </Box>
      </Box>


      <React.Fragment>
        <Dialog
          open={open}
          onClose={handleClose}
          maxWidth="md"
          PaperProps={{
            sx: {
              width: '100%',
              maxWidth: '1000px'
              // margin: "auto"
              // backgroundImage: {
              //   xs: `url(${WEB_URL}/portrate.png)`,
              //   md: `url(${WEB_URL}/bg1.png)`,
              // },
              // backgroundSize: "cover",
              // backgroundPosition: "center",
              // backgroundRepeat: "no-repeat",
            }
          }}
        >
          <DialogContent>
            <IconButton
              onClick={handleClose}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
                // color: '#c165a0',
              }}
            >
              <Close />
            </IconButton>
            <Grid container spacing={2}>
              <Grid item xs={12} md={12}>
                <Card sx={{
                  p: {
                    md: 3,
                    sm: 2,
                    boxShadow: 'none !important',
                    backgroundColor: 'transparent'
                  }
                }}>
                    <Typography gutterBottom variant="h6" padding="10px"
                                sx={{ textAlign: 'center', mt: { xs: 3, md: 0 } }}>
                      TERMS & CONDITIONS
                    </Typography>
                    <Typography gutterBottom variant="h6" padding="10px" sx={{ textAlign: 'center' }}>
                      Welcome to Incardible
                    </Typography>

                    <CardMedia/>
                    <CardContent>
                      <Typography gutterBottom variant="bod1" padding="10px" sx={{ textAlign: 'center' }}>
                        These Terms and Conditions (“Terms”, “Terms and Conditions”) govern your
                        relationship with Tecshield website’ applications mobile application (the
                        “Service”) operated by Tecshield. (“us”, “we”, or “our”).

                        Please read these Terms and Conditions carefully before using our website and
                        Tecshield’ mobile applications (the “Service”).

                        Your access to and use of the Service is conditioned on your acceptance of and
                        compliance with these Terms. These Terms apply to all visitors, users and others
                        who access or use the Service.

                        By accessing or using the Service you agree to be bound by these Terms. If you
                        disagree with any part of the terms then you may not access the Service.
                      </Typography>
                      <Typography gutterBottom variant="h6" component="div" sx={{ mt: 0, mb: 3, mt:5 }}>
                        Purchases
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        If you wish to purchase any product or service made available through the
                        Service (“Purchase”), you may be asked to supply certain information relevant to
                        your Purchase including, without limitation, your credit card number, the
                        expiration date of your credit card, your billing address, and your shipping
                        information.

                        You represent and warrant that: (i) you have the legal right to use any credit
                        card(s) or other payment method(s) in connection with any Purchase; and that
                        (ii) the information you supply to us is true, correct and complete.

                        By submitting such information, you grant us the right to provide the
                        information to third parties for purposes of facilitating the completion of
                        Purchases.

                        We reserve the right to refuse or cancel your order at any time for certain
                        reasons including but not limited to: product or service availability, errors in
                        the description or price of the product or service, error in your order or other
                        reasons.

                        We reserve the right to refuse or cancel your order if fraud or an unauthorised
                        or illegal transaction is suspected.
                      </Typography>
                      <Typography gutterBottom variant="h6" component="div" sx={{ mt: 3, mb: 3 }}>
                        Availability, Errors and Inaccuracies
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        We are constantly updating our offerings of products and services on the
                        Service. The products or services available on our Service may be mispriced,
                        described inaccurately, or unavailable, and we may experience delays in updating
                        information on the Service and in our advertising on other web sites.

                        We cannot and do not guarantee the accuracy or completeness of any information,
                        including prices, product images, specifications, availability, and services. We
                        reserve the right to change or update information and to correct errors,
                        inaccuracies, or omissions at any time without prior notice.
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        2.2 After the purchase, the product will be available for download, if the game
                        cannot be
                        downloaded please contact us by Email: team@brandongame.com and we will send it
                        to
                        you
                        manually.
                      </Typography>
                      <Typography gutterBottom variant="h6" component="div" sx={{ mt: 3, mb: 3 }}>
                        Contests, Sweepstakes and Promotions
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Any contests, sweepstakes or other promotions (collectively, “Promotions”) made
                        available through the Service may be governed by rules that are separate from
                        these Terms. If you participate in any Promotions, please review the applicable
                        rules as well as our Privacy Policy. If the rules for a Promotion conflict with
                        these Terms, the Promotion rules will apply.
                        <Typography gutterBottom variant="h6" component="div" sx={{ mt: 3, mb: 3 }}>
                          Subscriptions
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Some parts of the Service are billed on a subscription basis
                          (“Subscription(s)”). You will be billed in advance on a recurring and periodic
                          basis (weekly, monthly, yearly). Billing cycles are set either on a monthly or
                          annual basis, depending on the type of subscription plan you select when
                          purchasing a Subscription.

                          At the end of each Billing Cycle, your Subscription will automatically renew
                          under the exact same conditions unless you cancel it or Tecshield. cancels it.
                          You may cancel your Subscription renewal either through your online account
                          management page.

                          A valid payment method, including credit card or PayPal, is required to
                          process the payment for your Subscription. You shall provide Tecshield with
                          accurate and complete billing information including full name, address, state,
                          zip code, telephone number, and a valid payment method information. By
                          submitting such payment information, you automatically authorize Tecshield to
                          charge all Subscription fees incurred through your account to any such payment
                          instruments.

                          Should automatic billing fail to occur for any reason, Tecshield will issue an
                          electronic invoice indicating that you must proceed manually, within a certain
                          deadline date, with the full payment corresponding to the billing period as
                          indicated on the invoice.
                        </Typography>
                        <Typography gutterBottom variant="h6" component="div" sx={{ mt: 3, mb: 3 }}>
                          Free Trial
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Tecshield may, at its sole discretion, offer a Subscription with a free trial
                          for a limited period of time (“Free Trial”).

                          You may be required to enter your billing information in order to sign up for
                          the Free Trial.

                          If you do enter your billing information when signing up for the Free Trial,
                          you will not be charged by Tecshield until the Free Trial has expired. On the
                          last day of the Free Trial period, unless you cancelled your Subscription, you
                          will be automatically charged the applicable Subscription fees for the type of
                          Subscription you have selected.

                          At any time and without notice, Tecshield reserves the right to (i) modify the
                          terms and conditions of the Free Trial offer, or (ii) cancel such Free Trial
                          offer.
                        </Typography>
                        <Typography gutterBottom variant="h6" component="div" sx={{ mt: 3, mb: 3 }}>
                          Fee Changes
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Tecshield, in its sole discretion and at any time, may modify the Subscription
                          fees for the Subscriptions. Any Subscription fee change will become effective
                          at the end of the then-current Billing Cycle.

                          Tecshield will provide you with a reasonable prior notice of any change in
                          Subscription fees to give you an opportunity to terminate your Subscription
                          before such change becomes effective.

                          Your continued use of the Service after the Subscription fee change comes into
                          effect constitutes your agreement to pay the modified Subscription fee amount.
                        </Typography>
                        <Typography gutterBottom variant="h6" component="div" sx={{ mt: 3, mb: 3 }}>
                          Refunds
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Except when required by law, paid Subscription fees are non-refundable.
                        </Typography>
                        <Typography gutterBottom variant="h6" component="div" sx={{ mt: 3, mb: 3 }}>
                          Content
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Our Service allows you to post, link, store, share and otherwise make
                          available certain information, text, graphics, videos, or other material
                          (“Content”). You are responsible for the Content that you post to the Service,
                          including its legality, reliability, and appropriateness.

                          By posting Content to the Service, you grant us the right and license to use,
                          modify, publicly perform, publicly display, reproduce, and distribute such
                          Content on and through the Service. You retain any and all of your rights to
                          any Content you submit, post or display on or through the Service and you are
                          responsible for protecting those rights. You agree that this license includes
                          the right for us to make your Content available to other users of the Service,
                          who may also use your Content subject to these Terms.

                          You represent and warrant that: (i) the Content is yours (you own it) or you
                          have the right to use it and grant us the rights and license as provided in
                          these Terms, and (ii) the posting of your Content on or through the Service
                          does not violate the privacy rights, publicity rights, copyrights, contract
                          rights or any other rights of any person
                        </Typography>
                        <Typography gutterBottom variant="h6" component="div" sx={{ mt: 3, mb: 3 }}>
                          Accounts
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          When you create an account with us, you must provide us information that is
                          accurate, complete, and current at all times. Failure to do so constitutes a
                          breach of the Terms, which may result in immediate termination of your account
                          on our Service.

                          You are responsible for safeguarding the password that you use to access the
                          Service and for any activities or actions under your password, whether your
                          password is with our Service or a third-party service.

                          You agree not to disclose your password to any third party. You must notify us
                          immediately upon becoming aware of any breach of security or unauthorized use
                          of your account.

                          You may not use as a username the name of another person or entity or that is
                          not lawfully available for use, a name or trade mark that is subject to any
                          rights of another person or entity other than you without appropriate
                          authorization, or a name that is otherwise offensive, vulgar or obscene.

                          If you sign into the Service with Facebook Connect we will collect information
                          that is visible via your Facebook account such as: (1) your first and last
                          name, (2) Facebook ID, (3) Profile Picture/URL, and (4) list of Facebook
                          friends. Your Account may be used to publicly identify you as part of social
                          features of the Service, which may include user-to-user interaction, chat or
                          messaging functionality, public leaderboards, head-to-head competition, and
                          other similar features. Your username will be public and will be shown to
                          other users, but will only permit access to information that is considered
                          public or that you have designated as public in your user profile settings.
                          All info here is provided by the User voluntarily to simplify the
                          authorization process and use of social features. Learn about how to remove
                          your Facebook integration with our Service: HERE
                        </Typography>
                        <Typography gutterBottom variant="h6" component="div" sx={{ mt: 3, mb: 3 }}>
                          Copyright Policy
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          We respect the intellectual property rights of others. It is our policy to
                          respond to any claim that Content posted on the Service infringes the
                          copyright or other intellectual property infringement (“Infringement”) of any
                          person.

                          If you are a copyright owner or authorized on behalf of one, and you believe
                          that the copyrighted work has been copied in a way that constitutes copyright
                          infringement that is taking place through the Service, you must submit your
                          notice in writing to the attention of “Copyright Infringement” of
                          support@tecshield.io and include in your notice a detailed description of the
                          alleged Infringement.

                          You may be held accountable for damages (including costs and attorneys’ fees)
                          for misrepresenting that any Content is infringing your copyright.
                        </Typography>

                        <Typography gutterBottom variant="h6" component="div" sx={{ mt: 3, mb: 3 }}>
                          Intellectual Property
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          The Service and its original content (excluding Content provided by users),
                          features and functionality are and will remain the exclusive property of
                          Tecshield and its licensors. The Service is protected by copyright, trademark,
                          and other laws of both the Singapore and foreign countries. Our trademarks and
                          trade dress may not be used in connection with any product or service without
                          the prior written consent of Tecshield.
                        </Typography>
                        <Typography gutterBottom variant="h6" component="div" sx={{ mt: 3, mb: 3 }}>
                          Links To Other Web Sites
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Our Service may contain links to third-party web sites or services that are
                          not owned or controlled by Tecshield.

                          Tecshield has no control over, and assumes no responsibility for, the content,
                          privacy policies, or practices of any third party web sites or services. You
                          further acknowledge and agree that Tecshield shall not be responsible or
                          liable, directly or indirectly, for any damage or loss caused or alleged to be
                          caused by or in connection with use of or reliance on any such content, goods
                          or services available on or through any such web sites or services.

                          We strongly advise you to read the terms and conditions and privacy policies
                          of any third-party web sites or services that you visit.
                        </Typography>
                        <Typography gutterBottom variant="h6" component="div" sx={{ mt: 3, mb: 3 }}>
                          Termination
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          We may terminate or suspend your account immediately, without prior notice or
                          liability, for any reason whatsoever, including without limitation if you
                          breach the Terms.

                          Upon termination, your right to use the Service will immediately cease. If you
                          wish to terminate your account, you may simply discontinue using the Service.
                        </Typography>
                        <Typography gutterBottom variant="h6" component="div" sx={{ mt: 3, mb: 3 }}>
                          Limitation Of Liability
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          In no event shall Tecshield, nor its directors, employees, partners, agents,
                          suppliers, or affiliates, be liable for any indirect, incidental, special,
                          consequential or punitive damages, including without limitation, loss of
                          profits, data, use, goodwill, or other intangible losses, resulting from (i)
                          your access to or use of or inability to access or use the Service; (ii) any
                          conduct or content of any third party on the Service; (iii) any content
                          obtained from the Service; and (iv) unauthorized access, use or alteration of
                          your transmissions or content, whether based on warranty, contract, tort
                          (including negligence) or any other legal theory, whether or not we have been
                          informed of the possibility of such damage, and even if a remedy set forth
                          herein is found to have failed of its essential purpose.
                        </Typography>
                        <Typography gutterBottom variant="h6" component="div" sx={{ mt: 3, mb: 3 }}>
                          Disclaimer
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Your use of the Service is at your sole risk. The Service is provided on an
                          “AS IS” and “AS AVAILABLE” basis. The Service is provided without warranties
                          of any kind, whether express or implied, including, but not limited to,
                          implied warranties of merchantability, fitness for a particular purpose,
                          non-infringement or course of performance.

                          Tecshield its subsidiaries, affiliates, and its licensors do not warrant that
                          a) the Service will function uninterrupted, secure or available at any
                          particular time or location; b) any errors or defects will be corrected; c)
                          the Service is free of viruses or other harmful components; or d) the results
                          of using the Service will meet your requirements.’ fees)
                          for misrepresenting that any Content is infringing your copyright.
                        </Typography>
                        <Typography gutterBottom variant="h6" component="div" sx={{ mt: 3, mb: 3 }}>
                          Governing Law
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          These Terms shall be governed and construed in accordance with the laws of
                          Singapore, without regard to its conflict of law provisions.

                          Our failure to enforce any right or provision of these Terms will not be
                          considered a waiver of those rights. If any provision of these Terms is held
                          to be invalid or unenforceable by a court, the remaining provisions of these
                          Terms will remain in effect. These Terms constitute the entire agreement
                          between us regarding our Service, and supersede and replace any prior
                          agreements we might have between us regarding the Service.
                        </Typography>
                        <Typography gutterBottom variant="h6" component="div" sx={{ mt: 3, mb: 3 }}>
                          Changes
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          We reserve the right, at our sole discretion, to modify or replace these Terms
                          at any time. If a revision is material we will try to provide at least 15 days
                          notice prior to any new terms taking effect. What constitutes a material
                          change will be determined at our sole discretion.

                          By continuing to access or use our Service after those revisions become
                          effective, you agree to be bound by the revised terms. If you do not agree to
                          the new terms, please stop using the Service.
                        </Typography>
                        <Typography gutterBottom variant="h6" component="div" sx={{ mt: 3, mb: 3 }}>
                          Contact Us
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          If you have any questions about these Terms, please contact us at <b>Email: Info@incardible.com.au</b>
                        </Typography>
                      </Typography>
                    </CardContent>
                  </Card>
              </Grid>
            </Grid>
          </DialogContent>
        </Dialog>
      </React.Fragment>
    </>
  );
}
