/**
 * Utilidad para manejar errores relacionados con extensiones de navegador y promesas
 * Ayuda a prevenir errores como "A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received"
 */

// Función para detectar si hay errores de navegador/extensión y registrarlos de forma segura
export const handleBrowserError = (error: Error): void => {
  // Errores conocidos relacionados con extensiones o APIs de Chrome
  const isExtensionError = 
    error.message.includes("message channel closed") ||
    error.message.includes("runtime.lastError") ||
    error.message.includes("asynchronous response");
  
  if (isExtensionError) {
    // Registramos el error pero no lo propagamos para evitar que rompa la aplicación
    console.warn('Error de extensión del navegador detectado y manejado:', error.message);
  } else {
    // Para otros errores, los registramos normalmente
    console.error('Error no manejado:', error);
  }
};

// Envoltorio para promesas que podría resolver problemas con extensiones
export const safePromise = <T>(promise: Promise<T>): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    promise
      .then(resolve)
      .catch((error) => {
        // Manejamos los errores específicos del navegador
        if (
          error instanceof Error &&
          (error.message.includes("message channel closed") ||
           error.message.includes("runtime.lastError"))
        ) {
          handleBrowserError(error);
          // En este caso, resolvemos la promesa con un valor vacío para evitar que se rompa la aplicación
          resolve({} as T);
        } else {
          // Para otros errores, los rechazamos normalmente
          reject(error);
        }
      });
  });
};

// Función para añadir un manejador global de errores no capturados
export const setupGlobalErrorHandlers = (): void => {
  // Maneja errores no capturados en promesas
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;
    
    if (error instanceof Error && 
        (error.message.includes("message channel closed") ||
         error.message.includes("runtime.lastError"))) {
      // Previene que el error no manejado aparezca en la consola
      event.preventDefault();
      handleBrowserError(error);
    }
  });
  
  // Error handler global
  window.addEventListener('error', (event) => {
    if (event.error && 
        (event.error.message?.includes("message channel closed") ||
         event.error.message?.includes("runtime.lastError"))) {
      // Previene que el error aparezca en la consola
      event.preventDefault();
      handleBrowserError(event.error);
      return true; // Previene propagación del error
    }
    return false;
  });
};