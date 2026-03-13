'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMsal } from '@azure/msal-react';
import { signIn } from '@/lib/auth/authHelpers';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import styled from 'styled-components';

const Page = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: hsl(var(--background));
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(
      ellipse 80% 60% at 50% 30%,
      hsl(217 87% 51% / 0.08) 0%,
      transparent 70%
    );
    pointer-events: none;
  }
`;

const LoginCard = styled.div`
  width: 400px;
  background-color: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: 14px;
  box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.12);
  overflow: hidden;
  position: relative;
  z-index: 1;
`;

const Header = styled.div`
  background: linear-gradient(135deg, hsl(217 87% 28%) 0%, hsl(217 87% 18%) 100%);
  padding: 32px 32px 28px;
  text-align: center;
`;

const LogoBadge = styled.div`
  width: 64px;
  height: 64px;
  background: #1570ef;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 800;
  color: white;
  margin: 0 auto 16px;
  box-shadow: 0 0 0 6px hsl(217 87% 51% / 0.2);
  letter-spacing: -0.5px;
`;

const AppName = styled.h1`
  font-size: 22px;
  font-weight: 700;
  color: white;
  margin: 0;
  letter-spacing: -0.02em;
`;

const AppSub = styled.p`
  font-size: 13px;
  color: hsl(215 28% 72%);
  margin: 5px 0 0;
`;

const Body = styled.div`
  padding: 32px;
`;

export default function LoginPage() {
  const router = useRouter();
  const { accounts } = useMsal();
  const { setAccount } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Already logged in?
  useEffect(() => {
    if (accounts.length > 0) {
      router.replace('/customers');
    }
  }, [accounts, router]);

  const handleDevBypass = () => {
    setAccount(
      {
        homeAccountId: 'dev-mock-id',
        environment: 'login.microsoftonline.com',
        tenantId: 'dev-tenant',
        username: 'dev@ingrammicro.com',
        localAccountId: 'dev-local-id',
        name: 'Dev User',
        idTokenClaims: {},
        nativeAccountId: undefined,
        authorityType: 'MSSTS',
      } as any,
      'mock-dev-token'
    );
    router.replace('/customers');
  };

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn();
      if (result) {
        setAccount(result.account, result.accessToken);
        router.replace('/customers');
      } else {
        setError('Login was cancelled or failed. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('[login]', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Page>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <LoginCard>
          <Header>
            <LogoBadge>IM</LogoBadge>
            <AppName>Ingram Micro CRM</AppName>
            <AppSub>Field Sales — Business Development</AppSub>
          </Header>

          <Body>
            <p className="text-sm text-muted-foreground mb-6 text-center">
              Sign in with your Ingram Micro Microsoft account to access the CRM.
            </p>

            {error && (
              <div className="mb-4 flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <motion.div whileTap={{ scale: 0.98 }}>
              <Button
                className="w-full h-12 gap-3 text-base"
                onClick={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
                      <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                      <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                      <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                      <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
                    </svg>
                    Sign in with Microsoft
                  </>
                )}
              </Button>
            </motion.div>

            {process.env.NODE_ENV === 'development' && (
              <button
                onClick={handleDevBypass}
                className="mt-3 w-full text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
              >
                Skip login (dev only)
              </button>
            )}

            <p className="mt-4 text-center text-xs text-muted-foreground">
              Your data is stored locally on your device.
              <br />
              An internet connection is required for sync.
            </p>
          </Body>
        </LoginCard>
      </motion.div>
    </Page>
  );
}
