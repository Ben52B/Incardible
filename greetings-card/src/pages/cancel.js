// pages/cancel.js
import { useRouter } from "next/router";
import { Button, Box } from "@mui/material";
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL;
export default function CancelPage() {
  const router = useRouter();

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
      <CancelOutlinedIcon sx={{color:'#d32f2f', width: 100, height: 100 , mb:3}}/>
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem", color: "#d32f2f" }}>
        Payment Failed!!
      </h1>
      <p style={{ marginBottom: "2rem", fontSize: "1.1rem", color: "grey" }}>
        Your payment was not completed.
      </p>
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
