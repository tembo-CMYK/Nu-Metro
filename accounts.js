/**
 * Nu Metro - Apple TV Experience
 * Cloud Account & loyalty Membership System (Firebase Integration)
 * Matches strict design and functional mandates: non-destructive runtime integration.
 */

(function () {
    let auth, db, firestoreDatabaseId;
    let currentUser = null;

    // We will bind modular firestore & auth functions dynamically
    let doc, setDoc, getDoc, getDocs, collection, query, where, orderBy, deleteDoc, runTransaction, increment, serverTimestamp;
    let onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, signOut;

    // Local application state bindings
    const LOYALTY_PTS_PER_SEAT = 50;

    // Initialize module on page load
    document.addEventListener('DOMContentLoaded', () => {
        initializeFirebase();
    });

    // Fetch config and set up Firebase Auth/Firestore
    async function initializeFirebase() {
        try {
            const response = await fetch('firebase-applet-config.json');
            if (!response.ok) throw new Error('Could not fetch firebase-applet-config.json');
            const config = await response.json();

            // Dynamically import modular Firebase SDKs
            const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js");
            const authModule = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js");
            const firestoreModule = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");

            // Extract Auth functions
            onAuthStateChanged = authModule.onAuthStateChanged;
            signInWithEmailAndPassword = authModule.signInWithEmailAndPassword;
            createUserWithEmailAndPassword = authModule.createUserWithEmailAndPassword;
            updateProfile = authModule.updateProfile;
            signOut = authModule.signOut;

            // Extract Firestore functions
            doc = firestoreModule.doc;
            setDoc = firestoreModule.setDoc;
            getDoc = firestoreModule.getDoc;
            getDocs = firestoreModule.getDocs;
            collection = firestoreModule.collection;
            query = firestoreModule.query;
            where = firestoreModule.where;
            orderBy = firestoreModule.orderBy;
            deleteDoc = firestoreModule.deleteDoc;
            runTransaction = firestoreModule.runTransaction;
            increment = firestoreModule.increment;
            serverTimestamp = firestoreModule.serverTimestamp;

            // Initialize app
            const app = initializeApp(config);
            auth = authModule.getAuth(app);

            // Support optional specific databaseId
            if (config.firestoreDatabaseId) {
                db = firestoreModule.getFirestore(app, config.firestoreDatabaseId);
            } else {
                db = firestoreModule.getFirestore(app);
            }

            console.log("Firebase & Firestore initialized successfully via Modular SDK.");

            // Pre-seed demo accounts in Firestore
            try {
                await setDoc(doc(db, 'users', 'user_fb_demo_guest'), {
                    uid: 'user_fb_demo_guest',
                    name: 'VIP Guest',
                    email: 'guest@numetro.co.za',
                    password: 'password123',
                    loyaltyPoints: 350,
                    isFallbackUser: true,
                    createdAt: serverTimestamp()
                }, { merge: true });

                await setDoc(doc(db, 'users', 'user_fb_demo_chileshe'), {
                    uid: 'user_fb_demo_chileshe',
                    name: 'Chileshe Tembo',
                    email: 'chileshe.tembo@gmail.com',
                    password: 'password123',
                    loyaltyPoints: 1250,
                    isFallbackUser: true,
                    createdAt: serverTimestamp()
                }, { merge: true });
                console.log("Pre-seeded VIP demo accounts successfully.");
            } catch (e) {
                console.error("Non-critical seeding error:", e);
            }

            // Listen for Auth changes
            onAuthStateChanged(auth, user => {
                if (user) {
                    currentUser = user;
                    localStorage.removeItem('numetro_fallback_user');
                    updateUserProfileAvatar();
                    syncLocalDataToCloud();
                } else {
                    const fallbackUserStr = localStorage.getItem('numetro_fallback_user');
                    if (fallbackUserStr) {
                        try {
                            currentUser = JSON.parse(fallbackUserStr);
                        } catch (e) {
                            currentUser = null;
                        }
                    } else {
                        currentUser = null;
                    }
                    updateUserProfileAvatar();
                    if (currentUser) {
                        syncLocalDataToCloud();
                    }
                }
            });

            // Fallback initialization check
            setTimeout(() => {
                if (!currentUser) {
                    const fallbackUserStr = localStorage.getItem('numetro_fallback_user');
                    if (fallbackUserStr) {
                        try {
                            currentUser = JSON.parse(fallbackUserStr);
                            updateUserProfileAvatar();
                            syncLocalDataToCloud();
                        } catch (e) {}
                    }
                }
            }, 600);

            // Set up our account trigger
            setupAccountTrigger();

            // Intercept standard AppState confirmBooking and reminders
            wrapAppLogic();

        } catch (error) {
            console.error('Firebase Initialization Error:', error);
        }
    }

    // Update avatar UI inside navbar to reflect login state
    function updateUserProfileAvatar() {
        const profileEl = document.querySelector('.user-profile');
        if (!profileEl) return;

        const avatarEl = profileEl.querySelector('.avatar');
        if (!avatarEl) return;

        if (currentUser) {
            // Get user initials
            const displayName = currentUser.displayName || '';
            const initials = displayName
                ? displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                : currentUser.email.substring(0, 2).toUpperCase();

            avatarEl.innerHTML = `<span class="user-initials">${initials}</span>`;
            avatarEl.style.background = 'linear-gradient(135deg, #f5841f, #ff7f36)';
            avatarEl.style.boxShadow = '0 0 10px rgba(245, 132, 31, 0.4)';
            avatarEl.style.border = '2px solid rgba(255, 255, 255, 0.8)';
            avatarEl.classList.add('logged-in');
        } else {
            avatarEl.innerHTML = `<i data-lucide="user" class="avatar-icon"></i>`;
            avatarEl.style.background = '';
            avatarEl.style.boxShadow = '';
            avatarEl.style.border = '';
            avatarEl.classList.remove('logged-in');
            if (typeof lucide !== 'undefined') { lucide.createIcons(); }
        }
    }

    // Setup event handler to open Account modal when profile avatar clicked
    function setupAccountTrigger() {
        const profileBtn = document.querySelector('.user-profile');
        if (profileBtn) {
            profileBtn.addEventListener('click', (e) => {
                e.preventDefault();
                openAccountModal();
            });
        }
    }

    // Injects and displays the Account / Authentication Modal
    function openAccountModal() {
        // Ensure modal placeholder exists
        let modal = document.getElementById('account-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'account-modal';
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal-card account-card" style="max-width: 600px; width: 100%; max-height: 90vh; overflow-y: auto; padding: 2.25rem; position: relative;">
                    <button class="modal-close" id="close-account-modal"><i data-lucide="x"></i></button>
                    <div id="account-modal-body"></div>
                </div>
            `;
            document.body.appendChild(modal);

            // Set up close button listeners
            document.getElementById('close-account-modal').addEventListener('click', closeAccountModal);
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeAccountModal();
            });
            
            if (typeof lucide !== 'undefined') { lucide.createIcons(); }
        }

        // Open animation
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';

        renderAccountContent();
    }

    function closeAccountModal() {
        const modal = document.getElementById('account-modal');
        if (modal) {
            modal.classList.remove('open');
            document.body.style.overflow = '';
        }
    }

    // Redraw appropriate screen (Auth vs Profile view) based on auth state
    async function renderAccountContent() {
        const container = document.getElementById('account-modal-body');
        if (!container) return;

        if (!currentUser) {
            renderAuthForm(container);
        } else {
            renderUserProfile(container);
        }
    }

    // Render Login / Registration Forms
    function renderAuthForm(container) {
        container.innerHTML = `
            <div class="auth-box">
                <div class="auth-tabs" style="display: flex; gap: 1rem; margin-bottom: 2rem; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 0.75rem;">
                    <button id="tab-login" class="auth-tab active" style="flex: 1; background: none; border: none; color: var(--color-white); font-family: var(--font-sans); font-size: 1.1rem; font-weight: 500; cursor: pointer; padding: 0.5rem 0; opacity: 1; transition: var(--transition-apple);">Sign In</button>
                    <button id="tab-register" class="auth-tab" style="flex: 1; background: none; border: none; color: var(--color-white); font-family: var(--font-sans); font-size: 1.1rem; font-weight: 500; cursor: pointer; padding: 0.5rem 0; opacity: 0.4; transition: var(--transition-apple);">Create Account</button>
                </div>

                <div id="auth-error-msg" style="background: rgba(255, 59, 48, 0.15); border-left: 3px solid var(--color-accent); padding: 0.75rem 1rem; border-radius: 6px; margin-bottom: 1.5rem; display: none; font-size: 0.85rem; color: #ff6b6b; font-family: var(--font-sans);"></div>

                <form id="account-auth-form" class="vip-join-form" style="display: flex; flex-direction: column; gap: 1rem;">
                    <div id="name-field-container" style="display: none;">
                        <label style="display: block; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-gray-500); margin-bottom: 0.4rem; font-family: var(--font-mono);">Full Name</label>
                        <input type="text" id="auth-name" placeholder="Chileshe Tembo" style="width: 100%; padding: 0.75rem 1rem; color: var(--color-white);">
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-gray-500); margin-bottom: 0.4rem; font-family: var(--font-mono);">Email Address</label>
                        <input type="email" id="auth-email" placeholder="you@example.com" required style="width: 100%; padding: 0.75rem 1rem; color: var(--color-white);">
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-gray-500); margin-bottom: 0.4rem; font-family: var(--font-mono);">Password</label>
                        <input type="password" id="auth-password" placeholder="••••••••" required style="width: 100%; padding: 0.75rem 1rem; color: var(--color-white);">
                    </div>

                    <button type="submit" id="auth-submit-btn" class="btn-checkout" style="margin-top: 1rem; padding: 0.85rem; width: 100%; cursor: pointer;">Sign In to Club</button>
                </form>

                <div style="margin-top: 1.5rem; text-align: center; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 1.25rem;">
                    <span style="display: block; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-gray-500); margin-bottom: 0.75rem; font-family: var(--font-mono);">VIP Demo Accounts</span>
                    <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                        <button id="demo-guest-btn" type="button" style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255,255,255,0.08); color: var(--color-white); padding: 0.6rem 1rem; border-radius: 8px; font-size: 0.8rem; cursor: pointer; display: flex; align-items: center; justify-content: space-between; transition: var(--transition-apple);">
                            <span style="display: flex; align-items: center; gap: 0.4rem;">👤 VIP Guest</span>
                            <span style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--color-gray-500);">guest@numetro.co.za / password123</span>
                        </button>
                        <button id="demo-chileshe-btn" type="button" style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255,255,255,0.08); color: var(--color-white); padding: 0.6rem 1rem; border-radius: 8px; font-size: 0.8rem; cursor: pointer; display: flex; align-items: center; justify-content: space-between; transition: var(--transition-apple);">
                            <span style="display: flex; align-items: center; gap: 0.4rem;">✨ Chileshe Tembo</span>
                            <span style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--color-gray-500);">chileshe.tembo@gmail.com / password123</span>
                        </button>
                    </div>
                </div>
            </div>
        `;

        let activeTab = 'login'; // 'login' or 'register'

        const tabLogin = document.getElementById('tab-login');
        const tabRegister = document.getElementById('tab-register');
        const nameContainer = document.getElementById('name-field-container');
        const authForm = document.getElementById('account-auth-form');
        const submitBtn = document.getElementById('auth-submit-btn');
        const errorMsg = document.getElementById('auth-error-msg');

        // Autofill and submit action helper
        const autofillAndSubmit = (email, password) => {
            activeTab = 'login';
            tabLogin.style.opacity = '1';
            tabRegister.style.opacity = '0.4';
            tabLogin.classList.add('active');
            tabRegister.classList.remove('active');
            nameContainer.style.display = 'none';
            document.getElementById('auth-name').removeAttribute('required');
            submitBtn.textContent = 'Sign In to Club';
            errorMsg.style.display = 'none';

            document.getElementById('auth-email').value = email;
            document.getElementById('auth-password').value = password;

            // Trigger submit handler
            authForm.dispatchEvent(new Event('submit'));
        };

        document.getElementById('demo-guest-btn').addEventListener('click', () => {
            autofillAndSubmit('guest@numetro.co.za', 'password123');
        });

        document.getElementById('demo-chileshe-btn').addEventListener('click', () => {
            autofillAndSubmit('chileshe.tembo@gmail.com', 'password123');
        });

        tabLogin.addEventListener('click', () => {
            activeTab = 'login';
            tabLogin.style.opacity = '1';
            tabRegister.style.opacity = '0.4';
            tabLogin.classList.add('active');
            tabRegister.classList.remove('active');
            nameContainer.style.display = 'none';
            document.getElementById('auth-name').removeAttribute('required');
            submitBtn.textContent = 'Sign In to Club';
            errorMsg.style.display = 'none';
        });

        tabRegister.addEventListener('click', () => {
            activeTab = 'register';
            tabRegister.style.opacity = '1';
            tabLogin.style.opacity = '0.4';
            tabRegister.classList.add('active');
            tabLogin.classList.remove('active');
            nameContainer.style.display = 'block';
            document.getElementById('auth-name').setAttribute('required', 'true');
            submitBtn.textContent = 'Create Loyalty Account';
            errorMsg.style.display = 'none';
        });

        authForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            errorMsg.style.display = 'none';
            submitBtn.disabled = true;
            submitBtn.textContent = activeTab === 'login' ? 'Authenticating...' : 'Creating Account...';

            const email = document.getElementById('auth-email').value.trim().toLowerCase();
            const password = document.getElementById('auth-password').value;

            try {
                const withTimeout = (promise, ms) => {
                    return Promise.race([
                        promise,
                        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
                    ]);
                };

                let standardSucceeded = false;

                if (activeTab === 'login') {
                    try {
                        await withTimeout(signInWithEmailAndPassword(auth, email, password), 1200);
                        currentUser = auth.currentUser;
                        standardSucceeded = true;
                    } catch (err) {
                        console.log("Firebase Auth failed or timed out. Falling back to direct database verification.");
                        const usersQuery = await getDocs(query(collection(db, 'users'), where('email', '==', email)));
                        if (usersQuery.empty) {
                            throw new Error("No account found with this email. Please click Create Account above.");
                        }

                        let matchedUser = null;
                        usersQuery.forEach(docSnap => {
                            const uData = docSnap.data();
                            if (uData.password === password) {
                                matchedUser = {
                                    uid: docSnap.id,
                                    displayName: uData.name || 'Club Member',
                                    email: email,
                                    isFallbackUser: true
                                };
                            }
                        });

                        if (!matchedUser) {
                            throw new Error("Incorrect password. Please try again.");
                        }

                        currentUser = matchedUser;
                        localStorage.setItem('numetro_fallback_user', JSON.stringify(currentUser));
                        updateUserProfileAvatar();
                        syncLocalDataToCloud().catch(e => console.error("Background sync error:", e));
                    }
                } else {
                    const name = document.getElementById('auth-name').value.trim();
                    try {
                        const userCredential = await withTimeout(createUserWithEmailAndPassword(auth, email, password), 1200);
                        await updateProfile(userCredential.user, { displayName: name });
                        currentUser = auth.currentUser;
                        standardSucceeded = true;
                        
                        // Bootstrap Firestore User document
                        await setDoc(doc(db, 'users', userCredential.user.uid), {
                            name: name,
                            email: email,
                            createdAt: serverTimestamp(),
                            loyaltyPoints: 0
                        });
                    } catch (err) {
                        if (err.message === "An account with this email already exists. Please choose Sign In.") {
                            throw err;
                        }
                        console.log("Firebase Auth register failed or timed out. Falling back to direct database registration.", err);
                        const usersQuery = await getDocs(query(collection(db, 'users'), where('email', '==', email)));
                        if (!usersQuery.empty) {
                            throw new Error("An account with this email already exists. Please choose Sign In.");
                        }

                        const customUid = `user_fb_${Math.random().toString(36).substr(2, 9)}`;
                        await setDoc(doc(db, 'users', customUid), {
                            uid: customUid,
                            name: name,
                            email: email,
                            password: password,
                            createdAt: serverTimestamp(),
                            loyaltyPoints: 0,
                            isFallbackUser: true
                        });

                        currentUser = {
                            uid: customUid,
                            displayName: name,
                            email: email,
                            isFallbackUser: true
                        };

                        localStorage.setItem('numetro_fallback_user', JSON.stringify(currentUser));
                        updateUserProfileAvatar();
                        syncLocalDataToCloud().catch(e => console.error("Background sync error:", e));
                    }
                }
                
                if (standardSucceeded && currentUser) {
                    syncLocalDataToCloud().catch(e => console.error("Background sync error:", e));
                }

                // Refresh modal content on success
                renderAccountContent();
                if (typeof window.showToast === 'function') {
                    window.showToast(`Welcome ${currentUser.displayName || 'Club Member'}!`);
                }
            } catch (err) {
                console.error(err);
                errorMsg.textContent = err.message;
                errorMsg.style.display = 'block';
                submitBtn.disabled = false;
                submitBtn.textContent = activeTab === 'login' ? 'Sign In to Club' : 'Create Loyalty Account';
            }
        });
    }

    // Render Logged In User Dashboard with loyalty levels and cloud reservations
    async function renderUserProfile(container) {
        // Fetch user document from Firestore to get Loyalty Points
        let userData = { loyaltyPoints: 0 };
        const displayName = currentUser.displayName || 'Club Member';
        
        try {
            const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
            if (userDoc.exists()) {
                userData = userDoc.data();
            } else {
                // If doc doesn't exist, bootstrap it
                await setDoc(doc(db, 'users', currentUser.uid), {
                    name: displayName,
                    email: currentUser.email,
                    createdAt: serverTimestamp(),
                    loyaltyPoints: 0
                });
            }
        } catch (e) {
            console.error('Failed to get user profile document:', e);
        }

        const pts = userData.loyaltyPoints || 0;
        
        // Define tiers
        let tierName = "Silver Loyalty Member";
        let tierBadgeText = "SILVER";
        let tierMin = 0;
        let tierNext = "Next Tier: Gold at 200 pts";
        let progressPercent = (pts / 200) * 100;
        let cardBg = "linear-gradient(135deg, #1b1b22 0%, #111116 100%)";
        let borderStyle = "1px solid rgba(255, 255, 255, 0.05)";
        let glowColor = "rgba(245, 132, 31, 0.15)";
        let badgeStyle = "background: rgba(255,255,255,0.06); color: var(--color-gray-300); border: 1px solid rgba(255,255,255,0.04)";

        if (pts >= 500) {
            tierName = "Platinum Elite Club";
            tierBadgeText = "PLATINUM";
            tierMin = 500;
            tierNext = "Top loyalty Tier Reached!";
            progressPercent = 100;
            cardBg = "linear-gradient(135deg, #2c3e50 0%, #050508 100%)";
            borderStyle = "1px solid rgba(0, 230, 255, 0.25)";
            glowColor = "rgba(0, 230, 255, 0.25)";
            badgeStyle = "background: rgba(0, 230, 255, 0.1); color: #00e6ff; border: 1px solid rgba(0, 230, 255, 0.2)";
        } else if (pts >= 200) {
            tierName = "Gold VIP Executive";
            tierBadgeText = "GOLD";
            tierMin = 200;
            tierNext = "Next Tier: Platinum at 500 pts";
            progressPercent = ((pts - 200) / 300) * 100;
            cardBg = "linear-gradient(135deg, #2b1f0d 0%, #0c0904 100%)";
            borderStyle = "1px solid rgba(245, 132, 31, 0.3)";
            glowColor = "rgba(245, 132, 31, 0.25)";
            badgeStyle = "background: rgba(245, 132, 31, 0.1); color: var(--color-brand); border: 1px solid rgba(245, 132, 31, 0.2)";
        }

        const initials = displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || currentUser.email.substring(0, 2).toUpperCase();

        // Sub-renderers and helpers
        function getPassBackground(points) {
            if (points >= 500) return "linear-gradient(135deg, #0d0f14 0%, #020305 100%)";
            if (points >= 200) return "linear-gradient(135deg, #1c1409 0%, #070502 100%)";
            return "linear-gradient(135deg, #16171b 0%, #0b0c0e 100%)";
        }

        function getPassBorder(points) {
            if (points >= 500) return "2px solid rgba(0, 230, 255, 0.4)";
            if (points >= 200) return "2px solid rgba(245, 132, 31, 0.5)";
            return "2px solid rgba(255, 255, 255, 0.1)";
        }

        function getPassShadow(points) {
            if (points >= 500) return "0 15px 35px rgba(0, 230, 255, 0.25)";
            if (points >= 200) return "0 15px 35px rgba(245, 132, 31, 0.2)";
            return "0 15px 30px rgba(0, 0, 0, 0.6)";
        }

        function getPassColor(points) {
            if (points >= 500) return "#00e6ff";
            if (points >= 200) return "var(--color-brand)";
            return "var(--color-white)";
        }

        function renderPerkItem(title, subtitle, unlocked) {
            const color = unlocked ? "var(--color-white)" : "var(--color-gray-500)";
            const descColor = unlocked ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.25)";
            const icon = unlocked ? "✔️" : "🔒";
            const iconStyle = unlocked ? "color: #4cd964; margin-right: 0.5rem; font-weight: bold;" : "color: var(--color-gray-500); margin-right: 0.5rem;";
            return `
                <div style="display: flex; align-items: flex-start; gap: 0.5rem;">
                    <span style="${iconStyle}">${icon}</span>
                    <div>
                        <h6 style="font-size: 0.8rem; font-weight: 500; color: ${color}; margin: 0;">${title}</h6>
                        <p style="font-size: 0.72rem; color: ${descColor}; margin: 0.1rem 0 0 0;">${subtitle}</p>
                    </div>
                </div>
            `;
        }

        function generateDynamicBarcode() {
            let barsHTML = '';
            const widths = [1.5, 2.5, 3.5, 4.5];
            for (let i = 0; i < 45; i++) {
                const width = widths[Math.floor(Math.random() * widths.length)];
                barsHTML += `<div style="width: ${width}px; background: #000; height: 42px; margin-right: ${Math.random() > 0.65 ? '2.5px' : '1.5px'}; flex-shrink: 0;"></div>`;
            }
            return `<div style="display: flex; align-items: stretch; height: 42px; justify-content: center; overflow: hidden; width: 100%; max-width: 250px; margin: 0 auto; background: white;">${barsHTML}</div>`;
        }

        container.innerHTML = `
            <!-- Header -->
            <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 0.5rem 0 1rem 0; border-bottom: 1px solid rgba(255,255,255,0.06);">
                <div style="width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(135deg, #f5841f, #ff7f36); display: flex; align-items: center; justify-content: center; color: var(--color-white); font-size: 1.5rem; font-weight: 600; margin-bottom: 0.75rem; box-shadow: 0 4px 15px rgba(245, 132, 31, 0.3); border: 2px solid var(--color-white)">
                    <span>${initials}</span>
                </div>
                <h3 style="font-size: 1.3rem; color: var(--color-white); font-weight: 600; margin-bottom: 0.15rem;">${displayName}</h3>
                <p style="font-size: 0.8rem; color: var(--color-gray-500); font-family: var(--font-mono);">${currentUser.email}</p>
            </div>

            <!-- Sub Navigation Tabs -->
            <div style="display: flex; gap: 0.4rem; background: rgba(255,255,255,0.03); padding: 0.25rem; border-radius: 10px; margin: 1.25rem 0; border: 1px solid rgba(255,255,255,0.04);">
                <button id="tab-profile-dash" style="flex: 1; padding: 0.55rem; border-radius: 8px; font-size: 0.8rem; font-weight: 500; border: none; cursor: pointer; color: var(--color-white); background: var(--color-brand); transition: all 0.2s ease;">
                    Dashboard
                </button>
                <button id="tab-profile-rewards" style="flex: 1; padding: 0.55rem; border-radius: 8px; font-size: 0.8rem; font-weight: 500; border: none; cursor: pointer; color: var(--color-gray-500); background: transparent; transition: all 0.2s ease;">
                    Rewards Shop
                </button>
                <button id="tab-profile-pass" style="flex: 1; padding: 0.55rem; border-radius: 8px; font-size: 0.8rem; font-weight: 500; border: none; cursor: pointer; color: var(--color-gray-500); background: transparent; transition: all 0.2s ease;">
                    VIP Club Pass
                </button>
            </div>

            <!-- TAB CONTENT 1: DASHBOARD -->
            <div id="view-profile-dash" style="display: block;">
                <!-- Loyalty Status Card -->
                <div id="loyalty-card-container" style="margin-bottom: 1.5rem; background: ${cardBg}; border: ${borderStyle}; border-radius: 12px; padding: 1.25rem; overflow: hidden; position: relative;">
                    <div class="card-glow" style="position: absolute; width: 150px; height: 150px; border-radius: 50%; background: radial-gradient(circle, ${glowColor} 0%, transparent 70%); top: -40px; right: -40px;"></div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <div>
                            <span style="font-size: 0.72rem; font-family: var(--font-mono); text-transform: uppercase; color: var(--color-brand); letter-spacing: 0.1em;">LOYALTY TIER</span>
                            <h4 style="font-size: 1.15rem; color: var(--color-white); font-weight: 600; margin-top: 0.1rem;">${tierName}</h4>
                        </div>
                        <div style="padding: 0.25rem 0.75rem; border-radius: 50px; font-size: 0.65rem; font-weight: 600; text-transform: uppercase; ${badgeStyle};">
                            ${tierBadgeText}
                        </div>
                    </div>

                    <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.6rem;">
                        <span style="font-size: 0.8rem; color: var(--color-gray-500);">Loyalty Balance:</span>
                        <span style="font-size: 1.4rem; color: var(--color-white); font-weight: 700; font-family: var(--font-sans);">${pts} <span style="font-size: 0.8rem; font-weight: 400; color: var(--color-gray-500);">pts</span></span>
                    </div>

                    <!-- Points Progress Bar -->
                    <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.05); border-radius: 50px; margin-bottom: 0.5rem; overflow: hidden;">
                        <div style="width: ${Math.min(100, Math.max(5, progressPercent))}%; height: 100%; background: var(--color-brand); border-radius: 50px; transition: width 0.8s cubic-bezier(0.25, 0.8, 0.25, 1);"></div>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.72rem; color: var(--color-gray-500);">
                        <span>${tierMin} pts</span>
                        <span>${tierNext}</span>
                    </div>
                </div>

                <!-- Bookings List -->
                <div style="margin-top: 1.25rem;">
                    <h4 style="font-size: 0.85rem; text-transform: uppercase; font-family: var(--font-mono); color: var(--color-gray-500); letter-spacing: 0.05em; margin-bottom: 0.75rem;">Cloud Synced Bookings</h4>
                    <div id="profile-bookings-list" style="display: flex; flex-direction: column; gap: 0.75rem; max-height: 250px; overflow-y: auto; padding-right: 0.25rem;">
                        <div style="text-align: center; padding: 1.5rem; border: 1px dashed rgba(255,255,255,0.04); border-radius: 8px; color: var(--color-gray-500); font-size: 0.8rem;">
                            Loading bookings...
                        </div>
                    </div>
                </div>

                <!-- Reminders List -->
                <div style="margin-top: 1.5rem;">
                    <h4 style="font-size: 0.85rem; text-transform: uppercase; font-family: var(--font-mono); color: var(--color-gray-500); letter-spacing: 0.05em; margin-bottom: 0.75rem;">Your Movie Reminders</h4>
                    <div id="profile-reminders-list" style="display: flex; flex-direction: column; gap: 0.75rem; max-height: 150px; overflow-y: auto; padding-right: 0.25rem;">
                        <div style="text-align: center; padding: 1rem; border: 1px dashed rgba(255,255,255,0.04); border-radius: 8px; color: var(--color-gray-500); font-size: 0.8rem;">
                            Loading reminders...
                        </div>
                    </div>
                </div>
            </div>

            <!-- TAB CONTENT 2: REWARDS SHOP -->
            <div id="view-profile-rewards" style="display: none;">
                <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255,255,255,0.04); border-radius: 10px; padding: 1rem; display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
                    <div>
                        <p style="font-size: 0.75rem; color: var(--color-gray-500); font-family: var(--font-mono); text-transform: uppercase; letter-spacing: 0.05em;">Your Point Balance</p>
                        <h4 style="font-size: 1.15rem; color: var(--color-white); font-weight: 600; margin-top: 0.1rem;">
                            <span id="shop-pts-balance">${pts}</span> <span style="font-size: 0.8rem; font-weight: 400; color: var(--color-gray-500);">points</span>
                        </h4>
                    </div>
                    <div style="background: rgba(245, 132, 31, 0.1); border: 1px solid rgba(245, 132, 31, 0.2); border-radius: 8px; padding: 0.4rem 0.6rem; font-size: 0.72rem; color: var(--color-brand); font-weight: 500; display: flex; align-items: center; gap: 0.3rem;">
                        <i data-lucide="sparkles" style="width: 12px; height: 12px;"></i> Spend & Enjoy
                    </div>
                </div>

                <div id="rewards-shop-items" style="display: flex; flex-direction: column; gap: 0.75rem;">
                    <!-- Items populated dynamically -->
                </div>

                <div id="redeemed-vouchers-container" style="margin-top: 1.5rem; display: none;">
                    <h5 style="font-size: 0.8rem; text-transform: uppercase; font-family: var(--font-mono); color: var(--color-gray-500); letter-spacing: 0.05em; margin-bottom: 0.75rem;">Your Redeemed Rewards</h5>
                    <div id="redeemed-vouchers-list" style="display: flex; flex-direction: column; gap: 0.75rem; max-height: 200px; overflow-y: auto;">
                        <!-- Vouchers populated dynamically -->
                    </div>
                </div>
            </div>

            <!-- TAB CONTENT 3: CLUB PASS -->
            <div id="view-profile-pass" style="display: none;">
                <!-- Apple Wallet Pass Display -->
                <div id="digital-club-pass" style="background: ${getPassBackground(pts)}; border: ${getPassBorder(pts)}; border-radius: 16px; padding: 1.25rem; position: relative; box-shadow: ${getPassShadow(pts)}; overflow: hidden; margin-bottom: 1.5rem; transition: transform 0.3s ease;">
                    <!-- Top Ribbon -->
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 0.75rem;">
                        <div style="display: flex; align-items: center; gap: 0.4rem;">
                            <span style="font-weight: 800; font-size: 0.95rem; color: var(--color-white); letter-spacing: -0.02em;">NU METRO</span>
                            <span style="background: var(--color-brand); color: var(--color-white); font-size: 0.55rem; font-weight: 700; padding: 0.1rem 0.3rem; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.05em;">VIP Club</span>
                        </div>
                        <span style="font-size: 0.65rem; font-family: var(--font-mono); color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.08em;">MEMBER SCAN PASS</span>
                    </div>

                    <!-- Pass Middle Body -->
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem;">
                        <div>
                            <span style="display: block; font-size: 0.62rem; font-family: var(--font-mono); color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.05em;">PASS MEMBER</span>
                            <span style="font-size: 1.1rem; font-weight: 600; color: var(--color-white); line-height: 1.2;">${displayName}</span>
                        </div>
                        <div style="text-align: right;">
                            <span style="display: block; font-size: 0.62rem; font-family: var(--font-mono); color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.05em;">MEMBERSHIP LEVEL</span>
                            <span style="font-size: 1rem; font-weight: 700; color: ${getPassColor(pts)}; text-transform: uppercase; letter-spacing: 0.02em;">${tierBadgeText}</span>
                        </div>
                    </div>

                    <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.25); border-radius: 10px; padding: 0.75rem 1rem; border: 1px solid rgba(255,255,255,0.04);">
                        <div>
                            <span style="display: block; font-size: 0.6rem; font-family: var(--font-mono); color: rgba(255,255,255,0.4); text-transform: uppercase;">ID NUMBER</span>
                            <span style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--color-white); font-weight: 500;">NM-${currentUser.uid.substring(currentUser.uid.length - 8).toUpperCase()}</span>
                        </div>
                        <div style="text-align: right;">
                            <span style="display: block; font-size: 0.6rem; font-family: var(--font-mono); color: rgba(255,255,255,0.4); text-transform: uppercase;">LOYALTY POINTS</span>
                            <span style="font-size: 0.9rem; font-weight: 700; color: var(--color-white);">${pts} <span style="font-size: 0.65rem; font-weight: 400; color: rgba(255,255,255,0.6);">pts</span></span>
                        </div>
                    </div>

                    <!-- Scan Barcode/QR area -->
                    <div style="margin-top: 1.25rem; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; background: var(--color-white); border-radius: 12px; padding: 1rem 0.5rem 0.75rem 0.5rem; text-align: center;">
                        <!-- Generates dynamic CSS barcode -->
                        ${generateDynamicBarcode()}
                        <div style="display: flex; flex-direction: column; gap: 0.1rem; margin-top: 0.25rem;">
                            <span style="font-family: var(--font-mono); font-size: 0.75rem; color: #111; font-weight: 600;">NM-${currentUser.uid.substring(currentUser.uid.length - 8).toUpperCase()}</span>
                            <span style="font-size: 0.62rem; color: var(--color-gray-500); font-weight: 500;">Present barcode to cashier or scanner at concessions counter</span>
                        </div>
                    </div>
                </div>

                <!-- Perks list -->
                <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255,255,255,0.04); border-radius: 12px; padding: 1.25rem;">
                    <h5 style="font-size: 0.8rem; text-transform: uppercase; font-family: var(--font-mono); color: var(--color-gray-500); letter-spacing: 0.05em; margin-bottom: 0.75rem;">Your Exclusive Perks</h5>
                    <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                        ${renderPerkItem("Earning Level: Basic (1x)", "Earn points on purchases", true)}
                        ${renderPerkItem("Complimentary Birthday popcorn combo", "Receive a medium popcorn bundle on your birthday", true)}
                        ${renderPerkItem("Double Points Earning (2x)", "Unlocked at Gold VIP level (200+ pts)", pts >= 200)}
                        ${renderPerkItem("Concessions Discount: 10% Off", "Unlocked at Gold VIP level (200+ pts)", pts >= 200)}
                        ${renderPerkItem("Priority VIP Queue Access", "Unlocked at Gold VIP level (200+ pts)", pts >= 200)}
                        ${renderPerkItem("Triple Points Earning (3x)", "Unlocked at Platinum Elite level (500+ pts)", pts >= 500)}
                        ${renderPerkItem("Luxury VIP Lounge Entry", "Free upgrades & exclusive room entry (500+ pts)", pts >= 500)}
                        ${renderPerkItem("Pre-release Screenings Access", "Receive first-row reservation invitations (500+ pts)", pts >= 500)}
                    </div>
                </div>
            </div>

            <!-- Footer Action Buttons -->
            <div style="margin-top: 2rem; display: flex; gap: 1rem; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 1.25rem;">
                <button id="profile-logout-btn" class="btn-apple-secondary" style="flex: 1; padding: 0.75rem; font-size: 0.85rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; cursor: pointer;">
                    <i data-lucide="log-out" style="width: 14px; height: 14px;"></i> Sign Out
                </button>
                <button id="profile-sync-btn" class="btn-apple-primary" style="flex: 1; padding: 0.75rem; font-size: 0.85rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; cursor: pointer;">
                    <i data-lucide="refresh-cw" style="width: 14px; height: 14px;"></i> Sync Storage
                </button>
            </div>
        `;

        if (typeof lucide !== 'undefined') { lucide.createIcons(); }

        // Core dynamic operations
        const rewardItemsData = [
            {
                id: 'popcorn_combo',
                name: 'Regular Popcorn Combo',
                cost: 150,
                desc: 'Fresh salt popcorn and a refreshing 500ml beverage.',
                icon: 'popcorn'
            },
            {
                id: 'vip_soda',
                name: 'VIP Lounge Soft Drink',
                cost: 80,
                desc: 'Enjoy any standard draught or canned cold drink.',
                icon: 'cup-soda'
            },
            {
                id: 'movie_discount',
                name: 'Nu Metro Ticket Discount',
                cost: 300,
                desc: 'Get R50 discount on any 2D, 3D, or VIP movie ticket.',
                icon: 'ticket'
            }
        ];

        function setupProfileTabs() {
            const tabDash = document.getElementById('tab-profile-dash');
            const tabRewards = document.getElementById('tab-profile-rewards');
            const tabPass = document.getElementById('tab-profile-pass');

            const viewDash = document.getElementById('view-profile-dash');
            const viewRewards = document.getElementById('view-profile-rewards');
            const viewPass = document.getElementById('view-profile-pass');

            const tabs = [tabDash, tabRewards, tabPass];
            const views = [viewDash, viewRewards, viewPass];

            const setActiveTab = (activeIndex) => {
                tabs.forEach((tab, index) => {
                    if (index === activeIndex) {
                        tab.style.color = "var(--color-white)";
                        tab.style.background = "var(--color-brand)";
                    } else {
                        tab.style.color = "var(--color-gray-500)";
                        tab.style.background = "transparent";
                    }
                });

                views.forEach((view, index) => {
                    view.style.display = index === activeIndex ? 'block' : 'none';
                });
            };

            tabDash.addEventListener('click', () => setActiveTab(0));
            tabRewards.addEventListener('click', () => setActiveTab(1));
            tabPass.addEventListener('click', () => setActiveTab(2));
        }

        async function fetchAndRenderBookings() {
            const bookingsListEl = document.getElementById('profile-bookings-list');
            if (!bookingsListEl) return;

            try {
                const bookingsSnap = await getDocs(query(collection(db, 'users', currentUser.uid, 'bookings'), orderBy('bookedAt', 'desc')));
                if (bookingsSnap.empty) {
                    bookingsListEl.innerHTML = `
                        <div style="text-align: center; padding: 1.5rem; border: 1px dashed rgba(255,255,255,0.05); border-radius: 8px; color: var(--color-gray-500); font-size: 0.8rem;">
                            No cloud-saved tickets. Book some seats to build history!
                        </div>
                    `;
                } else {
                    bookingsListEl.innerHTML = '';
                    bookingsSnap.forEach(docSnap => {
                        const bk = docSnap.data();
                        const item = document.createElement('div');
                        item.style = "background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255,255,255,0.04); border-radius: 8px; padding: 0.75rem 1rem; display: flex; justify-content: space-between; align-items: center; gap: 1rem;";
                        
                        item.innerHTML = `
                            <div style="display: flex; flex-direction: column; gap: 0.2rem;">
                                <h5 style="color: var(--color-white); font-weight: 500; font-size: 0.85rem; margin: 0;">${bk.movieTitle}</h5>
                                <p style="font-size: 0.72rem; color: var(--color-gray-500); margin: 0;">${bk.showtime || 'Time unspecified'}</p>
                                <p style="font-size: 0.72rem; color: var(--color-brand); font-family: var(--font-mono); margin: 0;">Seats: ${bk.seats || 'None'}</p>
                            </div>
                            <div style="text-align: right; flex-shrink: 0;">
                                <button class="btn-view-qr btn-apple-secondary" data-ref="${bk.refCode || ''}" data-movie="${bk.movieTitle}" data-showtime="${bk.showtime || ''}" data-seats="${bk.seats || ''}" style="padding: 0.4rem 0.75rem; font-size: 0.75rem; cursor: pointer; border-radius: 6px;">
                                    Show Ticket
                                </button>
                            </div>
                        `;
                        bookingsListEl.appendChild(item);
                    });

                    // Attach click handlers to tickets
                    bookingsListEl.querySelectorAll('.btn-view-qr').forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            closeAccountModal();
                            if (typeof window.showToast === 'function') {
                                const data = {
                                    movieTitle: btn.getAttribute('data-movie'),
                                    showtime: btn.getAttribute('data-showtime'),
                                    seats: btn.getAttribute('data-seats'),
                                    refCode: btn.getAttribute('data-ref')
                                };
                                window.showToast("Your Digital Ticket", data);
                            }
                        });
                    });
                }
            } catch (err) {
                console.error('Error fetching bookings:', err);
                bookingsListEl.innerHTML = `
                    <div style="text-align: center; padding: 1rem; color: #ff6b6b; font-size: 0.8rem;">
                        Could not load bookings.
                    </div>
                `;
            }
        }

        async function fetchAndRenderReminders() {
            const remindersListEl = document.getElementById('profile-reminders-list');
            if (!remindersListEl) return;

            try {
                const remindersSnap = await getDocs(collection(db, 'users', currentUser.uid, 'reminders'));
                if (remindersSnap.empty) {
                    remindersListEl.innerHTML = `
                        <div style="text-align: center; padding: 1rem; border: 1px dashed rgba(255,255,255,0.05); border-radius: 8px; color: var(--color-gray-500); font-size: 0.8rem;">
                            No release reminders set.
                        </div>
                    `;
                } else {
                    remindersListEl.innerHTML = '';
                    remindersSnap.forEach(docSnap => {
                        const r = docSnap.data();
                        const item = document.createElement('div');
                        item.style = "background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255,255,255,0.04); border-radius: 8px; padding: 0.6rem 1rem; display: flex; justify-content: space-between; align-items: center; gap: 1rem;";
                        
                        item.innerHTML = `
                            <div style="display: flex; flex-direction: column; gap: 0.1rem;">
                                <h5 style="color: var(--color-white); font-weight: 500; font-size: 0.8rem; margin: 0;">${docSnap.id}</h5>
                                <p style="font-size: 0.72rem; color: var(--color-gray-500); margin: 0;">${r.expected || 'Release Soon'}</p>
                            </div>
                            <div style="flex-shrink: 0;">
                                <button class="btn-remove-reminder-cloud btn-apple-secondary" data-title="${docSnap.id}" style="padding: 0.25rem 0.5rem; font-size: 0.7rem; cursor: pointer; border-radius: 4px; color: var(--color-accent);">
                                    Remove
                                </button>
                            </div>
                        `;
                        remindersListEl.appendChild(item);
                    });

                    remindersListEl.querySelectorAll('.btn-remove-reminder-cloud').forEach(btn => {
                        btn.addEventListener('click', async (e) => {
                            const title = btn.getAttribute('data-title');
                            btn.disabled = true;
                            btn.textContent = 'Removing...';
                            
                            if (typeof window.removeReminder === 'function') {
                                window.removeReminder(title);
                            } else {
                                await deleteDoc(doc(db, 'users', currentUser.uid, 'reminders', title));
                            }
                            
                            await renderUserProfile(document.getElementById('account-modal-body'));
                        });
                    });
                }
            } catch (err) {
                console.error('Error fetching reminders:', err);
                remindersListEl.innerHTML = `
                    <div style="text-align: center; padding: 1rem; color: #ff6b6b; font-size: 0.8rem;">
                        Could not load reminders.
                    </div>
                `;
            }
        }

        async function fetchAndRenderRewardsShop(currentPoints) {
            const shopContainer = document.getElementById('rewards-shop-items');
            if (!shopContainer) return;

            shopContainer.innerHTML = '';

            rewardItemsData.forEach(item => {
                const card = document.createElement('div');
                card.style = "background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255,255,255,0.04); border-radius: 8px; padding: 0.85rem; display: flex; justify-content: space-between; align-items: center; gap: 1rem;";
                
                const isAffordable = currentPoints >= item.cost;
                const btnStyle = isAffordable 
                    ? "background: var(--color-brand); color: var(--color-white); border: none; padding: 0.45rem 0.85rem; border-radius: 6px; font-size: 0.75rem; font-weight: 500; cursor: pointer; transition: all 0.2s;"
                    : "background: rgba(255,255,255,0.05); color: var(--color-gray-500); border: none; padding: 0.45rem 0.85rem; border-radius: 6px; font-size: 0.75rem; font-weight: 500; cursor: not-allowed;";

                card.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <div style="width: 42px; height: 42px; border-radius: 8px; background: rgba(245, 132, 31, 0.08); border: 1px solid rgba(245, 132, 31, 0.15); display: flex; align-items: center; justify-content: center; color: var(--color-brand);">
                            <i data-lucide="${item.icon}" style="width: 20px; height: 20px;"></i>
                        </div>
                        <div style="text-align: left;">
                            <h5 style="color: var(--color-white); font-weight: 500; font-size: 0.85rem; margin: 0;">${item.name}</h5>
                            <p style="font-size: 0.7rem; color: var(--color-gray-500); margin: 0.15rem 0 0 0; line-height: 1.3;">${item.desc}</p>
                        </div>
                    </div>
                    <div style="text-align: right; flex-shrink: 0; display: flex; flex-direction: column; align-items: flex-end; gap: 0.4rem;">
                        <span style="font-size: 0.85rem; font-weight: 700; color: var(--color-white); font-family: var(--font-sans);">${item.cost} <span style="font-size: 0.65rem; color: var(--color-gray-500); font-weight: 400;">pts</span></span>
                        <button class="btn-redeem-item" data-id="${item.id}" data-cost="${item.cost}" data-name="${item.name}" ${isAffordable ? '' : 'disabled'} style="${btnStyle}">
                            Redeem
                        </button>
                    </div>
                `;
                shopContainer.appendChild(card);
            });

            if (typeof lucide !== 'undefined') { lucide.createIcons(); }

            // Attach click listener for redeem
            shopContainer.querySelectorAll('.btn-redeem-item').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const itemId = btn.getAttribute('data-id');
                    const cost = parseInt(btn.getAttribute('data-cost'));
                    const name = btn.getAttribute('data-name');

                    btn.disabled = true;
                    btn.textContent = "Processing...";

                    try {
                        await redeemReward(itemId, name, cost);
                    } catch (e) {
                        console.error("Redeem failed:", e);
                        btn.disabled = false;
                        btn.textContent = "Redeem";
                    }
                });
            });

            // Also render active user redeemed rewards list
            await fetchAndRenderRedeemedVouchers();
        }

        async function redeemReward(itemId, name, cost) {
            if (!currentUser) return;

            try {
                const userRef = doc(db, 'users', currentUser.uid);
                
                // Transactional update to check and decrement point balance
                let success = false;
                await runTransaction(db, async (transaction) => {
                    const snap = await transaction.get(userRef);
                    const data = snap.data() || { loyaltyPoints: 0 };
                    const currentPts = data.loyaltyPoints || 0;

                    if (currentPts >= cost) {
                        transaction.update(userRef, { loyaltyPoints: currentPts - cost });
                        success = true;
                    }
                });

                if (!success) {
                    if (typeof window.showToast === 'function') {
                        window.showToast("Insufficient loyalty points!");
                    }
                    return;
                }

                // Create redemption document in user subcollection
                const voucherCode = `NM-REWARD-${Math.floor(100000 + Math.random() * 900000)}`;
                const rewardDocId = `reward_${Date.now()}`;
                
                await setDoc(doc(db, 'users', currentUser.uid, 'rewards', rewardDocId), {
                    itemId: itemId,
                    rewardName: name,
                    cost: cost,
                    voucherCode: voucherCode,
                    redeemedAt: serverTimestamp(),
                    isUsed: false
                });

                // Show a success animation / modal toast
                if (typeof window.showToast === 'function') {
                    const toastData = {
                        movieTitle: name,
                        showtime: `Voucher Pass Code: ${voucherCode}`,
                        seats: 'Scan barcode below',
                        refCode: voucherCode
                    };
                    window.showToast("Reward Redeemed Successfully!", toastData);
                }

                // Trigger full refresh of user profile to show updated points and voucher lists
                await renderUserProfile(document.getElementById('account-modal-body'));

            } catch (e) {
                console.error("Error redeeming reward:", e);
                if (typeof window.showToast === 'function') {
                    window.showToast("Redemption error. Please try again.");
                }
            }
        }

        async function fetchAndRenderRedeemedVouchers() {
            const redeemedContainer = document.getElementById('redeemed-vouchers-container');
            const redeemedList = document.getElementById('redeemed-vouchers-list');
            if (!redeemedContainer || !redeemedList) return;

            try {
                const rewardsSnap = await getDocs(query(collection(db, 'users', currentUser.uid, 'rewards'), orderBy('redeemedAt', 'desc')));
                if (rewardsSnap.empty) {
                    redeemedContainer.style.display = 'none';
                    return;
                }

                redeemedContainer.style.display = 'block';
                redeemedList.innerHTML = '';

                rewardsSnap.forEach(docSnap => {
                    const v = docSnap.data();
                    const item = document.createElement('div');
                    item.style = "background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255,255,255,0.04); border-radius: 8px; padding: 0.6rem 0.85rem; display: flex; justify-content: space-between; align-items: center; gap: 1rem;";
                    
                    item.innerHTML = `
                        <div style="display: flex; flex-direction: column; gap: 0.15rem; text-align: left;">
                            <h6 style="color: var(--color-white); font-weight: 500; font-size: 0.8rem; margin: 0;">${v.rewardName}</h6>
                            <p style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--color-brand); margin: 0;">Code: ${v.voucherCode}</p>
                        </div>
                        <div style="flex-shrink: 0;">
                            <button class="btn-show-voucher btn-apple-secondary" data-name="${v.rewardName}" data-code="${v.voucherCode}" style="padding: 0.35rem 0.65rem; font-size: 0.72rem; cursor: pointer; border-radius: 5px;">
                                Show Code
                            </button>
                        </div>
                    `;
                    redeemedList.appendChild(item);
                });

                // Attach ticket view handler
                redeemedList.querySelectorAll('.btn-show-voucher').forEach(btn => {
                    btn.addEventListener('click', () => {
                        closeAccountModal();
                        if (typeof window.showToast === 'function') {
                            const data = {
                                movieTitle: btn.getAttribute('data-name'),
                                showtime: `Voucher Code: ${btn.getAttribute('data-code')}`,
                                seats: 'Concessions Reward Pass',
                                refCode: btn.getAttribute('data-code')
                            };
                            window.showToast("Your Concessions Voucher", data);
                        }
                    });
                });

            } catch (e) {
                console.error("Error loading redeemed rewards:", e);
            }
        }

        function setupProfileActionButtons() {
            // Attach Logout Action
            document.getElementById('profile-logout-btn').addEventListener('click', async () => {
                await signOut(auth);
                localStorage.removeItem('numetro_fallback_user');
                currentUser = null;
                updateUserProfileAvatar();
                renderAccountContent();
                if (typeof window.showToast === 'function') {
                    window.showToast("Signed out successfully.");
                }
            });

            // Attach Force Sync Action
            document.getElementById('profile-sync-btn').addEventListener('click', async (e) => {
                const btn = e.currentTarget;
                const originalHTML = btn.innerHTML;
                btn.disabled = true;
                btn.innerHTML = `<i data-lucide="refresh-cw" class="animate-spin" style="width: 14px; height: 14px;"></i> Synchronizing...`;
                if (typeof lucide !== 'undefined') { lucide.createIcons(); }
                
                await syncLocalDataToCloud();
                await renderUserProfile(document.getElementById('account-modal-body'));
                
                btn.disabled = false;
                btn.innerHTML = originalHTML;
                if (typeof lucide !== 'undefined') { lucide.createIcons(); }
            });
        }

        setupProfileTabs();
        await fetchAndRenderBookings();
        await fetchAndRenderReminders();
        await fetchAndRenderRewardsShop(pts);
        setupProfileActionButtons();
    }

    // Merges client-side localStorage state into user's Cloud Firestore
    async function syncLocalDataToCloud() {
        if (!currentUser) return;

        try {
            // 1. Sync Bookings
            const localBookingsRaw = localStorage.getItem('numetro_bookings');
            if (localBookingsRaw) {
                const localBookings = JSON.parse(localBookingsRaw);
                const bookingKeys = Object.keys(localBookings).filter(k => localBookings[k]);
                
                const bookingPromises = bookingKeys.map(async (key) => {
                    const parts = key.split('_');
                    if (parts.length >= 3) {
                        const movieTitle = parts[0];
                        const showtimeId = parts[1];
                        const seatId = parts[2];

                        const bookingDocId = `${currentUser.uid}_${movieTitle.replace(/\s+/g, '_')}_${showtimeId}_${seatId}`;
                        const bookingDocRef = doc(db, 'users', currentUser.uid, 'bookings', bookingDocId);
                        
                        try {
                            const docCheck = await getDoc(bookingDocRef);
                            if (!docCheck.exists()) {
                                await setDoc(bookingDocRef, {
                                    movieTitle: movieTitle,
                                    showtime: `Session: ${showtimeId.toUpperCase()}`,
                                    seats: seatId,
                                    refCode: `NM-CLOUD-${Math.floor(10000 + Math.random() * 90000)}`,
                                    bookedAt: serverTimestamp()
                                });
                                return LOYALTY_PTS_PER_SEAT;
                            }
                        } catch (e) {
                            console.error("Error syncing booking doc:", e);
                        }
                    }
                    return 0;
                });

                const results = await Promise.all(bookingPromises);
                const pointsAdded = results.reduce((sum, val) => sum + val, 0);

                if (pointsAdded > 0) {
                    const userRef = doc(db, 'users', currentUser.uid);
                    await setDoc(userRef, {
                        loyaltyPoints: increment(pointsAdded)
                    }, { merge: true });
                }
            }

            // 2. Sync Reminders
            const localRemindersRaw = localStorage.getItem('numetro_reminders');
            if (localRemindersRaw) {
                const localReminders = JSON.parse(localRemindersRaw);
                const reminderPromises = Object.keys(localReminders).map(async (movieTitle) => {
                    const remData = localReminders[movieTitle];
                    try {
                        await setDoc(doc(db, 'users', currentUser.uid, 'reminders', movieTitle), {
                            expected: remData.expected || 'Release Soon',
                            genres: remData.genres || '',
                            channels: remData.channels || [],
                            savedAt: serverTimestamp()
                        });
                    } catch (e) {
                        console.error("Error syncing reminder doc:", e);
                    }
                });
                await Promise.all(reminderPromises);
            }

            console.log('Local guest storage successfully synchronized to Firebase account.');
        } catch (err) {
            console.error('Error synchronizing guest storage to Cloud Firestore:', err);
        }
    }

    // Overrides / patches existing AppState transaction blocks to trigger Cloud save
    function wrapAppLogic() {
        // Intercept Booking Confirmation
        if (typeof window.confirmBooking === 'function') {
            const originalConfirmBooking = window.confirmBooking;
            window.confirmBooking = function () {
                // Keep track of what is about to be booked to calculate points
                const seatsCount = (window.AppState && window.AppState.selectedSeats) ? window.AppState.selectedSeats.length : 0;
                const movie = (window.AppState && window.AppState.selectedShowtime) ? window.AppState.selectedShowtime.movie : null;
                const showtime = (window.AppState && window.AppState.selectedShowtime) ? window.AppState.selectedShowtime.showtime : null;
                
                // Execute original baseline booking
                originalConfirmBooking();

                // If logged in, push this new booking to Firestore immediately!
                if (currentUser && seatsCount > 0 && movie && showtime) {
                    saveActiveBookingToFirestore(movie, showtime, window.AppState.selectedSeats || []);
                }
            };
        }

        // Intercept Reminders
        if (typeof window.saveReminder === 'function') {
            const originalSaveReminder = window.saveReminder;
            window.saveReminder = function (movieTitle, reminderData) {
                originalSaveReminder(movieTitle, reminderData);
                if (currentUser) {
                    setDoc(doc(db, 'users', currentUser.uid, 'reminders', movieTitle), {
                        expected: reminderData.expected || 'Release Soon',
                        genres: reminderData.genres || '',
                        channels: reminderData.channels || [],
                        savedAt: serverTimestamp()
                    }).catch(e => console.error('Cloud reminder save failed:', e));
                }
            };
        }

        if (typeof window.removeReminder === 'function') {
            const originalRemoveReminder = window.removeReminder;
            window.removeReminder = function (movieTitle) {
                originalRemoveReminder(movieTitle);
                if (currentUser) {
                    deleteDoc(doc(db, 'users', currentUser.uid, 'reminders', movieTitle))
                        .catch(e => console.error('Cloud reminder delete failed:', e));
                }
            };
        }
    }

    // Automatically writes a newly purchased ticket to Cloud Firestore and increments loyalty balance
    async function saveActiveBookingToFirestore(movie, showtime, seats) {
        if (!currentUser) return;

        try {
            const seatIds = seats.map(s => s.id).join(', ');
            const uniqueRef = `NM-${Math.floor(100000 + Math.random() * 900000)}-BOOK`;
            
            // Format dynamic date display
            let displayDate = window.AppState ? window.AppState.activeDate : '';
            if (displayDate) {
                try {
                    const dateObj = new Date(displayDate);
                    if (!isNaN(dateObj.getTime())) {
                        displayDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    }
                } catch(e) {}
            }

            const showtimeStr = `${displayDate} | ${showtime.time} | ${showtime.format || '2D'}`;

            const bookingId = `${currentUser.uid}_${movie.title.replace(/\s+/g, '_')}_${Date.now()}`;
            await setDoc(doc(db, 'users', currentUser.uid, 'bookings', bookingId), {
                movieTitle: movie.title,
                showtime: showtimeStr,
                seats: seatIds,
                refCode: uniqueRef,
                bookedAt: serverTimestamp()
            });

            // Increment Loyalty Points
            const earnedPoints = seats.length * LOYALTY_PTS_PER_SEAT;
            const userRef = doc(db, 'users', currentUser.uid);
            await runTransaction(db, async (transaction) => {
                const sSnap = await transaction.get(userRef);
                const currentPts = sSnap.exists() ? (sSnap.data().loyaltyPoints || 0) : 0;
                transaction.update(userRef, { loyaltyPoints: currentPts + earnedPoints });
            });

            console.log(`Successfully added ${earnedPoints} loyalty points for ${seats.length} seats.`);
        } catch (e) {
            console.error('Failed to sync new booking to Firestore:', e);
        }
    }

})();
