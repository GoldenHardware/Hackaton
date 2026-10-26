// Una partida jugada: quién, cuántos puntos, cuándo y cuánto tardó.
class Partida {
  constructor(nombre, puntos, total, fecha, segundos) {
    this.nombre = nombre;
    this.puntos = puntos;
    this.total = total;
    this.fecha = fecha;          // texto en formato ISO, por ejemplo "2026-03-15T12:00:00.000Z"
    this.segundos = segundos;
  }

  porcentaje() {
    return Math.round(this.puntos / this.total * 100);
  }

  resumen() {
    return this.nombre + ": " + this.puntos + "/" + this.total + " (" + this.porcentaje() + " %) · " +
           formatearFecha(this.fecha) + " · " + this.segundos + " s";
  }
}

function formatearFecha(textoISO) {
  const f = new Date(textoISO);
  // FALLO 11: getMonth() empieza en 0 → hay que sumar 1
  // FALLO 12: getYear() está obsoleto (devuelve 126 en 2026) → getFullYear()
  return f.getDate() + "/" + (f.getMonth() + 1) + "/" + f.getFullYear();
}

// Las partidas se guardan en una cookie como un array en JSON.
function cargarPartidas() {
  const datos = leerCookie("partidas", []);
  // FALLO 13: JSON.parse devuelve objetos planos sin métodos → hay que reconstruir cada Partida
  return datos.map(p => new Partida(p.nombre, p.puntos, p.total, p.fecha, p.segundos));
}

function guardarPartida(partida) {
  const partidas = cargarPartidas();
  partidas.push(partida);
  guardarCookie("partidas", partidas.slice(-5), 30);   // FALLO 14: slice(0, 5) guardaba las 5 primeras, no las 5 últimas
}

function mediaPuntos(partidas) {
  if (partidas.length === 0) return 0;
  return partidas.reduce((suma, p) => suma + p.puntos, 0) / partidas.length;   // FALLO 15: faltaba el valor inicial 0 del reduce
}
