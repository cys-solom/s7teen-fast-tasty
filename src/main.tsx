import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { setupGlobalErrorHandlers } from './utils/errorHandler';

// Configurar manejadores globales de errores
setupGlobalErrorHandlers();

// Wrap the app in a try-catch to prevent complete white screen
try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element not found');
  }
  
  // Create a basic error handler div to display instead of a blank screen
  const errorHandler = document.createElement('div');
  errorHandler.id = 'error-fallback';
  errorHandler.style.display = 'none';
  errorHandler.style.padding = '20px';
  errorHandler.style.margin = '20px';
  errorHandler.style.backgroundColor = '#fff8f8';
  errorHandler.style.border = '1px solid #ffb8b8';
  errorHandler.style.borderRadius = '8px';
  errorHandler.style.fontFamily = 'Tajawal, sans-serif';
  errorHandler.style.direction = 'rtl';
  errorHandler.style.textAlign = 'right';
  errorHandler.innerHTML = `
    <h2 style="color: #e53e3e; margin-bottom: 10px;">خطأ في تحميل التطبيق</h2>
    <p>حدث خطأ أثناء تحميل التطبيق. يرجى تحديث الصفحة أو المحاولة مرة أخرى لاحقًا.</p>
    <button onclick="window.location.reload()" style="background-color: #e53e3e; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-top: 10px;">إعادة تحميل الصفحة</button>
  `;
  document.body.appendChild(errorHandler);

  const root = createRoot(rootElement);

  root.render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>
  );
} catch (error) {
  console.error('Failed to render application:', error);
  // Show the error fallback instead of a blank page
  const errorFallback = document.getElementById('error-fallback');
  if (errorFallback) {
    errorFallback.style.display = 'block';
  }
}