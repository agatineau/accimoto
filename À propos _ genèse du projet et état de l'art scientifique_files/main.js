/* ===== LAUNCH BANNER ===== */
(function () {
    var root = document.documentElement;
    var nav = document.querySelector('.nav');
    var banner = document.querySelector('.launch-banner');
    if (nav) root.style.setProperty('--nav-height', nav.offsetHeight + 'px');
    if (banner) {
        if (localStorage.getItem('banner_hidden')) {
            banner.remove();
        } else {
            root.style.setProperty('--banner-height', banner.offsetHeight + 'px');
            banner.addEventListener('click', function () {
                banner.remove();
                root.style.setProperty('--banner-height', '0px');
                localStorage.setItem('banner_hidden', '1');
            });
        }
    }
})();

/* ===== MOBILE NAV DRAWER ===== */
(function () {
    var hamburger = document.getElementById('navHamburger');
    var drawer = document.getElementById('navDrawer');
    var overlay = document.getElementById('navOverlay');
    if (!hamburger || !drawer || !overlay) return;

    function openDrawer() {
        hamburger.classList.add('is-active');
        hamburger.setAttribute('aria-expanded', 'true');
        drawer.classList.add('is-open');
        overlay.classList.add('is-active');
        document.body.style.overflow = 'hidden';
        var firstLink = drawer.querySelector('a');
        if (firstLink) firstLink.focus();
    }

    function closeDrawer() {
        hamburger.classList.remove('is-active');
        hamburger.setAttribute('aria-expanded', 'false');
        drawer.classList.remove('is-open');
        overlay.classList.remove('is-active');
        document.body.style.overflow = '';
        hamburger.focus();
    }

    function isOpen() {
        return drawer.classList.contains('is-open');
    }

    hamburger.addEventListener('click', function () {
        if (isOpen()) closeDrawer(); else openDrawer();
    });

    overlay.addEventListener('click', closeDrawer);

    var drawerLinks = drawer.querySelectorAll('a');
    for (var i = 0; i < drawerLinks.length; i++) {
        drawerLinks[i].addEventListener('click', closeDrawer);
    }

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && isOpen()) closeDrawer();
    });

    window.addEventListener('resize', function () {
        if (window.innerWidth > 1024 && isOpen()) closeDrawer();
    });
})();

/* ===== DEMO FORM MODAL ===== */
(function () {
    var overlay = document.getElementById('modalDemo');
    if (!overlay) return;

    var API_URL = '/api/folk.php';
    var form = document.getElementById('demoForm');
    var success = document.getElementById('formSuccess');
    var closeBtn = document.getElementById('modalClose');

    // Ouvrir la modal - tous les boutons "Demander une démo"
    document.querySelectorAll('[data-open-demo]').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    });

    // Fermer - bouton close
    closeBtn.addEventListener('click', closeModal);

    // Fermer - clic sur l'overlay
    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) closeModal();
    });

    // Fermer - touche Escape
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && overlay.classList.contains('active')) closeModal();
    });

    function closeModal() {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Validation
    var emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

    function validateField(name) {
        var group = form.querySelector('[data-field="' + name + '"]');
        var input = group.querySelector('input');
        var valid = true;

        if (name === 'optin') {
            valid = input.checked;
        } else if (name === 'email') {
            valid = input.value.trim().length > 0 && emailRegex.test(input.value.trim());
        } else {
            valid = input.value.trim().length > 0;
        }

        group.classList.toggle('has-error', !valid);
        return valid;
    }

    // Effacer l'erreur dès que l'utilisateur tape ou coche
    form.querySelectorAll('input').forEach(function (input) {
        var evt = input.type === 'checkbox' ? 'change' : 'input';
        input.addEventListener(evt, function () {
            var group = input.closest('.form-group');
            if (group) group.classList.remove('has-error');
        });
    });

    // Source dynamique : data-source sur le form, sinon pathname
    function getSource() {
        if (form.dataset.source) return form.dataset.source;
        var path = window.location.pathname.replace(/\//g, '').replace('.html', '');
        return path || 'homepage';
    }

    // Soumission du formulaire
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        var fields = ['lastName', 'firstName', 'email', 'structure', 'optin'];
        var allValid = true;

        fields.forEach(function (name) {
            if (!validateField(name)) allValid = false;
        });

        if (!allValid) {
            var firstError = form.querySelector('.has-error input');
            if (firstError) firstError.focus();
            return;
        }

        // Honeypot anti-spam
        var honeypot = form.querySelector('#website');
        if (honeypot && honeypot.value.length > 0) {
            form.style.display = 'none';
            success.classList.add('active');
            setTimeout(function () {
                closeModal();
                setTimeout(function () {
                    form.style.display = '';
                    form.reset();
                    success.classList.remove('active');
                }, 300);
            }, 3000);
            return;
        }

        var data = {
            lastName: form.lastName.value.trim(),
            firstName: form.firstName.value.trim(),
            email: form.email.value.trim(),
            structure: form.structure.value.trim(),
            comment: form.comment ? form.comment.value.trim() : '',
            source: getSource(),
            date: new Date().toISOString()
        };

        fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }).catch(function () { });

        form.style.display = 'none';
        success.classList.add('active');

        setTimeout(function () {
            closeModal();
            setTimeout(function () {
                form.style.display = '';
                form.reset();
                form.querySelectorAll('.has-error').forEach(function (g) {
                    g.classList.remove('has-error');
                });
                success.classList.remove('active');
            }, 300);
        }, 3000);
    });
})();

/* ===== MODAL ZCAL ===== */
(function () {
    var overlay = document.getElementById('modalZcal');
    if (!overlay) return;
    var closeBtn = document.getElementById('modalZcalClose');
    var zcalFrame = document.getElementById('zcalFrame');
    var zcalLoaded = false;

    document.querySelectorAll('[data-open-zcal]').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            if (!zcalLoaded) {
                zcalFrame.src = 'https://zcal.co/i/JmR5oOoW?embed=1';
                zcalLoaded = true;
            }
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    });

    closeBtn.addEventListener('click', closeZcal);

    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) closeZcal();
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && overlay.classList.contains('active')) closeZcal();
    });

    function closeZcal() {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }
})();

/* ===== SCROLL PROGRESS ===== */
(function () {
    var bar = document.getElementById('scroll-progress');
    if (!bar) return;
    var nav = document.querySelector('.nav');

    function setBarPosition() {
        bar.style.top = nav.offsetHeight + 'px';
    }
    setBarPosition();
    window.addEventListener('resize', setBarPosition);

    window.addEventListener('scroll', function () {
        var scrollTop = window.scrollY;
        var docHeight = document.body.scrollHeight - window.innerHeight;
        bar.style.width = (scrollTop / docHeight) * 100 + '%';
    });
})();

/* ===== SCROLLSPY NAV ===== */
(function () {
    var navLinks = document.querySelectorAll('.nav-link');
    var sections = [];

    navLinks.forEach(function (link) {
        var id = link.getAttribute('href').replace('#', '');
        var section = document.getElementById(id);
        if (section) sections.push({ id: id, el: section, link: link });
    });

    function updateActive() {
        var scrollY = window.scrollY + window.innerHeight / 3;
        var current = null;

        sections.forEach(function (s) {
            if (s.el.offsetTop <= scrollY) current = s;
        });

        navLinks.forEach(function (l) {
            if (l.getAttribute('href').charAt(0) === '#') l.classList.remove('active');
        });
        if (current) current.link.classList.add('active');
    }

    window.addEventListener('scroll', updateActive);
    updateActive();
})();

/* ===== STEPS TIMELINE (DESKTOP + MOBILE) ===== */
(function () {
    var allSteps = document.querySelectorAll('.steps');
    if (!allSteps.length) return;

    function updateTimeline() {
        var isMobile = window.innerWidth <= 768;
        allSteps.forEach(function (stepsEl) {
            var stepNums = stepsEl.querySelectorAll('.step-number');
            if (!stepNums.length) return;

            var stepsRect = stepsEl.getBoundingClientRect();

            // Centre de chaque step-number relatif au conteneur .steps
            var centers = [];
            stepNums.forEach(function (el) {
                var r = el.getBoundingClientRect();
                if (isMobile) {
                    centers.push(r.top + 24 - stepsRect.top);
                } else {
                    centers.push(r.left + 24 - stepsRect.left);
                }
            });

            var firstCenter = centers[0];
            var lastCenter = centers[centers.length - 1];
            var totalLength = lastCenter - firstCenter;

            if (totalLength <= 0) return;

            // Calcul de la progression
            var progress;
            if (isMobile) {
                var trigger = window.innerHeight * 0.5 - stepsRect.top;
                progress = (trigger - firstCenter) / totalLength;
            } else {
                var start = window.innerHeight * 0.55;
                var end = window.innerHeight * 0.25;
                progress = (start - stepsRect.top) / (start - end);
            }
            progress = Math.max(0, Math.min(1, progress));

            stepsEl.style.setProperty('--steps-left', firstCenter + 'px');
            stepsEl.style.setProperty('--steps-length', totalLength + 'px');
            stepsEl.style.setProperty('--steps-progress', (progress * totalLength) + 'px');

            var progressPx = progress * totalLength;
            stepNums.forEach(function (el, i) {
                el.classList.toggle('active', progressPx >= (centers[i] - firstCenter));
            });
        });
    }

    var ticking = false;
    function onScroll() {
        if (!ticking) {
            requestAnimationFrame(function () {
                updateTimeline();
                ticking = false;
            });
            ticking = true;
        }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', updateTimeline);
    updateTimeline();
})();

/* ===== BENEFITS HORIZONTAL SCROLL (MOBILE) ===== */
(function () {
    var benefits = document.querySelector('.benefits');
    var showcase = document.querySelector('.benefits-showcase');
    var grid = document.querySelector('.benefits-grid');
    if (!benefits || !showcase || !grid) return;

    var screenshot = document.querySelector('.benefits-screenshot');
    var allCards = grid.querySelectorAll('.benefit-card');
    var realCards = grid.querySelectorAll('.benefit-card:not(.benefit-card-ghost)');
    var wasMobile = null;
    var activeIndex = -1;

    // Smooth interpolation
    var currentX = 0;
    var targetX = 0;
    var rafId = null;
    var LERP = 0.12;

    function isMobile() {
        return window.innerWidth <= 768;
    }

    function setActiveCard(index) {
        if (index === activeIndex) return;
        activeIndex = index;
        for (var i = 0; i < allCards.length; i++) {
            allCards[i].classList.toggle('is-active', i === index);
        }
    }

    function render() {
        currentX += (targetX - currentX) * LERP;

        // Stop animating when close enough
        if (Math.abs(targetX - currentX) < 0.5) {
            currentX = targetX;
        }

        grid.style.transform = 'translateX(' + currentX + 'px)';

        // Card active = la plus centrée dans le viewport (ignore ghost)
        var viewWidth = showcase.offsetWidth;
        var viewCenter = viewWidth / 2;
        var bestIndex = 1;
        var bestDist = Infinity;
        for (var i = 1; i < allCards.length; i++) {
            var cardLeft = allCards[i].offsetLeft + currentX;
            var cardCenter = cardLeft + allCards[i].offsetWidth / 2;
            var dist = Math.abs(cardCenter - viewCenter);
            if (dist < bestDist) {
                bestDist = dist;
                bestIndex = i;
            }
        }
        setActiveCard(bestIndex);

        if (Math.abs(targetX - currentX) > 0.5) {
            rafId = requestAnimationFrame(render);
        } else {
            rafId = null;
        }
    }

    function startRender() {
        if (!rafId) rafId = requestAnimationFrame(render);
    }

    function update() {
        if (!isMobile()) return;

        var rect = benefits.getBoundingClientRect();
        var sectionTop = -rect.top;
        var scrollRange = benefits.offsetHeight - window.innerHeight;
        if (scrollRange <= 0) return;
        var progress = Math.max(0, Math.min(1, sectionTop / scrollRange));

        var viewWidth = showcase.offsetWidth;
        var lastCard = realCards[realCards.length - 1];
        var maxTranslate = lastCard.offsetLeft + lastCard.offsetWidth - viewWidth + 20;

        targetX = -maxTranslate * progress;
        startRender();

        // Afficher le dégradé du screenshot uniquement quand les cards défilent dessus
        if (screenshot) {
            screenshot.classList.toggle('has-overlay', progress > 0.02);
        }
    }

    function snapToCard(index) {
        if (!isMobile()) return;
        var viewWidth = showcase.offsetWidth;
        var lastCard = realCards[realCards.length - 1];
        var maxTranslate = lastCard.offsetLeft + lastCard.offsetWidth - viewWidth + 20;

        var cardLeft = allCards[index].offsetLeft;
        var cardWidth = allCards[index].offsetWidth;
        // Aligner la card avec 20px de marge à gauche
        var targetTranslate = -(cardLeft - 20);
        targetTranslate = Math.max(-maxTranslate, Math.min(0, targetTranslate));

        var scrollRange = benefits.offsetHeight - window.innerHeight;
        var progress = -targetTranslate / maxTranslate;
        var benefitsTop = benefits.getBoundingClientRect().top + window.pageYOffset;
        var targetScroll = benefitsTop + progress * scrollRange;

        window.scrollTo({ top: targetScroll, behavior: 'smooth' });
    }

    // Click sur une vraie card → snap
    for (var k = 1; k < allCards.length; k++) {
        (function (idx) {
            allCards[idx].addEventListener('click', function () {
                if (isMobile()) snapToCard(idx);
            });
        })(k);
    }

    function setup() {
        var mobile = isMobile();
        if (mobile === wasMobile) return;
        wasMobile = mobile;

        if (mobile) {
            var viewWidth = showcase.offsetWidth;
            var lastCard = realCards[realCards.length - 1];
            var maxTranslate = lastCard.offsetLeft + lastCard.offsetWidth - viewWidth + 20;
            var scrollNeeded = maxTranslate + window.innerHeight;
            benefits.style.minHeight = scrollNeeded + 'px';
            activeIndex = -1;
            window.addEventListener('scroll', update, { passive: true });
            update();
        } else {
            benefits.style.minHeight = '';
            grid.style.transform = '';
            currentX = 0;
            targetX = 0;
            if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
            for (var i = 0; i < allCards.length; i++) {
                allCards[i].classList.remove('is-active');
            }
            if (screenshot) screenshot.classList.remove('has-overlay');
            window.removeEventListener('scroll', update);
        }
    }

    setup();
    window.addEventListener('resize', function () {
        wasMobile = null;
        setup();
    });
})();

/* ===== PROBLEM STATS COUNTER ANIMATION ===== */
(function () {
    var stats = document.querySelectorAll('.problem-stat[data-count]');
    if (!stats.length) return;

    var DURATION = 1200; // ms
    var animated = [];
    for (var i = 0; i < stats.length; i++) animated.push(false);

    // Détecte si le format est "XhYY" (temps)
    function isTimeFormat(str) {
        return /^\d+h\d{0,2}$/.test(str);
    }

    // Convertit "2h30" → 150 (minutes totales)
    function timeToMinutes(str) {
        var parts = str.split('h');
        var h = parseInt(parts[0], 10);
        var m = parts[1] ? parseInt(parts[1], 10) : 0;
        return h * 60 + m;
    }

    // Convertit minutes → "XhYY" avec les minutes paddées
    function minutesToTime(totalMin) {
        var h = Math.floor(totalMin / 60);
        var m = totalMin % 60;
        return h + 'h' + (m < 10 ? '0' : '') + m;
    }

    // Parse "60k€" → [{num:60, suffix:"k€"}]
    // Parse "43%"  → [{num:43, suffix:"%"}]
    function parseSegments(str) {
        var segments = [];
        var regex = /(\d+)([^\d]*)/g;
        var match;
        while ((match = regex.exec(str)) !== null) {
            segments.push({ num: parseInt(match[1], 10), suffix: match[2] });
        }
        return segments;
    }

    function renderSegments(segments, progress) {
        var result = '';
        for (var i = 0; i < segments.length; i++) {
            var current = Math.round(segments[i].num * progress);
            result += current + segments[i].suffix;
        }
        return result;
    }

    function animateStat(el, index) {
        if (animated[index]) return;
        animated[index] = true;

        var value = el.getAttribute('data-count');
        var countdownFrom = el.getAttribute('data-countdown');
        var isTime = isTimeFormat(value);
        var totalMinutes = isTime ? timeToMinutes(value) : 0;
        var segments = !isTime ? parseSegments(value) : null;
        var start = null;

        // Countdown mode : part d'un nombre et descend vers 0
        if (countdownFrom !== null) {
            var fromNum = parseInt(countdownFrom, 10);
            el.textContent = fromNum;

            function stepCountdown(timestamp) {
                if (!start) start = timestamp;
                var elapsed = timestamp - start;
                var progress = Math.min(elapsed / DURATION, 1);
                // Ease-out : rapide au début, ralentit vers la fin
                var eased = 1 - Math.pow(1 - progress, 3);
                var current = Math.round(fromNum * (1 - eased));
                el.textContent = current;

                if (progress < 1) {
                    requestAnimationFrame(stepCountdown);
                } else {
                    el.textContent = '0';
                }
            }

            requestAnimationFrame(stepCountdown);
            return;
        }

        // Afficher 0 au départ de l'animation
        el.textContent = isTime ? '0h00' : renderSegments(segments, 0);

        function step(timestamp) {
            if (!start) start = timestamp;
            var elapsed = timestamp - start;
            var progress = Math.min(elapsed / DURATION, 1);
            // Ease-in exponentiel : démarre lent, accélère fortement
            var eased = progress === 0 ? 0 : Math.pow(2, 10 * (progress - 1));

            if (isTime) {
                var currentMin = Math.round(totalMinutes * eased);
                el.textContent = minutesToTime(currentMin);
            } else {
                el.textContent = renderSegments(segments, eased);
            }

            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                el.textContent = value;
            }
        }

        requestAnimationFrame(step);
    }

    // Observer : dès que la grille est visible, lancer les compteurs en staggeré
    var STAGGER = 400; // ms entre chaque compteur

    if ('IntersectionObserver' in window) {
        var grid = stats[0].closest('.problem-grid') || stats[0].parentElement;
        var observer = new IntersectionObserver(function (entries) {
            for (var i = 0; i < entries.length; i++) {
                if (entries[i].isIntersecting) {
                    observer.disconnect();
                    // Afficher les zéros formatés puis lancer l'animation
                    for (var k = 0; k < stats.length; k++) {
                        (function (el, idx) {
                            setTimeout(function () {
                                animateStat(el, idx);
                            }, idx * STAGGER);
                        })(stats[k], k);
                    }
                    return;
                }
            }
        }, { threshold: 0.3, rootMargin: '0px 0px -10% 0px' });

        observer.observe(grid);
    }
})();

/* ===== BENEFITS CARDS SLIDE-IN (DESKTOP) ===== */
(function () {
    if (!('IntersectionObserver' in window)) return;
    // Ne pas animer sur mobile (le scroll-jack gère déjà)
    if (window.innerWidth <= 1024) return;

    var cards = document.querySelectorAll('.benefit-card');
    if (!cards.length) return;

    var STAGGER = 150; // ms entre chaque card

    var observer = new IntersectionObserver(function (entries) {
        for (var i = 0; i < entries.length; i++) {
            if (entries[i].isIntersecting) {
                // Déclencher toutes les cards avec un stagger
                for (var j = 0; j < cards.length; j++) {
                    (function (card, delay) {
                        setTimeout(function () {
                            card.classList.add('is-visible');
                        }, delay);
                    })(cards[j], j * STAGGER);
                }
                observer.disconnect();
                break;
            }
        }
    }, { threshold: 0.2 });

    // Observer la grid entière plutôt que chaque card
    var grid = document.querySelector('.benefits-grid');
    if (grid) observer.observe(grid);
})();

/* ===== PDSA CARDS SLIDE-IN ===== */
(function () {
    if (!('IntersectionObserver' in window)) return;
    if (window.innerWidth <= 1024) return;

    var pdsaCards = document.querySelectorAll('.pdsa-card');
    if (!pdsaCards.length) return;

    var STAGGER = 150;

    var pdsaObserver = new IntersectionObserver(function (entries) {
        for (var i = 0; i < entries.length; i++) {
            if (entries[i].isIntersecting) {
                for (var j = 0; j < pdsaCards.length; j++) {
                    (function (card, delay) {
                        setTimeout(function () {
                            card.classList.add('is-visible');
                        }, delay);
                    })(pdsaCards[j], j * STAGGER);
                }
                pdsaObserver.disconnect();
                break;
            }
        }
    }, { threshold: 0.2 });

    var pdsaGrid = document.querySelector('.pdsa-cards');
    if (pdsaGrid) pdsaObserver.observe(pdsaGrid);
})();

/* ===== NAVIGATION CLAVIER SECTION PAR SECTION ===== */
(function () {
    var sections = Array.from(document.querySelectorAll('section'));
    if (!sections.length) return;

    var currentTarget = 0;
    var isScrolling = false;

    // Sync currentTarget with manual scroll position
    function syncTarget() {
        var scrollY = window.scrollY;
        var viewH = window.innerHeight;
        var best = 0;
        for (var i = 0; i < sections.length; i++) {
            var top = sections[i].offsetTop;
            // Section is "current" if its top is within upper third of viewport
            if (top <= scrollY + viewH * 0.35) {
                best = i;
            }
        }
        currentTarget = best;
        isScrolling = false;
    }

    var syncTimer = null;
    window.addEventListener('scroll', function () {
        clearTimeout(syncTimer);
        syncTimer = setTimeout(syncTarget, 200);
    }, { passive: true });

    syncTarget();

    document.addEventListener('keydown', function (e) {
        var tag = document.activeElement.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        if (document.querySelector('.modal-overlay.active')) return;

        if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === 'ArrowRight') {
            e.preventDefault();
            if (isScrolling) return;
            var next = Math.min(currentTarget + 1, sections.length - 1);
            if (next !== currentTarget) {
                currentTarget = next;
                isScrolling = true;
                sections[currentTarget].scrollIntoView({ behavior: 'smooth' });
            }
        } else if (e.key === 'ArrowUp' || e.key === 'PageUp' || e.key === 'ArrowLeft') {
            e.preventDefault();
            if (isScrolling) return;
            var prev = Math.max(currentTarget - 1, 0);
            if (prev !== currentTarget) {
                currentTarget = prev;
                isScrolling = true;
                sections[currentTarget].scrollIntoView({ behavior: 'smooth' });
            }
        }
    });
})();

/* ===== NEWS CAROUSEL ===== */
(function () {
    var track = document.querySelector('.news-track');
    if (!track) return;
    var slides = document.querySelectorAll('.news-embed');
    var leftBtn = document.querySelector('.news-arrow-left');
    var rightBtn = document.querySelector('.news-arrow-right');
    var dotsContainer = document.querySelector('.news-dots');

    if (!track || slides.length === 0) return;

    var currentIndex = 0;
    var perPage = 3;
    var gap = 24;

    function getPerPage() {
        return window.innerWidth <= 1024 ? 1 : 3;
    }

    function getGap() {
        return window.innerWidth <= 1024 ? 0 : 24;
    }

    function maxIndex() {
        return Math.max(0, slides.length - perPage);
    }

    function buildDots() {
        dotsContainer.innerHTML = '';
        var totalDots = slides.length;
        for (var i = 0; i < totalDots; i++) {
            var dot = document.createElement('button');
            dot.className = 'news-dot' + (i === currentIndex ? ' active' : '');
            dot.setAttribute('aria-label', 'Voir le post ' + (i + 1));
            dot.dataset.index = i;
            dot.addEventListener('click', function () {
                goTo(parseInt(this.dataset.index));
            });
            dotsContainer.appendChild(dot);
        }
    }

    function updatePosition() {
        var containerWidth = track.parentElement.offsetWidth;
        var slideWidth;
        if (perPage === 1) {
            slideWidth = containerWidth;
        } else {
            slideWidth = (containerWidth - gap * (perPage - 1)) / perPage;
        }
        var offset = currentIndex * (slideWidth + gap);
        track.style.transform = 'translateX(-' + offset + 'px)';

        if (leftBtn) leftBtn.disabled = currentIndex === 0;
        if (rightBtn) rightBtn.disabled = currentIndex >= maxIndex();

        var dots = dotsContainer.querySelectorAll('.news-dot');
        for (var i = 0; i < dots.length; i++) {
            dots[i].classList.toggle('active', i === currentIndex);
        }
    }

    function goTo(index) {
        currentIndex = Math.max(0, Math.min(index, maxIndex()));
        updatePosition();
    }

    function next() { goTo(currentIndex + 1); }
    function prev() { goTo(currentIndex - 1); }

    if (leftBtn) leftBtn.addEventListener('click', function () { prev(); });
    if (rightBtn) rightBtn.addEventListener('click', function () { next(); });

    // Swipe mobile
    var touchStartX = 0;
    track.addEventListener('touchstart', function (e) {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    track.addEventListener('touchend', function (e) {
        var diff = touchStartX - e.changedTouches[0].screenX;
        if (Math.abs(diff) > 50) {
            if (diff > 0) next(); else prev();
        }
    }, { passive: true });

    // Resize
    function onResize() {
        var newPerPage = getPerPage();
        gap = getGap();
        if (newPerPage !== perPage) {
            perPage = newPerPage;
            buildDots();
            if (currentIndex > maxIndex()) currentIndex = maxIndex();
        }
        updatePosition();
    }
    window.addEventListener('resize', onResize);

    // Init
    perPage = getPerPage();
    gap = getGap();
    buildDots();
    updatePosition();
})();
