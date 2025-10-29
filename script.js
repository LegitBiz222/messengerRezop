class MaxMessenger {
    constructor() {
        this.supabase = null;
        this.currentUser = null;
        this.currentServer = null;
        this.currentChannel = null;
        this.currentDM = null;
        this.servers = [];
        this.friends = [];
        this.emojis = ['😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🤩','🥳','😏','😒','😞','😔','😟','😕','🙁','☹️','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🤔','🤭','🤫','🤥','😶','😐','😑','😬','🙄','😯','😦','😧','😮','😲','🥱','😴','🤤','😪','😵','🤐','🥴','🤢','🤮','🤧','😷','🤒','🤕','🤑','🤠','😈','👿','👹','👺','🤡','💩','👻','💀','☠️','👽','👾','🤖','🎃','😺','😸','😹','😻','😼','😽','🙀','😿','😾'];
        
        this.init();
    }

    async init() {
        await this.initializeSupabase();
        this.setupEventListeners();
        this.loadEmojis();
        this.checkPreviousAuth();
    }

    async initializeSupabase() {
        // Замените на ваши данные из Supabase
        const SUPABASE_URL = 'https://your-project.supabase.co';
        const SUPABASE_ANON_KEY = 'your-anon-key';
        
        try {
            this.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('Supabase initialized');
        } catch (error) {
            console.error('Supabase init error:', error);
            this.fallbackToLocalStorage();
        }
    }

    setupEventListeners() {
        // Аутентификация - ОБНОВЛЕННЫЙ КОД
        document.getElementById('login-form').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('register-form').addEventListener('submit', (e) => this.handleRegister(e));
        
        // Вкладки аутентификации - ИСПРАВЛЕННЫЙ КОД
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchAuthTab(e.target));
        });
        
        // Вкладки каналов
        document.querySelectorAll('.channel-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchChannelTab(e.target));
        });

        // Серверы
        document.getElementById('add-server-btn').addEventListener('click', () => this.showCreateServerModal());
        document.getElementById('create-server-btn').addEventListener('click', () => this.createServer());

        // Друзья
        document.getElementById('add-friend-btn').addEventListener('click', () => this.addFriend());
        document.getElementById('friend-username-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addFriend();
        });

        // Сообщения
        document.getElementById('send-btn').addEventListener('click', () => this.sendMessage());
        document.getElementById('message-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });

        // Эмодзи
        document.getElementById('emoji-btn').addEventListener('click', () => this.toggleEmojiPicker());
        
        // Настройки
        document.getElementById('settings-btn').addEventListener('click', () => this.showSettings());
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.changeTheme(e.target));
        });

        // Сохранение профиля
        document.getElementById('save-profile-btn').addEventListener('click', () => this.saveProfile());

        // Модальные окна
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.hideModal(modal);
            });
        });

        // Закрытие модальных окон при клике на крестик
        const closeButtons = document.querySelectorAll('.modal .close');
        if (closeButtons.length === 0) {
            // Добавляем крестики если их нет
            document.querySelectorAll('.modal .modal-content').forEach(content => {
                const closeBtn = document.createElement('span');
                closeBtn.className = 'close';
                closeBtn.innerHTML = '&times;';
                closeBtn.style.cssText = `
                    position: absolute;
                    top: 15px;
                    right: 15px;
                    font-size: 24px;
                    cursor: pointer;
                    color: var(--text-secondary);
                `;
                closeBtn.addEventListener('click', () => {
                    this.hideModal(content.closest('.modal'));
                });
                content.style.position = 'relative';
                content.appendChild(closeBtn);
            });
        } else {
            closeButtons.forEach(close => {
                close.addEventListener('click', (e) => {
                    this.hideModal(e.target.closest('.modal'));
                });
            });
        }
    }

    // ИСПРАВЛЕННЫЙ МЕТОД ПЕРЕКЛЮЧЕНИЯ ВКЛАДОК
    switchAuthTab(clickedTab) {
        const tabName = clickedTab.dataset.tab;
        
        // Убираем активный класс у всех вкладок и форм
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        
        // Добавляем активный класс выбранной вкладке и форме
        clickedTab.classList.add('active');
        document.getElementById(`${tabName}-form`).classList.add('active');
        
        console.log('Переключено на вкладку:', tabName); // Для отладки
    }

    switchChannelTab(clickedTab) {
        const tabName = clickedTab.dataset.tab;
        
        document.querySelectorAll('.channel-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        clickedTab.classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');
    }

    async handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        this.showLoading(true);

        try {
            if (this.useLocalStorage) {
                // Логин через localStorage
                const users = JSON.parse(localStorage.getItem('messenger_users')) || [];
                const user = users.find(u => u.email === email && u.password === password);
                
                if (user) {
                    this.currentUser = user;
                    localStorage.setItem('currentUser', JSON.stringify(user));
                    this.showNotification('Успешный вход!', 'success');
                    await this.delay(1000); // Задержка для показа уведомления
                    this.showApp();
                    this.loadUserData();
                } else {
                    this.showNotification('Неверный email или пароль', 'error');
                }
            } else {
                // Логин через Supabase
                const { data, error } = await this.supabase.auth.signInWithPassword({
                    email,
                    password
                });

                if (error) {
                    this.showNotification('Ошибка входа: ' + error.message, 'error');
                } else {
                    this.currentUser = data.user;
                    this.showNotification('Успешный вход!', 'success');
                    await this.delay(1000);
                    await this.loadUserData();
                    this.showApp();
                }
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

        this.showLoading(true);

        try {
            if (this.useLocalStorage) {
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
                
                this.showNotification('Регистрация успешна!', 'success');
                await this.delay(1500);
                
                // Автоматически переключаем на вкладку входа
                this.switchAuthTab(document.querySelector('.auth-tab[data-tab="login"]'));
                
                // Очищаем форму
                document.getElementById('register-form').reset();
                
            } else {
                // Регистрация через Supabase
                const { data, error } = await this.supabase.auth.signUp({
                    email,
                    password
                });

                if (error) {
                    this.showNotification('Ошибка регистрации: ' + error.message, 'error');
                    return;
                }

                const { error: profileError } = await this.supabase
                    .from('users')
                    .insert([
                        {
                            id: data.user.id,
                            username,
                            email,
                            avatar_url: '',
                            badges: ['early']
                        }
                    ]);

                if (profileError) {
                    this.showNotification('Ошибка создания профиля: ' + profileError.message, 'error');
                } else {
                    this.showNotification('Регистрация успешна! Проверьте email для подтверждения.', 'success');
                    await this.delay(2000);
                    this.switchAuthTab(document.querySelector('.auth-tab[data-tab="login"]'));
                    document.getElementById('register-form').reset();
                }
            }
        } catch (error) {
            this.showNotification('Ошибка при регистрации', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    fallbackToLocalStorage() {
        console.log('Using localStorage fallback');
        this.useLocalStorage = true;
        this.initLocalStorage();
    }

    initLocalStorage() {
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
                }
            ];
            localStorage.setItem('messenger_users', JSON.stringify(defaultUsers));
        }

        if (!localStorage.getItem('messenger_servers')) {
            const defaultServer = {
                id: '1',
                name: 'Демо сервер',
                owner_id: '1',
                channels: [
                    { id: '1', name: 'общий', type: 'text' },
                    { id: '2', name: 'музыка', type: 'text' }
                ],
                members: ['1', '2'],
                created_at: new Date().toISOString()
            };
            localStorage.setItem('messenger_servers', JSON.stringify([defaultServer]));
        }

        if (!localStorage.getItem('messenger_messages')) {
            localStorage.setItem('messenger_messages', JSON.stringify([]));
        }

        if (!localStorage.getItem('messenger_friends')) {
            localStorage.setItem('messenger_friends', JSON.stringify([]));
        }
    }

    checkPreviousAuth() {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.showApp();
            this.loadUserData();
        } else {
            this.showAuth();
        }
    }

    showAuth() {
        document.getElementById('auth-page').classList.remove('hidden');
        document.getElementById('app').classList.add('hidden');
    }

    showApp() {
        document.getElementById('auth-page').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
        this.updateUserPanel();
    }

    showLoading(show) {
        const loading = document.getElementById('loading');
        if (show) {
            loading.classList.remove('hidden');
        } else {
            loading.classList.add('hidden');
        }
    }

    showNotification(message, type = 'info', duration = 5000) {
        const container = document.getElementById('notifications');
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
            setTimeout(() => notification.remove(), 300);
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

    // Другие методы (loadUserData, loadServers, loadFriends, и т.д.)
    async loadUserData() {
        if (this.useLocalStorage) {
            await this.loadServers();
            await this.loadFriends();
        } else {
            // Supabase методы
            await this.loadServers();
            await this.loadFriends();
        }
    }

    async loadServers() {
        if (this.useLocalStorage) {
            this.servers = JSON.parse(localStorage.getItem('messenger_servers')) || [];
            this.renderServers();
        } else {
            // Supabase реализация
        }
    }

    async loadFriends() {
        if (this.useLocalStorage) {
            this.friends = JSON.parse(localStorage.getItem('messenger_friends')) || [];
            this.renderFriends();
        } else {
            // Supabase реализация
        }
    }

    renderServers() {
        const serverList = document.getElementById('server-list');
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
        friendsList.innerHTML = '';

        // Для демо - используем пользователей из localStorage как друзей
        const users = JSON.parse(localStorage.getItem('messenger_users')) || [];
        const otherUsers = users.filter(user => user.id !== this.currentUser?.id);

        otherUsers.forEach(user => {
            const friendElement = document.createElement('div');
            friendElement.className = 'friend-item';
            friendElement.innerHTML = `
                <div class="user-avatar">${user.username.charAt(0).toUpperCase()}</div>
                <span class="username">${user.username}</span>
                <div class="user-status ${user.status}"></div>
                <div class="badges">
                    ${user.badges.map(badge => `<span class="badge ${badge}">${badge}</span>`).join('')}
                </div>
            `;
            friendElement.addEventListener('click', () => this.startDM(user));
            friendsList.appendChild(friendElement);
        });
    }

    updateUserPanel() {
        if (this.currentUser) {
            document.getElementById('panel-username').textContent = this.currentUser.username;
            // Для аватара используем первую букву имени
            const avatarElement = document.getElementById('user-avatar');
            if (avatarElement.tagName === 'IMG') {
                avatarElement.alt = this.currentUser.username;
                // Можно добавить заглушку для изображения
            }
        }
    }

    // Заглушки для остальных методов
    async createServer() {
        const input = document.getElementById('server-name-input');
        const name = input.value.trim();
        
        if (!name) {
            this.showNotification('Введите название сервера', 'warning');
            return;
        }

        this.showNotification(`Сервер "${name}" создан!`, 'success');
        this.hideModal(document.getElementById('server-create-modal'));
        input.value = '';
    }

    async addFriend() {
        const input = document.getElementById('friend-username-input');
        const username = input.value.trim();
        
        if (!username) {
            this.showNotification('Введите имя пользователя', 'warning');
            return;
        }

        this.showNotification(`Запрос дружбы отправлен пользователю ${username}`, 'success');
        input.value = '';
    }

    async sendMessage() {
        const input = document.getElementById('message-input');
        const content = input.value.trim();
        
        if (!content) return;

        this.showNotification('Сообщение отправлено', 'success');
        input.value = '';
    }

    showCreateServerModal() {
        this.showModal(document.getElementById('server-create-modal'));
    }

    showSettings() {
        this.showModal(document.getElementById('settings-modal'));
        this.loadSettings();
    }

    loadSettings() {
        if (this.currentUser) {
            document.getElementById('settings-username').value = this.currentUser.username;
        }
    }

    saveProfile() {
        const username = document.getElementById('settings-username').value.trim();
        if (username && this.currentUser) {
            this.currentUser.username = username;
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            
            // Обновляем пользователя в localStorage
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
    }

    changeTheme(clickedButton) {
        const theme = clickedButton.dataset.theme;
        
        document.querySelectorAll('.theme-btn').forEach(btn => btn.classList.remove('active'));
        clickedButton.classList.add('active');
        
        document.body.className = `theme-${theme}`;
        localStorage.setItem('theme', theme);
        this.showNotification(`Тема изменена на ${theme}`, 'success');
    }

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

    insertEmoji(emoji) {
        const input = document.getElementById('message-input');
        input.value += emoji;
        input.focus();
        this.toggleEmojiPicker();
    }

    toggleEmojiPicker() {
        const picker = document.getElementById('emoji-picker');
        if (picker) {
            picker.classList.toggle('hidden');
        }
    }

    showModal(modal) {
        modal.classList.add('active');
    }

    hideModal(modal) {
        modal.classList.remove('active');
    }

    startDM(user) {
        this.showNotification(`Открыт чат с ${user.username}`, 'info');
    }

    selectServer(server) {
        this.showNotification(`Выбран сервер: ${server.name}`, 'info');
    }
}

// Инициализация приложения
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new MaxMessenger();
    
    // Восстанавливаем тему из localStorage
    const savedTheme = localStorage.getItem('theme') || 'gray';
    document.body.className = `theme-${savedTheme}`;
    
    // Устанавливаем активную кнопку темы
    const themeBtn = document.querySelector(`.theme-btn[data-theme="${savedTheme}"]`);
    if (themeBtn) {
        document.querySelectorAll('.theme-btn').forEach(btn => btn.classList.remove('active'));
        themeBtn.classList.add('active');
    }
});
