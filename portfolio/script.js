// Vanilla JS: shared behavior across pages
(function() {
    // Expose init to HTML files
    window.appInit = function(opts = {}) {
        opts = opts || {};
        setupTheme();
        setupControls();
        setupFonts();
        initFloats(opts.page);
        if (opts.page === 'contact') {
            // create cubes behind contact page
            createMovingCubes(document.getElementById('contact-canvas'), opts.contactCubes || 3);
            setupContactForm();
        } else {
            // on other pages add a few decorative cubes
            createMovingCubes(document.getElementById('float-area'), 4);
        }
        highlightNav();
    };

    // THEME: toggle with localStorage and set CSS var root data attribute
    function setupTheme() {
        const btns = document.querySelectorAll('#theme-toggle');
        const current = localStorage.getItem('theme') || (window.matchMedia && window.matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light');
        applyTheme(current);
        btns.forEach(b => b && b.addEventListener('click', () => {
            const next = (document.documentElement.getAttribute('data-theme') === 'dark') ? 'light' : 'dark';
            applyTheme(next);
        }));
    }

    function applyTheme(name) {
        document.documentElement.setAttribute('data-theme', name);
        localStorage.setItem('theme', name);
        // update cube colors via CSS variables
        if (name === 'dark') {
            document.documentElement.style.setProperty('--cube-color', getComputedStyle(document.documentElement).getPropertyValue('--cube-dark').trim());
        } else {
            document.documentElement.style.setProperty('--cube-color', getComputedStyle(document.documentElement).getPropertyValue('--cube-light').trim());
        }
    }

    // PREFS PANEL - font family and size
    function setupControls() {
        const prefsBtn = document.getElementById('prefs-btn');
        if (!prefsBtn) return;
        prefsBtn.addEventListener('click', openPrefs);

        function openPrefs() {
            // small inline modal
            const modal = document.createElement('div');
            modal.className = 'glass';
            Object.assign(modal.style, { position: 'fixed', right: '18px', top: '74px', width: '280px', zIndex: 500, boxShadow: '0 8px 30px rgba(0,0,0,0.2)' });
            modal.innerHTML = `
        <h4 style="margin-top:0">Preferences</h4>
        <label style="display:block;margin:.5rem 0">Theme:
          <select id="pref-theme">
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
        <label style="display:block;margin:.5rem 0">Font:
          <select id="pref-font">
            <option value="system">System</option>
            <option value="Inter,system-ui">Inter</option>
            <option value="Poppins,system-ui">Poppins</option>
            <option value="Georgia,serif">Georgia</option>
          </select>
        </label>
        <label style="display:block;margin:.5rem 0">Base size:
          <input id="pref-size" type="range" min="14" max="20" value="${getComputedStyle(document.documentElement).getPropertyValue('--font-size-base') || 16}" />
        </label>
        <div style="display:flex;gap:.5rem;justify-content:flex-end;margin-top:.6rem">
          <button id="pref-close" class="btn ghost">Close</button>
        </div>
      `;
            document.body.appendChild(modal);
            modal.querySelector('#pref-close').addEventListener('click', () => modal.remove());
            const prefTheme = modal.querySelector('#pref-theme');
            prefTheme.value = localStorage.getItem('theme') || 'light';
            prefTheme.addEventListener('change', (e) => applyTheme(e.target.value));
            const fontSel = modal.querySelector('#pref-font');
            fontSel.value = localStorage.getItem('fontFamily') || 'system';
            fontSel.addEventListener('change', (e) => {
                setFontFamily(e.target.value);
                localStorage.setItem('fontFamily', e.target.value);
            });
            const size = modal.querySelector('#pref-size');
            const curSize = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--font-size-base') || 16);
            size.value = curSize;
            size.addEventListener('input', e => {
                document.documentElement.style.setProperty('--font-size-base', e.target.value + 'px');
                localStorage.setItem('fontSize', e.target.value);
            });
        }
    }

    function highlightNav() {
        const navs = document.querySelectorAll('header nav a');
        navs.forEach(a => {
            if (location.pathname.endsWith(a.getAttribute('href'))) {
                a.classList.add('active');
            } else {
                a.classList.remove('active');
            }
        });
    }

    // fonts UI in hero
    function setupFonts() {
        const fontSelect = document.getElementById('font-select');
        const sizeRange = document.getElementById('font-size');
        const savedFamily = localStorage.getItem('fontFamily');
        const savedSize = localStorage.getItem('fontSize');
        if (savedFamily) setFontFamily(savedFamily);
        if (savedSize) document.documentElement.style.setProperty('--font-size-base', savedSize + 'px');
        if (fontSelect) {
            fontSelect.value = savedFamily || 'system';
            fontSelect.addEventListener('change', (e) => {
                setFontFamily(e.target.value);
                localStorage.setItem('fontFamily', e.target.value);
            });
        }
        if (sizeRange) {
            sizeRange.value = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--font-size-base') || 16);
            sizeRange.addEventListener('input', e => {
                document.documentElement.style.setProperty('--font-size-base', e.target.value + 'px');
                localStorage.setItem('fontSize', e.target.value);
            });
        }
    }

    function setFontFamily(value) {
        if (value === 'system') {
            document.documentElement.style.setProperty('--font-family', 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial');
        } else {
            document.documentElement.style.setProperty('--font-family', value);
        }
        // apply to body
        document.body.style.fontFamily = getComputedStyle(document.documentElement).getPropertyValue('--font-family');
    }

    // FLOATING CUBES: create moving cubes that follow randomized paths and react to cursor
    function createMovingCubes(container, count) {
        if (!container) return;
        container.innerHTML = ''; // clear
        const width = window.innerWidth;
        const height = window.innerHeight;
        // create cubes
        const cubes = [];
        for (let i = 0; i < count; i++) {
            const c = document.createElement('div');
            c.className = 'cube medium';
            // set initial style
            assignColor(c);
            container.appendChild(c);
            // random start
            c._x = Math.random() * (width - 120);
            c._y = Math.random() * (height - 120);
            c.style.left = c._x + 'px';
            c.style.top = c._y + 'px';
            c._angle = Math.random() * 360;
            c._speed = 0.2 + Math.random() * 0.9;
            c._pathSeed = Math.random() * 1000;
            // inner pattern for visual depth
            c.innerHTML = `<div style="width:70%;height:70%;transform:rotate(15deg);opacity:0.9;border-radius:6px;box-shadow:inset 0 1px 0 rgba(255,255,255,0.06)"></div>`;
            cubes.push(c);
        }

        // mouse interaction
        let mouse = { x: -9999, y: -9999 };
        window.addEventListener('mousemove', (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
            // ephemeral reaction: scale up nearest cube(s)
            cubes.forEach(c => {
                const cx = c._x + c.offsetWidth / 2;
                const cy = c._y + c.offsetHeight / 2;
                const d = Math.hypot(cx - mouse.x, cy - mouse.y);
                const max = 220;
                const sc = Math.max(0.9, 1.3 - (d / max));
                c.style.transform = `scale(${sc}) rotate(${(c._angle)%360}deg)`;
            });
        });

        // on touch, move cubes slightly away from touch point
        window.addEventListener('touchstart', (e) => {
            const t = e.touches[0];
            mouse.x = t.clientX;
            mouse.y = t.clientY;
        });

        // assign/refresh cube color based on theme
        function assignColor(el) {
            const theme = document.documentElement.getAttribute('data-theme') || localStorage.getItem('theme') || 'light';
            const col = (theme === 'dark') ? getComputedStyle(document.documentElement).getPropertyValue('--cube-dark').trim() : getComputedStyle(document.documentElement).getPropertyValue('--cube-light').trim();
            el.style.background = `linear-gradient(135deg, ${col}, rgba(255,255,255,0.06))`;
            el.style.border = '1px solid rgba(255,255,255,0.06)';
        }
        // listen for theme changes to recolor
        const mo = new MutationObserver(() => cubes.forEach(assignColor));
        mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

        // animation loop: per-frame update position based on a smooth noise-like trigonometric path
        let last = performance.now();

        function loop(now) {
            const dt = (now - last) / 16.67;
            last = now;
            const w = window.innerWidth,
                h = window.innerHeight;
            cubes.forEach((c, idx) => {
                // each cube has a seed; use sin/cos to create looping varying path
                const t = now * 0.0002 + c._pathSeed;
                const rx = Math.sin(t * (0.8 + idx * 0.17)) * (w * 0.35) + (w * 0.5);
                const ry = Math.cos(t * (0.9 + idx * 0.13)) * (h * 0.28) + (h * 0.45);
                // blend towards rx,ry
                c._x += (rx - c._x) * (0.005 + c._speed * 0.002) * dt;
                c._y += (ry - c._y) * (0.005 + c._speed * 0.002) * dt;
                // update angle slowly
                c._angle = (c._angle + 0.12 * c._speed * dt) % 360;
                // small random jitter
                c._x += (Math.sin(now * 0.001 + idx) * 0.2);
                c._y += (Math.cos(now * 0.0015 + idx) * 0.2);
                // limit bounds
                c._x = Math.max(-120, Math.min(w + 120, c._x));
                c._y = Math.max(-120, Math.min(h + 120, c._y));
                c.style.left = (c._x | 0) + 'px';
                c.style.top = (c._y | 0) + 'px';
                c.style.transform = `rotate(${c._angle}deg)`;
            });
            requestAnimationFrame(loop);
        }
        requestAnimationFrame(loop);
    }

    // Create ambient cubes for non-contact pages
    function initFloats(page) {
        const floatArea = document.getElementById('float-area');
        if (!floatArea) return;
        // small decorative cubes: spawn some with lower opacity
        // they are created by createMovingCubes called from appInit
        // but we can add small additional decorative cubes (optional)
    }

    // CONTACT FORM demo behavior
    function setupContactForm() {
        const form = document.getElementById('contact-form');
        if (!form) return;
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            // mimic sending -> show a pleasant in-page toast
            showToast("Thanks! Your message has been recorded (demo).");
            form.reset();
        });
    }

    // small toast
    function showToast(msg) {
        const t = document.createElement('div');
        t.className = 'glass';
        t.style.position = 'fixed';
        t.style.right = '18px';
        t.style.bottom = '18px';
        t.style.padding = '.8rem 1rem';
        t.style.zIndex = 999;
        t.textContent = msg;
        document.body.appendChild(t);
        setTimeout(() => t.style.opacity = '0', 2200);
        setTimeout(() => t.remove(), 2600);
    }

    // expose helper for quick color changes in console (dev)
    window._setTheme = applyTheme;

})();