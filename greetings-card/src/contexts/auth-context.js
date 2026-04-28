import { createContext, useContext, useEffect, useReducer, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { useRouter } from 'next/router';
import { useLoginModal } from '../contexts/loginContext';
import { useVerifyModal } from './verifyContext';
import { useSession } from 'next-auth/react';
import { signOut } from 'next-auth/react';
import { useSavedModal } from './save-context';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const HANDLERS = {
  INITIALIZE: 'INITIALIZE',
  SIGN_IN: 'SIGN_IN',
  SIGN_OUT: 'SIGN_OUT'
};

const initialState = {
  isAuthenticated: false,
  isLoading: true,
  user: null
};

const handlers = {
  [HANDLERS.INITIALIZE]: (state, action) => {
    const user = action.payload;

    return {
      ...state,
      ...(
        user
          ? ({
            isAuthenticated: true,
            isLoading: false,
            user
          })
          : ({
            isLoading: false
          })
      )
    };
  },
  [HANDLERS.SIGN_IN]: (state, action) => {
    const user = action.payload;

    return {
      ...state,
      isAuthenticated: true,
      user
    };
  },
  [HANDLERS.SIGN_OUT]: (state) => {
    return {
      ...state,
      isAuthenticated: false,
      user: null
    };
  }
};

const reducer = (state, action) => (
  handlers[action.type] ? handlers[action.type](state, action) : state
);

export const AuthContext = createContext({ undefined });

export const AuthProvider = (props) => {
  const { isSave } = useSavedModal();
  const [loginUserData, setLoginUserData] = useState(null);
  const [signUpUserData, setSignUpUserData] = useState(null);
  const [googleSignInDone, setGoogleSignInDone] = useState(false);
  const { data: session, status } = useSession();
  const { closeLogin: handleClose, setOpen } = useLoginModal();
  const { openVerify, setVerifyOpen } = useVerifyModal();
  const router = useRouter();
  const { children } = props;
  const [state, dispatch] = useReducer(reducer, initialState);
  const initialized = useRef(false);

  const initialize = async (force = false) => {

    // Prevent from calling twice in development mode with React.StrictMode enabled
    if (initialized.current && !force) return;
    // if (initialized.current) {
    //   return;
    // }

    initialized.current = true;
    console.log("hello going to call initializse");
    try {
      const token = window.localStorage.getItem('token');

      console.log("token in auth", token);
      if (token) {
        const response = await axios.get(API_BASE_URL + '/api/user/auth',
          {
            headers: {
              'Content-Type': 'application/json',
              'x-access-token': token
            }
          }
        );

        console.log("response of calling auth",response);
        // window.location.reload();
        // delete response.data.data.token;
        dispatch({
          type: HANDLERS.INITIALIZE,
          payload: response.data.data
        });
      } else {
        dispatch({
          type: HANDLERS.INITIALIZE
        });
      }
    } catch (err) {
      dispatch({
        type: HANDLERS.INITIALIZE
      });
      console.log(err.response.data.msg);
    }

  };


  useEffect(
    () => {
      initialize();
    },
    [status === 'authenticated']
  );
  // useEff
  // if (status === 'authenticated') {
  //   fetchUser();
  // }

  // const signIn = async ({ email, password }) => {
  //
  //   try {
  //     const response = await axios.post(API_BASE_URL + '/api/user/login',
  //       {
  //         email,
  //         password
  //       },
  //       {
  //         headers: {
  //           'Content-Type': 'application/json'
  //         }
  //       }
  //     );
  //
  //     localStorage.setItem('token', response.data.data.token);
  //
  //     dispatch({
  //       type: HANDLERS.SIGN_IN,
  //       payload: response.data.data
  //     });
  //   } catch (error) {
  //     console.log('error in sign in', error);
  //     throw new Error(error.response.data.msg);
  //   }
  // };

  const SignIn = async ({ email, method, password }) => {
    // const storedEmail = window.localStorage.getItem('email');
    // const loginEmail = email || storedEmail;
    //
    // if (!loginEmail) {
    //   throw new Error('No email provided');
    // }
    try {
      const response = await axios.post(API_BASE_URL + `/api/user/login`,
        {
          email,
          password
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      localStorage.setItem('token', response.data.data.token);
      // if (isSave) {
      //   window.location.reload();
      // }
      // await router.push('/');

      // window.location.reload();
      // router.push('/');

      // const continueUrl = router.query.continueUrl || '/';
      // router.replace(continueUrl);

      // const uniqueId = response.data.data;
      // // check for email login with input than redirect otherwise not
      // if (method === 'email') {
      //   openVerify(uniqueId); // ✅ open modal with token
      // }

      dispatch({
        type: HANDLERS.SIGN_IN,
        payload: response.data.data
      });
    } catch (error) {
      console.log(error);
      throw new Error(error.response.data.msg);
    }
  };

  const SignInWithGoogle = async ({ name, email }) => {

    try {
      const response = await axios.post(`${API_BASE_URL}/api/user/google-signin`, {
      name, email
      });
      setLoginUserData(response.data.data);
      localStorage.setItem('token', response.data.data.token);
;
      dispatch({
        type: HANDLERS.SIGN_IN,
        payload: response.data.data
      });
    } catch (error) {
      console.log(error);
      throw new Error(error.response.data.msg);
    }
  };

  const signUp = async ({
    firstName,
    lastName,
    email,
    password,
    confirmPassword
  }) => {

    try {

      const response = await axios.post(API_BASE_URL + '/api/user/register',
        {
          firstName,
          lastName,
          email,
          password, confirmPassword
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

    } catch (error) {
      throw new Error(error.response.data.msg);
    }

  };

  const SignOut = () => {
    localStorage.removeItem('token');
    router.push('/');
    setOpen(false);
    setVerifyOpen(false);
    signOut({ callbackUrl: '/' });
    setLoginUserData(null);
    setSignUpUserData(null);
    setGoogleSignInDone(false);
    dispatch({
      type: HANDLERS.SIGN_OUT
    });

  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        SignIn,
        signUp,
        SignOut,
        loginUserData,
        setLoginUserData,
        googleSignInDone,
        initialize,
        setGoogleSignInDone,
        signUpUserData,
        setSignUpUserData,
        SignInWithGoogle
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node
};

export const AuthConsumer = AuthContext.Consumer;

export const useAuthContext = () => useContext(AuthContext);
