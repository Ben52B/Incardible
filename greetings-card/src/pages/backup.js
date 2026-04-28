import Head from 'next/head';
import {
  Card,
  CardContent,
  Container,
  Typography, Tab, IconButton, Menu, CircularProgress,
  Grid, Box, useMediaQuery, useTheme, Button, MenuItem, Select
} from '@mui/material';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import * as React from 'react';
import { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import LandingNav from '../layouts/landing-nav/landingLayout';
import { useRouter } from 'next/router';
import { useLoginModal } from '../contexts/loginContext';
import { useSavedModal } from '../contexts/save-context';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL;
import NextLink from 'next/link';
import QRCodeGenerator from '../components/qrCode';
import { useAuth } from '../hooks/use-auth';

const Editor = () => {
  const auth = useAuth();
  const { openLogin } = useLoginModal();
  const { isSave,  setIsSave } = useSavedModal();
  const [isUnityReady, setIsUnityReady] = useState(false);
  const theme = useTheme();
  const router = useRouter();
  const { id: userCardId, selected: cardId } = router.query;
  const gameIframe = useRef(null);
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const hasCalledRef = useRef(false);
  const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL;
  const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME;
  const gameLoadCalled = useRef(false);

  const [data, setData] = useState(null);
  const [showQr, setShowQr] = useState(false);
  const [cardData, setCardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);
  const [video, setVideo] = useState(null);
  const [userTemplateData, setUserTemplateData] = useState(null);
  const [content, setContent] = useState(`${WEB_URL}/upload-ar-content/${userTemplateData?.userId}`);

  useEffect(() => {
    if (!userTemplateData) {
      return;
    }
    setContent(`${WEB_URL}/upload-ar-content/${userTemplateData?.userId}`);
  }, [userTemplateData]);

  const getFrontCardDetail = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/api/cards/get/data/game/${cardId}`);
      console.log('res to get card', res);
      setData(res.data.data);
      localStorage.setItem('cardId', res?.data?.data?.uuid);
      const userId = localStorage.getItem(`userId-${cardId}`);


      await createTemplateData();

      // if (!userId) {
      //   await createTemplateData();
      //   // userId = localStorage.getItem(`userId-${cardId}`); // get the updated value
      // }
      // await getUserTemplateDesignData();
      setLoading(false);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (!cardId) {
      return;
    }
    getFrontCardDetail();
  }, [cardId]);

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

  const getUserTemplateDesignData = async () => {
    const email = getUserEmail();
    const userId = localStorage.getItem(`userId-${cardId}`);
    const isAuth = auth?.isAuthenticated;
    ;
    try {
      const res = await axios.post(`${BASE_URL}/api/cards/get/auth`, {
        userId, email, isAuthenticated: isAuth
      });
      setUserTemplateData(res?.data?.data);
    } catch (error) {
      console.log('error in get user design template data =======>', error);

    }

    // if (auth?.isAuthenticated) {
    //   const email = getUserEmail();
    //   console.log('email', email);
    //   try {
    //     const userId = localStorage.getItem(`userId-${cardId}`);
    //     console.log('userId***********', userId);
    //     const res = await axios.post(`${BASE_URL}/api/cards/get/auth`, {
    //       email, userId
    //     });
    //     setUserTemplateData(res?.data?.data);
    //   } catch (error) {
    //     console.log('error in get user design template data =======>', error);
    //
    //   }
    // } else {
    //   const userId = localStorage.getItem(`userId-${cardId}`);
    //   try {
    //     const res = await axios.get(`${BASE_URL}/api/cards/get/user/${userId}`);
    //     setUserTemplateData(res?.data?.data);
    //   } catch (error) {
    //     console.log('error in get user design template data =======>', error);
    //
    //   }
    // }

  };

  console.log('userTemplateData', userTemplateData);

  const createTemplateData = async () => {
    const email = getUserEmail();
    const isAuth = auth?.isAuthenticated;
    try {
      const res = await axios.post(`${BASE_URL}/api/cards/upload-card-id`, {
        uuid: cardId, userCardId, email, isAuthenticated: isAuth
      });
      setCardData(res.data.data);
      // setUserTemplateData(res?.data?.data);
      localStorage.setItem(`userId-${cardId}`, res?.data?.data?.userId);

    } catch (error) {
      console.log(error);
    }

  };

  // if (auth?.isAuthenticated) {
  //   try {
  //     const email = getUserEmail();
  //     const res = await axios.post(`${BASE_URL}/api/cards/update-card-id`, {
  //       uuid: cardId, email
  //     });
  //     setCardData(res.data.data);
  //     localStorage.setItem(`userId-${cardId}`, res?.data?.data?.userId);
  //
  //   } catch (error) {
  //     console.log(error);
  //   }
  // } else {
  //   try {
  //     const res = await axios.post(`${BASE_URL}/api/cards/upload-card-id`, {
  //       uuid: cardId
  //     });
  //     setCardData(res.data.data);
  //     localStorage.setItem(`userId-${cardId}`, res?.data?.data?.userId);
  //
  //   } catch (error) {
  //     console.log(error);
  //   }
  // }

  // };


  useEffect(() => {
    window.UnityLoaded = async () => {
      console.log('Unity is loaded and ready from web');
      await getUserTemplateDesignData();
      setIsUnityReady(true);
        if (data && userTemplateData) {
          gameOnLoad();
        }

    };
  }, [data && userTemplateData]);



  // useEffect(() => {
  //   if (isUnityReady && data && userTemplateData) {
  //     // gameLoadCalled.current = true;
  //     gameOnLoad();
  //   }
  // }, [ isUnityReady, userTemplateData, data]);

  const saveUserArExperienceData = async () => {
    console.log('auth.isAuthenticated is calling-----------------', auth.isAuthenticated);
    const userId = localStorage.getItem(`userId-${cardId}`);
    const email = getUserEmail();
    console.log('email in save data', email);
    try {
      const response = await axios.post(
        `${BASE_URL}/api/cards/upload-template-data`,
        {
          userId: userId,
          email
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      localStorage.removeItem('pendingImageUpload');
      console.log('response of save data=========================================>', response);
    } catch (error) {
      console.log('user in save user ar data after login', error);
    }

  };

  console.log('✅ isAuthenticated?', auth?.isAuthenticated);
  const gameOnLoad = () => {
    const instance = gameIframe.current?.contentWindow?.gameInstance;

    console.log('instance----', instance);
    console.log('data---', data);

    if (instance && data) {

      console.log('✅ Unity gameInstance loaded:', instance);
      console.log('✅userTemplateData', userTemplateData);

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
      //sending qr link here
      instance.SendMessage(
        'JsonDataHandlerAndParser',
        'QrLink',
        JSON.stringify(content)
      );

      // gameIframe.current.contentWindow.unityLoadSignal = async (status) => {
      //   console.log('msg recieveing from unity is---------------------- ', status);
      //   setShowQr(true);
      //
      // };

      gameIframe.current.contentWindow.saveImage = async (array = [], int, index) => {
        console.log('🖼️ Received array:', array);
        console.log('index', index);

        if (auth?.isAuthenticated) {
          const userId = localStorage.getItem(`userId-${cardId}`);
          console.log('userId----------------------', userId);
          setIsUnityReady(false);
          try {
            // Convert the input array to Uint8Array
            const uint8Array = new Uint8Array(array);

            // Convert Uint8Array to a Blob (binary data)
            const blob = new Blob([uint8Array], { type: 'image/png' }); // adjust MIME type if needed

            // Create FormData to send the image as a file
            const formData = new FormData();
            formData.append('userId', userId);
            formData.append('index', index);
            formData.append('image', blob, 'image.png'); // 'image.png' is filename

            // Send POST request with multipart/form-data
            const response = await axios.post(
              `${BASE_URL}/api/cards/update-image`,
              formData,
              {
                headers: {
                  'Content-Type': 'multipart/form-data'
                }
              }
            );
            const imagePath = response?.data?.data?.url;

            setImage(imagePath);
            setUserTemplateData(response?.data?.data?.card);
            console.log('imagePath----updated----', imagePath);
            instance.SendMessage(
              'JsonDataHandlerAndParser',
              'LoadImage',
              JSON.stringify(imagePath)
            );
            console.log('✅ Image uploaded successfully:', response);
          } catch (error) {
            console.error('❌ Error uploading image:', error);
          }

        } else {
          const userId = localStorage.getItem(`userId-${cardId}`);
          console.log('userId----------------------in else', userId);
          setIsUnityReady(false);
          try {
            // Convert the input array to Uint8Array
            const uint8Array = new Uint8Array(array);

            // Convert Uint8Array to a Blob (binary data)
            const blob = new Blob([uint8Array], { type: 'image/png' }); // adjust MIME type if needed

            // Create FormData to send the image as a file
            const formData = new FormData();
            formData.append('userId', userId);
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
            instance.SendMessage(
              'JsonDataHandlerAndParser',
              'LoadImage',
              JSON.stringify(imagePath)
            );
            console.log('✅ Image uploaded successfully:', response);
          } catch (error) {
            console.error('❌ Error uploading image:', error);
          }
        }

      };

      gameIframe.current.contentWindow.UploadVideo = async (gameObjectName, methodName, url) => {
        console.log('gameObjectName', gameObjectName);
        console.log('url', url);
        console.log('methodName', methodName);

        if (auth?.isAuthenticated) {
          setIsUnityReady(false);
          const userId = localStorage.getItem(`userId-${cardId}`);
          console.log('userId----- ', userId);
          try {
            const blobResponse = await fetch(url);
            const blob = await blobResponse.blob();

            // 2. Convert blob to a File object (you can give a meaningful filename)
            const file = new File([blob], 'recorded-video.mp4', {
              type: blob.type || 'video/mp4'
            });

            const formData = new FormData();
            formData.append('userId', userId);
            formData.append('video', file);

            // Send POST request with multipart/form-data
            const response = await axios.post(
              `${BASE_URL}/api/cards/update-template-video`,
              formData,
              {
                headers: {
                  'Content-Type': 'multipart/form-data'
                }
              }
            );
            const videoPath = response?.data?.data?.url;
            setVideo(videoPath);

            instance.SendMessage(
              'JsonDataHandlerAndParser',
              'LoadVideo',
              JSON.stringify(videoPath)
            );

            console.log('videoPath save into db', videoPath);

            setUserTemplateData(response?.data?.data?.card);
            // console.log('✅ Image uploaded successfully:', response);
          } catch (error) {
            console.error('❌ Error uploading video:', error);
          }
        } else {

          setIsUnityReady(false);
          const userId = localStorage.getItem(`userId-${cardId}`);
          console.log('userId----- in else', userId);
          try {
            const blobResponse = await fetch(url);
            const blob = await blobResponse.blob();

            // 2. Convert blob to a File object (you can give a meaningful filename)
            const file = new File([blob], 'recorded-video.mp4', {
              type: blob.type || 'video/mp4'
            });

            const formData = new FormData();
            formData.append('userId', userId);
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
            const videoPath = response?.data?.data?.url;
            setVideo(videoPath);

            instance.SendMessage(
              'JsonDataHandlerAndParser',
              'LoadVideo',
              JSON.stringify(videoPath)
            );

            console.log('videoPath save into db', videoPath);

            setUserTemplateData(response?.data?.data?.card);
            // console.log('✅ Image uploaded successfully:', response);
          } catch (error) {
            console.error('❌ Error uploading video:', error);
          }
        }

      };

      //unity developer call this function to send data to me  not in instance this function is call in window
      gameIframe.current.contentWindow.saveData = async (json) => {

        console.log('----------recieving json:', json);
        const parsed = JSON.parse(json);
        console.log('----------recieving json after parse:', parsed);
        if (auth?.isAuthenticated) {
          try {
            await saveUserArExperienceData();

            const userId = localStorage.getItem(`userId-${cardId}`);
            // First parse the full object
            // const dataOnly = parsed?.data

            console.log('----------recieving json auth', parsed);

            const response = await axios.post(
              `${BASE_URL}/api/cards/update-ar-data`,
              {
                userId: userId,
                data: parsed
              },
              {
                headers: {
                  'Content-Type': 'application/json'
                }
              }
            );
            console.log('response of save data===> authenticated', response);
            setUserTemplateData(response?.data?.data);
            // if (parsed?.isCustomizationComplete) {
            //   openLogin();
            // }
          } catch (error) {
            console.log('error in save data', error);
          }

        } else {
          try {
            const userId = localStorage.getItem(`userId-${cardId}`);
            // const parsed = JSON.parse(json);
            // const dataOnly = parsed?.data
            // const saveData = localStorage.getItem(`savedData-${userId}`);
            // const parsed = JSON.parse(saveData); // First parse the full object
            // const dataOnly = JSON.parse(parsed.data); // Then parse the `data` string inside

            console.log('----------recieving json not auth:', parsed);

            const response = await axios.post(
              `${BASE_URL}/api/cards/upload-ar-data`,
              {
                userId: userId,
                data: parsed
              },
              {
                headers: {
                  'Content-Type': 'application/json'
                }
              }
            );
            console.log('response of save data===> not authenticated', response);
            setUserTemplateData(response?.data?.data);
            if (parsed?.isCustomizationComplete &&  !auth.isAuthenticated) {
              openLogin();
              // localStorage.setItem('pendingImageUpload', 'true');
              // setIsSave(true);
              // await saveUserArExperienceData();
            }
          } catch (error) {
            console.log('error in save data', error);
          }
        }
      };

    }
  };

  // useEffect(() => {
  //
  //   const isPending = localStorage.getItem('pendingImageUpload');
  //
  //   if (auth?.isAuthenticated && isPending === 'true') {
  //
  //     const saveUserArExperienceData = async () => {
  //       console.log('auth.isAuthenticated is calling-----------------', auth.isAuthenticated);
  //       const userId = localStorage.getItem(`userId-${cardId}`);
  //       const email = getUserEmail();
  //       console.log('email in save data', email);
  //       try {
  //         const response = await axios.post(
  //           `${BASE_URL}/api/cards/upload-template-data`,
  //           {
  //             userId: userId,
  //             email
  //           },
  //           {
  //             headers: {
  //               'Content-Type': 'application/json'
  //             }
  //           }
  //         );
  //         localStorage.removeItem('pendingImageUpload');
  //         console.log('response of save data=========================================>', response);
  //       } catch (error) {
  //         console.log('user in save user ar data after login', error);
  //       }
  //
  //     };
  //
  //   }
  //
  // },[auth?.isAuthenticated]);


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
        // overflowX:'hidden',
        // overflowY: 'hidden',
        // minHeight: '100vh !important',
        backgroundImage: {
          xs: `url(${WEB_URL}/portrate.png)`,
          md: `url(${WEB_URL}/bg1.png)`
        },
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'

      }}>
        <LandingNav/>
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

    </>
  );
};
export default Editor;