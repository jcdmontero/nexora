import os
from pathlib import Path

# ============ CONFIGURACIÓN ============
DIRECTORIO_RAIZ = "."  # Ruta del proyecto Laravel (usa "." para el directorio actual)
ARCHIVO_SALIDA = "auditoria_codigo.md"

# Extensiones de archivos que quieres incluir
EXTENSIONES_INCLUIR = {
    ".php", ".blade.php", ".js", ".ts", ".vue", ".jsx", ".tsx",
    ".css", ".scss", ".json", ".env.example", ".yml", ".yaml",
    ".xml", ".html", ".sql",  ".txt"
}

# Carpetas que quieres EXCLUIR (no aportan a la auditoría)
CARPETAS_EXCLUIR = {
    "vendor", "node_modules", ".git", "storage", "bootstrap/cache",
    ".idea", ".vscode", "public/build", "dist",".agents",".mimocode",".claude",".zcode",".opencode","marketingskills-main",".gemini","tests_certificacion","tests"
}

# Archivos específicos que quieres EXCLUIR
ARCHIVOS_EXCLUIR = {
    "composer.lock", "package-lock.json", "yarn.lock", ".env",".md"
}

# Tamaño máximo de archivo en KB (para evitar archivos gigantes)
TAMANO_MAXIMO_KB = 500
# =======================================


def debe_excluir_carpeta(ruta):
    """Verifica si una carpeta debe ser excluida."""
    partes = Path(ruta).parts
    for excluir in CARPETAS_EXCLUIR:
        # Maneja rutas con subdirectorios (ej: bootstrap/cache)
        if excluir in ruta.replace("\\", "/"):
            return True
        if excluir in partes:
            return True
    return False


def debe_incluir_archivo(nombre_archivo):
    """Verifica si un archivo debe ser incluido según su extensión."""
    if nombre_archivo in ARCHIVOS_EXCLUIR:
        return False
    # Comprueba extensiones compuestas primero (.blade.php)
    for ext in EXTENSIONES_INCLUIR:
        if nombre_archivo.endswith(ext):
            return True
    return False


def obtener_lenguaje(nombre_archivo):
    """Devuelve el identificador de lenguaje para el bloque de código markdown."""
    if nombre_archivo.endswith(".blade.php"):
        return "blade"
    ext = Path(nombre_archivo).suffix.lower()
    mapa = {
        ".php": "php", ".js": "javascript", ".ts": "typescript",
        ".vue": "vue", ".jsx": "jsx", ".tsx": "tsx",
        ".css": "css", ".scss": "scss", ".json": "json",
        ".yml": "yaml", ".yaml": "yaml", ".xml": "xml",
        ".html": "html", ".sql": "sql", ".md": "markdown"
    }
    return mapa.get(ext, "")


def main():
    ruta_base = os.path.abspath(DIRECTORIO_RAIZ)
    total_archivos = 0
    total_omitidos = 0

    print(f"Iniciando auditoría en: {ruta_base}")

    with open(ARCHIVO_SALIDA, "w", encoding="utf-8") as salida:
        salida.write(f"# Auditoría de Código\n\n")
        salida.write(f"**Directorio raíz:** `{ruta_base}`\n\n")
        salida.write("---\n\n")

        for carpeta_actual, subcarpetas, archivos in os.walk(ruta_base):
            # Filtra carpetas excluidas (modifica subcarpetas in-place)
            subcarpetas[:] = [
                s for s in subcarpetas
                if not debe_excluir_carpeta(os.path.join(carpeta_actual, s))
            ]

            for archivo in sorted(archivos):
                if not debe_incluir_archivo(archivo):
                    continue

                ruta_completa = os.path.join(carpeta_actual, archivo)
                ruta_relativa = os.path.relpath(ruta_completa, ruta_base)

                # Verifica el tamaño del archivo
                tamano_kb = os.path.getsize(ruta_completa) / 1024
                if tamano_kb > TAMANO_MAXIMO_KB:
                    salida.write(f"## `{ruta_relativa}`\n\n")
                    salida.write(f"> ⚠️ Archivo omitido por tamaño ({tamano_kb:.1f} KB)\n\n")
                    salida.write("---\n\n")
                    total_omitidos += 1
                    continue

                try:
                    with open(ruta_completa, "r", encoding="utf-8", errors="replace") as f:
                        contenido = f.read()

                    lenguaje = obtener_lenguaje(archivo)
                    salida.write(f"## `{ruta_relativa}`\n\n")
                    salida.write(f"```{lenguaje}\n")
                    salida.write(contenido)
                    if not contenido.endswith("\n"):
                        salida.write("\n")
                    salida.write("```\n\n")
                    salida.write("---\n\n")

                    total_archivos += 1
                    print(f"  ✓ {ruta_relativa}")

                except Exception as e:
                    salida.write(f"## `{ruta_relativa}`\n\n")
                    salida.write(f"> ❌ Error al leer: {e}\n\n")
                    salida.write("---\n\n")
                    total_omitidos += 1

        salida.write(f"\n## Resumen\n\n")
        salida.write(f"- Archivos procesados: **{total_archivos}**\n")
        salida.write(f"- Archivos omitidos: **{total_omitidos}**\n")

    print(f"\n✅ Auditoría completada:")
    print(f"   - Archivos procesados: {total_archivos}")
    print(f"   - Archivos omitidos: {total_omitidos}")
    print(f"   - Resultado en: {ARCHIVO_SALIDA}")


if __name__ == "__main__":
    main()
