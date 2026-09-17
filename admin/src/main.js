import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'leaflet/dist/leaflet.css';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { ModuleRegistry } from 'ag-grid-community';
import './styles.css';

import { getToken, getStoredUser } from './api.js';
import { renderLogin } from './views/login.js';
import { renderApp } from './views/app.js';

ModuleRegistry.registerModules([ClientSideRowModelModule]);

const storedUser = getStoredUser();
if (getToken() && storedUser?.role === 'admin') renderApp(storedUser);
else renderLogin();
