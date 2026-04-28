// import Head from 'next/head';
// import {
//   Card,
//   CardContent,
//   Container,
//   Typography, Tab, IconButton, Menu, CircularProgress,
//   Grid, Box, useMediaQuery, useTheme, Button, MenuItem, Select
// } from '@mui/material';
// import { TabContext, TabList, TabPanel } from '@mui/lab';
// import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
// import * as React from 'react';
// import { useEffect, useState, useRef } from 'react';
// import toast from 'react-hot-toast';
// import axios from 'axios';
// import LandingNav from '../../layouts/landing-nav/landingLayout';
// import { useRouter } from 'next/router';
// import { useLoginModal } from '../../contexts/loginContext';
// import { useSavedModal } from '../../contexts/save-context';
//
// const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
// const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL;
// import NextLink from 'next/link';
// import QRCodeGenerator from '../../components/qrCode';
// import { useAuth } from '../../hooks/use-auth';
// import Checkout from '../../components/checkout';
//
// const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
// const Editor = () => {
//   const auth = useAuth();
//   const { openLogin } = useLoginModal();
//   const { isSave, setIsSave } = useSavedModal();
//   const [isUnityReady, setIsUnityReady] = useState(false);
//   const [currency, setCurrency] = useState({});
//   // const [generateToken, setGenerateToken] = useState(false);
//   const theme = useTheme();
//   const router = useRouter();
//   const { id: userCardId, selected: cardId } = router.query;
//   const gameIframe = useRef(null);
//   const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
//   const hasCalledRef = useRef(false);
//   const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL;
//   const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME;
//   const gameLoadCalled = useRef(false);
//   const hasCreatedTemplateRef = useRef(false);
//   const [data, setData] = useState(null);
//   const [showQr, setShowQr] = useState(false);
//   const [cardData, setCardData] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [image, setImage] = useState(null);
//   const [video, setVideo] = useState(null);
//   const [userTemplateData, setUserTemplateData] = useState(null);
//   const [url, setUrl] = useState(null);
//   const [token, setToken] = useState(null);
//
//   useEffect(() => {
//     const runOnceAfterLogin = async () => {
//       if (auth?.isAuthenticated && !hasCreatedTemplateRef.current) {
//       // if (auth?.isAuthenticatedt) {
//         hasCreatedTemplateRef.current = true;
//         console.log('going to call create template 1');
//         await getFrontCardDetail();
//         // await createTemplateData();
//       }
//     };
//
//     runOnceAfterLogin();
//   }, [auth?.isAuthenticated]);
//
//
//
//   const getFrontCardDetail = async () => {
//     try {
//       setLoading(true);
//       const res = await axios.get(`${BASE_URL}/api/cards/get/data/game/${cardId}`);
//       setData(res.data.data);
//       await createTemplateData();
//
//       setLoading(false);
//     } catch (error) {
//       console.log(error);
//     }
//   };
//
//   // useEffect(() => {
//   //   if (!cardId) {
//   //     return;
//   //   }
//   //   getFrontCardDetail();
//   // }, [cardId && !auth?.isAuthenticated]);
//
//   //rest api
//   // const fetchOtherCurrencies = async () => {
//   //   try {
//   //     const response = await axios.get(`https://open.er-api.com/v6/latest/EUR`, {
//   //       headers: {
//   //         'Content-Type': 'application/json'
//   //       }
//   //     });
//   //     setCurrency(response.data.rates);
//   //   } catch (error) {
//   //     console.log(error);
//   //     toast.error(error.response.data.msg);
//   //   }
//   // };
//   // console.log('currency=', currency);
//   // useEffect(() => {
//   //   fetchOtherCurrencies();
//   // }, []);
//   //
//   // const handleCheckout = async () => {
//   //   try {
//   //
//   //     const CardPriceInAud = Number((data?.price * currency['AUD']).toFixed(2));
//   //
//   //     console.log('CardPriceInAud', CardPriceInAud);
//   //
//   //     const frontCardImage = data?.frontDesign?.startsWith('http')
//   //       ? encodeURI(data.frontDesign) // encode special characters
//   //       : encodeURI(`${API_URL}${data?.frontDesign}`);
//   //
//   //     console.log("frontCardImage", frontCardImage);
//   //
//   //     const productPayload = {
//   //       title: data?.title,
//   //       price: CardPriceInAud,
//   //       userId: auth?.user?._id,
//   //       cardCustomizationId: cardData?._id,
//   //       // frontCardImage
//   //       frontCardImage:'https://greetings-card-apis.tecshield.net/uploads/images/User-ar-experience/1755244773209-44806.jpg'
//   //     };
//   //     console.log("productPayload", productPayload);
//   //     const res = await fetch(`${API_URL}/api/payment/create-checkout-session`, {
//   //       method: 'POST',
//   //       headers: {
//   //         'Content-Type': 'application/json'
//   //       },
//   //       body: JSON.stringify({ product: productPayload })
//   //     });
//   //
//   //     const response = await res.json();
//   //     console.log('response in checkout', response);
//   //     if (response.url) {
//   //       // localStorage.setItem('checkoutProduct', JSON.stringify({
//   //       //   name: data?.title,
//   //       //   price: data?.price
//   //       // }));
//   //       window.location.href = response.url;
//   //     }
//   //     // else {
//   //     //   alert('Something went wrong!');
//   //     // }
//   //   } catch (error) {
//   //     console.error('Checkout error', error);
//   //     alert('Error initiating checkout');
//   //   }
//   // };
//   //
//   // useEffect(() => {
//   //   if (auth?.isAuthenticated) {
//   //     const shouldRedirect = localStorage.getItem('redirectToCheckout');
//   //     if (shouldRedirect === 'true') {
//   //       localStorage.removeItem('redirectToCheckout');
//   //       handleCheckout();
//   //     }
//   //   }
//   // }, [auth?.isAuthenticated]);
//
//   useEffect(() => {
//     if (cardId && !auth?.isAuthenticated) {
//       console.log('going to call create template 2');
//       getFrontCardDetail();
//     }
//   }, [cardId, auth?.isAuthenticated]);
//
//   const getUserEmail = () => {
//     if (!auth?.isAuthenticated) {
//       console.log('User is not authenticated');
//       return null;
//     }
//
//     if (auth.user?.email) {
//       console.log('Using auth.user.email:', auth.user.email);
//       return auth.user.email;
//     }
//
//     if (auth.loginUserData?.email) {
//       console.log('Using auth.loginUserData.email:', auth.loginUserData.email);
//       return auth.loginUserData.email;
//     }
//
//     console.log('No email found in auth object');
//     return null;
//   };
//
//   const createTemplateData = async () => {
//     const email = getUserEmail();
//     const isAuth = auth?.isAuthenticated;
//     console.log('going to call create template ');
//     try {
//       const res = await axios.post(`${BASE_URL}/api/cards/upload-card-id`, {
//         uuid: cardId, userCardId, email, isAuthenticated: isAuth, userId: auth?.user?._id
//       });
//
//       setCardData(res.data.data);
//       setUserTemplateData(res?.data?.data);
//
//     } catch (error) {
//       console.log(error);
//     }
//
//   };
//
//   console.log('cardData', cardData);
//   console.log('userTemplateData', userTemplateData);
//
//   useEffect(() => {
//     window.UnityLoaded = async () => {
//       console.log('Unity is loaded and ready from web');
//       ;
//       setIsUnityReady(true);
//       if (data && userTemplateData) {
//       // if (userTemplateData) {
//         gameOnLoad();
//       }
//
//     };
//     }, [data && userTemplateData]);
//   // }, []);
//   // }, [data && userTemplateData && token]);
//
//   const gameOnLoad = async () => {
//     const instance = gameIframe.current?.contentWindow?.gameInstance;
//     // console.log("going to call front car fro gameonload");
//     // await getFrontCardDetail();
//     console.log('instance----', instance);
//
//     if (instance && data) {
//
//       console.log('✅ Unity gameInstance loaded:', instance);
//       console.log('✅userTemplateData', userTemplateData);
//       console.log('data---', data);
//
//       instance.SendMessage(
//         'JsonDataHandlerAndParser',
//         'LoadJsonData',
//         JSON.stringify(data)
//       );
//
//       instance.SendMessage(
//         'JsonDataHandlerAndParser',
//         'LoadSavedData',
//         JSON.stringify(userTemplateData)
//       );
//
//       //send qrlink for user ar experience
//       instance.SendMessage(
//         'JsonDataHandlerAndParser',
//         'purchaseCardLink',
//         JSON.stringify(
//           `https://ar-experience-greetings-card.tecshield.net/${userTemplateData?._id}`
//         )
//       );
//
//       const token = localStorage.getItem('token');
//
//       // console.log('token is from web ==========================', token);
//
//       //sending qr link here
//       instance.SendMessage(
//         'JsonDataHandlerAndParser',
//         'QrLink',
//         JSON.stringify({
//           qrUrl: `${WEB_URL}/upload-ar-content/${userTemplateData?.uuid}`,
//           token
//
//         })
//       );
//
//       gameIframe.current.contentWindow.saveImage = async (array = [], int, index) => {
//         console.log('🖼️ Received array:', array);
//         console.log('index', index);
//
//         console.log('userId----------------------in else');
//         setIsUnityReady(false);
//         try {
//           const isAuth = auth?.isAuthenticated;
//           // Convert the input array to Uint8Array
//           const uint8Array = new Uint8Array(array);
//
//           // Convert Uint8Array to a Blob (binary data)
//           const blob = new Blob([uint8Array], { type: 'image/png' }); // adjust MIME type if needed
//
//           // Create FormData to send the image as a file
//           const formData = new FormData();
//           formData.append('uuid', userCardId);
//           formData.append('isAuthenticated', isAuth);
//           formData.append('index', index);
//           formData.append('image', blob, 'image.png'); // 'image.png' is filename
//
//           // Send POST request with multipart/form-data
//           const response = await axios.post(
//             `${BASE_URL}/api/cards/upload-image`,
//             formData,
//             {
//               headers: {
//                 'Content-Type': 'multipart/form-data'
//               }
//             }
//           );
//           const imagePath = response?.data?.data?.url;
//
//           // const userTemplateId = response?.data?.data?.card?.userId;
//           // setUserTemplateId(userTemplateId);
//           // localStorage.setItem('userTemplateId', userTemplateId);
//
//           // Construct full image URL with index as a query param
//           // const imageUrl = `${BASE_URL}/${imagePath}?index=${index}`;
//           setImage(imagePath);
//           setUserTemplateData(response?.data?.data?.card);
//           console.log('imagePath', imagePath);
//           console.log('✅ Image uploaded successfully:', response);
//           instance.SendMessage(
//             'JsonDataHandlerAndParser',
//             'LoadImage',
//             JSON.stringify(imagePath)
//           );
//
//         } catch (error) {
//           console.error('❌ Error uploading image:', error);
//         }
//
//       };
//
//       gameIframe.current.contentWindow.UploadVideo = async (gameObjectName, methodName, url) => {
//         console.log('gameObjectName', gameObjectName);
//         console.log('url', url);
//         console.log('methodName', methodName);
//
//         setIsUnityReady(false);
//         console.log('userId----- in else', userCardId);
//         try {
//           const isAuth = auth?.isAuthenticated;
//           const blobResponse = await fetch(url);
//           const blob = await blobResponse.blob();
//
//           // 2. Convert blob to a File object (you can give a meaningful filename)
//           const file = new File([blob], 'recorded-video.mp4', {
//             type: blob.type || 'video/mp4'
//           });
//
//           const formData = new FormData();
//           formData.append('uuid', userCardId);
//           formData.append('isAuthenticated', isAuth);
//           formData.append('video', file);
//
//           // Send POST request with multipart/form-data
//           const response = await axios.post(
//             `${BASE_URL}/api/cards/upload-template-video`,
//             formData,
//             {
//               headers: {
//                 'Content-Type': 'multipart/form-data'
//               }
//             }
//           );
//
//           console.log('response of video uploaded successfully', response?.data?.data);
//           const videoPath = response?.data?.data?.url;
//           setVideo(videoPath);
//
//           instance.SendMessage(
//             'JsonDataHandlerAndParser',
//             'LoadVideo',
//             JSON.stringify(videoPath)
//           );
//
//         } catch (error) {
//           console.error('❌ Error uploading video:', error);
//         }
//
//       };
//
//       gameIframe.current.contentWindow.deleteImage = async (isImage, index) => {
//
//         console.log('isImage', isImage);
//         console.log('index', index);
//
//         console.log('userId----------------------', userCardId);
//         try {
//           const isAuth = auth?.isAuthenticated;
//           const response = await axios.post(
//             `${BASE_URL}/api/user/edit-data`,
//             {
//               isAuthenticated: isAuth,
//               isImage,
//               index,
//               uuid: userCardId
//
//             },
//             {
//               headers: {
//                 'Content-Type': 'application/json'
//               }
//             }
//           );
//           console.log('response to delete image---------------', response);
//
//         } catch (error) {
//           console.error('❌ Error deleting image:', error);
//         }
//
//       };
//
//       //unity developer call this function to send data to me  not in instance this function is call in window
//       gameIframe.current.contentWindow.saveData = async (json) => {
//
//         console.log('----------recieving json:', json);
//         const parsed = JSON.parse(json);
//         console.log('----------recieving json after parse:', parsed);
//
//         try {
//           const isAuth = auth?.isAuthenticated;
//           const response = await axios.post(
//             `${BASE_URL}/api/cards/upload-ar-data`,
//             {
//               uuid: userCardId,
//               data: parsed,
//               isAuthenticated: isAuth
//
//             },
//             {
//               headers: {
//                 'Content-Type': 'application/json'
//               }
//             }
//           );
//           console.log('response of save data===> ', response);
//           setUserTemplateData(response?.data?.data);
//           // if (parsed?.isCustomizationComplete && !auth?.isAuthenticated) {
//           //   openLogin();
//           // }
//
//           if (parsed?.isCustomizationComplete) {
//             if (!auth?.isAuthenticated) {
//               localStorage.setItem('redirectToCheckout', 'true');
//               await openLogin();
//             } else {
//               handleCheckout();
//             }
//           }
//         } catch (error) {
//           console.log('error in save data', error);
//         }
//       };
//
//       // callback when picker is click need to generate token
//       gameIframe.current.contentWindow.pickerClickCallBack = async () => {
//         console.log('----------msg when picker is clicked from website:');
//       };
//
//       gameIframe.current.contentWindow.changeTemplate = async (id) => {
//
//         console.log('----------recieving id when template is changed:', id);
//
//         try {
//           const isAuth = auth?.isAuthenticated;
//           console.log('isAuth in change temoplate', isAuth);
//           const response = await axios.post(
//             `${BASE_URL}/api/cards/update-data`,
//             {
//               id: userTemplateData._id,
//               isAuthenticated: isAuth
//
//             },
//             {
//               headers: {
//                 'Content-Type': 'application/json'
//               }
//             }
//           );
//           console.log('response when template ===> ', response);
//           setUserTemplateData(response?.data?.data);
//         } catch (error) {
//           console.log('error in change template data', error);
//         }
//       };
//
//     }
//     ;
//   };
//
//   return (
//     <>
//       <Head>
//         <title>Card Editor | {APP_NAME}</title>
//       </Head>
//
//       <Box sx={{
//         position: 'relative',
//         width: '100%',
//         height: '100vh !important',
//         overflowY: 'hidden ',
//         backgroundImage: {
//           xs: `url(${WEB_URL}/portrate.png)`,
//           md: `url(${WEB_URL}/bg1.png)`
//         },
//         backgroundSize: 'cover',
//         backgroundPosition: 'center',
//         backgroundRepeat: 'no-repeat'
//
//       }}>
//         <LandingNav/>
//         <Box sx={{ width: '100%', height: '100%' }}>
//           {/*<iframe*/}
//           {/*  ref={gameIframe}*/}
//           {/*  onLoad={() => {*/}
//           {/*    console.log('iframe loaded');*/}
//           {/*    if (window.UnityLoaded) {*/}
//           {/*      window.UnityLoaded(); // called manually if iframe is ready*/}
//           {/*    }*/}
//           {/*  }}*/}
//           {/*  src={`${WEB_URL}/editor/index.html`}*/}
//           {/*  frameBorder="0"*/}
//           {/*  style={{*/}
//           {/*    width: '100%',*/}
//           {/*    height: '100%'*/}
//           {/*  }}*/}
//           {/*></iframe>*/}
//           {/*{*/}
//           {/*  showQr && (*/}
//           {/*    <Box sx={{*/}
//           {/*      position: 'absolute',*/}
//           {/*      right: 20,*/}
//           {/*      top: { lg: '20%', xs: '40%', ipad: '35%' },*/}
//           {/*      display: { lg: 'block', xs: 'none' }*/}
//           {/*    }}>*/}
//           {/*      <QRCodeGenerator value={content} size={100}/>*/}
//           {/*    </Box>*/}
//           {/*  )*/}
//           {/*}*/}
//
//           <iframe
//             // onLoad={gameIframe}
//             ref={gameIframe}
//             onLoad={() => {
//               console.log('iframe loaded');
//               if (window.UnityLoaded) {
//                 window.UnityLoaded();
//               }
//             }}
//             src={`${WEB_URL}/editor/index.html`}
//             // src={`${WEB_URL}/editor/index.html?uuid=${cardId}`}
//             // title={data.title}
//             frameBorder="0"
//             style={{
//               width: '100%',
//               height: '100%'
//             }}
//           ></iframe>
//         </Box>
//
//       </Box>
//
//     </>
//   );
// };
// export default Editor;
//
//
//

import Head from 'next/head';
import {
  Card,
  CardContent,
  Container,
  Typography, Tab, IconButton, Menu, CircularProgress,
  Grid, Box, useMediaQuery, useTheme, Button, MenuItem, Select,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import CloseIcon from '@mui/icons-material/Close';
import * as React from 'react';
import { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import LandingNav from '../../layouts/landing-nav/landingLayout';
import { useRouter } from 'next/router';
import { useLoginModal } from '../../contexts/loginContext';
import { useSavedModal } from '../../contexts/save-context';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL;
import NextLink from 'next/link';
import QRCodeGenerator from '../../components/qrCode';
import { useAuth } from '../../hooks/use-auth';
import Checkout from '../../components/checkout';


const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const Editor = () => {
  const auth = useAuth();
  const { openLogin } = useLoginModal();
  const { isSave, setIsSave } = useSavedModal();
  const [unityReady, setUnityReady] = useState(false);
  const [isUnityReady, setIsUnityReady] = useState(false);
  const [currency, setCurrency] = useState({});
  // const [generateToken, setGenerateToken] = useState(false);
  const theme = useTheme();
  const router = useRouter();
  const { id: userCardId, selected: cardId } = router.query;
  const gameIframe = useRef(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const bridgesAttachedRef = useRef(false);
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const hasCalledRef = useRef(false);
  const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL;
  const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME;
  const gameLoadCalled = useRef(false);
  const hasCreatedTemplateRef = useRef(false);
  const [data, setData] = useState(null);
  const [showQr, setShowQr] = useState(false);
  const [cardData, setCardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);
  const [video, setVideo] = useState(null);
  const [userTemplateData, setUserTemplateData] = useState(null);
  const [url, setUrl] = useState(null);
  const [token, setToken] = useState(null);
  const redirectedRef = useRef(false);
  const [saveConfirmationDialog, setSaveConfirmationDialog] = useState(false);
  const [unsavedChangesDialog, setUnsavedChangesDialog] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [shouldNavigateAfterSave, setShouldNavigateAfterSave] = useState(false);


  // Check card expiration first, before any other logic
  useEffect(() => {
    const checkCardExpiration = async () => {
      if (!userCardId) {
        return;
      }

      try {
        const response = await axios.get(`${BASE_URL}/api/cards/check-expired/${userCardId}`);

        if (response.data?.data?.expired === true) {
          console.log('❌ Card has expired, redirecting to homepage');
          toast.error('This card has expired. Redirecting to homepage...');
          setTimeout(() => {
            router.push('/');
          }, 2000);
          return;
        }

        console.log('✅ Card is valid, continuing...');
      } catch (error) {
        console.error('Error checking card expiration:', error);
        // If card not found or other error, redirect to homepage for safety
        if (error.response?.status === 404) {
          console.log('❌ Card not found, redirecting to homepage');
          toast.error('Card not found. Redirecting to homepage...');
          setTimeout(() => {
            router.push('/');
          }, 2000);
        } else {
          // For other errors, still redirect to be safe
          console.log('❌ Error checking expiration, redirecting to homepage');
          toast.error('Unable to verify card. Redirecting to homepage...');
          setTimeout(() => {
            router.push('/');
          }, 2000);
        }
      }
    };

    // checkCardExpiration();
  }, [userCardId, router]);


  useEffect(() => {
    const onMsg = (e) => {
      if (e.data?.type === 'UNITY_READY') {
        console.log('✅ UNITY_READY message received from Unity editor******************************************************');
        console.log("e.data:", e.data);
        setIsUnityReady(true);
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [])






  // Helper function to trigger Unity save
  const triggerUnitySave = () => {
    const instance = gameIframe.current?.contentWindow?.gameInstance;
    if (instance) {
      // Tell Unity to save by calling its save function
      instance.SendMessage('JsonDataHandlerAndParser', 'SaveButtonClicked', '');
    }
  };

  // Handle browser back button and route changes
  useEffect(() => {
    const handleRouteChange = (url) => {
      if (hasUnsavedChanges) {
        setUnsavedChangesDialog(true);
        router.events.emit('routeChangeError');
        throw 'Route change aborted due to unsaved changes';
      }
    };

    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    router.events.on('routeChangeStart', handleRouteChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges, router]);

  useEffect(() => {
    const runOnceAfterLogin = async () => {
      // Wait for cardId and Unity to be ready
      if (!cardId) {
        console.log('⏳ Waiting for cardId from router...');
        return;
      }

      if (!isUnityReady) {
        console.log('⏳ Waiting for Unity to be ready...');
        return;
      }

      if (auth?.isAuthenticated && !hasCreatedTemplateRef.current) {
        hasCreatedTemplateRef.current = true;
        console.log('🔐 User authenticated - initializing editor');
        console.log('✅ auth.isAuthenticated:', auth.isAuthenticated);
        console.log('✅ Unity ready:', isUnityReady);
        console.log('🔑 Token in localStorage:', localStorage.getItem('token'));
        console.log('🆔 cardId:', cardId);

        try {
          // Get fresh data from the permanent table after login
          setLoading(true);
          const res = await axios.get(`${BASE_URL}/api/cards/get/data/game/${cardId}`);
          setData(res.data.data);

          // Create/update template data ONLY after Unity is ready
          console.log('🎮 Unity is ready, creating template data...');
          const freshTemplateData = await createTemplateData();
          setLoading(false);

          // Check redirect immediately with fresh data (don't wait for state)
          if (freshTemplateData) {
            console.log('🔄 Checking redirect with fresh data immediately after login');
            const shouldRedirect = localStorage.getItem('redirectToCheckout');

            if (shouldRedirect === 'true') {
              console.log('📊 Fresh userTemplateData:', freshTemplateData);
              localStorage.removeItem('redirectToCheckout');

              // Use the fresh data directly from the API response
              const isCustomizationComplete = freshTemplateData?.arTemplateData?.isCustomizationComplete === true;
              const isPaid = freshTemplateData?.isPaid === true;

              console.log('🔍 Fresh data conditions:', { isCustomizationComplete, isPaid });

              if (isCustomizationComplete && !isPaid) {
                console.log('✅ Redirecting to checkout with fresh data');
                router.push(`/checkout/${freshTemplateData._id}`);
              } else if (isCustomizationComplete && isPaid) {
                console.log('✅ Card is already paid, no redirect needed');
              } else {
                console.log('✅ Customization not complete yet, no redirect needed');
              }
            }
          }
        } catch (error) {
          console.log('Error in runOnceAfterLogin:', error);
          setLoading(false);
        }
      }
    };

    runOnceAfterLogin();
  }, [auth?.isAuthenticated, cardId, isUnityReady]);

  // Function to check redirect after login
  const checkRedirectAfterLogin = async () => {
    // Only check if user is authenticated and we have userTemplateData
    if (!auth?.isAuthenticated || !userTemplateData) return;

    // Check if user came from a redirect (has redirectToCheckout flag)
    const shouldRedirect = localStorage.getItem('redirectToCheckout');

    if (shouldRedirect === 'true') {
      console.log('🔄 User logged in after customization, checking redirect...');
      console.log('📊 Current userTemplateData:', userTemplateData);
      localStorage.removeItem('redirectToCheckout');

      // Check if customization is complete and not paid
      const isCustomizationComplete = userTemplateData?.arTemplateData?.isCustomizationComplete === true;
      const isPaid = userTemplateData?.isPaid === true;

      console.log('🔍 Check conditions:', { isCustomizationComplete, isPaid });

      if (isCustomizationComplete && !isPaid) {
        console.log('✅ Redirecting to checkout after login');
        router.push(`/checkout/${userTemplateData._id}`);
      } else if (isCustomizationComplete && isPaid) {
        console.log('✅ Card is already paid, no redirect needed');
      } else {
        console.log('✅ Customization not complete yet, no redirect needed');
      }
    }
  };

  // Check for redirect after login when userTemplateData is updated
  // Disabled this useEffect since we handle redirect in runOnceAfterLogin
  // useEffect(() => {
  //   checkRedirectAfterLogin();
  // }, [auth?.isAuthenticated, userTemplateData, router]);

  // useEffect(() => {
  //   if (redirectedRef.current) return;
  //   if (!auth?.isAuthenticated) return;
  //   if (!userTemplateData) return;
  //
  //   const done = userTemplateData?.arTemplateData?.isCustomizationComplete === true;
  //   const paid = userTemplateData?.isPaid === true;
  //
  //   if (done && !paid) {
  //     redirectedRef.current = true;
  //     router.replace(`/checkout/${userTemplateData._id}`); // replace avoids back-loop
  //   }
  //   // done && paid -> stay on page
  // }, [auth?.isAuthenticated, userTemplateData, router]);

  const getFrontCardDetail = async () => {
    // Check if cardId is available
    if (!cardId) {
      console.log('⏳ cardId not available, skipping getFrontCardDetail');
      return;
    }

    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/api/cards/get/data/game/${cardId}`);
      setData(res.data.data);
      await createTemplateData();

      setLoading(false);
    } catch (error) {
      console.log(error);
    }
  };

  // useEffect(() => {
  //   if (!cardId) {
  //     return;
  //   }
  //   getFrontCardDetail();
  // }, [cardId && !auth?.isAuthenticated]);

  //rest api
  // const fetchOtherCurrencies = async () => {
  //   try {
  //     const response = await axios.get(`https://open.er-api.com/v6/latest/EUR`, {
  //       headers: {
  //         'Content-Type': 'application/json'
  //       }
  //     });
  //     setCurrency(response.data.rates);
  //   } catch (error) {
  //     console.log(error);
  //     toast.error(error.response.data.msg);
  //   }
  // };
  // console.log('currency=', currency);
  // useEffect(() => {
  //   fetchOtherCurrencies();
  // }, []);
  //
  // const handleCheckout = async () => {
  //   try {
  //
  //     const CardPriceInAud = Number((data?.price * currency['AUD']).toFixed(2));
  //
  //     console.log('CardPriceInAud', CardPriceInAud);
  //
  //     const frontCardImage = data?.frontDesign?.startsWith('http')
  //       ? encodeURI(data.frontDesign) // encode special characters
  //       : encodeURI(`${API_URL}${data?.frontDesign}`);
  //
  //     console.log("frontCardImage", frontCardImage);
  //
  //     const productPayload = {
  //       title: data?.title,
  //       price: CardPriceInAud,
  //       userId: auth?.user?._id,
  //       cardCustomizationId: cardData?._id,
  //       // frontCardImage
  //       frontCardImage:'https://greetings-card-apis.tecshield.net/uploads/images/User-ar-experience/1755244773209-44806.jpg'
  //     };
  //     console.log("productPayload", productPayload);
  //     const res = await fetch(`${API_URL}/api/payment/create-checkout-session`, {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json'
  //       },
  //       body: JSON.stringify({ product: productPayload })
  //     });
  //
  //     const response = await res.json();
  //     console.log('response in checkout', response);
  //     if (response.url) {
  //       // localStorage.setItem('checkoutProduct', JSON.stringify({
  //       //   name: data?.title,
  //       //   price: data?.price
  //       // }));
  //       window.location.href = response.url;
  //     }
  //     // else {
  //     //   alert('Something went wrong!');
  //     // }
  //   } catch (error) {
  //     console.error('Checkout error', error);
  //     alert('Error initiating checkout');
  //   }
  // };
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

  useEffect(() => {
    if (cardId && !auth?.isAuthenticated && isUnityReady) {
      console.log('🎮 Unity is ready and user not authenticated, creating template...');
      getFrontCardDetail();
    }
  }, [cardId, auth?.isAuthenticated, isUnityReady]);

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

  const createTemplateData = async () => {
    // Check if cardId is available
    if (!cardId) {
      console.log('⏳ cardId not available, skipping template creation');
      return null;
    }

    const email = getUserEmail();
    const isAuth = auth?.isAuthenticated;
    console.log('going to call create template ');
    try {
      console.log('🔍 Calling API with params:', {
        uuid: cardId,
        userCardId,
        email,
        isAuthenticated: isAuth,
        userId: auth?.user?._id
      });

      const res = await axios.post(`${BASE_URL}/api/cards/upload-card-id`, {
        uuid: cardId, userCardId, email, isAuthenticated: isAuth, userId: auth?.user?._id
      });

      console.log('📊 Fresh template data received:', res?.data?.data);
      console.log('📊 isPaid status:', res?.data?.data?.isPaid);
      console.log('📊 isCustomizationComplete status:', res?.data?.data?.arTemplateData?.isCustomizationComplete);

      setCardData(res.data.data);
      setUserTemplateData(res?.data?.data);

      // Return the data so we can use it immediately if needed
      return res?.data?.data;

    } catch (error) {
      console.log('❌ Error in createTemplateData:', error);
      return null;
    }
  };

  // console.log('cardData', cardData);
  // console.log('userTemplateData', userTemplateData);

  const VIEW_KEY_PREFIX = 'viewed-card:';

  const addCardView = async (uuid) => {
    try {
      const checkViews = await axios.post(`${BASE_URL}/api/cards/${uuid}/view`);
      console.log('checkViews', checkViews);
    } catch (e) {
      console.debug('view track failed', e?.message);
    }
  };

  useEffect(() => {
    // Only call addCardView if cardId is available
    if (cardId) {
      addCardView(cardId);
    }
    // if (!cardId || !data) return;
    // const day = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    // const key = `viewed-card:${cardId}:${day}`;
    // if (localStorage.getItem(key)) return;
    //
    // axios.post(`${BASE_URL}/api/cards/${cardId}/view`).catch(()=>{});
    // localStorage.setItem(key, '1');
  }, [cardId]);

  useEffect(() => {
    // window.UnityLoaded = async () => {
    console.log('1 Unity is loaded and ready from web/////////////////////////////////////////////');
    // setIsUnityReady(true);
    // };
    if (data && userTemplateData && isUnityReady) {
      console.log('data before calling game on load', data);
      console.log('userTemplateData before calling game on load', userTemplateData);
      // setTimeout(() => {
      gameOnLoad();
      // }, 5000);
      // gameOnLoad();
    }

    // };
  }, [data && userTemplateData && isUnityReady]);

  // }, [data && userTemplateData && token]);
  // console.log('data=============', data);
  const gameOnLoad = async () => {
    const instance = gameIframe.current?.contentWindow?.gameInstance;
    // await getFrontCardDetail();
    console.log('instance----', instance);

    if (instance && data && userTemplateData) {

      console.log('✅ Unity gameInstance loaded after:', instance);
      console.log('✅userTemplateData after', userTemplateData);
      console.log('data after---', data);
      console.log('🔑 Token available when creating callbacks:', localStorage.getItem('token'));

      instance.SendMessage(
        'JsonDataHandlerAndParser',
        'LoadJsonData',
        JSON.stringify(data)
      );

      instance.SendMessage(
        'JsonDataHandlerAndParser',
        'LoadSavedData',
        JSON.stringify(userTemplateData)
      );

      //send qrlink for user ar experience
      instance.SendMessage(
        'JsonDataHandlerAndParser',
        'purchaseCardLink',
        JSON.stringify(
          `https://ar.incardible.com.au?templateId=${userTemplateData?._id}`
        )
      );

      const token = localStorage.getItem('token');

      // console.log('token is from web ==========================', token);

      //sending qr link here
      instance.SendMessage(
        'JsonDataHandlerAndParser',
        'QrLink',
        JSON.stringify({
          qrUrl: `${WEB_URL}/upload-ar-content/${userTemplateData?.uuid}`,
          token

        })
      );

      gameIframe.current.contentWindow.saveImage = async (array = [], int, index) => {
        console.log('🖼️ Received array:', array);
        console.log('index', index);

        console.log('userId----------------------in else');
        setIsUnityReady(false);
        try {
          // Check token directly from localStorage to avoid stale closure
          const token = localStorage.getItem('token');
          const isAuth = !!token;
          console.log('🖼️ SAVE IMAGE - Auth check:', {
            hasToken: !!token,
            isAuth: isAuth,
            authContextState: auth?.isAuthenticated,
            hasUser: !!auth?.user,
            userName: auth?.user?.firstName
          });
          // Convert the input array to Uint8Array
          const uint8Array = new Uint8Array(array);

          // Convert Uint8Array to a Blob (binary data)
          const blob = new Blob([uint8Array], { type: 'image/png' }); // adjust MIME type if needed

          // Create FormData to send the image as a file
          const formData = new FormData();
          formData.append('uuid', userCardId);
          formData.append('isAuthenticated', isAuth);
          formData.append('index', index);
          formData.append('image', blob, 'image.png'); // 'image.png' is filename

          // Send POST request with multipart/form-data
          const response = await axios.post(
            `${BASE_URL}/api/cards/upload-image`,
            formData,
            {
              headers: {
                'Content-Type': 'multipart/form-data'
              }
            }
          );
          const imagePath = response?.data?.data?.url;

          // const userTemplateId = response?.data?.data?.card?.userId;
          // setUserTemplateId(userTemplateId);
          // localStorage.setItem('userTemplateId', userTemplateId);

          // Construct full image URL with index as a query param
          // const imageUrl = `${BASE_URL}/${imagePath}?index=${index}`;
          setImage(imagePath);
          setUserTemplateData(response?.data?.data?.card);
          console.log('imagePath', imagePath);
          console.log('✅ Image uploaded successfully:', response);
          instance.SendMessage(
            'JsonDataHandlerAndParser',
            'LoadImage',
            JSON.stringify(imagePath)
          );

        } catch (error) {
          console.error('❌ Error uploading image:', error);
        }

      };

      gameIframe.current.contentWindow.UploadVideo = async (gameObjectName, methodName, url) => {
        console.log('gameObjectName', gameObjectName);
        console.log('url', url);
        console.log('methodName', methodName);

        setIsUnityReady(false);
        console.log('userId----- in else', userCardId);
        try {
          // Check token directly from localStorage to avoid stale closure
          const token = localStorage.getItem('token');
          const isAuth = !!token;
          const blobResponse = await fetch(url);
          const blob = await blobResponse.blob();

          // 2. Convert blob to a File object (you can give a meaningful filename)
          const file = new File([blob], 'recorded-video.mp4', {
            type: blob.type || 'video/mp4'
          });

          const formData = new FormData();
          formData.append('uuid', userCardId);
          formData.append('isAuthenticated', isAuth);
          formData.append('video', file);

          // Send POST request with multipart/form-data
          const response = await axios.post(
            `${BASE_URL}/api/cards/upload-template-video`,
            formData,
            {
              headers: {
                'Content-Type': 'multipart/form-data'
              }
            }
          );

          console.log('response of video uploaded successfully', response?.data?.data);
          const videoPath = response?.data?.data?.url;
          setVideo(videoPath);

          instance.SendMessage(
            'JsonDataHandlerAndParser',
            'LoadVideo',
            JSON.stringify(videoPath)
          );

        } catch (error) {
          console.error('❌ Error uploading video:', error);
        }

      };

      gameIframe.current.contentWindow.deleteImage = async (isImage, index) => {

        console.log('isImage', isImage);
        console.log('index', index);

        console.log('userId----------------------', userCardId);
        try {
          // Check token directly from localStorage to avoid stale closure
          const token = localStorage.getItem('token');
          const isAuth = !!token;
          const response = await axios.post(
            `${BASE_URL}/api/user/edit-data`,
            {
              isAuthenticated: isAuth,
              isImage,
              index,
              uuid: userCardId

            },
            {
              headers: {
                'Content-Type': 'application/json'
              }
            }
          );
          console.log('response to delete image---------------', response);

        } catch (error) {
          console.error('❌ Error deleting image:', error);
        }

      };

      //unity developer call this function to send data to me  not in instance this function is call in window
      gameIframe.current.contentWindow.saveData = async (json) => {

        console.log('----------recieving json:', json);
        const parsed = JSON.parse(json);
        console.log('----------recieving json after parse:', parsed);

        // Check token directly from localStorage to avoid stale closure
        const token = localStorage.getItem('token');
        const isAuth = !!token; // If token exists, user is authenticated

        console.log('💾 SAVE DATA - Authentication check:', {
          hasToken: !!token,
          isAuthenticated: isAuth,
          authContextState: auth?.isAuthenticated,
          hasUser: !!auth?.user,
          userName: auth?.user?.firstName
        });

        try {
          console.log('📤 Sending to API with isAuthenticated:', isAuth);

          const response = await axios.post(
            `${BASE_URL}/api/cards/upload-ar-data`,
            {
              uuid: userCardId,
              data: parsed,
              isAuthenticated: isAuth

            },
            {
              headers: {
                'Content-Type': 'application/json'
              }
            }
          );
          console.log('✅ Save data response:', response);
          setUserTemplateData(response?.data?.data);
          // setSaveConfirmationDialog(true);
          // Mark as saved
          setHasUnsavedChanges(false);

          // If should navigate after save (from back button flow), navigate
          // if (shouldNavigateAfterSave) {
          //   setShouldNavigateAfterSave(false);
          //   setUnsavedChangesDialog(false);
          //   router.push('/');
          //   return; // Exit early
          // }

          // Normal save button flow
          // If user is authenticated, show save confirmation
          console.log('🔐 After save - isAuth (from token):', isAuth);
          if (isAuth) {
            console.log('✅ User is authenticated - showing save confirmation dialog');
            setSaveConfirmationDialog(true);
          }

          // Handle completion and checkout flow
          if (parsed?.isCustomizationComplete && !isAuth) {
            console.log('⚠️ Customization complete but not authenticated - opening login');
            openLogin();
          }

          if (!isAuth) {
            console.log('⚠️ User not authenticated - setting redirect flag and opening login');
            localStorage.setItem('redirectToCheckout', 'true');
            await openLogin();
          }

          // if (parsed?.isCustomizationComplete) {
          //   // Check if user is already paid - if so, don't redirect to checkout
          //   const isAlreadyPaid = userTemplateData?.isPaid === true;

          //   if (isAlreadyPaid) {
          //     console.log('✅ Card is already paid, no need to redirect to checkout');
          //     return; // Don't redirect if already paid
          //   }

          //   // Only redirect to checkout if not paid yet
          //   if (!auth?.isAuthenticated) {
          //     localStorage.setItem('redirectToCheckout', 'true');
          //     await openLogin();
          //   } else {
          //     router.push(`/checkout/${userTemplateData._id}`);
          //     // handleCheckout();
          //   }
          // }




          //
          // const isDone = !!(parsed?.isCustomizationComplete
          //   ?? userTemplateData?.arTemplateData?.isCustomizationComplete);
          // const isPaid = !!userTemplateData?.isPaid;
          //
          //
          // if (isDone) {
          //   if (!auth?.isAuthenticated) {
          //     localStorage.setItem('redirectToCheckout', 'true');
          //     await openLogin();
          //     return;
          //   }
          // } else if (!isPaid) {
          //     router.push(`/checkout/${userTemplateData._id}`);
          //     return;
          //   }

        } catch (error) {
          console.log('error in save data', error);
        }
      };

      // callback when picker is click need to generate token
      gameIframe.current.contentWindow.pickerClickCallBack = async () => {
        console.log('----------msg when picker is clicked from website:');
      };

      gameIframe.current.contentWindow.changeTemplate = async (id, json) => {

        console.log('----------recieving id when template is changed:', id);
        console.log('----------recieving json:', json);
        const parsed = JSON.parse(json);
        console.log('----------recieving json after parse:', parsed);

        const token = localStorage.getItem('token');
        const isAuth = !!token;

        console.log('💾 SAVE DATA - Authentication check:', {
          hasToken: !!token,
          isAuthenticated: isAuth,
          authContextState: auth?.isAuthenticated,
          hasUser: !!auth?.user,
          userName: auth?.user?.firstName
        });

        try {
          console.log('📤 Step 1: Saving data via upload-ar-data API');

          const saveResponse = await axios.post(
            `${BASE_URL}/api/cards/upload-ar-data`,
            {
              uuid: userCardId,
              data: parsed,
              isAuthenticated: isAuth

            },
            {
              headers: {
                'Content-Type': 'application/json'
              }
            }
          );
          console.log('✅ Save data response:', saveResponse);
          setUserTemplateData(saveResponse?.data?.data);

          setHasUnsavedChanges(false);

          console.log('🔐 After save - isAuth (from token):', isAuth);
          if (isAuth) {
            console.log('✅ User is authenticated - showing save confirmation dialog');
            // setSaveConfirmationDialog(true);
          }

          // Handle completion and checkout flow
          if (parsed?.isCustomizationComplete && !isAuth) {
            console.log('⚠️ Customization complete but not authenticated - opening login');
            // openLogin();
          }

          if (!isAuth) {
            console.log('⚠️ User not authenticated - setting redirect flag and opening login');
            localStorage.setItem('redirectToCheckout', 'true');
            // await openLogin();
          }

          console.log('📤 Step 2: Updating template via update-data API');
          const updateResponse = await axios.post(
            `${BASE_URL}/api/cards/update-data`,
            {
              id: saveResponse?.data?.data?._id,
              isAuthenticated: isAuth

            },
            {
              headers: {
                'Content-Type': 'application/json'
              }
            }
          );
          console.log('✅ Template update response:', updateResponse);
          setUserTemplateData(updateResponse?.data?.data);

        } catch (error) {
          console.log('❌ Error in changeTemplate:', error);
        }

      };

      gameIframe.current.contentWindow.goBack = async () => {

        setUnsavedChangesDialog(true);

        // If not authenticated, always show unsaved changes popup
        // if (!auth?.isAuthenticated) {
        //   setUnsavedChangesDialog(true);
        // } 
        // // If authenticated, check if there are unsaved changes
        // else if (hasUnsavedChanges) {
        //   setUnsavedChangesDialog(true);
        // } 
        // // If authenticated and no unsaved changes, navigate directly
        // else {
        //   router.push('/');
        // }
      };

      gameIframe.current.contentWindow.checkout = async (imageBytes = []) => {
        // if (parsed?.isCustomizationComplete) {
        // Check token directly from localStorage to avoid stale closure
        const token = localStorage.getItem('token');
        const isAuth = !!token;

        const isAlreadyPaid = userTemplateData?.isPaid === true;

        if (isAlreadyPaid) {
          console.log('✅ Card is already paid, no need to redirect to checkout');
          return; // Don't redirect if already paid
        }

        if (!isAuth) {
          console.log('⚠️ Checkout clicked but not authenticated - opening login');
          localStorage.setItem('redirectToCheckout', 'true');
          await openLogin();
        } else {


          const uint8Array = new Uint8Array(imageBytes);
          const blob = new Blob([uint8Array], { type: 'image/png' }); // adjust MIME type if needed

          // Create FormData to send the image as a file
          const formData = new FormData();
          formData.append('uuid', userCardId);
          formData.append('image', blob, 'image.png');

          // // Send POST request with multipart/form-data
          const response = await axios.post(
            `${BASE_URL}/api/cards/upload-text-ss`,
            formData,
            {
              headers: {
                'Content-Type': 'multipart/form-data'
              }
            }
          );


          console.log('✅ User authenticated - redirecting to checkout');
          router.push(`/checkout/${userTemplateData._id}`);
          // handleCheckout();
        }
        // }

      };


    } else {
      console.log('instance is null', instance);
    }

  };

  return (
    <>
      <Head>
        <title>Card Editor | {APP_NAME}</title>
      </Head>

      <Box sx={{
        position: 'relative',
        width: '100%',
        height: '100vh !important',
        overflowY: 'hidden ',
        backgroundImage: {
          xs: `url(${WEB_URL}/portrate.png)`,
          md: `url(${WEB_URL}/bg1.png)`
        },
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'

      }}>
        <LandingNav />
        <Box sx={{ width: '100%', height: '100%' }}>
          {/*<iframe*/}
          {/*  ref={gameIframe}*/}
          {/*  onLoad={() => {*/}
          {/*    console.log('iframe loaded');*/}
          {/*    if (window.UnityLoaded) {*/}
          {/*      window.UnityLoaded(); // called manually if iframe is ready*/}
          {/*    }*/}
          {/*  }}*/}
          {/*  src={`${WEB_URL}/editor/index.html`}*/}
          {/*  frameBorder="0"*/}
          {/*  style={{*/}
          {/*    width: '100%',*/}
          {/*    height: '100%'*/}
          {/*  }}*/}
          {/*></iframe>*/}
          {/*{*/}
          {/*  showQr && (*/}
          {/*    <Box sx={{*/}
          {/*      position: 'absolute',*/}
          {/*      right: 20,*/}
          {/*      top: { lg: '20%', xs: '40%', ipad: '35%' },*/}
          {/*      display: { lg: 'block', xs: 'none' }*/}
          {/*    }}>*/}
          {/*      <QRCodeGenerator value={content} size={100}/>*/}
          {/*    </Box>*/}
          {/*  )*/}
          {/*}*/}

          <iframe
            // onLoad={gameIframe}
            ref={gameIframe}
            onLoad={() => {
              console.log('iframe loaded');
              if (window.UnityLoaded) {
                window.UnityLoaded();
              }
            }}


            src={`${WEB_URL}/editor/index.html`}
            // src={`${WEB_URL}/editor/index.html?uuid=${cardId}`}
            // title={data.title}
            frameBorder="0"
            style={{
              width: '100%',
              height: '100%'
            }}
          ></iframe>
        </Box>
      </Box>

      {/* Save Confirmation Dialog */}
      <Dialog
        open={saveConfirmationDialog}
        onClose={() => setSaveConfirmationDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            width: 450,
            backgroundColor: '#EEE3EA',
            border: '2px solid #E697B1',
            borderRadius: 2,
            position: 'relative'
          }
        }}
      >
        <IconButton
          onClick={() => setSaveConfirmationDialog(false)}
          sx={{
            pt: 0,
            position: 'absolute',
            right: 8,
            top: 8,
            color: '#666',
            '&:hover': {
              backgroundColor: 'rgba(193, 100, 159, 0.1)',
              color: '#C1649F'
            }
          }}
        >
          <CloseIcon sx={{ fontSize: 20 }} />
        </IconButton>
        <DialogContent sx={{ p: 2, mt: 2, backgroundColor: '#EEE3EA' }}>
          {/* <Box sx={{ 
            mt: 2, 
            p: 3, 
            // bgcolor: '#d4edda', 
            borderRadius: 3,
            // border: '2px solid #28a745',
            // boxShadow: '0 4px 12px rgba(40, 167, 69, 0.2)'
          }}> */}
          <Typography sx={{
            fontWeight: 700,
            fontSize: '20px',
            color: '#000000',
            lineHeight: 1.6,
            textAlign: 'center',
            display: 'block',
          }}>
            Your card has been saved successfully!
          </Typography>
          <Typography variant="caption" sx={{
            fontSize: '14px',
            color: '#000000',
            lineHeight: 1.6,
            textAlign: 'center',
            display: 'block',
            // mt: 1
          }}>
            Your card is saved in &quot;My Cards&quot; under your profile
          </Typography>
          {/* </Box> */}
          {/* <Box sx={{ 
            mt: 2, 
            p: 3, 
            bgcolor: '#FFF', 
            borderRadius: 3,
            border: '2px solid #E697B1',
            boxShadow: '0 4px 12px rgba(230, 151, 177, 0.15)'
          }}> */}
          {/* <Typography sx={{ 
              fontSize: '15px', 
              color: '#000', 
              fontWeight: 700,
              lineHeight: 1.6,
              p:3,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              Your card is saved in &quot;My Cards&quot; under your profile
            </Typography> */}
          {/* </Box> */}
        </DialogContent>
        <DialogActions sx={{ pt: 0, backgroundColor: '#EEE3EA', justifyContent: 'center' }}>
          <Button
            onClick={() => setSaveConfirmationDialog(false)}
            variant="contained"
            sx={{
              backgroundColor: '#C1649F',
              // backgroundColor: '#d17a9a',
              color: '#ffffff',
              px: 4,
              py: .5,
              fontSize: '14px',
              fontWeight: 400,

              borderRadius: '10px !important',
              // fontWeight: 600,
              '&:hover': {
                backgroundColor: '#C1649F',
                // transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(230, 151, 177, 0.3)'
              },
              // transition: 'all 0.2s ease'
            }}
          >
            Got it!
          </Button>
        </DialogActions>
      </Dialog>

      {/* Unsaved Changes Dialog */}
      <Dialog
        open={unsavedChangesDialog}
        onClose={() => setUnsavedChangesDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            width: 450,
            backgroundColor: '#EEE3EA',
            border: '2px solid #E697B1',
            borderRadius: 2,
            position: 'relative'
          }
        }}
      >
        <IconButton
          onClick={() => setUnsavedChangesDialog(false)}
          sx={{
            pt: 0,
            position: 'absolute',
            right: 8,
            top: 8,
            color: '#666',
            '&:hover': {
              backgroundColor: 'rgba(193, 100, 159, 0.1)',
              color: '#C1649F'
            }
          }}
        >
          <CloseIcon sx={{ fontSize: 20 }} />
        </IconButton>
        <DialogContent sx={{ p: 2, mt: 2, backgroundColor: '#EEE3EA' }}>
          {/* <Typography sx={{ fontSize: '16px', color: '#333', lineHeight: 1.6, mb: 3 ,  fontWeight: 700}}>
            Did you save your changes?
          </Typography> */}
          {/* <Box sx={{ 
            mt: 2, 
            p: 3, 
            bgcolor: '#FDF7FB', 
            borderRadius: 3,
            // border: '2px solid #ffc107',
            // boxShadow: '0 4px 12px rgba(255, 193, 7, 0.2)'
          }}> */}
          <Typography sx={{
            fontSize: '16px',
            color: '#000000',
            lineHeight: 1.6,
            textAlign: 'center',
            display: 'block'
          }}>
            You have unsaved changes that will be lost if you leave this page
          </Typography>
          {/* </Box> */}
        </DialogContent>
        <DialogActions sx={{
          pt: 0,
          backgroundColor: '#EEE3EA',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          // gap: 2
        }}>
          <Button
            onClick={() => {
              setHasUnsavedChanges(false);
              setUnsavedChangesDialog(false);
              // Navigate to home page with section1 anchor
              router.push('/#section1').then(() => {
                // Clean up the hash from URL after navigation
                setTimeout(() => {
                  window.history.replaceState(null, '', '/');
                }, 100);
              });
            }}
            variant="contained"
            sx={{
              borderRadius: '10px !important',
              backgroundColor: '#C1649F',
              color: '#ffffff',
              px: 4,
              py: .5,
              fontSize: '14px',
              fontWeight: 400,
              '&:hover': {
                backgroundColor: '#C1649F',
                boxShadow: '0 4px 12px rgba(230, 151, 177, 0.3)'
              }
            }}
          >
            Back
          </Button>
          <Button
            onClick={async () => {
              setUnsavedChangesDialog(false);

              // If not authenticated, show login popup first
              if (!auth?.isAuthenticated) {
                setShouldNavigateAfterSave(true);
                await openLogin();
              } else {
                // If authenticated, trigger save and navigate
                setShouldNavigateAfterSave(true);
                triggerUnitySave();
              }
            }}
            variant="contained"
            sx={{
              borderRadius: '10px !important',
              backgroundColor: '#C1649F',
              color: '#ffffff',
              px: 4,
              py: .5,
              fontSize: '14px',
              fontWeight: 400,
              '&:hover': {
                backgroundColor: '#C1649F',
                boxShadow: '0 4px 12px rgba(230, 151, 177, 0.3)'
              }
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

    </>
  );
};
export default Editor;


