'use client';

import React, { useState } from 'react';
import {
  Lock,
  User,
  Database,
  Cloud,
  CheckCircle2,
  ExternalLink,
  Plus,
  Trash2,
  RefreshCw,
  LogOut,
  X,
  Eye,
  EyeOff,
  Package,
  ShieldCheck,
} from 'lucide-react';
import { DATABASE_CONNECTION_INFO } from '@/lib/firebase';
import {
  ActiveStaffSession,
  signInWithUsernamePassword,
  registerStaffAccount,
  signInWithGoogleCloud,
  signOutStaff,
  getStaffDirectory,
  removeStaffAccount,
} from '@/lib/cloudSync';
import {
  syncLocalToCloudDatabase,
  pullFromCloudDatabase,
} from '@/lib/storage';

interface LoginScreenProps {
  onSignedIn: (msg: string) => void;
}

export function LoginScreen({ onSignedIn }: LoginScreenProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (mode === 'register') {
        const created = await registerStaffAccount(
          username,
          password,
          displayName || username
        );
        const { session } = await signInWithUsernamePassword(
          created.username,
          created.password
        );
        onSignedIn(`Signed in as ${session.displayName}.`);
      } else {
        const { session } = await signInWithUsernamePassword(
          username,
          password
        );
        onSignedIn(`Welcome back, ${session.displayName}.`);
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Could not sign in. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsLoading(true);
    try {
      const session = await signInWithGoogleCloud();
      await pullFromCloudDatabase().catch(() => {});
      onSignedIn(
        `Signed in as ${session.displayName} (Cloud Database Connected).`
      );
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Google sign-in was cancelled or failed.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden">
        {/* Top Brand Header */}
        <div className="p-6 bg-slate-900 text-white text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-white/10 text-amber-400 flex items-center justify-center mx-auto">
            <Package className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-black tracking-tight">
            Deep Down Logistics
          </h1>
          <p className="text-xs text-slate-300">
            Staff Sign In — Container & Warehouse Inventory
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="grid grid-cols-2 bg-slate-100 p-1.5 m-5 mb-0 rounded-xl gap-1">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError('');
            }}
            className={`py-2.5 rounded-lg text-xs font-bold transition-colors ${
              mode === 'login'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Username Login
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError('');
            }}
            className={`py-2.5 rounded-lg text-xs font-bold transition-colors ${
              mode === 'register'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            New Staff Account
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Staff Full Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Stephen Mayowa"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:bg-white focus:border-slate-900 min-h-[46px]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Username *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. admin"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:bg-white focus:border-slate-900 min-h-[46px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Password *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-10 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:bg-white focus:border-slate-900 min-h-[46px]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-sm transition-colors min-h-[48px]"
          >
            {isLoading
              ? 'Signing in...'
              : mode === 'register'
              ? 'Create Account & Sign In'
              : 'Sign In'}
          </button>

          {/* Default credentials helper for quick handover */}
          {mode === 'login' && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 text-xs text-slate-600">
              <div>
                <span className="font-bold text-slate-800 block">
                  Default Handover Login:
                </span>
                <span>
                  Username: <strong>admin</strong> · Password:{' '}
                  <strong>password123</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setUsername('admin');
                  setPassword('password123');
                }}
                className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-800 font-bold hover:bg-slate-100 shrink-0"
              >
                Fill
              </button>
            </div>
          )}

          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase">
              <span className="bg-white px-2 text-slate-400 font-bold">
                Or Cloud Admin Access
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={isLoading}
            onClick={handleGoogleSignIn}
            className="w-full py-3 px-4 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-900 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors min-h-[46px]"
          >
            <Cloud className="w-4 h-4 text-blue-600" />
            <span>Sign In with Google (Cloud Firestore Sync)</span>
          </button>

          <div className="pt-2 border-t border-slate-100 text-center">
            <a
              href="https://www.deepdownlogistics.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:underline"
            >
              <span>Visit Official Website — www.deepdownlogistics.com</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}

interface DatabaseAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: ActiveStaffSession;
  onNotify: (msg: string) => void;
}

export function DatabaseAccessModal({
  isOpen,
  onClose,
  session,
  onNotify,
}: DatabaseAccessModalProps) {
  const [staffList, setStaffList] = useState(() => getStaffDirectory());
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleConnectGoogle = async () => {
    setErrorMsg('');
    setStatusMsg('');
    setIsSyncing(true);
    try {
      await signInWithGoogleCloud();
      const res = await syncLocalToCloudDatabase();
      setStatusMsg(
        `Connected & synced ${res.containersSynced} containers and ${res.warehouseRecordsSynced} warehouse records to Cloud Firestore.`
      );
      onNotify('Cloud Firestore connected and synced.');
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Could not connect Google account.'
      );
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncToCloud = async () => {
    setErrorMsg('');
    setStatusMsg('');
    setIsSyncing(true);
    try {
      const res = await syncLocalToCloudDatabase();
      setStatusMsg(
        `Saved ${res.containersSynced} containers and ${res.warehouseRecordsSynced} warehouse records to Cloud Firestore.`
      );
      onNotify('All records synced to Cloud Firestore.');
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Sync failed. Connect Google first.'
      );
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePullFromCloud = async () => {
    setErrorMsg('');
    setStatusMsg('');
    setIsSyncing(true);
    try {
      await pullFromCloudDatabase();
      setStatusMsg('Loaded latest records from Cloud Firestore.');
      onNotify('Loaded latest records from Cloud Firestore.');
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Could not load from Cloud.'
      );
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setStatusMsg('');
    try {
      const created = await registerStaffAccount(
        newUsername,
        newPassword,
        newDisplayName
      );
      setStaffList(getStaffDirectory());
      setNewUsername('');
      setNewPassword('');
      setNewDisplayName('');
      setStatusMsg(
        `Added staff login "${created.username}" for ${created.displayName}.`
      );
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Could not add staff account.'
      );
    }
  };

  const handleDeleteStaff = (id: string, uname: string) => {
    setErrorMsg('');
    try {
      removeStaffAccount(id);
      setStaffList(getStaffDirectory());
      setStatusMsg(`Removed staff account "${uname}".`);
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Cannot remove account.'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto">
      <div
        className="bg-white border border-slate-200 rounded-t-3xl sm:rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl my-auto max-h-[92dvh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <Database className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <h3 className="font-bold text-base sm:text-lg">
                Database & Staff Access
              </h3>
              <p className="text-xs text-slate-400">
                Production Cloud Database Location & Staff Logins
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {statusMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{statusMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {/* 1. Where the Database Lives & How to Access It */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-blue-600" />
                <h4 className="text-sm font-black text-slate-900">
                  Where the Database Lives (Google Cloud Firestore)
                </h4>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${
                  session.isCloudConnected
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                {session.isCloudConnected
                  ? 'Live Cloud Sync Active'
                  : 'Local + Ready for Cloud Sync'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  Firebase Project ID
                </span>
                <span className="font-mono font-bold text-slate-900 break-all">
                  {DATABASE_CONNECTION_INFO.projectId}
                </span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  Firestore Database ID
                </span>
                <span className="font-mono font-bold text-slate-900 break-all">
                  {DATABASE_CONNECTION_INFO.databaseId}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Your database is hosted on <strong>Google Cloud Firestore</strong>{' '}
              with collections for <code>containers</code>,{' '}
              <code>containers/&#123;id&#125;/items</code>,{' '}
              <code>warehouseRecords</code>, and <code>staffAccounts</code>. You
              can inspect or manage raw records directly in the Firebase Console
              anytime:
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <a
                href={DATABASE_CONNECTION_INFO.firestoreConsoleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold"
              >
                <span>Open Firestore Database Console</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <a
                href={DATABASE_CONNECTION_INFO.authConsoleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold"
              >
                <span>Open Firebase Auth Console</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Cloud Sync Action Buttons */}
            <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center gap-2">
              {!session.isCloudConnected ? (
                <button
                  type="button"
                  disabled={isSyncing}
                  onClick={handleConnectGoogle}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 min-h-[42px]"
                >
                  <Cloud className="w-4 h-4" />
                  <span>
                    {isSyncing
                      ? 'Connecting...'
                      : 'Connect Google Account to Enable Cloud Sync'}
                  </span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={isSyncing}
                    onClick={handleSyncToCloud}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 min-h-[40px]"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`}
                    />
                    <span>Push Local Records to Cloud</span>
                  </button>

                  <button
                    type="button"
                    disabled={isSyncing}
                    onClick={handlePullFromCloud}
                    className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold flex items-center gap-1.5 min-h-[40px]"
                  >
                    <Database className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Load Records from Cloud</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* 2. Simple Staff Username & Password Management */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3.5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h4 className="text-sm font-black text-slate-900">
                Staff Usernames & Passwords
              </h4>
            </div>

            <div className="divide-y divide-slate-200 bg-white border border-slate-200 rounded-xl overflow-hidden">
              {staffList.map((st) => (
                <div
                  key={st.id}
                  className="p-3 flex items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900">
                      {st.displayName}
                    </span>{' '}
                    <span className="text-slate-500">
                      (Username: <strong>{st.username}</strong> · Password:{' '}
                      <strong>{st.password}</strong>)
                    </span>
                  </div>
                  {staffList.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteStaff(st.id, st.username)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                      title="Remove staff login"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add New Staff Login Form */}
            <form
              onSubmit={handleAddStaff}
              className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1"
            >
              <input
                type="text"
                required
                value={newDisplayName}
                onChange={(e) => setNewDisplayName(e.target.value)}
                placeholder="Staff Full Name"
                className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 min-h-[40px]"
              />
              <input
                type="text"
                required
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Username"
                className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 min-h-[40px]"
              />
              <input
                type="text"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Password (min 6 chars)"
                className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 min-h-[40px]"
              />
              <button
                type="submit"
                className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1 min-h-[40px]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Staff</span>
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-600">
            Signed in as: <strong className="text-slate-900">{session.displayName}</strong> ({session.username})
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={async () => {
                await signOutStaff();
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
