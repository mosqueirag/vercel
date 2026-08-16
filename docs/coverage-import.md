# Cobertura por domicilio

La tabla `service_address_coverage` contiene la huella privada de servicios activos. Tiene RLS, no concede acceso a `anon` ni `authenticated`, y nunca debe consultarse directamente desde el navegador.

## Configuración

- `NEXT_PUBLIC_SUPABASE_URL`: URL del proyecto Supabase.
- `SUPABASE_SECRET_KEY` o `SUPABASE_SERVICE_ROLE_KEY`: clave privada, disponible sólo en el servidor y durante la importación.
- `COVERAGE_ADDRESS_MARGIN`: diferencia máxima entre alturas de la misma calle. El valor predeterminado es `150`; acepta de `0` a `1000`.

## Actualización

1. Aplicar la migración en un entorno de Supabase de desarrollo o preview.
2. Validar el archivo sin enviar datos:

   ```powershell
   .\scripts\import-service-coverage.ps1 -WorkbookPath "C:\ruta\usuarios y servicios.xls" -DryRun
   ```

3. Configurar las variables privadas en la sesión e importar:

   ```powershell
   .\scripts\import-service-coverage.ps1 -WorkbookPath "C:\ruta\usuarios y servicios.xls"
   ```

El archivo y sus domicilios no se copian al repositorio. Las filas sin calle y altura inequívocas se omiten para evitar falsos positivos. El sitio devuelve únicamente el tipo de coincidencia y los servicios agregados; no revela direcciones vecinas.
