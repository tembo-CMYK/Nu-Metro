// Movie Metadata Enrichment for Immersive Apple TV Hero Showcase
const MOVIE_METADATA = {
    "Cocktail 2": {
        genres: "Comedy, Romance, Drama",
        description: "Three friends navigate the ups and downs of love, careers, and cocktails in this highly anticipated romantic comedy sequel.",
        trailerUrl: "https://www.youtube.com/embed/5F217q_V2r4", // Official trailer embed
        backdrop: "assets/Cocktail 2.jpg"
    },
    "Michael": {
        genres: "Biography, Drama, Music",
        description: "The definitive portrait of the King of Pop, exploring the creative brilliance, personal struggles, and global legacy of Michael Jackson.",
        trailerUrl: "https://www.youtube.com/embed/U31_J7Q22J0",
        backdrop: "assets/Michael.jpg"
    },
    "Minions & Monsters": {
        genres: "Animation, Comedy, Family",
        description: "When the Minions accidentally release a legendary underground monster, they must team up with Gru to catch it before chaos ensues.",
        trailerUrl: "https://www.youtube.com/embed/qQJeeGFgAuk",
        backdrop: "assets/Minions.jpg"
    },
    "Moana (Live Action)": {
        genres: "Adventure, Family, Fantasy",
        description: "A live-action adaptation of the beloved Disney classic about an adventurous teenager who sails out on a daring mission to save her people.",
        trailerUrl: "https://www.youtube.com/embed/hFEyZ47bW_c",
        backdrop: "assets/moana.jpg"
    },
    "Obsession": {
        genres: "Thriller, Drama, Mystery",
        description: "An intense psychological thriller where a simple infatuation spirals into a dangerous web of secrets, deceit, and dark obsession.",
        trailerUrl: "https://www.youtube.com/embed/hFEyZ47bW_c",
        backdrop: "assets/Obsession.webp"
    },
    "Spider-Man: Brand New Day": {
        genres: "Action, Sci-Fi, Adventure",
        description: "Peter Parker starts a fresh chapter in his life, facing new villains, complex friendships, and a brand new day of superhero responsibility.",
        trailerUrl: "https://www.youtube.com/embed/t06RUxPbp_c",
        backdrop: "assets/spiderman-.jpg"
    },
    "Supergirl": {
        genres: "Action, Adventure, Sci-Fi",
        description: "Kara Zor-El embraces her destiny as Earth's protector, fighting cosmic threats and finding her own voice in the shadow of her famous cousin.",
        trailerUrl: "https://www.youtube.com/embed/coA51CiaP3I",
        backdrop: "assets/supergirl.jpg"
    },
    "The Odyssey": {
        genres: "Action, Drama, History",
        description: "Christopher Nolan's epic adaptation of Homer's legendary tale of Odysseus' ten-year journey home after the fall of Troy.",
        trailerUrl: "https://www.youtube.com/embed/coA51CiaP3I",
        backdrop: "assets/the odyssey.jpg"
    },
    "Toy Story 5": {
        genres: "Animation, Adventure, Family",
        description: "Woody, Buzz, and the rest of the gang embark on a new adventure in a modern, tech-driven toy world that challenges their bonds of friendship.",
        trailerUrl: "https://www.youtube.com/embed/qQJeeGFgAuk",
        backdrop: "assets/Toy Story 5.jpg"
    },
    "Welcome to the Jungle": {
        genres: "Action, Comedy, Adventure",
        description: "A group of explorers gets stranded in a magical jungle, having to solve ancient puzzles and battle wild beasts to find their way home.",
        trailerUrl: "https://www.youtube.com/embed/2QKg5SZ_35I",
        backdrop: "assets/Welcome to the jungle.jpeg"
    }
};

const MOVIE_POSTERS = {
    "Cocktail 2": "assets/Cocktail 2 Poster.jpg",
    "Michael": "assets/Michael Poster.webp",
    "Minions & Monsters": "assets/Minions Poster.jpg",
    "Moana (Live Action)": "assets/Moana Poster.jpg",
    "Obsession": "assets/Obsession movie Poster.webp",
    "Spider-Man: Brand New Day": "assets/Brand New Day Poster.webp",
    "Supergirl": "assets/Supergirl Poster.jpg",
    "The Odyssey": "assets/The Odyssey Poster.jpg",
    "Toy Story 5": "assets/toy story 5 Poster.webp",
    "Welcome to the Jungle": "assets/Welcome to the Jungle Poster.webp"
};

// Application State Manager
const AppState = {
    activeDate: null,       // YYYY-MM-DD
    searchQuery: '',
    formatFilter: 'all',    // 'all', '2D', '3D'
    selectedShowtime: null, // { movie, date, showtime }
    selectedSeats: [],      // array of seat IDs e.g. "C-6"
    reservedBookings: {},    // persists user bookings: { 'movieTitle_sesID_seat': true }
    viewMode: 'grid',       // 'grid' or 'list'
    foodCart: {},           // { itemId: { name, price, qty } }
    
    // Apple TV Hero Slideshow State
    heroMovies: [],         // Array of movies featured on activeDate
    heroIndex: 0,           // Current active index
    heroRotatorTimer: null, // Timer interval object

    // Release Reminders State
    reminders: {},          // { 'Movie Title': { name, email, expected, genres, channels: [] } }
    activeReminderMovie: null // Active movie for reminder modal
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    // Load reserved bookings from LocalStorage
    const stored = localStorage.getItem('numetro_bookings');
    if (stored) {
        AppState.reservedBookings = JSON.parse(stored);
    }

    // Load reminders from LocalStorage
    const storedReminders = localStorage.getItem('numetro_reminders');
    if (storedReminders) {
        AppState.reminders = JSON.parse(storedReminders);
    } else {
        AppState.reminders = {};
    }

    // Initialize Lucide Icons
    if (typeof lucide !== 'undefined') { lucide.createIcons(); }

    // Preload movie asset images asynchronously
    preloadAllMovieImages();

    // Setup Calendar Strip
    setupCalendar();

    // Setup Event Listeners
    setupEventListeners();

    // Update Reminders visual states and list on startup
    updateRemindersUI();

    // Initialize 3D Card Hover Tilt
    setupCard3DTilt();

    // Initial Listing Render
    renderMovieGrid();
    
    // Initialize Hero Slideshow
    initializeHeroSlideshow();

    // Initialize Snack Bar Gourmet Menu
    setupFoodMenu();

    // Initialize Scroll Spy for Navigation Highlight Alignment
    setupScrollSpy();

    // Initialize Seating Grid zoom & panning capability
    setupSeatGridZoomAndPan();

    // Split loader text into letters for GSAP stagger animation
    const titleEl = document.querySelector('.intro-title');
    const subtitleEl = document.querySelector('.intro-subtitle');
    if (titleEl) {
        titleEl.innerHTML = titleEl.textContent
            .split('')
            .map(char => char === ' ' ? '&nbsp;' : `<span class="letter">${char}</span>`)
            .join('');
    }
    if (subtitleEl) {
        subtitleEl.innerHTML = subtitleEl.textContent
            .split('')
            .map(char => char === ' ' ? '&nbsp;' : `<span class="letter">${char}</span>`)
            .join('');
    }

    // Pre-set initial states for elements to avoid layout flashes
    gsap.set('.intro-logo', { opacity: 0, scale: 0.85 });
    gsap.set('.logo-circle', { strokeDashoffset: 277 });
    gsap.set('.logo-path', { strokeDashoffset: 131 });
    gsap.set('.intro-title .letter', { opacity: 0, rotationX: -90, y: 30, transformOrigin: "50% 50% -50px" });
    gsap.set('.intro-subtitle .letter', { opacity: 0, rotationX: 90, y: -20, transformOrigin: "50% 50% 50px" });
    gsap.set('.navbar', { opacity: 0, y: -20 });
    gsap.set('.hero-content', { opacity: 0, y: 30 });

    // Setup Magnetic Interactive Effect on Logo
    const logoContainer = document.querySelector('.intro-logo');
    let magnetActive = true;

    function handleMouseMove(e) {
        if (!magnetActive || !logoContainer) return;
        const rect = logoContainer.getBoundingClientRect();
        const logoX = rect.left + rect.width / 2;
        const logoY = rect.top + rect.height / 2;
        
        const deltaX = e.clientX - logoX;
        const deltaY = e.clientY - logoY;
        const distance = Math.hypot(deltaX, deltaY);
        
        if (distance < 180) {
            const pullFactor = 0.28;
            gsap.to(logoContainer, {
                x: deltaX * pullFactor,
                y: deltaY * pullFactor,
                rotation: deltaX * 0.12,
                duration: 0.35,
                ease: 'power2.out',
                overwrite: 'auto'
            });
        } else {
            gsap.to(logoContainer, {
                x: 0,
                y: 0,
                rotation: 0,
                duration: 0.8,
                ease: 'elastic.out(1, 0.4)',
                overwrite: 'auto'
            });
        }
    }

    document.addEventListener('mousemove', handleMouseMove);

    // Premium Brand Entrance Timing Orchestrator with GSAP
    const tl = gsap.timeline({
        onComplete: () => {
            magnetActive = false;
            document.removeEventListener('mousemove', handleMouseMove);
            
            const curtain = document.getElementById('intro-curtain');
            if (curtain) {
                curtain.style.display = 'none';
            }
        }
    });

    // 1. Draw SVG Logo
    tl.to('.intro-logo', {
        opacity: 1,
        scale: 1,
        duration: 0.8,
        ease: 'power2.out'
    })
    .to('.logo-circle', {
        strokeDashoffset: 0,
        duration: 1.5,
        ease: 'power2.inOut'
    }, 0.2)
    .to('.logo-path', {
        strokeDashoffset: 0,
        duration: 1.3,
        ease: 'power2.inOut'
    }, 0.5)

    // 2. Stagger-reveal Text
    .to('.intro-title .letter', {
        opacity: 1,
        rotationX: 0,
        y: 0,
        stagger: 0.05,
        duration: 0.8,
        ease: 'back.out(2)'
    }, '-=0.6')
    .to('.intro-subtitle .letter', {
        opacity: 1,
        rotationX: 0,
        y: 0,
        stagger: 0.05,
        duration: 0.7,
        ease: 'back.out(1.5)'
    }, '-=0.5')

    // 3. Logo Glow
    .to('.intro-logo', {
        filter: 'drop-shadow(0 0 18px rgba(245, 132, 31, 0.9))',
        duration: 0.5,
        yoyo: true,
        repeat: 1
    }, '-=0.2')

    // 4. Slide curtain shutters open
    .to('.intro-brand-wrapper', {
        opacity: 0,
        scale: 0.9,
        y: -30,
        duration: 0.6,
        ease: 'power2.in'
    }, '+=0.2')
    .to('.panel-left', {
        xPercent: -101,
        duration: 1.3,
        ease: 'expo.inOut'
    }, '-=0.1')
    .to('.panel-right', {
        xPercent: 101,
        duration: 1.3,
        ease: 'expo.inOut'
    }, '<')

    // 5. Stagger-reveal home page contents
    .to('.navbar', {
        opacity: 1,
        y: 0,
        duration: 1.0,
        ease: 'power3.out'
    }, '-=0.8')
    .to('.hero-content', {
        opacity: 1,
        y: 0,
        duration: 1.2,
        ease: 'power3.out',
        onComplete: () => {
            applyScrollReveal();
        }
    }, '-=0.9');
});

// Extract all unique dates from movie schedules
function getUniqueDates() {
    const dates = new Set();
    MOVIE_DATA.forEach(movie => {
        movie.schedule.forEach(sch => {
            if (sch.date) dates.add(sch.date);
        });
    });
    return Array.from(dates).sort();
}

// Generate Calendar Nav
function setupCalendar() {
    const dates = getUniqueDates();
    const strip = document.getElementById('calendar-strip');
    
    if (dates.length === 0) return;
    
    // Set initial active date
    AppState.activeDate = dates[0];
    updateActiveDateLabel();

    strip.innerHTML = '';
    
    dates.forEach(dateStr => {
        const dateObj = new Date(dateStr);
        const dayNum = dateObj.getDate();
        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
        const monthName = dateObj.toLocaleDateString('en-US', { month: 'short' });

        const dayBtn = document.createElement('div');
        dayBtn.className = 'calendar-day';
        if (dateStr === AppState.activeDate) {
            dayBtn.classList.add('active');
        }
        dayBtn.dataset.date = dateStr;

        dayBtn.innerHTML = `
            <span class="day-name">${dayName}</span>
            <span class="day-num">${dayNum}</span>
            <span class="month-name">${monthName}</span>
        `;

        dayBtn.addEventListener('click', () => {
            document.querySelectorAll('.calendar-day').forEach(el => el.classList.remove('active'));
            dayBtn.classList.add('active');
            AppState.activeDate = dateStr;
            updateActiveDateLabel();
            
            // Re-render listing for the new date (slideshow stays static)
            renderMovieGrid();
        });

        strip.appendChild(dayBtn);
    });

    // Calendar Scroll Controls
    const prevBtn = document.getElementById('cal-prev');
    const nextBtn = document.getElementById('cal-next');

    prevBtn.addEventListener('click', () => {
        strip.scrollBy({ left: -220, behavior: 'smooth' });
    });

    nextBtn.addEventListener('click', () => {
        strip.scrollBy({ left: 220, behavior: 'smooth' });
    });
}

function updateActiveDateLabel() {
    if (!AppState.activeDate) return;
    const dateObj = new Date(AppState.activeDate);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('active-date-label').textContent = dateObj.toLocaleDateString('en-US', options);
}

// Event Listeners for Search, Modals and Filters
function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', (e) => {
        AppState.searchQuery = e.target.value.toLowerCase().trim();
        renderMovieGrid();
    });

    // Format buttons
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            AppState.formatFilter = btn.dataset.format;
            renderMovieGrid();
        });
    });

    // Reset filters button
    document.getElementById('reset-filters').addEventListener('click', () => {
        searchInput.value = '';
        AppState.searchQuery = '';
        filterBtns.forEach(b => b.classList.remove('active'));
        document.querySelector('[data-format="all"]').classList.add('active');
        AppState.formatFilter = 'all';
        renderMovieGrid();
    });

    // Close booking modal
    document.getElementById('close-modal').addEventListener('click', closeModal);
    document.getElementById('booking-modal').addEventListener('click', (e) => {
        if (e.target.id === 'booking-modal') closeModal();
    });

    // Close dates modal
    document.getElementById('close-dates-modal').addEventListener('click', closeDatesModal);
    document.getElementById('dates-modal').addEventListener('click', (e) => {
        if (e.target.id === 'dates-modal') closeDatesModal();
    });

    // Close trailer modal
    document.getElementById('close-trailer-modal').addEventListener('click', closeTrailerModal);
    document.getElementById('trailer-modal').addEventListener('click', (e) => {
        if (e.target.id === 'trailer-modal') closeTrailerModal();
    });

    // Checkout confirm button
    document.getElementById('checkout-confirm-btn').addEventListener('click', confirmBooking);

    // Hero manual slider nav arrows
    document.getElementById('hero-prev').addEventListener('click', (e) => {
        e.stopPropagation();
        if (AppState.heroMovies.length === 0) return;
        AppState.heroIndex = (AppState.heroIndex - 1 + AppState.heroMovies.length) % AppState.heroMovies.length;
        renderHeroSlide(AppState.heroIndex);
        updateHeroIndicators();
        initializeHeroRotatorInterval();
    });

    document.getElementById('hero-next').addEventListener('click', (e) => {
        e.stopPropagation();
        if (AppState.heroMovies.length === 0) return;
        AppState.heroIndex = (AppState.heroIndex + 1) % AppState.heroMovies.length;
        renderHeroSlide(AppState.heroIndex);
        updateHeroIndicators();
        initializeHeroRotatorInterval();
    });

    // Scroll Down chevron
    document.getElementById('hero-scroll-down').addEventListener('click', (e) => {
        e.stopPropagation();
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.scrollIntoView({ behavior: 'smooth' });
        }
    });

    // View Switcher buttons
    const gridViewBtn = document.getElementById('view-grid-btn');
    const listViewBtn = document.getElementById('view-list-btn');

    if (gridViewBtn && listViewBtn) {
        gridViewBtn.addEventListener('click', () => {
            gridViewBtn.classList.add('active');
            listViewBtn.classList.remove('active');
            AppState.viewMode = 'grid';
            
            const grid = document.getElementById('movie-grid');
            if (grid) {
                grid.classList.remove('list-view-mode');
                grid.classList.add('grid-view-mode');
            }
            renderMovieGrid();
        });

        listViewBtn.addEventListener('click', () => {
            listViewBtn.classList.add('active');
            gridViewBtn.classList.remove('active');
            AppState.viewMode = 'list';
            
            const grid = document.getElementById('movie-grid');
            if (grid) {
                grid.classList.remove('grid-view-mode');
                grid.classList.add('list-view-mode');
            }
            renderMovieGrid();
        });
    }

    // Navbar Smooth Scroll Links
    document.getElementById('menu-showing').addEventListener('click', (e) => {
        e.preventDefault();
        const el = document.querySelector('.main-content');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    });
    
    document.getElementById('menu-coming').addEventListener('click', (e) => {
        e.preventDefault();
        const el = document.getElementById('coming-soon-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    });
    
    document.getElementById('menu-vip').addEventListener('click', (e) => {
        e.preventDefault();
        const el = document.getElementById('vip-club-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    });
    
    document.getElementById('menu-food').addEventListener('click', (e) => {
        e.preventDefault();
        const el = document.getElementById('food-drinks-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    });

    // VIP Lounge Join Form Submit Handler
    const vipForm = document.getElementById('vip-join-form');
    if (vipForm) {
        vipForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('vip-name').value;
            showToast(`Welcome ${name}! Your Nu Metro VIP Membership is now activated.`);
            vipForm.reset();
        });
    }

    // Toast close button
    const toastCloseBtn = document.getElementById('toast-close-btn');
    if (toastCloseBtn) {
        toastCloseBtn.addEventListener('click', () => {
            const toast = document.getElementById('toast');
            if (toast) toast.classList.remove('show');
        });
    }

    // Release Reminders Event Listeners
    const remindBtns = document.querySelectorAll('.btn-coming-soon-remind');
    remindBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const movieTitle = btn.dataset.movie;
            const expectedDate = btn.dataset.expected;
            const genres = btn.dataset.genres;

            // Instantly animate the bell icon on click
            const bellSvg = btn.querySelector('svg');
            if (bellSvg) {
                animateBellRing(bellSvg);
            }

            // Stagger modal opening slightly for high-end tactile feedback
            setTimeout(() => {
                openReminderModal(movieTitle, expectedDate, genres);
            }, 300);
        });
    });

    const closeReminderBtn = document.getElementById('close-reminder-modal');
    if (closeReminderBtn) {
        closeReminderBtn.addEventListener('click', closeReminderModal);
    }
    const reminderModal = document.getElementById('reminder-modal');
    if (reminderModal) {
        reminderModal.addEventListener('click', (e) => {
            if (e.target.id === 'reminder-modal') closeReminderModal();
        });
    }

    const reminderForm = document.getElementById('reminder-setup-form');
    if (reminderForm) {
        reminderForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('reminder-name').value.trim();
            const email = document.getElementById('reminder-email').value.trim();
            const alertDate = document.getElementById('reminder-date').value;
            const prefSms = document.getElementById('pref-sms').checked;
            const prefVip = document.getElementById('pref-vip').checked;

            const channels = ['Email'];
            if (prefSms) channels.push('SMS');
            if (prefVip) channels.push('Early Pre-sales');

            // Instantly animate the form's submit bell icon
            const submitBtn = document.getElementById('reminder-submit-btn');
            const bellSvg = submitBtn ? submitBtn.querySelector('svg') : null;
            if (bellSvg) {
                animateBellRing(bellSvg);
            }

            // Stagger persistence to match the visual swing duration beautifully
            setTimeout(() => {
                saveReminder(AppState.activeReminderMovie.title, {
                    name,
                    email,
                    expected: AppState.activeReminderMovie.expected,
                    genres: AppState.activeReminderMovie.genres,
                    alertDate,
                    channels
                });
            }, 450);
        });
    }
}

// 3D Card Hover Tilt Interactivity
function setupCard3DTilt() {
    const grid = document.getElementById('movie-grid');
    if (!grid) return;

    grid.addEventListener('mousemove', (e) => {
        const container = e.target.closest('.poster-container');
        if (!container) return;

        // Create glare element dynamically if it doesn't exist
        let glare = container.querySelector('.card-glare');
        if (!glare) {
            glare = document.createElement('div');
            glare.className = 'card-glare';
            container.appendChild(glare);
        }

        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left; // x position within the element
        const y = e.clientY - rect.top;  // y position within the element
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        // Max tilt of 10 degrees for elegant physical depth feel
        const tiltX = ((y - centerY) / centerY) * -10;
        const tiltY = ((x - centerX) / centerX) * 10;

        gsap.to(container, {
            rotationX: tiltX,
            rotationY: tiltY,
            scale: 1.03,
            transformPerspective: 1000,
            ease: 'power1.out',
            duration: 0.3,
            overwrite: 'auto'
        });

        gsap.to(glare, {
            opacity: 1,
            background: `radial-gradient(circle at ${x}px ${y}px, rgba(255, 255, 255, 0.16) 0%, transparent 65%)`,
            duration: 0.2,
            overwrite: 'auto'
        });
    });

    grid.addEventListener('mouseleave', (e) => {
        // Reset all poster containers
        document.querySelectorAll('.poster-container').forEach(container => {
            gsap.to(container, {
                rotationX: 0,
                rotationY: 0,
                scale: 1,
                ease: 'power2.out',
                duration: 0.5,
                overwrite: 'auto'
            });
            const glare = container.querySelector('.card-glare');
            if (glare) {
                gsap.to(glare, {
                    opacity: 0,
                    duration: 0.5,
                    overwrite: 'auto'
                });
            }
        });
    }, true);
}

// Preload all poster and backdrop assets asynchronously to ensure zero-lag transitions
function preloadAllMovieImages() {
    const imagesToPreload = new Set();
    
    // Add all movie posters
    if (typeof MOVIE_POSTERS !== 'undefined') {
        Object.values(MOVIE_POSTERS).forEach(src => {
            if (src) imagesToPreload.add(src);
        });
    }
    
    // Add all hero backdrop images
    if (typeof MOVIE_METADATA !== 'undefined') {
        Object.values(MOVIE_METADATA).forEach(meta => {
            if (meta.backdrop) imagesToPreload.add(meta.backdrop);
        });
    }
    
    // Fire off async non-blocking loading requests
    imagesToPreload.forEach(src => {
        const img = new Image();
        img.src = src;
        img.decoding = 'async';
    });
}

// Initialize Hero Slideshow
function initializeHeroSlideshow() {
    // Load all movies as featured carousel slides
    AppState.heroMovies = MOVIE_DATA;

    if (AppState.heroMovies.length === 0) return;

    AppState.heroIndex = 0;
    renderHeroSlide(AppState.heroIndex);
    renderHeroIndicators();

    // Start auto rotater (cycles every 7 seconds)
    if (AppState.heroRotatorTimer) clearInterval(AppState.heroRotatorTimer);
    AppState.heroRotatorTimer = setInterval(() => {
        AppState.heroIndex = (AppState.heroIndex + 1) % AppState.heroMovies.length;
        renderHeroSlide(AppState.heroIndex);
        updateHeroIndicators();
    }, 7000);
}

// Render active hero slide with staggered text reveals
function renderHeroSlide(index) {
    const movie = AppState.heroMovies[index];
    if (!movie) return;

    const titleEl = document.getElementById('hero-title');
    const synopsisEl = document.getElementById('hero-synopsis');
    const ratingEl = document.getElementById('hero-rating');
    const formatEl = document.getElementById('hero-format');
    const genresEl = document.getElementById('hero-genres');
    const backdropEl = document.getElementById('hero-backdrop');
    
    // Select detail groups
    const metaBox = document.querySelector('.hero-meta');
    const actionsBox = document.querySelector('.hero-actions');

    // Get metadata enrichment
    const meta = MOVIE_METADATA[movie.title] || {
        genres: "Action, Cinema",
        description: "Experience the magic of cinema in a premium luxury hall.",
        backdrop: MOVIE_POSTERS[movie.title] || ""
    };

    // Fade out backdrop and details, then update and stagger in
    gsap.killTweensOf([backdropEl, metaBox, titleEl, synopsisEl, actionsBox]);

    // Animate details fade/slide down and backdrop fade down
    gsap.timeline()
        .to([metaBox, titleEl, synopsisEl, actionsBox], {
            opacity: 0,
            y: 15,
            stagger: 0.04,
            duration: 0.2,
            ease: 'power2.in'
        })
        .to(backdropEl, {
            opacity: 0.15,
            duration: 0.25,
            ease: 'power2.inOut',
            onComplete: () => {
                // Update elements content
                titleEl.textContent = movie.title;
                synopsisEl.textContent = meta.description;
                ratingEl.textContent = movie.rating ? movie.rating : 'ALL';
                genresEl.textContent = meta.genres;

                // Find dimension format from schedules
                const firstSch = movie.schedule[0];
                const format = (firstSch && firstSch.showtimes.length > 0) ? firstSch.showtimes[0].dimension : '2D';
                formatEl.textContent = format;

                // Set backdrop cover
                if (meta.backdrop) {
                    backdropEl.style.backgroundImage = `url('${meta.backdrop}')`;
                } else {
                    backdropEl.style.backgroundImage = 'none';
                }

                // Reset Ken Burns class to trigger keyframes
                backdropEl.classList.remove('ken-burns');
                void backdropEl.offsetWidth; // force layout recalculation
                backdropEl.classList.add('ken-burns');
            }
        })
        // Fade backdrop back in
        .to(backdropEl, {
            opacity: 1,
            duration: 0.6,
            ease: 'power2.out'
        })
        // Stagger entrance of updated texts
        .fromTo([metaBox, titleEl, synopsisEl, actionsBox],
            { opacity: 0, y: -15 },
            {
                opacity: 1,
                y: 0,
                stagger: 0.06,
                duration: 0.65,
                ease: 'power3.out',
                clearProps: 'opacity,transform'
            },
            '-=0.3' // start while backdrop is fading back in
        );

    // Setup action buttons
    const bookBtn = document.getElementById('hero-book-btn');
    const trailerBtn = document.getElementById('hero-trailer-btn');

    // Clean old listeners
    const newBookBtn = bookBtn.cloneNode(true);
    const newTrailerBtn = trailerBtn.cloneNode(true);
    bookBtn.parentNode.replaceChild(newBookBtn, bookBtn);
    trailerBtn.parentNode.replaceChild(newTrailerBtn, trailerBtn);

    // Bind new listeners
    newBookBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const firstSch = movie.schedule[0];
        if (firstSch && firstSch.showtimes.length > 0) {
            AppState.activeDate = firstSch.date;
            updateActiveDateLabel();
            updateCalendarActiveState();
            openBookingModal(movie, firstSch.showtimes[0]);
        }
    });

    newTrailerBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openTrailerModal(meta.trailerUrl);
    });
}

// Render pagination dots for slideshow
function renderHeroIndicators() {
    const container = document.getElementById('hero-indicators');
    container.innerHTML = '';

    AppState.heroMovies.forEach((_, index) => {
        const dot = document.createElement('span');
        dot.className = 'indicator-dot' + (index === AppState.heroIndex ? ' active' : '');
        
        dot.addEventListener('click', () => {
            AppState.heroIndex = index;
            renderHeroSlide(AppState.heroIndex);
            updateHeroIndicators();
            
            // Reset interval to avoid immediate auto-rotation
            initializeHeroRotatorInterval();
        });
        
        container.appendChild(dot);
    });
}

function updateHeroIndicators() {
    const dots = document.querySelectorAll('.indicator-dot');
    dots.forEach((dot, idx) => {
        if (idx === AppState.heroIndex) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
}

function initializeHeroRotatorInterval() {
    if (AppState.heroRotatorTimer) clearInterval(AppState.heroRotatorTimer);
    AppState.heroRotatorTimer = setInterval(() => {
        AppState.heroIndex = (AppState.heroIndex + 1) % AppState.heroMovies.length;
        renderHeroSlide(AppState.heroIndex);
        updateHeroIndicators();
    }, 7000);
}

// Open YouTube Trailer Modal
function openTrailerModal(embedUrl) {
    const modal = document.getElementById('trailer-modal');
    const container = document.getElementById('video-player-container');
    
    // Add autoplay param
    const videoUrl = embedUrl + "?autoplay=1&rel=0";
    
    container.innerHTML = `
        <iframe src="${videoUrl}" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen>
        </iframe>
    `;

    modal.classList.add('open');
    document.body.style.overflow = 'hidden';

    // Pause hero rotator
    if (AppState.heroRotatorTimer) clearInterval(AppState.heroRotatorTimer);
}

function closeTrailerModal() {
    const modal = document.getElementById('trailer-modal');
    const container = document.getElementById('video-player-container');
    
    container.innerHTML = ''; // Kill video player
    modal.classList.remove('open');
    document.body.style.overflow = '';
    
    // Resume hero rotator
    initializeHeroRotatorInterval();
}

// Render dynamic vector poster placeholder (Fallback for new items)
function getMovieVectorGraphic(title) {
    const titleLower = title.toLowerCase();
    
    let colors = ['#1d263b', '#0c0f16', '#ff8e2b'];
    let iconSvg = '';

    if (titleLower.includes('cocktail')) {
        colors = ['#1a1005', '#080502', '#f5841f'];
        iconSvg = `<path d="M20 10 L80 10 L50 50 Z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="miter"/><line x1="50" y1="50" x2="50" y2="85" stroke="currentColor" stroke-width="4"/><line x1="30" y1="85" x2="70" y2="85" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><circle cx="50" cy="28" r="4" fill="currentColor"/>`;
    } else if (titleLower.includes('michael')) {
        colors = ['#1a1005', '#080502', '#f5841f'];
        iconSvg = `<rect x="40" y="20" width="20" height="40" rx="10" fill="none" stroke="currentColor" stroke-width="4"/><line x1="50" y1="60" x2="50" y2="85" stroke="currentColor" stroke-width="4"/><line x1="35" y1="85" x2="65" y2="85" stroke="currentColor" stroke-width="4"/><path d="M30 40 A20 20 0 0 0 70 40" fill="none" stroke="currentColor" stroke-width="3"/>`;
    } else if (titleLower.includes('minions')) {
        colors = ['#1a1005', '#080502', '#f5841f'];
        iconSvg = `<circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" stroke-width="4"/><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="4"/><circle cx="50" cy="50" r="4" fill="currentColor"/><path d="M25 40 L35 42 M75 40 L65 42" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>`;
    } else if (titleLower.includes('moana')) {
        colors = ['#1a1005', '#080502', '#f5841f'];
        iconSvg = `<path d="M50 15 A35 35 0 0 1 80 65 L50 65 Z M50 15 A35 35 0 0 0 20 65 L50 65 Z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/><path d="M15 75 Q50 65 85 75 L80 85 Q50 78 20 85 Z" fill="currentColor"/>`;
    } else if (titleLower.includes('obsession')) {
        colors = ['#1a1005', '#080502', '#f5841f'];
        iconSvg = `<path d="M12 35 C12 18 35 12 50 30 C65 12 88 18 88 35 C88 58 50 82 50 82 C50 82 12 58 12 35 Z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/>`;
    } else if (titleLower.includes('spider')) {
        colors = ['#1a1005', '#080502', '#f5841f'];
        iconSvg = `<circle cx="50" cy="50" r="10" fill="currentColor"/><line x1="50" y1="50" x2="15" y2="15" stroke="currentColor" stroke-width="3"/><line x1="50" y1="50" x2="85" y2="15" stroke="currentColor" stroke-width="3"/><line x1="50" y1="50" x2="15" y2="85" stroke="currentColor" stroke-width="3"/><line x1="50" y1="50" x2="85" y2="85" stroke="currentColor" stroke-width="3"/><path d="M50 30 Q30 50 50 70 Q70 50 50 30 M50 20 Q20 50 50 80 Q80 50 50 20" fill="none" stroke="currentColor" stroke-width="2"/>`;
    } else if (titleLower.includes('supergirl')) {
        colors = ['#1a1005', '#080502', '#f5841f'];
        iconSvg = `<polygon points="50,15 85,30 80,75 50,90 20,75 15,30" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/><path d="M35 38 Q50 32 60 42 Q50 48 35 52 Q65 60 55 75" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>`;
    } else if (titleLower.includes('odyssey')) {
        colors = ['#1a1005', '#080502', '#f5841f'];
        iconSvg = `<polygon points="50,15 25,65 50,55 75,65" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/><line x1="50" y1="55" x2="50" y2="85" stroke="currentColor" stroke-width="4"/><line x1="30" y1="85" x2="70" y2="85" stroke="currentColor" stroke-width="4"/>`;
    } else if (titleLower.includes('toy')) {
        colors = ['#1a1005', '#080502', '#f5841f'];
        iconSvg = `<rect x="25" y="25" width="22" height="22" rx="4" fill="none" stroke="currentColor" stroke-width="3"/><rect x="53" y="25" width="22" height="22" rx="4" fill="none" stroke="currentColor" stroke-width="3"/><rect x="25" y="53" width="22" height="22" rx="4" fill="none" stroke="currentColor" stroke-width="3"/><rect x="53" y="53" width="22" height="22" rx="4" fill="none" stroke="currentColor" stroke-width="3"/><text x="36" y="41" font-size="12" font-weight="bold" fill="currentColor" text-anchor="middle">A</text><text x="64" y="41" font-size="12" font-weight="bold" fill="currentColor" text-anchor="middle">B</text><text x="36" y="69" font-size="12" font-weight="bold" fill="currentColor" text-anchor="middle">C</text><text x="64" y="69" font-size="12" font-weight="bold" fill="currentColor" text-anchor="middle">D</text>`;
    } else {
        colors = ['#1a1005', '#080502', '#f5841f'];
        iconSvg = `<circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" stroke-width="4"/><line x1="50" y1="20" x2="50" y2="80" stroke="currentColor" stroke-width="3"/><line x1="20" y1="50" x2="80" y2="50" stroke="currentColor" stroke-width="3"/><polygon points="50,25 55,45 50,50 45,45" fill="currentColor"/><polygon points="50,75 55,55 50,50 45,55" fill="currentColor"/>`;
    }

    return `
        <div class="poster-placeholder" style="background: linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%);">
            <div class="poster-placeholder-glow" style="background: radial-gradient(circle, rgba(${hexToRgb(colors[2])}, 0.2) 0%, transparent 70%);"></div>
            <div>
                <svg viewBox="0 0 100 100" style="width: 50px; height: 50px; color: ${colors[2]};">
                    ${iconSvg}
                </svg>
            </div>
            <div class="placeholder-text">${title}</div>
        </div>
    `;
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '255, 255, 255';
}

function getMoviePosterHTML(title) {
    if (MOVIE_POSTERS[title]) {
        return `<img class="movie-poster-img" src="${MOVIE_POSTERS[title]}" alt="${title} poster" loading="lazy" decoding="async" onerror="this.onerror=null; this.outerHTML=getMovieVectorGraphic('${title.replace(/'/g, "\\'")}')">`;
    }
    return getMovieVectorGraphic(title);
}

// Render dynamic Movie Cards Grid (Clean layout, title outside)
function renderMovieGrid() {
    const grid = document.getElementById('movie-grid');
    const noResults = document.getElementById('no-results-msg');
    
    let filteredMovies = MOVIE_DATA.filter(movie => {
        const matchesSearch = movie.title.toLowerCase().includes(AppState.searchQuery) ||
                             movie.rating.toLowerCase().includes(AppState.searchQuery);
        
        const hasDateSchedule = movie.schedule.some(sch => sch.date === AppState.activeDate);
        
        return matchesSearch && hasDateSchedule;
    });

    if (filteredMovies.length === 0) {
        grid.style.display = 'none';
        noResults.style.display = 'block';
        return;
    }
    
    if (AppState.viewMode === 'list') {
        grid.style.display = 'flex';
        grid.style.flexDirection = 'column';
    } else {
        grid.style.display = 'grid';
    }
    
    noResults.style.display = 'none';
    grid.innerHTML = '';

    filteredMovies.forEach(movie => {
        const rating = movie.rating ? movie.rating : 'ALL';
        const activeDateSch = movie.schedule.find(sch => sch.date === AppState.activeDate);
        const format = (activeDateSch && activeDateSch.showtimes.length > 0) ? activeDateSch.showtimes[0].dimension : '2D';

        if (AppState.viewMode === 'list') {
            // Render Classic Horizontal List Row
            const listRow = document.createElement('div');
            listRow.className = 'movie-list-row scroll-reveal';

            // Generate the schedule table rows for this movie
            let tableRowsHTML = '';
            movie.schedule.forEach(sch => {
                let dayShowtimes = sch.showtimes;
                if (AppState.formatFilter !== 'all') {
                    dayShowtimes = dayShowtimes.filter(st => st.dimension.trim() === AppState.formatFilter);
                }
                if (dayShowtimes.length === 0) return;

                const dObj = new Date(sch.date);
                const dayShort = dObj.toLocaleDateString('en-US', { weekday: 'short' });
                const fullDateLabel = `${sch.date} ${dayShort}`;

                const isCurrentDate = sch.date === AppState.activeDate;
                const activeRowClass = isCurrentDate ? 'active-list-row' : '';

                let timeCellsHTML = '';
                dayShowtimes.forEach(st => {
                    timeCellsHTML += `
                        <button class="list-time-cell" 
                                data-time="${st.time}" 
                                data-cinema="${st.cinema}" 
                                data-dimension="${st.dimension}" 
                                data-link="${st.booking_link}">
                            <span class="cell-cinema">${st.cinema}</span>
                            <span class="cell-format">${st.dimension}</span>
                            <span class="cell-time">${st.time}</span>
                        </button>
                    `;
                });

                tableRowsHTML += `
                    <div class="list-table-row ${activeRowClass}" data-date="${sch.date}">
                        <div class="list-date-cell">${fullDateLabel}</div>
                        <div class="list-times-cell">
                            ${timeCellsHTML}
                        </div>
                    </div>
                `;
            });

            if (tableRowsHTML === '') return;

            listRow.innerHTML = `
                <div class="movie-list-header">
                    <span class="list-header-title">${movie.title}</span>
                </div>
                <div class="movie-list-body">
                    <div class="list-poster-column">
                        <div class="poster-container">
                            ${getMoviePosterHTML(movie.title)}
                            <div class="badge-overlays">
                                <span class="badge rating-badge">${rating}</span>
                                <span class="badge format-badge">${format}</span>
                            </div>
                        </div>
                    </div>
                    <div class="list-schedule-column">
                        <div class="list-schedule-table">
                            ${tableRowsHTML}
                        </div>
                    </div>
                </div>
            `;

            // Bind click to poster column to open Dates & Demand Insights modal
            listRow.querySelector('.poster-container').addEventListener('click', () => {
                openDatesModal(movie);
            });

            // Bind click to time cells
            const cells = listRow.querySelectorAll('.list-time-cell');
            cells.forEach(cell => {
                cell.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const targetDate = cell.closest('.list-table-row').dataset.date;
                    const stObj = {
                        time: cell.dataset.time,
                        cinema: cell.dataset.cinema,
                        dimension: cell.dataset.dimension,
                        booking_link: cell.dataset.link
                    };

                    AppState.activeDate = targetDate;
                    updateActiveDateLabel();
                    updateCalendarActiveState();

                    openBookingModal(movie, stObj);
                });
            });

            grid.appendChild(listRow);
        } else {
            // Render Apple TV style Grid Card
            let schedulesHTML = '';
            movie.schedule.forEach(sch => {
                let dayShowtimes = sch.showtimes;
                if (AppState.formatFilter !== 'all') {
                    dayShowtimes = dayShowtimes.filter(st => st.dimension.trim() === AppState.formatFilter);
                }
                if (dayShowtimes.length === 0) return;

                const dObj = new Date(sch.date);
                const dayShort = dObj.toLocaleDateString('en-US', { weekday: 'short' });
                const dayNum = dObj.getDate();
                const dateLabel = `${dayShort} ${dayNum}`;

                const isCurrentDate = sch.date === AppState.activeDate;
                const activeRowClass = isCurrentDate ? 'active-date-row' : '';

                let timePillsHTML = '';
                dayShowtimes.forEach(st => {
                    timePillsHTML += `
                        <button class="showtime-slot" 
                                data-time="${st.time}" 
                                data-cinema="${st.cinema}" 
                                data-dimension="${st.dimension}" 
                                data-link="${st.booking_link}">
                            ${st.time}
                        </button>
                    `;
                });

                schedulesHTML += `
                    <div class="card-schedule-row ${activeRowClass}" data-date="${sch.date}">
                        <span class="card-date-label">${dateLabel}</span>
                        <div class="card-time-slots">
                            ${timePillsHTML}
                        </div>
                    </div>
                `;
            });

            if (schedulesHTML === '') return;

            const movieCard = document.createElement('div');
            movieCard.className = 'movie-card scroll-reveal';

            movieCard.innerHTML = `
                <div class="poster-container">
                    ${getMoviePosterHTML(movie.title)}
                    <div class="badge-overlays">
                        <span class="badge rating-badge">${rating}</span>
                        <span class="badge format-badge">${format}</span>
                    </div>
                </div>
                <div class="movie-card-info">
                    <h3 class="movie-card-title">${movie.title}</h3>
                    <div class="movie-card-meta">${rating} Certified • Cinema Hall</div>
                    <div class="card-schedule-list">
                        ${schedulesHTML}
                    </div>
                </div>
            `;

            movieCard.querySelector('.poster-container').addEventListener('click', () => {
                openDatesModal(movie);
            });

            const slots = movieCard.querySelectorAll('.showtime-slot');
            slots.forEach(slot => {
                slot.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const targetDate = slot.closest('.card-schedule-row').dataset.date;
                    const stObj = {
                        time: slot.dataset.time,
                        cinema: slot.dataset.cinema,
                        dimension: slot.dataset.dimension,
                        booking_link: slot.dataset.link
                    };

                    AppState.activeDate = targetDate;
                    updateActiveDateLabel();
                    updateCalendarActiveState();

                    openBookingModal(movie, stObj);
                });
            });

            grid.appendChild(movieCard);
        }
    });

    if (grid.children.length === 0) {
        grid.style.display = 'none';
        noResults.style.display = 'block';
    }
    applyScrollReveal();
}

// Small helper to update calendar day active state visually
function updateCalendarActiveState() {
    document.querySelectorAll('.calendar-day').forEach(el => {
        if (el.dataset.date === AppState.activeDate) {
            el.classList.add('active');
        } else {
            el.classList.remove('active');
        }
    });
}

// Movie Dates & Demand Insights Modal Management
function openDatesModal(movie) {
    const modal = document.getElementById('dates-modal');
    if (!modal) return;

    // Fill details
    document.getElementById('dates-movie-title').textContent = movie.title;
    document.getElementById('dates-movie-rating').textContent = movie.rating || 'ALL';
    
    // Calculate unique formats
    const formats = [];
    movie.schedule.forEach(sch => {
        sch.showtimes.forEach(st => {
            if (!formats.includes(st.dimension)) {
                formats.push(st.dimension);
            }
        });
    });
    document.getElementById('dates-movie-format').textContent = formats.join(' | ') || '2D';

    // Set poster
    const posterContainer = document.getElementById('dates-movie-poster');
    if (posterContainer) {
        posterContainer.innerHTML = getMoviePosterHTML(movie.title);
        // Apply tilt helper trigger on hover
        let glare = posterContainer.querySelector('.card-glare');
        if (!glare) {
            glare = document.createElement('div');
            glare.className = 'card-glare';
            const innerPoster = posterContainer.querySelector('.poster-container');
            if (innerPoster) innerPoster.appendChild(glare);
        }
    }

    // Set available dates schedule list
    const scheduleContainer = document.getElementById('dates-schedule-container');
    if (scheduleContainer) {
        scheduleContainer.innerHTML = '';
        
        movie.schedule.forEach(sch => {
            const dateObj = new Date(sch.date);
            // Get day name and month label
            const dayOfWeekName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
            const monthDayStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            
            // Calculate a deterministic demand score based on movie title, day of week, and date
            const dayOfWeekIndex = dateObj.getDay(); // 0 is Sunday, 6 is Saturday
            let baseDemand = 30; // default low
            let demandStatus = 'Low Demand';
            let demandClass = 'demand-low';
            let demandTip = '🟢 Great choice for finding prime center seats! Relaxed atmosphere.';
            
            if (dayOfWeekIndex === 6) { // Saturday
                baseDemand = 95;
                demandStatus = 'Peak Demand';
                demandClass = 'demand-peak';
                demandTip = '🚨 Peak weekend hours! Highly popular. Pre-book your favorite seats now!';
            } else if (dayOfWeekIndex === 5) { // Friday
                baseDemand = 80;
                demandStatus = 'High Demand';
                demandClass = 'demand-high';
                demandTip = '🔥 Weekend launch! Evening slots fill up rapidly. Book early.';
            } else if (dayOfWeekIndex === 0) { // Sunday
                baseDemand = 65;
                demandStatus = 'Moderate-High';
                demandClass = 'demand-medium-high';
                demandTip = '🟡 Relaxing Sunday atmosphere. Afternoon slots are busiest.';
            } else if (dayOfWeekIndex === 2) { // Tuesday
                baseDemand = 70;
                demandStatus = 'Discount Day';
                demandClass = 'demand-high';
                demandTip = '🔥 Tuesday Special! Excellent value, which brings high attendance.';
            } else if (dayOfWeekIndex === 4) { // Thursday
                baseDemand = 45;
                demandStatus = 'Moderate';
                demandClass = 'demand-medium';
                demandTip = '🟡 Balanced crowd. Ideal pre-weekend option.';
            } else if (dayOfWeekIndex === 1) { // Monday
                baseDemand = 35;
                demandStatus = 'Low-Moderate';
                demandClass = 'demand-low';
                demandTip = '🟢 Quiet and peaceful. Great for avoiding busy queues.';
            } else { // Wednesday
                baseDemand = 28;
                demandStatus = 'Low Demand';
                demandClass = 'demand-low';
                demandTip = '🟢 Excellent availability across all seating zones.';
            }

            // Create schedule row element
            const rowDiv = document.createElement('div');
            rowDiv.className = 'date-row-item';

            // Generate showtime slots buttons HTML
            let slotsHTML = '';
            sch.showtimes.forEach(st => {
                slotsHTML += `
                    <button class="date-showtime-btn" 
                            data-time="${st.time}" 
                            data-cinema="${st.cinema}" 
                            data-dimension="${st.dimension}" 
                            data-link="${st.booking_link}">
                        ${st.time} <span class="btn-sub">${st.dimension}</span>
                    </button>
                `;
            });

            rowDiv.innerHTML = `
                <div class="date-row-header">
                    <div class="date-row-title-wrap">
                        <span class="date-row-day">${dayOfWeekName}</span>
                        <span class="date-row-full">${monthDayStr}</span>
                    </div>
                    <div class="date-row-demand-wrap">
                        <div class="demand-indicator">
                            <span class="demand-badge ${demandClass}">${demandStatus}</span>
                            <div class="demand-bar-bg">
                                <div class="demand-bar-fill ${demandClass}" style="width: ${baseDemand}%"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <p class="date-row-tip">${demandTip}</p>
                <div class="date-row-slots">
                    ${slotsHTML}
                </div>
            `;

            // Bind click listeners to showtime slots
            const buttons = rowDiv.querySelectorAll('.date-showtime-btn');
            buttons.forEach(btn => {
                btn.addEventListener('click', () => {
                    closeDatesModal();
                    
                    // Open booking modal for selected showtime
                    AppState.activeDate = sch.date;
                    updateActiveDateLabel();
                    updateCalendarActiveState();

                    const stObj = {
                        time: btn.dataset.time,
                        cinema: btn.dataset.cinema,
                        dimension: btn.dataset.dimension,
                        booking_link: btn.dataset.link
                    };
                    openBookingModal(movie, stObj);
                });
            });

            scheduleContainer.appendChild(rowDiv);
        });
    }

    modal.classList.add('open');
    document.body.style.overflow = 'hidden';

    // Staggered entrance animation for date rows
    gsap.fromTo('.date-row-item', 
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.05, ease: 'power2.out', delay: 0.1 }
    );
}

function closeDatesModal() {
    const modal = document.getElementById('dates-modal');
    if (modal) {
        modal.classList.remove('open');
        document.body.style.overflow = '';
    }
}

// Seat Booking Engine Modal Management
function openBookingModal(movie, showtime) {
    AppState.selectedShowtime = { movie, showtime, date: AppState.activeDate };
    AppState.selectedSeats = [];
    
    const modal = document.getElementById('booking-modal');
    
    // Update labels
    document.getElementById('modal-movie-title').textContent = movie.title;
    document.getElementById('modal-movie-format').textContent = showtime.dimension;
    document.getElementById('modal-movie-rating').textContent = movie.rating ? movie.rating : 'ALL';
    document.getElementById('modal-movie-cinema').textContent = showtime.cinema;
    
    const dateObj = new Date(AppState.activeDate);
    const dayStr = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    document.getElementById('modal-movie-date-time').textContent = `${dayStr} at ${showtime.time}`;

    // Render interactive seat map
    generateSeatMap(movie.title, showtime);

    // Refresh Checkout Summary UI
    updateCheckoutUI();

    modal.classList.add('open');
    document.body.style.overflow = 'hidden'; 

    // Animate seats row by row with a smooth GSAP stagger
    animateSeatsEntrance();
}

function animateSeatsEntrance() {
    const rows = document.querySelectorAll('#seat-grid .seat-row');
    if (rows.length === 0) return;

    // Reset styles/tweens first to prevent overlaps
    gsap.killTweensOf('#seat-grid .seat, #seat-grid .row-letter');
    gsap.set('#seat-grid .seat, #seat-grid .row-letter', { scale: 0, opacity: 0 });

    // Animate row elements sequentially with row-by-row delay and subtle item stagger
    rows.forEach((row, rowIndex) => {
        const rowElements = row.querySelectorAll('.seat, .row-letter');
        if (rowElements.length > 0) {
            gsap.to(rowElements, {
                scale: 1,
                opacity: 1,
                duration: 0.5,
                delay: 0.12 + rowIndex * 0.04, // Stagger rows starting after modal opens
                stagger: 0.012, // Stagger individual seats slightly
                ease: 'back.out(1.3)',
                clearProps: 'transform,opacity' // Ensure hover effects and transitions continue to work normally
            });
        }
    });
}

function closeModal() {
    const modal = document.getElementById('booking-modal');
    modal.classList.remove('open');
    document.body.style.overflow = '';
}

// Seat Mapping Builder
function generateSeatMap(movieTitle, showtime) {
    const gridContainer = document.getElementById('seat-grid');
    gridContainer.innerHTML = '';

    // Create zoomable, pannable inner container
    const innerContainer = document.createElement('div');
    innerContainer.id = 'seat-grid-inner';
    innerContainer.className = 'seat-grid-inner';

    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    const seatsPerRow = 12;
    const showtimeId = showtime.booking_link ? extractBookingSessionId(showtime.booking_link) : 'default';

    innerContainer.style.gridTemplateRows = `repeat(${rows.length}, auto)`;

    rows.forEach(rowLetter => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'seat-row';

        const rowLabelLeft = document.createElement('span');
        rowLabelLeft.className = 'row-letter';
        rowLabelLeft.textContent = rowLetter;
        rowDiv.appendChild(rowLabelLeft);

        const isVipRow = ['H', 'I', 'J'].includes(rowLetter);

        for (let seatIndex = 1; seatIndex <= seatsPerRow; seatIndex++) {
            if (seatIndex === 7) {
                const aisle = document.createElement('div');
                aisle.style.width = '1.25rem';
                rowDiv.appendChild(aisle);
            }

            const seatId = `${rowLetter}-${seatIndex}`;
            const seat = document.createElement('div');
            seat.className = 'seat';
            seat.dataset.seatId = seatId;

            if (isVipRow) {
                seat.classList.add('vip');
            } else {
                seat.classList.add('available');
            }

            const isMockOccupied = isSeatOccupiedMock(movieTitle, showtimeId, seatId);
            const isUserBooked = AppState.reservedBookings[`${movieTitle}_${showtimeId}_${seatId}`];

            if (isMockOccupied || isUserBooked) {
                seat.className = 'seat occupied';
            } else {
                seat.addEventListener('click', () => {
                    toggleSeatSelection(seat, seatId, isVipRow);
                });
            }

            rowDiv.appendChild(seat);
        }

        const rowLabelRight = document.createElement('span');
        rowLabelRight.className = 'row-letter';
        rowLabelRight.style.textAlign = 'right';
        rowLabelRight.textContent = rowLetter;
        rowDiv.appendChild(rowLabelRight);

        innerContainer.appendChild(rowDiv);
    });

    gridContainer.appendChild(innerContainer);

    // Reset zoom state on new generation
    resetSeatGridZoom();
}

function isSeatOccupiedMock(movieTitle, sessionId, seatId) {
    const str = `${movieTitle}_${sessionId}_${seatId}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const normalized = Math.abs(hash % 100);
    return normalized < 38; // 38% booked mock fill
}

function extractBookingSessionId(url) {
    const match = url.match(/[?&]ses=(\d+)/);
    return match ? match[1] : 'sesDefault';
}

function toggleSeatSelection(seatElement, seatId, isVip) {
    const index = AppState.selectedSeats.findIndex(s => s.id === seatId);

    if (index > -1) {
        AppState.selectedSeats.splice(index, 1);
        seatElement.classList.remove('selected');
        gsap.fromTo(seatElement,
            { scale: 1.25 },
            { scale: 1, duration: 0.3, ease: 'power2.out', clearProps: 'transform' }
        );
    } else {
        if (AppState.selectedSeats.length >= 6) {
            alert("You can select a maximum of 6 seats per transaction.");
            return;
        }
        AppState.selectedSeats.push({ id: seatId, isVip });
        seatElement.classList.add('selected');
        gsap.fromTo(seatElement,
            { scale: 0.7 },
            { scale: 1, duration: 0.5, ease: 'back.out(2.2)', clearProps: 'transform' }
        );
        createSeatRipple(seatElement);
    }

    updateCheckoutUI();
}

function createSeatRipple(seatElement) {
    const ripple = document.createElement('span');
    ripple.className = 'seat-ripple';
    seatElement.appendChild(ripple);
    
    gsap.fromTo(ripple,
        { scale: 0.8, opacity: 0.9 },
        { 
            scale: 2.2, 
            opacity: 0, 
            duration: 0.5, 
            ease: 'power1.out',
            onComplete: () => ripple.remove() 
        }
    );
}

function updateCheckoutUI() {
    const stdCountEl = document.getElementById('standard-count');
    const vipCountEl = document.getElementById('vip-count');
    const selectedSeatsContainer = document.getElementById('selected-seats-container');
    const totalPriceDisplay = document.getElementById('total-price-display');
    const confirmBtn = document.getElementById('checkout-confirm-btn');

    let stdCount = 0;
    let vipCount = 0;
    let totalPrice = 0;

    selectedSeatsContainer.innerHTML = '';

    if (AppState.selectedSeats.length === 0) {
        selectedSeatsContainer.innerHTML = `<span class="no-seats-placeholder">No seats selected yet. Click on the seats map.</span>`;
        confirmBtn.classList.add('disabled');
        confirmBtn.disabled = true;
    } else {
        confirmBtn.classList.remove('disabled');
        confirmBtn.disabled = false;

        AppState.selectedSeats.forEach(seat => {
            const badge = document.createElement('span');
            badge.className = 'seat-badge';
            if (seat.isVip) {
                badge.classList.add('vip-badge');
                badge.innerHTML = `<i data-lucide="crown" style="width:12px;height:12px;"></i> ${seat.id}`;
                vipCount++;
                totalPrice += 150;
            } else {
                badge.innerHTML = `<i data-lucide="user" style="width:12px;height:12px;"></i> ${seat.id}`;
                stdCount++;
                totalPrice += 100;
            }
            selectedSeatsContainer.appendChild(badge);
        });
        
        if (typeof lucide !== 'undefined') { lucide.createIcons(); }
    }

    stdCountEl.textContent = `${stdCount} Selected`;
    vipCountEl.textContent = `${vipCount} Selected`;
    totalPriceDisplay.textContent = `K ${totalPrice.toFixed(2)}`;
}

function confirmBooking() {
    if (AppState.selectedSeats.length === 0) return;

    const movie = AppState.selectedShowtime.movie;
    const showtime = AppState.selectedShowtime.showtime;
    const showtimeId = showtime.booking_link ? extractBookingSessionId(showtime.booking_link) : 'default';

    AppState.selectedSeats.forEach(seat => {
        const key = `${movie.title}_${showtimeId}_${seat.id}`;
        AppState.reservedBookings[key] = true;
    });

    localStorage.setItem('numetro_bookings', JSON.stringify(AppState.reservedBookings));

    // Format date beautifully
    let displayDate = AppState.activeDate;
    if (displayDate) {
        try {
            const dateObj = new Date(displayDate);
            if (!isNaN(dateObj.getTime())) {
                const options = { month: 'short', day: 'numeric' };
                displayDate = dateObj.toLocaleDateString('en-US', options);
            }
        } catch(e) {}
    }

    const seatIds = AppState.selectedSeats.map(s => s.id).join(', ');
    const uniqueRef = `NM-${Math.floor(100000 + Math.random() * 900000)}-${showtimeId.substring(0, 3).toUpperCase()}`;

    const ticketData = {
        movieTitle: movie.title,
        showtime: `${displayDate} | ${showtime.time} | ${showtime.format || '2D'}`,
        seats: seatIds,
        refCode: uniqueRef
    };

    showToast(`Successfully booked ${AppState.selectedSeats.length} seats for ${movie.title}!`, ticketData);

    closeModal();
    renderMovieGrid();
}

function showToast(message, ticketData = null) {
    const toast = document.getElementById('toast');
    if (!toast) return;

    // Get ticket elements
    const movieTitleEl = document.getElementById('ticket-movie-title');
    const showtimeEl = document.getElementById('ticket-showtime');
    const seatsEl = document.getElementById('ticket-seats');
    const codeEl = document.getElementById('ticket-code');
    const qrCanvas = document.getElementById('ticket-qr-canvas');
    const categoryEl = toast.querySelector('.ticket-category');
    const scanLabelEl = toast.querySelector('.ticket-scan-label');

    // Default or custom close timeout
    let duration = 6000; // Extend duration for interactive tickets so they can scan

    if (ticketData) {
        // Real seats booking ticket
        if (categoryEl) categoryEl.textContent = 'NU METRO ARCADE TICKET';
        if (movieTitleEl) movieTitleEl.textContent = ticketData.movieTitle;
        if (showtimeEl) showtimeEl.textContent = ticketData.showtime;
        if (seatsEl) seatsEl.textContent = ticketData.seats;
        if (codeEl) codeEl.textContent = ticketData.refCode;
        if (scanLabelEl) scanLabelEl.textContent = 'PRESENT QR CODE AT TURNSTILE';
        
        duration = 10000; // Give ample time for scan on booking confirmation

        // Generate dynamic QR
        if (typeof QRious !== 'undefined' && qrCanvas) {
            try {
                new QRious({
                    element: qrCanvas,
                    value: JSON.stringify({
                        ref: ticketData.refCode,
                        movie: ticketData.movieTitle,
                        showtime: ticketData.showtime,
                        seats: ticketData.seats
                    }),
                    size: 260,
                    background: '#1c1c21',
                    foreground: '#f5841f',
                    level: 'H'
                });
            } catch (err) {
                console.error('QR generation failed:', err);
            }
        }
    } else {
        // Fallback VIP membership/General notification card
        if (categoryEl) categoryEl.textContent = 'VIP CLUB DIGITAL PASS';
        if (movieTitleEl) movieTitleEl.textContent = 'Exclusive VIP Member';
        
        // Clean up message for a cleaner layout if it's too long
        let cleanMsg = message;
        if (message.includes('Welcome') && message.includes('activated')) {
            const matchName = message.match(/Welcome (.*?)!/);
            if (matchName && matchName[1]) {
                if (movieTitleEl) movieTitleEl.textContent = matchName[1];
                cleanMsg = 'VIP Membership is now activated.';
            }
        }

        if (showtimeEl) showtimeEl.textContent = 'Access: Unlocked';
        if (seatsEl) seatsEl.textContent = 'All Lounges & Screenings';
        
        const vipCode = `NM-VIP-${Math.floor(100000 + Math.random() * 900000)}`;
        if (codeEl) codeEl.textContent = vipCode;
        if (scanLabelEl) scanLabelEl.textContent = 'SCAN AT LOUNGE TO ENTER';

        // Generate dynamic QR for the VIP card
        if (typeof QRious !== 'undefined' && qrCanvas) {
            try {
                new QRious({
                    element: qrCanvas,
                    value: JSON.stringify({
                        passType: 'VIP_CLUB',
                        code: vipCode,
                        message: cleanMsg
                    }),
                    size: 260,
                    background: '#1c1c21',
                    foreground: '#f5841f',
                    level: 'H'
                });
            } catch (err) {
                console.error('QR generation failed:', err);
            }
        }
    }
    
    // Show toast
    toast.classList.add('show');

    // Subtle GSAP 3D Flip Animation with an elastic spring for tactile Apple Wallet effect
    const ticketCard = toast.querySelector('.ticket-card');
    if (ticketCard && typeof gsap !== 'undefined') {
        gsap.killTweensOf(ticketCard);
        gsap.fromTo(ticketCard, 
            { 
                transformPerspective: 1000, 
                rotationX: 45, 
                rotationY: -18, 
                scale: 0.82, 
                y: 45, 
                opacity: 0 
            },
            { 
                rotationX: 0, 
                rotationY: 0, 
                scale: 1, 
                y: 0, 
                opacity: 1, 
                duration: 1.1, 
                delay: 0.08, // brief delay to sync beautifully with the toast slide-up transition
                ease: 'elastic.out(1.0, 0.65)',
                clearProps: 'transformPerspective,rotationX,rotationY'
            }
        );
    }
    
    // Auto-hide unless manually closed
    if (AppState.toastTimeout) {
        clearTimeout(AppState.toastTimeout);
    }
    AppState.toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}


// Staggered Scroll-Reveal Intersection Observer
function applyScrollReveal() {
    // Flag static headers & dividers as revealable
    document.querySelectorAll('.calendar-wrapper, .content-header, .section-divider').forEach(el => {
        el.classList.add('scroll-reveal');
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Trigger once
            }
        });
    }, { threshold: 0.05, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.scroll-reveal:not(.visible)').forEach(el => {
        observer.observe(el);
    });
}


// --- Interactive Snack Bar Menu Logic ---
const FOOD_MENU = {
    popcorn: [
        { id: "pop-reg", name: "Salted Popcorn (Regular)", price: 45.0, desc: "Freshly popped hot theater corn, salted to perfection." },
        { id: "pop-large", name: "Salted Popcorn (Large)", price: 60.0, desc: "Gumbo bucket of hot theater corn. Perfect for sharing." },
        { id: "nachos", name: "Gourmet Cheese Nachos", price: 75.0, desc: "Crispy tortilla chips served with warm melted cheddar dip." }
    ],
    meals: [
        { id: "hotdog", name: "Classic Beef Hot Dog", price: 65.0, desc: "Steamed hot dog in a warm bun with mustard and relish." },
        { id: "pizza", name: "Margherita Pizza Slice", price: 55.0, desc: "Freshly baked pizza slice with rich tomato sauce and mozzarella." },
        { id: "fries", name: "Premium Loaded Fries", price: 50.0, desc: "Crispy fries loaded with cheese sauce and jalapeño bits." }
    ],
    drinks: [
        { id: "soda", name: "Craft Soda Cola", price: 35.0, desc: "Chilled craft carbonated soda. The ultimate cinema companion." },
        { id: "slushy", name: "Wild Berry Slushy", price: 40.0, desc: "Ice blended fruity slush beverage. Kids favorite." },
        { id: "water", name: "Mineral Water", price: 20.0, desc: "Bottled mineral spring water. Pure refreshment." }
    ]
};

function setupFoodMenu() {
    const grid = document.getElementById('food-items-grid');
    if (!grid) return;

    // Render popcorn category by default
    renderFoodCategory('popcorn');

    // Bind Category Tabs
    document.querySelectorAll('.food-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.food-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderFoodCategory(tab.dataset.category);
        });
    });

    // Bind Food Checkout Confirm
    const checkoutBtn = document.getElementById('food-checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (Object.keys(AppState.foodCart).length === 0) return;
            showToast("Snack order confirmed! Prepare to collect at the counter.");
            AppState.foodCart = {};
            updateFoodCartUI();
        });
    }
}

// Clean, hand-crafted thin line SVG illustrations for SnackBar products
function getFoodIllustrationHTML(itemId) {
    switch (itemId) {
        case 'pop-reg':
        case 'pop-large':
            return `
                <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M30 45 L35 85 L65 85 L70 45 Z" />
                    <line x1="40" y1="45" x2="42" y2="85" />
                    <line x1="50" y1="45" x2="50" y2="85" />
                    <line x1="60" y1="45" x2="58" y2="85" />
                    <path d="M26 45 Q28 35 34 38 Q38 30 46 34 Q50 24 58 32 Q66 26 70 36 Q74 38 74 45" />
                    <path d="M32 40 Q38 32 44 38" />
                    <path d="M48 34 Q54 28 62 36" />
                    <path d="M58 38 Q64 30 68 40" />
                </svg>
            `;
        case 'nachos':
            return `
                <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 70 L25 82 L75 82 L80 70 Z" />
                    <polygon points="30,70 45,45 50,68" />
                    <polygon points="40,70 55,40 65,65" />
                    <polygon points="50,70 65,48 72,70" />
                    <polygon points="28,70 38,55 48,70" />
                    <circle cx="50" cy="74" r="7" />
                    <path d="M46 72 Q50 75 54 72" />
                </svg>
            `;
        case 'hotdog':
            return `
                <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M28 40 Q20 40 25 58 Q30 75 48 70" />
                    <path d="M72 40 Q80 40 75 58 Q70 75 52 70" />
                    <rect x="36" y="32" width="28" height="42" rx="14" transform="rotate(-15 50 50)" />
                    <path d="M45 38 Q48 46 43 52 Q48 58 45 66" />
                </svg>
            `;
        case 'pizza':
            return `
                <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="50,85 25,35 75,35" />
                    <path d="M23 35 Q50 28 77 35" />
                    <circle cx="48" cy="48" r="4" />
                    <circle cx="60" cy="58" r="3.5" />
                    <circle cx="38" cy="54" r="4.5" />
                    <circle cx="50" cy="70" r="3.5" />
                </svg>
            `;
        case 'fries':
            return `
                <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M32 55 L36 82 L64 82 L68 55 Z" />
                    <path d="M32 55 Q50 62 68 55" />
                    <rect x="36" y="30" width="5" height="30" rx="1" />
                    <rect x="43" y="24" width="5" height="36" rx="1" />
                    <rect x="50" y="28" width="5" height="32" rx="1" />
                    <rect x="57" y="22" width="5" height="38" rx="1" />
                    <rect x="64" y="32" width="4" height="28" rx="1" />
                    <rect x="39" y="34" width="5" height="28" rx="1" transform="rotate(-10 39 34)" />
                    <rect x="54" y="30" width="5" height="30" rx="1" transform="rotate(12 54 30)" />
                </svg>
            `;
        case 'soda':
            return `
                <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="55" y1="20" x2="68" y2="20" />
                    <path d="M55 20 L48 35 L48 40" />
                    <rect x="32" y="38" width="36" height="5" rx="2.5" />
                    <path d="M36 43 L40 85 L60 85 L64 43 Z" />
                    <path d="M42 62 Q50 68 58 62" />
                </svg>
            `;
        case 'slushy':
            return `
                <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M62 18 L50 40" />
                    <path d="M32 45 C32 26 68 26 68 45 Z" />
                    <path d="M34 45 L38 85 L62 85 L66 45 Z" />
                    <path d="M42 55 Q50 50 58 55" />
                    <path d="M38 68 Q50 63 62 68" />
                </svg>
            `;
        case 'water':
            return `
                <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="44" y="22" width="12" height="6" rx="1" />
                    <path d="M42 28 L58 28 L56 36 L44 36 Z" />
                    <path d="M36 36 C36 36 34 42 34 50 C34 58 36 60 36 60 L36 82 C36 85 38 87 41 87 L59 87 C62 87 64 85 64 82 L64 60 C64 60 66 58 66 50 C66 42 64 36 64 36 Z" />
                    <rect x="34" y="52" width="32" height="15" />
                    <line x1="40" y1="60" x2="60" y2="60" />
                </svg>
            `;
        default:
            return `
                <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="50" cy="50" r="25" />
                </svg>
            `;
    }
}

function renderFoodCategory(category) {
    const grid = document.getElementById('food-items-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const items = FOOD_MENU[category] || [];
    items.forEach(item => {
        const itemEl = document.createElement('div');
        itemEl.className = 'food-item';
        itemEl.innerHTML = `
            <div class="food-illustration-box">
                ${getFoodIllustrationHTML(item.id)}
            </div>
            <div class="food-item-info">
                <h5>${item.name}</h5>
                <p>${item.desc}</p>
                <span class="food-price">K ${item.price.toFixed(2)}</span>
            </div>
            <button class="btn-add-food" data-id="${item.id}" data-name="${item.name}" data-price="${item.price}">
                <i data-lucide="plus" style="width: 14px; height: 14px;"></i> Add
            </button>
        `;

        const btn = itemEl.querySelector('.btn-add-food');
        btn.addEventListener('click', () => {
            animateSnackAddition(btn, category);
            addFoodToCart(item.id, item.name, item.price);
        });

        grid.appendChild(itemEl);
    });

    if (typeof lucide !== 'undefined') { lucide.createIcons(); }
}

// Parabolic flying particle animation for SnackBar adds
function animateSnackAddition(buttonEl, category) {
    const cartCard = document.querySelector('.food-cart-card');
    if (!cartCard) return;

    // Resolve icon tag based on category
    let iconName = 'popcorn';
    if (category === 'drinks') iconName = 'cup-soda';
    else if (category === 'meals') iconName = 'pizza';

    const particle = document.createElement('div');
    particle.className = 'snack-fly-particle';
    particle.innerHTML = `<i data-lucide="${iconName}" style="width: 15px; height: 15px; color: #fff;"></i>`;
    document.body.appendChild(particle);

    if (typeof lucide !== 'undefined') {
        lucide.createIcons({
            targets: [particle]
        });
    }

    const btnRect = buttonEl.getBoundingClientRect();
    const cartRect = cartCard.getBoundingClientRect();

    // Start coordinates (center of the click button)
    const startX = btnRect.left + btnRect.width / 2;
    const startY = btnRect.top + btnRect.height / 2;

    // Target coordinates (near the top of the shopping basket card)
    const targetX = cartRect.left + cartRect.width / 2;
    const targetY = cartRect.top + 60;

    gsap.set(particle, {
        position: 'fixed',
        left: startX - 15,
        top: startY - 15,
        width: 30,
        height: 30,
        borderRadius: '50%',
        backgroundColor: 'var(--color-brand)',
        boxShadow: '0 0 10px rgba(245, 132, 31, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        pointerEvents: 'none'
    });

    const dx = targetX - startX;
    const dy = targetY - startY;

    // GSAP Parabolic timeline
    gsap.timeline({
        onComplete: () => {
            particle.remove();
            // Spring scale bounce on basket
            gsap.fromTo(cartCard,
                { scale: 0.97 },
                { scale: 1, duration: 0.45, ease: 'elastic.out(1.2, 0.4)' }
            );
        }
    })
    .to(particle, {
        x: dx,
        ease: 'none',
        duration: 0.7
    })
    .to(particle, {
        y: dy - 120, // apex height of jump
        duration: 0.28,
        ease: 'power1.out'
    }, 0)
    .to(particle, {
        y: dy,
        duration: 0.42,
        ease: 'power2.in'
    }, 0.28)
    .to(particle, {
        scale: 0.3,
        opacity: 0,
        duration: 0.15
    }, '-=0.15');
}

function addFoodToCart(id, name, price) {
    if (AppState.foodCart[id]) {
        AppState.foodCart[id].qty++;
    } else {
        AppState.foodCart[id] = { name, price: parseFloat(price), qty: 1 };
    }
    updateFoodCartUI();
    showToast(`Added ${name} to order!`);
}

function removeFoodFromCart(id) {
    if (!AppState.foodCart[id]) return;
    AppState.foodCart[id].qty--;
    if (AppState.foodCart[id].qty <= 0) {
        delete AppState.foodCart[id];
    }
    updateFoodCartUI();
}

function updateFoodCartUI() {
    const list = document.getElementById('food-cart-list');
    const subtotalEl = document.getElementById('food-total-price');
    const checkoutBtn = document.getElementById('food-checkout-btn');
    if (!list || !subtotalEl || !checkoutBtn) return;

    list.innerHTML = '';
    let subtotal = 0;

    const cartKeys = Object.keys(AppState.foodCart);
    if (cartKeys.length === 0) {
        list.innerHTML = '<p class="no-seats-placeholder">Your basket is empty. Add snacks to enjoy during the show!</p>';
        subtotalEl.textContent = 'K 0.00';
        checkoutBtn.classList.add('disabled');
        return;
    }

    cartKeys.forEach(id => {
        const item = AppState.foodCart[id];
        const itemTotal = item.price * item.qty;
        subtotal += itemTotal;

        const row = document.createElement('div');
        row.className = 'food-cart-row';
        row.innerHTML = `
            <div class="food-cart-item-info">
                <span class="food-cart-name">${item.name}</span>
                <span class="food-cart-qty-desc">${item.qty} × K ${item.price.toFixed(2)}</span>
            </div>
            <div class="food-cart-item-actions">
                <span class="food-cart-total-price">K ${itemTotal.toFixed(2)}</span>
                <button class="btn-remove-food" data-id="${id}"><i data-lucide="trash-2" style="width: 13px; height: 13px;"></i></button>
            </div>
        `;

        row.querySelector('.btn-remove-food').addEventListener('click', () => {
            removeFoodFromCart(id);
        });

        list.appendChild(row);
    });

    subtotalEl.textContent = `K ${subtotal.toFixed(2)}`;
    checkoutBtn.classList.remove('disabled');

    if (typeof lucide !== 'undefined') { lucide.createIcons(); }
}

// Performant scroll spy tracking to update navigation active highlight states
function setupScrollSpy() {
    const sections = [
        document.getElementById('now-showing-section'),
        document.getElementById('coming-soon-section'),
        document.getElementById('vip-club-section'),
        document.getElementById('food-drinks-section')
    ];

    const navLinks = {
        'now-showing-section': document.getElementById('menu-showing'),
        'coming-soon-section': document.getElementById('menu-coming'),
        'vip-club-section': document.getElementById('menu-vip'),
        'food-drinks-section': document.getElementById('menu-food')
    };

    const options = {
        root: null,
        rootMargin: '-100px 0px -60% 0px',
        threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const sectionId = entry.target.id;
                const activeLink = navLinks[sectionId];
                if (activeLink) {
                    document.querySelectorAll('.nav-menu .nav-item').forEach(item => {
                        item.classList.remove('active');
                    });
                    const parentItem = activeLink.closest('.nav-item');
                    if (parentItem) {
                        parentItem.classList.add('active');
                    }
                }
            }
        });
    }, options);

    sections.forEach(section => {
        if (section) observer.observe(section);
    });
}

// ==========================================
// UPCOMING MOVIE RELEASE REMINDER FUNCTIONS
// ==========================================

// Instantly wiggles/rings the bell SVG icon with organic spring physics using GSAP
function animateBellRing(bellSvg) {
    if (!bellSvg) return;
    
    const elementToAnimate = bellSvg.tagName === 'svg' ? bellSvg : (bellSvg.querySelector('svg') || bellSvg);
    if (!elementToAnimate) return;

    if (typeof gsap !== 'undefined') {
        gsap.killTweensOf(elementToAnimate);
        
        // Establish top-center anchor for pendulum physical swing
        gsap.set(elementToAnimate, { transformOrigin: '50% 0%' });
        
        const tl = gsap.timeline();
        tl.to(elementToAnimate, { rotation: 25, duration: 0.08, ease: 'power2.out' })
          .to(elementToAnimate, { rotation: -20, duration: 0.1, ease: 'power1.inOut' })
          .to(elementToAnimate, { rotation: 16, duration: 0.1, ease: 'power1.inOut' })
          .to(elementToAnimate, { rotation: -11, duration: 0.12, ease: 'power1.inOut' })
          .to(elementToAnimate, { rotation: 7, duration: 0.12, ease: 'power1.inOut' })
          .to(elementToAnimate, { rotation: -3, duration: 0.15, ease: 'power1.inOut' })
          .to(elementToAnimate, { rotation: 0, duration: 0.2, ease: 'power1.out' });
    } else {
        elementToAnimate.classList.remove('bell-ring-active');
        void elementToAnimate.offsetWidth; // Force CSS reflow
        elementToAnimate.classList.add('bell-ring-active');
    }
}

// Helper to parse expected release date strings (e.g., "Expected Dec 18, 2026")
function parseExpectedDate(expectedStr) {
    if (!expectedStr) return null;
    const cleaned = expectedStr.replace('Expected ', '').trim();
    const parsed = new Date(cleaned);
    return isNaN(parsed.getTime()) ? null : parsed;
}

// Open Release Reminder Modal
function openReminderModal(movieTitle, expectedDate, genres) {
    const modal = document.getElementById('reminder-modal');
    if (!modal) return;

    AppState.activeReminderMovie = { title: movieTitle, expected: expectedDate, genres: genres };

    // Set poster
    const posterContainer = document.getElementById('reminder-movie-poster');
    if (posterContainer) {
        posterContainer.innerHTML = getMoviePosterHTML(movieTitle);
    }

    // Set title, expected date, genre
    const titleEl = document.getElementById('reminder-movie-title');
    if (titleEl) titleEl.textContent = movieTitle;

    const genreEl = document.getElementById('reminder-movie-genre');
    if (genreEl) genreEl.textContent = genres;

    const expectedEl = document.getElementById('reminder-movie-expected');
    if (expectedEl) expectedEl.textContent = expectedDate.replace('Expected ', '');

    // Setup the date picker limits and default prefill date
    const dateInput = document.getElementById('reminder-date');
    if (dateInput) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const todayStr = `${yyyy}-${mm}-${dd}`;
        
        // Prevent picking a date in the past
        dateInput.min = todayStr;

        // Try parsing the expected release date to define the max limit
        const releaseDate = parseExpectedDate(expectedDate);
        if (releaseDate) {
            const rY = releaseDate.getFullYear();
            const rM = String(releaseDate.getMonth() + 1).padStart(2, '0');
            const rD = String(releaseDate.getDate()).padStart(2, '0');
            const releaseStr = `${rY}-${rM}-${rD}`;
            
            if (releaseDate > today) {
                // Limit alert date to be no later than the release date
                dateInput.max = releaseStr;
                
                // Default to 1 day before the release date
                const oneDayBefore = new Date(releaseDate.getTime() - 24 * 60 * 60 * 1000);
                if (oneDayBefore > today) {
                    const obY = oneDayBefore.getFullYear();
                    const obM = String(oneDayBefore.getMonth() + 1).padStart(2, '0');
                    const obD = String(oneDayBefore.getDate()).padStart(2, '0');
                    dateInput.value = `${obY}-${obM}-${obD}`;
                } else {
                    dateInput.value = todayStr;
                }
            } else {
                dateInput.removeAttribute('max');
                dateInput.value = todayStr;
            }
        } else {
            dateInput.removeAttribute('max');
            dateInput.value = todayStr;
        }
    }

    // Prefill user details if already registered or if VIP has details
    const nameInput = document.getElementById('reminder-name');
    const emailInput = document.getElementById('reminder-email');

    // See if they have any saved reminder to prefill from
    const savedKeys = Object.keys(AppState.reminders);
    if (savedKeys.length > 0) {
        const firstSaved = AppState.reminders[savedKeys[0]];
        if (nameInput) nameInput.value = firstSaved.name || '';
        if (emailInput) emailInput.value = firstSaved.email || '';
    } else {
        // Otherwise, check if they put details in VIP Club form
        const vipName = document.getElementById('vip-name')?.value;
        const vipEmail = document.getElementById('vip-email')?.value;
        if (nameInput && vipName) nameInput.value = vipName;
        if (emailInput && vipEmail) emailInput.value = vipEmail;
    }

    // Uncheck SMS/Early pre-sales checkboxes by default
    const smsChk = document.getElementById('pref-sms');
    const vipChk = document.getElementById('pref-vip');
    if (smsChk) smsChk.checked = false;
    if (vipChk) vipChk.checked = false;

    // Show Modal
    modal.classList.add('open');

    // Immersive modal animation using GSAP if loaded
    const modalContent = modal.querySelector('.reminder-card');
    if (modalContent && typeof gsap !== 'undefined') {
        gsap.fromTo(modalContent, 
            { scale: 0.85, opacity: 0, y: 50 },
            { scale: 1, opacity: 1, y: 0, duration: 0.5, ease: 'back.out(1.1)' }
        );
    }
}

// Close Release Reminder Modal
function closeReminderModal() {
    const modal = document.getElementById('reminder-modal');
    if (!modal) return;

    const modalContent = modal.querySelector('.reminder-card');
    if (modalContent && typeof gsap !== 'undefined') {
        gsap.to(modalContent, {
            scale: 0.9,
            opacity: 0,
            y: 30,
            duration: 0.3,
            ease: 'power2.in',
            onComplete: () => {
                modal.classList.remove('open');
                AppState.activeReminderMovie = null;
            }
        });
    } else {
        modal.classList.remove('open');
        AppState.activeReminderMovie = null;
    }
}

// Save Release Reminder
function saveReminder(movieTitle, reminderData) {
    AppState.reminders[movieTitle] = reminderData;
    localStorage.setItem('numetro_reminders', JSON.stringify(AppState.reminders));

    // Update UI states
    updateRemindersUI();

    // Close Modal
    closeReminderModal();

    // Format the alertDate cleanly for the success confirmation toast
    let formattedAlertDate = reminderData.alertDate;
    if (reminderData.alertDate) {
        try {
            const parts = reminderData.alertDate.split('-');
            if (parts.length === 3) {
                // Prevent timezone offset issues by using Date.UTC or local construction
                const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                formattedAlertDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            } else {
                const d = new Date(reminderData.alertDate);
                formattedAlertDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            }
        } catch(e) {
            formattedAlertDate = reminderData.alertDate;
        }
    }

    // Trigger beautiful Apple-wallet-style GSAP bounce/elastic flip inside the toast
    showToast(`🔔 Release alert activated for ${movieTitle}! We will notify you on **${formattedAlertDate}** at ${reminderData.email}.`);
    
    // Also, trigger a special 3D ringing GSAP animation on the specific card's button to highlight success
    const cardBtn = document.querySelector(`.btn-coming-soon-remind[data-movie="${movieTitle}"]`);
    if (cardBtn && typeof gsap !== 'undefined') {
        gsap.killTweensOf(cardBtn);
        gsap.fromTo(cardBtn, 
            { scale: 0.9, rotation: -8 },
            { 
                scale: 1, 
                rotation: 0, 
                duration: 0.75, 
                ease: 'elastic.out(1.2, 0.4)' 
            }
        );
    }
}

// Remove Release Reminder
function removeReminder(movieTitle) {
    if (AppState.reminders[movieTitle]) {
        delete AppState.reminders[movieTitle];
        localStorage.setItem('numetro_reminders', JSON.stringify(AppState.reminders));
        
        // Update UI
        updateRemindersUI();
        
        // Success Toast
        showToast(`Cancelled release alert for ${movieTitle}.`);
    }
}

// Update UI Reminders - Cards Buttons & My Saved Reminders section
function updateRemindersUI() {
    const remindersKeys = Object.keys(AppState.reminders);
    
    // 1. Update the static card button styles to show "Reminder Set"
    const buttons = document.querySelectorAll('.btn-coming-soon-remind');
    buttons.forEach(btn => {
        const title = btn.dataset.movie;
        if (AppState.reminders[title]) {
            btn.classList.add('reminded');
            btn.innerHTML = `<i data-lucide="bell-ring"></i> <span>Reminder Set</span>`;
        } else {
            btn.classList.remove('reminded');
            btn.innerHTML = `<i data-lucide="bell"></i> <span>Remind Me</span>`;
        }
    });

    // 2. Render Saved Reminders List Widget
    const container = document.getElementById('active-reminders-container');
    const panel = document.getElementById('active-reminders-section');
    const countEl = document.getElementById('reminders-count');
    
    if (container && panel && countEl) {
        if (remindersKeys.length === 0) {
            // Hide the panel if there are no reminders
            panel.style.display = 'none';
        } else {
            // Show panel & render rows
            panel.style.display = 'flex';
            countEl.textContent = `${remindersKeys.length} ${remindersKeys.length === 1 ? 'film' : 'films'}`;
            container.innerHTML = '';
            
            remindersKeys.forEach(title => {
                const data = AppState.reminders[title];
                
                let formattedRowAlertDate = data.alertDate || 'Not set';
                if (data.alertDate) {
                    try {
                        const parts = data.alertDate.split('-');
                        if (parts.length === 3) {
                            const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                            formattedRowAlertDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                        } else {
                            const d = new Date(data.alertDate);
                            formattedRowAlertDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                        }
                    } catch(e) {
                        formattedRowAlertDate = data.alertDate;
                    }
                }

                const row = document.createElement('div');
                row.className = 'active-reminder-row';
                row.innerHTML = `
                    <div class="active-reminder-info" style="display: flex; flex-direction: column; gap: 0.2rem; min-width: 0;">
                        <span class="active-reminder-title" style="font-size: 0.9rem; font-weight: 600; color: var(--color-white); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${title}</span>
                        <span class="active-reminder-expected" style="font-size: 0.72rem; color: var(--color-gray-400); display: flex; align-items: center; gap: 0.25rem;">
                            <i data-lucide="calendar" style="width: 11px; height: 11px; color: var(--color-gray-500);"></i>
                            ${data.expected || 'Expected Soon'}
                        </span>
                        <span class="active-reminder-alert" style="font-size: 0.75rem; color: var(--color-brand); font-weight: 600; display: flex; align-items: center; gap: 0.25rem;">
                            <i data-lucide="bell-ring" style="width: 11px; height: 11px; color: var(--color-brand);"></i>
                            Alert on: ${formattedRowAlertDate}
                        </span>
                        <span class="active-reminder-email" style="font-size: 0.68rem; color: var(--color-gray-500); display: flex; align-items: center; gap: 0.25rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                            <i data-lucide="mail" style="width: 10px; height: 10px;"></i>
                            ${data.email}
                        </span>
                    </div>
                    <button class="active-reminder-remove" title="Remove Alert">
                        <i data-lucide="trash-2"></i>
                    </button>
                `;
                
                // Remove button action
                row.querySelector('.active-reminder-remove').addEventListener('click', () => {
                    if (typeof gsap !== 'undefined') {
                        gsap.to(row, {
                            opacity: 0,
                            x: -20,
                            duration: 0.35,
                            ease: 'power2.in',
                            onComplete: () => removeReminder(title)
                        });
                    } else {
                        removeReminder(title);
                    }
                });
                
                container.appendChild(row);
            });
        }
    }
    
    // Refresh lucide icons
    if (typeof lucide !== 'undefined') { lucide.createIcons(); }
}

// Global state variables for seat grid zoom and pan
let seatGridScale = 1;
let seatGridTranslateX = 0;
let seatGridTranslateY = 0;

function resetSeatGridZoom() {
    seatGridScale = 1;
    seatGridTranslateX = 0;
    seatGridTranslateY = 0;
    
    const inner = document.getElementById('seat-grid-inner');
    if (inner) {
        inner.style.transition = 'none';
        inner.style.transform = 'translate(0px, 0px) scale(1)';
    }
}

function setupSeatGridZoomAndPan() {
    const container = document.getElementById('seat-grid');
    if (!container) return;

    let initialDistance = 0;
    let initialScale = 1;
    let startX = 0;
    let startY = 0;
    let prevTranslateX = 0;
    let prevTranslateY = 0;
    let isDragging = false;
    let isPinching = false;
    let lastTap = 0;

    // Helper to update CSS transform on the inner grid
    function updateTransform(smooth = false) {
        const inner = document.getElementById('seat-grid-inner');
        if (!inner) return;
        if (smooth) {
            inner.style.transition = 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)';
        } else {
            inner.style.transition = 'transform 0.1s ease-out';
        }
        inner.style.transform = `translate(${seatGridTranslateX}px, ${seatGridTranslateY}px) scale(${seatGridScale})`;
    }

    // Helper to clamp translates based on scaled size
    function clampTranslation() {
        const inner = document.getElementById('seat-grid-inner');
        if (!inner) return;

        const rect = inner.getBoundingClientRect();
        const parentRect = container.getBoundingClientRect();

        const overflowX = Math.max(0, rect.width - parentRect.width);
        const overflowY = Math.max(0, rect.height - parentRect.height);

        // Allow some extra margin for rubber-banding feel
        const maxX = overflowX / 2 + 60;
        const minX = -overflowX / 2 - 60;
        const maxY = overflowY / 2 + 60;
        const minY = -overflowY / 2 - 60;

        seatGridTranslateX = Math.max(minX, Math.min(maxX, seatGridTranslateX));
        seatGridTranslateY = Math.max(minY, Math.min(maxY, seatGridTranslateY));
    }

    // Touch Start
    container.addEventListener('touchstart', (e) => {
        const inner = document.getElementById('seat-grid-inner');
        if (!inner) return;

        if (e.touches.length === 1) {
            // One finger touch: start dragging only if we are zoomed in
            if (seatGridScale > 1.05) {
                isDragging = true;
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
                prevTranslateX = seatGridTranslateX;
                prevTranslateY = seatGridTranslateY;
            }
        } else if (e.touches.length === 2) {
            // Two fingers touch: pinch zoom
            isPinching = true;
            isDragging = false;
            initialScale = seatGridScale;
            initialDistance = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
        }
    }, { passive: false });

    // Touch Move
    container.addEventListener('touchmove', (e) => {
        if (isPinching && e.touches.length === 2) {
            e.preventDefault(); // Lock native browser scroll
            const currentDistance = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );

            if (initialDistance > 0) {
                seatGridScale = initialScale * (currentDistance / initialDistance);
                seatGridScale = Math.max(0.9, Math.min(3.5, seatGridScale)); // allow slight under-zoom for rubber band

                if (seatGridScale <= 1.02) {
                    seatGridTranslateX = 0;
                    seatGridTranslateY = 0;
                }
                updateTransform(false);
            }
        } else if (isDragging && e.touches.length === 1) {
            if (seatGridScale > 1.05) {
                e.preventDefault(); // Disable vertical screen scroll during active pan
                const dx = e.touches[0].clientX - startX;
                const dy = e.touches[0].clientY - startY;

                seatGridTranslateX = prevTranslateX + dx;
                seatGridTranslateY = prevTranslateY + dy;

                clampTranslation();
                updateTransform(false);
            }
        }
    }, { passive: false });

    // Touch End / Cancel
    container.addEventListener('touchend', (e) => {
        // Double tap recognition
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTap;
        if (tapLength < 300 && tapLength > 0) {
            e.preventDefault();
            toggleDoubleTapZoom();
        }
        lastTap = currentTime;

        if (e.touches.length < 2) {
            isPinching = false;
        }
        if (e.touches.length === 0) {
            isDragging = false;

            // Snap back if scaled under 1
            if (seatGridScale < 1.02) {
                seatGridScale = 1;
                seatGridTranslateX = 0;
                seatGridTranslateY = 0;
                updateTransform(true);
            } else {
                // If the user dragged a bit too far out of bounds, snap back cleanly
                clampTranslation();
                updateTransform(true);
            }
        }
    });

    container.addEventListener('touchcancel', () => {
        isPinching = false;
        isDragging = false;
    });

    // Toggle zoom on double-tap
    function toggleDoubleTapZoom() {
        if (seatGridScale > 1.1) {
            // Zoom back to default fit
            seatGridScale = 1;
            seatGridTranslateX = 0;
            seatGridTranslateY = 0;
        } else {
            // Zoom in by 2x
            seatGridScale = 2;
            seatGridTranslateX = 0;
            seatGridTranslateY = 0;
        }
        updateTransform(true);
    }

    // Set up button event listeners
    const btnZoomIn = document.getElementById('btn-zoom-in');
    const btnZoomOut = document.getElementById('btn-zoom-out');
    const btnZoomReset = document.getElementById('btn-zoom-reset');

    if (btnZoomIn) {
        btnZoomIn.addEventListener('click', () => {
            seatGridScale = Math.min(3.5, seatGridScale + 0.3);
            clampTranslation();
            updateTransform(true);
        });
    }

    if (btnZoomOut) {
        btnZoomOut.addEventListener('click', () => {
            seatGridScale = Math.max(1.0, seatGridScale - 0.3);
            if (seatGridScale <= 1.02) {
                seatGridScale = 1;
                seatGridTranslateX = 0;
                seatGridTranslateY = 0;
            } else {
                clampTranslation();
            }
            updateTransform(true);
        });
    }

    if (btnZoomReset) {
        btnZoomReset.addEventListener('click', () => {
            seatGridScale = 1;
            seatGridTranslateX = 0;
            seatGridTranslateY = 0;
            updateTransform(true);
        });
    }
}
