import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Intercepta requisições para adicionar o token de autenticação
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Intercepta respostas para deslogar em caso de erro 401 (Não Autorizado)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const token = localStorage.getItem('token');
      if (token) {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  me: () => api.get('/auth/me'),
};

export const fluxoService = {
  listar: () => api.get('/fluxos'),
  obter: (id) => api.get(`/fluxos/${id}`),
  criar: (data) => api.post('/fluxos', data),
  atualizar: (id, data) => api.put(`/fluxos/${id}`, data),
  deletar: (id) => api.delete(`/fluxos/${id}`),
  duplicar: (id) => api.post(`/fluxos/${id}/duplicar`),
};

export const numeroService = {
  listar: () => api.get('/numeros'),
  criar: (data) => api.post('/numeros', data),
  atualizar: (id, data) => api.put(`/numeros/${id}`, data),
  deletar: (id) => api.delete(`/numeros/${id}`),
};

export const conexaoService = {
  listar: () => api.get('/conexoes'),
  criar: (data) => api.post('/conexoes', data),
  status: (id) => api.get(`/conexoes/${id}/status`),
  atualizar: (id, data) => api.put(`/conexoes/${id}`, data),
  deletar: (id, senha) => api.delete(`/conexoes/${id}`, { data: { senha } }),
  logout: (id) => api.post(`/conexoes/${id}/logout`),
  reconectar: (id) => api.post(`/conexoes/${id}/reconectar`),
  verificarSenha: (id, senha) => api.post(`/conexoes/${id}/verificar-senha`, { senha }),
  contatos: (id) => api.get(`/conexoes/${id}/contatos`),
  fotoContato: (id, numero) => api.get(`/conexoes/${id}/foto-contato?numero=${numero}`),
};

export const mensagemAutoService = {
  listar: () => api.get('/mensagens-auto'),
  criar: (data) => api.post('/mensagens-auto', data),
  atualizar: (id, data) => api.put(`/mensagens-auto/${id}`, data),
  deletar: (id) => api.delete(`/mensagens-auto/${id}`),
  grupos: (conexaoId) => api.get(`/mensagens-auto/grupos/${conexaoId}`),
  enviar: (id) => api.post(`/mensagens-auto/${id}/enviar`),
};

export const mensagemIndividualService = {
  listar: () => api.get('/mensagens-individuais'),
  criar: (data) => api.post('/mensagens-individuais', data),
  atualizar: (id, data) => api.put(`/mensagens-individuais/${id}`, data),
  deletar: (id) => api.delete(`/mensagens-individuais/${id}`),
  enviar: (id) => api.post(`/mensagens-individuais/${id}/enviar`),
};

export default api;
