import { createApp } from 'vue'
import App from './App.vue'
import store from "@/store";

const app = createApp(App);
app.use(store).mount('#mcmap');