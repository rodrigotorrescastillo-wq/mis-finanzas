# 📱 MIS FINANZAS - Guía de Instalación

Bienvenido a tu app de gestión de gastos. Aquí están los pasos para instalarla en tu iPhone y Android.

---

## 🍎 PARA iPHONE (iOS)

### OPCIÓN A: Instalar como App (Recomendado) ⭐

1. **Abre Safari** en tu iPhone
2. **Copia en la barra de direcciones** esta URL:
   - Nota: Necesita estar alojada online. Por ahora, sigue la Opción B.

3. Una vez cargue la página, toca el ícono **"Compartir"** (↑ cuadrado)
4. Desplázate hacia la izquierda y toca **"Agregar a la pantalla de inicio"**
5. Dale un nombre (ej: "Mis Finanzas") y toca **"Añadir"**
6. ¡Listo! Ahora aparece como app en tu pantalla de inicio

### OPCIÓN B: Usar como Web (Mientras tanto)

1. **Abre Safari** en tu iPhone
2. Descarga todos los archivos juntos (carpeta)
3. Guarda el archivo `index.html` en iCloud Drive o Google Drive
4. Abre desde Safari y úsalo. iOS te permitirá guardarlo como app luego.

---

## 🤖 PARA ANDROID

### OPCIÓN A: Chrome (Mejor compatibilidad)

1. **Abre Chrome** en tu Android
2. **Coloca los archivos en una carpeta de un servidor web** (recomendado: GitHub Pages gratuito)
3. Abre la URL en Chrome
4. Toca el menú **⋮** (3 puntos) en la esquina superior derecha
5. Toca **"Instalar aplicación"** o **"Agregar a pantalla de inicio"**
6. Confirma y ¡listo!

### OPCIÓN B: Uso local (Más limitado)

1. Descarga todos los archivos a una carpeta en tu teléfono
2. Abre `index.html` con Chrome
3. Funciona pero sin todas las características offline

---

## 📤 ALTERNATIVA: GitHub Pages (Gratis y siempre disponible)

Para que la app funcione perfectamente desde cualquier dispositivo:

1. **Crea una cuenta en GitHub** (github.com) - es gratis
2. **Crea un repositorio público** llamado `mis-finanzas`
3. **Sube todos estos archivos** a la carpeta principal:
   - index.html
   - app.js
   - style.css
   - manifest.json
   - sw.js
   - icon-192.png
   - icon-512.png

4. Ve a **Settings → Pages** y activa GitHub Pages con la rama `main`
5. Tu URL será: `https://tunombre.github.io/mis-finanzas/`
6. ¡Abre esa URL en cualquier dispositivo y instala como app!

---

## ✨ CARACTERÍSTICAS

✅ **Múltiples usuarios/perfiles** - cada persona su propia cuenta  
✅ **Entrada por voz** - di "gasté 50 euros en supermercado"  
✅ **Seguridad** - contraseñas con hash SHA-256  
✅ **Offline** - funciona sin internet (datos guardados localmente)  
✅ **Análisis** - gráficas y tendencias de gastos  
✅ **Exportar CSV** - descarga tus datos como Excel  
✅ **Categorías** - Alimentos, Renta, Médico, Cuentas, Recreación, Vacaciones, etc.  
✅ **Vistas Mes/Año** - cambia el período en un toque  

---

## 🔐 SEGURIDAD

- Las contraseñas se guardan con **hash SHA-256**, nunca en texto plano
- Todos los datos se almacenan **localmente en tu dispositivo**
- No enviamos nada a servidores - es 100% privado
- Para cambiar o eliminar cuenta, se pide confirmar contraseña

---

## ❓ PREGUNTAS FRECUENTES

**P: ¿Funciona sin Internet?**  
A: Sí. Una vez cargada, funciona completamente offline. Los datos se guardan en el dispositivo.

**P: ¿Dónde se guardan mis datos?**  
A: En el almacenamiento local de tu navegador (localStorage). Solo tú tienes acceso.

**P: ¿Puedo usar la app en múltiples dispositivos?**  
A: No (por privacidad). Cada dispositivo tiene sus propios datos. Si quieres sincronizar, exporta como CSV.

**P: ¿Qué pasa si elimino la app?**  
A: Si es una app instalada, tus datos persisten. Si limpias el caché del navegador, se pierden. Exporta tus datos regularmente.

**P: ¿Cómo cambio mi contraseña?**  
A: Entra a tu perfil → "Cambiar contraseña" y confirma la actual.

**P: ¿Puedo eliminar mi cuenta?**  
A: Sí. Perfil → "Eliminar cuenta y datos" → confirma contraseña. Se borra todo.

---

## 🚀 PRÓXIMOS PASOS

1. **Instalación:** Sigue los pasos arriba según tu dispositivo
2. **Primeros movimientos:** Agrega algunos gastos para ver cómo funciona
3. **Prueba la voz:** Di un gasto en micrófono y verás cómo detecta la categoría
4. **Explora:** Mira "Análisis" para gráficas de gastos
5. **Invita:** Otros pueden crear sus propias cuentas en el mismo dispositivo

---

## 📞 SOPORTE

Si hay problemas:
- **En iPhone:** Usa Safari (otros navegadores pueden tener restricciones)
- **En Android:** Usa Chrome (mejor compatibilidad con PWA)
- **Limpia caché** si ves comportamiento extraño: Configuración del navegador → Historial → Borrar datos
- **Actualiza:** Abre la app y toca "Actualizar app" en el perfil

---

**¡Disfruta organizando tus finanzas! 💰**
