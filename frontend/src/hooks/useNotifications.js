import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import toast from 'react-hot-toast';
import { useAuth } from '../App';

const SOCKET_URL = 'http://localhost:3001';

export const useNotifications = () => {
  const [socket, setSocket] = useState(null);
  const auth = useAuth();
  const user = auth?.user;

  useEffect(() => {
    if (user && user.id) {
      const newSocket = io(SOCKET_URL);
      setSocket(newSocket);
      
      newSocket.on('connect', () => {
        console.log('Socket connected');
        newSocket.emit('register', user.id);
      });
      
      newSocket.on('notification', (data) => {
        if (data.type === 'success') {
          toast.success(`${data.title}\n${data.message}`, {
            duration: 5000,
            position: 'top-right',
            icon: '🚚',
          });
        } else if (data.type === 'error') {
          toast.error(`${data.title}\n${data.message}`, {
            duration: 5000,
            position: 'top-right',
          });
        } else {
          toast(`${data.title}\n${data.message}`, {
            duration: 5000,
            position: 'top-right',
            icon: '📦',
          });
        }
      });
      
      return () => {
        newSocket.close();
      };
    }
  }, [user]);

  return socket;
};