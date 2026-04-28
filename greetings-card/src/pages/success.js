
import { useRouter } from "next/router";
import { Button, Box , Typography} from "@mui/material";
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL;
import { useEffect } from 'react';
export default function SuccessPage() {
  const router = useRouter();
  // const { query, replace } = useRouter()
  // const orderId = query.token // PayPal return me ?token=... aata hai
  //
  // useEffect(() => {
  //   if (!orderId) return
  //     ;(async () => {
  //     try {
  //       const r = await fetch(`${API_URL}/api/paypal/capture/${orderId}`, { method: 'POST' })
  //       const j = await r.json()
  //       if (r.ok && j?.status === 'COMPLETED') {
  //         // yahan pe aap success UI show kar sakte ho (ya isi page par receipt waghera)
  //       } else {
  //         replace('/checkout?failed=1')
  //       }
  //     } catch {
  //       replace('/checkout?failed=1')
  //     }
  //   })()
  // }, [orderId])
  return (
    <Box
    sx={{
      position: 'relative',
      width: '100%',
      height: '100%  !important',
      minHeight: '100vh !important',
      overflowY: 'hidden ',
      backgroundImage: {
        xs: `url(${WEB_URL}/thankPortrate.png)`, md: `url(${WEB_URL}/thankYou.png)`
      },
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }}
    >
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      padding: "2rem"
    }}>
      {/*<CheckCircleOutlineIcon sx={{color:'green', width: 100, height: 100 , mb:3}}/>*/}
      <h1 style={{ fontSize: "4rem", marginBottom: "1rem", fontWeight:'bolder' }}>
        Thank You For Your Order
      </h1>
      <Typography sx={{ fontSize: "2rem", marginBottom: "1rem", color: "grey" }}>
      Your card is on the way. You will receive an email with the order details.
      </Typography>
      <Button
        variant="contained"
        color="primary"
        sx={{
          '&:hover': {
            backgroundColor: '#c165a0',
            color: 'white'
          }
        }}
        onClick={() => router.push("/")}
      >
        Go Back To Website
      </Button>
    </div></Box>
  );
}
