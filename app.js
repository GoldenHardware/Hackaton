// QuizDAW · lógica de la página
const SEGUNDOS_POR_PREGUNTA = 15;   // NUEVO: tiempo máximo para responder cada pregunta

let usuario = null;
let preguntas = [];
let indice = 0;
let puntos = 0;
let inicio = 0;
let respondida = false;
let temporizador = null;   // NUEVO: id del setInterval de la pregunta actual
let restante = 0;          // NUEVO: segundos que quedan para responder

/* ---------- Usuario y apariencia ---------- */
function pedirNombre() {
  // FALLO 1: si se pulsa "Cancelar", prompt devuelve null y null.trim() rompe la página
  return (prompt("¿Cómo te llamas?") || "").trim() || "invitado";
}

function aplicarTema() {
  // FALLO 2: "class" no existe en el DOM; la propiedad es className (usamos classList)
  document.body.classList.toggle("oscuro", usuario.tema === "oscuro");
}

function cambiarTema() {
  usuario.tema = usuario.tema === "oscuro" ? "claro" : "oscuro";
  guardarCookie("usuario", usuario, 30);
  aplicarTema();
}

/* ---------- Datos del navegador ---------- */
function datosDelNavegador() {
  return {
    ventana: window.innerWidth + " × " + window.innerHeight,   // FALLO 3: innerWidth/innerHeight son de window, no de document
    idioma: navigator.language,
    pagina: document.title,                                     // FALLO 4: el título está en document.title, no en window.title
    ruta: location.pathname
  };
}

function pintarInfo() {
  const d = datosDelNavegador();
  document.getElementById("info").textContent =
    "Ventana: " + d.ventana + " · Idioma: " + d.idioma + " · Página: " + d.pagina + " · Ruta: " + d.ruta;
}

/* ---------- Preguntas al azar ---------- */
function elegirPreguntas(todas, cuantas) {
  const disponibles = [...todas];
  const elegidas = [];
  while (elegidas.length < Math.min(cuantas, todas.length)) {
    // FALLO 5: el "+ 1" impedía elegir la primera y podía salirse del array (undefined)
    const posicion = Math.floor(Math.random() * disponibles.length);
    elegidas.push(disponibles.splice(posicion, 1)[0]);
  }
  return elegidas;
}

/* ---------- Temporizador (NUEVA FUNCIONALIDAD) ---------- */
// Botón para jugar con o sin temporizador. La elección se guarda en la cookie del usuario.
function pintarBotonTemporizador() {
  document.getElementById("btnTemporizador").textContent =
    "Temporizador: " + (usuario.temporizador ? "Sí" : "No");
}

function cambiarTemporizador() {
  usuario.temporizador = !usuario.temporizador;
  guardarCookie("usuario", usuario, 30);
  pintarBotonTemporizador();
  // Si se cambia en mitad de una pregunta sin responder, se aplica al momento
  const enJuego = !document.getElementById("juego").hidden && !respondida;
  if (enJuego) prepararTemporizador();
}

function prepararTemporizador() {
  document.getElementById("zonaTiempo").hidden = !usuario.temporizador;
  if (usuario.temporizador) iniciarTemporizador();
  else pararTemporizador();
}

function iniciarTemporizador() {
  pararTemporizador();
  restante = SEGUNDOS_POR_PREGUNTA;
  pintarTiempo();
  temporizador = setInterval(() => {
    restante--;
    pintarTiempo();
    if (restante <= 0) responder(-1);   // -1 = no ha respondido a tiempo
  }, 1000);
}

function pararTemporizador() {
  clearInterval(temporizador);
  temporizador = null;
}

function pintarTiempo() {
  document.getElementById("tiempo").textContent = "Tiempo: " + restante + " s";
  const barra = document.getElementById("barraTiempo");
  barra.style.width = (restante / SEGUNDOS_POR_PREGUNTA * 100) + "%";
  barra.classList.toggle("poco", restante <= 5);
}

/* ---------- La partida ---------- */
function mostrarSeccion(id, visible) {
  document.getElementById(id).hidden = !visible;
}

function iniciarPartida() {
  preguntas = elegirPreguntas(PREGUNTAS, 5);
  indice = 0;
  puntos = 0;
  inicio = Date.now();
  mostrarSeccion("inicio", false);
  mostrarSeccion("final", false);
  mostrarSeccion("juego", true);
  mostrarPregunta();
}

function mostrarPregunta() {
  const q = preguntas[indice];
  respondida = false;
  document.title = "QuizDAW · " + (indice + 1) + "/" + preguntas.length;
  document.getElementById("textoPregunta").textContent = (indice + 1) + "/" + preguntas.length + " · " + q.pregunta;

  const contenedor = document.getElementById("opciones");
  contenedor.innerHTML = "";
  q.opciones.forEach((texto, i) => {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "opcion";
    boton.textContent = texto;
    boton.dataset.i = i;
    contenedor.appendChild(boton);
  });

  document.getElementById("feedback").textContent = "";
  document.getElementById("btnSiguiente").hidden = true;
  document.getElementById("marcador").textContent = "Puntos: " + puntos;
  prepararTemporizador();
}

function manejarOpcion(evento) {
  const dato = evento.target.dataset.i;
  if (dato === undefined || respondida) return;
  responder(Number(dato));   // FALLO 6: dataset siempre da texto ("1"), y "1" === 1 es false → nunca acertabas
}

function responder(i) {
  respondida = true;
  pararTemporizador();
  const q = preguntas[indice];
  const botones = document.getElementById("opciones").children;
  const acierto = i === q.correcta;
  if (acierto) puntos++;

  for (const b of botones) b.disabled = true;   // las opciones dejan de ser pulsables tras responder
  botones[q.correcta].className = "opcion ok";
  if (i >= 0 && !acierto) botones[i].className = "opcion mal";

  let mensaje;
  if (acierto) mensaje = "¡Correcto!";
  else if (i < 0) mensaje = "¡Se acabó el tiempo! La respuesta era: " + q.opciones[q.correcta];
  else mensaje = "Incorrecto. La respuesta era: " + q.opciones[q.correcta];
  document.getElementById("feedback").textContent = mensaje;
  document.getElementById("marcador").textContent = "Puntos: " + puntos;

  const siguiente = document.getElementById("btnSiguiente");
  siguiente.textContent = indice === preguntas.length - 1 ? "Ver resultado" : "Siguiente";
  siguiente.hidden = false;
}

function siguiente() {
  indice++;
  if (indice < preguntas.length) mostrarPregunta();
  else terminar();
}

function terminar() {
  pararTemporizador();
  const segundos = Math.round((Date.now() - inicio) / 1000);
  const partida = new Partida(usuario.nombre, puntos, preguntas.length, new Date().toISOString(), segundos);
  guardarPartida(partida);

  mostrarSeccion("juego", false);
  mostrarSeccion("final", true);
  document.title = "QuizDAW";
  document.getElementById("textoFinal").textContent = partida.resumen();
  pintarPartidas();
}

/* ---------- Lista de partidas y ventana de resultados ---------- */
function pintarPartidas() {
  const partidas = cargarPartidas();
  const lista = document.getElementById("listaPartidas");
  lista.innerHTML = "";
  for (const p of partidas) {
    const li = document.createElement("li");
    li.textContent = p.resumen();
    lista.appendChild(li);
  }
  document.getElementById("media").textContent =
    partidas.length > 0 ? "Media: " + mediaPuntos(partidas).toFixed(1) + " puntos" : "Aún no hay partidas.";
}

function abrirResultados() {
  // FALLO 7: el fichero se llama "resultados.html" (en plural)
  window.open("resultados.html", "resultados", "popup=yes,width=520,height=460");
}

function manejarBorrar() {
  if (confirm("¿Borrar todos tus datos del quiz?")) {
    borrarCookie("usuario");
    borrarCookie("partidas");
    pintarPartidas();
    document.getElementById("saludo").textContent = "Datos borrados. Recarga la página.";
  }
}

/* ---------- Arranque ---------- */
function iniciar() {
  usuario = leerCookie("usuario", null);
  if (usuario === null) {
    usuario = { nombre: pedirNombre(), tema: "claro", temporizador: true };
    guardarCookie("usuario", usuario, 30);
  }
  if (usuario.temporizador === undefined) usuario.temporizador = true;   // cookies antiguas sin esta opción
  document.getElementById("saludo").textContent = "Hola, " + usuario.nombre;
  aplicarTema();
  pintarBotonTemporizador();
  pintarPartidas();
  pintarInfo();

  document.getElementById("btnEmpezar").addEventListener("click", iniciarPartida);
  document.getElementById("btnOtra").addEventListener("click", iniciarPartida);
  document.getElementById("btnSiguiente").addEventListener("click", siguiente);
  document.getElementById("opciones").addEventListener("click", manejarOpcion);
  document.getElementById("btnTema").addEventListener("click", cambiarTema);
  document.getElementById("btnTemporizador").addEventListener("click", cambiarTemporizador);
  // FALLO 8: con "abrirResultados()" la función se ejecutaba al cargar; hay que pasar la referencia
  document.getElementById("btnResultados").addEventListener("click", abrirResultados);
  document.getElementById("btnBorrar").addEventListener("click", manejarBorrar);
}
document.addEventListener("DOMContentLoaded", iniciar);
