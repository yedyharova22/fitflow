import { redirect } from 'next/navigation';
import { Routes } from '@/consts/Pages';

export default async function Home() {
  redirect(Routes.DASHBOARD);
}
