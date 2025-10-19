import Axios from 'axios';
import { useAuth } from '@clerk/nextjs';

export function useAxios() {
  const { getToken } = useAuth();

  const instance = Axios.create({ baseURL: '' });

  instance.interceptors.request.use(async (cfg) => {
    const t = await getToken(); // uses default Clerk session JWT
    if (t) cfg.headers.Authorization = `Bearer ${t}`;
    return cfg;
  });

  return instance;
}