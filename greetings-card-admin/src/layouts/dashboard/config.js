import { 
  Dashboard as DashboardIcon,
  CreditCard as CardsIcon,
  ShoppingCart as OrderIcon,
  Campaign as NewsIcon,
  AccountCircle as AccountIcon
} from '@mui/icons-material';

export const items = [
  {
    title: 'Dashboard',
    path: '/dashboard',
    icon: <DashboardIcon sx={{ fontSize: 28, color: '#c165a0' }} />
  },
  {
    title: 'Cards',
    path: '/cards',
    icon: <CardsIcon sx={{ fontSize: 28, color: '#c165a0' }} />
  },
  {
    title: 'Orders',
    path: '/orders',
    icon: <OrderIcon sx={{ fontSize: 28, color: '#c165a0' }} />
  },
  {
    title: 'News and Offers',
    path: '/news-and-offers',
    icon: <NewsIcon sx={{ fontSize: 28, color: '#c165a0' }} />
  },
  {
    title: 'Account',
    path: '/account',
    icon: <AccountIcon sx={{ fontSize: 28, color: '#c165a0' }} />
  }
];
