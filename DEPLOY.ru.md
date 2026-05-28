# Деплой ArcQuest

Эта инструкция помогает задеплоить NFT-контракт достижений ArcQuest в Arc Testnet и опубликовать статический сайт игры.

## 1. Добавить Arc Testnet в кошелек

Официальные параметры Arc Testnet:

```text
Network name: Arc Testnet
RPC URL: https://rpc.testnet.arc.network
Chain ID: 5042002
Currency symbol: USDC
Explorer: https://testnet.arcscan.app
Faucet: https://faucet.circle.com
```

Перед деплоем и минтом возьми testnet USDC через faucet.

## 2. Задеплоить NFT-контракт через Remix

1. Открой https://remix.ethereum.org.
2. Создай файл `contracts/ArcQuestAchievements.sol`.
3. Вставь содержимое `contracts/ArcQuestAchievements.sol` из этого проекта.
4. Открой **Solidity Compiler**.
5. Выбери compiler `0.8.24` или более новый `0.8.x`.
6. Скомпилируй `ArcQuestAchievements.sol`.
7. Открой **Deploy & Run Transactions**.
8. В environment выбери **Injected Provider - MetaMask**.
9. Проверь, что MetaMask подключен к **Arc Testnet**.
10. Задеплой `ArcQuestAchievements`.
11. Скопируй адрес задеплоенного контракта.

## 3. Подключить фронтенд к контракту

Открой `src/main.js` и замени:

```js
const ACHIEVEMENT_CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000";
```

на адрес своего задеплоенного контракта.

## 4. Проверить минт локально

Кошелек обычно лучше работает с `http://localhost`, а не с `file://`.

Если установлен Node.js:

```bash
npm run start
```

Затем открой:

```text
http://localhost:4173
```

Флоу:

1. Открой Mission 01.
2. Пройди уровень.
3. Нажми **Mint NFT**.
4. Введи nickname.
5. Подтверди транзакцию в Arc Testnet.
6. Открой транзакцию в ArcScan.

## 5. Задеплоить сайт

ArcQuest — статический сайт. Подойдет любой static hosting:

- **Vercel:** импортируй GitHub repo с framework preset **Other**. Добавленный `vercel.json` запускает `node scripts/build-static.mjs` и публикует сгенерированную папку `public`.
- **Netlify:** деплой из GitHub или drag-and-drop папки проекта, publish directory `/`.
- **GitHub Pages:** запушь repo, затем включи Pages из ветки `main`, root.

Перед деплоем убедись, что `ACHIEVEMENT_CONTRACT_ADDRESS` заменен на адрес твоего контракта в Arc Testnet.

Если Vercel показывает только `Not found`, проверь две настройки:

1. **Root Directory** должен указывать на папку, где лежит `index.html`.
2. **Build Command** должен быть `node scripts/build-static.mjs`.
3. **Output Directory** должен быть `public`.
4. В задеплоенном GitHub commit должны быть `index.html`, `src/`, `scripts/build-static.mjs` и `vercel.json`.

## Важно

- В первой версии score считается на клиенте. Для testnet/demo это нормально, но это не anti-cheat защита.
- Один wallet может заминтить один NFT на каждый уровень.
- Nickname: 2-24 символа, можно использовать буквы, цифры, `.`, `_`, `-`.
- Картинка NFT генерируется контрактом как onchain SVG.
