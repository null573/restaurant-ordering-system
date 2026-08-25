import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { Lazyload, Toast, Dialog, NumberKeyboard } from 'vant';
import App from './App.vue';
import router from './router';
import 'vant/lib/index.css';
import './styles/global.css';
const app = createApp(App);
app.use(createPinia());
app.use(router);
app.use(Lazyload);
app.use(Toast);
app.use(Dialog);
app.use(NumberKeyboard);
app.mount('#app');
//# sourceMappingURL=main.js.map