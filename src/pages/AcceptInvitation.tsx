/**
 * AcceptInvitation.tsx — Accept Team Invitation Page
 *
 * Allows invited users to:
 * - View invitation details
 * - Accept or reject the invitation
 * - See who invited them and what permissions they'll get
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  UserPlus,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  Building,
  Mail,
  Phone,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

interface InvitationDetails {
  id: string;
  owner_id: string;
  invitee_email: string;
  invitee_phone?: string;
  role: string;
  permissions: string;
  invitation_token: string;
  invited_at: string;
  expires_at: string;
  message?: string;
  owner_name?: string;
  owner_email?: string;
  owner_farm_name?: string;
  owner_avatar?: string;
}

const AcceptInvitation: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { session, user } = useAuth();

  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      fetchInvitation();
    } else {
      setError('No invitation token provided');
      setLoading(false);
    }
  }, [token]);

  const fetchInvitation = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('pending_team_invitations')
        .select('*')
        .eq('invitation_token', token)
        .single();

      if (fetchError) throw fetchError;

      if (!data) {
        setError('Invitation not found or has expired');
        return;
      }

      // Check if invitation has expired
      if (new Date(data.expires_at) < new Date()) {
        setError('This invitation has expired');
        return;
      }

      setInvitation(data);
    } catch (err: any) {
      console.error('Error fetching invitation:', err);
      setError('Failed to load invitation details');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async () => {
    if (!session?.user || !invitation) {
      setError('You must be logged in to accept invitations');
      return;
    }

    // Verify email matches
    if (user?.email?.toLowerCase() !== invitation.invitee_email.toLowerCase()) {
      setError(`This invitation was sent to ${invitation.invitee_email}. Please log in with that account.`);
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Call the accept_team_invitation function
      const { data, error: acceptError } = await supabase
        .rpc('accept_team_invitation', {
          _invitation_id: invitation.id,
          _user_id: session.user.id
        });

      if (acceptError) throw acceptError;

      setSuccess(true);

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err: any) {
      console.error('Error accepting invitation:', err);
      setError(err.message || 'Failed to accept invitation');
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectInvitation = async () => {
    if (!session?.user || !invitation) return;

    if (!confirm('Are you sure you want to reject this invitation?')) return;

    setProcessing(true);
    setError(null);

    try {
      const { error: rejectError } = await supabase
        .from('team_invitations')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', invitation.id);

      if (rejectError) throw rejectError;

      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err: any) {
      console.error('Error rejecting invitation:', err);
      setError(err.message || 'Failed to reject invitation');
    } finally {
      setProcessing(false);
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'manager':
        return 'Can manage fields, workers, and perform administrative tasks';
      case 'worker':
        return 'Can perform field tasks and basic operations';
      default:
        return 'Team member';
    }
  };

  const getPermissionDescription = (permissions: string) => {
    switch (permissions) {
      case 'view':
        return '👁️ View Only - Can see data but cannot make changes';
      case 'edit':
        return '✏️ Can Edit - Can view and modify data';
      case 'full':
        return '🔑 Full Access - Complete control over assigned areas';
      default:
        return 'Limited access';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Success!</h2>
          <p className="text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h2>
          <p className="text-gray-600 mb-6">{error || 'Invitation not found'}</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-all"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-8 text-white">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <UserPlus className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Team Invitation</h1>
              <p className="text-green-100">You've been invited to join a team</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Invitation From */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Invitation From</h2>
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md">
                {invitation.owner_name?.charAt(0).toUpperCase() || '?'}
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900 text-lg">{invitation.owner_name || 'Unknown'}</p>
                {invitation.owner_farm_name && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                    <Building className="w-4 h-4" />
                    {invitation.owner_farm_name}
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                  <Mail className="w-4 h-4" />
                  {invitation.owner_email}
                </div>
              </div>
            </div>
          </div>

          {/* Role & Permissions */}
          <div className="mb-8 grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <p className="font-semibold text-blue-900">Your Role</p>
              </div>
              <p className="text-2xl font-bold text-blue-700 capitalize">{invitation.role}</p>
              <p className="text-sm text-blue-600 mt-1">{getRoleDescription(invitation.role)}</p>
            </div>

            <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <p className="font-semibold text-green-900">Permissions</p>
              </div>
              <p className="text-sm text-green-700 font-medium mt-2">
                {getPermissionDescription(invitation.permissions)}
              </p>
            </div>
          </div>

          {/* Personal Message */}
          {invitation.message && (
            <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="font-semibold text-amber-900 mb-2">Message from {invitation.owner_name}</p>
              <p className="text-gray-700 italic">"{invitation.message}"</p>
            </div>
          )}

          {/* Invitation Details */}
          <div className="mb-8 space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Invited on {new Date(invitation.invited_at).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Expires on {new Date(invitation.expires_at).toLocaleDateString()}</span>
            </div>
            {invitation.invitee_phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>{invitation.invitee_phone}</span>
              </div>
            )}
          </div>

          {/* Email Verification Notice */}
          {session?.user && user?.email?.toLowerCase() !== invitation.invitee_email.toLowerCase() && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-red-800">Email Mismatch</p>
                <p className="text-red-600">
                  This invitation was sent to <strong>{invitation.invitee_email}</strong>.
                  You are currently logged in as <strong>{user?.email}</strong>.
                  Please log out and sign in with the correct account to accept this invitation.
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={handleRejectInvitation}
              disabled={processing || !session?.user}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Decline
            </button>
            <button
              onClick={handleAcceptInvitation}
              disabled={processing || !session?.user || user?.email?.toLowerCase() !== invitation.invitee_email.toLowerCase()}
              className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Accept Invitation
                </>
              )}
            </button>
          </div>

          {!session?.user && (
            <p className="text-center text-sm text-gray-500 mt-4">
              Please{' '}
              <button onClick={() => navigate('/login')} className="text-green-600 hover:text-green-700 font-semibold">
                log in
              </button>{' '}
              to accept this invitation
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AcceptInvitation;
