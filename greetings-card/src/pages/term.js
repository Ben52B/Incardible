import Head from 'next/head';
import {
  Card,
  CardContent,
  Container,
  Typography,
  Grid, Box, Button
} from '@mui/material';
import * as React from 'react';
import CardMedia from '@mui/material/CardMedia';
import LandingNav from '../layouts/landing-nav/landingLayout';

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME;
const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL;
import { useRouter } from 'next/router';
const Page = () => {
  const router = useRouter();
  return (
    <>
      <Head>
        <title>Terms | {APP_NAME}</title>
      </Head>
      <Box sx={{
        position: 'relative',
        width: '100%',
        height: '100%  !important',
        minHeight: '100vh !important',
        overflowY: 'hidden ',
        backgroundImage: {
          xs: `url(${WEB_URL}/portrate.png)`, md: `url(${WEB_URL}/bg1.png)`
        },
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'

      }}>
        <LandingNav/>
        <Container sx={{ my: '120px' }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={12}>
              <Card sx={{ p: { md: 4, sm: 2 } }}>
                <Typography gutterBottom variant="h6" padding="10px"
                            sx={{ textAlign: 'center', mt: { xs: 3, md: 0 } }}>
                  TERMS & CONDITIONS
                </Typography>
                <Typography gutterBottom variant="h6" padding="10px" sx={{ textAlign: 'center' }}>
                  Welcome to Incardible
                </Typography>
                {/*<Typography gutterBottom variant="bod1" padding="20px" sx={{ textAlign: 'center' }}>*/}
                {/*  These Terms and Conditions (“Terms”, “Terms and Conditions”) govern your*/}
                {/*  relationship with Tecshield website’ applications mobile application (the*/}
                {/*  “Service”) operated by Tecshield. (“us”, “we”, or “our”).*/}

                {/*  Please read these Terms and Conditions carefully before using our website and*/}
                {/*  Tecshield’ mobile applications (the “Service”).*/}

                {/*  Your access to and use of the Service is conditioned on your acceptance of and*/}
                {/*  compliance with these Terms. These Terms apply to all visitors, users and others*/}
                {/*  who access or use the Service.*/}

                {/*  By accessing or using the Service you agree to be bound by these Terms. If you*/}
                {/*  disagree with any part of the terms then you may not access the Service.*/}
                {/*</Typography>*/}
                <CardMedia/>
                <CardContent>
                <Typography gutterBottom variant="h6" component="div" sx={{  mb: 3, mt:3 }}>
                1. TERMS & CONDITIONS
                </Typography>
                  <Typography gutterBottom variant="h6" component="div" sx={{  mb: 3, mt:3 }}>
                1.1 Acceptance of Terms
                </Typography>
                  <Typography variant="body2" color="text.secondary">
By accessing the Incardible website, purchasing products, or submitting digital content, you acknowledge that you have read, understood, and agree to be bound by these Terms & Conditions. If you do not agree with any part of these Terms, you must not proceed with the use of our services.
                  </Typography>
                  <Typography gutterBottom variant="h6" component="div" sx={{  mb: 3, mt:3 }}>
                  1.2 Nature of Services
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
XRAI Studios Pty Ltd, trading as Incardible, provides personalised greeting cards incorporating augmented-reality (AR) digital content. The service involves user-uploaded audio, video, photographic or graphical material (&quot;User Content&quot;), the printing and dispatch of physical cards, and the temporary hosting of AR experiences.
                  </Typography>
                  <Typography gutterBottom variant="h6" component="div" sx={{ mt: 3, mb: 3 }}>
                  1.3 Pricing and Payment
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
All prices displayed on our website are stated in Australian Dollars (AUD).

All payments are processed exclusively through Stripe, a secure third-party payment processor.

XRAI Studios Pty Ltd does not collect, hold, or store any payment card information.

Your order is deemed accepted only upon confirmation of a successful payment transaction.
                  </Typography>
                  <Typography gutterBottom variant="h6" component="div" sx={{ mt: 3, mb: 3 }}>
                  1.4 User Content – Rights and Obligations
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
By uploading User Content, you warrant and represent that:

a) You own, or have obtained all necessary rights and permissions to use the content;

b) The content does not infringe upon any copyright, privacy, confidentiality, moral rights, or intellectual property rights of any person;

c) The content is not unlawful, harassing, defamatory, harmful, explicit, offensive, abusive, discriminatory, or otherwise inappropriate.

You grant XRAI Studios Pty Ltd a non-exclusive, royalty-free, limited licence to store, process, reproduce, and display User Content solely for the purpose of generating, supporting, and delivering your AR greeting card service.
                  </Typography>
                  <Typography gutterBottom variant="h6" component="div" sx={{ mt: 3, mb: 3 }}>
                  1.5 Storage, Retention and Deletion of Uploaded Content
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
User Content is retained only for the period necessary to facilitate your AR experience:

Unpurchased designs/media: retained for 1 month, then permanently deleted;

Purchased cards: AR experience remains available for 3 months from purchase date;

Media for purchased cards: retained for the same 3-month period;

Extended storage services: retained until the expiry of the purchased extension;

Upon expiry of the applicable retention period, all associated User Content is permanently deleted.

You acknowledge it is your responsibility to maintain personal backups of your media.
                  </Typography>
                  <Typography gutterBottom variant="h6" component="div" sx={{ mt: 3, mb: 3 }}>
                    1.6 Production and Dispatch
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
All greeting cards are produced and dispatched from Victoria, Australia.

Dispatch occurs only after the design process is completed and full payment is received.
                    </Typography>
                    <Typography gutterBottom variant="h6" component="div" sx={{ mt: 3, mb: 3 }}>
                    1.7 Refunds, Replacements and Complaints
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
As products are custom-made and personalised:

Refunds for change of mind are not offered;

If the delivered product is damaged, materially defective, or incorrect, we will replace the item at no cost;

All claims must be submitted within 7 days of delivery and may require photographic evidence.
                    </Typography>
                    <Typography gutterBottom variant="h6" component="div" sx={{ mt: 3, mb: 3 }}>
                    1.8 Prohibited Use
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
Users must not employ the service to produce AR content or physical materials containing:

Illegal, explicit, violent, threatening, abusive, discriminatory, or harmful material;

Content in breach of any applicable law or regulation.

XRAI Studios Pty Ltd reserves the right to disable or remove any AR experience that contravenes these Terms.
                    </Typography>
                    <Typography gutterBottom variant="h6" component="div" sx={{ mt: 3, mb: 3 }}>
                    1.9 Limitation of Liability
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
To the extent permitted by Australian law:

XRAI Studios Pty Ltd shall not be liable for indirect, incidental, consequential, exemplary, or punitive damages;

Our maximum cumulative liability relating to any order shall be limited to the amount paid for that specific order;

Nothing in these Terms restricts your statutory rights under the Australian Consumer Law.
                    </Typography>
                    <Typography gutterBottom variant="h6" component="div" sx={{ mt: 3, mb: 3 }}>
                    1.10 Amendments to Terms
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
XRAI Studios Pty Ltd may update these Terms at any time. The most recent version, published on our website, supersedes all prior versions. Continued use of the service constitutes acceptance of updated Terms.
                    </Typography>
                    <Typography gutterBottom variant="h6" component="div" sx={{ mt: 3, mb: 3 }}>
                    1.11 Contact Details
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
All correspondence relating to these Terms should be directed to:

<b>info@incardible.co.au</b>
                    </Typography>
                    <Typography gutterBottom variant="h6" component="div" sx={{ mt: 3, mb: 3 }}>
                      2. PRIVACY POLICY
                    </Typography>
                    <Typography gutterBottom variant="h6" component="div" sx={{ mt: 3, mb: 3 }}>
                      2.1 Overview
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
This Privacy Policy outlines how XRAI Studios Pty Ltd collects, uses, stores, and discloses personal information and User Content in accordance with the Privacy Act 1988 (Cth) and the Australian Privacy Principles (APPs).
                    </Typography>
                    <Typography gutterBottom variant="h6" component="div" sx={{ mt: 3, mb: 3 }}>
                      2.2 Personal Information Collected
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
We may collect the following categories of personal information:

Full name;

Email address;

Phone number;

Postal address;

Uploaded media (photos/videos);

Order history and transaction records;

Device and technical information relating to website usage.
                    </Typography>
                    <Typography gutterBottom variant="h6" component="div" sx={{ mt: 3, mb: 3 }}>
                      2.3 Payment Information
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
All payment card information is handled solely by Stripe.

XRAI Studios Pty Ltd does not access, store, or process any payment card data.
                    </Typography>
                    <Typography gutterBottom variant="h6" component="div" sx={{ mt: 3, mb: 3 }}>
                      2.4 Use of Personal Information
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
Personal information may be used for the following purposes:

Processing and fulfilling orders;

Creating and delivering AR experiences;

Providing customer support and order notifications;

Managing your saved designs and account preferences;

Improving website and service functionality.

We do not sell, rent, or trade personal information to third parties.
                    </Typography>
                    <Typography gutterBottom variant="h6" component="div" sx={{ mt: 3, mb: 3 }}>
                      2.5 Data Retention for Uploaded Media
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
User Content is handled strictly in accordance with the retention timeframes outlined in Section 1.5.
                    </Typography>
                    <Typography gutterBottom variant="h6" component="div" sx={{ mt: 3, mb: 3 }}>
                      2.6 Security Measures
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
We employ reasonable administrative, technical, and physical safeguards to protect personal information from loss, misuse, or unauthorised access.
                    </Typography>
                    <Typography gutterBottom variant="h6" component="div" sx={{ mt: 3, mb: 3 }}>
                      2.7 Access and Correction
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
You may request access to, or correction of, your personal information at any time by contacting us at:

<b>info@incardible.co.au</b>
                    </Typography>
                    <Typography gutterBottom variant="h6" component="div" sx={{ mt: 3, mb: 3 }}>
                      2.8 Cookies and Tracking Technologies
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
Our website may use cookies and similar technologies for usability, analytics, performance, and personalisation purposes.
                    </Typography>
                    <Typography gutterBottom variant="h6" component="div" sx={{ mt: 3, mb: 3 }}>
                      2.9 Amendments
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
We may review and update this Privacy Policy periodically. The latest version will always be available on our website.
                    </Typography>
                    <Typography gutterBottom variant="h6" component="div" sx={{ mt: 3, mb: 3 }}>
                      3. SHIPPING & DELIVERY POLICY
                    </Typography>
                    <Typography gutterBottom variant="h6" component="div" sx={{ mt: 3, mb: 3 }}>
                      3.1 Delivery Partner
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
All orders are shipped via Australia Post.

Official delivery timeframes and network coverage information are available at:

https://auspost.com.au/business/shipping/delivery-speeds-and-coverage
                    </Typography>
                    <Typography gutterBottom variant="h6" component="div" sx={{ mt: 3, mb: 3 }}>
                      3.2 Processing Time
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
Orders are processed within 1–3 business days following design completion and payment confirmation.
                    </Typography>
                    <Typography gutterBottom variant="h6" component="div" sx={{ mt: 3, mb: 3 }}>
                      3.3 Delivery Timeframes (Based on Australia Post Guidelines)
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
Standard Delivery (Parcel Post)

Dispatched from Victoria:

Within Victoria: typically 2–4 business days;

Interstate (NSW, QLD, SA, TAS, ACT): typically 3–6 business days;

Remote or rural areas: delivery may exceed 6 business days.

Express Delivery (Express Post)

Within Victoria: typically 1–2 business days;

Major interstate metro areas: typically 1–3 business days;

Regional or remote destinations: delivery may exceed 3 business days.

Express Post is the fastest postal service offered, but next-day delivery is not guaranteed for all locations.
                    </Typography>
                    <Typography gutterBottom variant="h6" component="div" sx={{ mt: 3, mb: 3 }}>
                      3.4 Tracking
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
Customers will receive a tracking number once their order has been dispatched.
                    </Typography>
                    <Typography gutterBottom variant="h6" component="div" sx={{ mt: 3, mb: 3 }}>
                      3.5 Incorrect Address Information
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
XRAI Studios Pty Ltd is not responsible for delays, loss, or misdelivery resulting from incorrect or incomplete address details supplied by the customer.
                    </Typography>
                    <Typography gutterBottom variant="h6" component="div" sx={{ mt: 3, mb: 3 }}>
                      3.6 Delays and External Factors
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
Delivery timeframes may be impacted by:

Public holidays;

Peak mailing periods;

Severe weather;

Australia Post network delays.
                    </Typography>
                    <Typography gutterBottom variant="h6" component="div" sx={{ mt: 3, mb: 3 }}>
                      3.7 Lost or Damaged Parcels
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
Where a parcel is lost or delivered damaged:

Notification must be made within 7 days of delivery;

Photographic evidence may be required;

We will replace the item at no additional cost to the customer.
                    </Typography>
                    <Typography gutterBottom variant="h6" component="div" sx={{ mt: 3, mb: 3 }}>
                      3.8 Shipping Fees
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
Shipping rates are calculated at checkout based on destination and service type.
                    </Typography>
                    <Typography gutterBottom variant="h6" component="div" sx={{ mt: 3, mb: 3 }}>
                      3.9 Risk of Loss
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
Risk transfers to the customer once the parcel has been handed over to Australia Post.

Notwithstanding, we will make reasonable efforts to assist with resolving delivery issues.
                    </Typography>
                    <Typography gutterBottom variant="h6" component="div" sx={{ mt: 3, mb: 3 }}>
                      4. CONTACT INFORMATION
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
All enquiries relating to orders, privacy, terms, or delivery should be directed to:

Email: <b>info@incardible.co.au</b>

Company: XRAI Studios Pty Ltd
                    </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Box sx={{ display: 'flex', justifyContent: {md:'flex-end', xs:'center'}, mt: 3, mb: 2, pr: 2 , width: '100%'}}>
              <Button
                variant="contained"
                onClick={() => router.back()}
                sx={{
                  backgroundColor: '#c165a0',
                  color: '#fff',
                  '&:hover': {
                    backgroundColor: '#a0527f',
                  },
                  fontSize: { md: '14px', xl: '18px', '4k': '22px' },
                  padding: { md: '8px 24px', xl: '10px 30px', '4k': '12px 36px' }
                }}
              >
                Go Back
              </Button>
            </Box>
          </Grid>
        </Container>
      </Box>
    </>
);
};
export default Page;