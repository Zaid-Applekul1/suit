/**
 * TeamManagement.tsx — Team Member & Invitation Management
 *
 * Allows orchard owners to:
 * - Send invitations to managers and workers
 * - View and manage team members
 * - Set permissions (view, edit, full)
 * - Remove team members
 * - View pending invitations
 */

import React, { useEffect, useState } from 'react';
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  Trash2,
  X,
  Send,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  Edit,
  Key
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

const TEAM_STYLES = `
@keyframes tmFadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
@keyframes tmScaleIn { from{opacity:0;transform:scale(0.93)} to{opacity:1;transform:scale(1)} }
@keyframes tmSlideIn { from{opacity:0;transform:translateX(-20px)} to{opacity:1;transform:translateX(0)} }
.tm-fade-up { animation: tmFadeUp 0.5s cubic-bezier(.22,1,.36,1) both }
.tm-scale-in { animation: tmScaleIn 0.4s cubic-bezier(.22,1,.36,1) both }
.tm-slide-in { animation: tmSlideIn 0.45s cubic-bezier(.22,1,.36,1) both }
.tm-d0{animation-delay:0s} .tm-d1{animation-delay:.08s} .tm-d2{animation-delay:.16s}
.tm-card {
  transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
}
.tm-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(34,197,94,0.12);
  border-color: #86efac;
}
.tm-input {
  transition: border-color .18s ease, box-shadow .18s ease;
}
.tm-input:focus {
  border-color: #16a34a !important;
  box-shadow: 0 0 0 3px rgba(22,163,74,0.15);
  outline: none;
}
`;

interface TeamMember {
  id: string;
  owner_id: string;
  member_id: string;
  role: 'owner' | 'manager' | 'worker';
  permissions: 'view' | 'edit' | 'full';
  status: 'active' | 'suspended' | 'removed';
  joined_at: string;
  member_name?: string;
  member_email?: string;
  member_phone?: string;
  member_avatar?: string;
}

interface TeamInvitation {
  id: string;
  owner_id: string;
  invitee_email: string;
  invitee_phone?: string;
  role: 'manager' | 'worker';
  permissions: 'view' | 'edit' | 'full';
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  invitation_token: string;
  invited_at: string;
  expires_at: string;
  message?: string;
}

const TeamManagement: React.FC = () => {
  const { session, user } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [inviteForm, setInviteForm] = useState({
    email: '',
    phone: '',
    role: 'worker' as 'manager' | 'worker',
    permissions: 'view' as 'view' | 'edit' | 'full',
    message: '',
  });

  // Fetch team members and invitations
  useEffect(() => {
    if (session?.user) {
      fetchTeamData();
    }
  }, [session]);

  const fetchTeamData = async () => {
    if (!session?.user) return;

    try {
      // Fetch team members
      const { data: members, error: membersError } = await supabase
        .from('team_members_with_profiles')
        .select('*')
        .eq('owner_id', session.user.id)
        .eq('status', 'active')
        .order('joined_at', { ascending: false });

      if (membersError) throw membersError;
      setTeamMembers(members || []);

      // Fetch pending invitations
      const { data: invites, error: invitesError } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('owner_id', session.user.id)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('invited_at', { ascending: false });

      if (invitesError) throw invitesError;
      setInvitations(invites || []);
    } catch (err: any) {
      console.error('Error fetching team data:', err);
      setError(err.message);
    }
  };

  const handleSendInvitation = async () => {
    if (!session?.user) return;
    if (!inviteForm.email) {
      setError('Email is required');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Generate invitation token
      const token = crypto.randomUUID();

      const { error: insertError } = await supabase
        .from('team_invitations')
        .insert({
          owner_id: session.user.id,
          invitee_email: inviteForm.email.toLowerCase(),
          invitee_phone: inviteForm.phone || null,
          role: inviteForm.role,
          permissions: inviteForm.permissions,
          invitation_token: token,
          message: inviteForm.message || null,
        });

      if (insertError) throw insertError;

      // Send email notification via Edge Function
      await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-team-invitation`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            inviteeEmail: inviteForm.email,
            ownerName: user?.user_metadata?.name || 'Orchard Owner',
            farmName: user?.user_metadata?.farm_name || 'Your Orchard',
            role: inviteForm.role,
            invitationToken: token,
          }),
        }
      );

      setSuccess('Invitation sent!');
      setShowInviteModal(false);
      setInviteForm({ email: '', phone: '', role: 'worker', permissions: 'view', message: '' });
      fetchTeamData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!confirm('Cancel this invitation?')) return;

    try {
      const { error } = await supabase
        .from('team_invitations')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', invitationId);

      if (error) throw error;

      setSuccess('Invitation cancelled');
      fetchTeamData();
    } catch (err: any) {
      console.error('Error cancelling invitation:', err);
      setError(err.message);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Remove ${memberName} from your team?`)) return;

    try {
      const { error } = await supabase
        .from('team_members')
        .update({ status: 'removed', updated_at: new Date().toISOString() })
        .eq('id', memberId);

      if (error) throw error;

      setSuccess(`${memberName} removed from team`);
      fetchTeamData();
    } catch (err: any) {
      console.error('Error removing member:', err);
      setError(err.message);
    }
  };

  const handleUpdatePermissions = async (memberId: string, newPermissions: 'view' | 'edit' | 'full') => {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ permissions: newPermissions, updated_at: new Date().toISOString() })
        .eq('id', memberId);

      if (error) throw error;

      setSuccess('Permissions updated');
      fetchTeamData();
    } catch (err: any) {
      console.error('Error updating permissions:', err);
      setError(err.message);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'manager': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'worker': return 'bg-green-100 text-green-700 border-green-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getPermissionIcon = (permissions: string) => {
    switch (permissions) {
      case 'view': return <Eye className="w-4 h-4" />;
      case 'edit': return <Edit className="w-4 h-4" />;
      case 'full': return <Key className="w-4 h-4" />;
      default: return <Eye className="w-4 h-4" />;
    }
  };

  return (
    <>
      <style>{TEAM_STYLES}</style>
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="tm-fade-up tm-d0">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Users className="w-8 h-8 text-green-600" />
                Team Management
              </h1>
              <p className="text-gray-500 mt-1">Manage your orchard team members and invitations</p>
            </div>
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-all shadow-md"
            >
              <UserPlus className="w-5 h-5" />
              Invite Member
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="tm-scale-in bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-800">Error</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {success && (
          <div className="tm-scale-in bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-green-800">Success</p>
              <p className="text-sm text-green-600">{success}</p>
            </div>
            <button onClick={() => setSuccess(null)} className="ml-auto text-green-400 hover:text-green-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Team Members */}
        <div className="tm-fade-up tm-d1">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-6 h-6 text-green-600" />
              Team Members ({teamMembers.length})
            </h2>

            {teamMembers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">No team members yet</p>
                <p className="text-sm text-gray-400 mt-1">Invite managers and workers to help manage your orchard</p>
              </div>
            ) : (
              <div className="space-y-3">
                {teamMembers.map((member, idx) => (
                  <div
                    key={member.id}
                    className={`tm-card tm-slide-in tm-d${idx % 3} flex items-center justify-between p-4 rounded-xl border border-gray-200`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                        {member.member_name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{member.member_name || 'Unknown'}</p>
                        <p className="text-sm text-gray-500">{member.member_email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${getRoleBadgeColor(member.role)}`}>
                            {member.role.toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-400">
                            Joined {new Date(member.joined_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Permissions Dropdown */}
                      <select
                        value={member.permissions}
                        onChange={(e) => handleUpdatePermissions(member.id, e.target.value as any)}
                        className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white hover:border-green-400 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                      >
                        <option value="view">👁️ View Only</option>
                        <option value="edit">✏️ Can Edit</option>
                        <option value="full">🔑 Full Access</option>
                      </select>

                      <button
                        onClick={() => handleRemoveMember(member.id, member.member_name || 'member')}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Remove member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pending Invitations */}
        <div className="tm-fade-up tm-d2">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-6 h-6 text-amber-600" />
              Pending Invitations ({invitations.length})
            </h2>

            {invitations.length === 0 ? (
              <div className="text-center py-8">
                <Mail className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No pending invitations</p>
              </div>
            ) : (
              <div className="space-y-3">
                {invitations.map((invitation, idx) => (
                  <div
                    key={invitation.id}
                    className={`tm-card tm-slide-in tm-d${idx % 3} flex items-center justify-between p-4 rounded-xl border border-amber-200 bg-amber-50/30`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                        <Mail className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{invitation.invitee_email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${getRoleBadgeColor(invitation.role)}`}>
                            {invitation.role.toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-400">
                            Expires {new Date(invitation.expires_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleCancelInvitation(invitation.id)}
                      className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg border border-red-200 font-semibold transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="tm-scale-in bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <UserPlus className="w-6 h-6 text-green-600" />
                Invite Team Member
              </h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-all"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  placeholder="member@example.com"
                  className="tm-input w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-200"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone (Optional)</label>
                <input
                  type="tel"
                  value={inviteForm.phone}
                  onChange={(e) => setInviteForm({ ...inviteForm, phone: e.target.value })}
                  placeholder="+1234567890"
                  className="tm-input w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-200"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as any })}
                  className="tm-input w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-200"
                >
                  <option value="worker">Worker - Basic field tasks</option>
                  <option value="manager">Manager - Can manage workers and fields</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Permissions</label>
                <select
                  value={inviteForm.permissions}
                  onChange={(e) => setInviteForm({ ...inviteForm, permissions: e.target.value as any })}
                  className="tm-input w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-200"
                >
                  <option value="view">👁️ View Only - Can see data</option>
                  <option value="edit">✏️ Can Edit - Can modify data</option>
                  <option value="full">🔑 Full Access - Can view, edit & manage</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Message (Optional)</label>
                <textarea
                  value={inviteForm.message}
                  onChange={(e) => setInviteForm({ ...inviteForm, message: e.target.value })}
                  placeholder="Add a personal message..."
                  rows={3}
                  className="tm-input w-full px-4 py-2.5 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-green-200"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowInviteModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSendInvitation}
                disabled={loading || !inviteForm.email}
                className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Invitation
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TeamManagement;
