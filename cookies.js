// Funciones para guardar, leer y borrar cookies con valores JSON.
// Todas las cookies de este proyecto empiezan por "quiz_".
const PREFIJO = "quiz_";

function guardarCookie(nombre, valor, dias) {
  const segundos = dias * 24 * 60 * 60;   // FALLO 9: faltaba "* 60" (salían minutos, no segundos)
  const texto = encodeURIComponent(JSON.stringify(valor));
  document.cookie = PREFIJO + nombre + "=" + texto + "; max-age=" + segundos + "; path=/";
}

function leerCookie(nombre, porDefecto) {
  const clave = PREFIJO + nombre + "=";
  const trozo = document.cookie.split("; ").find(c => c.startsWith(clave));
  if (!trozo) return porDefecto;
  try {
    return JSON.parse(decodeURIComponent(trozo.slice(clave.length)));
  } catch {
    return porDefecto;
  }
}

function borrarCookie(nombre) {
  document.cookie = PREFIJO + nombre + "=; max-age=0; path=/";   // FALLO 10: el path debe ser el mismo con el que se guardó ("/")
}
