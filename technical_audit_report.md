# TFC Championship – Comprehensive Technical Audit Report

## 1. PROJECT OVERVIEW
**What does this application do?**
The TFC (Total Full Contact) Championship platform is a complete ecosystem for a combat sports organization. It provides a public-facing website for fans to watch free and premium MMA fights, view upcoming events, and learn about the fighters (champions). 

**What problem does it solve?**
It bridges the gap between the event organizers, the fighters, and the fans. It allows organizers to monetize their fight library through a subscription model (fiat and crypto), enables fighters to apply to compete via an online registration system, and gives fans a Netflix-style platform to browse, stream, and manage their favorite fights.

**What type of application is it?**
It is a **Subscription Video-on-Demand (SVOD) SaaS & Web Application** with an integrated API and administrative dashboard.

---

## 2. TECH STACK — EVERY TECHNOLOGY USED
**Programming Language(s) & Versions:**
- JavaScript (ES6+) for both frontend and backend.
- Node.js (v18+) for the backend runtime.

**Frontend Framework:**
- **React (v18.2.0) with Vite:** React is a library for building user interfaces. It was chosen for its component-based architecture which makes building complex UI interfaces (like a video streaming platform) modular and maintainable. Vite was chosen as the build tool because it is significantly faster than older tools like Webpack, providing near-instant hot module replacement (HMR) for a better developer experience.

**Backend Framework:**
- **Node.js with Express.js (v5.2.1):** Node.js allows JavaScript to run on the server. Express is a minimal routing framework for Node.js. It was chosen because it allows for rapid API development, is highly scalable, and integrates perfectly with a React frontend.

**Database(s) Used:**
- **Firebase Firestore (NoSQL):** A cloud-hosted NoSQL document database. It was chosen for its real-time capabilities and seamless integration with Firebase Authentication. Because the data (videos, users, events) is highly unstructured and read-heavy, a NoSQL database provides the flexibility and fast read speeds required.

**ORM or Database Query Method:**
- **Firebase Admin SDK:** The backend uses the official Firebase Admin SDK to interact with Firestore directly via reference and query methods (`db.collection('...').get()`). No traditional SQL ORM (like Prisma or Sequelize) is used since it's a NoSQL database.

**Package Managers:**
- **npm (Node Package Manager):** Used for installing and managing project dependencies.

**Additional Libraries (Frontend):**
- **Tailwind CSS (`tailwindcss`):** A utility-first CSS framework for rapid UI styling without writing custom CSS files.
- **Framer Motion (`framer-motion`):** An animation library for React to create smooth, dynamic UI transitions.
- **Three.js & React Three Fiber (`three`, `@react-three/fiber`, `@react-three/drei`):** 3D rendering libraries used to render interactive 3D elements or models in the browser.
- **React Router (`react-router-dom`):** Handles client-side navigation (changing pages without reloading the browser).
- **React Player (`react-player`):** A component for playing various video URLs seamlessly.
- **Lucide React (`lucide-react`):** A library for beautiful, consistent SVG icons.
- **React Phone Number Input (`react-phone-number-input`):** A component for handling international phone number formatting.

**Additional Libraries (Backend):**
- **Stripe (`stripe`):** Official SDK for processing credit card payments and subscriptions securely.
- **Axios (`axios`):** A promise-based HTTP client used to make requests to external APIs (like NOWPayments and ImgBB).
- **Resend (`resend`):** A modern email API used to send transactional emails (verifications, receipts, alerts).
- **Multer (`multer`):** Middleware for handling `multipart/form-data`, primarily used to intercept image uploads.
- **Express Rate Limit (`express-rate-limit`):** Security middleware to prevent DDoS and brute-force attacks by limiting requests.
- **Helmet (`helmet`):** Security middleware that automatically sets HTTP response headers to protect against web vulnerabilities.
- **Memory Cache (`memory-cache`):** In-memory caching system used to cache public API responses and reduce database reads.
- **Compression (`compression`):** Middleware to compress API responses (Gzip) to improve loading speeds.
- **Cors (`cors`):** Middleware that allows the frontend to communicate with the backend across different domains securely.

---

## 3. PROJECT ARCHITECTURE
**Folder Structure:**
- `tfc-final/` (Root Directory)
  - `src/`: Contains the entire **Frontend** (React) source code.
    - `components/`: Reusable UI pieces (buttons, video players, modals).
    - `pages/`: Full page views (Home, Browse, Admin Dashboard).
    - `context/`: Global state management logic (UserContext).
    - `services/`: API configuration and external service logic.
    - `styles/`: Global CSS and Tailwind configuration.
  - `server/`: Contains the entire **Backend** (Node/Express) source code.
    - `server.js`: The main entry point, containing all API routes, webhooks, and core logic.
    - `uploads/`: Temporary directory for handling files (if needed fallback).
  - `public/`: Static assets (images, favicon) served directly to the browser.
  - `.env`: Environment variables containing sensitive API keys.

**Monolithic or Separated?**
- The project is **Separated** (Decoupled architecture). The frontend and backend run as two distinct applications that communicate via an API.

**API Type:**
- The backend exposes a **REST API** (Representational State Transfer), using standard HTTP methods (GET, POST, PATCH, DELETE) and returning JSON data.

**Frontend-Backend Communication:**
- The React frontend makes HTTP requests to the Node.js backend using `fetch` or `axios`.
- For authenticated routes, the frontend intercepts the Firebase Auth token and passes it in the `Authorization: Bearer <token>` header to the backend.

**Data Flow Diagram:**
```text
[ User (Browser) ] 
       | 
       | (1. Clicks "Play Video")
       v 
[ React Frontend ] ---(2. GET /api/pro/videos with JWT Token)---> [ Node/Express Backend ]
                                                                          |
                                                                          | (3. Verifies Token via Firebase Auth)
                                                                          | (4. Checks DB for Subscription Status)
                                                                          v
                                                               [ Firestore Database ]
                                                                          |
                                                                          | (5. Returns Video Data)
[ React Frontend ] <-------(6. Returns JSON Data)-------------------------+
       |
       | (7. Renders Video Player)
       v
[ User watches video ]
```

---

## 4. DATABASE DESIGN
The project uses Firebase Firestore, a NoSQL document database. Instead of "Tables" and "Rows", it uses **Collections** and **Documents**.

**1. `users` Collection**
- **Fields:** `email` (string), `username` (string), `role` (string: admin/user), `subscriptionStatus` (string: active/canceled/past_due/none), `subscriptionPlan` (string), `currentPeriodStart` (timestamp), `currentPeriodEnd` (timestamp), `stripeCustomerId` (string), `stripeSubscriptionId` (string), `paymentMethod` (string: crypto/stripe), `lastCryptoOrderId` (string).
- **Purpose:** Stores all user profiles, their roles, and their subscription validity dates.

**2. `crypto_payments` Collection**
- **Fields:** `order_id` (string), `payment_id` (string), `status` (string), `price_amount` (number), `actually_paid` (number), `tipAmount` (number), `userId` (string), `planKey` (string), `processed` (boolean).
- **Purpose:** Logs every cryptocurrency transaction to prevent duplicate processing (idempotency) and track underpayments/tips.

**3. `videos` Collection**
- **Fields:** `title` (string), `videoUrl` (string), `thumbnail` (string), `description` (string), `category` (string), `type` (string: free/pro), `isPremium` (boolean), `duration` (string).
- **Purpose:** Stores the catalog of videos available for streaming.

**4. `champions` Collection**
- **Fields:** `firstName`, `lastName`, `nickname`, `email`, `phone`, `dateOfBirth`, `country`, `height`, `weight`, `association`, `classSpeciality`, `record` (map of wins, losses, koTko, decisions, submissions), `organisation`, `links` (map of social URLs), `images` (map containing profile image URL), `status` (string: pending/approved/rejected), `userId` (string).
- **Purpose:** Stores the applications and public profiles of fighters.

**5. `events` Collection**
- **Fields:** `name` (string), `number` (number), `date` (string), `location` (string), `status` (string: upcoming/recent/past), `url` (string), `image` (string).
- **Purpose:** Manages the timeline of fighting events.

**6. `categories` Collection**
- **Fields:** `name` (string).
- **Purpose:** Organizes videos into genres or weight classes.

**Relationships & Indexes:**
- **Relationships:** Because it's NoSQL, relationships are handled by reference IDs. The `crypto_payments.userId` matches the `users` document ID. 
- **Foreign Keys:** No hard foreign keys exist in NoSQL, but logical connections are maintained via string IDs.
- **Indexes:** Firestore automatically indexes every individual field. Composite indexes are actively avoided in this code (e.g., sorting champions client-side) to bypass complex index deployment requirements.
- **CRUD:** Handled via the Firebase Admin SDK using `db.collection('...').get()`, `.add()`, `.update()`, and `.delete()`.

---

## 5. AUTHENTICATION & AUTHORIZATION
**Registration & Login:**
- Handled securely by **Firebase Authentication**.

**Authentication Method:**
- **JWT (JSON Web Tokens):** When a user logs in, Firebase generates a secure JWT. This token is stored on the frontend and sent with API requests. 

**Login Flow:**
1. User enters email/password on the frontend.
2. React sends these to Firebase Auth directly.
3. Firebase verifies and returns a JWT to the frontend.
4. Frontend saves user data in `localStorage` and saves the JWT.
5. For protected data, frontend sends the JWT to the backend.
6. Backend's `verifyToken` middleware decrypts the JWT using Firebase Admin SDK. If valid, the request proceeds.

**Password Storage:**
- Passwords never touch the Node.js server. They are hashed, salted, and stored entirely by Google/Firebase using their proprietary ultra-secure algorithms (likely a variant of Scrypt).

**Session Persistence:**
- The frontend uses `localStorage` (`tfc_user`) to keep the user logged in across browser refreshes, checking the expiration date against the current time.

**Roles & Permissions:**
- There are two roles: `admin` and `user`. 
- **Frontend Authorization:** Certain UI components (like the Admin Dashboard) are hidden if `user.role !== 'admin'`.
- **Backend Authorization:** The `requireAdmin` middleware checks if the JWT's email exactly matches the hardcoded `ADMIN_EMAIL` (`benbrayekhamza1@gmail.com`). If not, it rejects the request with a `403 Forbidden` error.

---

## 6. SECURITY
List of ALL implemented security measures:
1. **Helmet (`app.use(helmet())`):** Automatically sets secure HTTP headers (e.g., X-Frame-Options to prevent Clickjacking, X-Content-Type-Options to prevent MIME-sniffing, and hides the "X-Powered-By: Express" header to obscure the backend stack from attackers).
2. **Rate Limiting:** 
   - `globalLimiter`: Caps standard API requests to 100 per 15 minutes per IP address to prevent DDoS attacks.
   - `authLimiter`: Strictly limits authentication/email endpoints to 5 requests per 15 minutes to prevent password brute-forcing and email spam.
3. **CORS (Cross-Origin Resource Sharing):** Configured specifically to only allow requests from the trusted frontend domains (`tfc-event.com` or `localhost`), blocking malicious websites from querying the API.
4. **Input Sanitization (HTML Escaping):** The `escapeHtml` function is used specifically on Contact form inputs to convert malicious `<script>` tags into harmless text, preventing **XSS (Cross-Site Scripting)** attacks in admin emails.
5. **Payload Limits (`express.json({ limit: '10kb' })`):** Rejects oversized JSON payloads immediately, preventing memory exhaustion (DoS) attacks.
6. **Webhook Signature Verification:** The most critical security feature for payments. Both Stripe and NOWPayments webhooks require the `express.raw()` body parser to mathematically verify cryptographic HMAC signatures, ensuring hackers cannot fake payment success signals.
7. **Timing-Safe Equality Checks (`crypto.timingSafeEqual`):** Used during NOWPayments signature verification to prevent "timing attacks" where hackers guess the secret key by measuring the millisecond response time of string comparisons.
8. **Environment Variables (`.env`):** Sensitive data (Stripe Secret Keys, Firebase Admin credentials, Database URLs) are hidden in server variables, meaning they are never exposed to the public internet or stored in version control (GitHub).
9. **NoSQL Injection Protection:** Because Firestore uses a structured query builder (`.where('field', '==', value)`) rather than raw text queries, it is inherently immune to traditional SQL injection.

---

## 7. PAYMENTS & FINANCIAL FEATURES
**Payment Providers Used:**
1. **Stripe:** For traditional credit/debit card subscriptions.
2. **NOWPayments:** For cryptocurrency payments (USDT on the TRC20 network).

**Payment Flows:**
- Both providers handle **Recurring Subscriptions** (Stripe natively, NOWPayments via time-based expiry).

**Step-by-Step Payment Flow (Stripe):**
1. User clicks "Pay" for Elite Pro.
2. Frontend calls `/api/payments/create-checkout-session`.
3. Backend creates a secure Stripe Checkout URL and returns it.
4. User is redirected to Stripe's hosted secure page to enter card details.
5. Upon success, Stripe charges the card and fires a background Webhook to the backend.
6. User is redirected back to the app (`/payment/success`).

**Webhooks & Confirmation:**
- A **Webhook** is an automated HTTP request sent from the payment provider (Stripe) to the backend to say "Hey, this event just happened."
- The backend listens at `/api/webhooks/stripe`. When it receives a `checkout.session.completed` or `invoice.payment_succeeded` event, it securely verifies the signature, looks up the user, and updates their `subscriptionStatus` to `active` in the database, granting them access to premium videos.

**Security:**
- Total **PCI Compliance**: The application never touches or stores raw credit card numbers. All card data is handled entirely on Stripe's highly encrypted servers.

---

## 8. WEBHOOKS & EXTERNAL INTEGRATIONS
**Integrations List:**
1. **Firebase Admin:** Manages user accounts and database securely from the backend.
2. **Stripe API:** Handles fiat subscriptions and billing portals.
3. **NOWPayments API:** Handles crypto invoice generation.
4. **Resend API:** A modern email-sending service.
5. **ImgBB API:** An external image hosting service used specifically to store Champion profile pictures.

**Webhook Tracing (Crypto Example):**
1. User sends USDT to the provided address.
2. NOWPayments detects the transaction on the blockchain and sends a POST request to `/api/webhooks/nowpayments`.
3. The backend receives the raw JSON and generates a cryptographic hash using the `NOWPAYMENTS_IPN_SECRET`.
4. It compares this hash to the header signature. If valid, it reads `actually_paid`.
5. It ensures the user paid the exact `price_amount` (or overpaid as a tip). 
6. If valid, it updates Firestore, sets `currentPeriodEnd` + 150 days, and fires a success email via Resend.

---

## 9. FILE UPLOADS & MEDIA
**How files are uploaded:**
- When a Champion applies, they upload a profile photo. 
- The backend uses **Multer** to intercept this file directly into the server's RAM (memory buffer).
- To prevent heavy storage costs on the main server, the backend immediately forwards the file buffer to **ImgBB** (a cloud image hosting service).
- ImgBB returns a permanent direct image URL, which is then stored in the database.

**Validation:**
- Handled by Multer. 
- Maximum file size: **2MB**.
- Accepted types: Regex checks for `jpeg|jpg|png|webp`. Rejects PDFs or executables.

---

## 10. EMAIL & NOTIFICATIONS
**Email Service:** 
- **Resend** (Nodemailer is installed but Resend is the primary SDK utilized).

**What emails are sent and when?**
1. **Email Verification:** Sent immediately when a user requests it to confirm their identity.
2. **Password Reset:** Sent when a user forgets their password.
3. **Payment Success (Fiat & Crypto):** Automatically triggered via webhook when payment clears, providing a receipt and welcome message.
4. **Payment Failed:** Sent if a recurring Stripe charge fails, asking the user to update their card.
5. **Champion Application Received:** A confirmation sent to the fighter.
6. **New Champion Alert (Admin):** A highly detailed email sent to the Admin containing all the fighter's stats, social links, and a link to their photo.
7. **Contact Form Messages:** Relayed from the public website directly to the Admin.

---

## 11. STATE MANAGEMENT (Frontend)
**How is it managed?**
- The application uses React's native **Context API** combined with `useState` and `useEffect`.
- File: `src/context/UserContext.jsx`

**What does it mean?**
- State management is how the application remembers things (like "Who is logged in?" or "What video are they watching?"). A global state manager like Context API allows data to be shared across the entire app without passing it manually from component to component.

**Global vs Local State:**
- **Global State:** User profile data, Auth Tokens, Watch History, and "My List" (favorites) are stored in the `UserContext` because the header, the video player, and the billing page all need to know who the user is.
- **Local State:** Things like "Is this dropdown open?" or "What is typed in the search bar?" are kept locally in individual components using standard `useState`.

---

## 12. API ENDPOINTS — COMPLETE LIST

**Auth & Users**
- `POST /api/auth/send-verification`: Triggers a verification email. (Protected via Rate Limit)
- `POST /api/auth/send-reset`: Triggers a password reset link. (Protected via Rate Limit)
- `GET /api/admin/users`: Returns all users. (Protected: Admin Only)
- `DELETE /api/admin/users/:uid`: Deletes a user completely. (Protected: Admin Only)
- `PATCH /api/admin/users/:uid/role`: Promotes/demotes admin status. (Protected: Admin Only)
- `POST /api/account/delete`: Allows a user to delete their own account. (Protected: User)
- `POST /api/admin/sync-auth-users`: Cleans up orphaned database records. (Protected: Admin Only)

**Payments & Subscriptions**
- `POST /api/payments/create-checkout-session`: Generates Stripe payment URL. (Protected: User)
- `POST /api/payments/verify-session`: Confirms Stripe session manually. (Protected: User)
- `POST /api/payments/portal`: Generates Stripe billing management portal URL. (Protected: User)
- `GET /api/payments/subscription-status`: Checks if user is subscribed. (Protected: User)
- `POST /api/webhooks/stripe`: Stripe background webhook. (Public, Signature Verified)
- `POST /api/crypto/create-payment`: Generates NOWPayments crypto invoice. (Protected: User)
- `GET /api/crypto/subscription-status/:userId`: Checks crypto subscription validity. (Protected: User)
- `GET /api/crypto/payment-status/:orderId`: Checks status of specific crypto order. (Protected: User)
- `POST /api/webhooks/nowpayments`: Crypto background webhook. (Public, Signature Verified)

**Videos**
- `GET /api/videos`: Lists all videos (filters URLs for premium content). (Public, Cached)
- `GET /api/pro/videos`: Lists premium videos. (Protected: Active Subscribers Only)
- `GET /api/pro/videos/:videoId`: Gets specific premium video data. (Protected: Active Subscribers Only)
- `GET /api/admin/videos`: Gets all raw video data for dashboard. (Protected: Admin Only)
- `POST /api/admin/videos`: Adds new video. (Protected: Admin Only)
- `PATCH /api/admin/videos/:id`: Edits video. (Protected: Admin Only)
- `DELETE /api/admin/videos/:id`: Deletes video. (Protected: Admin Only)

**Champions (Fighters)**
- `GET /api/champions`: Returns only 'approved' fighters for the public page. (Public)
- `POST /api/champions/apply`: Submits a fighter application (Multipart/form-data). (Public)
- `GET /api/admin/champions`: Lists all fighter applications. (Protected: Admin Only)
- `PATCH /api/admin/champions/:id`: Approves/Rejects an application. (Protected: Admin Only)

**Events & Categories**
- `GET /api/events`: Lists all events. (Public, Cached)
- `POST /api/admin/events`: Creates an event. (Protected: Admin Only)
- `PATCH /api/admin/events/:id`: Updates an event. (Protected: Admin Only)
- `DELETE /api/admin/events/:id`: Deletes an event. (Protected: Admin Only)
- `GET /api/categories`: Lists video categories. (Public)
- `GET /api/admin/categories`: Lists categories with video usage count. (Protected: Admin Only)
- `POST, PATCH, DELETE /api/admin/categories/:id`: Manages categories. (Protected: Admin Only)

**Misc**
- `GET /api/admin/stats`: Gathers aggregate metrics for the dashboard. (Protected: Admin Only)
- `POST /api/contact`: Submits the public contact form. (Public)

---

## 13. FORMS & DATA VALIDATION
**Forms in the app:**
1. Registration & Login Forms
2. Champion Application Form (Complex, multipart)
3. Contact Form
4. Admin Dashboard Forms (Create Event, Create Video, Create Category)

**Client-Side Validation:**
- Handled largely by native HTML5 validation (`required`, `type="email"`) and custom React checks before submission. The `react-phone-number-input` validates phone formats automatically.

**Server-Side Validation:**
- Extensive checks exist in `server.js`.
- Example: The Contact Form checks if `name`, `email`, and `message` exist, validates the email via Regex (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`), enforces strict length limits (`message.length > 5000` is rejected), and sanitizes HTML strings before saving or emailing.
- No heavy third-party validation libraries (like Zod or Joi) are used; validation is written via custom Javascript logic.

---

## 14. ERROR HANDLING
**Backend:**
- Every API endpoint is wrapped in a `try/catch` block.
- Errors are logged to the server console (`console.error('❌ ...')`) for developer debugging.
- The user is returned a clean, safe JSON response: `res.status(500).json({ error: err.message })` or a custom friendly message.

**Frontend:**
- The React application catches these API errors and displays them to the user via UI Alerts, Modals, or Toast notifications, rather than crashing the application.

---

## 15. DEPLOYMENT & HOSTING
**Hosting Environment:**
- **Frontend:** Configured to be deployed on **Netlify** or **Vercel** (evidenced by the presence of a `netlify.toml` file and Vite build scripts).
- **Backend:** Designed to be hosted on a Node.js VPS or a platform like **Render** or **Heroku**.
- **Database:** Hosted in the cloud by Google (**Firebase**).

**Environment Variables Required:**
- `PORT`, `FRONTEND_URL`
- `FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_MONTHLY_PRICE_ID`, `STRIPE_YEARLY_PRICE_ID`
- `RESEND_API_KEY`
- `NOWPAYMENTS_API_KEY`, `NOWPAYMENTS_IPN_SECRET`
- `IMGBB_API_KEY`

**CI/CD Pipeline:**
- There is no complex explicit GitHub Actions pipeline found, but deployment to Netlify/Vercel natively provides continuous deployment (auto-building the site when code is pushed to the `main` branch).

---

## 16. PERFORMANCE OPTIMIZATIONS
1. **Caching (`memory-cache`):** High-traffic public routes (`/api/events`, `/api/videos`) are cached in the server's RAM for 30 minutes (1800 seconds). This drastically reduces reads on the Firebase database and returns data in milliseconds.
2. **Gzip Compression (`compression`):** The backend compresses all JSON responses before sending them over the network, saving bandwidth.
3. **Database Efficiency:** The application avoids complex NoSQL composite indexing by returning small data sets (like the approved Champions list) and sorting them instantly on the frontend (`client-side sorting`).
4. **Vite Build Tool:** The frontend uses Vite, which highly optimizes and minifies the production bundle.

---

## 17. TESTING
**Is there testing?**
- There are no automated unit or end-to-end testing frameworks (like Jest or Cypress) configured in this project.
- **Linting:** Code quality is enforced statically via **ESLint** (`npm run lint`), which ensures best practices and catches syntax errors before runtime.
- A manual `DEPLOYMENT_CHECKLIST.md` is utilized to ensure functionality before production.

---

## 18. KEY ALGORITHMS & BUSINESS LOGIC
**The Most Complex Logic: Crypto Payment Verification (NOWPayments Webhook)**
1. The server receives raw binary data from the payment processor.
2. It sorts the JSON keys alphabetically using a recursive helper function (`sortObject`).
3. It converts this sorted object into a string.
4. It uses Node.js `crypto.createHmac` to encrypt this string using the secret API key.
5. It uses `crypto.timingSafeEqual` to compare its generated hash against the hash sent by the processor. 
6. If they match perfectly, the server mathematically guarantees the payment signal was not faked by a hacker.
7. It then calculates if the user paid the exact amount, overpaid (logged as a tip), or underpaid (rejected).

**Automated Tasks:**
- The application calculates the status of Events (`upcoming`, `recent`, `past`) dynamically on-the-fly based on server time compared to the event date when the admin updates them.

---

## 19. GLOSSARY
- **React:** A tool used to build the visual parts of the website that the user clicks and interacts with.
- **Node.js / Express:** The engine room of the website. It handles the heavy lifting, security, and database connections securely behind the scenes.
- **API (Application Programming Interface):** The bridge that allows the visual website to talk to the engine room and request data.
- **Firestore (NoSQL):** A modern, flexible database that stores data like a digital filing cabinet of documents, rather than strict spreadsheet tables.
- **Webhook:** A system where one computer automatically sends a text message to another computer saying "Hey, this event (like a payment) just happened."
- **JWT (JSON Web Token):** A secure digital ID card given to the user when they log in. They show this card to access premium videos.
- **Middleware:** Security guards that inspect incoming traffic before it reaches the main engine room.
- **CORS:** A security feature that ensures only *our* visual website is allowed to talk to *our* engine room.
- **State Management:** How the website remembers what the user is doing right now (like keeping track of what videos are in their "Favorites" list).
- **HMAC Signature:** A complex mathematical puzzle used to prove that a payment confirmation actually came from the bank, not a hacker.

---

## 20. SIMPLE SUMMARY — HOW TO EXPLAIN THIS PROJECT IN 5 MINUTES
*"Hello, my name is [Your Name], and I am presenting the **TFC Championship Platform**. 

This project is a complete digital ecosystem built for a combat sports organization. We recognized that fight promotions needed a modern way to not only showcase their fighters, but also monetize their video library. We built a Subscription Video-on-Demand (SVOD) platform that solves this problem. 

To build this, we used a modern, decoupled architecture. The user interface is built with **React**, which provides a lightning-fast, app-like experience. Behind the scenes, the brain of the operation is a **Node.js** server connected to a **Google Firebase Database**. 

Our most impressive features revolve around automation and monetization. Fans can subscribe to watch premium fights using traditional credit cards via **Stripe**, or they can use cryptocurrency via **NOWPayments**. When a payment happens, our server receives secure, cryptographic signals called webhooks, instantly updating the user's account and sending them an automated receipt. 

Furthermore, fighters can apply to join the promotion through a complex registration system that securely handles image uploads and automatically alerts our administrative team.

Security was a massive priority. We implemented strict rate limiting to prevent hackers from crashing the site, encrypted tokens for user sessions, and timing-safe algorithms to ensure financial data can never be forged. 

Ultimately, this platform takes an organization from a simple social media presence to a fully monetized, enterprise-grade media network."*
