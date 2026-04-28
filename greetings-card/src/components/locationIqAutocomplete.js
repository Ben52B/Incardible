// components/AddressAutocompleteLocationIQ.jsx
import { useMemo, useState } from 'react';
import { Autocomplete, TextField, CircularProgress } from '@mui/material';

// AU state bounds: [west, south, east, north]
const AU_STATE_BBOX = {
  'Australian Capital Territory': [148.75, -35.921, 149.45, -35.15],
  'New South Wales':              [140.99, -37.51, 153.64, -28.16],
  'Victoria':                     [140.96, -39.20, 149.98, -33.98],
  'Queensland':                   [138.00, -29.18, 153.55,  -9.14],
  'Northern Territory':           [129.00, -26.00, 138.00, -10.97],
  'South Australia':              [129.00, -38.06, 141.00, -25.99],
  'Tasmania':                     [144.00, -43.75, 148.54, -40.62],
  'Western Australia':            [112.92, -35.13, 129.00, -13.50],
};

const debounce = (fn, ms = 300) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

export default function AddressAutocompleteLocationIQ({
  formik,
  stateValue,                    // current selected State (string)
  name = 'delivery_address',
  label = 'Street Address',
}) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const key = process.env.NEXT_PUBLIC_LOCATIONIQ_KEY;

  const fetchSuggestions = useMemo(() => debounce(async (q, bbox) => {
    if (!q || q.length < 3) { setOptions([]); return; }
    setLoading(true);

    // LocationIQ viewbox format: left,top,right,bottom == west,north,east,south
    const viewbox = bbox ? `${bbox[0]},${bbox[3]},${bbox[2]},${bbox[1]}` : undefined;

    const url = new URL('https://us1.locationiq.com/v1/autocomplete');
    url.searchParams.set('key', key);
    url.searchParams.set('q', q);
    url.searchParams.set('limit', '8');
    url.searchParams.set('countrycodes', 'au');   // restrict to Australia
    url.searchParams.set('normalizeaddress', '1');
    url.searchParams.set('dedupe', '1');
    if (viewbox) {
      url.searchParams.set('viewbox', viewbox);   // bias to state bbox
      url.searchParams.set('bounded', '1');       // restrict results inside bbox
    }

    const res = await fetch(url.toString());
    const data = await res.json();

    // const items = (Array.isArray(data) ? data : []).map(d => ({
    //   id: d.place_id || `${d.osm_type}-${d.osm_id}`,
    //   label: d.display_place && d.display_address
    //     ? `${d.display_place}, ${d.display_address}`
    //     : (d.display_name || ''),
    //   raw: d
    // }));

    // fetchSuggestions ke andar, items map ko yeh bana do:
    // const items = (Array.isArray(data) ? data : []).map(d => {
    //   const a = d.address || {};
    //   const house = a.house_number || '';
    //   const road  = a.road || a.pedestrian || a.footway || a.cycleway || '';
    //   const suburb =
    //     a.suburb || a.neighbourhood || a.locality || a.village || a.town || a.city || '';
    //
    //   // AU-style concise label: "12 George St, Parramatta"
    //   const shortLabel = [ [house, road].filter(Boolean).join(' '), suburb ].filter(Boolean).join(', ');
    //
    //   return {
    //     id: d.place_id || `${d.osm_type}-${d.osm_id}`,
    //     label: shortLabel || d.display_name || '',
    //     raw: d
    //   };
    // });
// fetchSuggestions ke andar items mapping replace:
    const items = (Array.isArray(data) ? data : []).map(d => {
      const a = d.address || {};
      const house = a.house_number || '';
      const road  = a.road || a.pedestrian || a.footway || a.cycleway || '';
      const suburb =
        a.suburb || a.neighbourhood || a.locality || a.village || a.town || a.city || '';
      const postcode = a.postcode || '';

      const street = [house, road].filter(Boolean).join(' ');
      // ✅ AU display: "12 George St, Parramatta 2150"
      const shortLabel = [street, [suburb, postcode].filter(Boolean).join(' ')].filter(Boolean).join(', ');

      return {
        id: d.place_id || `${d.osm_type}-${d.osm_id}`,
        label: shortLabel,
        raw: d
      };
    });



    setOptions(items);
    setLoading(false);
  }, 350), [key]);

  const bbox = AU_STATE_BBOX[stateValue];

  return (
    <Autocomplete
      fullWidth
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      options={options}                 // items: {id,label,raw}  (label = "12 George St, Parramatta 2150")
      filterOptions={(x) => x}
      getOptionLabel={(o) => o.label || ''}
      renderOption={(props, option) => (
        <li {...props}>{option.label}</li>   // dropdown me AU format
      )}
      loading={loading}

      /* textbox ko sirf street value se control karo */
      value={null}
      inputValue={formik.values[name]}

      onChange={(_, val) => {
        const a = val?.raw?.address || {};
        const house    = a.house_number || '';
        const road     = a.road || a.pedestrian || a.footway || a.cycleway || '';
        const suburb   =
          a.suburb || a.neighbourhood || a.locality || a.village || a.town || a.city || '';
        const state    = a.state || a.state_district || '';
        const postcode = a.postcode || '';

        const streetOnly = [house, road].filter(Boolean).join(' ').trim(); // "12 George St"

        formik.setFieldValue(name, streetOnly);      // delivery_address
        if (suburb)   formik.setFieldValue('suburb', suburb);
        if (state)    formik.setFieldValue('state', state);
        if (postcode) formik.setFieldValue('postal_code', postcode);
      }}

      freeSolo
      selectOnFocus
      handleHomeEndKeys
      clearOnBlur={false}

      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          // placeholder="e.g. 12 George St, Parramatta 2150"
          value={formik.values[name]}
          onChange={(e) => {
            formik.setFieldValue(name, e.target.value); // street-only textbox
            fetchSuggestions(e.target.value, bbox);     // AU suggestions (with suburb+postcode)
          }}
          onBlur={formik.handleBlur}
          error={!!(formik.touched[name] && formik.errors[name])}
          helperText={(formik.touched[name] && formik.errors[name]) || ' '}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress size={18} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />


    // <Autocomplete
    //   fullWidth
    //   open={open}
    //   onOpen={() => setOpen(true)}
    //   onClose={() => setOpen(false)}
    //   options={options}
    //   filterOptions={(x) => x}
    //   getOptionLabel={(o) => o.label || ''}
    //   loading={loading}
    //   value={null}
    //   inputValue={formik.values[name]}
    //
    //   onChange={(_, val) => {
    //     const a = val?.raw?.address || {};
    //     const house = a.house_number || '';
    //     const road  = a.road || a.pedestrian || a.footway || a.cycleway || '';
    //
    //     // ✅ Street-only textbox value
    //     const streetOnly = [house, road].filter(Boolean).join(' ').trim();
    //
    //     const suburb =
    //       a.suburb || a.neighbourhood || a.locality || a.village || a.town || a.city || '';
    //     const state  = a.state || a.state_district || '';
    //     const postcode = a.postcode || '';
    //
    //     // Set all fields — textbox me sirf street dikhega
    //     formik.setFieldValue(name, streetOnly);
    //     if (suburb)   formik.setFieldValue('suburb', suburb);
    //     if (state)    formik.setFieldValue('state', state);
    //     if (postcode) formik.setFieldValue('postal_code', postcode);
    //   }}
    //   freeSolo
    //   selectOnFocus
    //   handleHomeEndKeys
    //   clearOnBlur={false}
    //
    //
    //   renderInput={(params) => (
    //     <TextField
    //       {...params}
    //       label={label}
    //       value={formik.values[name]}
    //       onChange={(e) => {
    //         formik.setFieldValue(name, e.target.value);  // street-only text control
    //         fetchSuggestions(e.target.value, bbox);
    //       }}
    //       onBlur={formik.handleBlur}
    //       error={!!(formik.touched[name] && formik.errors[name])}
    //       helperText={(formik.touched[name] && formik.errors[name]) || ' '}
    //       InputProps={{
    //         ...params.InputProps,
    //         endAdornment: (
    //           <>
    //             {loading ? <CircularProgress size={18} /> : null}
    //             {params.InputProps.endAdornment}
    //           </>
    //         ),
    //       }}
    //     />
    //   )}
    // />
  );
}
