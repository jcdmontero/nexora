from pathlib import Path
import mimetypes

# ===========================
# CONFIGURACIÓN
# ===========================

# Carpeta del proyecto a auditar
DIRECTORIO = r"C:\laragon\www\nexora\dashboard_source_files"

# Archivo de salida
SALIDA = "auditoria_codigo.md"

# Carpetas que NO se recorrerán
IGNORAR_CARPETAS = {
    ".git",
    ".idea",
    ".vscode",
    "__pycache__",
    "node_modules",
    "vendor",
    "dist",
    "build",
    "coverage",
    "storage",
    "logs",
    "tmp",
    "temp",
}

# Extensiones binarias
IGNORAR_EXTENSIONES = {
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".bmp",
    ".ico",
    ".webp",
    ".svg",
    ".pdf",
    ".zip",
    ".rar",
    ".7z",
    ".gz",
    ".tar",
    ".exe",
    ".dll",
    ".so",
    ".bin",
    ".mp3",
    ".mp4",
    ".avi",
    ".mov",
    ".ttf",
    ".woff",
    ".woff2",
    ".eot",
    ".sqlite",
    ".db",
    ".log"
}


def es_binario(archivo: Path):
    if archivo.suffix.lower() in IGNORAR_EXTENSIONES:
        return True

    mime, _ = mimetypes.guess_type(str(archivo))
    if mime is None:
        return False

    return not mime.startswith("text")


def leer_archivo(path: Path):
    codificaciones = [
        "utf-8",
        "utf-8-sig",
        "latin-1",
        "cp1252"
    ]

    for cod in codificaciones:
        try:
            with open(path, "r", encoding=cod) as f:
                return f.read()
        except:
            pass

    return None


with open(SALIDA, "w", encoding="utf-8") as salida:

    salida.write("# AUDITORÍA COMPLETA DEL CÓDIGO\n\n")

    for archivo in sorted(Path(DIRECTORIO).rglob("*")):

        if archivo.is_dir():
            continue

        if any(parte in IGNORAR_CARPETAS for parte in archivo.parts):
            continue

        if es_binario(archivo):
            continue

        contenido = leer_archivo(archivo)

        if contenido is None:
            continue

        print(archivo)

        salida.write("\n")
        salida.write("=" * 100 + "\n")
        salida.write(f"ARCHIVO: {archivo}\n")
        salida.write("=" * 100 + "\n\n")

        salida.write("```")
        if archivo.suffix:
            salida.write(archivo.suffix[1:])
        salida.write("\n")

        salida.write(contenido)

        salida.write("\n```\n\n")

print(f"\nArchivo generado: {SALIDA}")