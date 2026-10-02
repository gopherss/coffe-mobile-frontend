# CoffeeShop

App móvil interna para gestionar una cafetería: barra, catálogo, insumos e inventario.
Todo funciona en el dispositivo, sin servidor ni cuenta de usuario.

- **Expo SDK 57** y React Native
- **Expo Router** para la navegación
- **Moneda:** soles peruanos (S/)

## Puesta en marcha

```bash
npm install
npx expo start
```

Desde ahí se puede abrir en un emulador de Android, un simulador de iOS o en
Expo Go escaneando el código QR.

Para una app ya compilada en un teléfono hace falta un development build, porque
la app usa módulos nativos que Expo Go no incluye:

```bash
npx expo run:android    # o npx expo run:ios
```

Antes de publicar:

```bash
npx expo lint           # revisar estilo
npx tsc --noEmit        # revisar tipos
npx expo-doctor         # revisar dependencias y configuración
eas build -p android    # compilar para distributing
```

## Cómo se usa

La pantalla inicial es la **barra**. Ahí entran los pedidos.

### 1. Crear un pedido

Tocá **+ Nuevo pedido**, elegí los productos y ajustá las cantidades con el
contador. Cada línea admite notas para la barra ("sin azúcar", "extra shot").
Después:

- **Para llevar** o **En el local**. En el local se puede indicar el número de mesa.
- Se puede dejar una nota general para el pedido.

Al confirmar, el pedido aparece en la barra con estado *Pendiente* y recibe un
número correlativo del día (1, 2, 3...), que reinicia al día siguiente.

### 2. Avanzar el pedido en la barra

Cada tarjeta tiene un botón que lleva al siguiente estado:

| Estado | Botón | Qué pasa |
| --- | --- | --- |
| Pendiente | Empezar | Pasa a *En preparación* y **descuenta el stock** de los insumos |
| En preparación | Marcar listo | Pasa a *Listo* y se registra la hora |
| Listo | Entregar | Pide el método de pago y cierra el pedido |

Las tarjetas se ordenan de más antigua a más reciente, y las que superan los 6
minutos se marcan como demoradas.

### 3. Cobrar

En el botón **Entregar** se elige efectivo o tarjeta. El pedido queda registrado
como *Entregado*.

Si un pedido se arruina, se puede cancelar desde el historial. **Cancelar un
pedido que ya había descontado stock devuelve los insumos**, y hacerlo dos veces
no descuenta ni devuelve de más.

### 4. Catálogo

Desde la pestaña **Catálogo** se pueden:

- Crear y editar productos: nombre, categoría (Café, Fría, Panadería, Otros), precio y disponibilidad.
- Activar o desactivar un producto con el interruptor, sin borrarlo.
- Borrar un producto.

Cada producto tiene una **receta**: qué insumos consume y en qué cantidad. El
descuento de stock usa esa receta, multiplicada por la cantidad del pedido.

Al borrar un producto, las líneas de los pedidos ya realizados **conservan el
nombre y el precio** con el que se venden. El historial nunca se altera por
cambios posteriores en el catálogo.

### 5. Inventario

Desde la pestaña **Inventario** se ve cada insumo con su unidad (g, ml, uds), el
stock actual y el mínimo recomendado. Los que están por debajo del mínimo se
marcan.

Se pueden crear y editar insumos, y ajustar el stock con un paso de incremento o
decremento. Borrar un insumo también lo quita de las recetas que lo usaban.

## Cómo se guardan los datos

Todo vive en **un solo archivo JSON** en el directorio de documentos del
dispositivo (`coffeeshop.json`). No hay base de datos ni servidor.

Eso significa que los datos:

- son del dispositivo donde se creó la app,
- se pierden si se desinstala la app,
- no se sincronizan entre dispositivos.

El archivo se lee entero al abrir la app y se reescribe en cada cambio. La
escritura es **atómica**: primero se escribe un archivo temporal y recién
después se mueve sobre el definitivo, así que si la app se cierra a mitad de una
escritura no se pierden datos. Además las escrituras pasan por una cola, de modo
que dos toques seguidos no se pisan entre sí.

Si el archivo llegara a estar dañado, la app lo respalda como
`coffeeshop.json.roto-<fecha>` y arranca con los datos iniciales, en lugar de
quedar inutilizable.

Para respaldar los datos alcanza con copiar ese archivo.

## Estructura del proyecto

```
src/
  app/              pantallas (Expo Router: cada archivo es una pantalla)
    (tabs)/         barra, catálogo, inventario, historial
    nuevo-pedido.tsx, producto.tsx, insumo.tsx
  components/       componentes de interfaz
  db/               persistencia en JSON y reglas de negocio
    engine.ts       lectura, escritura atómica y validación del archivo
    seed.ts         datos iniciales (catálogo, insumos y recetas)
    orders.ts       pedidos y movimiento de stock
    products.ts     catálogo
    inventory.ts    insumos y recetas
  hooks/            useQuery para leer datos, useNow para el reloj
  lib/              formato de moneda, fechas, constantes, ids
  store/            estado del pedido en curso (Zustand)
```

## Cambiar la moneda

En `src/lib/format.ts`:

```ts
export const CURRENCY = 'PEN';
export const LOCALE = 'es-PE';
```

Los precios se guardan en **céntimos** (650 = S/ 6.50) para evitar errores de
redondeo con decimales. Por eso `parseMoneyToCents` multiplica por 100.

## Cambiar los precios iniciales

Los precios de la primera instalación están en `src/db/seed.ts`. Editarlos solo
afecta a las instalaciones nuevas: si ya hay datos en el dispositivo, los
precios se cambian desde la app, en **Catálogo → producto → precio**.

## Límites conocidos

- No hay sincronización ni copia en la nube: cada dispositivo tiene sus propios datos.
- El archivo entero está en memoria y se reescribe en cada cambio. Con el volumen de
  una cafetería no se nota, pero con decenas de miles de pedidos el costo por
  escritura crece.
- Si se desinstala la app, se pierden los datos.

## Documentación

- [Documentación de Expo](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction)
- [expo-file-system](https://docs.expo.dev/versions/v57.0.0/sdk/filesystem)
