// =============================================
// 🔒 نظام حماية متقدم - منصة الإيضاح (النسخة النهائية)
// =============================================
(function() {
    'use strict';

    // =============================================
    // 🛡️ نظام حماية Console المتقدم
    // =============================================
    const _0xDevMode = {
        active: false,
        secretKey: 'ALIDAH_DEV_2026', // مفتاح سري للمطور
        checkInterval: null,
        
        // تفعيل وضع المطور
        activate: function() {
            this.active = true;
            if (this.checkInterval) {
                clearInterval(this.checkInterval);
                this.checkInterval = null;
            }
        },
        
        // حماية Console
        protect: function() {
            const self = this;
            
            // منع F12 واختصارات DevTools
            document.addEventListener('keydown', function(e) {
                if (self.active) return;
                
                if (e.key === 'F12' || 
                    (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) ||
                    (e.ctrlKey && (e.key === 'U' || e.key === 'u')) ||
                    (e.ctrlKey && e.shiftKey && (e.key === 'K' || e.key === 'k'))) {
                    e.preventDefault();
                    self._showWarning();
                    return false;
                }
            });
            
            // منع النقر بالزر الأيمن
            document.addEventListener('contextmenu', function(e) {
                if (self.active) return;
                e.preventDefault();
                self._showWarning();
                return false;
            });
            
            // كشف DevTools بطريقة الـ debugger
            self.checkInterval = setInterval(function() {
                if (self.active) return;
                
                const start = performance.now();
                debugger;
                const end = performance.now();
                
                if (end - start > 100) {
                    self._blockSite();
                }
            }, 1000);
            
            // كشف DevTools بطريقة console.log
            const devtools = { open: false };
            const element = new Image();
            Object.defineProperty(element, 'id', {
                get: function() {
                    if (!self.active) {
                        self._blockSite();
                    }
                }
            });
            
            setInterval(function() {
                if (!self.active) {
                    console.log('%c', element);
                }
            }, 500);
        },
        
        // رسالة تحذير
        _showWarning: function() {
            alert('⛔ عذراً، هذه الميزة معطلة لأسباب أمنية');
        },
        
        // حجب الموقع
        _blockSite: function() {
            document.body.innerHTML = `
                <div style="position:fixed;top:0;left:0;right:0;bottom:0;background:#0a0e14;display:flex;align-items:center;justify-content:center;flex-direction:column;z-index:999999;">
                    <h1 style="color:#ef4444;font-size:48px;font-family:'Tajawal',sans-serif;margin-bottom:20px;">⛔ تم اكتشاف محاولة اختراق</h1>
                    <p style="color:#8b95a5;font-size:24px;font-family:'Tajawal',sans-serif;">عذراً، لا يمكنك الوصول إلى هذا المحتوى</p>
                </div>
            `;
            throw new Error('Security violation');
        }
    };

    // تفعيل الحماية
    _0xDevMode.protect();

    // =============================================
    // 🔐 إعدادات Firebase
    // =============================================
    const firebaseConfig = {
        apiKey: "AIzaSyCTZCt9aKNXPvOdx9g3p7RH4",
        authDomain: "alidah-99472.firebaseapp.com",
        projectId: "alidah-99472",
        storageBucket: "alidah-99472.firebasestorage.app",
        messagingSenderId: "696531426179",
        appId: "1:696531426179:web:7b2176188682adace2b4b6",
        measurementId: "G-HLC65V979V"
    };

    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();
    const contentRef = db.collection("platform").doc("data");

    
    const _0xSec = {
        s1: [0x4b, 0x7e, 0x2a, 0x9f, 0x3c, 0x1d, 0x8b, 0x5e],
        s2: [0x6f, 0x3a, 0xc2, 0x4d, 0x9e, 0x7b, 0x1f, 0x5c],
        
        
        // الأولى: 
        // الثانية: 
        h1: "b310c94ebd4a386786bd0b36c2a0249966b275f5c2ee053b09f298029cbc137d",
        h2: "242bddda8a716b517444fd2f89d025663fe44a3e9344de89a1f4e723303fda68",
        
        iter: 100000
    };

    // =============================================
    // =============================================
    async function _0xHash(password, saltArray) {
        const encoder = new TextEncoder();
        const passwordBuffer = encoder.encode(password);
        const saltBuffer = new Uint8Array(saltArray);
        
        const keyMaterial = await crypto.subtle.importKey(
            'raw', passwordBuffer, 'PBKDF2', false, ['deriveBits']
        );
        
        const derivedBits = await crypto.subtle.deriveBits(
            { name: 'PBKDF2', salt: saltBuffer, iterations: _0xSec.iter, hash: 'SHA-256' },
            keyMaterial, 256
        );
        
        return Array.from(new Uint8Array(derivedBits))
            .map(b => b.toString(16).padStart(2, '0')).join('');
    }

    async function _0xCheck1(password) {
        try {
            return await _0xHash(password, _0xSec.s1) === _0xSec.h1;
        } catch { return false; }
    }

    async function _0xCheck2(password) {
        try {
            return await _0xHash(password, _0xSec.s2) === _0xSec.h2;
        } catch { return false; }
    }

    // =============================================
    // 🛡️ حماية XSS
    // =============================================
    function _0xSanitize(input) {
        if (typeof input !== 'string') return '';
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    }

    function _0xValidateURL(url) {
        if (typeof url !== 'string') return false;
        const allowedDomains = ['youtube.com', 'youtu.be', 'www.youtube.com', 'docs.google.com', 'drive.google.com', 'pdf', '.pdf'];
        try {
            if (!url.match(/^https?:\/\//i)) return false;
            return allowedDomains.some(domain => url.toLowerCase().includes(domain));
        } catch { return false; }
    }

    // =============================================
    // 📊 المتغيرات
    // =============================================
    let _0xData = {};
    let _0xView = 'home';
    let _0xGrade = null;
    let _0xSubject = null;
    let _0xLoggedIn = false;
    let _0xStep = 1;
    let _0xAttempts = 0;
    const _0xMaxAttempts = 5;
    let _0xLocked = false;
    let _0xLockTime = 0;

    // =============================================
    // 📚 الصفوف والمواد
    // =============================================
    const _0xGrades = [
        "الصف الأول الإعدادي", "الصف الثاني الإعدادي", "الصف الثالث الإعدادي",
        "الصف الأول الثانوي", "الصف الثاني الثانوي", "الصف الثالث الثانوي"
    ];

    const _0xSubjects = {
        "الصف الأول الإعدادي": ["الفقه", "التوحيد", "التفسير", "الحديث", "السيرة"],
        "الصف الثاني الإعدادي": ["الفقه", "التوحيد", "التفسير", "الحديث", "السيرة"],
        "الصف الثالث الإعدادي": ["الفقه", "التوحيد", "التفسير", "الحديث", "السيرة", "علم الميراث"],
        "الصف الأول الثانوي": ["الفقه", "التوحيد", "التفسير", "الحديث"],
        "الصف الثاني الثانوي": ["الفقه", "التوحيد", "التفسير", "الحديث"],
        "الصف الثالث الثانوي": ["الفقه", "التوحيد", "التفسير", "الحديث", "علم الميراث"]
    };

    // =============================================
    // 🎨 الأيقونات
    // =============================================
    const _0xIcons = {
        book: '<svg viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
        video: '<svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>',
        play: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>',
        quiz: '<svg viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
        arrow: '<svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>',
        home: '<svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
        graduate: '<svg viewBox="0 0 24 24"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>',
        tafseer: '<svg viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/></svg>',
        external: '<svg viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>'
    };

    // =============================================
    // 🔧 العناصر
    // =============================================
    const $ = id => document.getElementById(id);
    const _0xE = {
        main: $('main-content'), breadcrumb: $('breadcrumb'), loading: $('loading-screen'),
        scrollTop: $('scroll-top'), particles: $('particles'), loginModal: $('login-modal'),
        adminModal: $('admin-modal'), pwd1: $('password1-input'), pwd2: $('password2-input'),
        err1: $('login-error-1'), err2: $('login-error-2'), adminBtn: $('admin-header-btn'),
        loginClose: $('login-close'), adminClose: $('admin-close'), nextBtn: $('next-btn'),
        loginBtn: $('login-btn'), saveBtn: $('save-btn'), gradeSel: $('grade-select'),
        subjectSel: $('subject-select'), typeSel: $('type-select'), linkIn: $('link-input'),
        success: $('admin-success'), links: $('current-links'), step1: $('step-1'),
        step2: $('step-2'), dot1: $('step-dot-1'), dot2: $('step-dot-2')
    };

    // =============================================
    // 📥 تحميل وحفظ البيانات
    // =============================================
    async function _0xLoadData() {
        try {
            const doc = await contentRef.get();
            if (doc.exists && doc.data().content) {
                _0xData = doc.data().content;
            }
            _0xGrades.forEach(g => {
                if (!_0xData[g]) _0xData[g] = {};
                _0xSubjects[g].forEach(s => { if (!_0xData[g][s]) _0xData[g][s] = {}; });
            });
        } catch {
            _0xGrades.forEach(g => {
                _0xData[g] = {};
                _0xSubjects[g].forEach(s => { _0xData[g][s] = {}; });
            });
        }
    }

    async function _0xSaveData() {
        try { await contentRef.set({ content: _0xData }); return true; }
        catch { return false; }
    }

    // =============================================
    // ✨ الجزيئات
    // =============================================
    function _0xParticles() {
        const colors = ['#d4a843', '#e8c56b', '#22c997', '#e879a9', '#a78bfa', '#f59e0b'];
        for (let i = 0; i < 35; i++) {
            const p = document.createElement('div');
            p.className = 'particle';
            p.style.cssText = `width:${Math.random()*4+2}px;height:${Math.random()*4+2}px;left:${Math.random()*100}%;background:${colors[Math.floor(Math.random()*colors.length)]};animation-delay:${Math.random()*10}s;animation-duration:${Math.random()*5+7}s`;
            _0xE.particles.appendChild(p);
        }
    }

    // =============================================
    // 🏠 عرض الصفحات
    // =============================================
    function _0xRenderHome() {
        _0xView = 'home'; _0xGrade = null; _0xSubject = null; _0xUpdateBreadcrumb();
        const info = { "الصف الأول الإعدادي": ["إعدادي",1], "الصف الثاني الإعدادي": ["إعدادي",2], "الصف الثالث الإعدادي": ["إعدادي",3], "الصف الأول الثانوي": ["ثانوي",1], "الصف الثاني الثانوي": ["ثانوي",2], "الصف الثالث الثانوي": ["ثانوي",3] };
        
        let html = '<div class="section-header"><h2 class="section-title"><span>اختر الصف الدراسي</span></h2><p class="section-subtitle">اختر الصف الدراسي للوصول إلى المواد والكتب والفيديوهات والاختبارات</p></div><div class="grades-grid">';
        
        _0xGrades.forEach(g => {
            let cnt = 0;
            _0xSubjects[g].forEach(s => { if(_0xData[g] && _0xData[g][s]) { if(_0xData[g][s].book) cnt++; if(_0xData[g][s].video) cnt++; if(_0xData[g][s].quiz) cnt++; }});
            html += `<div class="grade-card" data-grade="${g}"><div class="grade-card-header"><div class="grade-icon">${_0xIcons.graduate}<span class="grade-icon-badge">${info[g][1]}</span></div><div class="grade-info"><h3>${g}</h3><p>المرحلة ${info[g][0]}</p></div></div><div class="grade-card-body"><div class="grade-stats"><div class="stat-item"><div class="stat-value">${_0xSubjects[g].length}</div><div class="stat-label">مواد دراسية</div></div><div class="stat-item"><div class="stat-value">${cnt}</div><div class="stat-label">محتوى</div></div></div></div><div class="grade-card-footer"><div class="subjects-preview">${_0xSubjects[g].slice(0,3).map(s=>`<span class="subject-tag">${s}</span>`).join('')}</div><div class="grade-arrow">${_0xIcons.arrow}</div></div></div>`;
        });
        html += '</div>';
        _0xE.main.innerHTML = html;
        document.querySelectorAll('.grade-card').forEach(c => c.onclick = () => _0xSelectGrade(c.dataset.grade));
    }

    function _0xSelectGrade(g) {
        _0xGrade = g; _0xView = 'subjects'; _0xUpdateBreadcrumb();
        let html = `<div class="section-header"><h2 class="section-title"><span>${g}</span></h2><p class="section-subtitle">اختر المادة الدراسية</p></div><div class="subjects-grid">`;
        _0xSubjects[g].forEach(s => {
            const c = _0xData[g] ? _0xData[g][s] : {};
            const has = c && (c.book || c.video || c.quiz);
            let txt = []; if(c && c.book) txt.push('كتاب'); if(c && c.video) txt.push('فيديو'); if(c && c.quiz) txt.push('اختبار');
            const cls = s === "علم الميراث" ? 'special' : s === "السيرة" ? 'seerah' : '';
            html += `<div class="subject-card ${cls}" data-subject="${s}"><div class="subject-card-content"><div class="subject-icon">${_0xIcons.tafseer}</div><div class="subject-info"><h4>${s}${c && c.quiz ? `<span class="quiz-badge">${_0xIcons.quiz}اختبار</span>` : ''}</h4><p>${txt.length ? txt.join(' + ') : 'لم يتم إضافة محتوى'}</p></div><div class="subject-arrow">${_0xIcons.arrow}</div></div></div>`;
        });
        html += '</div>';
        _0xE.main.innerHTML = html;
        document.querySelectorAll('.subject-card').forEach(c => c.onclick = () => {
            const sub = c.dataset.subject, cont = _0xData[_0xGrade] ? _0xData[_0xGrade][sub] : {};
            if(cont && (cont.book || cont.video || cont.quiz)) _0xSelectSubject(sub);
        });
    }

    function _0xSelectSubject(s) {
        _0xSubject = s; _0xView = 'content'; const c = _0xData[_0xGrade] ? _0xData[_0xGrade][s] : {}; _0xUpdateBreadcrumb();
        let html = `<div class="content-panel"><div class="content-panel-header"><h2 class="content-panel-title">${_0xIcons.tafseer}${s} - ${_0xGrade}</h2></div><div class="content-panel-body">`;
        if(c && c.book && _0xValidateURL(c.book)) html += `<div class="action-card book"><div class="action-icon">${_0xIcons.book}</div><h3 class="action-title">كتاب ${s}</h3><p class="action-desc">اطلع على كتاب المادة كاملاً بصيغة PDF</p><button class="action-btn" data-action="book">${_0xIcons.external}قراءة الكتاب</button></div>`;
        if(c && c.video && _0xValidateURL(c.video)) html += `<div class="action-card video"><div class="action-icon">${_0xIcons.play}</div><h3 class="action-title">شرح ${s}</h3><p class="action-desc">شاهد شرح المادة بالفيديو</p><button class="action-btn" data-action="video">${_0xIcons.external}مشاهدة الشرح</button></div>`;
        if(c && c.quiz && _0xValidateURL(c.quiz)) html += `<div class="action-card quiz"><div class="action-icon">${_0xIcons.quiz}</div><h3 class="action-title">اختبار ${s}</h3><p class="action-desc">اختبر معلوماتك</p><button class="action-btn" data-action="quiz">${_0xIcons.external}ابدأ الاختبار</button></div>`;
        if(!c || (!c.book && !c.video && !c.quiz)) html += `<div class="status-message"><h3>لم يتم إضافة محتوى بعد</h3><p>سيتم إضافة المحتوى قريباً إن شاء الله</p></div>`;
        html += '</div></div>';
        _0xE.main.innerHTML = html;
        document.querySelectorAll('.action-btn').forEach(b => b.onclick = () => {
            const a = b.dataset.action;
            if(c && c[a] && _0xValidateURL(c[a])) window.open(c[a], '_blank', 'noopener,noreferrer');
        });
    }

    function _0xUpdateBreadcrumb() {
        let items = [`<button class="breadcrumb-item ${_0xView==='home'?'active':''}" id="bc-home">${_0xIcons.home}الرئيسية</button>`];
        if(_0xGrade) items.push(`<span class="breadcrumb-arrow">${_0xIcons.arrow}</span><button class="breadcrumb-item ${_0xView==='subjects'?'active':''}" id="bc-grade">${_0xGrade}</button>`);
        if(_0xSubject) items.push(`<span class="breadcrumb-arrow">${_0xIcons.arrow}</span><button class="breadcrumb-item active">${_0xSubject}</button>`);
        _0xE.breadcrumb.innerHTML = items.join('');
        if($('bc-home')) $('bc-home').onclick = _0xRenderHome;
        if($('bc-grade')) $('bc-grade').onclick = () => _0xSelectGrade(_0xGrade);
    }

    function _0xRenderLinks() {
        let html = '', has = false;
        _0xGrades.forEach(g => _0xSubjects[g].forEach(s => {
            const c = _0xData[g] ? _0xData[g][s] : {};
            if(c && (c.book || c.video || c.quiz)) { has = true; ['book','video','quiz'].forEach(t => {
                if(c[t]) { const l = t==='book'?'كتاب':t==='video'?'فيديو':'اختبار';
                html += `<div class="link-item"><div class="link-info"><div class="link-subject">${g} - ${s} (${l})</div><div class="link-url">${_0xSanitize(c[t].substring(0,50))}...</div></div><button class="link-delete" data-grade="${g}" data-subject="${s}" data-type="${t}"><svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button></div>`;
                }});
            }
        }));
        if(!has) html = '<div class="no-links">لا يوجد محتوى حالياً</div>';
        _0xE.links.innerHTML = html;
        document.querySelectorAll('.link-delete').forEach(b => b.onclick = async () => {
            if(_0xData[b.dataset.grade] && _0xData[b.dataset.grade][b.dataset.subject]) {
                delete _0xData[b.dataset.grade][b.dataset.subject][b.dataset.type];
                await _0xSaveData(); _0xRenderLinks();
            }
        });
    }

    // =============================================
    // 🔐 تسجيل الدخول
    // =============================================
    function _0xResetSteps() {
        _0xStep = 1; _0xE.pwd1.value = ''; _0xE.pwd2.value = '';
        _0xE.err1.classList.remove('show'); _0xE.err2.classList.remove('show');
        _0xE.step1.classList.add('active'); _0xE.step2.classList.remove('active');
        _0xE.dot1.classList.add('active'); _0xE.dot1.classList.remove('completed'); _0xE.dot2.classList.remove('active');
    }

    function _0xCheckLock() {
        if(_0xLocked) {
            const rem = Math.ceil((300000 - (Date.now() - _0xLockTime)) / 1000);
            if(rem > 0) return { locked: true, remaining: rem };
            _0xLocked = false; _0xAttempts = 0;
        }
        return { locked: false };
    }

    async function _0xGoToStep2() {
        const lock = _0xCheckLock();
        if(lock.locked) { _0xE.err1.textContent = `تم قفل النظام. انتظر ${lock.remaining} ثانية`; _0xE.err1.classList.add('show'); return; }
        const pwd = _0xE.pwd1.value;
        if(!pwd) { _0xE.err1.textContent = 'الرجاء إدخال كلمة المرور الأولى'; _0xE.err1.classList.add('show'); return; }
        
        // 🔓 تفعيل وضع المطور إذا أدخل المفتاح السري
        if(pwd === _0xDevMode.secretKey) {
            _0xDevMode.activate();
            _0xE.err1.textContent = '✅ تم تفعيل وضع المطور - يمكنك الآن فتح الـ Console';
            _0xE.err1.style.color = '#22c55e';
            _0xE.err1.classList.add('show');
            setTimeout(() => { _0xE.err1.classList.remove('show'); _0xE.err1.style.color = ''; }, 3000);
            return;
        }
        
        if(!await _0xCheck1(pwd)) {
            _0xAttempts++;
            _0xE.err1.textContent = `كلمة المرور الأولى غير صحيحة (${_0xAttempts}/${_0xMaxAttempts})`;
            _0xE.err1.classList.add('show'); _0xE.pwd1.value = ''; _0xE.pwd1.focus();
            if(_0xAttempts >= _0xMaxAttempts) { _0xLocked = true; _0xLockTime = Date.now(); _0xE.err1.textContent = 'تم قفل النظام لمدة 5 دقائق'; }
            return;
        }
        _0xStep = 2; _0xE.err1.classList.remove('show');
        _0xE.step1.classList.remove('active'); _0xE.step2.classList.add('active');
        _0xE.dot1.classList.remove('active'); _0xE.dot1.classList.add('completed'); _0xE.dot2.classList.add('active');
        _0xE.pwd2.focus();
    }

    async function _0xDoLogin() {
        const lock = _0xCheckLock();
        if(lock.locked) { _0xE.err2.textContent = `تم قفل النظام. انتظر ${lock.remaining} ثانية`; _0xE.err2.classList.add('show'); return; }
        const pwd = _0xE.pwd2.value;
        if(!pwd) { _0xE.err2.textContent = 'الرجاء إدخال كلمة المرور الثانية'; _0xE.err2.classList.add('show'); return; }
        if(!await _0xCheck2(pwd)) {
            _0xAttempts++;
            _0xE.err2.textContent = `كلمة المرور الثانية غير صحيحة (${_0xAttempts}/${_0xMaxAttempts})`;
            _0xE.err2.classList.add('show'); _0xE.pwd2.value = ''; _0xE.pwd2.focus();
            if(_0xAttempts >= _0xMaxAttempts) { _0xLocked = true; _0xLockTime = Date.now(); _0xE.err2.textContent = 'تم قفل النظام لمدة 5 دقائق'; }
            return;
        }
        _0xLoggedIn = true; _0xAttempts = 0;
        _0xE.loginModal.classList.remove('active'); _0xE.adminModal.classList.add('active');
        _0xResetSteps(); _0xRenderLinks();
    }

    // =============================================
    // 📝 أحداث لوحة الإدارة
    // =============================================
    _0xE.gradeSel.onchange = function() {
        let opts = '<option value="">-- اختر المادة --</option>';
        if(this.value && _0xSubjects[this.value]) _0xSubjects[this.value].forEach(s => opts += `<option value="${s}">${s}</option>`);
        _0xE.subjectSel.innerHTML = opts;
    };
    
    _0xE.adminBtn.onclick = () => {
        if(_0xLoggedIn) { _0xE.adminModal.classList.add('active'); _0xRenderLinks(); }
        else { _0xE.loginModal.classList.add('active'); _0xE.pwd1.focus(); _0xResetSteps(); }
    };
    _0xE.loginClose.onclick = () => { _0xE.loginModal.classList.remove('active'); _0xResetSteps(); };
    _0xE.adminClose.onclick = () => _0xE.adminModal.classList.remove('active');
    _0xE.nextBtn.onclick = e => { e.preventDefault(); _0xGoToStep2(); };
    _0xE.loginBtn.onclick = e => { e.preventDefault(); _0xDoLogin(); };
    _0xE.pwd1.onkeypress = e => { if(e.key==='Enter') { e.preventDefault(); _0xGoToStep2(); } };
    _0xE.pwd2.onkeypress = e => { if(e.key==='Enter') { e.preventDefault(); _0xDoLogin(); } };
    
    _0xE.saveBtn.onclick = async () => {
        const grade = _0xE.gradeSel.value, subject = _0xE.subjectSel.value, type = _0xE.typeSel.value, link = _0xE.linkIn.value.trim();
        if(!grade || !subject || !type || !link) { alert('الرجاء ملء جميع الحقول'); return; }
        if(!_0xValidateURL(link)) { alert('الرابط غير صالح'); return; }
        if(!_0xData[grade]) _0xData[grade] = {};
        if(!_0xData[grade][subject]) _0xData[grade][subject] = {};
        _0xData[grade][subject][type] = link;
        if(await _0xSaveData()) {
            _0xE.success.classList.add('show');
            setTimeout(() => _0xE.success.classList.remove('show'), 3000);
            _0xE.gradeSel.value = ''; _0xE.subjectSel.innerHTML = '<option value="">-- اختر المادة --</option>';
            _0xE.typeSel.value = ''; _0xE.linkIn.value = ''; _0xRenderLinks();
        } else alert('حدث خطأ في حفظ البيانات');
    };

    // =============================================
    // 🚀 تهيئة التطبيق
    // =============================================
    async function _0xInit() {
        _0xParticles(); await _0xLoadData(); _0xRenderHome();
        setTimeout(() => _0xE.loading.classList.add('hidden'), 800);
        window.onscroll = () => { if(window.scrollY > 300) _0xE.scrollTop.classList.add('visible'); else _0xE.scrollTop.classList.remove('visible'); };
        _0xE.scrollTop.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', _0xInit);
    else _0xInit();

})();