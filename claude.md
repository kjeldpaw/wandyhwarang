# Taekwondo Club Management System - Requirements & Design

## 1. Overview

This system manages users, belt rankings, and club memberships for a Taekwondo organization. It supports three user roles with different permission levels and tracks belt progression through the martial arts ranking system.

## 2. User Roles & Permissions

### 2.1 User (Standard Member)
- Can view only their own data
- Cannot edit HWA ID, Kukkiwon ID, or belt information
- Can update personal information (name, address, contact details)
- Can register for a new account

### 2.2 Master (Club Instructor)
- Can search and view all users
- Can edit user data for members of their own club
- Can add, edit, and delete belts for users in their club only
- Cannot change a user's club assignment
- Has all permissions of a standard user for their own profile

### 2.3 Admin (System Administrator)
- Can search and view all users across all clubs
- Can edit any user's data
- Can add, edit, and delete belts for any user
- Can change user club assignments
- Can delete users from the system
- Full system access

## 3. Data Models

### 3.1 User Entity
| Field | Type | Required | Editable By |
|-------|------|----------|-------------|
| Name | String | Yes | User, Master (same club), Admin |
| Address | String | Yes | User, Master (same club), Admin |
| Zip Code | String | Yes | User, Master (same club), Admin |
| City | String | Yes | User, Master (same club), Admin |
| Phone | String | Yes | User, Master (same club), Admin |
| Email | String | Yes | User, Master (same club), Admin |
| Club | Reference | Yes | Admin only |
| HWA ID | String | No | Admin only |
| Kukkiwon ID | String | No | Admin only |
| Role | Enum | Yes | Admin only |
| Password | Hashed String | Yes | User (own password) |

### 3.2 Belt Entity
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| User | Reference | Yes | Foreign key to User |
| Belt | Enum | Yes | Belt rank (see section 3.3) |
| Graduation Date | Date | Yes | Date when belt was awarded |

**Relationship:** One User can have multiple Belts (one-to-many)

### 3.3 Belt Ranking System (Enum)
Belt ranks in order from beginner to master:

**Kup Grades (Color Belts):**
- 10. Kup
- 9. Kup
- 8. Kup
- 7. Kup
- 6. Kup
- 5. Kup
- 4. Kup
- 3. Kup
- 2. Kup
- 1. Kup

**Dan Grades (Black Belts):**
- 1. DAN
- 2. DAN
- 3. DAN
- 4. DAN
- 5. DAN
- 6. DAN
- 7. DAN
- 8. DAN
- 9. DAN

### 3.4 Club Entity
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Name | String | Yes | Club name |
| Location | String | No | Club location |

## 4. Authentication & Authorization

### 4.1 User Registration Flow
1. User navigates to registration page (accessible from login page)
2. User enters email address
3. System sends confirmation email with unique registration link
4. User clicks link in email to access confirmation page
5. User sets password on confirmation page
6. Account is created with role "user"
7. User can now log in

### 4.2 Password Reset Flow
1. User clicks "Forgot Password" on login page
2. User enters email address
3. System sends password reset email with unique reset link
4. User clicks link in email
5. User enters new password
6. Password is updated
7. User can log in with new password

### 4.3 Authentication Requirements
- All users must log in to access the system
- Passwords must be securely hashed
- Email confirmation required for new registrations
- Session management for logged-in users

## 5. Functional Requirements

### 5.1 User Management
- **FR-1:** System shall support user registration with email confirmation
- **FR-2:** Users shall be able to view and edit their own profile data
- **FR-3:** Masters shall be able to search and view all users
- **FR-4:** Masters shall be able to edit user data for members of their club
- **FR-5:** Admins shall be able to search, view, edit, and delete any user
- **FR-6:** Admins shall be able to change user club assignments

### 5.2 Belt Management
- **FR-7:** Users can have multiple belt records (history tracking)
- **FR-8:** Each belt record must include belt rank and graduation date
- **FR-9:** Masters can add, edit, and delete belts for users in their club
- **FR-10:** Admins can add, edit, and delete belts for any user
- **FR-11:** Standard users cannot modify their own belt information

### 5.3 Access Control
- **FR-12:** Users can only view their own data
- **FR-13:** Masters cannot change user club assignments
- **FR-14:** Only admins can set HWA ID and Kukkiwon ID
- **FR-15:** Only admins can delete users

### 5.4 Email Notifications
- **FR-16:** System shall send confirmation email for new registrations
- **FR-17:** System shall send password reset email when requested
- **FR-18:** Email links shall be unique and time-limited

## 6. Business Rules

### BR-1: Belt History
- Users maintain a complete history of all belts earned
- Belt records are not deleted when a new belt is awarded
- Each belt has a graduation date for tracking progression

### BR-2: Club Association
- Each user belongs to exactly one club
- Masters can only manage users from their own club
- Only admins can change club assignments

### BR-3: Official IDs
- HWA ID and Kukkiwon ID are optional fields
- Only admins can set or modify these official identifiers
- These IDs are managed separately from user registration

### BR-4: Role Assignment
- New registrations automatically receive "user" role
- Role changes must be performed by system admin (outside current scope)

## 7. User Interface Considerations

### 7.1 Login Page
- Email and password fields
- "Forgot Password" link
- "Register New Account" link

### 7.2 User Dashboard (Role: User)
- View personal profile
- Edit personal information (excluding HWA ID, Kukkiwon ID, belts)
- View belt history

### 7.3 Master Dashboard
- Search users by club
- View and edit user profiles (same club only)
- Manage belt records for club members

### 7.4 Admin Dashboard
- Search all users across all clubs
- Full user management capabilities
- Belt management for all users
- User deletion capability

## 8. Technical Considerations

### 8.1 Security
- Passwords must be hashed using modern algorithms (bcrypt, Argon2)
- Email confirmation tokens must be cryptographically secure
- Password reset tokens must expire after reasonable time period
- Session management with secure cookies
- HTTPS required for all communications

### 8.2 Data Validation
- Email format validation
- Required field validation
- Belt enum validation
- Date format validation for graduation dates

### 8.3 Database Design
- Proper foreign key relationships
- Indexes on frequently searched fields (email, club)
- Audit trail for belt changes (optional enhancement)
