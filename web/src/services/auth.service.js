import api from './api';

const authService = {
  async register(nome, email, senha, telefone) {
    const { data } = await api.post('/auth/register', { nome, email, senha, telefone });
    return data;
  },

  async login(email, senha) {
    const { data } = await api.post('/auth/login', { email, senha });
    localStorage.setItem('driverlucro_token', data.token);
    localStorage.setItem('driverlucro_user', JSON.stringify(data.user));
    return data;
  },

  logout() {
    localStorage.removeItem('driverlucro_token');
    localStorage.removeItem('driverlucro_user');
  },

  getToken() {
    return localStorage.getItem('driverlucro_token');
  },

  getUser() {
    const user = localStorage.getItem('driverlucro_user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated() {
    return !!this.getToken();
  }
};

export default authService;