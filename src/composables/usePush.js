import { ref } from 'vue';
import { supabase } from '../lib/supabaseClient';

export function usePush() {
  const isSupported = ref('serviceWorker' in navigator && 'PushManager' in window);
  const isSubscribed = ref(false);
  const permission = ref(Notification.permission);

  // Chave pública (igual a que geramos no .env)
  const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

  async function checkSubscription() {
    if (!isSupported.value) return;
    const registration = await navigator.serviceWorker.register('/sw.js');
    const subscription = await registration.pushManager.getSubscription();
    isSubscribed.value = !!subscription;
  }

  async function subscribe(usuarioId) {
    if (!isSupported.value) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
      });

      // Salvar no Supabase
      const { error } = await supabase.from('push_subscriptions').upsert({
        usuario_id: usuarioId,
        subscription: subscription
      }, { onConflict: 'usuario_id, subscription' });

      if (error) throw error;
      
      isSubscribed.value = true;
      permission.value = Notification.permission;
      alert('Notificações ativadas com sucesso!');
      
    } catch (err) {
      console.error('Erro ao assinar push:', err);
      alert('Erro ao ativar notificações. Verifique as permissões do navegador.');
    }
  }

  // Função auxiliar para converter a chave VAPID
  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  return {
    isSupported,
    isSubscribed,
    permission,
    checkSubscription,
    subscribe
  };
}
