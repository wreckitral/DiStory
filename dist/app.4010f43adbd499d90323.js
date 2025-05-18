'use strict';
(self.webpackChunkdistory = self.webpackChunkdistory || []).push([
    [524],
    {
        964: (e, t, n) => {
            var i = {};
            n.r(i),
                n.d(i, {
                    checkAuthenticatedRoute: () => p,
                    checkUnauthenticatedRouteOnly: () => h,
                    getAccessToken: () => c,
                    getLogout: () => g,
                    putAccessToken: () => d,
                    removeAccessToken: () => u,
                });
            var o = {};
            function a() {
                return (function (e) {
                    let t = '';
                    return (
                        e.resource && (t = t.concat(`/${e.resource}`)),
                        e.id && (t = t.concat('/:id')),
                        t || '/'
                    );
                })(
                    (function (e) {
                        const t = e.split('/');
                        return { resource: t[1] || null, id: t[2] || null };
                    })(location.hash.replace('#', '') || '/'),
                );
            }
            function r(e) {
                const t = e.formattedDate || e.createdAt;
                return `\n    <div class="story-card">\n      <img src="${e.photoUrl}" alt="${e.name}" class="story-image" />\n      <div class="story-content">\n        <h3 class="story-title">${e.name}</h3>\n        <p class="story-date">Created: ${t}</p>\n        <p class="story-excerpt">${e.description}</p>\n      </div>\n    </div>\n  `;
            }
            n.r(o),
                n.d(o, {
                    addToFavorites: () => R,
                    checkIsFavorite: () => H,
                    createStory: () => D,
                    getAllStories: () => F,
                    getFavorites: () => $,
                    getLogin: () => M,
                    getRegistered: () => N,
                    getStoryById: () => P,
                    removeFromFavorites: () => j,
                    subscribeNotification: () => O,
                });
            const s = 'accessToken',
                l = 'https://story-api.dicoding.dev/v1';
            function c() {
                try {
                    const e = localStorage.getItem(s);
                    return 'null' === e || 'undefined' === e ? null : e;
                } catch (e) {
                    return console.error('getAccessToken: error:', e), null;
                }
            }
            function d(e) {
                try {
                    return localStorage.setItem(s, e), !0;
                } catch (e) {
                    return console.error('putAccessToken: error:', e), !1;
                }
            }
            function u() {
                try {
                    return localStorage.removeItem(s), !0;
                } catch (e) {
                    return console.error('getLogout: error:', e), !1;
                }
            }
            const m = ['/signin', '/signup'];
            function h(e) {
                const t = a(),
                    n = !!c();
                return m.includes(t) && n ? ((location.hash = '/'), null) : e;
            }
            function p(e) {
                return c() ? e : ((location.hash = '/signin'), null);
            }
            function g() {
                u();
            }
            class y {
                constructor({ view: e, api: t }) {
                    (this.view = e), (this.api = t);
                }
                async processSignup(e) {
                    if (this.view.validateForm()) {
                        this.view.displayLoadingState();
                        try {
                            const t = { name: e.fullName, email: e.email, password: e.password },
                                n = await this.api.getRegistered(t);
                            0 == n.error
                                ? this.view.showSuccessMessage(n.message)
                                : (console.warn(n),
                                  this.view.showErrorMessage(
                                      n.message || 'Account creation failed',
                                  ));
                        } catch (e) {
                            console.error('Signup process error:', e),
                                this.view.showErrorMessage(
                                    e.message || 'Unable to process your request',
                                );
                        } finally {
                            this.view.resetButtonState();
                        }
                    }
                }
            }
            var v = n(148);
            const w = 'stories',
                f = 'favorites',
                b = async () =>
                    (0, v.P2)('distory-db', 1, {
                        upgrade(e) {
                            e.objectStoreNames.contains(w) ||
                                e
                                    .createObjectStore(w, { keyPath: 'id' })
                                    .createIndex('by-date', 'createdAt'),
                                e.objectStoreNames.contains(f) ||
                                    e.createObjectStore(f, { keyPath: 'id' });
                        },
                    }),
                k = async (e) => (await b()).put(w, e),
                S = async () => (await b()).getAll(w),
                E = async (e) => (await b()).get(w, e),
                I = async (e) => (await b()).put(f, { ...e, favoriteAt: new Date().toISOString() }),
                C = async () => (await b()).getAll(f),
                B = async (e) => (await b()).delete(f, e),
                T = async (e) => {
                    const t = await b();
                    return !!(await t.get(f, e));
                },
                x = {
                    REGISTER: `${l}/register`,
                    LOGIN: `${l}/login`,
                    ALL_STORIES: `${l}/stories`,
                    CREATE_STORY: `${l}/stories`,
                    SUBSCRIBE_NOTIFICATION: `${l}/notifications/subscribe`,
                },
                A = async (e, t) => {
                    try {
                        const t = c(),
                            n = await fetch(e, { headers: { Authorization: `Bearer ${t}` } }),
                            i = await n.json();
                        return (
                            (i.ok || n.ok) &&
                                i.data &&
                                (Array.isArray(i.data)
                                    ? await (async (e) => {
                                          const t = (await b()).transaction(w, 'readwrite');
                                          await Promise.all([
                                              ...e.map((e) => t.store.put(e)),
                                              t.done,
                                          ]);
                                      })(i.data)
                                    : await k(i.data)),
                            { ...i, ok: n.ok, source: 'network' }
                        );
                    } catch (t) {
                        console.warn(
                            `Network error when fetching ${e}, falling back to offline data`,
                            t,
                        );
                        try {
                            return {
                                error: !1,
                                message: 'Retrieved from offline storage',
                                data: await S(),
                                ok: !0,
                                source: 'cache',
                            };
                        } catch (e) {
                            throw (
                                (console.error('Failed to retrieve data from offline storage', e),
                                new Error(
                                    'Unable to fetch data. Please check your connection and try again.',
                                ))
                            );
                        }
                    }
                };
            async function N({ name: e, email: t, password: n }) {
                const i = JSON.stringify({ name: e, email: t, password: n });
                try {
                    const e = await fetch(x.REGISTER, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: i,
                    });
                    return { ...(await e.json()), ok: e.ok };
                } catch (e) {
                    return (
                        console.error('Registration failed', e),
                        {
                            error: !0,
                            message: 'Network error. Please check your connection and try again.',
                            ok: !1,
                        }
                    );
                }
            }
            async function M({ email: e, password: t }) {
                const n = JSON.stringify({ email: e, password: t });
                try {
                    const e = await fetch(x.LOGIN, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: n,
                    });
                    return { ...(await e.json()), ok: e.ok };
                } catch (e) {
                    return (
                        console.error('Login failed', e),
                        {
                            error: !0,
                            message: 'Network error. Please check your connection and try again.',
                            ok: !1,
                        }
                    );
                }
            }
            async function F() {
                return A(x.ALL_STORIES, 'stories');
            }
            async function P(e) {
                if (!navigator.onLine)
                    try {
                        return {
                            error: !1,
                            message: 'Retrieved from offline storage',
                            data: await E(e),
                            ok: !0,
                            source: 'cache',
                        };
                    } catch (e) {
                        return (
                            console.error('Failed to retrieve story from offline storage', e),
                            { error: !0, message: 'Story not available offline', ok: !1 }
                        );
                    }
                try {
                    const t = c(),
                        n = await fetch(`${x.ALL_STORIES}/${e}`, {
                            headers: { Authorization: `Bearer ${t}` },
                        }),
                        i = await n.json();
                    return i.data && (await k(i.data)), { ...i, ok: n.ok, source: 'network' };
                } catch (t) {
                    console.error(`Failed to fetch story id ${e}`, t);
                    try {
                        const t = await E(e);
                        if (t)
                            return {
                                error: !1,
                                message: 'Retrieved from offline storage',
                                data: t,
                                ok: !0,
                                source: 'cache',
                            };
                    } catch (e) {
                        console.error('Failed to retrieve story from offline storage', e);
                    }
                    return {
                        error: !0,
                        message:
                            'Failed to load story. Please check your connection and try again.',
                        ok: !1,
                    };
                }
            }
            async function D(e) {
                if (!navigator.onLine)
                    return {
                        error: !0,
                        message:
                            'You are offline. Please connect to the internet to create a story.',
                        ok: !1,
                    };
                try {
                    const t = c(),
                        n = await fetch(x.CREATE_STORY, {
                            method: 'POST',
                            headers: { Authorization: `Bearer ${t}` },
                            body: e,
                        }),
                        i = await n.json();
                    return i.data && (await k(i.data)), { ...i, ok: n.ok };
                } catch (e) {
                    return (
                        console.error('Failed to create story', e),
                        {
                            error: !0,
                            message:
                                'Failed to create story. Please check your connection and try again.',
                            ok: !1,
                        }
                    );
                }
            }
            async function O(e) {
                if (!navigator.onLine)
                    return {
                        error: !0,
                        message:
                            'You are offline. Push notification subscription requires internet connection.',
                        ok: !1,
                    };
                try {
                    const t = c(),
                        n = await fetch(x.SUBSCRIBE_NOTIFICATION, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${t}`,
                            },
                            body: JSON.stringify(e),
                        });
                    return { ...(await n.json()), ok: n.ok };
                } catch (e) {
                    return (
                        console.error('Failed to subscribe to notifications', e),
                        {
                            error: !0,
                            message:
                                'Failed to subscribe to notifications. Please try again later.',
                            ok: !1,
                        }
                    );
                }
            }
            async function R(e) {
                try {
                    return await I(e), { error: !1, message: 'Story added to favorites', ok: !0 };
                } catch (e) {
                    return (
                        console.error('Failed to add story to favorites', e),
                        { error: !0, message: 'Failed to add story to favorites', ok: !1 }
                    );
                }
            }
            async function j(e) {
                try {
                    return (
                        await B(e), { error: !1, message: 'Story removed from favorites', ok: !0 }
                    );
                } catch (e) {
                    return (
                        console.error('Failed to remove story from favorites', e),
                        { error: !0, message: 'Failed to remove story from favorites', ok: !1 }
                    );
                }
            }
            async function $() {
                try {
                    return {
                        error: !1,
                        message: 'Retrieved favorites from storage',
                        data: await C(),
                        ok: !0,
                    };
                } catch (e) {
                    return (
                        console.error('Failed to get favorites', e),
                        { error: !0, message: 'Failed to retrieve favorites', ok: !1 }
                    );
                }
            }
            async function H(e) {
                try {
                    return { error: !1, data: await T(e), ok: !0 };
                } catch (e) {
                    return (
                        console.error('Failed to check if story is a favorite', e),
                        { error: !0, message: 'Failed to check favorite status', ok: !1 }
                    );
                }
            }
            class z {
                constructor() {
                    this.presenter = null;
                }
                async render() {
                    return '\n      <div class="signup-page">\n        <div class="signup-card">\n          <h2 class="signup-heading">Join Distory</h2>\n          <p class="signup-tagline">Create an account to share your stories with the world</p>\n          <form id="signup-form" class="signup-form">\n            <div class="input-group">\n              <label for="fullname" class="form-label">Full Name</label>\n              <div class="input-wrapper">\n                <input\n                  type="text"\n                  id="fullname"\n                  class="form-input"\n                  placeholder="Enter your full name"\n                  required\n                >\n              </div>\n            </div>\n\n            <div class="input-group">\n              <label for="email-address" class="form-label">Email Address</label>\n              <div class="input-wrapper">\n                <input\n                  type="email"\n                  id="email-address"\n                  class="form-input"\n                  placeholder="example@domain.com"\n                  required\n                >\n              </div>\n            </div>\n\n            <div class="input-group">\n              <label for="user-password" class="form-label">Password</label>\n              <div class="input-wrapper">\n                <input\n                  type="password"\n                  id="user-password"\n                  class="form-input"\n                  placeholder="Create a strong password"\n                  required\n                >\n              </div>\n            </div>\n            <div class="form-actions">\n              <div id="action-button-container">\n                <button type="submit" class="btn-primary">Start Your Story Journey</button>\n              </div>\n              <p class="login-link">Already a storyteller? <a href="#/signin">Sign In</a></p>\n            </div>\n          </form>\n        </div>\n      </div>\n    ';
                }
                async afterRender() {
                    (this.presenter = new y({ view: this, api: o })),
                        this._initializeEventListeners();
                }
                _initializeEventListeners() {
                    const e = document.getElementById('signup-form'),
                        t = document.getElementById('email-address');
                    e.addEventListener('submit', async (e) => {
                        e.preventDefault();
                        const n = {
                            fullName: document.getElementById('fullname').value,
                            email: t.value,
                            password: document.getElementById('user-password').value,
                        };
                        await this.presenter.processSignup(n);
                    });
                }
                showSuccessMessage(e) {
                    console.log(`Signup success: ${e}`), (window.location.hash = '/signin');
                }
                showErrorMessage(e) {
                    window.alert(`${e}`);
                }
                displayLoadingState() {
                    document.getElementById('action-button-container').innerHTML =
                        '\n      <button type="submit" class="btn-primary btn-loading" disabled>\n        <span class="spinner"></span> Creating Account...\n      </button>\n    ';
                }
                resetButtonState() {
                    document.getElementById('action-button-container').innerHTML =
                        '\n      <button type="submit" class="btn-primary">Create Account</button>\n    ';
                }
                validateForm() {
                    const e = document.getElementById('fullname').value,
                        t = document.getElementById('email-address').value,
                        n = document.getElementById('user-password').value;
                    let i = !0,
                        o = '';
                    return (
                        !e || e.trim().length < 3
                            ? ((i = !1), (o = 'Name must be at least 3 characters'))
                            : t && t.includes('@')
                              ? (!n || n.length < 6) &&
                                ((i = !1), (o = 'Password must be at least 6 characters'))
                              : ((i = !1), (o = 'Please enter a valid email address')),
                        i || this.showErrorMessage(o),
                        i
                    );
                }
            }
            class q {
                #e;
                #t;
                #n;
                constructor({ view: e, model: t, authModel: n }) {
                    (this.#e = e), (this.#t = t), (this.#n = n);
                }
                async getLogin({ email: e, password: t }) {
                    try {
                        this.#e.showSubmitLoadingButton();
                        const n = await this.#t.getLogin({ email: e, password: t });
                        if (!n || 1 == n.error)
                            throw new Error(
                                'Login gagal. Silakan periksa email dan password Anda.',
                            );
                        await this.#n.putAccessToken(n.loginResult.token),
                            this.#e.loginSuccessfully('Login berhasil');
                    } catch (e) {
                        this.#e.loginFailed(e.message);
                    } finally {
                        this.#e.hideSubmitLoadingButton();
                    }
                }
            }
            class U {
                #i = null;
                async render() {
                    return '\n            <section class="signup-page">\n              <div class="signup-card">\n                <h1 class="signup-heading">Sign In</h1>\n                <form id="login-form" class="signup-form">\n                  <div class="input-group">\n                    <label for="email-input" class="form-label">Email</label>\n                    <input\n                      type="email"\n                      id="email-input" name="email"\n                      class="form-input"\n                      placeholder="example@domain.com"\n                      required\n                    />\n                  </div>\n                  <div class="input-group">\n                    <label for="password-input" class="form-label">Password</label>\n                    <input type="password" id="password-input" name="password" class="form-input" required />\n                  </div>\n                  <div class="form-actions">\n                    <div id="submit-button-container">\n                      <button type="submit" class="btn-primary">Sign In</button>\n                    </div>\n                  </div>\n                  <p class="login-link">Don\'t have an account yet? <a href="#/signup">Sign Up</a></p>\n                </form>\n              </div>\n            </section>\n        ';
                }
                async afterRender() {
                    (this.#i = new q({ view: this, model: o, authModel: i })), this.#o();
                }
                #o() {
                    document.getElementById('login-form').addEventListener('submit', async (e) => {
                        e.preventDefault();
                        const t = {
                            email: document.getElementById('email-input').value,
                            password: document.getElementById('password-input').value,
                        };
                        await this.#i.getLogin(t);
                    });
                }
                loginSuccessfully(e) {
                    console.log(e), (location.hash = '/');
                }
                loginFailed(e) {
                    alert(e);
                }
                showSubmitLoadingButton() {
                    document.getElementById('submit-button-container').innerHTML =
                        '\n      <button type="submit" class="btn-primary btn-loading" disabled>\n        <span class="spinner"></span> Signing In...\n      </button>\n    ';
                }
                hideSubmitLoadingButton() {
                    document.getElementById('submit-button-container').innerHTML =
                        '\n      <button type="submit">Sign In</button>\n    ';
                }
            }
            var _ = n(481),
                G = n.n(_),
                V = n(927),
                W = n(980);
            delete G().Icon.Default.prototype._getIconUrl,
                G().Icon.Default.mergeOptions({ iconUrl: V, shadowUrl: W });
            let J = null;
            const Y = new (G().Icon)({
                iconUrl:
                    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
                shadowUrl:
                    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41],
            });
            function K(e, t = [-2.5489, 118.0149], n = 5) {
                return (
                    J && J.remove(),
                    (J = G().map(e).setView(t, n)),
                    G()
                        .tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                            attribution: '&copy; OpenStreetMap contributors',
                        })
                        .addTo(J),
                    J
                );
            }
            function Q(e, t = []) {
                const n = t
                    .filter((e) => e.lat && e.lon)
                    .map((e) => ({
                        type: 'Feature',
                        properties: {
                            name: e.name,
                            description: e.description,
                            photoUrl: e.photoUrl,
                        },
                        geometry: { type: 'Point', coordinates: [e.lon, e.lat] },
                    }));
                G()
                    .geoJSON(
                        { type: 'FeatureCollection', features: n },
                        {
                            pointToLayer: (e, t) =>
                                G()
                                    .marker(t, { icon: Y })
                                    .bindPopup(
                                        `<b>${e.properties.name}</b><br>${e.properties.description}<br><img src="${e.properties.photoUrl}" width="100">`,
                                    ),
                        },
                    )
                    .addTo(e);
            }
            class X {
                constructor({ view: e, model: t }) {
                    (this.view = e),
                        (this.model = t),
                        (this.template = { createStoryListTemplate: r });
                }
                formatDate(e) {
                    try {
                        const t = new Date(e);
                        return isNaN(t.getTime())
                            ? e
                            : t.toLocaleString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                              });
                    } catch (t) {
                        return e;
                    }
                }
                async loadStories() {
                    try {
                        const e = ((await this.model.getAllStories()).listStory || []).map((e) => ({
                            ...e,
                            formattedDate: this.formatDate(e.createdAt),
                        }));
                        this.view.showStories(e);
                    } catch (e) {
                        console.error('Failed to load stories:', e);
                    }
                }
                initializeMap(e) {
                    const t = e.filter((e) => {
                        const t = parseFloat(e.lat),
                            n = parseFloat(e.lon);
                        return (
                            !isNaN(t) && !isNaN(n) && t >= -90 && t <= 90 && n >= -180 && n <= 180
                        );
                    });
                    if (t.length > 0) {
                        const e = K('main-map-container');
                        e.whenReady(() => {
                            const n = t.map((e) => [parseFloat(e.lat), parseFloat(e.lon)]),
                                i = L.latLngBounds(n);
                            e.fitBounds(i, { padding: [50, 50] });
                        });
                        const n = t.map((e) => ({
                            ...e,
                            description: `${e.description}<br><strong>Created:</strong> ${e.formattedDate || this.formatDate(e.createdAt)}`,
                        }));
                        Q(e, n);
                    } else K('main-map-container', [-2.5489, 118.0149], 5);
                }
            }
            class Z {
                #i = null;
                async render() {
                    return '\n            <section>\n              <h2>All Stories</h2>\n              <div id="main-map-container" style="height: 400px; margin-bottom: 20px; z-index:1;"></div>\n              <div id="stories-container"></div>\n            </section>\n        ';
                }
                async afterRender() {
                    (this.#i = new X({ view: this, model: o })), await this.#i.loadStories();
                }
                showStories(e) {
                    (document.getElementById('stories-container').innerHTML = e
                        .map((e) => this.#i.template.createStoryListTemplate(e))
                        .join('')),
                        this.#i.initializeMap(e);
                }
            }
            class ee {
                constructor({ view: e, model: t }) {
                    (this.view = e), (this.model = t);
                }
                async createStory(e) {
                    try {
                        this.#a(e);
                        const t = await this.model.createStory(e);
                        t.error
                            ? this.view.showCreateFailed(t.message || 'Failed to create story')
                            : this.view.showCreateSuccess('Story added successfully!');
                    } catch (e) {
                        this.view.showCreateFailed(e.message || 'An unexpected error occurred'),
                            console.error('Error creating story:', e);
                    }
                }
                #a(e) {
                    const t = e.get('description');
                    if (!t || '' === t.trim()) throw new Error('Description is required');
                    const n = e.get('photo');
                    if (!n) throw new Error('Photo is required');
                    if (n.size > 1048576)
                        throw new Error('Photo size exceeds maximum limit of 1MB');
                    if (!['image/jpeg', 'image/png', 'image/gif', 'image/jpg'].includes(n.type))
                        throw new Error('Please select a valid image file (JPEG, PNG, or GIF)');
                    const i = e.get('lat'),
                        o = e.get('lon');
                    if ((i && !o) || (!i && o))
                        throw new Error('Both latitude and longitude must be provided');
                    if (i && o) {
                        const e = parseFloat(i),
                            t = parseFloat(o);
                        if (isNaN(e) || isNaN(t))
                            throw new Error('Location coordinates must be valid numbers');
                        if (e < -90 || e > 90)
                            throw new Error('Latitude must be between -90 and 90');
                        if (t < -180 || t > 180)
                            throw new Error('Longitude must be between -180 and 180');
                    }
                }
                getCurrentLocation() {
                    navigator.geolocation
                        ? navigator.geolocation.getCurrentPosition(
                              (e) => {
                                  const t = e.coords.latitude,
                                      n = e.coords.longitude;
                                  this.view.displayLocation(t, n);
                              },
                              (e) => {
                                  let t = 'Unable to retrieve your location';
                                  switch (e.code) {
                                      case e.PERMISSION_DENIED:
                                          t = 'You denied the request for geolocation';
                                          break;
                                      case e.POSITION_UNAVAILABLE:
                                          t = 'Location information is unavailable';
                                          break;
                                      case e.TIMEOUT:
                                          t = 'The request to get your location timed out';
                                  }
                                  this.view.showLocationError(t);
                              },
                              { enableHighAccuracy: !0, timeout: 5e3, maximumAge: 0 },
                          )
                        : this.view.showLocationError(
                              'Geolocation is not supported by your browser',
                          );
                }
                initInteractiveMap({
                    latInput: e,
                    lonInput: t,
                    useLocationBtn: n,
                    mapContainerId: i,
                }) {
                    const o = K(i);
                    let a = null;
                    const r = new L.Icon({
                        iconUrl:
                            'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
                        iconSize: [25, 41],
                        iconAnchor: [12, 41],
                        popupAnchor: [1, -34],
                        shadowSize: [41, 41],
                    });
                    o.on('click', (n) => {
                        const { lat: i, lng: s } = n.latlng;
                        (e.value = i.toFixed(6)),
                            (t.value = s.toFixed(6)),
                            a
                                ? a.setLatLng([i, s])
                                : (a = L.marker([i, s], { icon: r })
                                      .addTo(o)
                                      .bindPopup(`Coordinates:<br>Lat: ${i}<br>Lon: ${s}`)
                                      .openPopup());
                    }),
                        n.addEventListener('click', () => {
                            navigator.geolocation.getCurrentPosition(
                                ({ coords: n }) => {
                                    const { latitude: i, longitude: r } = n;
                                    (e.value = i.toFixed(6)),
                                        (t.value = r.toFixed(6)),
                                        o.setView([i, r], 13),
                                        a ? a.setLatLng([i, r]) : (a = L.marker([i, r]).addTo(o));
                                },
                                (e) => {
                                    alert('Gagal mendapatkan lokasi: ' + e.message);
                                },
                            );
                        });
                }
                renderMapStories(e) {
                    Q(mapInstance, e);
                }
            }
            class te {
                #r;
                #s = !1;
                #l = 640;
                #c = 0;
                #d;
                #u;
                #m;
                #h;
                static addNewStream(e) {
                    Array.isArray(window.currentStreams)
                        ? (window.currentStreams = [...window.currentStreams, e])
                        : (window.currentStreams = [e]);
                }
                static stopAllStreams() {
                    Array.isArray(window.currentStreams)
                        ? window.currentStreams.forEach((e) => {
                              e.active && e.getTracks().forEach((e) => e.stop());
                          })
                        : (window.currentStreams = []);
                }
                constructor({ video: e, cameraSelect: t, canvas: n, options: i = {} }) {
                    (this.#d = e), (this.#u = t), (this.#m = n), this.#p();
                }
                #p() {
                    (this.#d.oncanplay = () => {
                        this.#s ||
                            ((this.#c = (this.#d.videoHeight * this.#l) / this.#d.videoWidth),
                            this.#m.setAttribute('width', this.#l),
                            this.#m.setAttribute('height', this.#c),
                            (this.#s = !0));
                    }),
                        (this.#u.onchange = async () => {
                            await this.stop(), await this.launch();
                        });
                }
                async #g(e) {
                    try {
                        if (!(e instanceof MediaStream))
                            return Promise.reject(Error('MediaStream not found!'));
                        const { deviceId: t } = e.getVideoTracks()[0].getSettings(),
                            n = (await navigator.mediaDevices.enumerateDevices())
                                .filter((e) => 'videoinput' === e.kind)
                                .reduce(
                                    (e, n, i) =>
                                        e.concat(
                                            `\n<option\nvalue="${n.deviceId}"\n${t === n.deviceId ? 'selected' : ''}\n>\n${n.label || `Camera ${i + 1}`}\n</option>\n`,
                                        ),
                                    '',
                                );
                        this.#u.innerHTML = n;
                    } catch (e) {
                        console.error('#populateDeviceList: error:', e);
                    }
                }
                async #y() {
                    try {
                        const e = this.#s || this.#u.value ? { exact: this.#u.value } : void 0,
                            t = await navigator.mediaDevices.getUserMedia({
                                video: { aspectRatio: 4 / 3, deviceId: e },
                            });
                        return await this.#g(t), t;
                    } catch (e) {
                        return console.error('#getStream: error:', e), null;
                    }
                }
                async launch() {
                    (this.#r = await this.#y()),
                        te.addNewStream(this.#r),
                        (this.#d.srcObject = this.#r),
                        this.#d.play(),
                        this.#v();
                }
                stop() {
                    this.#d && ((this.#d.srcObject = null), (this.#s = !1)),
                        this.#r instanceof MediaStream &&
                            this.#r.getTracks().forEach((e) => {
                                e.stop();
                            }),
                        this.#v();
                }
                #v() {
                    const e = this.#m.getContext('2d');
                    (e.fillStyle = '#AAAAAA'), e.fillRect(0, 0, this.#m.width, this.#m.height);
                }
                async takePicture() {
                    if (!this.#l || !this.#c) return null;
                    const e = this.#m.getContext('2d');
                    return (
                        (this.#m.width = this.#l),
                        (this.#m.height = this.#c),
                        e.drawImage(this.#d, 0, 0, this.#l, this.#c),
                        await new Promise((e) => {
                            this.#m.toBlob((t) => e(t));
                        })
                    );
                }
                addCheeseButtonListener(e, t) {
                    (this.#h = document.querySelector(e)), (this.#h.onclick = t);
                }
            }
            class ne {
                #i = null;
                async render() {
                    return '\n            <section class="create-story-page">\n                <h2>Add New Story</h2>\n                <div class="story-form-container">\n                    <form id="create-story-form" class="create-story-form">\n                        <div class="input-group">\n                            <label for="description-input" class="form-label">Description</label>\n                            <textarea\n                                id="description-input"\n                                name="description"\n                                class="form-input"\n                                placeholder="Enter story description"\n                                rows="4"\n                                required\n                            ></textarea>\n                        </div>\n\n                        <div class="input-group">\n                            <label for="photo-input" class="form-label">Photo</label>\n                            <input\n                                type="file"\n                                id="photo-input"\n                                name="photo"\n                                class="form-input"\n                                accept="image/*"\n                                required\n                            />\n                            <small class="input-help">Maximum file size: 1MB</small>\n                        </div>\n\n                        <div class="input-group">\n                            <label class="form-label">Or Take a Photo</label>\n                            <div class="camera-container">\n                                <video id="video" autoplay playsinline style="max-width: 100%;"></video>\n                                <canvas id="canvas" style="display: none;"></canvas>\n                                <div>\n                                    <select id="cameraSelect"></select>\n                                    <button type="button" id="takePicture">📸 Ambil Gambar</button>\n                                </div>\n                            </div>\n                        </div>\n\n                        <div class="input-group">\n                            <label class="form-label">Location (Optional)</label>\n                            <div class="location-inputs">\n                                <div class="input-group">\n                                    <label for="lat-input" class="form-label">Latitude</label>\n                                    <input\n                                        type="number"\n                                        id="lat-input"\n                                        name="lat"\n                                        class="form-input"\n                                        placeholder="e.g. -6.2088"\n                                        step="any"\n                                    />\n                                </div>\n                                <div class="input-group">\n                                    <label for="lon-input" class="form-label">Longitude</label>\n                                    <input\n                                        type="number"\n                                        id="lon-input"\n                                        name="lon"\n                                        class="form-input"\n                                        placeholder="e.g. 106.8456"\n                                        step="any"\n                                    />\n                                </div>\n                            </div>\n\n                            <button type="button" id="use-current-location" class="btn-secondary">\n                                Use My Current Location\n                            </button>\n\n                            <div class="map-container-form" style="margin-top: 1rem;">\n                                <div id="map-on-form" style="height: 300px;"></div>\n                            </div>\n                        </div>\n\n                        <div class="form-actions">\n                            <div id="submit-button-container">\n                                <button type="submit" class="btn-primary">Add Story</button>\n                            </div>\n                        </div>\n                    </form>\n                </div>\n            </section>\n        ';
                }
                async afterRender() {
                    (this.#i = new ee({ view: this, model: o })), this.#o(), this.#w();
                    const e = new te({
                        video: document.getElementById('video'),
                        cameraSelect: document.getElementById('cameraSelect'),
                        canvas: document.getElementById('canvas'),
                    });
                    e.launch(),
                        e.addCheeseButtonListener('#takePicture', async () => {
                            const t = await e.takePicture();
                            if (!t) return void alert('Gagal mengambil gambar!');
                            const n = new File([t], 'photo.jpg', { type: 'image/jpeg' }),
                                i = new DataTransfer();
                            i.items.add(n),
                                (document.getElementById('photo-input').files = i.files);
                        });
                    const t = document.getElementById('lat-input'),
                        n = document.getElementById('lon-input'),
                        i = document.getElementById('use-current-location');
                    this.#i.initInteractiveMap({
                        latInput: t,
                        lonInput: n,
                        useLocationBtn: i,
                        mapContainerId: 'map-on-form',
                    });
                }
                #o() {
                    document
                        .getElementById('create-story-form')
                        .addEventListener('submit', async (e) => {
                            e.preventDefault();
                            const t = new FormData();
                            t.append(
                                'description',
                                document.getElementById('description-input').value,
                            );
                            const n = document.getElementById('photo-input');
                            n.files && n.files[0] && t.append('photo', n.files[0]);
                            const i = document.getElementById('lat-input').value,
                                o = document.getElementById('lon-input').value;
                            i && o && (t.append('lat', i), t.append('lon', o)),
                                this.showSubmitLoadingButton(),
                                await this.#i.createStory(t);
                        });
                }
                #w() {
                    document
                        .getElementById('use-current-location')
                        .addEventListener('click', () => {
                            this.#i.getCurrentLocation();
                        });
                }
                showCreateSuccess(e) {
                    alert(e), (location.hash = '/');
                }
                showCreateFailed(e) {
                    alert(e), this.hideSubmitLoadingButton();
                }
                showSubmitLoadingButton() {
                    document.getElementById('submit-button-container').innerHTML =
                        '\n            <button type="submit" class="btn-primary btn-loading" disabled>\n                <span class="spinner"></span>\n                Submitting...\n            </button>\n        ';
                }
                hideSubmitLoadingButton() {
                    document.getElementById('submit-button-container').innerHTML =
                        '\n            <button type="submit" class="btn-primary">Add Story</button>\n        ';
                }
                displayLocation(e, t) {
                    (document.getElementById('lat-input').value = e),
                        (document.getElementById('lon-input').value = t);
                }
                showLocationError(e) {
                    alert(e);
                }
            }
            const ie = {
                '/signup': () => h(new z()),
                '/signin': () => h(new U()),
                '/': () => p(new Z()),
                '/create-story': () => p(new ne()),
            };
            class oe {
                constructor({
                    mainContainer: e,
                    menuToggle: t,
                    sideNavigation: n,
                    accessibilitySkipLink: i,
                    footer: o,
                }) {
                    (this.mainContainer = e),
                        (this.menuToggle = t),
                        (this.sideNavigation = n),
                        (this.accessibilitySkipLink = i),
                        (this.footer = o),
                        this.initialize();
                }
                initialize() {
                    var e, t;
                    (e = this.accessibilitySkipLink),
                        (t = this.mainContainer),
                        e.addEventListener('click', () => t.focus()),
                        this.initializeNavigation(),
                        window.addEventListener('hashchange', () => this.loadPage()),
                        window.addEventListener('DOMContentLoaded', () => this.loadPage());
                }
                initializeNavigation() {
                    this.menuToggle.addEventListener('click', () => {
                        this.sideNavigation.classList.toggle('menu-visible'),
                            this.updateLayoutForNavigation();
                    }),
                        document.addEventListener('click', (e) => {
                            const t = !this.sideNavigation.contains(e.target),
                                n = !this.menuToggle.contains(e.target);
                            t &&
                                n &&
                                (this.sideNavigation.classList.remove('menu-visible'),
                                this.updateLayoutForNavigation());
                            const i = e.target.closest('a[href^="#"]');
                            i &&
                                this.sideNavigation.contains(i) &&
                                (this.sideNavigation.classList.remove('menu-visible'),
                                this.updateLayoutForNavigation());
                        });
                }
                updateLayoutForNavigation() {
                    const e = this.sideNavigation.classList.contains('menu-visible');
                    window.innerWidth <= 768 &&
                        (e
                            ? ((this.mainContainer.style.marginLeft = '250px'),
                              this.footer && (this.footer.style.marginLeft = '250px'))
                            : ((this.mainContainer.style.marginLeft = '0'),
                              this.footer && (this.footer.style.marginLeft = '0')));
                }
                updateNavigationMenu() {
                    const e = !!c(),
                        t = a(),
                        n = '/signin' === t || '/signup' === t,
                        i = this.sideNavigation.querySelector('.primary-nav'),
                        o = this.sideNavigation.querySelector('.secondary-nav');
                    if (!e && n)
                        return (
                            (this.menuToggle.style.display = 'none'),
                            (this.sideNavigation.style.display = 'none'),
                            (this.mainContainer.style.marginLeft = '0'),
                            (this.mainContainer.style.width = '100%'),
                            this.footer &&
                                ((this.footer.style.marginLeft = '0'),
                                (this.footer.style.width = '100%')),
                            (i.innerHTML = ''),
                            void (o.innerHTML = '')
                        );
                    if (
                        ((this.menuToggle.style.display = ''),
                        (this.sideNavigation.style.display = ''),
                        (this.mainContainer.style.marginLeft = ''),
                        (this.mainContainer.style.width = ''),
                        (this.mainContainer.style.display = 'block'),
                        (this.mainContainer.style.padding = ''),
                        (this.mainContainer.style.minHeight = ''),
                        (this.mainContainer.style.alignItems = ''),
                        this.footer &&
                            ((this.footer.style.marginLeft = ''), (this.footer.style.width = '')),
                        e)
                    ) {
                        (i.innerHTML =
                            '\n    <a href="#/" class="nav-item">\n      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>\n        <polyline points="9 22 9 12 15 12 15 22"></polyline>\n      </svg>\n      Home\n    </a>\n    <a href="#/" class="nav-item">\n      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n        <circle cx="11" cy="11" r="8"></circle>\n        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>\n      </svg>\n      Explore Stories\n    </a>\n    <a href="#/create-story" class="nav-item">\n      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>\n        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>\n      </svg>\n      Write New Story\n    </a>\n    <a href="#/" class="nav-item">\n      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>\n        <polyline points="14 2 14 8 20 8"></polyline>\n        <line x1="16" y1="13" x2="8" y2="13"></line>\n        <line x1="16" y1="17" x2="8" y2="17"></line>\n        <polyline points="10 9 9 9 8 9"></polyline>\n      </svg>\n      My Stories\n    </a>\n  '),
                            (o.innerHTML =
                                '\n    <a href="#/" class="nav-item">\n      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>\n        <circle cx="12" cy="7" r="4"></circle>\n      </svg>\n      My Profile\n    </a>\n    <a href="#/" class="nav-item">\n      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n        <circle cx="12" cy="12" r="3"></circle>\n        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>\n      </svg>\n      Settings\n    </a>\n    <button id="logout-btn" class="nav-item">\n      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>\n        <polyline points="16 17 21 12 16 7"></polyline>\n        <line x1="21" y1="12" x2="9" y2="12"></line>\n      </svg>\n      Sign Out\n    </button>\n  ');
                        const e = document.getElementById('logout-btn');
                        e &&
                            e.addEventListener('click', (e) => {
                                e.preventDefault(),
                                    window.confirm(
                                        'Are you sure you want to sign out from Distory?',
                                    ) && (g(), (window.location.hash = '/signin'));
                            });
                    } else
                        (i.innerHTML = ''),
                            (o.innerHTML =
                                '\n    <a href="#/signin" class="nav-item">\n      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>\n        <polyline points="10 17 15 12 10 7"></polyline>\n        <line x1="15" y1="12" x2="3" y2="12"></line>\n      </svg>\n      Sign In\n    </a>\n    <a href="#/signup" class="nav-item">\n      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>\n        <circle cx="8.5" cy="7" r="4"></circle>\n        <line x1="20" y1="8" x2="20" y2="14"></line>\n        <line x1="23" y1="11" x2="17" y2="11"></line>\n      </svg>\n      Create Account\n    </a>\n  ');
                }
                async loadPage() {
                    te.stopAllStreams();
                    const e = a(),
                        t = (0, ie[e])(),
                        n = await t.render();
                    if (document.startViewTransition)
                        document
                            .startViewTransition(async () => {
                                (this.mainContainer.innerHTML = n),
                                    this.updateNavigationMenu(),
                                    'function' == typeof t.afterRender && (await t.afterRender());
                            })
                            .finished.then(() => {
                                window.scrollTo({ top: 0, behavior: 'instant' }),
                                    this.updatePageTitle(e);
                                const t = '/signin' === e || '/signup' === e;
                                !c() && t && this.centerAuthForm();
                                const n = document.querySelector('h1, h2')?.textContent || e;
                                this.announcePageChange(n);
                            })
                            .catch(console.error);
                    else {
                        (this.mainContainer.innerHTML = n),
                            this.updateNavigationMenu(),
                            'function' == typeof t.afterRender && (await t.afterRender()),
                            window.scrollTo({ top: 0, behavior: 'instant' }),
                            this.updatePageTitle(e);
                        const i = '/signin' === e || '/signup' === e;
                        !c() && i && this.centerAuthForm();
                        const o = document.querySelector('h1, h2')?.textContent || e;
                        this.announcePageChange(o);
                    }
                }
                centerAuthForm() {
                    const e =
                        this.mainContainer.querySelector('form') ||
                        this.mainContainer.querySelector('.auth-container') ||
                        this.mainContainer.querySelector('.form-container');
                    e &&
                        ((this.mainContainer.style.display = 'flex'),
                        (this.mainContainer.style.justifyContent = 'center'),
                        (this.mainContainer.style.alignItems = 'center'),
                        (this.mainContainer.style.minHeight = '100vh'),
                        (this.mainContainer.style.padding = '0 20px'),
                        (e.style.maxWidth = '450px'),
                        (e.style.width = '100%'),
                        this.footer && (this.footer.style.display = 'none'));
                }
                updatePageTitle(e) {
                    let t;
                    switch (e) {
                        case '/':
                            t = 'Distory - Share Your Stories';
                            break;
                        case '/signin':
                            t = 'Sign In | Distory';
                            break;
                        case '/signup':
                            t = 'Join Distory | Create Account';
                            break;
                        case '/create-story':
                            t = 'Write New Story | Distory';
                            break;
                        case '/my-stories':
                            t = 'My Stories | Distory';
                            break;
                        case '/profile':
                            t = 'My Profile | Distory';
                            break;
                        default:
                            t = e.startsWith('/story/') ? 'Reading Story | Distory' : 'Distory';
                    }
                    document.title = t;
                }
                announcePageChange(e) {
                    const t = document.createElement('div');
                    t.setAttribute('aria-live', 'polite'),
                        t.setAttribute('role', 'status'),
                        t.classList.add('sr-only'),
                        (t.textContent = `Navigated to ${e} page`),
                        document.body.appendChild(t),
                        setTimeout(() => {
                            document.body.removeChild(t);
                        }, 3e3);
                }
                showErrorMessage(e) {
                    const t = document.createElement('div');
                    t.classList.add('error-notification'),
                        (t.textContent = e),
                        this.mainContainer.prepend(t),
                        setTimeout(() => {
                            t.remove();
                        }, 5e3);
                }
            }
            document.addEventListener('DOMContentLoaded', async () => {
                console.log('Distory application initializing...');
                const e = new oe({
                    mainContainer: document.getElementById('main-content'),
                    menuToggle: document.getElementById('menu-toggle'),
                    sideNavigation: document.getElementById('side-navigation'),
                    accessibilitySkipLink: document.querySelector('.skip-link'),
                    footer: document.querySelector('footer'),
                });
                await e.loadPage(),
                    await (async () => {
                        if ('serviceWorker' in navigator)
                            try {
                                const e = await navigator.serviceWorker.register('/sw.js');
                                console.log('Service worker registered successfully:', e),
                                    e.addEventListener('updatefound', () => {
                                        const t = e.installing;
                                        console.log('Service worker update found!'),
                                            t.addEventListener('statechange', () => {
                                                'installed' === t.state &&
                                                    navigator.serviceWorker.controller &&
                                                    (console.log(
                                                        'New service worker installed, but waiting.',
                                                    ),
                                                    confirm('New version available! Update now?') &&
                                                        (t.postMessage({ type: 'SKIP_WAITING' }),
                                                        window.location.reload()));
                                            });
                                    });
                                let t = !1;
                                return (
                                    navigator.serviceWorker.addEventListener(
                                        'controllerchange',
                                        () => {
                                            t || ((t = !0), window.location.reload());
                                        },
                                    ),
                                    e
                                );
                            } catch (e) {
                                console.error('Service worker registration failed:', e);
                            }
                        else console.log('Service workers are not supported in this browser.');
                    })(),
                    window.addEventListener('hashchange', async () => {
                        await e.loadPage();
                    });
            });
        },
    },
    (e) => {
        e.O(0, [96], () => e((e.s = 964))), e.O();
    },
]);
