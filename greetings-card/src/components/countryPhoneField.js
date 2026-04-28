// 'use client';
// import React from 'react';
// import { MuiTelInput } from 'mui-tel-input';
// import { FormHelperText } from '@mui/material';
//
// export default function CountryPhoneField({
//   label = 'Phone Number',
//   value,
//   onChange,
//   onBlur,
//   error = false,
//   helperText = '',
//   defaultCountry = 'AU',          // set your default
//   preferredCountries = ['AU','PK','US','GB','AE'], // top of list
//   fullWidth = true,
//   size = 'medium',
//   ...rest
// }) {
//   return (
//     <>
//       <MuiTelInput
//         value={value}
//         onChange={onChange}         // returns E.164 (+61...) string
//         onBlur={onBlur}
//         defaultCountry={defaultCountry}
//         preferredCountries={preferredCountries}
//         forceCallingCode                              // always show +code
//         disableFormatting={false}                     // nice grouping
//         focusOnSelectCountry={true}
//         continents={['AF','AS','EU','NA','OC','SA']}  // all countries
//         label={label}
//         fullWidth={fullWidth}
//         size={size}
//         error={Boolean(error)}
//         {...rest}
//       />
//       {helperText ? (
//         <FormHelperText error={Boolean(error)} sx={{ ml: 1 }}>
//           {helperText}
//         </FormHelperText>
//       ) : null}
//     </>
//   );
// }
