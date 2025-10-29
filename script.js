class MaxMessenger {
    constructor() {
        this.supabase = null;
        this.currentUser = null;
        this.servers = [];
        this.friends = [];
        this.friendRequests = [];
        this.dmChannels = [];
        this.currentChat = null;
        this.emojis = ['😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🤩','🥳','😏','😒','😞','😔','😟','😕','🙁','☹️','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🤔','🤭','🤫','🤥','😶','😐','😑','😬','🙄','😯','😦','😧','😮','😲','🥱','😴','🤤','😪','😵','🤐','🥴','🤢','🤮','🤧','😷','🤒','🤕','🤑','🤠','😈','👿','👹','👺','🤡','💩','👻','💀','☠️','👽','👾','🤖','🎃','😺','😸','😹','😻','😼','😽','🙀','😿','😾'];
        this.useLocalStorage = true;
    }

    async init() {
        console.log('🚀 Initializing Max Messenger...');
        
        // Сначала настраиваем обработчики событий
        this.setupEventListeners();
        
        // Затем инициализируем Supabase
        await this.initializeSupabase();
        
        // Потом загружаем остальное
        this.loadEmojis();
        this.checkPreviousAuth();
        this.applySavedTheme();
        
        console.log('✅ Max Messenger initialized successfully');
    }

    async initializeSupabase() {
        const SUPABASE_URL = 'https://yizjvfyloyemelbvpxst.supabase.co';
        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlpemp2Znlsb3llbWVsYnZweHN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2NTg4ODYsImV4cCI6MjA3NzIzNDg4Nn0.GpUcpeXJCuBFXpFGvTKeIVSi5248KVZSFyMd6NeuJVw';
        
        try {
            this.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('✅ Supabase initialized');
            
            // Тестируем соединение
            const { data, error } = await this.supabase.from('users').select('*').limit(1);
            if (error) {
                console.warn('⚠️ Supabase connection failed, using localStorage:', error.message);
                this.useLocalStorage = true;
                this.initLocalStorage();
            } else {
                console.log('✅ Supabase connection successful');
                this.useLocalStorage = false;
            }
        } catch (error) {
            console.error('❌ Supabase init error:', error);
            this.useLocalStorage = true;
            this.initLocalStorage();
        }
    }

    setupEventListeners() {
        console.log('🔧 Setting up event listeners...');
        
        // Ждем полной загрузки DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                console.log('📄 DOM fully loaded');
                this.setupEventListenersAfterDOM();
            });
        } else {
            this.setupEventListenersAfterDOM();
        }
    }

    setupEventListenersAfterDOM() {
        console.log('🎯 Setting up event listeners after DOM...');
        
        // Аутентификация
        this.setupAuthListeners();
        
        // Друзья
        this.setupFriendListeners();
        
        // Серверы
        this.setupServerListeners();
        
        // Настройки
        this.setupSettingsListeners();
        
        // Звонки
        this.setupCallListeners();
        
        // Чат
        this.setupChatListeners();
        
        // Модальные окна
        this.setupModalListeners();
        
        console.log('✅ All event listeners setup complete');
    }

    setupAuthListeners() {
        console.log('🔐 Setting up auth listeners...');
        
        // Вкладки аутентификации
        const authTabs = document.querySelectorAll('.auth-tab');
        console.log('📌 Found auth tabs:', authTabs.length);
        
        authTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('🔄 Switching auth tab to:', tab.dataset.tab);
                this.switchAuthTab(tab);
            });
        });

        // Форма входа
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
            console.log('✅ Login form listener added');
        } else {
            console.error('❌ Login form not found!');
        }

        // Форма регистрации
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
            console.log('✅ Register form listener added');
        } else {
            console.error('❌ Register form not found!');
        }
    }

    setupFriendListeners() {
        // Кнопка добавления друга
        const addFriendBtn = document.getElementById('add-friend-btn');
        if (addFriendBtn) {
            addFriendBtn.addEventListener('click', () => this.showAddFriendModal());
        }

        // Кнопка отправки запроса
        const sendRequestBtn = document.getElementById('send-friend-request-btn');
        if (sendRequestBtn) {
            sendRequestBtn.addEventListener('click', () => this.sendFriendRequest());
        }

        // Кнопка запросов в друзья
        const pendingBtn = document.getElementById('pending-requests-btn');
        if (pendingBtn) {
            pendingBtn.addEventListener('click', () => this.showFriendRequestsModal());
        }

        // Фильтры друзей
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchFriendFilter(e.target);
            });
        });
    }

    setupServerListeners() {
        // Создание сервера
        const addServerBtn = document.getElementById('add-server-btn');
        if (addServerBtn) {
            addServerBtn.addEventListener('click', () => this.showCreateServerModal());
        }

        const createServerBtn = document.getElementById('create-server-btn');
        if (createServerBtn) {
            createServerBtn.addEventListener('click', () => this.createServer());
        }
    }

    setupSettingsListeners() {
        // Открытие настроек
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.showSettingsModal());
        }

        // Вкладки настроек
        document.querySelectorAll('.settings-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchSettingsTab(tab);
            });
        });

        // Сохранение профиля
        const saveProfileBtn = document.getElementById('save-profile-btn');
        if (saveProfileBtn) {
            saveProfileBtn.addEventListener('click', () => this.saveProfile());
        }

        // Смена темы
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.changeTheme(btn);
            });
        });

        // Nitro
        const nitroBtn = document.getElementById('nitro-upgrade-btn');
        if (nitroBtn) {
            nitroBtn.addEventListener('click', () => this.upgradeToNitro());
        }
    }

    setupCallListeners() {
        // Кнопки звонков
        const callBtn = document.getElementById('call-btn');
        const videoCallBtn = document.getElementById('video-call-btn');
        const endCallBtn = document.getElementById('end-call-btn');
        const acceptCallBtn = document.getElementById('accept-call-btn');

        if (callBtn) callBtn.addEventListener('click', () => this.startCall(false));
        if (videoCallBtn) videoCallBtn.addEventListener('click', () => this.startCall(true));
        if (endCallBtn) endCallBtn.addEventListener('click', () => this.endCall());
        if (acceptCallBtn) acceptCallBtn.addEventListener('click', () => this.acceptCall());
    }

    setupChatListeners() {
        // Отправка сообщений
        const sendBtn = document.getElementById('send-btn');
        const messageInput = document.getElementById('message-input');

        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.sendMessage());
        }

        if (messageInput) {
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.sendMessage();
            });
        }

        // Эмодзи
        const emojiBtn = document.getElementById('emoji-btn');
        if (emojiBtn) {
            emojiBtn.addEventListener('click', () => this.toggleEmojiPicker());
        }
    }

    setupModalListeners() {
        // Закрытие модальных окон
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                this.hideModal(modal);
            });
        });

        // Закрытие по клику вне модального окна
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal(modal);
                }
            });
        });
    }

    // ОСНОВНЫЕ МЕТОДЫ
    switchAuthTab(clickedTab) {
        console.log('🔄 Switching to auth tab:', clickedTab.dataset.tab);
        
        const tabName = clickedTab.dataset.tab;
        
        // Убираем активный класс у всех вкладок
        document.querySelectorAll('.auth-tab').forEach(t => {
            t.classList.remove('active');
        });
        
        // Убираем активный класс у всех форм
        document.querySelectorAll('.auth-form').forEach(f => {
            f.classList.remove('active');
        });
        
        // Добавляем активный класс выбранной вкладке
        clickedTab.classList.add('active');
        
        // Показываем соответствующую форму
        const targetForm = document.getElementById(`${tabName}-form`);
        if (targetForm) {
            targetForm.classList.add('active');
            console.log('✅ Form shown:', tabName);
        } else {
            console.error('❌ Form not found:', `${tabName}-form`);
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        console.log('🔐 Login attempt...');
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        if (!email || !password) {
            this.showNotification('Заполните все поля', 'error');
            return;
        }

        this.showLoading(true);

        try {
            if (this.useLocalStorage) {
                // Логин через localStorage
                const users = JSON.parse(localStorage.getItem('messenger_users')) || [];
                const user = users.find(u => u.email === email && u.password === password);
                
                if (user) {
                    this.currentUser = user;
                    localStorage.setItem('currentUser', JSON.stringify(user));
                    this.showNotification(`Добро пожаловать, ${user.username}!`, 'success');
                    
                    await this.delay(1000);
                    this.showApp();
                    this.loadUserData();
                } else {
                    this.showNotification('Неверный email или пароль', 'error');
                }
            } else {
                // Логин через Supabase
                const { data: user, error } = await this.supabase
                    .from('users')
                    .select('*')
                    .eq('email', email)
                    .eq('password_hash', password)
                    .single();

                if (error) {
                    this.showNotification('Неверный email или пароль', 'error');
                } else if (user) {
                    this.currentUser = user;
                    localStorage.setItem('currentUser', JSON.stringify(user));
                    this.showNotification(`Добро пожаловать, ${user.username}!`, 'success');
                    
                    await this.delay(1000);
                    this.showApp();
                    await this.loadUserData();
                }
            }
        } catch (error) {
            this.showNotification('Ошибка при входе', 'error');
            console.error('Login error:', error);
        } finally {
            this.showLoading(false);
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        console.log('📝 Registration attempt...');
        
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;

        console.log('📧 Registration data:', { username, email, password: '***' });

        if (!username || !email || !password) {
            this.showNotification('Заполните все поля', 'error');
            return;
        }

        if (password.length < 6) {
            this.showNotification('Пароль должен быть не менее 6 символов', 'error');
            return;
        }

        this.showLoading(true);

        try {
            if (this.useLocalStorage) {
                console.log('💾 Using localStorage for registration');
                const users = JSON.parse(localStorage.getItem('messenger_users')) || [];
                const existingUser = users.find(u => u.email === email || u.username === username);
                
                if (existingUser) {
                    this.showNotification('Пользователь с таким email или именем уже существует', 'error');
                    return;
                }

                const discriminator = this.generateDiscriminator(users, username);
                const newUser = {
                    id: Date.now().toString(),
                    username,
                    discriminator,
                    email,
                    password,
                    avatar_url: '',
                    banner_url: '',
                    bio: '',
                    badges: ['early_supporter'],
                    status: 'online',
                    nitro: false,
                    created_at: new Date().toISOString()
                };

                users.push(newUser);
                localStorage.setItem('messenger_users', JSON.stringify(users));
                
                this.showNotification('Регистрация успешна! Теперь вы можете войти.', 'success');
                await this.delay(2000);
                
                // Переключаем на вкладку входа
                const loginTab = document.querySelector('.auth-tab[data-tab="login"]');
                if (loginTab) {
                    this.switchAuthTab(loginTab);
                }
                
                // Очищаем форму регистрации
                document.getElementById('register-form').reset();
                
            } else {
                console.log('🗄️ Using Supabase for registration');
                const discriminator = await this.generateSupabaseDiscriminator(username);
                
                const { data: user, error } = await this.supabase
                    .from('users')
                    .insert([
                        {
                            username,
                            discriminator,
                            email,
                            password_hash: password,
                            badges: ['early_supporter'],
                            nitro: false
                        }
                    ])
                    .select()
                    .single();

                if (error) {
                    console.error('❌ Supabase registration error:', error);
                    if (error.code === '23505') {
                        this.showNotification('Пользователь с таким email или именем уже существует', 'error');
                    } else {
                        this.showNotification('Ошибка при регистрации: ' + error.message, 'error');
                    }
                } else {
                    console.log('✅ Registration successful:', user);
                    this.showNotification('Регистрация успешна! Теперь вы можете войти.', 'success');
                    await this.delay(2000);
                    
                    // Переключаем на вкладку входа
                    const loginTab = document.querySelector('.auth-tab[data-tab="login"]');
                    if (loginTab) {
                        this.switchAuthTab(loginTab);
                    }
                    
                    document.getElementById('register-form').reset();
                }
            }
        } catch (error) {
            console.error('❌ Registration error:', error);
            this.showNotification('Ошибка при регистрации', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    generateDiscriminator(users, username) {
        const existingDiscriminators = users
            .filter(u => u.username === username)
            .map(u => u.discriminator);

        let discriminator;
        do {
            discriminator = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        } while (existingDiscriminators.includes(discriminator));

        return discriminator;
    }

    async generateSupabaseDiscriminator(username) {
        const { data: existingUsers } = await this.supabase
            .from('users')
            .select('discriminator')
            .eq('username', username);

        const existingDiscriminators = existingUsers?.map(u => u.discriminator) || [];
        
        let discriminator;
        do {
            discriminator = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        } while (existingDiscriminators.includes(discriminator));

        return discriminator;
    }

    // ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ
    showLoading(show) {
        const loading = document.getElementById('loading');
        if (loading) {
            if (show) {
                loading.classList.remove('hidden');
            } else {
                loading.classList.add('hidden');
            }
        }
    }

    showNotification(message, type = 'info', duration = 5000) {
        const container = document.getElementById('notifications');
        if (!container) {
            console.error('❌ Notifications container not found');
            return;
        }

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        notification.innerHTML = `
            <span class="notification-icon">${icons[type] || icons.info}</span>
            <div class="notification-content">
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close">&times;</button>
        `;

        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            notification.remove();
        });

        container.appendChild(notification);

        if (duration > 0) {
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, duration);
        }

        return notification;
    }

    showModal(modal) {
        if (modal) {
            modal.classList.add('active');
        }
    }

    hideModal(modal) {
        if (modal) {
            modal.classList.remove('active');
     
