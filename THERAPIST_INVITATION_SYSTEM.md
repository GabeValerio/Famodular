# Therapist Invitation System

This document explains how the therapist invitation system works, including the required database tables and the short code URL mechanism.

## Overview

The therapist invitation system allows clinic owners to:
- Invite therapists to join their clinic
- Generate user-friendly registration links with short codes
- Track invitation status (pending, accepted, expired)
- Enforce subscription-based limits

## Required Database Tables

### `clinic_invitations` Table

The core table storing all invitation data:

```sql
CREATE TABLE clinic_invitations (
  id SERIAL PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id),
  invited_by_user_id UUID NOT NULL REFERENCES users(id),
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  job_title VARCHAR(255),
  invite_token VARCHAR(64) NOT NULL,
  short_code VARCHAR(20) UNIQUE,
  target_role VARCHAR(50) NOT NULL CHECK (target_role IN ('clinic_owner', 'therapist')),
  status VARCHAR(20) DEFAULT 'pending',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  clinic_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_clinic_invitations_short_code ON clinic_invitations(short_code);
CREATE INDEX idx_clinic_invitations_email ON clinic_invitations(email);
CREATE INDEX idx_clinic_invitations_status ON clinic_invitations(status);
```

**Key Columns:**
- `short_code`: 8-character user-friendly code used in registration URLs (e.g., "ABC12345")
- `invite_token`: 64-character hex token for secure validation (backward compatibility)
- `target_role`: Set to 'therapist' for therapist invitations
- `status`: 'pending', 'accepted', or 'expired'
- `expires_at`: Invitation expires 7 days after creation

### Related Tables

The system also requires these existing tables:
- `clinics`: Stores clinic information
- `users`: Stores user accounts
- `therapists`: Stores therapist records linked to clinics
- `clinic_owners`: Links users to clinics as owners

## Short Code Generation

The short code is an 8-character alphanumeric code used in registration URLs. It excludes confusing characters (0, O, I, 1) for better user experience.

### Implementation

```javascript
const crypto = require('crypto');

// Generate secure 64-character hex token (for backward compatibility)
const generateInviteToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Generate unique 8-character short code
const generateShortCode = async (db) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars like 0, O, I, 1
  let code;
  let isUnique = false;
  
  while (!isUnique) {
    code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const existing = await db.query(
      'SELECT id FROM clinic_invitations WHERE short_code = $1',
      [code]
    );
    if (existing.rows.length === 0) {
      isUnique = true;
    }
  }
  
  return code;
};
```

**Short Code Characteristics:**
- **Length:** 8 characters
- **Format:** Uppercase alphanumeric (excludes 0, O, I, 1)
- **Uniqueness:** Guaranteed by database check
- **Usage:** Displayed in registration URLs

## Registration URL Format

The registration link uses the short code as a URL parameter:

```
https://yourdomain.com/register?invite=ABC12345
```

**URL Structure:**
- Base URL: `process.env.FRONTEND_URL` or `http://localhost:3000`
- Path: `/register`
- Query Parameter: `invite={short_code}`

### Example Implementation

```javascript
// Generate registration link
const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
const registrationLink = `${baseUrl}/register?invite=${shortCode}`;
```

## Complete Invitation Flow

### 1. Create Invitation

**Endpoint:** `POST /clinic-owner/invitations`

**Request Body:**
```json
{
  "email": "therapist@example.com",
  "full_name": "Jane Smith",
  "job_title": "Licensed Therapist",
  "target_role": "therapist"
}
```

**Process:**
1. Validate `target_role` is 'therapist'
2. Get clinic_id for the current user
3. Check subscription limits (if applicable)
4. Check for duplicate pending invitations
5. Check if email already has therapist role at this clinic
6. Generate `invite_token` (64-char hex)
7. Generate `short_code` (8-char alphanumeric)
8. Set expiration to 7 days from now
9. Insert invitation record
10. Return invitation with registration link

**Response:**
```json
{
  "invitation": {
    "id": 123,
    "email": "therapist@example.com",
    "full_name": "Jane Smith",
    "job_title": "Licensed Therapist",
    "target_role": "therapist",
    "expires_at": "2024-01-15T12:00:00Z",
    "status": "pending"
  },
  "registration_link": "https://app.example.com/register?invite=ABC12345"
}
```

### 2. Validate Invitation

**Endpoint:** `GET /clinic-owner/invitations/validate/:token`

**Process:**
1. Look up invitation by `short_code` or `invite_token`
2. Check if invitation exists
3. Validate expiration date
4. Check if already accepted
5. Return invitation details if valid

**Response:**
```json
{
  "invitation": {
    "id": 123,
    "email": "therapist@example.com",
    "full_name": "Jane Smith",
    "job_title": "Licensed Therapist",
    "target_role": "therapist",
    "clinic_name": "Example Clinic",
    "expires_at": "2024-01-15T12:00:00Z"
  }
}
```

### 3. Register with Invitation

**Endpoint:** `POST /auth/register`

**Request Body:**
```json
{
  "email": "therapist@example.com",
  "password": "securepassword",
  "full_name": "Jane Smith",
  "invite_token": "ABC12345"
}
```

**Process:**
1. Validate invitation (tries `short_code` first, falls back to `invite_token`)
2. Validate email matches invitation email
3. Check expiration
4. Check if already accepted
5. Hash password
6. Create user account with role 'therapist'
7. Create therapist record linked to clinic
8. Mark invitation as accepted
9. Generate JWT token
10. Return user data and token

**Response:**
```json
{
  "message": "User registered successfully with invitation",
  "token": "jwt_token_here",
  "user": {
    "id": "uuid",
    "email": "therapist@example.com",
    "full_name": "Jane Smith",
    "role": "therapist",
    "clinic_id": "uuid",
    "clinic_name": "Example Clinic"
  }
}
```

## Key Implementation Details

### Invitation Creation Code

```javascript
const createTherapistInvitation = async (req, res) => {
  const { userId } = req.user;
  const { email, full_name, job_title, target_role = 'therapist' } = req.body;

  try {
    // Get clinic_id for current user
    const clinicResult = await db.query(
      'SELECT clinic_id FROM clinic_owners WHERE user_id = $1',
      [userId]
    );

    if (clinicResult.rows.length === 0) {
      return res.status(404).json({ error: 'Clinic not found for this user' });
    }

    const clinicId = clinicResult.rows[0].clinic_id;

    // Check for duplicate pending invitations
    const existingInvite = await db.query(`
      SELECT * FROM clinic_invitations
      WHERE email = $1 
        AND clinic_id = $2 
        AND target_role = $3 
        AND status = 'pending' 
        AND expires_at > CURRENT_TIMESTAMP
    `, [email, clinicId, target_role]);

    if (existingInvite.rows.length > 0) {
      return res.status(400).json({ 
        error: `An invitation for this email already exists for role: ${target_role}` 
      });
    }

    // Check if email already has therapist role at this clinic
    const existingTherapist = await db.query(`
      SELECT * FROM therapists 
      WHERE email = $1 AND clinic_id = $2
    `, [email, clinicId]);

    if (existingTherapist.rows.length > 0) {
      return res.status(400).json({ 
        error: 'This email is already a therapist at this clinic' 
      });
    }

    // Generate tokens
    const inviteToken = generateInviteToken();
    const shortCode = await generateShortCode(db);
    
    // Set expiration (7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create invitation
    const result = await db.query(`
      INSERT INTO clinic_invitations (
        clinic_id, invited_by_user_id, email, full_name, job_title,
        invite_token, short_code, expires_at, target_role
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [clinicId, userId, email, full_name, job_title, inviteToken, shortCode, expiresAt, target_role]);

    const invitation = result.rows[0];

    // Generate registration link
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const registrationLink = `${baseUrl}/register?invite=${shortCode}`;

    res.json({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        full_name: invitation.full_name,
        job_title: invitation.job_title,
        target_role: invitation.target_role,
        expires_at: invitation.expires_at,
        status: invitation.status
      },
      registration_link: registrationLink
    });

  } catch (error) {
    console.error('Error creating invitation:', error);
    res.status(500).json({ error: 'Failed to create invitation' });
  }
};
```

### Registration with Invitation Code

```javascript
const registerWithInvitation = async (req, res) => {
  const { email, password, full_name, invite_token } = req.body;

  try {
    // Validate invitation - try short_code first, then fall back to invite_token
    const invitationResult = await db.query(`
      SELECT ci.*, c.name as clinic_name
      FROM clinic_invitations ci
      LEFT JOIN clinics c ON ci.clinic_id = c.id
      WHERE (ci.short_code = $1 OR ci.invite_token = $1) AND ci.email = $2
    `, [invite_token, email]);

    if (invitationResult.rows.length === 0) {
      return res.status(400).json({ 
        error: 'Invalid invitation token or email mismatch' 
      });
    }

    const invitation = invitationResult.rows[0];

    // Check expiration
    if (new Date() > new Date(invitation.expires_at)) {
      await db.query(
        'UPDATE clinic_invitations SET status = $1 WHERE id = $2',
        ['expired', invitation.id]
      );
      return res.status(400).json({ error: 'Invitation has expired' });
    }

    // Check if already accepted
    if (invitation.status === 'accepted') {
      return res.status(400).json({ 
        error: 'Invitation has already been accepted' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user with therapist role
    const newUser = await db.query(
      'INSERT INTO users (email, hashed_password, full_name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, full_name, role',
      [email, hashedPassword, full_name, 'therapist']
    );

    // Create therapist record
    const nameParts = invitation.full_name.split(' ');
    const firstName = nameParts[0] || '';
    const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : '';
    const lastName = nameParts.length > 1 ? nameParts.slice(-1)[0] : '';

    await db.query(
      'INSERT INTO therapists (user_id, clinic_id, first_name, middle_name, last_name, email, role, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [newUser.rows[0].id, invitation.clinic_id, firstName, middleName, lastName, email, 'Therapist', 'Active']
    );

    // Mark invitation as accepted
    await db.query(
      'UPDATE clinic_invitations SET status = $1, accepted_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['accepted', invitation.id]
    );

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: newUser.rows[0].id,
        email: newUser.rows[0].email,
        role: 'therapist',
        clinic_id: invitation.clinic_id
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully with invitation',
      token,
      user: {
        ...newUser.rows[0],
        clinic_id: invitation.clinic_id,
        clinic_name: invitation.clinic_name
      }
    });

  } catch (error) {
    console.error('Error registering with invitation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
```

## Security Considerations

1. **Token Security:**
   - Long tokens (64-char hex) are cryptographically secure
   - Short codes are unique but not cryptographically secure (acceptable for user-facing URLs)
   - Both tokens are validated on registration

2. **Email Validation:**
   - Registration requires email to match invitation email
   - Prevents token theft/abuse

3. **Expiration:**
   - All invitations expire after 7 days
   - Expired invitations are automatically marked

4. **Status Tracking:**
   - Invitations can only be used once
   - Status is checked before registration

5. **Authorization:**
   - Only clinic owners can create invitations
   - Invitations are scoped to specific clinics

## Environment Variables

```env
FRONTEND_URL=https://app.example.com
JWT_SECRET=your-secret-key
```

## Summary

**Required Table:**
- `clinic_invitations` with `short_code` column (VARCHAR(20) UNIQUE)

**Short Code:**
- 8 characters, uppercase alphanumeric (excludes 0, O, I, 1)
- Generated using `generateShortCode()` function
- Stored in database with UNIQUE constraint

**URL Format:**
- `{FRONTEND_URL}/register?invite={short_code}`
- Example: `https://app.example.com/register?invite=ABC12345`

**Flow:**
1. Owner creates invitation → generates short code → returns registration link
2. Invitee clicks link → validates invitation → registers → creates therapist record
