# 🚀 Guía de Deploy en Vercel

## Pasos para Deploy

### 1. Preparar el Repositorio

Asegúrate de que todos los cambios estén commiteados y pusheados a tu repositorio.

### 2. Configurar Variables de Entorno en Vercel

1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. Crea un nuevo proyecto o selecciona uno existente
3. Ve a **Settings** > **Environment Variables**
4. Agrega las siguientes variables (todas deben tener el prefijo `PUBLIC_`):

```
PUBLIC_FIREBASE_API_KEY=tu_api_key
PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
PUBLIC_FIREBASE_PROJECT_ID=tu_proyecto_id
PUBLIC_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
PUBLIC_FIREBASE_APP_ID=tu_app_id
```

**Importante**: Configura estas variables para todos los ambientes (Production, Preview, Development).

### 3. Configurar Firestore Rules

Antes del deploy, asegúrate de que las reglas de Firestore estén configuradas:

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a **Firestore Database** > **Rules**
4. Copia el contenido de `firestore.rules` y pégalo en las reglas
5. Haz clic en **Publish**

### 4. Deploy Automático (Recomendado)

1. Conecta tu repositorio de GitHub/GitLab/Bitbucket a Vercel
2. Vercel detectará automáticamente que es un proyecto Astro
3. El deploy se ejecutará automáticamente en cada push a la rama principal

### 5. Deploy Manual

Si prefieres hacer deploy manual:

```bash
# Instalar Vercel CLI globalmente
npm install -g vercel

# Login en Vercel
vercel login

# Deploy
vercel

# Para producción
vercel --prod
```

## Configuración del Proyecto

El proyecto está configurado con:

- **Output**: Static (SSG)
- **Adapter**: @astrojs/vercel/static
- **Framework**: Astro + React

## Verificación Post-Deploy

Después del deploy, verifica:

1. ✅ La aplicación carga correctamente
2. ✅ Las variables de entorno están disponibles (revisa la consola del navegador)
3. ✅ Firebase se conecta correctamente
4. ✅ Las reglas de Firestore permiten las operaciones necesarias

## Troubleshooting

### Error: Variables de entorno no encontradas

- Verifica que todas las variables tengan el prefijo `PUBLIC_`
- Asegúrate de que estén configuradas para el ambiente correcto (Production/Preview)

### Error: Firebase no se conecta

- Verifica que las credenciales de Firebase sean correctas
- Revisa la consola del navegador para errores específicos
- Asegúrate de que el dominio esté autorizado en Firebase Console

### Error: Permisos de Firestore

- Verifica que las reglas de Firestore estén publicadas
- Revisa que las reglas permitan las operaciones necesarias

## Notas Importantes

- El proyecto usa `sessionStorage` en lugar de `localStorage` para permitir múltiples sesiones en diferentes pestañas
- Todos los componentes React usan `client:only` para evitar problemas de hidratación
- El build genera archivos estáticos optimizados para producción
