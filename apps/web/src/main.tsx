import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { App } from './App';
import { AuthProvider } from './features/auth/AuthContext';

const container = document.getElementById('root');
if (container === null) {
  throw new Error('The #root element is missing from index.html.');
}

createRoot(container).render(
  <BrowserRouter>
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>
);
