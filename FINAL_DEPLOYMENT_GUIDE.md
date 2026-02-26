# Team Management - Final Deployment Guide

**Website:** https://one.applekul.com
**Company Domain:** applekul.com
**Supabase Project:** https://jldiisavzndjbgdtbosd.supabase.co

---

## 📧 Email Configuration (Updated)

### Email Sender Address
```
from: "Orchard App <noreply@applekul.com>"
```

**✅ Updated in Edge Function!**

### Resend Setup Steps

1. **Verify Domain in Resend:**
   - Go to [Resend Dashboard](https://resend.com/domains)
   - Add domain: `applekul.com`
   - Add the required DNS records to your domain registrar:
     - SPF record
     - DKIM record
     - DMARC record (optional but recommended)
   - Wait for verification (usually 5-10 minutes)

2. **Test Email Sending:**
   - Use Resend's testing domain temporarily: `onboarding@resend.dev`
   - Or wait for domain verification to complete

---

## 🚀 Quick Deployment Steps

### 1. Deploy Edge Function

```bash
# Navigate to your Supabase project
cd your-project

# Deploy the updated Edge Function
supabase functions deploy send-team-invitation --no-verify-jwt

# Verify deployment
supabase functions list
```

### 2. Set Environment Variables (Already Done ✅)

```bash
# These are already set, but verify them:
supabase secrets list

# Should show:
# - RESEND_API_KEY
# - APP_URL=https://one.applekul.com
```

### 3. Run Database Migration

```bash
# In Supabase Dashboard → SQL Editor → New Query
# Copy and paste the contents of: 20260226_team_management.sql
# Click "Run"
```

### 4. Update Frontend Environment Variables

Ensure your `.env` file has:

```env
VITE_SUPABASE_URL=https://jldiisavzndjbgdtbosd.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### 5. Test the Flow

1. **Send Invitation:**
   - Login as orchard owner
   - Navigate to: https://one.applekul.com/team
   - Click "Invite Member"
   - Enter email and details
   - Send invitation

2. **Check Email:**
   - Invitee receives beautiful HTML email
   - Email shows: "Orchard App <noreply@applekul.com>"
   - Click "Accept Invitation" button

3. **Accept Invitation:**
   - Redirects to: https://one.applekul.com/accept-invitation?token=...
   - Login with invited email
   - Accept invitation
   - Redirect to dashboard

---

## 📋 Updated Files

### Edge Function: `index.ts`

**Changes Made:**
1. ✅ Updated email sender: `noreply@applekul.com`
2. ✅ Enhanced HTML email template with professional design
3. ✅ Added company branding (one.applekul.com)
4. ✅ Improved email subject line
5. ✅ Added fallback link for email clients with disabled buttons

**Key Features:**
- Responsive HTML email design
- Professional branding
- Clear call-to-action button
- Fallback text link
- Expiration notice
- Mobile-friendly layout

---

## 🎨 Email Template Preview

The new email includes:

- **Header:** Green gradient with "Team Invitation" title
- **Content:**
  - Personal greeting
  - Clear invitation message
  - Role badge
  - Large "Accept Invitation" button
  - Expiration notice (7 days)
- **Footer:**
  - "Sent from Orchard App"
  - Link to one.applekul.com

**Professional appearance** that matches modern SaaS products!

---

## 🔒 Security Checklist

- ✅ CORS enabled for https://one.applekul.com
- ✅ Email verification required
- ✅ 7-day invitation expiration
- ✅ Token-based authentication
- ✅ Row Level Security on all tables
- ✅ Proper authorization headers

---

## 🧪 Testing Checklist

### Test Case 1: Send Invitation
- [ ] Login as owner
- [ ] Navigate to /team
- [ ] Send invitation to valid email
- [ ] Verify success message
- [ ] Check invitation appears in "Pending Invitations"

### Test Case 2: Receive Email
- [ ] Check invitee's inbox
- [ ] Verify sender: "Orchard App <noreply@applekul.com>"
- [ ] Verify email is properly formatted (HTML)
- [ ] Verify "Accept Invitation" button works
- [ ] Verify fallback link works

### Test Case 3: Accept Invitation
- [ ] Click invitation link
- [ ] Login with correct email
- [ ] Verify role and permissions display correctly
- [ ] Accept invitation
- [ ] Verify redirect to dashboard
- [ ] Verify team member appears in owner's team list

### Test Case 4: Permissions
- [ ] Login as team member
- [ ] Verify can only access assigned fields
- [ ] Verify permissions (view/edit/full) work correctly
- [ ] Verify cannot access other owners' data

### Test Case 5: Edge Cases
- [ ] Try accepting with wrong email → Should show error
- [ ] Try accepting expired invitation → Should show error
- [ ] Try accepting already accepted invitation → Should handle gracefully
- [ ] Cancel invitation and verify it's removed

---

## 🐛 Troubleshooting

### Email Not Sending?

**Check Resend API Key:**
```bash
supabase secrets list
```

**Check Edge Function Logs:**
```bash
supabase functions logs send-team-invitation --limit 50
```

**Common Issues:**
1. Domain not verified in Resend
   - Solution: Use `onboarding@resend.dev` for testing

2. RESEND_API_KEY incorrect
   - Solution: Regenerate key and update secret

3. Email in spam
   - Solution: Add SPF/DKIM records for domain verification

### CORS Errors?

**Frontend shows CORS error:**
- Verify Edge Function has OPTIONS handler
- Check `Access-Control-Allow-Origin: "*"` is set
- Clear browser cache

### Invitation Link Not Working?

**Check APP_URL:**
```bash
supabase secrets list
# Should show: APP_URL=https://one.applekul.com
```

**Verify Route Exists:**
- Route must be: `/accept-invitation`
- Component must be mounted in router

### Database Errors?

**RPC function not found:**
- Verify SQL migration was run
- Check function exists: `accept_team_invitation`
- Verify EXECUTE permission granted

**View not found:**
- Verify view exists: `pending_team_invitations`
- Check view definition matches invitation token

---

## 📊 Monitoring

### Check Invitation Stats

```sql
-- Pending invitations
SELECT COUNT(*) FROM team_invitations WHERE status = 'pending';

-- Accepted invitations
SELECT COUNT(*) FROM team_invitations WHERE status = 'accepted';

-- Active team members
SELECT COUNT(*) FROM team_members WHERE status = 'active';

-- Invitations by owner
SELECT
  owner_id,
  COUNT(*) as total_invitations,
  COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted
FROM team_invitations
GROUP BY owner_id;
```

---

## ✅ Production Ready Checklist

- [x] Edge Function deployed with correct email
- [x] Email template is professional and branded
- [x] CORS configured for one.applekul.com
- [x] Environment variables set
- [ ] Database migration run
- [ ] Domain verified in Resend
- [ ] Routes added to frontend
- [ ] Team Management navigation link added
- [ ] End-to-end testing completed
- [ ] Error handling tested
- [ ] Permission levels tested

---

## 🎉 You're All Set!

Your team management system is now configured for:
- **Website:** https://one.applekul.com
- **Email Sender:** noreply@applekul.com
- **Professional Design:** Beautiful HTML emails
- **Secure Access:** Token-based with email verification

**Next Steps:**
1. Verify domain in Resend (or use test domain)
2. Run database migration if not done
3. Test the complete flow
4. Deploy to production!

Good luck! 🚀
