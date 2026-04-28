import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Box, Typography, CircularProgress } from '@mui/material';

const CARD_ELEMENT_OPTIONS = {
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
  hidePostalCode: false,
};

export default function StripeCardElement({ onReady }) {
  const stripe = useStripe();
  const elements = useElements();
  const [cardComplete, setCardComplete] = useState(false);
  const [cardError, setCardError] = useState('');

  const handleCardChange = (event) => {
    setCardComplete(event.complete);
    setCardError(event.error ? event.error.message : '');
    
    if (onReady) {
      onReady({
        stripe,
        elements,
        complete: event.complete,
        error: event.error
      });
    }
  };

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: cardError ? 'error.main' : 'divider',
        borderRadius: 1,
        p: 2,
        mb: 2,
        backgroundColor: '#fff',
        '&:hover': {
          borderColor: cardError ? 'error.main' : 'primary.main',
        },
        '&:focus-within': {
          borderColor: 'primary.main',
          borderWidth: '2px',
        },
      }}
    >
      <CardElement
        options={CARD_ELEMENT_OPTIONS}
        onChange={handleCardChange}
      />
      
      {cardError && (
        <Typography
          variant="caption"
          color="error"
          sx={{ mt: 1, display: 'block' }}
        >
          {cardError}
        </Typography>
      )}
    </Box>
  );
}

