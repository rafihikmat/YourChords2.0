import React, { useState, useEffect } from 'react';
import { KeyRound, CheckCircle2, XCircle, Clock, Search } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { formatTime } from '../../../lib/utils';

interface PasswordRequest {
  id: string;
  email: string;
  status: 'requested' | 'resolved' | 'expired';
  created_at: string;
}

const PasswordRequests: React.FC = () => {
  const [requests, setRequests] = useState<PasswordRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      // Try to fetch from real table
      const { data, error } = await supabase
        .from('password_resets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (err) {
      console.warn("Using mock data for password requests (Table 'password_resets' likely missing)", err);
      // Mock data for demonstration if table doesn't exist
      setRequests([
        { id: '1', email: 'user@example.com', status: 'requested', created_at: new Date().toISOString() },
        { id: '2', email: 'john.doe@test.com', status: 'resolved', created_at: new Date(Date.now() - 86400000).toISOString() },
        { id: '3', email: 'jane.smith@demo.com', status: 'expired', created_at: new Date(Date.now() - 172800000).toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (email: string) => {
      if (!confirm(`Are you sure you want to reset the password for ${email} to the default "yourchords123"?`)) return;
      
      setLoading(true);
      try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) throw new Error("No active session");

          const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-actions`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({
                  action: 'RESET_PASSWORD',
                  targetEmail: email, // Use email for lookup
                  newPassword: 'yourchords123'
              }),
          });

          if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || "Failed to reset password");
          }

          // Update status in password_resets table
          // We try to update by email since that's what we have for sure
          await supabase.from('password_resets')
              .update({ status: 'resolved' })
              .eq('email', email); // Updating all requests for this email to resolved

          alert(`Password for ${email} has been reset to "yourchords123". Please inform the user.`);
          fetchRequests(); // Refresh list
      } catch (err: any) {
          alert(`Error: ${err.message}`);
      } finally {
          setLoading(false);
      }
  };

  const filteredRequests = requests.filter(req => 
    req.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <KeyRound className="w-8 h-8 text-primary" />
            Password Requests
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Monitor and manage user password reset requests.
          </p>
        </div>
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
                type="text" 
                placeholder="Search emails..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">User Email</th>
                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Status</th>
                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Requested At</th>
                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/5">
              {loading ? (
                <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">Loading requests...</td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">No requests found.</td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{req.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                        req.status === 'requested' ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' :
                        req.status === 'resolved' ? 'bg-green-500/10 text-green-600 border-green-500/20' :
                        'bg-slate-500/10 text-slate-500 border-slate-500/20'
                      }`}>
                        {req.status === 'requested' && <Clock className="w-3 h-3" />}
                        {req.status === 'resolved' && <CheckCircle2 className="w-3 h-3" />}
                        {req.status === 'expired' && <XCircle className="w-3 h-3" />}
                        {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                      {new Date(req.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                        {req.status === 'requested' && (
                            <button 
                                onClick={() => {
                                    handleResetPassword(req.email)
                                }}
                                className="text-primary hover:text-primary/80 font-medium text-xs border border-primary/20 px-3 py-1.5 rounded-lg hover:bg-primary/5 transition-colors"
                            >
                                Reset to Default
                            </button>
                        )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PasswordRequests;
