# TFC Website - React Application with Firebase Authentication

A modern React web application with complete Firebase authentication system including email/password login, signup, and Google Sign-In.

## 🚀 Features

### Authentication System
- ✅ **Email/Password Login** - Traditional authentication
- ✅ **Email/Password Signup** - User registration with validation
- ✅ **Google Sign-In** - One-click authentication with Google OAuth
- ✅ **Password Validation** - Strong password requirements enforced
- ✅ **Error Handling** - User-friendly error messages
- ✅ **Loading States** - Visual feedback during authentication

### Password Requirements
- Minimum 8 characters
- At least 1 uppercase letter (A-Z)
- At least 1 number (0-9)
- At least 1 special character (!@#$%^&*, etc.)

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v14 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** - [Download here](https://git-scm.com/)
- A **Firebase account** - [Create free account](https://firebase.google.com/)

## 🛠️ Installation & Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/hamlou/DEVOPS.git
cd DEVOPS/GGPQ
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages including:
- React
- Firebase
- React Router DOM
- Vite (build tool)
- Tailwind CSS

### Step 3: Firebase Configuration

#### 3.1 Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Enter project name (e.g., "tfc-app")
4. Follow the setup wizard
5. Disable Google Analytics (optional for development)
6. Click **"Create project"**

#### 3.2 Enable Authentication Methods

1. In Firebase Console, click **"Authentication"** in the left sidebar
2. Click **"Get started"**
3. Enable these sign-in methods:

   **Email/Password:**
   - Click on **"Email/Password"**
   - Toggle **"Enable"**
   - Click **"Save"**

   **Google Sign-In:**
   - Click on **"Google"**
   - Toggle **"Enable"**
   - Enter your project support email
   - Click **"Save"**

#### 3.3 Get Your Firebase Config

1. In Firebase Console, click the **gear icon** ⚙️ next to "Project Overview"
2. Select **"Project settings"**
3. Scroll down to **"Your apps"**
4. Click the **web icon** `</>` to add a web app
5. Register your app with a nickname (e.g., "TFC Web App")
6. Copy the `firebaseConfig` object - you'll need this!

#### 3.4 Add Firebase Config to Your Project

1. Open the file: `src/firebase.js`
2. Replace the existing `firebaseConfig` with YOUR config from Firebase Console:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID" // Optional
};
```

⚠️ **Important:** Use the exact values from your Firebase Console!

#### 3.5 Set Up Authorized Domains (For Google Sign-In)

1. In Firebase Console → Authentication → Settings
2. Under **"Authorized domains"**, add:
   - `localhost` (for local development)
   - Your production domain when deployed

## 🏃 Running the Application

### Development Mode

```bash
npm run dev
```

The app will start on: **http://localhost:5173/**

If port 5173 is busy, Vite will automatically use the next available port (5174, 5175, etc.)

### Production Build

```bash
npm run build
```

This creates an optimized build in the `dist/` folder.

### Preview Production Build

```bash
npm run preview
```

## 📁 Project Structure

```
GGPQ/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── AdminSidebar.jsx
│   │   ├── BottomNav.jsx
│   │   ├── ContentCard.jsx
│   │   ├── Hero.jsx
│   │   ├── LogoutModal.jsx
│   │   ├── Navbar.jsx
│   │   ├── PaymentModal.jsx
│   │   ├── Sidebar.jsx
│   │   ├── UpgradeModal.jsx
│   │   └── VideoPlayer.jsx
│   ├── context/             # React Context for global state
│   │   └── UserContext.jsx
│   ├── data/                # Static data files
│   │   └── ContentData.js
│   ├── layouts/             # Page layouts
│   │   ├── AdminLayout.jsx
│   │   └── DashboardLayout.jsx
│   ├── pages/               # All page components
│   │   ├── admin/           # Admin panel pages
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── Analytics.jsx
│   │   │   └── ...
│   │   ├── Login.jsx        # 🔐 Login/Signup page (MAIN AUTH)
│   │   ├── Home.jsx
│   │   ├── Browse.jsx
│   │   └── ...
│   ├── services/            # API and data services
│   │   └── mockData.js
│   ├── styles/              # Global styles
│   │   └── globals.css
│   ├── App.jsx              # Main app component
│   ├── firebase.js          # 🔥 Firebase configuration & auth functions
│   └── main.jsx             # App entry point
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

## 🔐 Authentication Flow

### How It Works

1. **User visits the app** → Redirected to Login page
2. **User chooses sign-in method:**
   - Email/Password
   - Google Sign-In
3. **Firebase authenticates the user**
4. **User context is updated** → User is logged in
5. **Redirected to home page** with full access

### Key Files

- **`src/firebase.js`** - Firebase initialization and auth functions
  - `signIn(email, password)` - Email/password login
  - `signUp(email, password)` - Email/password registration
  - `signInWithGoogle()` - Google OAuth login
  - `logOut()` - Sign out current user

- **`src/pages/Login.jsx`** - Login/Signup UI and handlers
  - `handleLoginSubmit` - Processes login form
  - `handleSignupSubmit` - Processes registration form with validation
  - `handleGoogleSignIn` - Processes Google sign-in

- **`src/context/UserContext.jsx`** - Manages user authentication state globally

## 🎨 Styling

This app uses **Tailwind CSS** for styling. All custom styles are in:
- `src/styles/globals.css` - Global styles
- `src/pages/Login.css` - Login page specific styles

No changes needed unless you want to customize the design.

## 🐛 Troubleshooting

### Port Already in Use

**Error:** "Port 5173 is in use"

**Solution:** Vite automatically uses the next available port. Look for the message:
```
➜  Local:   http://localhost:5174/
```

### Firebase Not Initialized

**Error:** "No Firebase Apps" or "Firebase not configured"

**Solution:** 
1. Check that `src/firebase.js` has your correct Firebase config
2. Verify you copied the entire `firebaseConfig` object
3. Make sure there are no syntax errors in the file

### Google Sign-In Not Working

**Error:** "This operation is not supported in this environment" or popup doesn't open

**Solution:**
1. Ensure Google provider is enabled in Firebase Console
2. Check that `localhost` is in authorized domains
3. Make sure you're running on `http://localhost` (not file://)

### Password Validation Failing

**Error:** User can't signup even with valid password

**Solution:**
Check that password meets ALL requirements:
- ✅ 8+ characters
- ✅ 1 uppercase letter
- ✅ 1 number
- ✅ 1 special character

### Build Errors

**Error:** Various build or dependency errors

**Solution:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules
npm install

# Clear cache
npm cache clean --force

# Try again
npm run dev
```

## 📦 Dependencies

Key packages used in this project:

```json
{
  "dependencies": {
    "firebase": "^12.10.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^7.12.0",
    "vite": "^5.2.0",
    "tailwindcss": "^3.4.3"
  }
}
```

## 🔧 Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Check code quality |

## 🌐 Deployment

### Deploy to Vercel (Recommended)

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. Follow the prompts

4. Add your production domain to Firebase authorized domains

### Deploy to Netlify

1. Build the project:
   ```bash
   npm run build
   ```

2. Drag and drop the `dist/` folder to [Netlify Drop](https://app.netlify.com/drop)

3. Add your domain to Firebase authorized domains

## 📝 Environment Variables (Optional)

For better security, you can use environment variables:

1. Create `.env` file in project root:
   ```
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   ...
   ```

2. Update `src/firebase.js`:
   ```javascript
   const firebaseConfig = {
     apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
     authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
     // ...
   };
   ```

## 👥 Next Developer Notes

### Current Implementation Status

✅ **Completed:**
- Full Firebase authentication system
- Email/Password login and signup
- Google Sign-In integration
- Password validation (client-side)
- Error handling and user feedback
- Responsive UI design
- Loading states
- Success/error messages

🔄 **To Be Done:**
- [ ] Backend API integration (if needed)
- [ ] Database setup for user data
- [ ] Admin panel functionality
- [ ] Video player enhancements
- [ ] Additional features as required

### Code Quality

- Clean, commented code
- Consistent naming conventions
- Modular component structure
- Error handling implemented
- TypeScript migration possible (currently JavaScript)

## 🆘 Getting Help

1. **Firebase Documentation:** https://firebase.google.com/docs
2. **React Documentation:** https://react.dev
3. **Vite Documentation:** https://vitejs.dev
4. **Tailwind CSS:** https://tailwindcss.com/docs

## 📄 License

This project is private and proprietary.

---

**Last Updated:** March 4, 2026  
**Latest Commit:** elyes (7a6850e2) - Firebase auth complete  
**Developer:** Ready for next developer to continue work! 🚀
