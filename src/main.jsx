import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.jsx';
import AdminPanel from './AdminPanel.jsx';
import './fonts.css';
import './style.css';
createRoot(document.getElementById('root')).render(window.location.pathname.startsWith('/admin')?<AdminPanel/>:<App/>);
