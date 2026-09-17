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
import GroupedPagination from './pagination';
import { v4 as uuidv4 } from 'uuid';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/use-auth';
import { Tooltip } from '@mui/material';

import AOS from 'aos';
import 'aos/dist/aos.css';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const Section2 = () => {
  const auth = useAuth();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const islargeUp = useMediaQuery(theme.breakpoints.up('xxl'));
  const isIpadScreen = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  const dropdownW = isSmallScreen ? 120 : (isIpadScreen ? 150 : (islargeUp ? 270 : 220));

  const [animKey, setAnimKey] = useState(0);
  const gridTopRef = useRef(null);



  const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL;
  const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME;

  const router = useRouter();

  const [openDropdown, setOpenDropdown] = useState(null); // track which tab's dropdown is open

  const [allCards, setAllCards] = useState([]);
  const [categories, setCategories] = useState([]);
  const [value, setValue] = useState('2');
  const [anchorEls, setAnchorEls] = useState({});
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  // const [cardFilter, setCardFilter]=useState('All');
  const [cardType, setCardType] = useState('All');
  const [cardPrice, setCardPrice] = useState('Low to High');
  const [cardSorted, setCardSorted] = useState('CreatedAt(Ascending)');
  const [loadingComplete, setLoadingComplete] = useState(true);

  // const displayedCards = cards.slice((currentPage - 1) * cardsPerPage, currentPage * cardsPerPage);

  const barRef = useRef(null);
  const btnRefs = useRef({});
  const [menuShift, setMenuShift] = useState({ id: '', px: 0 });
  const [mobilePos, setMobilePos] = useState({ id: '', top: 0 });
  const [mobileShift, setMobileShift] = useState({ id: '', px: 0 });

  const truncateCombined = (title, price, n = 15) => {
    const full = `${title} ${price} AUD`;
    return full.length > n ? full.slice(0, n) + '...' : full;
  };

  const truncateCombinedLarge = (title, n = 20) => {
    return title.length > n ? title.slice(0, n) + '...' : title;
  };


  // const truncateCombined = (title, price, n = 15) => {
  //   const full = `${title} ${price} AUD`;
  //   return full.length > n ? full.slice(0, n) + '...' : full;
  // };
  //
  // const truncateCombinedLarge = (title, price, n = 20) => {
  //   const full = `${title} ${price} AUD`;
  //   return full.length > n ? full.slice(0, n) + '...' : full;
  // };


  const handlePageChange = (event, value) => {
    setCurrentPage(value);
    setAnimKey(k => k + 1);

    // smooth scroll to the grid top
    if (gridTopRef.current) {
      gridTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleTabClick = (val) => {
    setValue(val);
  };

  // console.log('value', value);
  // console.log('openDropdown', openDropdown);

  // const handleDropdownClick = (event, val) => {
  //   setValue(val); // update active tab
  //   setOpenDropdown(prev => (prev === val ? null : val)); // toggle current dropdown
  // };

  // const handleDropdownClick = (event, val) => {
  //   setAnchorEls((prev) => ({ ...prev, [val]: event.currentTarget }));
  // };

  const handleClose = (val) => {
    setAnchorEls((prev) => ({ ...prev, [val]: null }));
  };
  const getAllFrontDesignCards = async () => {
    try {
      // const userId = auth?.user._id;
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/api/cards/get-all-front-design`);
      setCards(res.data.data);
      setLoading(false);
    } catch (error) {
      console.log(error);
    }
  };

  console.log("cARDS", cards)
  useEffect(() => {
    getAllFrontDesignCards();
  }, []);

  const [tabData, setTabData] = useState([
    { label: 'Category', value: '2', options: [] },
    { label: 'Price', value: '3', options: ['Low to High', 'High to Low'] },
    { label: 'Arranged by', value: '4', options: ['CreatedAt(Ascending)', 'CreatedAt(Descending)'] }
  ]);



//  new  helpers (top of component)
  const norm = (s) => String(s || '').trim().toLowerCase();
  const matchesCategory = (card, selected) => {
    if (selected === 'All') return true;
    const target = norm(selected);
    const types = Array.isArray(card.cardType) ? card.cardType : [card.cardType];
    return types.filter(Boolean).map(norm).some(t => t === target);
  };



  // const filteredAndSortedCards = useMemo(() => {
  //   let result = [...cards];
  //
  //   // Filter by card type
  //   if (cardType !== 'All') {
  //     result = result.filter(card =>
  //       Array.isArray(card.cardType) &&
  //       card.cardType.some(type => type.toLowerCase() === cardType.toLowerCase())
  //     );
  //   }
  //
  //   // Sort by price and sortedby
  //
  //   if (cardPrice === 'Low to High') {
  //     result.sort((a, b) => Number(a.price) - Number(b.price));
  //   } else if (cardPrice === 'High to Low') {
  //     result.sort((a, b) => Number(b.price) - Number(a.price));
  //   } else if (cardPrice === 'CreatedAt(Ascending)') {
  //     result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  //   } else if (cardPrice === 'CreatedAt(Descending)') {
  //     result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  //   }
  //
  //   return result;
  // }, [cards, cardType, cardPrice, cardSorted]);

  const filteredAndSortedCards = useMemo(() => {
    const byCategory = cards.filter((c) => matchesCategory(c, cardType));

    const cmpPrice = (a, b) => {
      const ap = Number(a.price) || 0, bp = Number(b.price) || 0;
      return cardPrice === 'Low to High' ? ap - bp : bp - ap;
    };

    const cmpDate = (a, b) => {
      const ad = new Date(a.createdAt).getTime() || 0;
      const bd = new Date(b.createdAt).getTime() || 0;
      return cardSorted === 'CreatedAt(Ascending)' ? ad - bd : bd - ad;
    };

    // primary: price, secondary: createdAt
    return [...byCategory].sort((a, b) => {
      const p = cmpPrice(a, b);
      return p !== 0 ? p : cmpDate(a, b);
    });
  }, [cards, cardType, cardPrice, cardSorted]);



  const [currentPage, setCurrentPage] = useState(1);
  const [group, setGroup] = useState(0);
  // const cardsPerPage = 2;
  const cardsPerPage = 20;
  const totalPages = Math.ceil(filteredAndSortedCards.length / cardsPerPage);


  //
  // const displayedCards = useMemo(() => {
  //   return filteredAndSortedCards.slice((currentPage - 1) * cardsPerPage,
  //     currentPage * cardsPerPage);
  // }, [filteredAndSortedCards, currentPage]);

  const displayedCards = useMemo(() => {
    const start = (currentPage - 1) * cardsPerPage;
    return filteredAndSortedCards.slice(start, start + cardsPerPage);
  }, [filteredAndSortedCards, currentPage]);

  // const handleCardType = (tabValue, option) => {
  //   setOpenDropdown(null); // close dropdown
  //   if (tabValue === '2') {
  //     setCardType(option);
  //   } else if (tabValue === '3') {
  //     setCardPrice(option);
  //   } else if (tabValue === '4') {
  //     setCardPrice(option);
  //   }
  // };
  const handleCardType = (tabValue, option) => {
    setOpenDropdown(null);
    if (tabValue === '2') {
      setCardType(option);      // Category
    } else if (tabValue === '3') {
      setCardPrice(option);     // Price
    } else if (tabValue === '4') {
      setCardSorted(option);    // Arranged by ✅
    }
  };


  useEffect(() => {
    AOS.init({
      duration: 550,
      easing: 'ease-out-quart',
      once: true,
      offset: 0
    });
  }, []);

  useEffect(() => {
    // whenever page or filters change, refresh AOS just in case
    AOS.refreshHard();
  }, [cardsPerPage, cardType, cardPrice, cardSorted]);

  // console.log('displayedCards', displayedCards);

  const getAllCategories = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/admin/category/get/all`);
      const data = response.data.data;
      const categoryOptions = ['All', ...data.map(category => category.name)];

      // Update the tabData state
      setTabData(prev =>
        prev.map(tab =>
          tab.label === 'Category'
            ? { ...tab, options: categoryOptions }
            : tab
        )
      );
      setLoadingComplete(false);

    } catch (error) {
      console.log('error in get all categories', error);
      // toast.error(error.response.data.msg);
    }
  };

  useEffect(() => {
    getAllCategories();
  }, []);

  const dropdownRef = useRef(null);

// Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const gotoEditor = (cardUUID) => {
    const uuid = uuidv4();
    router.push(`/studio/${uuid}?selected=${cardUUID}`);
  };



  //new
  useEffect(() => {
    setCurrentPage(1);
    setGroup(0);
  }, [cardType, cardPrice, cardSorted]);

  useEffect(() => {
    const max = Math.max(1, Math.ceil(filteredAndSortedCards.length / cardsPerPage));
    if (currentPage > max) setCurrentPage(1);
  }, [filteredAndSortedCards.length]);

  // const handleDropdownClick = (e, id) => {
  //   e.stopPropagation();
  //   setOpenDropdown(id);
  //
  //
  //   // known dropdown width from your styles
  //   const menuW = isSmallScreen ? 100 : isIpadScreen ? 170 : (islargeUp ? 270 : 220);
  //   // const menuW = dropdownW;
  //
  //   const btnEl = btnRefs.current[id];
  //   const barEl = barRef.current;
  //   if (!btnEl || !barEl) { setMenuShift({ id, px: 0 }); return; }
  //
  //   const b = btnEl.getBoundingClientRect();
  //   const r = barEl.getBoundingClientRect();
  //
  //   // dropdown centered on button
  //   const centeredLeft  = b.left + b.width / 2 - menuW / 2;
  //   const centeredRight = centeredLeft + menuW;
  //
  //   let px = 0;                       // +px => move right, -px => move left
  //   if (centeredLeft < r.left)  px = r.left - centeredLeft;            // nudge right
  //   else if (centeredRight > r.right) px = -(centeredRight - r.right); // nudge left
  //
  //   setMenuShift({ id, px });
  // };

  const handleDropdownClick = (e, id) => {
    e.stopPropagation();
    setOpenDropdown(id);

    // MOBILE: center on button, clamp inside the MENU BAR
    if (isSmallScreen) {
      const btnEl = btnRefs.current[id];
      const barEl = barRef.current;
      if (!btnEl || !barEl) { setMobileShift({ id, px: 0 }); return; }

      const b = btnEl.getBoundingClientRect();
      const r = barEl.getBoundingClientRect();

      const menuW = 170;                 // must match <ul> width on small
      const btnCenter = b.left + b.width / 2;

      // centered under the button
      let left = btnCenter - menuW / 2;

      // compute shift so dropdown stays within the bar: [r.left, r.right]
      let px = 0;
      if (left < r.left) {
        px += (r.left - left);                          // nudge right
        left = r.left;
      } else if (left + menuW > r.right) {
        px -= (left + menuW - r.right);                 // nudge left
      }

      setMobileShift({ id, px });                        // used by <ul> transform
      return;
    }

    // DESKTOP/TABLET (unchanged)
    const menuW = isIpadScreen ? 170 : (islargeUp ? 270 : 220);
    const btnEl = btnRefs.current[id];
    const barEl = barRef.current;
    if (!btnEl || !barEl) { setMenuShift({ id, px: 0 }); return; }

    const b = btnEl.getBoundingClientRect();
    const r = barEl.getBoundingClientRect();
    const centeredLeft  = b.left + b.width / 2 - menuW / 2;
    const centeredRight = centeredLeft + menuW;

    let px = 0;
    if (centeredLeft < r.left)        px = r.left - centeredLeft;
    else if (centeredRight > r.right) px = -(centeredRight - r.right);

    setMenuShift({ id, px });
  };



  return (
    <>
      <Head>
        <title>Homepage | {APP_NAME}</title>
      </Head>
      <Box sx={{
        width: '100%',
        // bgcolor:'red',
        height: { md: '100%', xs: '100%', lg: '100%', xl: '100%' },
        minHeight: '100vh'
      }}>
        <Box
          data-aos="zoom-in"
          data-aos-duration="600"
          data-aos-easing="ease-in"
          sx={{
            pl: { md: '20%', laptop: '20%', lg: '20%', xl: '20%', xs: '5%', ipad: '25%' },
            pr: { md: '20%', laptop: '20%', lg: '20%', xl: '20%', xs: '5%', ipad: '25%' },
            // bgcolor:"blue",
            pt: { md: 2, xs: 0 },
            pb: 5,
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            flexDirection: 'column', height: '100%'
          }}
        >
          <Box sx={{
            mb: { md: 3, xs: 3 },
            // px: { lg: 4, xs: 4 },
            // py: { md: 2, xs: 1 },
            borderRadius: '30px !important',
            // minWidth: { md: '250px', xs: '200px' },
            fontSize: { md: '40px', xs: '25px' },
            // backgroundColor: '#ffecc8',
            color: { xs: '#c165a0', md: '#1A1D25' },
            fontWeight: 'bolder',
            userSelect: 'none',   // ❌ prevent text selection
            caretColor: 'transparent', // ❌ hide cursor
            pointerEvents: 'auto',
            cursor: 'default'
            // backgroundColor: '#1a1d25 !important',
            // color: '#c09b9b',
            // boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
            // '&:hover': {
            //   backgroundColor: '#1a1d25 !important',
            //   color: '#c09b9b'
            // }
          }}>
            Design Your Card
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
                <TabContext value={value} sx={{ width: '100%', overflow: 'visible' }}>
                  <Box
                    ref={(el) => { dropdownRef.current = el; barRef.current = el; }}
                    // ref={dropdownRef}
                    sx={{
                      bgcolor: 'rgba(232, 207,222, 0.8 )',
                      // bgcolor: '#e8cfde',
                      p: { md: 1, xs: 1 },
                      borderRadius: '20px',
                      width: '100%',
                      maxWidth: { md: '550px', xs: '330px' , xxl:'700px'},
                      display: 'flex',
                      flexDirection: { md: 'row', xs: 'row' },
                      justifyContent: { md: 'space-around', xs: 'center' },
                      gap: 1
                    }}>


                    {tabData.map((tab) => (
                      <Box key={tab.value} sx={{ position: 'relative' }}>
                        <Box
                          component="button"
                          type="button"
                          ref={el => (btnRefs.current[tab.value] = el)}
                          // className="btn"  // (optional) or remove className entirely
                          onClick={(e) => { e.stopPropagation(); handleDropdownClick(e, tab.value); handleTabClick(tab.value); }}
                          sx={{
                            position:'relative',
                            display:'flex', alignItems:'center', justifyContent:'center', textAlign:'center',
                            minWidth:{ xs: 90, md: 120 , xl:150 }, px:2, py:{ md:1, xs:1 },
                            border:0, borderRadius:'12px !important', cursor:'pointer',
                            bgcolor: value===tab.value ? '#c165a0' : 'transparent',
                            color: value===tab.value ? 'white' : 'black',
                            '&:hover': { backgroundColor:'#c165a0', color:'white' }
                          }}
                        >
                          <Typography sx={{ width:'100%', textAlign:'center', fontWeight:900, fontSize:{ md:'18px', lg:'20px', xl:'22px', xs:'12px' }}}>
                            {tab.label === 'Category' ? `${cardType}` : tab.label}
                          </Typography>

                        {/*<Box*/}
                        {/*  type="button"*/}
                        {/*  // id={`dropDownBtn-${tab.value}`}*/}
                        {/*  className="btn dropdown-toggle"*/}
                        {/*  data-bs-toggle="dropdown"*/}
                        {/*  // onClick={() => handleTabClick(tab.value)}*/}
                        {/*  // aria-expanded="false"*/}
                        {/*  onClick={(e) => {*/}
                        {/*    e.stopPropagation(); // prevent switching tab*/}
                        {/*    handleDropdownClick(e, tab.value);*/}
                        {/*    handleTabClick(tab.value);*/}
                        {/*  }}*/}
                        {/*  sx={{*/}
                        {/*    display: 'flex',*/}
                        {/*    justifyContent: 'center',*/}
                        {/*    height: '100%',*/}
                        {/*    alignItems: 'center',*/}
                        {/*    gap: 0,*/}
                        {/*    border: 0,*/}
                        {/*    p: { xs: 1 },*/}
                        {/*    px: { md: 2 },*/}
                        {/*    py: { md: 1 },*/}
                        {/*    borderRadius: '12px !important',*/}
                        {/*    fontWeight: 900,*/}
                        {/*    cursor: 'pointer',*/}
                        {/*    bgcolor: value === tab.value ? '#c165a0' : 'transparent',*/}
                        {/*    color: value === tab.value ? 'white' : 'black',*/}
                        {/*    '&:hover': {*/}
                        {/*      backgroundColor: '#c165a0',*/}
                        {/*      color: 'white'*/}
                        {/*    }*/}

                        {/*  }}*/}
                        {/*>*/}
                        {/*  /!*<Typography sx={{*!/*/}
                        {/*  /!*  fontSize: { md: '18px', lg: '20px', xl: '22px', xs: '12px' },*!/*/}
                        {/*  /!*  fontWeight: 900*!/*/}
                        {/*  /!*}}>{tab.label}</Typography>*!/*/}
                        {/*  <Typography sx={{ fontSize: { md: '18px', lg: '20px', xl: '22px', xs: '12px' }, fontWeight: 900 }}>*/}
                        {/*    {tab.label === 'Category' ? `${cardType}` : tab.label}*/}
                        {/*  </Typography>*/}


                          {/*<IconButton*/}
                          {/*  size="small"*/}
                          {/*  sx={{ color: value === tab.value ? 'white' : 'black', p: 0 }}*/}
                          {/*>*/}
                          {/*  <ArrowDropDownIcon    />*/}
                          {/*</IconButton>*/}
                        </Box>
                        {openDropdown === tab.value && (
                          // <ul
                          //   className="menu"
                          //   style={{
                          //     position: 'absolute',
                          //     top: '100%',
                          //     left: '50%',
                          //     transform: `translateX(calc(-50% + ${menuShift.id === tab.value ? menuShift.px : 0}px))`,
                          //     // left: tab.value === '2' ? 'calc(50% + 18px)' : '50%',
                          //     // top: '100%',
                          //     // left: '50%', // start from center of button
                          //     // transform: 'translateX(-50%)',
                          //     // backgroundColor:'red',
                          //     backgroundColor: 'rgba(232, 207, 222, 0.3)',
                          //     width: isSmallScreen ? '170px'  : isIpadScreen ?  '170px'  :islargeUp ? '270px' : '220px',
                          //     maxHeight: tab.label === 'Category' ? '250px' : 'auto',
                          //     overflowY: tab.label === 'Category' ? 'auto' : 'visible',
                          //     padding: 0,
                          //     // borderRadius: '30px !important',
                          //     listStyle: 'none',
                          //     marginTop: 10,
                          //     // zIndex: 1000,
                          //     zIndex: 1500,
                          //     pointerEvents: 'auto'
                          //   }}
                          // >
                          <ul
                            className="menu"
                            style={
                              isSmallScreen && mobileShift.id === tab.value
                                ? {
                                  position: 'absolute',
                                  top: '100%',
                                  left: '50%',                                        // center on button
                                  transform: `translateX(calc(-50% + ${mobileShift.px}px))`, // clamp shift
                                  width: 170, minWidth: 170, maxWidth: 170,
                                  boxSizing: 'border-box', whiteSpace: 'nowrap',
                                  backgroundColor: 'rgba(232, 207, 222, 0.3)',
                                  maxHeight: tab.label === 'Category' ? '250px' : 'auto',
                                  overflowY: tab.label === 'Category' ? 'auto' : 'visible',
                                  padding: 0, listStyle: 'none', zIndex: 2000,   marginTop: 10
                                }
                                : {
                                  // DESKTOP/TABLET
                                  position: 'absolute',
                                  top: '100%',
                                  left: '50%',
                                  transform: `translateX(calc(-50% + ${
                                    menuShift.id === tab.value ? menuShift.px : 0
                                  }px))`,
                                  width: isIpadScreen ? 170 : (islargeUp ? 270 : 220),
                                  backgroundColor: 'rgba(232, 207, 222, 0.3)',
                                  maxHeight: tab.label === 'Category' ? '250px' : 'auto',
                                  overflowY: tab.label === 'Category' ? 'auto' : 'visible',
                                  padding: 0,
                                  listStyle: 'none',
                                  marginTop: 10,
                                  zIndex: 1500,
                                }
                            }
                          >

                        {tab.label === 'Category' && tab.options.length === 0 ? (
                              <li style={{ padding: '1rem', textAlign: 'center' }}>
                                <CircularProgress size={20}/>
                              </li>
                            ) : (
                              tab.options.map((option, i) => (
                                <li key={i}>
                                  <a
                                    className="dropdown-item"
                                    style={{
                                      backgroundColor: 'rgba(232, 207, 222, 0.8)',
                                      color: 'black',
                                      fontSize: isSmallScreen ? '15px' :  islargeUp ? '25px' :  '20px',
                                      cursor: 'pointer',
                                      display: 'block',
                                      padding: '8px 12px',
                                      textDecoration: 'none'
                                    }}
                                    onClick={() => handleCardType(tab.value, option)}
                                  >
                                    {option}
                                  </a>
                                </li>
                              ))
                            )}
                          </ul>
                        )}


                        {/*<ul*/}
                        {/*  className="dropdown-menu"*/}
                        {/*  // aria-labelledby={`dropDownBtn-${tab.value}`}*/}
                        {/*  // aria-labelledby={`dropdown-${tab.value}`}*/}
                        {/*  style={{*/}
                        {/*     backgroundColor: 'rgba(232, 207, 222, 0.3)',*/}
                        {/*    width: isSmallScreen ? '100px' :  '200px',*/}
                        {/*    maxHeight: tab.label === 'Category' ? '250px' : 'auto',*/}
                        {/*    overflowY: tab.label === 'Category' ? 'auto' : 'visible',*/}
                        {/*    // borderRadius: '8px',*/}
                        {/*    padding: 0,*/}
                        {/*    // border: 'none',*/}
                        {/*    // zIndex: 9999*/}
                        {/*  }}*/}
                        {/*>*/}
                        {/*  {tab.label === 'Category' && tab.options.length === 0 ? (*/}
                        {/*    <li style={{ padding: '1rem', textAlign: 'center' }}>*/}
                        {/*      <CircularProgress size={20}/>*/}
                        {/*    </li>*/}
                        {/*  ) : (*/}
                        {/*    tab.options.map((option, i) => (*/}
                        {/*      <li key={i}>*/}
                        {/*        <a*/}
                        {/*          className="dropdown-item"*/}
                        {/*          style={{*/}
                        {/*            backgroundColor: 'rgba(232, 207, 222, 0.8)',*/}
                        {/*            color: 'black',*/}
                        {/*            fontSize: '14px',*/}
                        {/*          }}*/}
                        {/*          onClick={() => handleCardType(tab.value, option)}*/}
                        {/*        >*/}
                        {/*          {option}*/}
                        {/*        </a>*/}
                        {/*      </li>*/}
                        {/*    ))*/}
                        {/*  )}*/}
                        {/*</ul>*/}


                      </Box>
                    ))}
                  </Box>

                  {/*<Grid container sx={{ mt: 5 }}>*/}
                  {/*  {loading ? (*/}
                  {/*    <Box sx={{ width: '100%', textAlign: 'center' }}>*/}
                  {/*      <CircularProgress/>*/}
                  {/*    </Box>*/}
                  {/*  ) : (*/}
                  {/*    <>*/}
                  {/*      {displayedCards.length === 0 ? (*/}
                  {/*        <Box sx={{ width: '100%', textAlign: 'center' , pointerEvents: 'none' }}>*/}
                  {/*          <Typography>No cards found.</Typography>*/}
                  {/*        </Box>*/}
                  {/*      ) : (*/}
                  {/*        displayedCards.map((data, index) => (*/}

                  {/*          <Grid md={4} lg={3} xs={6} key={index}       data-aos="fade-up"*/}
                  {/*                data-aos-delay={delay} sx={{*/}
                  {/*            p: 1, display: 'flex',*/}
                  {/*            justifyContent: 'center',*/}
                  {/*            alignItems: 'center'*/}

                  {/*          }}>*/}
                  {/*            <Box*/}
                  {/*              onClick={() => gotoEditor(data.uuid)}*/}
                  {/*              component="img"*/}
                  {/*              loading="lazy"*/}
                  {/*              src={`${BASE_URL}/${data?.frontDesign}`}*/}
                  {/*              alt={data?.title}*/}
                  {/*              sx={{*/}
                  {/*                width: '100%',*/}
                  {/*                // width: { xl: '100%', lg: '90%' },*/}
                  {/*                // display: 'block',*/}

                  {/*                aspectRatio: '1 / 1.414',*/}
                  {/*                cursor: 'pointer'*/}
                  {/*              }}*/}
                  {/*            />*/}
                  {/*          </Grid>*/}
                  {/*        ))*/}
                  {/*      )}*/}
                  {/*    </>*/}
                  {/*  )}*/}
                  {/*</Grid>*/}
                  <Grid container key={animKey} sx={{ mt: 5  , height:'100%'}}>
                    {loading ? (
                      <Box sx={{ width:'100%', minHeight:'inherit', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <CircularProgress/>
                      </Box>
                    ) : (
                      <>
                        {displayedCards.length === 0 ? (
                          <Box sx={{  width:'100%', minHeight:'inherit', display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none'}}>
                            <Typography>No cards found.</Typography>
                          </Box>
                        ) : (
                          displayedCards.map((data, index) => {
                            const delay = (index % 12) * 40;  // stagger 0,40,80... for first 12 items
                            return (
                              <Grid
                                md={4}
                                lg={3}
                                xs={6}
                                key={data.uuid || index}
                                sx={{ p: 1, display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}
                                data-aos="zoom-in"
                                data-aos-delay={delay}
                              >
                                {(data?.insideLeftDesign || data?.insideRightDesign) ? (
                                  <Tooltip
                                    title={
                                      <Box sx={{
                                        display: 'flex',
                                        gap: 1,
                                        p: 1,
                                        flexDirection: { xs: 'column', md: 'row' }
                                      }}>
                                        {data?.insideLeftDesign && (
                                          <Box
                                            component="img"
                                            src={`${BASE_URL}/${data.insideLeftDesign.replace(/\\/g, '/')}`}
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
                                        {data?.insideRightDesign && (
                                          <Box
                                            component="img"
                                            src={`${BASE_URL}/${data.insideRightDesign.replace(/\\/g, '/')}`}
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
                                              const tooltipHeight = popper.height || 0;
                                              const tooltipWidth = popper.width || 0;
                                              
                                              // Calculate card height if not available
                                              const calculatedCardHeight = cardHeight || (cardWidth * 1.414) || 
                                                (isSmallScreen ? 200 : (isIpadScreen ? 250 : (islargeUp ? 400 : 350)));
                                              
                                              // Title area at bottom (~60px)
                                              const titleAreaHeight = 60;
                                              
                                              // Center tooltip on card: move up by half card height, then adjust for title
                                              // This positions tooltip in center area of card, above title
                                              const offsetX = 0; // Horizontally centered by default with 'top' placement
                                              const offsetY = -(calculatedCardHeight / 2) + (titleAreaHeight / 2);
                                              
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
                                      onClick={() => gotoEditor(data.uuid)}
                                      sx={{
                                        position: 'relative',
                                        width: '100%',
                                        aspectRatio: '1 / 1.414',
                                        borderRadius: 2,
                                        overflow: 'visible',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      <Box
                                        component="img"
                                        loading="lazy"
                                        src={`${BASE_URL}/${data?.frontDesign}`}
                                        alt={data?.title}
                                        sx={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }}
                                      />
                                      <Box
                                        sx={{
                                          position: 'absolute',
                                          left: 0,
                                          right: 0,
                                          bottom: 0,
                                          px: 2,
                                          py: 1,
                                          color: 'black',
                                          bgcolor: 'rgba(232, 207, 222, 0.8)',
                                          backdropFilter: 'blur(6px)',
                                          zIndex: 2,
                                        }}
                                      >
                                        {isSmallScreen ? (
                                          (data.title.length + `${data.price} AUD`.length > 15) ? (
                                            <Tooltip
                                              title={`${data.title} ${data.price} AUD`}
                                              arrow
                                              enterTouchDelay={0}
                                              leaveTouchDelay={2500}
                                            >
                                              <Typography
                                                variant="subtitle2"
                                                sx={{
                                                  fontWeight: 800,
                                                  whiteSpace: 'nowrap',
                                                  overflow: 'hidden',
                                                  textOverflow: 'ellipsis',
                                                }}
                                              >
                                                {truncateCombined(data.title, data.price, 15)}
                                              </Typography>
                                            </Tooltip>
                                          ) : (
                                            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                                              {`${data.title} ${data.price} AUD`}
                                            </Typography>
                                          )
                                        ) : (
                                          <Box
                                            sx={{
                                              display: 'flex',
                                              justifyContent: 'space-between',
                                              alignItems: 'center',
                                              width: '100%',
                                            }}
                                          >
                                            {data.title.length > 20 ? (
                                              <Tooltip title={data.title} arrow>
                                                <Typography
                                                  variant="subtitle1"
                                                  sx={{
                                                    fontWeight: 800,
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    maxWidth: '70%',
                                                  }}
                                                >
                                                  {truncateCombinedLarge(data.title, 20)}
                                                </Typography>
                                              </Tooltip>
                                            ) : (
                                              <Typography variant="subtitle1" sx={{ fontWeight: 800, maxWidth: '70%' }}>
                                                {data.title}
                                              </Typography>
                                            )}
                                            <Typography variant="subtitle1" sx={{ fontWeight: 800, flexShrink: 0 }}>
                                              {`${data.price}.00 $`}
                                            </Typography>
                                          </Box>
                                        )}
                                      </Box>
                                    </Box>
                                  </Tooltip>
                                ) : (
                                  <Box
                                    onClick={() => gotoEditor(data.uuid)}
                                    sx={{
                                      position: 'relative',
                                      width: '100%',
                                      aspectRatio: '1 / 1.414',
                                      borderRadius: 2,
                                      overflow: 'hidden',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    <Box
                                      component="img"
                                      loading="lazy"
                                      src={`${BASE_URL}/${data?.frontDesign}`}
                                      alt={data?.title}
                                      sx={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }}
                                    />
                                    <Box
                                      sx={{
                                        position: 'absolute',
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        px: 2,
                                        py: 1,
                                        color: 'black',
                                        bgcolor: 'rgba(232, 207, 222, 0.8)',
                                        backdropFilter: 'blur(6px)',
                                        zIndex: 2,
                                      }}
                                    >
                                      {isSmallScreen ? (
                                        (data.title.length + `${data.price} AUD`.length > 15) ? (
                                          <Tooltip
                                            title={`${data.title} ${data.price} AUD`}
                                            arrow
                                            enterTouchDelay={0}
                                            leaveTouchDelay={2500}
                                          >
                                            <Typography
                                              variant="subtitle2"
                                              sx={{
                                                fontWeight: 800,
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                              }}
                                            >
                                              {truncateCombined(data.title, data.price, 15)}
                                            </Typography>
                                          </Tooltip>
                                        ) : (
                                          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                                            {`${data.title} ${data.price} AUD`}
                                          </Typography>
                                        )
                                      ) : (
                                        <Box
                                          sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            width: '100%',
                                          }}
                                        >
                                          {data.title.length > 20 ? (
                                            <Tooltip title={data.title} arrow>
                                              <Typography
                                                variant="subtitle1"
                                                sx={{
                                                  fontWeight: 800,
                                                  whiteSpace: 'nowrap',
                                                  overflow: 'hidden',
                                                  textOverflow: 'ellipsis',
                                                  maxWidth: '70%',
                                                }}
                                              >
                                                {truncateCombinedLarge(data.title, 20)}
                                              </Typography>
                                            </Tooltip>
                                          ) : (
                                            <Typography variant="subtitle1" sx={{ fontWeight: 800, maxWidth: '70%' }}>
                                              {data.title}
                                            </Typography>
                                          )}
                                          <Typography variant="subtitle1" sx={{ fontWeight: 800, flexShrink: 0 }}>
                                            {`${data.price}.00 $`}
                                          </Typography>
                                        </Box>
                                      )}
                                    </Box>
                                  </Box>
                                )}
                                  {/*<Box*/}
                                  {/*  sx={{*/}
                                  {/*    position: 'absolute',*/}
                                  {/*    left: 0,*/}
                                  {/*    right: 0,*/}
                                  {/*    bottom: 0,*/}
                                  {/*    px: 2,*/}
                                  {/*    py: 1.2,*/}
                                  {/*    color: 'black',*/}
                                  {/*    bgcolor: 'rgba(232, 207, 222, 0.8)',*/}
                                  {/*    backdropFilter: 'blur(6px)',*/}
                                  {/*  }}*/}
                                  {/*>*/}
                                  {/*  <Box*/}
                                  {/*    sx={{*/}
                                  {/*      display: 'flex',*/}
                                  {/*      justifyContent: 'space-between', // ✅ title left, price right*/}
                                  {/*      alignItems: 'center',*/}
                                  {/*      width: '100%',*/}
                                  {/*    }}*/}
                                  {/*  >*/}
                                  {/*    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>*/}
                                  {/*      {data.title}*/}
                                  {/*    </Typography>*/}
                                  {/*    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>*/}
                                  {/*      {`${data.price} AUD`}*/}
                                  {/*    </Typography>*/}
                                  {/*  </Box>*/}
                                  {/*</Box>*/}

                                  {/*<Box*/}
                                  {/*  sx={{*/}
                                  {/*    position: 'absolute',*/}
                                  {/*    left: 0,*/}
                                  {/*    right: 0,*/}
                                  {/*    bottom: 0,*/}
                                  {/*    px: 2,*/}
                                  {/*    py: 1,*/}
                                  {/*    color: 'black',*/}
                                  {/*    bgcolor: 'rgba(232, 207, 222, 0.8)', // semi transparent bg*/}
                                  {/*    backdropFilter: 'blur(6px)',*/}
                                  {/*    zIndex: 2,        // ✅ overlay always above image*/}
                                  {/*  }}*/}
                                  {/*>*/}
                                  {/*  <Box*/}
                                  {/*    sx={{*/}
                                  {/*      display: 'flex',*/}
                                  {/*      justifyContent: 'space-between',*/}
                                  {/*      alignItems: 'center',*/}
                                  {/*      width: '100%',*/}
                                  {/*    }}*/}
                                  {/*  >*/}
                                  {/*    /!* Title (with truncate + tooltip logic) *!/*/}
                                  {/*    {isSmallScreen ? (*/}
                                  {/*      <Tooltip title={`${data.title} — ${data.price} AUD`} arrow>*/}
                                  {/*        <Typography*/}
                                  {/*          variant="subtitle2"*/}
                                  {/*          sx={{*/}
                                  {/*            fontWeight: 800,*/}
                                  {/*            whiteSpace: 'nowrap',*/}
                                  {/*            overflow: 'hidden',*/}
                                  {/*            textOverflow: 'ellipsis',*/}
                                  {/*            maxWidth: '75%',*/}
                                  {/*          }}*/}
                                  {/*        >*/}
                                  {/*          {truncate(data.title, 15)}*/}
                                  {/*        </Typography>*/}
                                  {/*      </Tooltip>*/}
                                  {/*    ) : (*/}
                                  {/*      <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>*/}
                                  {/*        {data.title}*/}
                                  {/*      </Typography>*/}
                                  {/*    )}*/}

                                  {/*    /!* Price *!/*/}
                                  {/*    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>*/}
                                  {/*      {`${data.price} AUD`}*/}
                                  {/*    </Typography>*/}
                                  {/*  </Box>*/}
                                  {/*</Box>*/}
                                  {/*  sx={{*/}
                                  {/*    position: 'absolute',*/}
                                  {/*    left: 0,*/}
                                  {/*    right: 0,*/}
                                  {/*    bottom: 0,*/}
                                  {/*    px: 2,*/}
                                  {/*    py: 1,*/}
                                  {/*    color: 'black',*/}
                                  {/*    bgcolor: 'rgba(232, 207, 222, 0.8)',*/}
                                  {/*    backdropFilter: 'blur(6px)',*/}
                                  {/*    zIndex: 2,*/}
                                  {/*  }}*/}
                                  {/*>*/}
                                  {/*  {isSmallScreen ? (*/}
                                  {/*    // ✅ Mobile: Title + Price combined (truncate 15 chars)*/}
                                  {/*    <Tooltip*/}
                                  {/*      title={`${data.title} ${data.price} AUD`}*/}
                                  {/*      arrow*/}
                                  {/*      enterTouchDelay={0}*/}
                                  {/*      leaveTouchDelay={2500}*/}
                                  {/*    >*/}
                                  {/*      <Typography*/}
                                  {/*        variant="subtitle2"*/}
                                  {/*        sx={{*/}
                                  {/*          fontWeight: 800,*/}
                                  {/*          whiteSpace: 'nowrap',*/}
                                  {/*          overflow: 'hidden',*/}
                                  {/*          textOverflow: 'ellipsis',*/}
                                  {/*        }}*/}
                                  {/*      >*/}
                                  {/*        {truncateCombined(data.title, data.price, 15)}*/}
                                  {/*      </Typography>*/}
                                  {/*    </Tooltip>*/}
                                  {/*  ) : (*/}
                                  {/*    // ✅ Large Screen: Title left, Price right*/}
                                  {/*    <Box*/}
                                  {/*      sx={{*/}
                                  {/*        display: 'flex',*/}
                                  {/*        justifyContent: 'space-between',*/}
                                  {/*        alignItems: 'center',*/}
                                  {/*        width: '100%',*/}
                                  {/*      }}*/}
                                  {/*    >*/}
                                  {/*      /!* Title with truncate+tooltip *!/*/}
                                  {/*      <Tooltip title={data.title} arrow>*/}
                                  {/*        <Typography*/}
                                  {/*          variant="subtitle1"*/}
                                  {/*          sx={{*/}
                                  {/*            fontWeight: 800,*/}
                                  {/*            whiteSpace: 'nowrap',*/}
                                  {/*            overflow: 'hidden',*/}
                                  {/*            textOverflow: 'ellipsis',*/}
                                  {/*            maxWidth: '70%', // so price doesn't push it*/}
                                  {/*          }}*/}
                                  {/*        >*/}
                                  {/*          {truncateCombinedLarge(data.title, "", 20)}*/}
                                  {/*        </Typography>*/}
                                  {/*      </Tooltip>*/}

                                  {/*      /!* Price stays right side *!/*/}
                                  {/*      <Typography variant="subtitle1" sx={{ fontWeight: 800, flexShrink: 0 }}>*/}
                                  {/*        {`${data.price} AUD`}*/}
                                  {/*      </Typography>*/}
                                  {/*    </Box>*/}
                                  {/*  )}*/}
                                  {/*</Box>*/}

                                  {/*<Box*/}
                                  {/*  sx={{*/}
                                  {/*    position: 'absolute',*/}
                                  {/*    left: 0,*/}
                                  {/*    right: 0,*/}
                                  {/*    bottom: 0,*/}
                                  {/*    px: 2,*/}
                                  {/*    py: 1,*/}
                                  {/*    color: 'black',*/}
                                  {/*    bgcolor: 'rgba(232, 207, 222, 0.8)',*/}
                                  {/*    backdropFilter: 'blur(6px)',*/}
                                  {/*    zIndex: 2,*/}
                                  {/*  }}*/}
                                  {/*>*/}
                                  {/*  {isSmallScreen ? (*/}
                                  {/*    // ✅ Mobile: truncate at 15 chars*/}
                                  {/*    <Tooltip*/}
                                  {/*      title={`${data.title} ${data.price} AUD`}*/}
                                  {/*      arrow*/}
                                  {/*      enterTouchDelay={0}*/}
                                  {/*      leaveTouchDelay={2500}*/}
                                  {/*    >*/}
                                  {/*      <Typography*/}
                                  {/*        variant="subtitle2"*/}
                                  {/*        sx={{*/}
                                  {/*          fontWeight: 800,*/}
                                  {/*          whiteSpace: 'nowrap',*/}
                                  {/*          overflow: 'hidden',*/}
                                  {/*          textOverflow: 'ellipsis',*/}
                                  {/*        }}*/}
                                  {/*      >*/}
                                  {/*        {truncateCombined(data.title, data.price, 15)}*/}
                                  {/*      </Typography>*/}
                                  {/*    </Tooltip>*/}
                                  {/*  ) : (*/}
                                  {/*    // ✅ Large Screen: truncate at 20 chars*/}
                                  {/*    <Tooltip*/}
                                  {/*      title={`${data.title} ${data.price} AUD`}*/}
                                  {/*      arrow*/}
                                  {/*    >*/}
                                  {/*      <Typography*/}
                                  {/*        variant="subtitle1"*/}
                                  {/*        sx={{*/}
                                  {/*          fontWeight: 800,*/}
                                  {/*          whiteSpace: 'nowrap',*/}
                                  {/*          overflow: 'hidden',*/}
                                  {/*          textOverflow: 'ellipsis',*/}
                                  {/*        }}*/}
                                  {/*      >*/}
                                  {/*        {truncateCombinedLarge(data.title, data.price, 20)}*/}
                                  {/*      </Typography>*/}
                                  {/*    </Tooltip>*/}
                                  {/*  )}*/}
                                  {/*</Box>*/}

                                  {/*<Box*/}
                                  {/*  sx={{*/}
                                  {/*    position: 'absolute',*/}
                                  {/*    left: 0,*/}
                                  {/*    right: 0,*/}
                                  {/*    bottom: 0,*/}
                                  {/*    px: 2,*/}
                                  {/*    py: 1,*/}
                                  {/*    color: 'black',*/}
                                  {/*    bgcolor: 'rgba(232, 207, 222, 0.8)',*/}
                                  {/*    backdropFilter: 'blur(6px)',*/}
                                  {/*    zIndex: 2,*/}
                                  {/*  }}*/}
                                  {/*>*/}
                                  {/*  {isSmallScreen ? (*/}
                                  {/*    <Tooltip title={`${data.title} ${data.price} AUD`} arrow enterTouchDelay={0} leaveTouchDelay={2500}>*/}
                                  {/*      <Typography*/}
                                  {/*        variant="subtitle2"*/}
                                  {/*        sx={{*/}
                                  {/*          fontWeight: 800,*/}
                                  {/*          whiteSpace: 'nowrap',*/}
                                  {/*          overflow: 'hidden',*/}
                                  {/*          textOverflow: 'ellipsis',*/}
                                  {/*        }}*/}
                                  {/*      >*/}
                                  {/*        {truncateCombined(data.title, data.price, 15)}*/}
                                  {/*      </Typography>*/}
                                  {/*    </Tooltip>*/}
                                  {/*  ) : (*/}
                                  {/*    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>*/}
                                  {/*      <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>*/}
                                  {/*        {data.title}*/}
                                  {/*      </Typography>*/}
                                  {/*      <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>*/}
                                  {/*        {`${data.price} AUD`}*/}
                                  {/*      </Typography>*/}
                                  {/*    </Box>*/}
                                  {/*  )}*/}
                                  {/*</Box>*/}

                                  {/*<Box*/}
                                  {/*  sx={{*/}
                                  {/*    position: 'absolute',*/}
                                  {/*    left: 0,*/}
                                  {/*    right: 0,*/}
                                  {/*    bottom: 0,*/}
                                  {/*    px: 2,*/}
                                  {/*    py: 1.2,*/}
                                  {/*    color: 'black',*/}
                                  {/*    // Solid blur layer (comment next line if you prefer gradient)*/}
                                  {/*    bgcolor: 'rgba(232, 207, 222, 0.8)',*/}
                                  {/*    backdropFilter: 'blur(6px)',*/}
                                  {/*    // OR use gradient: uncomment below two lines and remove bgcolor/backdropFilter above*/}
                                  {/*    // background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,.55) 60%, rgba(0,0,0,.8) 100%)',*/}
                                  {/*    // py: 2,*/}
                                  {/*    textAlign: 'center'*/}
                                  {/*  }}*/}
                                  {/*>*/}
                                  {/*  /!* Title over layer *!/*/}
                                  {/*   <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{data.title}</Typography>*/}

                                  {/*  /!* Price over layer (current need) *!/*/}
                                  {/*  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>*/}
                                  {/*    {`${data.price} AUD`}*/}
                                  {/*  </Typography>*/}
                                  {/*</Box>*/}
                              </Grid>

                              // <Grid
                              //   md={4}
                              //   lg={3}
                              //   xs={6}
                              //   key={data.uuid || index}
                              //   sx={{ p: 1, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', flexDirection:'column' }}
                              //   data-aos="zoom-in"
                              //   data-aos-delay={delay}
                              // >
                              //   <Box
                              //     onClick={() => gotoEditor(data.uuid)}
                              //     component="img"
                              //     loading="lazy"
                              //     src={`${BASE_URL}/${data?.frontDesign}`}
                              //     alt={data?.title}
                              //     sx={{ width: '100%', aspectRatio: '1 / 1.414', cursor: 'pointer' }}
                              //   />
                              //   <Typography variant='h5' sx={{ width:'100%',   textAlign: 'center', pt:2 , color:'#c165a0'}}>{`${data.price} AUD`}</Typography>
                              //
                              // </Grid>
                            );
                          })
                        )}
                      </>
                    )}
                  </Grid>

                  {
                    displayedCards.length > 0 && (
                      <GroupedPagination
                        totalPages={totalPages}
                        currentPage={currentPage}
                        onPageChange={handlePageChange}
                        group={group}
                        setGroup={setGroup}

                      />
                    )
                  }

                </TabContext>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Box>

    </>
  );
};
export default Section2;