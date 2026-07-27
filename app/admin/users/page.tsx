"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
  ArrowLeft, Search, Shield, ShieldCheck, ShieldAlert, UserCheck, UserX, 
  RefreshCw, CheckCircle2, AlertTriangle, X, User as UserIcon, Calendar,
  MoreVertical, Edit, Lock, Unlock, Crown
} from "lucide-react";
import { 
  getAllUsers, updateUserRole, toggleUserBanStatus, UserProfile 
} from "@/lib/adminUsers";
import { useAuth } from "@/lib/authContext";

export default function AdminUsersPage() {
  const { profile: currentUserProfile } = useAuth();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");

  // Role Modal State
  const [selectedUserForRole, setSelectedUserForRole] = useState<UserProfile | null>(null);
  const [newRole, setNewRole] = useState<'user' | 'admin' | 'super_admin'>('user');
  const [updatingRole, setUpdatingRole] = useState(false);

  // Ban Modal State
  const [selectedUserForBan, setSelectedUserForBan] = useState<UserProfile | null>(null);
  const [togglingBan, setTogglingBan] = useState(false);

  // Toast State
  const [toast, setToast] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Fetch Users
  const loadUsers = useCallback(async (query?: string) => {
    setLoading(true);
    const res = await getAllUsers(query);
    if (res.success && res.data) {
      setUsers(res.data);
    } else {
      setToast({ text: res.error || "Gagal memuat data pengguna.", type: "error" });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, loadUsers]);

  // Filtered Users list
  const filteredUsers = users.filter((u) => {
    if (roleFilter === "ALL") return true;
    return u.role.toUpperCase() === roleFilter.toUpperCase();
  });

  // Handle Save Role
  const handleSaveRole = async () => {
    if (!selectedUserForRole) return;

    setUpdatingRole(true);
    const res = await updateUserRole(selectedUserForRole.id, newRole);
    setUpdatingRole(false);

    if (res.success) {
      setToast({ 
        text: `Role untuk "${selectedUserForRole.full_name}" berhasil diubah menjadi ${newRole.toUpperCase()}!`, 
        type: "success" 
      });
      setSelectedUserForRole(null);
      loadUsers(searchQuery);
    } else {
      setToast({ text: res.error || "Gagal mengubah role pengguna.", type: "error" });
    }
  };

  // Handle Ban / Unban Toggle
  const handleToggleBan = async () => {
    if (!selectedUserForBan) return;

    const nextBanStatus = !selectedUserForBan.is_banned;
    setTogglingBan(true);
    const res = await toggleUserBanStatus(selectedUserForBan.id, nextBanStatus);
    setTogglingBan(false);

    if (res.success) {
      setToast({ 
        text: `Status pengguna "${selectedUserForBan.full_name}" berhasil diperbarui! (${nextBanStatus ? 'DIBLOKIR' : 'DIAKTIFKAN'})`, 
        type: "success" 
      });
      setSelectedUserForBan(null);
      loadUsers(searchQuery);
    } else {
      setToast({ text: res.error || "Gagal mengubah status blokir pengguna.", type: "error" });
    }
  };

  // Helper for Role Badge Styling
  const renderRoleBadge = (role: string) => {
    switch (role.toLowerCase()) {
      case 'super_admin':
        return (
          <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-[0_0_10px_rgba(168,85,247,0.3)] flex items-center gap-1 w-fit">
            <Crown className="w-3 h-3 text-purple-400" /> Super Admin
          </span>
        );
      case 'admin':
        return (
          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-[0_0_10px_rgba(59,130,246,0.3)] flex items-center gap-1 w-fit">
            <Shield className="w-3 h-3 text-blue-400" /> Admin
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-md text-[10px] font-medium uppercase tracking-wider bg-slate-800 text-slate-300 border border-white/10 flex items-center gap-1 w-fit">
            <UserIcon className="w-3 h-3 text-slate-400" /> User
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-black text-slate-100 pb-24">
      
      {/* HEADER NAVIGATION */}
      <header className="sticky top-0 z-40 bg-surface/90 border-b border-white/10 backdrop-blur-xl px-4 md:px-8 py-4 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white rounded-xl transition-all flex items-center justify-center cursor-pointer"
            title="Kembali ke Dashboard Admin"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded-md uppercase">
                RBAC Security & Moderation
              </span>
            </div>
            <h1 className="text-lg md:text-xl font-black text-white truncate mt-0.5">
              Manajemen Pengguna & Moderation
            </h1>
          </div>
        </div>

        <button
          onClick={() => loadUsers(searchQuery)}
          className="p-2.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl border border-white/10 transition-all cursor-pointer flex items-center gap-2 text-xs font-bold"
          title="Refresh Data Pengguna"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-primary' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </header>

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed top-20 right-4 z-50 animate-bounce">
          <div className={`p-4 rounded-xl border text-xs font-bold flex items-center gap-3 shadow-2xl backdrop-blur-xl ${
            toast.type === 'success' 
              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-[0_0_30px_rgba(16,185,129,0.3)]' 
              : 'bg-red-500/20 border-red-500/50 text-red-300 shadow-[0_0_30px_rgba(239,68,68,0.3)]'
          }`}>
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertTriangle className="w-5 h-5 text-red-400" />}
            <span>{toast.text}</span>
            <button onClick={() => setToast(null)} className="ml-2 text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 pt-8 space-y-6">
        
        {/* SEARCH & FILTER CONTROLS */}
        <div className="bg-surface/80 p-5 rounded-2xl border border-white/10 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Search Bar */}
          <div className="relative w-full md:w-96">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berdasarkan nama atau User ID..."
              className="w-full bg-black/80 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary/60 font-medium"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-3 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Role Filter Tabs */}
          <div className="flex items-center gap-1 bg-black/60 p-1 rounded-xl border border-white/10 w-full md:w-auto justify-center">
            {['ALL', 'USER', 'ADMIN', 'SUPER_ADMIN'].map((f) => (
              <button
                key={f}
                onClick={() => setRoleFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  roleFilter === f 
                    ? 'bg-primary text-white shadow-[0_0_10px_rgba(168,85,247,0.4)]' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {f === 'ALL' ? 'Semua Role' : f}
              </button>
            ))}
          </div>

        </div>

        {/* USERS TABLE */}
        <div className="bg-surface/80 rounded-2xl border border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden">
          
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-primary" />
              Daftar Pengguna Terdaftar ({filteredUsers.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-black/60 text-slate-400 font-mono uppercase tracking-wider text-[10px] border-b border-white/10">
                <tr>
                  <th className="px-6 py-3.5">Profil Pengguna</th>
                  <th className="px-6 py-3.5">Role Akses</th>
                  <th className="px-6 py-3.5">Status Akun</th>
                  <th className="px-6 py-3.5">Tanggal Bergabung</th>
                  <th className="px-6 py-3.5 text-right">Aksi Moderasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500 font-mono">
                      <RefreshCw className="w-5 h-5 text-primary animate-spin mx-auto mb-2" />
                      Memuat data pengguna...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500 font-mono">
                      Tidak ada pengguna ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                      
                      {/* PROFIL */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {user.avatar_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={user.avatar_url} alt={user.full_name || 'User'} className="w-full h-full object-cover" />
                            ) : (
                              <UserIcon className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <div className="font-extrabold text-white text-sm">
                              {user.full_name}
                            </div>
                            <div className="text-[10px] font-mono text-slate-500 truncate max-w-[200px]">
                              ID: {user.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* ROLE */}
                      <td className="px-6 py-4">
                        {renderRoleBadge(user.role)}
                      </td>

                      {/* STATUS */}
                      <td className="px-6 py-4">
                        {user.is_banned ? (
                          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/40 flex items-center gap-1 w-fit">
                            <Lock className="w-3 h-3" /> Diblokir
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1 w-fit">
                            <Unlock className="w-3 h-3" /> Aktif
                          </span>
                        )}
                      </td>

                      {/* JOINED DATE */}
                      <td className="px-6 py-4 text-slate-400 font-mono text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>
                            {user.created_at ? new Date(user.created_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            }) : '-'}
                          </span>
                        </div>
                      </td>

                      {/* ACTIONS */}
                      <td className="px-6 py-4 text-right space-x-2">
                        {/* Change Role Button */}
                        <button
                          onClick={() => {
                            setSelectedUserForRole(user);
                            setNewRole(user.role);
                          }}
                          className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                          title="Ubah Role Pengguna"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Ubah Role</span>
                        </button>

                        {/* Ban / Unban Button */}
                        <button
                          onClick={() => setSelectedUserForBan(user)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1 border ${
                            user.is_banned 
                              ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                              : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30'
                          }`}
                          title={user.is_banned ? "Aktifkan Akun" : "Blokir Akun"}
                        >
                          {user.is_banned ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                          <span>{user.is_banned ? "Aktifkan" : "Blokir"}</span>
                        </button>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>

      </div>

      {/* MODAL UBAH ROLE */}
      {selectedUserForRole && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-surface p-6 rounded-2xl border border-white/10 max-w-md w-full flex flex-col gap-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                Ubah Role Pengguna
              </h3>
              <button 
                onClick={() => setSelectedUserForRole(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-300 font-medium">
                Pilih role baru untuk <strong className="text-white">{selectedUserForRole.full_name}</strong>:
              </p>

              <div className="space-y-2">
                {[
                  { key: 'user', label: 'USER (Pengguna Biasa)', desc: 'Dapat melihat chord, simpan favorit, dan buat request lagu' },
                  { key: 'admin', label: 'ADMIN', desc: 'Dapat mengedit chord, menyetujui request, dan kelola scraper' },
                  { key: 'super_admin', label: 'SUPER ADMIN', desc: 'Akses penuh ke seluruh sistem termasuk kelola user & role' }
                ].map((r) => (
                  <div
                    key={r.key}
                    onClick={() => setNewRole(r.key as any)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      newRole === r.key 
                        ? 'bg-primary/20 border-primary text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]' 
                        : 'bg-black/60 border-white/10 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="text-xs font-bold">{r.label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{r.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-4">
              <button
                type="button"
                onClick={() => setSelectedUserForRole(null)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-bold transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveRole}
                disabled={updatingRole}
                className="px-5 py-2 bg-primary hover:bg-primary-light text-white rounded-xl text-xs font-bold transition-all shadow-[0_0_15px_rgba(168,85,247,0.4)] flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {updatingRole ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>Simpan Role</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI BAN / UNBAN */}
      {selectedUserForBan && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-surface p-6 rounded-2xl border border-white/10 max-w-md w-full flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-black text-white">
                Konfirmasi {selectedUserForBan.is_banned ? 'Aktifkan' : 'Blokir'} Akun
              </h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Apakah Anda yakin ingin {selectedUserForBan.is_banned ? 'mengaktifkan kembali' : 'memblokir'} akun pengguna <strong className="text-white">{selectedUserForBan.full_name}</strong>?
            </p>

            <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-4 mt-2">
              <button
                type="button"
                onClick={() => setSelectedUserForBan(null)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-bold transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleToggleBan}
                disabled={togglingBan}
                className={`px-5 py-2 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 ${
                  selectedUserForBan.is_banned
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                    : 'bg-red-600 hover:bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                }`}
              >
                {togglingBan ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Ya, Konfirmasi</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
