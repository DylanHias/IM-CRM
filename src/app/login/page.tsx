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
import type { AccountInfo } from '@azure/msal-browser';

const PageWrapper = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background-color: #f0f2f5;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: url('/images/login_screen.jpg');
    background-size: cover;
    background-position: center;
    filter: blur(24px) brightness(0.7);
    transform: scale(1.1);
    pointer-events: none;
  }
`;

const SplitCard = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  width: 90vw;
  max-width: 1100px;
  height: 85vh;
  max-height: 640px;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 25px 60px -12px rgb(0 0 0 / 0.25),
    0 0 0 1px rgb(255 255 255 / 0.1);

  @media (max-width: 768px) {
    flex-direction: column;
    height: auto;
    max-height: none;
    width: 94vw;
  }
`;

const LeftPanel = styled.div`
  flex: 0 0 45%;
  background: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 48px 44px;

  @media (max-width: 768px) {
    flex: none;
    padding: 36px 28px;
  }
`;

const RightPanel = styled.div`
  flex: 0 0 55%;
  position: relative;
  background-image: url('/images/login_screen.jpg');
  background-size: cover;
  background-position: center;
  overflow: hidden;

  @media (max-width: 768px) {
    display: none;
  }
`;

const ImageOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.65) 0%,
    rgba(0, 0, 0, 0.1) 50%,
    transparent 100%
  );
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 40px;
`;

const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.15,
    },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
};

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
      } as unknown as AccountInfo,
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
    <PageWrapper>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <SplitCard>
          <LeftPanel>
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              style={{ display: 'flex', flexDirection: 'column' }}
            >
              <motion.h1
                variants={fadeUp}
                style={{
                  fontFamily: "var(--font-sans), 'DM Sans', sans-serif",
                  fontSize: '36px',
                  fontWeight: 700,
                  color: '#111827',
                  margin: '0 0 8px',
                  letterSpacing: '-0.02em',
                  textAlign: 'center',
                }}
              >
                Login
              </motion.h1>

              <motion.p
                variants={fadeUp}
                style={{
                  fontSize: '15px',
                  color: '#6b7280',
                  margin: '0 0 32px',
                  lineHeight: 1.5,
                  textAlign: 'center',
                }}
              >
                Welcome back! Sign in to continue.
              </motion.p>

              {error && (
                <motion.div
                  variants={fadeUp}
                  className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700"
                >
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  {error}
                </motion.div>
              )}

              <motion.div variants={fadeUp}>
                <motion.div whileTap={{ scale: 0.98 }}>
                  <Button
                    className="w-full h-12 gap-3 text-base"
                    style={{
                      backgroundColor: '#1570ef',
                      color: 'white',
                      borderRadius: '10px',
                      fontSize: '15px',
                      fontWeight: 500,
                    }}
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
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 21 21"
                          xmlns="http://www.w3.org/2000/svg"
                        >
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
              </motion.div>

              {(process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') && (
                <motion.div variants={fadeUp}>
                  <button
                    onClick={handleDevBypass}
                    className="mt-3 w-full text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors"
                  >
                    Skip login (dev only)
                  </button>
                </motion.div>
              )}

              <motion.p
                variants={fadeUp}
                style={{
                  marginTop: '24px',
                  textAlign: 'center',
                  fontSize: '12px',
                  color: '#9ca3af',
                  lineHeight: 1.5,
                }}
              >
                Your data is stored locally on your device.
              </motion.p>
            </motion.div>
          </LeftPanel>

          <RightPanel
            as={motion.div}
            initial={{ scale: 1.05, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <ImageOverlay>
              <h2
                style={{
                  fontFamily: "var(--font-sans), 'DM Sans', sans-serif",
                  fontSize: '28px',
                  fontWeight: 700,
                  color: 'white',
                  margin: '0 0 6px',
                  letterSpacing: '-0.01em',
                }}
              >
                Field Sales CRM
              </h2>
              <p
                style={{
                  fontSize: '14px',
                  color: 'rgba(255, 255, 255, 0.75)',
                  margin: 0,
                }}
              >
                Empowering Ingram Micro field teams worldwide
              </p>
            </ImageOverlay>
          </RightPanel>
        </SplitCard>
      </motion.div>
    </PageWrapper>
  );
}
