class MaxMessenger {
    constructor() {
        this.currentUser = null;
        this.servers = [];
        this.friends = [];
        this.friendRequests = [];
        this.dmChannels = [];
        this.currentChat = null;
        this.emojis = ['😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🤩','🥳','😏','😒','😞','😔','😟','😕','🙁','☹️','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🤔','🤭','🤫','🤥','😶','😐','😑','😬','🙄','😯','😦','😧','😮','😲','🥱','😴','🤤','😪','😵','🤐','🥴','🤢','🤮','🤧','😷','🤒','🤕','🤑','🤠','😈','👿','👹','👺','🤡','💩','👻','💀','☠️','👽','👾','🤖','🎃','😺','😸','😹','😻','😼','😽','🙀','😿','😾'];
        this.useLocalStorage = true;
        
        this.init();
    }

    async init() {
        console.log('Initializing Max Messenger...');
        this.initLocalStorage();
        this.setupEventListeners();
        this.loadEmojis();
        this.checkPreviousAuth();
        this.applySavedTheme();
    }

    initLocalStorage() {
        if (!localStorage.getItem('messenger_users')) {
            const defaultUsers = [
                {
                    id: '1',
                    username: 'DemoUser',
                    discriminator: '0001',
                    email: 'demo@example.com',
                    password: '123456',
                    avatar_url: '',
                    banner_url: '',
                    bio: '',
                    badges: ['early_supporter', 'developer'],
                    status: 'online',
                    nitro: false,
                    created_at: new Date().toISOString()
                },
                {
                    id: '2', 
                    username: 'Алексей',
                    discriminator: '1337',
                    email: 'alex@example.com',
                    password: '123456',
                    avatar_url: '',
                    banner_url: '',
                    bio: 'Люблю программирование и игры 🎮',
                    badges: ['nitro'],
                    status: 'online',
                    nitro: true,
                    created_at: new Date().toISOString()
                },
                {
                    id: '3', 
                    username: 'Мария',
                    discriminator: '0420',
                    email: 'maria@example.com',
                    password: '123456',
                    avatar_url: '',
                    banner_url: '',
                    bio: 'Дизайнер и художник 🎨',
                    badges: ['booster'],
                    status: 'idle',
                    nitro: true,
                    created_at: new Date().toISOString()
                }
            ];
            localStorage.setItem('messenger_users', JSON.stringify(defaultUsers));
        }

        if (!localStorage.getItem('messenger_servers')) {
            const defaultServers = [
                {
                    id: '1',
                    name: 'Игровое комьюнити',
                    icon: '',
                    owner_id: '1',
                    channels: [
                        { id: '1', name: 'общий', type: 'text' },
                        { id: '2', name: 'игры', type: 'text' },
                        { id: '3', name: 'музыка', type: 'voice' }
                    ],
                    members: ['1', '2', '3'],
                    created_at: new Date().toISOString()
                }
            ];
            localStorage.setItem('messenger_servers', JSON.stringify(defaultServers));
        }

        if (!localStorage.getItem('messenger_friends')) {
            localStorage.setItem('messenger_friends', JSON.stringify([]));
        }

        if (!localStorage.getItem('messenger_friend_requests')) {
            localStorage.setItem('messenger_friend_requests', JSON.stringify([]));
        }

        if (!localStorage.getItem('messenger_dms')) {
            localStorage.setItem('messenger_dms', JSON.stringify([]));
        }

        if (!localStorage.getItem('messenger_messages')) {
            localStorage.setItem('messenger_messages', JSON.stringify([]));
        }
    }

    setupEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            this.setupAuthListeners();
            this.setupFriendListeners();
            this.setupServerListeners();
            this.setupSettingsListeners();
            this.setupCallListeners();
            this.setupChatListeners();
        });
    }

    setupAuthListeners() {
        // Вкладки аутентификации
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchAuthTab(tab);
            });
        });

        // Формы
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
        
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
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

        // Поиск друзей
        const searchInput = document.getElementById('friends-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchFriends(e.target.value);
            });
        }
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

        // Загрузка иконки сервера
        const serverIconUpload = document.getElementById('server-icon-upload');
        if (serverIconUpload) {
            serverIconUpload.addEventListener('change', (e) => {
                this.handleServerIconUpload(e);
            });
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

        // Загрузка аватарки
        const avatarUpload = document.getElementById('avatar-upload');
        if (avatarUpload) {
            avatarUpload.addEventListener('change', (e) => {
                this.handleAvatarUpload(e);
            });
        }

        // Загрузка баннера
        const bannerUpload = document.getElementById('banner-upload');
        if (bannerUpload) {
            bannerUpload.addEventListener('change', (e) => {
                this.handleBannerUpload(e);
            });
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

    // СИСТЕМА ДРУЗЕЙ
    async sendFriendRequest() {
        const usernameInput = document.getElementById('friend-username-input');
        const discriminatorInput = document.getElementById('friend-discriminator-input');
        
        const username = usernameInput.value.trim();
        const discriminator = discriminatorInput.value.trim();

        if (!username || !discriminator) {
            this.showNotification('Введите имя пользователя и тег', 'error');
            return;
        }

        const users = JSON.parse(localStorage.getItem('messenger_users')) || [];
        const targetUser = users.find(u => 
            u.username === username && u.discriminator === discriminator
        );

        if (!targetUser) {
            this.showNotification('Пользователь не найден', 'error');
            return;
        }

        if (targetUser.id === this.currentUser.id) {
            this.showNotification('Нельзя отправить запрос самому себе', 'error');
            return;
        }

        const friendRequests = JSON.parse(localStorage.getItem('messenger_friend_requests')) || [];
        
        // Проверяем, не отправлен ли уже запрос
        const existingRequest = friendRequests.find(req => 
            req.from_id === this.currentUser.id && req.to_id === targetUser.id
        );

        if (existingRequest) {
            this.showNotification('Запрос уже отправлен', 'warning');
            return;
        }

        const newRequest = {
            id: Date.now().toString(),
            from_id: this.currentUser.id,
            to_id: targetUser.id,
            status: 'pending',
            created_at: new Date().toISOString()
        };

        friendRequests.push(newRequest);
        localStorage.setItem('messenger_friend_requests', JSON.stringify(friendRequests));

        this.showNotification(`Запрос отправлен пользователю ${username}#${discriminator}`, 'success');
        this.hideModal(document.getElementById('add-friend-modal'));
        
        usernameInput.value = '';
        discriminatorInput.value = '';
    }

    async loadFriendRequests() {
        const friendRequests = JSON.parse(localStorage.getItem('messenger_friend_requests')) || [];
        const users = JSON.parse(localStorage.getItem('messenger_users')) || [];
        
        // Запросы, отправленные текущему пользователю
        this.incomingRequests = friendRequests.filter(req => 
            req.to_id === this.currentUser.id && req.status === 'pending'
        );

        // Запросы, отправленные текущим пользователем
        this.outgoingRequests = friendRequests.filter(req => 
            req.from_id === this.currentUser.id && req.status === 'pending'
        );

        this.updatePendingCount();
        return this.incomingRequests.map(req => ({
            ...req,
            user: users.find(u => u.id === req.from_id)
        }));
    }

    async acceptFriendRequest(requestId) {
        const friendRequests = JSON.parse(localStorage.getItem('messenger_friend_requests')) || [];
        const friends = JSON.parse(localStorage.getItem('messenger_friends')) || [];
        const request = friendRequests.find(req => req.id === requestId);

        if (!request) return;

        // Обновляем статус запроса
        request.status = 'accepted';
        localStorage.setItem('messenger_friend_requests', JSON.stringify(friendRequests));

        // Добавляем в друзья
        const newFriendship = {
            id: Date.now().toString(),
            user1_id: request.from_id,
            user2_id: request.to_id,
            created_at: new Date().toISOString()
        };

        friends.push(newFriendship);
        localStorage.setItem('messenger_friends', JSON.stringify(friends));

        this.showNotification('Запрос в друзья принят', 'success');
        this.loadFriends();
        this.loadFriendRequests();
        this.hideModal(document.getElementById('friend-requests-modal'));
    }

    async denyFriendRequest(requestId) {
        const friendRequests = JSON.parse(localStorage.getItem('messenger_friend_requests')) || [];
        const requestIndex = friendRequests.findIndex(req => req.id === requestId);

        if (requestIndex !== -1) {
            friendRequests.splice(requestIndex, 1);
            localStorage.setItem('messenger_friend_requests', JSON.stringify(friendRequests));
        }

        this.showNotification('Запрос в друзья отклонен', 'info');
        this.loadFriendRequests();
    }

    updatePendingCount() {
        const pendingCount = document.getElementById('pending-count');
        if (pendingCount) {
            pendingCount.textContent = this.incomingRequests.length;
        }
    }

    // СИСТЕМА СЕРВЕРОВ
    async createServer() {
        const nameInput = document.getElementById('server-name-input');
        const serverName = nameInput.value.trim();

        if (!serverName) {
            this.showNotification('Введите название сервера', 'error');
            return;
        }

        const servers = JSON.parse(localStorage.getItem('messenger_servers')) || [];
        const newServer = {
            id: Date.now().toString(),
            name: serverName,
            icon: '',
            owner_id: this.currentUser.id,
            channels: [
                { id: '1', name: 'общий', type: 'text' },
                { id: '2', name: 'голосовой', type: 'voice' }
            ],
            members: [this.currentUser.id],
            created_at: new Date().toISOString()
        };

        servers.push(newServer);
        localStorage.setItem('messenger_servers', JSON.stringify(servers));

        this.showNotification(`Сервер "${serverName}" создан!`, 'success');
        this.hideModal(document.getElementById('server-create-modal'));
        nameInput.value = '';

        // Обновляем список серверов
        this.loadServers();
    }

    // СИСТЕМА ПРОФИЛЯ И НАСТРОЕК
    async saveProfile() {
        const usernameInput = document.getElementById('settings-username');
        const discriminatorInput = document.getElementById('settings-discriminator');
        const bioInput = document.getElementById('user-bio');

        const username = usernameInput.value.trim();
        const discriminator = discriminatorInput.value.trim();
        const bio = bioInput.value.trim();

        if (!username) {
            this.showNotification('Введите имя пользователя', 'error');
            return;
        }

        // Обновляем текущего пользователя
        this.currentUser.username = username;
        this.currentUser.discriminator = discriminator;
        this.currentUser.bio = bio;

        // Обновляем в localStorage
        const users = JSON.parse(localStorage.getItem('messenger_users')) || [];
        const userIndex = users.findIndex(u => u.id === this.currentUser.id);
        if (userIndex !== -1) {
            users[userIndex] = this.currentUser;
            localStorage.setItem('messenger_users', JSON.stringify(users));
        }

        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));

        this.updateUserPanel();
        this.showNotification('Профиль обновлен', 'success');
    }

    async handleAvatarUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            this.showNotification('Выберите изображение', 'error');
            return;
        }

        // В реальном приложении здесь была бы загрузка на сервер
        // Для демо просто сохраняем как data URL
        const reader = new FileReader();
        reader.onload = (e) => {
            this.currentUser.avatar_url = e.target.result;
            this.updateUserPanel();
            this.showNotification('Аватар обновлен', 'success');
        };
        reader.readAsDataURL(file);
    }

    async handleBannerUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            this.showNotification('Выберите изображение', 'error');
            return;
        }

        if (!this.currentUser.nitro) {
            this.showNotification('Функция баннеров доступна только для Nitro пользователей', 'warning');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.currentUser.banner_url = e.target.result;
            this.showNotification('Баннер обновлен', 'success');
        };
        reader.readAsDataURL(file);
    }

    async upgradeToNitro() {
        this.currentUser.nitro = true;
        this.currentUser.badges.push('nitro');
        
        const users = JSON.parse(localStorage.getItem('messenger_users')) || [];
        const userIndex = users.findIndex(u => u.id === this.currentUser.id);
        if (userIndex !== -1) {
            users[userIndex] = this.currentUser;
            localStorage.setItem('messenger_users', JSON.stringify(users));
        }

        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));

        this.showNotification('Nitro активирован! Теперь вам доступны премиум функции', 'success');
    }

    // СИСТЕМА ЗВОНКОВ
    async startCall(isVideo) {
        if (!this.currentChat || !this.currentChat.user) {
            this.showNotification('Выберите чат для звонка', 'warning');
            return;
        }

        const callModal = document.getElementById('call-modal');
        const callUsername = document.getElementById('call-username');
        const callAvatar = document.getElementById('call-avatar');
        const callStatus = document.getElementById('call-status');

        callUsername.textContent = this.currentChat.user.username;
        callAvatar.textContent = this.currentChat.user.username.charAt(0);
        callStatus.textContent = isVideo ? 'Видео-звонок...' : 'Звонок...';

        this.showModal(callModal);

        // Имитация звонка
        setTimeout(() => {
            if (Math.random() > 0.3) { // 70% шанс что ответят
                this.showNotification(`${this.currentChat.user.username} ответил на звонок`, 'success');
                callStatus.textContent = isVideo ? 'Видео-звонок активен' : 'Звонок активен';
            } else {
                this.showNotification(`${this.currentChat.user.username} не ответил`, 'warning');
                this.hideModal(callModal);
            }
        }, 3000);
    }

    async endCall() {
        this.hideModal(document.getElementById('call-modal'));
        this.showNotification('Звонок завершен', 'info');
    }

    async acceptCall() {
        const callStatus = document.getElementById('call-status');
        callStatus.textContent = 'Звонок активен';
        this.showNotification('Вы ответили на звонок', 'success');
    }

    // ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ
    switchAuthTab(clickedTab) {
        const tabName = clickedTab.dataset.tab;
        
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        
        clickedTab.classList.add('active');
        document.getElementById(`${tabName}-form`).classList.add('active');
    }

    switchFriendFilter(clickedBtn) {
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        clickedBtn.classList.add('active');
        this.renderFriends(clickedBtn.dataset.filter);
    }

    switchSettingsTab(clickedTab) {
        const tabName = clickedTab.dataset.tab;
        
        document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        clickedTab.classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');
    }

    showAddFriendModal() {
        this.showModal(document.getElementById('add-friend-modal'));
    }

    showFriendRequestsModal() {
        this.loadFriendRequests().then(requests => {
            this.renderFriendRequests(requests);
            this.showModal(document.getElementById('friend-requests-modal'));
        });
    }

    showCreateServerModal() {
        this.showModal(document.getElementById('server-create-modal'));
    }

    showSettingsModal() {
        this.loadSettings();
        this.showModal(document.getElementById('settings-modal'));
    }

    loadSettings() {
        if (this.currentUser) {
            document.getElementById('settings-username').value = this.currentUser.username;
            document.getElementById('settings-discriminator').value = this.currentUser.discriminator;
            document.getElementById('user-bio').value = this.currentUser.bio || '';
            
            const bioLength = document.getElementById('bio-length');
            if (bioLength) {
                bioLength.textContent = this.currentUser.bio?.length || 0;
            }

            this.renderUserBadges();
        }
    }

    renderUserBadges() {
        const badgesContainer = document.getElementById('user-badges');
        if (!badgesContainer || !this.currentUser) return;

        badgesContainer.innerHTML = '';

        this.currentUser.badges.forEach(badge => {
            const badgeElement = document.createElement('div');
            badgeElement.className = `badge ${badge}`;
            badgeElement.textContent = this.getBadgeName(badge);
            badgesContainer.appendChild(badgeElement);
        });
    }

    getBadgeName(badge) {
        const badgeNames = {
            'early_supporter': 'Ранний поддержавший',
            'developer': 'Разработчик',
            'nitro': 'Nitro',
            'booster': 'Бустер'
        };
        return badgeNames[badge] || badge;
    }

    // ... остальные методы (handleLogin, handleRegister, showNotification и т.д.)

    async handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        if (!email || !password) {
            this.showNotification('Заполните все поля', 'error');
            return;
        }

        this.showLoading(true);

        try {
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
        } catch (error) {
            this.showNotification('Ошибка при входе', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;

        if (!username || !email || !password) {
            this.showNotification('Заполните все поля', 'error');
            return;
        }

        this.showLoading(true);

        try {
            const users = JSON.parse(localStorage.getItem('messenger_users')) || [];
            const existingUser = users.find(u => u.email === email || u.username === username);
            
            if (existingUser) {
                this.showNotification('Пользователь с таким email или именем уже существует', 'error');
                return;
            }

            // Генерируем уникальный discriminator
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
            
            const loginTab = document.querySelector('.auth-tab[data-tab="login"]');
            if (loginTab) {
                this.switchAuthTab(loginTab);
            }
            
            document.getElementById('register-form').reset();
            
        } catch (error) {
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

    showLoading(show) {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.classList.toggle('hidden', !show);
        }
    }

    showNotification(message, type = 'info', duration = 5000) {
        const container = document.getElementById('notifications');
        if (!container) return;

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
    }

    showModal(modal) {
        if (modal) {
            modal.classList.add('active');
        }
    }

    hideModal(modal) {
        if (modal) {
            modal.classList.remove('active');
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ... остальные методы
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    window.messengerApp = new MaxMessenger();
});
