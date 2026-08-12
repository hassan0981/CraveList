# CRAVELIST — COMPLETE FRONTEND UI + NAVIGATION MASTER SPECIFICATION

## 1. PROJECT OBJECTIVE

Build the complete **CraveList mobile application frontend** using the existing Expo + React Native + TypeScript project.

The purpose of this phase is strictly:

* Frontend UI
* All defined application screens
* Screen-to-screen navigation
* Navigation states
* Touch interactions
* Scroll behavior
* Buttons and interactive UI
* Animations
* Dark mode
* Light mode
* Responsive mobile layouts
* Mock/static frontend data where required

### IMPORTANT

Do **NOT** implement backend functionality in this phase.

Do NOT implement:

* Real database integration
* Real authentication
* Real API calls
* Real Google Places integration
* Real chat backend
* Real push notification backend
* Real geofencing
* Real Firebase integration
* Real Supabase integration
* Real restaurant API
* Real friend system backend

The application should, however, **look and behave like a complete real product from the frontend perspective**.

Use realistic mock data wherever actual data would normally come from a backend.

---

# 2. CORE DESIGN PHILOSOPHY

CraveList should feel like a **premium modern restaurant discovery and memory application**, not like a generic AI-generated mobile application.

The most important design requirement is:

> THE UI MUST NOT LOOK AI-GENERATED.

Avoid:

* Excessive neon colors
* Overly bright gradients
* Generic purple/blue AI gradients
* Excessive glassmorphism
* Huge glowing buttons
* Excessive shadows
* Random decorative elements
* Over-rounded cards everywhere
* Generic template-style layouts
* Unnecessary animations
* Visually noisy screens

The design should feel:

* Premium
* Mature
* Editorial
* Minimal
* Warm
* Modern
* Human-designed
* Restaurant/lifestyle oriented
* Sophisticated
* Easy to understand
* Visually consistent

The app should feel like something that could realistically be released as a polished App Store / Google Play product.

---

# 3. DESIGN LANGUAGE

Use **Space Grotesk** as the primary typography system.

Typography should have a clear hierarchy:

### Large headings

Space Grotesk — bold/semi-bold

### Section headings

Space Grotesk — semi-bold

### Body

Space Grotesk — regular/medium

### Small metadata

Space Grotesk — medium

### Distances / location metadata

A slightly more technical treatment can be used while remaining visually consistent.

Do not use too many font weights.

Maintain consistent:

* Font sizes
* Line heights
* Letter spacing
* Margins
* Padding
* Component spacing

---

# 4. COLOR SYSTEM

Create a carefully designed custom color system for CraveList.

The application must support:

## DARK MODE

Dark mode should NOT simply be black.

Use a sophisticated warm/dark neutral palette.

The background should feel deep and premium.

Suggested direction:

* Deep charcoal background
* Slight warm undertone
* Dark elevated surfaces
* Muted borders
* Warm primary accent
* Soft secondary accent
* Natural success/visited color

Example direction:

```text
Background:
#14171C

Surface:
#1D2229

Elevated Surface:
#242A32

Primary:
#D4A24C

Primary Soft:
#E0B96C

Visited / Success:
#7A9E7E

Primary Text:
#F4F1E8

Secondary Text:
#A8AAA6

Muted Text:
#777B78

Border:
#30353C
```

These are starting references, not rigid requirements.

The final implementation should refine the palette so that all colors work harmoniously.

---

# 5. LIGHT MODE

Light mode must have its own carefully designed palette.

Do NOT simply invert the dark theme.

Light mode should feel:

* Warm
* Elegant
* Soft
* Premium
* Comfortable
* Easy to read

Suggested direction:

```text
Background:
#EDEBE3

Surface:
#F6F3EB

Elevated Surface:
#FFFFFF

Primary:
#B88732

Primary Soft:
#D4A24C

Visited:
#6B8F71

Primary Text:
#20231F

Secondary Text:
#656862

Muted Text:
#8C8E88

Border:
#DDD9CF
```

Again, refine these values if necessary for better visual harmony and accessibility.

---

# 6. GRADIENT SYSTEM

Gradients may be used, but only as a **subtle visual enhancement**.

Never use loud or neon gradients.

Avoid:

* Neon pink
* Neon purple
* Neon blue
* Cyberpunk gradients
* Strong rainbow gradients

Use subtle gradients derived from the application's existing colors.

For example:

Dark mode:

```text
Deep charcoal
→
slightly warmer charcoal
→
very subtle muted gold influence
```

Light mode:

```text
Warm ivory
→
soft cream
→
very subtle muted gold influence
```

Gradients can be used for:

* Hero sections
* Selected states
* Map overlays
* Special cards
* Empty states
* Background decoration

But gradients should remain subtle enough that the UI still feels natural.

---

# 7. DARK / LIGHT MODE

The complete application must support:

```text
Dark Mode
Light Mode
```

The theme should be controlled globally.

Create a clean theme system instead of hardcoding colors inside every screen.

For example:

```text
theme/
├── colors
├── typography
├── spacing
├── radius
└── shadows
```

All screens should consume the theme values.

Do NOT write random colors directly throughout individual screens.

---

# 8. APPEARANCE SETTING

Inside:

```text
Settings
→
Appearance & Settings
```

provide a clear theme control.

The user should be able to switch between:

```text
Light
Dark
```

The change should immediately update the UI.

The toggle should have:

* Smooth transition
* Clear selected state
* Appropriate icon
* Proper accessibility
* No unnecessary animation

The entire application must respond consistently to the selected theme.

---

# 9. GLOBAL SPACING SYSTEM

Use a consistent spacing system throughout the application.

Example:

```text
4
8
12
16
20
24
32
40
48
64
```

Do not randomly use different spacing values everywhere.

Cards, sections, buttons and lists should follow a consistent visual rhythm.

---

# 10. GLOBAL COMPONENT SYSTEM

Create reusable components where appropriate.

Examples:

```text
components/
├── AppButton
├── IconButton
├── SearchBar
├── RestaurantCard
├── FriendCard
├── Avatar
├── SectionHeader
├── BottomSheet
├── EmptyState
├── NotificationCard
├── PlanCard
├── MemoryCard
├── StatCard
├── ThemeToggle
└── ScreenHeader
```

However:

### IMPORTANT

Do not over-engineer the component system.

Create reusable components when they genuinely improve consistency or readability.

Do not create dozens of tiny components that make the code difficult to understand.

The code should remain:

* Simple
* Straightforward
* Readable
* Maintainable
* Beginner-friendly
* Professional

---

# 11. CODE STYLE

The code must be easy to understand.

Prefer:

```text
Simple component
↓
Clear state
↓
Clear styles
↓
Clear navigation
```

Avoid unnecessary:

* Design patterns
* Abstractions
* Generic factories
* Complicated hooks
* Deep state management
* Over-engineered architecture

Use comments throughout important parts of the code.

Comments should explain:

* What the section does
* Why an interaction exists
* What navigation action occurs
* What mock data represents
* What a complex animation is doing

Do NOT comment every single obvious line.

Comments should be useful.

---

# 12. FINAL SCREEN ARCHITECTURE

The final frontend contains these 18 core screens.

## AUTH

### 1. Login

### 2. Register

### 3. Forgot Password

### 4. Onboarding

## MAIN

### 5. Home

### 6. My Cravings

### 7. Trail

### 8. Friends

### 9. Profile

## RESTAURANT

### 10. Save Place

### 11. Restaurant Details

### 12. Search Results

### 13. Proximity Alert

## SOCIAL

### 14. User Profile

### 15. Shared Cravings

### 16. Chat

### 17. Notifications

### 18. Plans

## MEMORIES

### 19. Visit / Check-in

## SETTINGS

### 20. Appearance & Settings

IMPORTANT:

The above represents **20 named frontend destinations** when every item is counted individually.

Do not arbitrarily add additional full screens.

If a feature can naturally exist as:

* Modal
* Bottom sheet
* Dialog
* Overlay
* Inline state

use that approach instead of unnecessarily creating another full navigation destination.

---

# 13. ROOT NAVIGATION

Use a clear navigation hierarchy.

The navigation should conceptually follow:

```text
APP
│
├── AUTH
│   ├── Login
│   ├── Register
│   ├── Forgot Password
│   └── Onboarding
│
└── MAIN APPLICATION
    │
    ├── Home
    ├── My Cravings
    ├── Trail
    ├── Friends
    └── Profile
```

The authenticated application should use a clear primary navigation system.

The primary navigation should make it easy to move between:

```text
Home
My Cravings
Trail
Friends
Profile
```

A bottom tab/navigation system is preferred for these primary destinations.

---

# 14. SECONDARY NAVIGATION

Secondary screens should be opened from their relevant parent screen.

Examples:

```text
Home
→ Search Results
→ Restaurant Details
→ Save Place
→ Proximity Alert
→ Visit / Check-in
```

```text
Friends
→ User Profile
→ Shared Cravings
→ Chat
→ Plans
```

```text
Profile
→ Appearance & Settings
```

```text
My Cravings
→ Restaurant Details
→ Visit / Check-in
```

---

# 15. NAVIGATION PRINCIPLES

Navigation must remain extremely simple.

Every screen should have an obvious way to:

* Go back
* Close a modal
* Return to the main application
* Navigate to related content

Use standard mobile navigation behavior.

For secondary pages:

```text
Back button
```

For primary pages:

```text
Bottom navigation
```

For temporary interactions:

```text
Bottom sheet / modal / overlay
```

Do not create confusing navigation loops.

---

# 16. AUTHENTICATION FLOW

Frontend-only flow:

```text
Onboarding
   ↓
Login
   ↓
Home
```

Alternative:

```text
Onboarding
   ↓
Register
   ↓
Home
```

Login should also provide:

```text
Forgot Password
```

Flow:

```text
Login
 ↓
Forgot Password
 ↓
Reset confirmation UI
 ↓
Back to Login
```

Since backend is not implemented, use mock interactions.

Example:

```text
"Login" button
→
Home
```

Do not attempt real authentication.

---

# 17. ONBOARDING

Create a polished onboarding experience.

It should explain CraveList's core idea:

```text
Discover places
Save your cravings
Follow your trail
Get notified when you're nearby
Create memories
Share with friends
```

Use multiple onboarding slides if appropriate.

Animations should be subtle.

Navigation:

```text
Next
Skip
Get Started
```

The final action should take the user to Login/Register.

---

# 18. HOME SCREEN

Home is the primary experience.

It should be map-centric.

Main elements:

```text
Greeting
Location
Search
Map
Nearby saved places
Craving markers
Quick summary
Nearby recommendations
```

The map should visually integrate with the application's theme.

Do not make the map excessively colorful.

Dark mode should have a dark map aesthetic.

Light mode should have a warm/light map aesthetic where possible.

Use realistic mock restaurant locations.

Interaction examples:

```text
Tap restaurant marker
→ Restaurant Details
```

```text
Search
→ Search Results
```

```text
Nearby saved restaurant
→ Proximity Alert
```

---

# 19. MY CRAVINGS

This screen represents the user's saved restaurant collection.

Include:

* Restaurant cards
* Restaurant image
* Restaurant name
* Category
* Distance
* Location
* Saved state
* Visited state
* Filters
* Search/sort if appropriate

Tap:

```text
Restaurant Card
→ Restaurant Details
```

Use empty state when there are no saved cravings.

---

# 20. TRAIL

Trail represents the user's journey through saved and visited places.

The design should communicate:

```text
Where I saved
↓
Where I went
↓
What I experienced
```

Include:

* Timeline
* Restaurant locations
* Visit states
* Distances
* Dates
* Memory indicators

The visual language should feel like a journey/trail rather than a generic list.

---

# 21. FRIENDS

Friends screen should show:

* Friends
* Avatars
* Recent activity
* Shared cravings
* Plans
* Friend actions

Navigation:

```text
Friend
→ User Profile
```

```text
Shared craving
→ Shared Cravings
```

```text
Chat
→ Chat
```

```text
Plan
→ Plans
```

Use mock social data.

---

# 22. PROFILE

Profile should include:

* Avatar
* Name
* Username
* Statistics
* Saved places
* Visited places
* Memories
* Friends
* Activity summary

Include clear navigation to:

```text
Appearance & Settings
```

---

# 23. SAVE PLACE

This should be a focused save interaction.

The user should be able to:

* See restaurant
* Confirm save
* Add optional category/note
* Confirm

The experience should be quick.

Avoid turning a simple save action into a complicated form.

---

# 24. RESTAURANT DETAILS

This is one of the most important screens.

Include:

* Restaurant image
* Restaurant name
* Category
* Rating
* Address
* Distance
* Opening status mock
* Description
* Map/location
* Save button
* Visit/check-in action
* Shared/social information where appropriate

Navigation:

```text
Save
→ Save Place
```

```text
Check In
→ Visit / Check-in
```

---

# 25. SEARCH RESULTS

Search should feel fast and clean.

Include:

```text
Search input
Filters
Restaurant results
Distance
Category
Save state
```

Interaction:

```text
Search Result
→ Restaurant Details
```

---

# 26. PROXIMITY ALERT

This represents the core CraveList concept.

When a user is near a saved restaurant, show a premium alert experience.

Example:

```text
You're near somewhere
you wanted to try.

[Restaurant]

250m away

Want to check it out?
```

Actions:

```text
View Place
Dismiss
```

The visual design should be noticeable but NOT neon or aggressive.

---

# 27. USER PROFILE

This is different from the user's own Profile.

It represents another user/friend.

Show:

* Avatar
* Name
* Username
* Stats
* Saved/shared cravings
* Recent activity
* Friendship state
* Chat action

Navigation:

```text
Chat
→ Chat
```

```text
Shared Cravings
→ Shared Cravings
```

---

# 28. SHARED CRAVINGS

Show restaurants/cravings shared between users.

Include:

* Restaurant cards
* Who saved it
* Shared date
* Visit status
* Plan status

Tap:

```text
Restaurant
→ Restaurant Details
```

---

# 29. CHAT

Create a realistic frontend chat interface.

Include:

* Header
* User avatar
* Messages
* Message bubbles
* Timestamp
* Text input
* Send button

Use mock messages.

No real backend messaging.

The interaction should still feel real.

---

# 30. NOTIFICATIONS

Include:

* Friend activity
* Shared craving activity
* Plans
* Proximity notifications
* Visit/memory notifications

Each notification should have a clear type and timestamp.

Use different visual treatment where useful, but maintain the same design system.

---

# 31. PLANS

Plans allow friends to organize restaurant visits.

Frontend-only examples:

```text
Dinner at X
Saturday
8:00 PM
3 friends
```

Include:

* Restaurant
* Date
* Time
* Participants
* Plan status
* Actions

Use mock interactions.

---

# 32. VISIT / CHECK-IN

This is the memory creation experience.

Include:

```text
Restaurant
Visit confirmation
Photo/memory area
Optional note
Check-in button
```

The user should feel that they are recording an actual experience.

The photo area can use a frontend placeholder/mock image during this phase.

After check-in:

```text
Check-in complete
→ Trail / Restaurant Details
```

---

# 33. APPEARANCE & SETTINGS

Include:

### Appearance

```text
Light
Dark
```

Theme should change immediately.

Other frontend settings can include:

* Notifications
* Location preference
* Account section
* Privacy section
* About CraveList

Backend behavior is not required.

---

# 34. ANIMATION SYSTEM

Animations should be subtle and purposeful.

Use React Native Reanimated where appropriate.

Examples:

### Screen entrance

Fade + slight translate.

### Cards

Small press-scale interaction.

### Buttons

Subtle scale feedback.

### Bottom sheets

Smooth spring animation.

### Theme switch

Smooth color/state transition where practical.

### Map

Subtle marker interactions.

Avoid:

* Excessive bouncing
* Constant movement
* Large transitions
* Distracting animations
* Animation on every component

The goal is:

> Premium motion, not flashy motion.

---

# 35. TOUCH INTERACTIONS

Every interactive element should provide feedback.

Examples:

```text
Button
→ subtle press animation
```

```text
Restaurant card
→ press feedback
→ navigate
```

```text
Save icon
→ selected state animation
```

```text
Tab
→ active state
```

```text
Theme toggle
→ immediate theme update
```

Make sure touch targets are large enough for comfortable mobile use.

---

# 36. SCROLL BEHAVIOR

Every screen that contains long content must scroll properly.

Examples:

* Restaurant Details
* Profile
* My Cravings
* Friends
* Notifications
* Chat
* Shared Cravings
* Trail
* Settings

Avoid nested scroll views unless genuinely necessary.

Headers should behave consistently.

---

# 37. EMPTY STATES

Create professional empty states.

Examples:

### No cravings

```text
Nothing saved yet.

Find a place you want to try
and start your craving trail.
```

### No friends

```text
Your food circle is empty.

Start sharing places with friends.
```

### No notifications

```text
You're all caught up.
```

Empty states should feel intentional, not like errors.

---

# 38. LOADING STATES

Even though backend is not implemented, create frontend loading states where useful.

Use:

* Skeletons
* Subtle placeholders
* Loading indicators

Do not overuse spinners.

---

# 39. ERROR STATES

Create simple visual error states for simulated failures.

Example:

```text
Something went wrong.

Try again.
```

But do not implement real API error handling in this phase.

---

# 40. RESPONSIVE DESIGN

The app is mobile-first.

The UI must work properly across different Android screen sizes.

Pay attention to:

* Safe areas
* Notches
* Status bars
* Navigation bars
* Small phones
* Large phones

Do not hardcode dimensions that break on different devices.

---

# 41. ACCESSIBILITY

Use:

* Appropriate contrast
* Readable text
* Sufficient touch targets
* Meaningful accessibility labels where appropriate

Icons should not be the only way to communicate important actions.

---

# 42. ICONOGRAPHY

Use one consistent icon system.

Do not mix random icon styles.

Icons should be:

* Simple
* Clean
* Minimal
* Consistent

Avoid excessive decorative icons.

---

# 43. IMAGE USAGE

Restaurant imagery should feel realistic and premium.

Use appropriate mock/local assets for frontend development.

Do not use random unrelated images.

Maintain consistent image aspect ratios.

Restaurant cards should have consistent image treatment.

---

# 44. FILE STRUCTURE

Keep the project organized.

Suggested structure:

```text
app/
│
├── (auth)/
│   ├── onboarding.tsx
│   ├── login.tsx
│   ├── register.tsx
│   └── forgot-password.tsx
│
├── (main)/
│   ├── home.tsx
│   ├── cravings.tsx
│   ├── trail.tsx
│   ├── friends.tsx
│   └── profile.tsx
│
├── restaurant/
│   ├── save-place.tsx
│   ├── details.tsx
│   ├── search-results.tsx
│   └── proximity-alert.tsx
│
├── social/
│   ├── user-profile.tsx
│   ├── shared-cravings.tsx
│   ├── chat.tsx
│   ├── notifications.tsx
│   └── plans.tsx
│
├── memories/
│   └── visit-checkin.tsx
│
└── settings/
    └── appearance.tsx
```

Adjust the exact Expo Router structure if necessary, but preserve the conceptual architecture.

---

# 45. NAVIGATION MAP

Implement the following frontend navigation.

```text
ONBOARDING
    ↓
LOGIN
    ├── REGISTER
    │      ↓
    │    HOME
    │
    └── FORGOT PASSWORD
           ↓
         LOGIN


HOME
├── Search
│     ↓
│   SEARCH RESULTS
│     ↓
│   RESTAURANT DETAILS
│     ├── SAVE PLACE
│     └── VISIT / CHECK-IN
│
├── Map Marker
│     ↓
│   RESTAURANT DETAILS
│
└── Proximity Alert
      ↓
   RESTAURANT DETAILS


MY CRAVINGS
├── Restaurant
│     ↓
│   RESTAURANT DETAILS
│
└── Restaurant
      ↓
   VISIT / CHECK-IN


TRAIL
└── Memory
      ↓
   VISIT / CHECK-IN


FRIENDS
├── Friend
│     ↓
│   USER PROFILE
│     ├── SHARED CRAVINGS
│     └── CHAT
│
└── PLAN
      ↓
    PLANS


PROFILE
└── APPEARANCE & SETTINGS
       ↓
    DARK / LIGHT MODE


NOTIFICATIONS
├── Proximity notification
│      ↓
│   RESTAURANT DETAILS
│
├── Friend activity
│      ↓
│   USER PROFILE
│
└── Plan notification
       ↓
     PLANS
```

---

# 46. BOTTOM NAVIGATION

Primary navigation should remain simple.

Recommended tabs:

```text
Home
Cravings
Trail
Friends
Profile
```

The active tab must be visually obvious.

Do not use excessive labels or decorative elements.

The navigation bar should adapt to both themes.

---

# 47. SCREEN TRANSITIONS

Use consistent transitions.

Primary navigation:

```text
Simple fade / native tab transition
```

Secondary screen:

```text
Slide / native stack transition
```

Modal:

```text
Bottom-up presentation
```

Bottom sheet:

```text
Spring-based presentation
```

Do not use a different transition for every screen.

Consistency is more important than novelty.

---

# 48. MOCK DATA

Create centralized mock data.

For example:

```text
mockRestaurants
mockUsers
mockFriends
mockNotifications
mockMessages
mockPlans
mockMemories
```

Do not duplicate the same restaurant/user data across multiple files.

The mock data should make the application look populated and realistic.

---

# 49. NO BACKEND ASSUMPTIONS

If a feature normally requires backend functionality, create a frontend simulation.

Example:

Instead of:

```text
POST /restaurants/save
```

simply update frontend state.

Instead of real chat:

```text
Send message
→
Add message to local mock state
```

Instead of real notification:

```text
Display notification using mock data
```

This phase is purely for validating:

> UI + UX + Navigation + Interaction.

---

# 50. FINAL QUALITY REQUIREMENT

Before considering the frontend complete, verify:

### Navigation

* Every button works
* Every relevant card is clickable
* Back navigation works
* Tabs work
* No dead-end screens
* No broken routes

### UI

* Dark mode works
* Light mode works
* Consistent typography
* Consistent spacing
* Consistent cards
* Consistent buttons
* Consistent icons

### UX

* Touch feedback
* Smooth scrolling
* Proper safe areas
* Clear hierarchy
* Clear empty states
* Clear loading states

### Code

* TypeScript
* Simple structure
* Reusable components
* Useful comments
* No unnecessary complexity
* No duplicate code where avoidable
* No backend implementation

---

# 51. MOST IMPORTANT INSTRUCTION

Do not try to build everything in one enormous file.

Build the application **screen-by-screen and section-by-section**.

First establish:

```text
Theme
↓
Navigation
↓
Reusable components
↓
Auth
↓
Main navigation
↓
Restaurant flow
↓
Social flow
↓
Memories
↓
Settings
```

After every major section, verify navigation before moving forward.

The final result should feel like **one unified application**, not 20 independently designed screens.

---

# 52. FINAL DESIGN GOAL

CraveList should visually communicate:

> "I discovered this place.
> I saved it.
> I followed my trail.
> I got reminded when I was nearby.
> I went there.
> I created a memory.
> I shared it with my people."

The interface should make this journey obvious without requiring the user to understand the underlying system.

The final product should feel:

**Premium + Warm + Minimal + Social + Food-focused + Location-aware + Human-designed.**

No neon.

No generic AI aesthetic.

No unnecessary visual complexity.

No excessive gradients.

No confusing navigation.

No over-engineering.

Build a polished, cohesive, production-quality frontend experience using **Expo + React Native + TypeScript**, with **Space Grotesk**, a sophisticated custom **dark/light theme**, subtle gradients, purposeful animations, and straightforward navigation between all defined screens.
