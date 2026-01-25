# Tactical Esports Tournament Platform

A full-featured esports tournament management platform built for tactical FPS games. Create teams, organize tournaments, and compete in a professional esports environment.

## Features

### 🎮 Tournament Management
- **Create & Host Tournaments** - Any registered user can create and manage their own tournaments
- **Flexible Team Sizes** - Support for 1v1 duels up to 5v5 squad battles
- **Multiple Bracket Types** - Single elimination, double elimination, round robin, and Swiss formats
- **Registration System** - Team registration with deadlines and check-in periods
- **Match Scheduling** - Automated match creation with dispute resolution system
- **Livestream Integration** - Embed YouTube/Twitch streams directly on tournament pages

### 👥 Team System
- **Squad Creation** - Create teams with custom names, tags, and logos
- **Member Management** - Invite players, assign roles (leader/member)
- **Team Profiles** - Showcase your squad with descriptions and branding

### 🎯 User Profiles
- **Operator Profiles** - Custom usernames, avatars, and bios
- **Gaming Stats** - Track your competitive statistics (JSONB storage for flexibility)
- **Tournament History** - View past and upcoming tournament participation

### 🛡️ Security & Authentication
- **Secure Auth** - Email-based authentication with auto-confirm
- **Row Level Security** - Data protected at the database level
- **Role-Based Access** - Tournament creators, team owners, and members have appropriate permissions

## How It Works

### For Players
1. **Enlist** - Create your operator profile with username and credentials
2. **Form a Squad** - Create or join a team with fellow players
3. **Register** - Sign up your team for open tournaments
4. **Compete** - Check in, play matches, and climb the brackets

### For Tournament Organizers
1. **Create Tournament** - Set name, game mode, team size, and bracket type
2. **Configure Details** - Add rules, prize pools, and registration deadlines
3. **Open Registration** - Let teams sign up before the deadline
4. **Manage Matches** - Update scores, resolve disputes, and crown champions

### Database Architecture
The platform uses a relational database with:
- `profiles` - User data linked to authentication
- `teams` & `team_members` - Squad management with roles
- `tournaments` - Event configuration and status tracking
- `tournament_registrations` - Team sign-ups with seeding
- `matches` - Bracket progression and scoring
- `match_disputes` - Fair play resolution system

## Tech Stack

- **Frontend**: React, Vite, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Lovable Cloud (Supabase)
- **Animation**: Framer Motion
- **Forms**: React Hook Form + Zod validation

## Getting Started

### Using Lovable
Visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

### Local Development

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to project directory
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm i

# Start development server
npm run dev
```

## Deployment

Open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click Share → Publish.

## Custom Domain

Navigate to Project > Settings > Domains to connect your own domain. Requires a paid Lovable plan.

Read more: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
