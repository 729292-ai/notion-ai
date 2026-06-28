# NoteAI — деплой за 3 минуты

## Вариант 1: Vercel (рекомендую, бесплатно)

1. Зайди на https://vercel.com и войди через GitHub
2. Нажми **"Add New Project"** → **"Import Git Repository"**
3. Загрузи папку проекта (или сначала залей на GitHub)
4. В разделе **Environment Variables** добавь:
   - Name: `REACT_APP_ANTHROPIC_KEY`
   - Value: твой ключ с https://console.anthropic.com/keys
5. Нажми **Deploy**
6. Через 2 минуты получишь ссылку вида `your-app.vercel.app`

## Вариант 2: Netlify (тоже бесплатно)

1. Зайди на https://netlify.com
2. Перетащи папку `build/` (после `npm run build`) прямо на страницу
3. В Site settings → Environment variables добавь `REACT_APP_ANTHROPIC_KEY`
4. Готово!

## Локальный запуск

```bash
cd notion-ai
npm install
REACT_APP_ANTHROPIC_KEY=sk-ant-ваш-ключ npm start
```

## Где взять API ключ

1. Зайди на https://console.anthropic.com/keys
2. Нажми **Create Key**
3. Скопируй ключ (начинается с `sk-ant-`)
4. Вставь в переменную окружения или прямо в приложении через кнопку 🔑

## Важно

API ключ можно также ввести прямо в приложении — кнопка **🔑 API ключ** в нижнем левом углу.
Ключ сохраняется только в браузере пользователя (localStorage).
