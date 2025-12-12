# Monopoly - Sistema de Pagos

Aplicación web mobile-first para gestionar pagos en tiempo real en un juego de Monopoly. Construida con Astro + React y Firebase Firestore.

## 🚀 Características

- **Registro simple**: Los jugadores se registran solo con su nombre
- **Transacciones en tiempo real**: Envía y recibe dinero del banco y otros jugadores
- **Sincronización en tiempo real**: Todos los cambios se reflejan instantáneamente para todos los usuarios
- **Historial de transacciones**: Visualiza todas las transacciones realizadas
- **Diseño mobile-first**: Optimizado para dispositivos móviles

## 📋 Requisitos Previos

- Node.js 18+ y npm
- Proyecto de Firebase con Firestore habilitado

## 🛠️ Instalación

1. Clona el repositorio e instala las dependencias:

```bash
npm install
```

2. Configura Firebase:

   - Crea un proyecto en [Firebase Console](https://console.firebase.google.com/)
   - Habilita Firestore Database (modo producción)
   - Obtén las credenciales de configuración de tu proyecto
   - Copia `env.example` a `.env` y completa las variables:

```bash
cp env.example .env
```

   - Edita `.env` con tus credenciales de Firebase:

```
PUBLIC_FIREBASE_API_KEY=tu_api_key
PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
PUBLIC_FIREBASE_PROJECT_ID=tu_proyecto_id
PUBLIC_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
PUBLIC_FIREBASE_APP_ID=tu_app_id
```

3. Configura las reglas de seguridad de Firestore:

   - Ve a [Firebase Console](https://console.firebase.google.com/) > Tu proyecto > Firestore Database > Reglas
   - Copia el contenido del archivo `firestore.rules` (incluido en este proyecto)
   - Pega las reglas en el editor de reglas de Firebase
   - Haz clic en "Publicar"

   **Alternativa rápida para desarrollo** (solo para pruebas):
   
   Si prefieres reglas más permisivas temporalmente para desarrollo, puedes usar:
   
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if true;
       }
     }
   }
   ```
   
   **⚠️ Advertencia**: Las reglas permisivas solo deben usarse para desarrollo. Para producción, usa las reglas del archivo `firestore.rules` que incluyen validaciones de seguridad.

## 🎮 Configuración del Juego

### Balance Inicial de los Jugadores

El balance inicial de los jugadores se configura en **Firestore** y se puede cambiar en cualquier momento. El valor por defecto es **$2500** si no hay configuración en Firestore.

#### Configurar el monto inicial en Firestore:

1. Ve a [Firebase Console](https://console.firebase.google.com/) > Tu proyecto > **Firestore Database** > **Datos**
2. Crea o edita el documento en la colección `gameConfig` con el ID `main`
3. Agrega el campo `initialBalance` con el valor deseado:

```json
{
  "initialBalance": 3000
}
```

**Nota**: Si no existe el documento `gameConfig/main`, se creará automáticamente con el valor por defecto de $2500 la primera vez que se registre un jugador.

#### Cambiar el monto después de crear jugadores:

- Al usar la función de **Resetear Juego**, los nuevos jugadores que se registren usarán el monto configurado en Firestore
- Los jugadores existentes mantendrán su balance actual hasta que se resetee el juego

## 🚀 Desarrollo

Inicia el servidor de desarrollo:

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:4321`

## 📦 Build

Para crear una build de producción:

```bash
npm run build
```

## 🚀 Deploy en Vercel

### Configuración para Vercel

1. **Instalar dependencias** (ya incluido en el proyecto):
   ```bash
   npm install
   ```

2. **Configurar variables de entorno en Vercel**:
   - Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
   - Settings > Environment Variables
   - Agrega todas las variables de `env.example`:
     - `PUBLIC_FIREBASE_API_KEY`
     - `PUBLIC_FIREBASE_AUTH_DOMAIN`
     - `PUBLIC_FIREBASE_PROJECT_ID`
     - `PUBLIC_FIREBASE_STORAGE_BUCKET`
     - `PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
     - `PUBLIC_FIREBASE_APP_ID`

3. **Deploy automático**:
   - Conecta tu repositorio de GitHub/GitLab/Bitbucket a Vercel
   - Vercel detectará automáticamente que es un proyecto Astro
   - El deploy se ejecutará automáticamente en cada push

4. **Deploy manual**:
   ```bash
   npm install -g vercel
   vercel
   ```

### Notas importantes:
- El proyecto está configurado como **static site** (SSG)
- Todas las variables de entorno deben tener el prefijo `PUBLIC_` para estar disponibles en el cliente
- Asegúrate de configurar las reglas de Firestore antes del deploy
- El adaptador de Vercel está configurado en `astro.config.mjs`

Para previsualizar la build:

```bash
npm run preview
```

## 📁 Estructura del Proyecto

```
monopoly/
├── src/
│   ├── components/
│   │   ├── MonopolyApp.tsx        # Componente principal de la app
│   │   ├── RegisterForm.tsx       # Formulario de registro
│   │   ├── PlayerList.tsx          # Lista de jugadores
│   │   ├── TransactionForm.tsx    # Formulario de transacciones
│   │   └── TransactionHistory.tsx # Historial de transacciones
│   ├── lib/
│   │   ├── firebase.ts             # Configuración de Firebase
│   │   ├── gameConfig.ts           # Configuración del juego
│   │   └── types.ts                # Tipos TypeScript
│   ├── pages/
│   │   └── index.astro             # Página principal
│   └── styles/
│       └── global.css              # Estilos globales
├── public/                         # Assets estáticos
└── package.json
```

## 🎯 Uso

1. **Registro**: Ingresa tu nombre para registrarte como jugador
2. **Ver jugadores**: Visualiza todos los jugadores y sus balances en tiempo real
3. **Realizar transacciones**: Selecciona un destinatario (banco o jugador) e ingresa el monto
4. **Historial**: Revisa todas las transacciones realizadas en el juego

## 🔧 Tecnologías

- [Astro](https://astro.build/) - Framework web
- [React](https://react.dev/) - Biblioteca UI
- [Firebase Firestore](https://firebase.google.com/docs/firestore) - Base de datos en tiempo real
- TypeScript - Tipado estático

## 🐛 Solución de Problemas

### Error: "Missing or insufficient permissions"

Este error indica que las reglas de seguridad de Firestore no están configuradas correctamente.

**Solución:**
1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a **Firestore Database** > **Reglas**
4. Asegúrate de que las reglas estén publicadas (puedes usar las del archivo `firestore.rules` o las reglas permisivas para desarrollo)
5. Haz clic en **Publicar**

### Error: Variables de entorno no configuradas

Si ves errores en la consola sobre variables de entorno:

1. Verifica que el archivo `.env` existe en la raíz del proyecto
2. Asegúrate de que todas las variables `PUBLIC_FIREBASE_*` estén definidas
3. Reinicia el servidor de desarrollo después de crear/modificar `.env`

### Errores de content_script.js

Los errores relacionados con `content_script.js` provienen de extensiones del navegador (como Cursor o otras herramientas de desarrollo) y no afectan el funcionamiento de la aplicación. Puedes ignorarlos de forma segura.

## 📝 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.
