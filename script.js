class MaxMessenger {
    constructor() {
        this.supabase = null;
        this.currentUser = null;
        this.servers = [];
        this.friends = [];
        this.emojis = ['😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🤩','🥳','😏','😒','😞','😔','😟','😕','🙁','☹️','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🤔','🤭','🤫','🤥','😶','😐','😑','😬','🙄','😯','😦','😧','😮','😲','🥱','😴','🤤','😪','😵','🤐','🥴','🤢','🤮','🤧','😷','🤒','🤕','🤑','🤠','😈','👿','👹','👺','🤡','💩','👻','💀','☠️','👽','👾','🤖','🎃','😺','😸','😹','😻','😼','😽','🙀','😿','😾'];
        this.useLocalStorage = true;
    }

    async init() {
        console.log('Initializing Max Messenger...');
        await this.initializeSupabase();
        this.setupEventListeners();
        this.loadEmojis();
        this.checkPreviousAuth();
        this.applySavedTheme();
    }

    async initializeSupabase() {
        try {
            // Для демо используем localStorage
            console.log('Using localStorage mode');
            this.initLocalStorage();
        } catch (error) {
            console.error('Supabase init error:', error);
            this.fallbackToLocalStorage();
        }
    }

    initLocalStorage() {
        console.log('Initializing localStorage...');
        
        if (!localStorage.getItem('messenger_users')) {
            const defaultUsers = [
                {
                    id: '1',
                    username: 'DemoUser',
                    email: 'demo@example.com',
                    password: '123456',
                    avatar_url: '',
                    badges: ['creator'],
                    status: 'online',
                    created_at: new Date().toISOString()
                },
                {
                    id: '2', 
                    username: 'Алексей',
                    email: 'alex@example.com',
                    password: '123456',
                    avatar_url: '',
                    badges: ['nitro'],
                    status: 'online',
                    created_at: new Date().toISOString()
                },
                {
                    id: '3', 
                    username: 'Мария',
                    email: 'maria@example.com',
                    password: '123456',
                    avatar_url: '',
                    badges: ['booster'],
                    status: 'offline',
                    created_at: new Date().toISOString()
                }
            ];
            localStorage.setItem('messenger_users', JSON.stringify(defaultUsers));
            console.log('Default users created');
        }

        if (!localStorage.getItem('messenger_servers')) {
            const defaultServer = {
                id: '1',
                name: 'Демо сервер',
                owner_id: '1',
                channels: [
                    { id: '1', name: 'общий', type: 'text' },
                    { id: '2', name: 'музыка', type: 'text' },
                    { id: '3', name: 'игры', type: 'text' }
                ],
                members: ['1', '2', '3'],
                created_at: new Date().toISOString()
            };
            localStorage.setItem('messenger_servers', JSON.stringify([defaultServer]));
            console.log('Default server created');
        }

        if (!localStorage.getItem('messenger_messages')) {
            localStorage.setItem('messenger_messages', JSON.stringify([]));
        }

        if (!localStorage.getItem('messenger_friends')) {
            // Создаем демо друзей
            const friendships = [
                { id: '1', user_id: '1', friend_id: '2', status: 'accepted' },
                { id: '2', user_id: '1', friend_id: '3', status: 'accepted' }
            ];
            localStorage.setItem('messenger_friends', JSON.stringify(friendships));
        }
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // Ждем пока DOM полностью загрузится
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupEventListenersAfterDOM());
        } else {
            this.setupEventListenersAfterDOM();
        }
    }

    setupEventListenersAfterDOM() {
        console.log('DOM loaded, setting up listeners...');

        // Аутентификация
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
            console.log('Login form listener added');
        } else {
            console.error('Login form not found!');
        }

        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
            console.log('Register form listener added');
        } else {
            console.error('Register form not found!');
        }

        // Вкладки аутентификации
        const authTabs = document.querySelectorAll('.auth-tab');
        console.log('Found auth tabs:', authTabs.length);
        
        authTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Auth tab clicked:', tab.dataset.tab);
                this.switchAuthTab(tab);
            });
        });

        // Вкладки каналов
        const channelTabs = document.querySelectorAll('.channel-tab');
        channelTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchChannelTab(tab);
            });
        });

        // Серверы
        const addServerBtn = document.getElementById('add-server-btn');
        if (addServerBtn) {
            addServerBtn.addEventListener('click', () => this.showCreateServerModal());
        }

        const createServerBtn = document.getElementById('create-server-btn');
        if (createServerBtn) {
            createServerBtn.addEventListener('click', () => this.createServer());
        }

        // Друзья
        const addFriendBtn = document.getElementById('add-friend-btn');
        if (addFriendBtn) {
            addFriendBtn.addEventListener('click', () => this.addFriend());
        }

        const friendInput = document.getElementById('friend-username-input');
        if (friendInput) {
            friendInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.addFriend();
            });
        }

        // Сообщения
        const sendBtn = document.getElementById('send-btn');
        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.sendMessage());
        }

        const messageInput = document.getElementById('message-input');
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

        // Настройки
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.showSettings());
        }

        // Тема оформления
        const themeBtns = document.querySelectorAll('.theme-btn');
        themeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.changeTheme(btn);
            });
        });

        // Сохранение профиля
        const saveProfileBtn = document.getElementById('save-profile-btn');
        if (saveProfileBtn) {
            saveProfileBtn.addEventListener('click', () => this.saveProfile());
        }

        console.log('All event listeners setup complete');
    }

    switchAuthTab(clickedTab) {
        console.log('Switching auth tab to:', clickedTab.dataset.tab);
        
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
            console.log('Form shown:', tabName);
        } else {
            console.error('Form not found:', `${tabName}-form`);
        }
    }

    switchChannelTab(clickedTab) {
        const tabName = clickedTab.dataset.tab;
        
        document.querySelectorAll('.channel-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        clickedTab.classList.add('active');
        
        const targetTab = document.getElementById(`${tabName}-tab`);
        if (targetTab) {
            targetTab.classList.add('active');
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        console.log('Login attempt...');
        
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
            console.error('Login error:', error);
        } finally {
            this.showLoading(false);
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        console.log('Registration attempt...');
        
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;

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
            const users = JSON.parse(localStorage.getItem('messenger_users')) || [];
            const existingUser = users.find(u => u.email === email || u.username === username);
            
            if (existingUser) {
                this.showNotification('Пользователь с таким email или именем уже существует', 'error');
                return;
            }

            const newUser = {
                id: Date.now().toString(),
                username,
                email,
                password,
                avatar_url: '',
                badges: ['new_user'],
                status: 'online',
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
            
        } catch (error) {
            this.showNotification('Ошибка при регистрации', 'error');
            console.error('Registration error:', error);
        } finally {
            this.showLoading(false);
        }
    }

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
            console.error('Notifications container not found');
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
            notification.classList.add('fade-out');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        });

        container.appendChild(notification);

        if (duration > 0) {
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.classList.add('fade-out');
                    setTimeout(() => notification.remove(), 300);
                }
            }, duration);
        }

        return notification;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    checkPreviousAuth() {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            try {
                this.currentUser = JSON.parse(savedUser);
                this.showApp();
                this.loadUserData();
            } catch (error) {
                console.error('Error parsing saved user:', error);
                this.showAuth();
            }
        } else {
            this.showAuth();
        }
    }

    showAuth() {
        const authPage = document.getElementById('auth-page');
        const app = document.getElementById('app');
        
        if (authPage) authPage.classList.remove('hidden');
        if (app) app.classList.add('hidden');
    }

    showApp() {
        const authPage = document.getElementById('auth-page');
        const app = document.getElementById('app');
        
        if (authPage) authPage.classList.add('hidden');
        if (app) app.classList.remove('hidden');
        
        this.updateUserPanel();
    }

    async loadUserData() {
        await this.loadServers();
        await this.loadFriends();
        this.renderServers();
        this.renderFriends();
    }

    async loadServers() {
        this.servers = JSON.parse(localStorage.getItem('messenger_servers')) || [];
    }

    async loadFriends() {
        const friendships = JSON.parse(localStorage.getItem('messenger_friends')) || [];
        const users = JSON.parse(localStorage.getItem('messenger_users')) || [];
        
        // Получаем друзей текущего пользователя
        this.friends = friendships
            .filter(f => f.user_id === this.currentUser?.id && f.status === 'accepted')
            .map(f => users.find(u => u.id === f.friend_id))
            .filter(Boolean);
    }

    renderServers() {
        const serverList = document.getElementById('server-list');
        if (!serverList) return;

        serverList.innerHTML = '';

        this.servers.forEach(server => {
            const serverElement = document.createElement('div');
            serverElement.className = 'server-item';
            serverElement.innerHTML = server.name.charAt(0).toUpperCase();
            serverElement.addEventListener('click', () => this.selectServer(server));
            serverList.appendChild(serverElement);
        });
    }

    renderFriends() {
        const friendsList = document.getElementById('friends-list');
        if (!friendsList) return;

        friendsList.innerHTML = '';

        this.friends.forEach(friend => {
            const friendElement = document.createElement('div');
            friendElement.className = 'friend-item';
            friendElement.innerHTML = `
                <div class="user-avatar">${friend.username.charAt(0).toUpperCase()}</div>
                <span class="username">${friend.username}</span>
                <div class="user-status ${friend.status}"></div>
                <div class="badges">
                    ${friend.badges.map(badge => `<span class="badge ${badge}">${badge}</span>`).join('')}
                </div>
            `;
            friendElement.addEventListener('click', () => this.startDM(friend));
            friendsList.appendChild(friendElement);
        });
    }

    updateUserPanel() {
        if (!this.currentUser) return;

        const usernameElement = document.getElementById('panel-username');
        const statusElement = document.getElementById('panel-status');
        const avatarElement = document.getElementById('user-avatar');

        if (usernameElement) usernameElement.textContent = this.currentUser.username;
        if (statusElement) statusElement.textContent = this.currentUser.status;
        
        if (avatarElement) {
            if (avatarElement.tagName === 'IMG') {
                avatarElement.alt = this.currentUser.username;
            } else {
                avatarElement.textContent = this.currentUser.username.charAt(0).toUpperCase();
            }
        }
    }

    applySavedTheme() {
        const savedTheme = localStorage.getItem('theme') || 'gray';
        document.body.className = `theme-${savedTheme}`;
        
        const themeBtn = document.querySelector(`.theme-btn[data-theme="${savedTheme}"]`);
        if (themeBtn) {
            document.querySelectorAll('.theme-btn').forEach(btn => btn.classList.remove('active'));
            themeBtn.classList.add('active');
        }
    }

    // Остальные методы...
    loadEmojis() {
        const picker = document.getElementById('emoji-picker');
        if (!picker) return;
        
        picker.innerHTML = '';
        
        this.emojis.forEach(emoji => {
            const emojiElement = document.createElement('span');
            emojiElement.className = 'emoji';
            emojiElement.textContent = emoji;
            emojiElement.addEventListener('click', () => this.insertEmoji(emoji));
            picker.appendChild(emojiElement);
        });
    }

    showCreateServerModal() {
        this.showModal(document.getElementById('server-create-modal'));
    }

    showSettings() {
        this.loadSettings();
        this.showModal(document.getElementById('settings-modal'));
    }

    loadSettings() {
        if (this.currentUser) {
            const usernameInput = document.getElementById('settings-username');
            if (usernameInput) {
                usernameInput.value = this.currentUser.username;
            }
        }
    }

    saveProfile() {
        const usernameInput = document.getElementById('settings-username');
        if (!usernameInput || !this.currentUser) return;

        const username = usernameInput.value.trim();
        if (!username) {
            this.showNotification('Введите имя пользователя', 'error');
            return;
        }

        this.currentUser.username = username;
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));

        // Обновляем в общем списке пользователей
        const users = JSON.parse(localStorage.getItem('messenger_users')) || [];
        const userIndex = users.findIndex(u => u.id === this.currentUser.id);
        if (userIndex !== -1) {
            users[userIndex].username = username;
            localStorage.setItem('messenger_users', JSON.stringify(users));
        }

        this.updateUserPanel();
        this.showNotification('Профиль обновлен', 'success');
        this.hideModal(document.getElementById('settings-modal'));
    }

    changeTheme(clickedButton) {
        const theme = clickedButton.dataset.theme;
        
        document.querySelectorAll('.theme-btn').forEach(btn => btn.classList.remove('active'));
        clickedButton.classList.add('active');
        
        document.body.className = `theme-${theme}`;
        localStorage.setItem('theme', theme);
        this.showNotification(`Тема изменена на ${theme}`, 'success');
    }

    insertEmoji(emoji) {
        const input = document.getElementById('message-input');
        if (input) {
            input.value += emoji;
            input.focus();
        }
        this.toggleEmojiPicker();
    }

    toggleEmojiPicker() {
        const picker = document.getElementById('emoji-picker');
        if (picker) {
            picker.classList.toggle('hidden');
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

    startDM(user) {
        this.showNotification(`Открыт чат с ${user.username}`, 'info');
    }

    selectServer(server) {
        this.showNotification(`Выбран сервер: ${server.name}`, 'info');
    }

    createServer() {
        const input = document.getElementById('server-name-input');
        if (!input) return;

        const name = input.value.trim();
        if (!name) {
            this.showNotification('Введите название сервера', 'warning');
            return;
        }

        this.showNotification(`Сервер "${name}" создан!`, 'success');
        this.hideModal(document.getElementById('server-create-modal'));
        input.value = '';
    }

    addFriend() {
        const input = document.getElementById('friend-username-input');
        if (!input) return;

        const username = input.value.trim();
        if (!username) {
            this.showNotification('Введите имя пользователя', 'warning');
            return;
        }

        this.showNotification(`Запрос дружбы отправлен пользователю ${username}`, 'success');
        input.value = '';
    }

    sendMessage() {
        const input = document.getElementById('message-input');
        if (!input) return;

        const content = input.value.trim();
        if (!content) return;

        this.showNotification('Сообщение отправлено', 'success');
        input.value = '';
    }

    fallbackToLocalStorage() {
        console.log('Falling back to localStorage');
        this.useLocalStorage = true;
        this.initLocalStorage();
    }
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded, initializing app...');
    window.messengerApp = new MaxMessenger();
    window.messengerApp.init();
});
