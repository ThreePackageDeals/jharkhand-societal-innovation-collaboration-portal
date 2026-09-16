import React, { useState, useEffect } from 'react';
import { Loader2, Check, X, ExternalLink, Search, Filter } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { Role, VerificationStatus } from '../types';

interface VerificationRequest {
  id: string;
  userId: string;
  role: Role;
  status: VerificationStatus;
  documentUrls: string[];
  createdAt: string;
  user: {
    fullName: string;
    email: string;
    district: string;
  };
  university?: {
    name: string;
  };
  organization?: {
    name: string;
  };
}

export const AdminVerificationQueue = () => {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterRole, setFilterRole] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchRequests();
  }, []);

  const apiRequest = async (path: string, init?: RequestInit) => {
    const token = localStorage.getItem('auth_token');
    const res = await fetch(`/api${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
        ...(init?.headers || {}),
      },
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error?.message || errorData.message || 'Request failed');
    }

    return res.json();
  };

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest('/verification/requests');
      const rows = Array.isArray(response?.data) ? response.data : [];
      const normalized: VerificationRequest[] = rows.map((row: any) => ({
        id: row.id,
        userId: row.userId,
        role: row.role,
        status: row.status,
        documentUrls: Array.isArray(row.documentUrls) ? row.documentUrls : [],
        createdAt: row.createdAt,
        user: {
          fullName: row.user?.fullName || 'Unknown User',
          email: row.user?.email || '',
          district: row.user?.district || '',
        },
        university: row.user?.studentProfile?.universityId
          ? { name: row.user.studentProfile.universityId }
          : row.user?.facultyProfile?.universityId
            ? { name: row.user.facultyProfile.universityId }
            : undefined,
        organization: row.user?.industryProfile?.organization?.name
          ? { name: row.user.industryProfile.organization.name }
          : undefined,
      }));
      setRequests(normalized);
    } catch (err: any) {
      console.error('Failed to fetch verification requests:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (requestId: string, status: VerificationStatus) => {
    setIsUpdating(requestId);
    try {
      await apiRequest(`/verification/requests/${requestId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      // Refresh list
      await fetchRequests();
    } catch (err: any) {
      alert(`Error updating status: ${err.message}`);
    } finally {
      setIsUpdating(null);
    }
  };

  const filteredRequests = requests.filter(req => {
    const matchesRole = filterRole === 'ALL' || req.role === filterRole;
    const matchesSearch =
      req.user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (req.university?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (req.organization?.name || '').toLowerCase().includes(searchQuery.toLowerCase());

    return matchesRole && matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-stone-600">
        <Loader2 className="w-8 h-8 animate-spin text-[#BC5434] mb-3" />
        <p className="text-xs uppercase tracking-widest font-bold">Loading Verification Queue</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-editorial-serif text-4xl font-bold text-stone-900 tracking-tight">Verification Queue</h1>
          <p className="text-stone-500 font-serif italic">Review and verify high-trust role applications</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input
              type="text"
              placeholder="Search applicants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-stone-300 bg-white focus:outline-none focus:border-[#BC5434] text-sm w-64"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-stone-500" />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="p-2 border border-stone-300 bg-white focus:outline-none focus:border-[#BC5434] text-sm cursor-pointer"
            >
              <option value="ALL">All Roles</option>
              <option value="FACULTY">Faculty</option>
              <option value="INDUSTRY_REP">Industry Representative</option>
              <option value="UNIVERSITY_ADMIN">University Admin</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white border border-stone-200 rounded-sm shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200">
                <th className="p-4 text-[10px] uppercase font-bold tracking-widest text-stone-600">Applicant</th>
                <th className="p-4 text-[10px] uppercase font-bold tracking-widest text-stone-600">Role</th>
                <th className="p-4 text-[10px] uppercase font-bold tracking-widest text-stone-600">Affiliation</th>
                <th className="p-4 text-[10px] uppercase font-bold tracking-widest text-stone-600">Documents</th>
                <th className="p-4 text-[10px] uppercase font-bold tracking-widest text-stone-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-stone-500 font-serif italic">
                    No pending verification requests found.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-stone-50 transition-colors group">
                    <td className="p-4">
                      <div className="font-bold text-stone-900 text-sm">{req.user.fullName}</div>
                      <div className="text-xs text-stone-500 font-serif italic">{req.user.email}</div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-stone-100 text-stone-700 text-[10px] font-bold uppercase tracking-wider rounded-sm border border-stone-200">
                        {req.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-stone-900">
                        {req.university?.name || req.organization?.name || 'N/A'}
                      </div>
                      <div className="text-[10px] text-stone-500 uppercase tracking-widest">
                        {req.university ? 'University' : req.organization ? 'Industry' : 'Independent'}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        {req.documentUrls.map((url, idx) => (
                          <a
                            key={idx}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 bg-white border border-stone-300 text-stone-600 hover:text-[#BC5434] hover:border-[#BC5434] rounded-sm transition-colors cursor-pointer"
                            title={`Document ${idx + 1}`}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        ))}
                        {req.documentUrls.length === 0 && (
                          <span className="text-[10px] text-stone-400 italic">No docs provided</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleUpdateStatus(req.id, 'REJECTED')}
                          disabled={isUpdating === req.id}
                          className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-sm transition-all cursor-pointer disabled:opacity-50"
                          title="Reject Request"
                        >
                          <X className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(req.id, 'VERIFIED')}
                          disabled={isUpdating === req.id}
                          className="p-2 text-stone-400 hover:text-green-600 hover:bg-green-50 rounded-sm transition-all cursor-pointer disabled:opacity-50"
                          title="Verify Applicant"
                        >
                          <Check className="h-5 w-5" />
                        </button>
                        {isUpdating === req.id && (
                          <Loader2 className="h-4 w-4 animate-spin text-[#BC5434] ml-2" />
                        )}
                      </div>
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
