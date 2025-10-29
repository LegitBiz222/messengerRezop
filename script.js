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
        
        this.init();
    }

    async init() {
        console.log('Initializing Max Messenger with Supabase...');
        await this.initializeSupabase();
        this.setupEventListeners();
        this.loadEmojis();
        this.checkPreviousAuth();
        this.applySavedTheme();
    }

    async initializeSupabase() {
        const SUPABASE_URL = 'https://yizjvfyloyemelbvpxst.supabase.co';
        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlpemp2Znlsb3llbWVsYnZweHN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2NTg4ODYsImV4cCI6MjA3NzIzNDg4Nn0.GpUcpeXJCuBFXpFGvTKeIVSi5248KVZSFyMd6NeuJVw';
        
        try {
            this.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('Supabase initialized successfully');
            
            // Проверяем соединение
            const { data, error } = await this.supabase.from('users').select('count');
            if (error) {
                console.error('Supabase connection test failed:', error);
                this.fallbackToLocalStorage();
            } else {
                console.log('Supabase connection successful');
            }
        } catch (error) {
            console.error('Supabase init error:', error);
            this.fallbackToLocalStorage();
        }
    }

    fallbackToLocalStorage() {
        console.log('Falling back to localStorage');
        this.useLocalStorage = true;
        this.initLocalStorage();
    }

    initLocalStorage() {
        // ... (ваш существующий код localStorage)
    }

    // АУТЕНТИФИКАЦИЯ
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
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;

        if (!username || !email || !password) {
            this.showNotification('Заполните все поля', 'error');
            return;
        }

        this.showLoading(true);

        try {
            if (this.useLocalStorage) {
                // Регистрация через localStorage
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
                this.switchAuthTab(document.querySelector('.auth-tab[data-tab="login"]'));
                document.getElementById('register-form').reset();
                
            } else {
                // Регистрация через Supabase
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
                    if (error.code === '23505') { // Unique violation
                        this.showNotification('Пользователь с таким email или именем уже существует', 'error');
                    } else {
                        this.showNotification('Ошибка при регистрации: ' + error.message, 'error');
                    }
                } else {
                    this.showNotification('Регистрация успешна! Теперь вы можете войти.', 'success');
                    await this.delay(2000);
                    this.switchAuthTab(document.querySelector('.auth-tab[data-tab="login"]'));
                    document.getElementById('register-form').reset();
                }
            }
        } catch (error) {
            this.showNotification('Ошибка при регистрации', 'error');
            console.error('Registration error:', error);
        } finally {
            this.showLoading(false);
        }
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

    // СИСТЕМА ДРУЗЕЙ С SUPABASE
    async sendFriendRequest() {
        const usernameInput = document.getElementById('friend-username-input');
        const discriminatorInput = document.getElementById('friend-discriminator-input');
        
        const username = usernameInput.value.trim();
        const discriminator = discriminatorInput.value.trim();

        if (!username || !discriminator) {
            this.showNotification('Введите имя пользователя и тег', 'error');
            return;
        }

        try {
            if (this.useLocalStorage) {
                // localStorage логика
            } else {
                // Находим пользователя в Supabase
                const { data: targetUser, error } = await this.supabase
                    .from('users')
                    .select('*')
                    .eq('username', username)
                    .eq('discriminator', discriminator)
                    .single();

                if (error || !targetUser) {
                    this.showNotification('Пользователь не найден', 'error');
                    return;
                }

                if (targetUser.id === this.currentUser.id) {
                    this.showNotification('Нельзя отправить запрос самому себе', 'error');
                    return;
                }

                // Проверяем, не отправлен ли уже запрос
                const { data: existingRequest } = await this.supabase
                    .from('friend_requests')
                    .select('*')
                    .or(`and(from_user_id.eq.${this.currentUser.id},to_user_id.eq.${targetUser.id}),and(from_user_id.eq.${targetUser.id},to_user_id.eq.${this.currentUser.id})`)
                    .single();

                if (existingRequest) {
                    this.showNotification('Запрос уже отправлен', 'warning');
                    return;
                }

                // Отправляем запрос
                const { error: requestError } = await this.supabase
                    .from('friend_requests')
                    .insert([
                        {
                            from_user_id: this.currentUser.id,
                            to_user_id: targetUser.id,
                            status: 'pending'
                        }
                    ]);

                if (requestError) {
                    this.showNotification('Ошибка при отправке запроса: ' + requestError.message, 'error');
                } else {
                    this.showNotification(`Запрос отправлен пользователю ${username}#${discriminator}`, 'success');
                    this.hideModal(document.getElementById('add-friend-modal'));
                    usernameInput.value = '';
                    discriminatorInput.value = '';
                }
            }
        } catch (error) {
            this.showNotification('Ошибка при отправке запроса', 'error');
            console.error('Send friend request error:', error);
        }
    }

    async loadFriendRequests() {
        try {
            if (this.useLocalStorage) {
                // localStorage логика
            } else {
                // Загружаем входящие запросы
                const { data: incomingRequests, error } = await this.supabase
                    .from('friend_requests')
                    .select(`
                        *,
                        from_user:users!friend_requests_from_user_id_fkey(*)
                    `)
                    .eq('to_user_id', this.currentUser.id)
                    .eq('status', 'pending');

                if (error) throw error;

                this.incomingRequests = incomingRequests || [];
                this.updatePendingCount();
                return this.incomingRequests;
            }
        } catch (error) {
            console.error('Load friend requests error:', error);
            return [];
        }
    }

    async acceptFriendRequest(requestId) {
        try {
            if (this.useLocalStorage) {
                // localStorage логика
            } else {
                // Обновляем статус запроса
                const { error: updateError } = await this.supabase
                    .from('friend_requests')
                    .update({ status: 'accepted' })
                    .eq('id', requestId);

                if (updateError) throw updateError;

                // Получаем информацию о запросе
                const { data: request, error: requestError } = await this.supabase
                    .from('friend_requests')
                    .select('*')
                    .eq('id', requestId)
                    .single();

                if (requestError) throw requestError;

                // Создаем дружеские отношения
                const { error: friendshipError } = await this.supabase
                    .from('friendships')
                    .insert([
                        {
                            user1_id: request.from_user_id,
                            user2_id: request.to_user_id,
                            status: 'accepted'
                        }
                    ]);

                if (friendshipError) throw friendshipError;

                this.showNotification('Запрос в друзья принят', 'success');
                await this.loadFriends();
                await this.loadFriendRequests();
                this.hideModal(document.getElementById('friend-requests-modal'));
            }
        } catch (error) {
            this.showNotification('Ошибка при принятии запроса', 'error');
            console.error('Accept friend request error:', error);
        }
    }

    async denyFriendRequest(requestId) {
        try {
            if (this.useLocalStorage) {
                // localStorage логика
            } else {
                const { error } = await this.supabase
                    .from('friend_requests')
                    .delete()
                    .eq('id', requestId);

                if (error) throw error;

                this.showNotification('Запрос в друзья отклонен', 'info');
                await this.loadFriendRequests();
            }
        } catch (error) {
            this.showNotification('Ошибка при отклонении запроса', 'error');
            console.error('Deny friend request error:', error);
        }
    }

    async loadFriends() {
        try {
            if (this.useLocalStorage) {
                // localStorage логика
            } else {
                const { data: friendships, error } = await this.supabase
                    .from('friendships')
                    .select(`
                        *,
                        user1:users!friendships_user1_id_fkey(*),
                        user2:users!friendships_user2_id_fkey(*)
                    `)
                    .or(`user1_id.eq.${this.currentUser.id},user2_id.eq.${this.currentUser.id}`)
                    .eq('status', 'accepted');

                if (error) throw error;

                this.friends = (friendships || []).map(friendship => {
                    return friendship.user1_id === this.currentUser.id ? friendship.user2 : friendship.user1;
                });

                this.renderFriends();
            }
        } catch (error) {
            console.error('Load friends error:', error);
            this.friends = [];
        }
    }

    // СИСТЕМА СЕРВЕРОВ С SUPABASE
    async createServer() {
        const nameInput = document.getElementById('server-name-input');
        const serverName = nameInput.value.trim();

        if (!serverName) {
            this.showNotification('Введите название сервера', 'error');
            return;
        }

        try {
            if (this.useLocalStorage) {
                // localStorage логика
            } else {
                // Создаем сервер
                const { data: server, error: serverError } = await this.supabase
                    .from('servers')
                    .insert([
                        {
                            name: serverName,
                            owner_id: this.currentUser.id
                        }
                    ])
                    .select()
                    .single();

                if (serverError) throw serverError;

                // Добавляем создателя в участники
                const { error: memberError } = await this.supabase
                    .from('server_members')
                    .insert([
                        {
                            server_id: server.id,
                            user_id: this.currentUser.id,
                            role: 'owner'
                        }
                    ]);

                if (memberError) throw memberError;

                // Создаем стандартные каналы
                const { error: channelsError } = await this.supabase
                    .from('channels')
                    .insert([
                        { server_id: server.id, name: 'общий', type: 'text' },
                        { server_id: server.id, name: 'голосовой', type: 'voice' }
                    ]);

                if (channelsError) throw channelsError;

                this.showNotification(`Сервер "${serverName}" создан!`, 'success');
                this.hideModal(document.getElementById('server-create-modal'));
                nameInput.value = '';
                await this.loadServers();
            }
        } catch (error) {
            this.showNotification('Ошибка при создании сервера: ' + error.message, 'error');
            console.error('Create server error:', error);
        }
    }

    async loadServers() {
        try {
            if (this.useLocalStorage) {
                // localStorage логика
            } else {
                const { data: servers, error } = await this.supabase
                    .from('servers')
                    .select(`
                        *,
                        server_members!inner(*)
                    `)
                    .eq('server_members.user_id', this.currentUser.id);

                if (error) throw error;

                this.servers = servers || [];
                this.renderServers();
            }
        } catch (error) {
            console.error('Load servers error:', error);
            this.servers = [];
        }
    }

    // СИСТЕМА ПРОФИЛЯ С SUPABASE
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

        try {
            if (this.useLocalStorage) {
                // localStorage логика
            } else {
                const { error } = await this.supabase
                    .from('users')
                    .update({
                        username,
                        discriminator,
                        bio,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', this.currentUser.id);

                if (error) {
                    if (error.code === '23505') {
                        this.showNotification('Пользователь с таким именем уже существует', 'error');
                    } else {
                        throw error;
                    }
                } else {
                    // Обновляем текущего пользователя
                    this.currentUser.username = username;
                    this.currentUser.discriminator = discriminator;
                    this.currentUser.bio = bio;
                    localStorage.setItem('currentUser', JSON.stringify(this.currentUser));

                    this.updateUserPanel();
                    this.showNotification('Профиль обновлен', 'success');
                }
            }
        } catch (error) {
            this.showNotification('Ошибка при обновлении профиля: ' + error.message, 'error');
            console.error('Save profile error:', error);
        }
    }

    async upgradeToNitro() {
        try {
            if (this.useLocalStorage) {
                // localStorage логика
            } else {
                const { error } = await this.supabase
                    .from('users')
                    .update({
                        nitro: true,
                        badges: this.supabase.sql`array_append(badges, 'nitro')`,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', this.currentUser.id);

                if (error) throw error;

                // Обновляем текущего пользователя
                this.currentUser.nitro = true;
                this.currentUser.badges.push('nitro');
                localStorage.setItem('currentUser', JSON.stringify(this.currentUser));

                this.showNotification('Nitro активирован! Теперь вам доступны премиум функции', 'success');
                this.renderUserBadges();
            }
        } catch (error) {
            this.showNotification('Ошибка при активации Nitro: ' + error.message, 'error');
            console.error('Upgrade to nitro error:', error);
        }
    }

    // REAL-TIME ПОДПИСКИ
    setupRealtimeSubscriptions() {
        if (this.useLocalStorage) return;

        // Подписка на новые сообщения в ЛС
        this.supabase
            .channel('direct_messages')
            .on('postgres_changes', 
                { event: 'INSERT', schema: 'public', table: 'direct_messages' },
                (payload) => {
                    if (this.currentChat && 
                        ((payload.new.user1_id === this.currentUser.id && payload.new.user2_id === this.currentChat.user.id) ||
                         (payload.new.user2_id === this.currentUser.id && payload.new.user1_id === this.currentChat.user.id))) {
                        this.loadDMMessages(this.currentChat.user.id);
                    }
                }
            )
            .subscribe();

        // Подписка на новые запросы в друзья
        this.supabase
            .channel('friend_requests')
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'friend_requests' },
                (payload) => {
                    if (payload.new.to_user_id === this.currentUser.id) {
                        this.showNotification(`Новый запрос в друзья от ${payload.new.from_user_id}`, 'info');
                        this.loadFriendRequests();
                    }
                }
            )
            .subscribe();

        // Подписка на обновления статусов друзей
        this.supabase
            .channel('user_status')
            .on('postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'users' },
                (payload) => {
                    const friend = this.friends.find(f => f.id === payload.new.id);
                    if (friend) {
                        friend.status = payload.new.status;
                        this.renderFriends();
                    }
                }
            )
            .subscribe();
    }

    // ОСТАЛЬНЫЕ МЕТОДЫ (остаются похожими, но с проверкой useLocalStorage)
    async loadUserData() {
        await this.loadServers();
        await this.loadFriends();
        await this.loadFriendRequests();
        
        if (!this.useLocalStorage) {
            this.setupRealtimeSubscriptions();
        }
    }

    renderFriendRequests(requests) {
        const container = document.getElementById('friend-requests-list');
        if (!container) return;

        container.innerHTML = '';

        requests.forEach(request => {
            const requestElement = document.createElement('div');
            requestElement.className = 'friend-request-item';
            requestElement.innerHTML = `
                <div class="user-avatar">${request.from_user.username.charAt(0)}</div>
                <div class="request-info">
                    <div class="username">${request.from_user.username}#${request.from_user.discriminator}</div>
                    <div class="request-time">${new Date(request.created_at).toLocaleDateString()}</div>
                </div>
                <div class="request-actions">
                    <button class="request-btn accept" data-id="${request.id}">Принять</button>
                    <button class="request-btn deny" data-id="${request.id}">Отклонить</button>
                </div>
            `;

            const acceptBtn = requestElement.querySelector('.request-btn.accept');
            const denyBtn = requestElement.querySelector('.request-btn.deny');

            acceptBtn.addEventListener('click', () => this.acceptFriendRequest(request.id));
            denyBtn.addEventListener('click', () => this.denyFriendRequest(request.id));

            container.appendChild(requestElement);
        });
    }

    // ... остальные методы рендеринга и utilities

    showApp() {
        document.getElementById('auth-page').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
        this.updateUserPanel();
        
        if (!this.useLocalStorage) {
            this.setupRealtimeSubscriptions();
        }
    }

    // ... остальные методы
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    window.messengerApp = new MaxMessenger();
});
