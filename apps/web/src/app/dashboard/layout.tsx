'use client';

import { Container } from '@mui/material';
import { AppNavBar } from '@/components/AppNavBar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppNavBar />
      <Container maxWidth="md" sx={{ pb: 6 }}>
        {children}
      </Container>
    </>
  );
}
