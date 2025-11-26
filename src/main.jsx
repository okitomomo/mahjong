import React from 'react';
import ReactDOM from 'react-dom/client';
import AppRoute from './routes/AppRoutes.jsx';
import './styles/input.css';

ReactDOM.createRoot(document.getElementById('app')).render(
    <React.StrictMode>
        <AppRoute />
    </React.StrictMode>
);