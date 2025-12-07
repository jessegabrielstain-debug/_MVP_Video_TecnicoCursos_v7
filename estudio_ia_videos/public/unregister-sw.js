// Script para desregistrar Service Workers ativos
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      console.log('Desregistrando Service Worker:', registration.scope);
      registration.unregister();
    }
  });
}