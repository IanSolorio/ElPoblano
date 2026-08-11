# Ejecución simplificada de pruebas bloqueadas en EC2

Estas instrucciones completan `ST-NF-01`, `ST-NF-02`, `ST-NF-04` y `ST-NF-07` sin copiar bloques extensos en la consola. El script solicita `sudo` automáticamente y guarda los resultados en `tests/results/fase5/sistema/reports/ejecucion-ec2.csv`.

## 1. Actualizar el proyecto

Desde la instancia EC2:

```bash
cd /var/www/elpoblano
git pull origin developer
```

## 2. Ejecutar las pruebas que no reinician EC2

```bash
npm run test:ec2 -- pre-reboot
```

Este comando ejecuta:

- `ST-NF-01`: reinicio y recuperación del servicio backend.
- `ST-NF-04`: redirección HTTP a HTTPS, certificado y recursos iniciales.
- `ST-NF-07`: incorporación de la evidencia JMeter aprobada.

## 3. Iniciar la prueba de reinicio de EC2

```bash
npm run test:ec2 -- reboot
```

El script guarda el identificador del arranque actual y solicita escribir `REINICIAR`. La sesión SSH se cerrará; hay que esperar aproximadamente uno o dos minutos antes de volver a conectarse.

## 4. Verificar el nuevo arranque

Después de volver a conectarse:

```bash
cd /var/www/elpoblano
npm run test:ec2 -- verify-reboot
```

`ST-NF-02` será aprobada solamente si cambió el arranque y tanto `elpoblano` como Nginx están habilitados, activos y respondiendo por HTTPS.

## 5. Consultar la evidencia

```bash
cat tests/results/fase5/sistema/reports/ejecucion-ec2.csv
```

No se debe editar manualmente la matriz de Fase 5 antes de revisar este archivo. Si alguna prueba falla, el script registra `NO_APROBADO` y el detalle observado.

## Configuración opcional

Los valores predeterminados son el API `elpoblano-api.duckdns.org`, el frontend `https://elpoblano.vercel.app` y un tiempo máximo de recuperación de 30 segundos. Solo si cambian los dominios se deben definir antes de ejecutar:

```bash
export ELPOBLANO_API_HOST="nuevo-api.example.org"
export ELPOBLANO_FRONTEND_URL="https://nuevo-frontend.example.org"
```
