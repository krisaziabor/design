import React, { useState } from 'react';
import { useSignIn, useUser, SignOutButton } from '@clerk/nextjs';

export default function CustomSignIn() {
  const [permanentCode, setPermanentCode] = useState('');
  const [permanentCodeEntered, setPermanentCodeEntered] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const { signIn, setActive } = useSignIn();
  const { isSignedIn } = useUser();

  if (isSignedIn) {
    return (
      <div className="flex flex-col gap-2 p-4 items-start">
        <div className="text-sm text-selected-light dark:text-selected-dark mb-1 text-left">You are currently signed in.</div>
        <SignOutButton>
          <button className="text-default-light dark:text-default-dark hover:text-selected-light dark:hover:text-selected-dark text-sm text-left">Log out</button>
        </SignOutButton>
      </div>
    );
  }

  async function verifyPermanentCode() {
    setVerifying(true);
    setError('');
    try {
      const res = await fetch('/api/verify-permanent-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: permanentCode }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.valid) {
          setPermanentCodeEntered(true);
        } else {
          setError('Incorrect code.');
        }
      } else {
        setError('Incorrect code.');
      }
    } catch (err) {
      setError('Error verifying code.');
    } finally {
      setVerifying(false);
    }
  }

  async function sendEmailCode() {
    setLoading(true);
    setError('');
    if (!signIn) {
      setError('Sign in not ready. Please try again.');
      setLoading(false);
      return;
    }
    try {
      await signIn.create({ identifier: 'studio@krisaziabor.com', strategy: 'email_code' });
      setEmailSent(true);
    } catch (err: any) {
      setError(err.errors?.[0]?.message || err.message || 'Failed to send code');
    } finally {
      setLoading(false);
    }
  }

  async function resendEmailCode() {
    setLoading(true);
    setError('');
    if (!signIn) {
      setError('Sign in not ready. Please try again.');
      setLoading(false);
      return;
    }
    try {
      await signIn.create({ identifier: 'studio@krisaziabor.com', strategy: 'email_code' });
    } catch (err: any) {
      setError(err.errors?.[0]?.message || err.message || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  }

  async function submitCode() {
    setLoading(true);
    setError('');
    if (!signIn) {
      setError('Sign in not ready. Please try again.');
      setLoading(false);
      return;
    }
    try {
      const result = await signIn.attemptFirstFactor({ strategy: 'email_code', code });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        setEmailSent(false);
        setCode('');
      } else {
        setError('Invalid code or not complete.');
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || err.message || 'Failed to verify code');
    } finally {
      setLoading(false);
    }
  }

  // UI for permanent code entry
  if (!permanentCodeEntered) {
    return (
      <div className="flex flex-col gap-4 items-start w-full max-w-md">
        <div className="text-sm text-selected-light dark:text-selected-dark mb-2 text-left">For Kris only – Please enter the permanent code before we ask for a second form of verification.</div>
        <div className="w-full flex flex-col gap-2">
          <input
            id="permanent-code-input"
            type="password"
            placeholder="Permanent code"
            className="border rounded px-3 py-2 text-sm bg-white dark:bg-black text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-default-light dark:focus:ring-default-dark"
            value={permanentCode}
            onChange={e => {
              setPermanentCode(e.target.value);
              setError('');
            }}
            autoFocus
            autoComplete="off"
            onKeyDown={e => {
              if (e.key === 'Enter' && permanentCode) {
                verifyPermanentCode();
              }
            }}
            disabled={loading || verifying}
          />
          <button
            className="mt-2 text-sm font-semibold bg-selected-light dark:bg-selected-dark text-selected-dark dark:text-selected-light px-4 py-2 rounded disabled:opacity-50"
            style={{ display: permanentCode ? 'block' : 'none' }}
            disabled={loading || verifying || !permanentCode}
            onClick={verifyPermanentCode}
          >
            {verifying ? 'Verifying...' : 'Continue'}
          </button>
          {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
        </div>
      </div>
    );
  }

  // After permanent code is entered, show the email code flow
  return (
    <div className="flex flex-col gap-4">
      {!emailSent ? (
        <button
          className="text-sm text-selected-light dark:text-selected-dark hover:text-default-light dark:hover:text-default-dark font-normal underline text-left"
          onClick={sendEmailCode}
          disabled={loading}
        >
          {loading ? 'Sending...' : 'Send email code'}
        </button>
      ) : (
        <>
          <input
            type="text"
            className="border rounded px-3 py-2 text-sm bg-white dark:bg-black text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-default-light dark:focus:ring-default-dark placeholder:text-default-light dark:placeholder:text-default-dark"
            placeholder="Enter code"
            value={code}
            onChange={e => setCode(e.target.value)}
            disabled={loading}
          />
          <div className="flex gap-5 mb-2">
            <button
              className="text-default-light dark:text-default-dark text-sm hover:underline bg-transparent border-0"
              onClick={resendEmailCode}
              disabled={loading}
            >
              Resend
            </button>
            <button
              className="text-selected-light dark:text-selected-dark text-sm hover:underline bg-transparent border-0" 
              onClick={submitCode}
              disabled={loading || !code}
            >
              {loading ? 'Verifying...' : 'Enter'}
            </button>
          </div>
        </>
      )}
      {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
    </div>
  );
}