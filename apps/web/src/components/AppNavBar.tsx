'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  AppBar,
  Box,
  Button,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Toolbar,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { FitFlowLogo } from '@/components/FitFlowLogo';
import { ProfileNavButton } from '@/components/ProfileNavButton';
import { getNavItems, isNavItemActive } from '@/components/nav-config';
import { NotificationBell } from '@/features/notifications/NotificationBell';
import { useAuth } from '@/features/auth/use-auth';

export function AppNavBar() {
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user } = useAuth();

  const navItems = getNavItems(user?.legacyRole);

  const closeDrawer = () => setDrawerOpen(false);

  const navLinks = navItems.map((item) => {
    const active = isNavItemActive(pathname, item.href);
    return (
      <Button
        key={item.href}
        component={Link}
        href={item.href}
        color={active ? 'primary' : 'inherit'}
        sx={{ textTransform: 'none', fontWeight: active ? 600 : 400 }}
      >
        {item.label}
      </Button>
    );
  });

  const drawerContent = (
    <Box sx={{ width: 260, pt: 1 }} role="presentation">
      <Box sx={{ px: 2, py: 1.5 }}>
        <FitFlowLogo />
      </Box>
      <List>
        {navItems.map((item) => {
          const active = isNavItemActive(pathname, item.href);
          return (
            <ListItem key={item.href} disablePadding>
              <ListItemButton
                component={Link}
                href={item.href}
                selected={active}
                onClick={closeDrawer}
              >
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ fontWeight: active ? 600 : 400 }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <>
      <AppBar
        position="static"
        color="default"
        elevation={0}
        sx={{
          mb: 3,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Toolbar sx={{ minHeight: 56, gap: 1 }}>
          {isMobile && (
            <IconButton
              edge="start"
              color="inherit"
              aria-label="Open navigation menu"
              onClick={() => setDrawerOpen(true)}
            >
              <MenuIcon />
            </IconButton>
          )}

          <FitFlowLogo />

          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 2 }}>
              {navLinks}
            </Box>
          )}

          <Box sx={{ flexGrow: 1 }} />

          <NotificationBell />
          <ProfileNavButton />
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={closeDrawer}
        ModalProps={{ keepMounted: true }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
}
