// Простой и рабочий мессенджер
class Messenger {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuth();
    }

    setupEventListeners() {
        // Вкладки аутентификации
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchAuthTab(e.target);
            });
        });

        // Формы
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        document.getElementById('register-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });

        // Кнопки в приложении
        document.getElementById('add-server-btn').addEventListener('click', () => {
            this.showModal('server-create-modal');
        });

        document.getElementById('add-friend-btn').addEventListener('click', () => {
            this.showModal('add-friend-modal');
        });

        document.getElementById('settings-btn').addEventListener('click', () => {
            this.showModal('settings-modal');
        });

        document.getElementById('call-btn').addEventListener('click', () => {
            this.showNotification('Начинаем звонок...');
        });

        document.getElementById('send-btn').addEventListener('click', () => {
            this.sendMessage();
        });

        // Модальные окна
        document.getElementById('send-friend-request-btn').addEventListener('click', () => {
            this.sendFriendRequest();
        });

        document.getElementById('create-server-btn').addEventListener('click', () => {
            this.createServer();
        });

        document.getElementById('logout-btn').addEventListener('click', () => {
            this.logout();
        });

        // Закрытие модальных окон
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal(modal.id);
                }
            });
        });

        // Вкладки каналов
        document.querySelectorAll('.channel-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchChannelTab(e.target);
            });
        });

        // Enter для отправки сообщений
        document.getElementById('message-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });
    }

    switchAuthTab(tab) {
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        
        tab.classList.add('active');
        document.getElementById(tab.dataset.tab + '-form').classList.add('active');
    }

    switchChannelTab(tab) {
        document.querySelectorAll('.channel-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.showNotification('Переключено на: ' + tab.textContent);
    }

    handleLogin() {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            this.currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            this.showApp();
            this.showNotification('Добро пожаловать, ' + user.username + '!');
        } else {
            this.showNotification('Неверный email или пароль', 'error');
        }
    }

    handleRegister() {
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;

        if (!username || !email || !password) {
            this.showNotification('Заполните все поля', 'error');
            return;
        }

        const users = JSON.parse(localStorage.getItem('users') || '[]');
        
        if (users.find(u => u.email === email)) {
            this.showNotification('Пользователь с таким email уже существует', 'error');
            return;
        }

        const newUser = {
            id: Date.now().toString(),
            username: username,
            email: email,
            password: password,
            avatar: username.charAt(0).toUpperCase()
        };

        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));

        this.showNotification('Регистрация успешна! Теперь войдите.');
        this.switchAuthTab(document.querySelector('.auth-tab[data-tab="login"]'));
        document.getElementById('register-form').reset();
    }

    showApp() {
        if (this.currentUser) {
            document.getElementById('panel-username').textContent = this.currentUser.username;
            document.getElementById('user-avatar').textContent = this.currentUser.avatar;
            document.getElementById('auth-page').classList.add('hidden');
            document.getElementById('app').classList.remove('hidden');
        }
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        document.getElementById('auth-page').classList.remove('hidden');
        document.getElementById('app').classList.add('hidden');
        this.hideModal('settings-modal');
        this.showNotification('Вы вышли из аккаунта');
    }

    showModal(modalId) {
        document.getElementById(modalId).classList.add('active');
    }

    hideModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
    }

    sendFriendRequest() {
        const username = document.getElementById('friend-username-input').value;
        if (username) {
            this.showNotification('Запрос отправлен пользователю ' + username);
            this.hideModal('add-friend-modal');
            document.getElementById('friend-username-input').value = '';
        } else {
            this.showNotification('Введите имя пользователя', 'error');
        }
    }

    createServer() {
        const serverName = document.getElementById('server-name-input').value;
        if (serverName) {
            this.showNotification('Сервер "' + serverName + '" создан!');
            this.hideModal('server-create-modal');
            document.getElementById('server-name-input').value = '';
        } else {
            this.showNotification('Введите название сервера', 'error');
        }
    }

    sendMessage() {
        const messageInput = document.getElementById('message-input');
        const message = messageInput.value.trim();
        
        if (message) {
            this.showNotification('Сообщение отправлено: ' + message);
            messageInput.value = '';
        }
    }

    showNotification(message, type = 'info') {
        // Простой alert для демонстрации
        alert(message);
    }

    checkAuth() {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.showApp();
        }

        // Создаем демо пользователя если нет пользователей
        if (!localStorage.getItem('users')) {
            const demoUsers = [
                {
                    id: '1',
                    username: 'DemoUser',
                    email: 'demo@example.com',
                    password: '123456',
                    avatar: 'D'
                }
            ];
            localStorage.setItem('users', JSON.stringify(demoUsers));
        }
    }
}

// Запуск приложения
document.addEventListener('DOMContentLoaded', () => {
    window.messenger = new Messenger();
});
