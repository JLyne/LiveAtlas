import { createApp } from 'vue'
import App from './App.vue'
import {store} from "@/store";

import 'leaflet/dist/leaflet.css';
import 'normalize-scss/sass/normalize/_import-now.scss';
import '@/scss/style.scss';
// import './assets/css/rtgame.css';

const app = createApp(App).use(store);

// app.config.performance = true;
app.mount('#mcmap');