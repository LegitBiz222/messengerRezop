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
        // Для GitHub Pages - используем demo credentials
        // В реальном проекте замените на свои
        const SUPABASE_URL = 'https://yizjvfyloyemelbvpxst.supabase.co';
        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlpemp2Znlsb3llbWVsYnZweHN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2NTg4ODYsImV4cCI6MjA3NzIzNDg4Nn0.GpUcpeXJCuBFXpFGvTKeIVSi5248KVZSFyMd6NeuJVw';
        
        try {
            this.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('Supabase initialized');
        } catch (error) {
            console.error('Supabase init error:', error);
            this.fallbackToLocalStorage();
        }
    }

    fallbackToLocalStorage() {
        console.log('Using localStorage fallback');
        // Простая имитация базы данных в localStorage
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
                    status: 'online'
                },
                {
                    id: '2', 
                    username: 'Алексей',
                    email: 'alex@example.com',
                    password: '123456',
                    avatar_url: '',
                    badges: ['nitro'],
                    status: 'online'
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
                members: ['1', '2']
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

    async handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        if (this.useLocalStorage) {
            // Логин через localStorage
            const users = JSON.parse(localStorage.getItem('messenger_users'));
            const user = users.find(u => u.email === email && u.password === password);
            
            if (user) {
                this.currentUser = user;
                localStorage.setItem('currentUser', JSON.stringify(user));
                this.showApp();
                this.loadUserData();
            } else {
                alert('Неверный email или пароль');
            }
        } else {
            // Логин через Supabase
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                alert('Ошибка входа: ' + error.message);
            } else {
                this.currentUser = data.user;
                await this.loadUserData();
                this.showApp();
            }
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;

        if (this.useLocalStorage) {
            const users = JSON.parse(localStorage.getItem('messenger_users'));
            const existingUser = users.find(u => u.email === email || u.username === username);
            
            if (existingUser) {
                alert('Пользователь с таким email или именем уже существует');
                return;
            }

            const newUser = {
                id: Date.now().toString(),
                username,
                email,
                password,
                avatar_url: '',
                badges: ['new_user'],
                status: 'online'
            };

            users.push(newUser);
            localStorage.setItem('messenger_users', JSON.stringify(users));
            
            alert('Регистрация успешна!');
            this.switchAuthTab({ target: document.querySelector('.auth-tab[data-tab="login"]') });
        } else {
            // Регистрация через Supabase
            const { data, error } = await this.supabase.auth.signUp({
                email,
                password
            });

            if (error) {
                alert('Ошибка регистрации: ' + error.message);
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
                alert('Ошибка создания профиля: ' + profileError.message);
            } else {
                alert('Регистрация успешна! Проверьте email для подтверждения.');
                this.switchAuthTab({ target: document.querySelector('.auth-tab[data-tab="login"]') });
            }
        }
    }

    // ... остальные методы остаются похожими, но с поддержкой localStorage
}
