// src/components/AddressAutocompleteGoogleAU.jsx
'use client';

import { useMemo, useState } from 'react';
import { LoadScript, Autocomplete } from '@react-google-maps/api';
import { TextField, CircularProgress } from '@mui/material';

// [west, south, east, north]
const AU_STATE_BOUNDS = {
  'Australian Capital Territory': [148.75, -35.921, 149.45, -35.15],
  'New South Wales':              [140.99, -37.51, 153.64, -28.16],
  Victoria:                       [140.96, -39.20, 149.98, -33.98],
  Queensland:                     [138.00, -29.18, 153.55,  -9.14],
  'Northern Territory':           [129.00, -26.00, 138.00, -10.97],
  'South Australia':              [129.00, -38.06, 141.00, -25.99],
  Tasmania:                       [144.00, -43.75, 148.54, -40.62],
  'Western Australia':            [112.92, -35.13, 129.00, -13.50],
};

const libs = ['places'];

export default function AddressAutocompleteGoogleAU({
  formik,
  stateValue = null,          // bias results to selected state
  name = 'delivery_address',  // formik field
  label = 'Street Address',
  sx
}) {
  const [ac, setAc] = useState(null);
  const [loading, setLoading] = useState(true);

  // AU state bias (optional)
  const bounds = useMemo(() => {
    const b = AU_STATE_BOUNDS[stateValue];
    return b ? { west: b[0], south: b[1], east: b[2], north: b[3] } : undefined;
  }, [stateValue]);

  const options = {
    componentRestrictions: { country: ['au'] },
    fields: ['address_components', 'geometry', 'formatted_address'],
    types: ['address'],
    bounds,
    strictBounds: !!bounds
  };

  const handlePlaceChanged = () => {
    if (!ac) return;
    const place = ac.getPlace();
    if (!place || !place.address_components) return;

    const get = (type) =>
      (place.address_components.find((c) => c.types.includes(type)) || {}).long_name || '';

    const streetNumber = get('street_number');
    const route        = get('route');
    const suburb       =
      get('locality') || get('sublocality') || get('postal_town') || get('administrative_area_level_3');
    const state        = get('administrative_area_level_1');
    const postcode     = get('postal_code');

    const streetOnly = [streetNumber, route].filter(Boolean).join(' ').trim();

    formik.setFieldValue(name, streetOnly);
    if (suburb)   formik.setFieldValue('suburb', suburb);
    if (state)    formik.setFieldValue('state', state);
    if (postcode) formik.setFieldValue('postal_code', postcode);
  };

  return (
    <LoadScript
      googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
      libraries={libs}
      // loadingElement={<CircularProgress size={18} />}
      onLoad={() => setLoading(false)}
      onError={() => setLoading(false)}
    >
      <Autocomplete
        onLoad={(instance) => setAc(instance)}
        onPlaceChanged={handlePlaceChanged}
        options={options}
      >
        <TextField
          fullWidth
          label={label}
          placeholder="Enter a location"
          value={formik.values?.[name] || ''}
          onChange={(e) => formik.setFieldValue(name, e.target.value)}
          onBlur={formik.handleBlur}
          error={Boolean(formik.touched?.[name] && formik.errors?.[name])}
          helperText={(formik.touched?.[name] && formik.errors?.[name]) || ' '}
          sx={{
            '& .MuiInputBase-input::placeholder': {
              color: 'grey',
              opacity: 1
            },
            ...sx
          }}
          InputLabelProps={{ shrink: true }}
          inputProps={{ autoComplete: 'new-street-address' }}
          InputProps={{
            endAdornment: loading ? <CircularProgress size={18} /> : undefined,
          }}
        />

        {/*<TextField*/}
        {/*  fullWidth*/}
        {/*  label={label}*/}
        {/*  value={formik.values?.[name] || ''}*/}
        {/*  onChange={(e) => formik.setFieldValue(name, e.target.value)}*/}
        {/*  onBlur={formik.handleBlur}*/}
        {/*  error={Boolean(formik.touched?.[name] && formik.errors?.[name])}*/}
        {/*  helperText={(formik.touched?.[name] && formik.errors?.[name]) || ' '}*/}
        {/*  sx={sx}*/}
        {/*  // ✅ prevent label overlap when programmatically setting value*/}
        {/*  InputLabelProps={{ shrink: true }}*/}
        {/*  // ✅ reduce browser’s own autofill fighting with Maps*/}
        {/*  inputProps={{ autoComplete: 'new-street-address' }}*/}
        {/*  InputProps={{*/}
        {/*    endAdornment: loading ? <CircularProgress size={18} /> : undefined,*/}
        {/*  }}*/}
        {/*/>*/}
      </Autocomplete>
    </LoadScript>
  );
}
