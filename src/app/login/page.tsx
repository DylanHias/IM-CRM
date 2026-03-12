'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMsal } from '@azure/msal-react';
import { signIn } from '@/lib/auth/authHelpers';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';
import styled from 'styled-components';

const Page = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1e3a5f 0%, #1a2234 50%, #0f172a 100%);
`;

const LoginCard = styled.div`
  width: 400px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.4);
  overflow: hidden;
`;

const Header = styled.div`
  background: #1e3a5f;
  padding: 32px 32px 28px;
  text-align: center;
`;

const LogoBadge = styled.div`
  width: 56px;
  height: 56px;
  background: #3b82f6;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 800;
  color: white;
  margin: 0 auto 14px;
`;

const AppName = styled.h1`
  font-size: 20px;
  font-weight: 700;
  color: white;
  margin: 0;
`;

const AppSub = styled.p`
  font-size: 13px;
  color: #94a3b8;
  margin: 4px 0 0;
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
      <LoginCard>
        <Header>
          <LogoBadge>IM</LogoBadge>
          <AppName>Ingram Micro CRM</AppName>
          <AppSub>Field Sales — Business Development</AppSub>
        </Header>

        <Body>
          <p className="text-sm text-slate-600 mb-6 text-center">
            Sign in with your Ingram Micro Microsoft account to access the CRM.
          </p>

          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <Button
            className="w-full h-11 gap-3 text-base"
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

          {process.env.NODE_ENV === 'development' && (
            <button
              onClick={handleDevBypass}
              className="mt-3 w-full text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2"
            >
              Skip login (dev only)
            </button>
          )}

          <p className="mt-4 text-center text-xs text-slate-400">
            Your data is stored locally on your device.
            <br />
            An internet connection is required for sync.
          </p>
        </Body>
      </LoginCard>
    </Page>
  );
}
