'use client';

import React from 'react';
import { UserProfile, UserRole } from '@/lib/types';
import { INITIAL_USERS } from '@/lib/initialData';
import { ShieldCheck, UserCheck, Warehouse, Truck, Eye, Check, X } from 'lucide-react';

interface RoleSwitcherProps {
  currentUser: UserProfile;
  onSelectUser: (user: UserProfile) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function RoleSwitcher({ currentUser, onSelectUser, isOpen, onClose }: RoleSwitcherProps) {
  if (!isOpen) return null;

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <ShieldCheck className="w-4 h-4 text-indigo-600" />;
      case 'warehouse_manager':
        return <Warehouse className="w-4 h-4 text-blue-600" />;
      case 'inventory_officer':
        return <UserCheck className="w-4 h-4 text-emerald-600" />;
      case 'dispatch_officer':
        return <Truck className="w-4 h-4 text-amber-600" />;
      case 'management_viewer':
        return <Eye className="w-4 h-4 text-purple-600" />;
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'warehouse_manager':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'inventory_officer':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'dispatch_officer':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'management_viewer':
        return 'bg-purple-50 text-purple-700 border-purple-200';
    }
  };

  const getRolePermissions = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'Full administrative access, user controls, data adjustments, all logs and reports';
      case 'warehouse_manager':
        return 'Oversees warehouse floor, approves discrepancies and inventory adjustments, generates reports';
      case 'inventory_officer':
        return 'Registers incoming containers, verifies received shipments, records stock-in and transfers';
      case 'dispatch_officer':
        return 'Authorizes outbound cargo, creates stock-out gate passes, prints delivery waybills';
      case 'management_viewer':
        return 'Read-only access to operational dashboards, inventory reports, and audit trails';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-xl p-6 overflow-hidden text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Switch Staff Profile</h3>
            <p className="text-xs text-slate-500">Test the inventory system with different role permissions</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
          {INITIAL_USERS.map((user) => {
            const isSelected = currentUser.id === user.id;
            return (
              <div
                key={user.id}
                onClick={() => {
                  onSelectUser(user);
                  onClose();
                }}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  isSelected 
                    ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900 shadow-2xs' 
                    : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-slate-100 border border-slate-200">
                      {getRoleIcon(user.role)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-xs sm:text-sm text-slate-900">{user.name}</span>
                        <span className={`px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded-full border ${getRoleBadge(user.role)}`}>
                          {user.role.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{user.email} • Badge: {user.badge}</p>
                    </div>
                  </div>
                  {isSelected && (
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-900 text-white">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  )}
                </div>
                <p className="mt-2 text-xs text-slate-500 pl-11">
                  {getRolePermissions(user.role)}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
