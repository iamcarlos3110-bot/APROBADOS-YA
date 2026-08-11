// =============================================
// AprobadosYA! — Banco de Preguntas DGT
// 160+ preguntas originales — Permiso B
// =============================================

const CATEGORIES = [
  { id: "normas",         name: "Normas de Circulación",       icon: "📋" },
  { id: "senales",        name: "Señales de Tráfico",          icon: "🚦" },
  { id: "prioridad",      name: "Prioridad de Paso",           icon: "🔄" },
  { id: "velocidad",      name: "Velocidad y Distancias",      icon: "⚡" },
  { id: "adelantamiento", name: "Adelantamiento",              icon: "🏎️" },
  { id: "alcohol",        name: "Alcohol, Drogas y Fármacos",  icon: "🍺" },
  { id: "mecanica",       name: "Mecánica y Seguridad",        icon: "🔧" },
  { id: "iluminacion",    name: "Iluminación",                 icon: "💡" },
  { id: "medioambiente",  name: "Conducción Eficiente",        icon: "🌿" },
  { id: "accidentes",     name: "Accidentes y Primeros Auxilios", icon: "🚑" },
];

const QUESTIONS = [

  // ==========================================
  // NORMAS DE CIRCULACIÓN (28)
  // ==========================================
  {
    id: 1, category: "normas",
    question: "En una vía con varios carriles para el mismo sentido, ¿por cuál debes circular habitualmente?",
    options: ["Por el carril izquierdo", "Por el carril derecho", "Por el carril central", "Por cualquiera que esté libre"],
    correct: 1,
    explanation: "La norma general obliga a circular por el carril más a la derecha que esté libre de obstáculos, dejando los carriles izquierdos para adelantar o cuando el tráfico lo exija."
  },
  {
    id: 2, category: "normas",
    question: "¿Qué debes hacer cuando el semáforo cambia a ámbar y aún puedes parar con seguridad?",
    options: ["Acelerar para cruzar antes del rojo", "Detenerte antes de la línea de detención", "Mantener la velocidad actual", "Tocar el claxon y continuar"],
    correct: 1,
    explanation: "El ámbar significa 'prepárate a parar'. Si puedes hacerlo sin peligro, debes detener el vehículo antes de la línea de stop o del cruce."
  },
  {
    id: 3, category: "normas",
    question: "¿Está permitido circular marcha atrás en autopistas y autovías?",
    options: ["Sí, hasta 50 metros en el arcén", "Sí, si hay emergencia", "No, nunca está permitido", "Solo de noche y con precaución"],
    correct: 2,
    explanation: "La marcha atrás está expresamente prohibida en autopistas y autovías. Si te pasas de la salida, debes continuar hasta la siguiente."
  },
  {
    id: 4, category: "normas",
    question: "¿Cuándo está permitido circular por el carril izquierdo de una vía con varios carriles en el mismo sentido?",
    options: ["Siempre que se quiera", "Solo para adelantar o cuando el tráfico lo impide usar el derecho", "Solo en zonas urbanas", "Nunca está permitido"],
    correct: 1,
    explanation: "El carril izquierdo es de adelantamiento. Solo se debe usar para adelantar o cuando la densidad del tráfico impida usar el derecho."
  },
  {
    id: 5, category: "normas",
    question: "¿Qué prohíbe una línea continua pintada en el centro de la calzada?",
    options: ["Girar a la derecha", "Cruzarla o circular sobre ella", "Adelantar con precaución", "Circular a más de 90 km/h"],
    correct: 1,
    explanation: "La línea longitudinal continua prohíbe cruzarla o circular sobre ella, lo que impide el adelantamiento o la invasión del carril contrario."
  },
  {
    id: 6, category: "normas",
    question: "¿Se puede circular con el motor apagado o en punto muerto cuesta abajo?",
    options: ["Sí, para ahorrar combustible", "Sí, si no hay tráfico", "No, es peligroso y está prohibido", "Solo en zona urbana"],
    correct: 2,
    explanation: "Circular con el motor apagado o en punto muerto está prohibido porque se pierde la asistencia de dirección y frenos, lo que resulta peligroso."
  },
  {
    id: 7, category: "normas",
    question: "Al cruzar una vía de ferrocarril sin barreras, ¿qué debes hacer?",
    options: ["Cruzar rápidamente para no bloquear la vía", "Reducir velocidad, mirar a ambos lados y cruzar solo si está libre", "Ceder el paso solo si se ve el tren", "Tocar el claxon antes de cruzar"],
    correct: 1,
    explanation: "En pasos a nivel sin barreras debes reducir velocidad, asegurarte de que no viene ningún tren mirando a ambos lados, y cruzar solo cuando estés seguro."
  },
  {
    id: 8, category: "normas",
    question: "¿A qué distancia mínima antes de un cruce debes señalizar un cambio de dirección?",
    options: ["Al llegar al cruce", "Con antelación suficiente, normalmente 3 segundos antes", "A 100 metros exactamente", "Solo si hay otros vehículos detrás"],
    correct: 1,
    explanation: "Debes indicar el cambio de dirección con suficiente antelación (regla general: al menos 3 segundos antes), para que otros usuarios puedan reaccionar."
  },
  {
    id: 9, category: "normas",
    question: "¿Cuál es la separación lateral mínima al adelantar a un ciclista?",
    options: ["0,5 metros", "1 metro", "1,5 metros", "2 metros"],
    correct: 2,
    explanation: "La ley exige una separación lateral mínima de 1,5 metros al adelantar a un ciclista, pudiendo invadir el carril contrario si la visibilidad lo permite."
  },
  {
    id: 10, category: "normas",
    question: "¿Qué significa una línea discontinua en el centro de la calzada?",
    options: ["Prohibición absoluta de adelantar", "Que puedes cruzarla para adelantar si no hay peligro", "Límite de velocidad reducido", "Carril reversible"],
    correct: 1,
    explanation: "La línea discontinua indica que puedes cruzarla para adelantar siempre que las condiciones de visibilidad y tráfico lo permitan con seguridad."
  },
  {
    id: 11, category: "normas",
    question: "¿Qué conductor tiene prioridad cuando dos vehículos quieren entrar simultáneamente al mismo carril desde carriles diferentes?",
    options: ["El más grande", "El que va más rápido", "El que se encuentra más a la derecha", "El que lleva más tiempo circulando"],
    correct: 2,
    explanation: "Cuando dos vehículos convergen hacia el mismo espacio desde carriles distintos, tiene prioridad el que circula por la derecha."
  },
  {
    id: 12, category: "normas",
    question: "¿Qué debes hacer si una ambulancia con señales acústicas y luminosas te alcanza por detrás?",
    options: ["Continuar a la misma velocidad", "Acelerar para no obstaculizarla", "Apartarte hacia la derecha y dejarla pasar", "Detenerte inmediatamente"],
    correct: 2,
    explanation: "Ante vehículos de emergencia en servicio (ambulancias, bomberos, policía), debes apartarte hacia la derecha para dejarles paso libre."
  },
  {
    id: 13, category: "normas",
    question: "¿Están obligados a usar el cinturón de seguridad los ocupantes de la fila trasera en autopista?",
    options: ["No, solo en asientos delanteros", "Sí, siempre", "Solo si el conductor lo decide", "Solo en viajes de más de 100 km"],
    correct: 1,
    explanation: "El cinturón de seguridad es obligatorio para todos los ocupantes del vehículo en todos los asientos, tanto en ciudad como en carretera."
  },
  {
    id: 14, category: "normas",
    question: "¿En qué circunstancia está permitido parar en segunda fila?",
    options: ["Si se deja a alguien en menos de 2 minutos", "Nunca, siempre es una infracción", "Si el conductor permanece al volante y no obstruye el tráfico", "Si es zona azul y se paga el parquímetro"],
    correct: 2,
    explanation: "Parar en segunda fila es una infracción en casi todos los casos. Solo puede tolerarse momentáneamente si el conductor permanece al volante, listo para moverse si obstruye el tráfico."
  },
  {
    id: 15, category: "normas",
    question: "¿Qué indica al conductor la presencia de una línea de 'STOP' pintada en el suelo?",
    options: ["Que debe reducir la velocidad", "Que debe detenerse completamente antes de la línea", "Que tiene prioridad de paso", "Que hay un semáforo próximo"],
    correct: 1,
    explanation: "La línea de STOP obliga a una detención completa del vehículo antes de la misma. No basta con reducir la velocidad, hay que parar completamente."
  },
  {
    id: 16, category: "normas",
    question: "¿Cuándo es obligatorio el uso del casco en motocicleta?",
    options: ["Solo a más de 50 km/h", "Solo en carretera interurbana", "Siempre, en cualquier vía y velocidad", "Solo para el conductor, no el acompañante"],
    correct: 2,
    explanation: "El casco homologado es obligatorio para el conductor y el pasajero de motocicleta en cualquier tipo de vía, independientemente de la velocidad."
  },
  {
    id: 17, category: "normas",
    question: "¿Qué conductor tiene preferencia en el interior de un túnel?",
    options: ["El que circula en sentido ascendente", "El que circula en sentido descendente", "Depende de la señalización", "El que lleva más carga"],
    correct: 2,
    explanation: "En túneles, la preferencia viene determinada por la señalización existente. Siempre hay que respetar la señalización interior."
  },
  {
    id: 18, category: "normas",
    question: "¿Está permitido el uso del teléfono móvil en mano mientras se conduce?",
    options: ["Sí, si se conduce despacio", "Sí, si se hace por poco tiempo", "No, está prohibido y supone la pérdida de 6 puntos", "Solo si el vehículo está parado en semáforo"],
    correct: 2,
    explanation: "Usar el móvil en mano mientras se conduce está prohibido y conlleva la pérdida de 6 puntos del carnet además de una multa económica."
  },
  {
    id: 19, category: "normas",
    question: "¿Qué debes hacer al acercarte a un paso de peatones con personas esperando para cruzar?",
    options: ["Acelerar para pasar antes", "Tocar el claxon para advertirles", "Reducir velocidad y ceder el paso", "Mantener la velocidad si no están cruzando"],
    correct: 2,
    explanation: "Los peatones tienen preferencia en los pasos señalizados. Debes reducir velocidad y estar preparado para detenerte si alguien quiere cruzar."
  },
  {
    id: 20, category: "normas",
    question: "¿Es obligatorio que los niños menores de 135 cm usen un sistema de retención infantil?",
    options: ["Solo menores de 3 años", "Solo en asientos delanteros", "Sí, en todos los asientos y cualquier tipo de vía", "Solo en autopistas"],
    correct: 2,
    explanation: "Los menores de 135 cm deben usar un sistema de retención homologado y adecuado a su peso/altura en todos los asientos y en cualquier tipo de vía."
  },
  {
    id: 21, category: "normas",
    question: "¿Se puede aparcar encima de la acera aunque sea parcialmente?",
    options: ["Sí, si sobresale menos de 1 metro", "Sí, si el paso peatonal queda libre", "No, no se puede aparcar sobre la acera", "Solo en zonas sin señalización"],
    correct: 2,
    explanation: "Aparcar total o parcialmente sobre la acera está prohibido ya que obstruye el paso de peatones, especialmente personas con movilidad reducida."
  },
  {
    id: 22, category: "normas",
    question: "En una rotonda, ¿qué conductor tiene preferencia de paso?",
    options: ["El que entra a la rotonda", "El que ya circula dentro de la rotonda", "El que viene por la derecha", "El vehículo de mayor tamaño"],
    correct: 1,
    explanation: "En una rotonda debidamente señalizada, los vehículos que ya circulan dentro tienen preferencia sobre los que quieren entrar."
  },
  {
    id: 23, category: "normas",
    question: "¿Qué se debe hacer al llegar a un paso a nivel con barreras bajadas?",
    options: ["Cruzar rápidamente antes de que cierre completamente", "Esperar hasta que las barreras estén completamente levantadas", "Rodear las barreras si hay espacio", "Tocar el claxon y cruzar"],
    correct: 1,
    explanation: "Con las barreras bajadas o bajándose, debes esperar hasta que estén completamente levantadas antes de cruzar. Nunca rodees las barreras."
  },
  {
    id: 24, category: "normas",
    question: "¿Cuántos triángulos de preseñalización de peligro son necesarios llevar en el vehículo?",
    options: ["Uno", "Dos", "Tres", "Ninguno, son opcionales"],
    correct: 1,
    explanation: "Es obligatorio llevar dos triángulos de preseñalización de peligro en los vehículos de más de 3.500 kg. Para los demás, basta con uno pero se recomiendan dos."
  },
  {
    id: 25, category: "normas",
    question: "Si vas a realizar un giro a la izquierda en una vía con carril central compartido, ¿qué debes hacer?",
    options: ["Girar directamente desde el carril derecho", "Entrar al carril central para esperar a que pase el tráfico contrario", "Adelantar a los vehículos y girar", "Esperar en el arcén"],
    correct: 1,
    explanation: "El carril central compartido sirve para que los vehículos que van a girar a la izquierda esperen el momento oportuno sin obstaculizar el tráfico."
  },
  {
    id: 26, category: "normas",
    question: "¿Qué debe hacer un conductor antes de abrir la puerta del vehículo estacionado?",
    options: ["Nada, tiene derecho a abrir la puerta", "Asegurarse de que no viene nadie por la vía o acera", "Abrir rápidamente para no interrumpir el tráfico", "Solo mirar si hay coches, no ciclistas"],
    correct: 1,
    explanation: "Antes de abrir la puerta, debes verificar que no viene nadie (vehículos, ciclistas, peatones). Abrir sin comprobar puede causar accidentes graves."
  },
  {
    id: 27, category: "normas",
    question: "¿Cuándo pueden circular los peatones por la calzada?",
    options: ["Nunca, deben usar siempre la acera", "Cuando no hay acera o está impracticable, por la izquierda", "Siempre que no haya coches", "Solo de noche"],
    correct: 1,
    explanation: "Los peatones pueden circular por la calzada cuando no exista acera o esté en malas condiciones, haciéndolo por la izquierda para ver el tráfico que viene de frente."
  },
  {
    id: 28, category: "normas",
    question: "¿Qué se entiende por 'zona 30'?",
    options: ["Una zona donde se permite aparcar 30 minutos", "Una zona con un límite de velocidad de 30 km/h", "Una zona con 30 plazas de aparcamiento", "Una zona de carga y descarga de 30 minutos"],
    correct: 1,
    explanation: "Las zonas 30 son áreas urbanas donde la velocidad máxima está limitada a 30 km/h para mejorar la seguridad de peatones y ciclistas."
  },

  // ==========================================
  // SEÑALES DE TRÁFICO (22)
  // ==========================================
  {
    id: 29, category: "senales",
    question: "¿Qué forma tienen las señales de prohibición?",
    options: ["Triangulares con borde rojo", "Circulares con borde rojo y fondo blanco", "Cuadradas con fondo azul", "Octogonales rojas"],
    correct: 1,
    explanation: "Las señales de prohibición son circulares con borde rojo y fondo blanco (excepto STOP que es octogonal y CEDA EL PASO que es triangular invertido)."
  },
  {
    id: 30, category: "senales",
    question: "¿Qué forma tienen las señales de advertencia de peligro?",
    options: ["Circulares con borde rojo", "Triangulares con borde rojo y fondo amarillo/blanco", "Cuadradas con fondo azul", "Rectangulares con fondo verde"],
    correct: 1,
    explanation: "Las señales de peligro o advertencia son triangulares con borde rojo y fondo blanco o amarillo, con el vértice hacia arriba."
  },
  {
    id: 31, category: "senales",
    question: "¿Qué color de fondo tienen las señales de indicación en autopistas españolas?",
    options: ["Verde", "Azul", "Blanco", "Amarillo"],
    correct: 1,
    explanation: "En las autopistas y autovías españolas, las señales de indicación tienen fondo azul. En carreteras convencionales el fondo es verde."
  },
  {
    id: 32, category: "senales",
    question: "¿Qué significan las señales circulares con fondo azul y símbolo blanco?",
    options: ["Prohibición", "Peligro", "Obligación", "Información"],
    correct: 2,
    explanation: "Las señales circulares de fondo azul con símbolo blanco son señales de OBLIGACIÓN. Indican lo que el conductor debe hacer."
  },
  {
    id: 33, category: "senales",
    question: "Cuando las instrucciones de un agente de tráfico contradicen un semáforo, ¿qué debes obedecer?",
    options: ["El semáforo, siempre tiene prioridad", "Al agente de tráfico, siempre tiene prioridad", "La señal más restrictiva", "Ninguna de las dos, detenerse"],
    correct: 1,
    explanation: "Los agentes de tráfico tienen autoridad sobre cualquier señal de tráfico, incluidos los semáforos. Sus indicaciones prevalecen siempre."
  },
  {
    id: 34, category: "senales",
    question: "¿Qué indica una señal de triángulo con signo de exclamación (!)?",
    options: ["Paso prioritario", "Peligro no especificado", "Fin de todas las prohibiciones", "Ceda el paso"],
    correct: 1,
    explanation: "El triángulo con signo de exclamación advierte de un peligro próximo no especificado que el conductor debe observar con especial atención."
  },
  {
    id: 35, category: "senales",
    question: "¿Qué señal obliga a detenerse completamente antes de una intersección?",
    options: ["Ceda el paso (triángulo invertido)", "STOP (octógono rojo)", "Semáforo en ámbar", "Línea discontinua en el suelo"],
    correct: 1,
    explanation: "La señal STOP (octógono rojo con la palabra STOP) obliga a una detención completa del vehículo, aunque no haya tráfico en la vía con prioridad."
  },
  {
    id: 36, category: "senales",
    question: "¿Qué significa una señal de flecha azul con sentido hacia arriba en una autopista?",
    options: ["Prohibición de seguir recto", "Carril de salida próximo", "Dirección obligatoria de seguir recto", "Límite de velocidad eliminado"],
    correct: 2,
    explanation: "Las flechas de dirección obligatoria (fondo azul, flecha blanca) indican la dirección que deben tomar los vehículos en ese punto."
  },
  {
    id: 37, category: "senales",
    question: "¿Qué indica la señal 'Ceda el paso' (triángulo invertido)?",
    options: ["Detenerse completamente", "Ceder el paso a los vehículos de la vía a la que accedes, parando si es necesario", "Tener prioridad de paso", "Reducir la velocidad a 30 km/h"],
    correct: 1,
    explanation: "'Ceda el paso' significa que debes dar prioridad a los vehículos que circulan por la vía a la que accedes. Puedes continuar si no hay nadie, pero debes parar si fuera necesario."
  },
  {
    id: 38, category: "senales",
    question: "¿Qué indica la señal de velocidad máxima cuando está tachada con una raya diagonal?",
    options: ["Que el límite baja a la mitad", "Fin de esa limitación de velocidad", "Que la señal no es válida", "Zona de obras"],
    correct: 1,
    explanation: "Una señal de velocidad con una raya diagonal indica el fin de esa limitación específica. Se recupera el límite genérico de la vía."
  },
  {
    id: 39, category: "senales",
    question: "¿Qué señal indica que una carretera tiene preferencia de paso en las intersecciones?",
    options: ["Señal de STOP en cada cruce", "Señal de prioridad (cuadrada con borde amarillo y rombo central)", "Líneas continuas en el suelo", "Señal de flecha azul"],
    correct: 1,
    explanation: "La señal de 'carretera con prioridad' (cuadrada, borde amarillo, rombo blanco en el centro) indica que los conductores de esa vía tienen prioridad en todos los cruces."
  },
  {
    id: 40, category: "senales",
    question: "¿Cuándo deben obedecerse las señales de tráfico variables (paneles electrónicos)?",
    options: ["Solo cuando están encendidas de noche", "Siempre que estén activadas, prevalecen sobre las fijas", "Solo si las fijas dicen lo contrario", "Son meramente orientativas"],
    correct: 1,
    explanation: "Las señales variables (paneles electrónicos, semáforos) prevalecen sobre las señales fijas cuando están en funcionamiento, y son de obligatorio cumplimiento."
  },
  {
    id: 41, category: "senales",
    question: "¿Qué significa una señal de prohibición de adelantamiento?",
    options: ["Que no se puede circular por ese carril", "Que está prohibido adelantar a vehículos de motor", "Que la velocidad máxima se reduce a la mitad", "Que hay obras en la calzada"],
    correct: 1,
    explanation: "La señal de prohibición de adelantamiento prohíbe sobrepasar a los vehículos de motor que circulan en el mismo sentido, salvo ciclomotores y bicicletas."
  },
  {
    id: 42, category: "senales",
    question: "Una señal rectangular de fondo azul con una 'P' blanca indica:",
    options: ["Prohibido aparcar", "Aparcamiento permitido", "Paso de peatones", "Zona de policía"],
    correct: 1,
    explanation: "La señal de fondo azul con 'P' blanca indica zona de aparcamiento permitido. Puede incluir restricciones de tiempo o tipo de vehículo."
  },
  {
    id: 43, category: "senales",
    question: "¿Qué indican las marcas viales en zigzag pintadas en el suelo?",
    options: ["Zona de obras", "Prohibición de estacionar en esa zona", "Zona de maniobras peligrosas", "Línea de parada para bicicletas"],
    correct: 1,
    explanation: "Las marcas en zigzag en el suelo indican prohibición de estacionar (en algunos países también de parar), habitualmente en zonas próximas a colegios, hospitales o pasos de peatones."
  },
  {
    id: 44, category: "senales",
    question: "¿Qué significa una señal de 'fin de autovía'?",
    options: ["Que la carretera termina completamente", "Que termina el tramo de autovía y comienza una carretera convencional", "Que hay un peaje próximo", "Fin del límite de velocidad de 120 km/h"],
    correct: 1,
    explanation: "La señal de fin de autovía indica que el tramo de calzadas separadas termina y comienza una carretera convencional con sus normas específicas."
  },
  {
    id: 45, category: "senales",
    question: "¿Qué señal limita la velocidad en función de las condiciones meteorológicas?",
    options: ["Señal de velocidad variable en panel electrónico", "Señal fija de 50 km/h", "Señal de peligro de lluvia", "No existe tal señal"],
    correct: 0,
    explanation: "Los paneles electrónicos de velocidad variable ajustan el límite según condiciones de lluvia, niebla, obras u otras circunstancias en tiempo real."
  },
  {
    id: 46, category: "senales",
    question: "¿Qué significa la señal de 'paso para peatones' (líneas paralelas en el suelo)?",
    options: ["Peatones, prohibido cruzar aquí", "Zona reservada para peatones que deben respetar el tráfico", "Paso con prioridad para peatones sobre vehículos", "Zona de bicicletas"],
    correct: 2,
    explanation: "El paso de peatones señalizado otorga preferencia a los peatones sobre los vehículos. Los conductores deben ceder el paso a quien cruce o vaya a cruzar."
  },
  {
    id: 47, category: "senales",
    question: "¿Qué indica en semáforo una luz verde intermitente o parpadeante?",
    options: ["Puede circular sin restricciones", "Precaución, el semáforo va a cambiar a ámbar", "Zona escolar, circular despacio", "Solo para vehículos de emergencia"],
    correct: 1,
    explanation: "La luz verde intermitente avisa que el semáforo va a cambiar a ámbar. Es señal de precaución para que el conductor se prepare a frenar."
  },
  {
    id: 48, category: "senales",
    question: "¿Qué significa una señal de flecha curva a la izquierda sobre un semáforo de carril?",
    options: ["Prohibido girar a la izquierda", "Solo pueden girar a la izquierda los vehículos de ese carril cuando esté en verde", "Carril bidireccional", "Zona de giro permitida en cualquier momento"],
    correct: 1,
    explanation: "Los semáforos de carril con flechas indican las maniobras autorizadas para ese carril específico. Solo se puede girar si la flecha correspondiente está en verde."
  },
  {
    id: 49, category: "senales",
    question: "Una señal octogonal roja con la palabra 'STOP' en blanco obliga a:",
    options: ["Reducir la velocidad a 20 km/h", "Detenerse completamente y ceder el paso", "Solo ceder el paso sin detenerse", "Tocar el claxon y continuar"],
    correct: 1,
    explanation: "STOP exige una detención COMPLETA (velocidad cero) antes de la línea de detención o del cruce, aunque no haya tráfico en la intersección."
  },
  {
    id: 50, category: "senales",
    question: "¿Qué indica una señal de 'zona de estacionamiento limitado' (zona azul)?",
    options: ["Estacionamiento gratuito ilimitado", "Estacionamiento permitido por tiempo limitado con ticket", "Prohibición total de aparcar", "Zona reservada para residentes sin pago"],
    correct: 1,
    explanation: "Las zonas azules permiten estacionar durante un tiempo máximo indicado previo pago en parquímetro o uso de disco de aparcamiento."
  },

  // ==========================================
  // PRIORIDAD DE PASO (15)
  // ==========================================
  {
    id: 51, category: "prioridad",
    question: "En una intersección sin señalizar, ¿a quién cedes el paso?",
    options: ["A los vehículos que vienen de frente", "A los vehículos que vienen por tu derecha", "A los vehículos más grandes", "Al vehículo que llegó primero"],
    correct: 1,
    explanation: "La norma de la derecha: en intersecciones sin señalizar, tienes que ceder el paso a los vehículos que se aproximan por tu derecha."
  },
  {
    id: 52, category: "prioridad",
    question: "¿Qué vehículos tienen prioridad de paso absoluta cuando circulan en servicio de emergencia?",
    options: ["Solo las ambulancias", "Ambulancias, bomberos y policía con señales activas", "Solo la policía", "Todos los vehículos grandes"],
    correct: 1,
    explanation: "Los vehículos de emergencia (ambulancias, bomberos, policía) tienen prioridad absoluta cuando circulan con señales acústicas y/o luminosas de emergencia."
  },
  {
    id: 53, category: "prioridad",
    question: "¿Tienen los tranvías prioridad de paso sobre los demás vehículos?",
    options: ["No, siguen las mismas normas que los coches", "Sí, salvo señal en contrario", "Solo en los cruces señalizados", "Solo cuando llevan muchos pasajeros"],
    correct: 1,
    explanation: "Los tranvías tienen prioridad de paso sobre los demás vehículos, salvo que una señal indique lo contrario."
  },
  {
    id: 54, category: "prioridad",
    question: "¿Qué vehículo tiene prioridad en un cruce entre una vía principal y una secundaria?",
    options: ["El que va más rápido", "El que circula por la vía principal", "El que viene por la derecha", "El mayor en tamaño"],
    correct: 1,
    explanation: "Los vehículos que circulan por la vía principal tienen prioridad sobre los que proceden de vías secundarias señalizadas con STOP o CEDA EL PASO."
  },
  {
    id: 55, category: "prioridad",
    question: "Un vehículo sale de un garaje a la vía pública. ¿A quién debe ceder el paso?",
    options: ["Solo a los peatones", "A nadie, tiene derecho de salida", "A todos los vehículos y peatones que circulen por la vía", "Solo a los vehículos que vengan por la izquierda"],
    correct: 2,
    explanation: "Al salir de un garaje, aparcamiento o zona privada, el conductor debe ceder el paso a todos los usuarios de la vía pública (vehículos y peatones)."
  },
  {
    id: 56, category: "prioridad",
    question: "¿Qué prioridad tienen los autobuses al reincorporarse al tráfico desde una parada señalizada?",
    options: ["Ninguna, deben esperar a que no haya tráfico", "Prioridad sobre los vehículos que circulan por el carril adyacente en zona urbana", "Prioridad sobre todos los vehículos en cualquier vía", "Solo prioridad si señalan con intermitente"],
    correct: 1,
    explanation: "Los autobuses de transporte colectivo tienen prioridad cuando se reincorporan al tráfico desde una parada señalizada en zona urbana, siempre que señalicen la maniobra."
  },
  {
    id: 57, category: "prioridad",
    question: "En una vía de sentido único que se incorpora a otra, ¿quién tiene prioridad?",
    options: ["El que viene de la vía de sentido único", "El que circula por la vía a la que se incorpora", "El que tiene menos tráfico delante", "El que lleva más tiempo esperando"],
    correct: 1,
    explanation: "El que se incorpora a una vía debe ceder el paso a todos los que ya circulan por ella, independientemente de si la suya es de sentido único o no."
  },
  {
    id: 58, category: "prioridad",
    question: "¿Tienen preferencia los ciclistas en un carril bici señalizado al cruzar una calzada?",
    options: ["No, siempre ceden el paso a los vehículos a motor", "Sí, los vehículos deben cederles el paso al cruzar el carril bici", "Solo si llevan casco", "Solo si el carril bici tiene semáforo"],
    correct: 1,
    explanation: "Los ciclistas que circulan por un carril bici señalizado tienen preferencia sobre los vehículos a motor al cruzar la calzada en los puntos habilitados."
  },
  {
    id: 59, category: "prioridad",
    question: "¿Qué prioridad tiene un vehículo que circula por una vía pavimentada frente a otro que viene de una no pavimentada?",
    options: ["El de la vía no pavimentada, por ser más estrecha", "El de la vía pavimentada tiene prioridad", "Depende del tamaño del vehículo", "No hay diferencia entre tipos de vía"],
    correct: 1,
    explanation: "Los vehículos que circulan por vías pavimentadas tienen prioridad sobre los procedentes de vías sin pavimentar o caminos rurales."
  },
  {
    id: 60, category: "prioridad",
    question: "¿Cuándo puede un peatón cruzar una calzada fuera de un paso señalizado?",
    options: ["Nunca, siempre debe usar el paso", "Cuando no haya paso de peatones próximo y ceda el paso a los vehículos", "Cuando no vengan coches a la vista", "Solo en zona urbana"],
    correct: 1,
    explanation: "Los peatones pueden cruzar fuera de los pasos señalizados si no hay uno próximo, pero en ese caso son los peatones quienes deben ceder el paso a los vehículos."
  },
  {
    id: 61, category: "prioridad",
    question: "En una vía de doble sentido que se estrecha hasta convertirse en un carril, ¿quién cede el paso?",
    options: ["El que viene de frente", "El que baja una pendiente", "El que sube la pendiente cede al que baja", "El de mayor tamaño cede al pequeño"],
    correct: 2,
    explanation: "En vías estrechas con pendiente, el vehículo que sube debe ceder el paso al que baja, pues este tiene menos capacidad de maniobra."
  },
  {
    id: 62, category: "prioridad",
    question: "¿Qué prioridad tienen los vehículos militares en convoy?",
    options: ["Ninguna especial", "Prioridad de paso si lo indica su señalización y vigilancia", "Prioridad absoluta sobre todos los vehículos", "Solo prioridad en carretera, no en ciudad"],
    correct: 1,
    explanation: "Los convoyes militares debidamente señalizados y escoltados tienen prioridad de paso. Los demás conductores deben respetar el convoy sin interrumpirlo."
  },
  {
    id: 63, category: "prioridad",
    question: "¿Tiene preferencia el conductor que ya está en un carril de aceleración de autopista?",
    options: ["Sí, sobre los que ya circulan por la autopista", "No, debe ceder el paso a los que circulan por la autopista", "Tienen la misma preferencia", "Depende de la velocidad de cada uno"],
    correct: 1,
    explanation: "El carril de aceleración sirve para igualar velocidad con el tráfico de la autopista. El conductor que se incorpora debe ceder el paso a los que ya circulan."
  },
  {
    id: 64, category: "prioridad",
    question: "¿Cuándo tienen preferencia los peatones sobre los vehículos en un paso señalizado?",
    options: ["Nunca, siempre ceden el paso", "Siempre que estén cruzando o esperando para cruzar", "Solo si el semáforo de peatones está en verde", "Solo cuando el coche circula a menos de 30 km/h"],
    correct: 1,
    explanation: "En los pasos de peatones señalizados, los peatones tienen preferencia siempre: tanto cuando ya están cruzando como cuando esperan para hacerlo."
  },
  {
    id: 65, category: "prioridad",
    question: "En una intersección con semáforo averiado, ¿qué norma aplica?",
    options: ["Tiene prioridad el que lleva más prisa", "Se aplica la norma de la derecha como si no hubiera señalización", "El vehículo mayor tiene prioridad", "Todos se detienen indefinidamente"],
    correct: 1,
    explanation: "Ante un semáforo averiado, se aplican las normas generales de prioridad: la norma de la derecha y el sentido común para avanzar de forma ordenada y segura."
  },

  // ==========================================
  // VELOCIDAD Y DISTANCIAS (20)
  // ==========================================
  {
    id: 66, category: "velocidad",
    question: "¿Cuál es la velocidad máxima en autopista para turismos?",
    options: ["100 km/h", "110 km/h", "120 km/h", "130 km/h"],
    correct: 2,
    explanation: "La velocidad máxima en autopistas y autovías para turismos es de 120 km/h, salvo señalización específica que indique otro límite."
  },
  {
    id: 67, category: "velocidad",
    question: "¿Cuál es la velocidad máxima en zona urbana con carácter general?",
    options: ["30 km/h", "40 km/h", "50 km/h", "60 km/h"],
    correct: 2,
    explanation: "El límite general en zonas urbanas es 50 km/h. Puede haber zonas específicas con 30 km/h (zonas 30) o 20 km/h (zonas de coexistencia)."
  },
  {
    id: 68, category: "velocidad",
    question: "¿Cuál es la velocidad máxima en carretera convencional para turismos?",
    options: ["80 km/h", "90 km/h", "100 km/h", "110 km/h"],
    correct: 1,
    explanation: "En carreteras convencionales (sin separación física entre sentidos), la velocidad máxima para turismos es de 90 km/h."
  },
  {
    id: 69, category: "velocidad",
    question: "¿Cuál es la velocidad máxima para turismos en vías de doble calzada que no son autopista ni autovía?",
    options: ["90 km/h", "100 km/h", "110 km/h", "120 km/h"],
    correct: 1,
    explanation: "En vías de doble calzada o con separador central que no tienen la categoría de autopista o autovía, el límite para turismos es de 100 km/h."
  },
  {
    id: 70, category: "velocidad",
    question: "¿Cuál es la velocidad mínima que debes mantener en autopista si el máximo es 120 km/h?",
    options: ["40 km/h", "50 km/h", "60 km/h", "80 km/h"],
    correct: 2,
    explanation: "La velocidad mínima en autopistas es la mitad de la velocidad máxima permitida. Con límite de 120 km/h, el mínimo es 60 km/h."
  },
  {
    id: 71, category: "velocidad",
    question: "¿A qué distancia mínima de seguridad debes circular respecto al vehículo de delante a 120 km/h?",
    options: ["50 metros", "75 metros", "100 metros", "120 metros"],
    correct: 2,
    explanation: "A 120 km/h se requieren al menos 100 metros de distancia de seguridad (equivale a unos 3 segundos). La regla del tiempo se cumple más rigurosamente a altas velocidades."
  },
  {
    id: 72, category: "velocidad",
    question: "¿Cuándo está permitido superar el límite de velocidad señalizado para adelantar?",
    options: ["Sí, hasta un 20% más para adelantar con seguridad", "Sí, hasta 30 km/h más en autopista", "No, nunca está permitido superar el límite", "Sí, siempre que la maniobra sea rápida"],
    correct: 2,
    explanation: "Nunca está permitido superar el límite de velocidad señalizado, ni siquiera durante un adelantamiento. La infracción por exceso de velocidad es independiente de la maniobra."
  },
  {
    id: 73, category: "velocidad",
    question: "¿Qué es la distancia de seguridad?",
    options: ["El espacio mínimo entre vehículos que circulan en sentido contrario", "El espacio libre que debe mantenerse con el vehículo de delante para parar en caso de frenada brusca", "La distancia mínima al arcén", "El margen lateral con los ciclistas"],
    correct: 1,
    explanation: "La distancia de seguridad es el espacio que debe haber entre tu vehículo y el de delante para poder frenar con seguridad si el otro para bruscamente."
  },
  {
    id: 74, category: "velocidad",
    question: "¿Qué velocidad máxima se aplica cuando hay trabajadores en la calzada (zona de obras)?",
    options: ["La señalizada en la zona de obras, siempre inferior a la normal", "La habitual de la vía", "50 km/h en cualquier tipo de vía", "20 km/h"],
    correct: 0,
    explanation: "En zonas de obras se instalan señales temporales de velocidad que deben respetarse. Siempre son inferiores al límite habitual de la vía."
  },
  {
    id: 75, category: "velocidad",
    question: "¿Cuál es el límite de velocidad para un conductor novel (menos de 2 años de permiso) en autopista?",
    options: ["100 km/h", "110 km/h", "120 km/h", "Los mismos límites que cualquier conductor"],
    correct: 3,
    explanation: "Los conductores noveles tienen los mismos límites de velocidad que el resto, pero deben ser especialmente prudentes por su menor experiencia."
  },
  {
    id: 76, category: "velocidad",
    question: "¿Qué velocidad máxima se aplica en un paso de peatones sin semáforo cuando hay peatones esperando?",
    options: ["20 km/h", "30 km/h", "La velocidad necesaria para poder detenerse antes del paso", "No hay límite específico"],
    correct: 2,
    explanation: "No hay un límite numérico específico, pero debes circular a la velocidad adecuada para poder detenerte antes del paso si alguien quiere cruzar."
  },
  {
    id: 77, category: "velocidad",
    question: "¿Cuál es el límite de velocidad en zonas de coexistencia peatonal?",
    options: ["10 km/h", "20 km/h", "30 km/h", "50 km/h"],
    correct: 1,
    explanation: "En zonas de coexistencia (donde peatones y vehículos comparten el espacio), el límite de velocidad es de 20 km/h."
  },
  {
    id: 78, category: "velocidad",
    question: "Con lluvia intensa en autopista, ¿a qué velocidad máxima debes circular?",
    options: ["120 km/h (igual que siempre)", "100 km/h", "90 km/h", "La que las condiciones permitan con seguridad, siendo la visibilidad el factor clave"],
    correct: 3,
    explanation: "Con lluvia o mal tiempo debes adaptar la velocidad a las condiciones. Aunque el límite formal no cambia, circular a 120 km/h con lluvia intensa puede ser imprudente e incluso ilegal."
  },
  {
    id: 79, category: "velocidad",
    question: "¿Qué es la velocidad de seguridad?",
    options: ["El límite señalizado en cada vía", "La velocidad que permite controlar el vehículo ante cualquier incidencia previsible", "La velocidad recomendada por el fabricante del vehículo", "50 km/h en cualquier circunstancia"],
    correct: 1,
    explanation: "La velocidad de seguridad es la que permite al conductor dominar el vehículo y detenerlo ante cualquier incidencia previsible, teniendo en cuenta la vía, el tráfico y las condiciones."
  },
  {
    id: 80, category: "velocidad",
    question: "¿Qué velocidad máxima se aplica en un área escolar durante el horario de entrada o salida?",
    options: ["50 km/h", "30 km/h", "La señalizada específicamente para la zona", "20 km/h"],
    correct: 2,
    explanation: "En áreas escolares se instalan señales de velocidad específicas (normalmente 30 km/h) que deben respetarse especialmente en los horarios de entrada y salida de alumnos."
  },
  {
    id: 81, category: "velocidad",
    question: "¿Cuál es la distancia mínima que debe marcarse el cuentakilómetros para que un conductor pierda puntos por exceso de velocidad en ciudad?",
    options: ["Superar en cualquier km/h el límite", "51 km/h o más (1 km/h de exceso)", "61 km/h", "71 km/h"],
    correct: 1,
    explanation: "Cualquier exceso sobre el límite señalizado es una infracción. Circular a 51 km/h en una zona limitada a 50 ya es una infracción leve que puede suponer sanción."
  },
  {
    id: 82, category: "velocidad",
    question: "¿Qué relación tiene la velocidad con la distancia de frenado?",
    options: ["Es proporcional: al doble de velocidad, el doble de distancia", "Aumenta al cuadrado: al doble de velocidad, cuatro veces más distancia de frenado", "No hay relación directa", "La distancia de frenado no varía con la velocidad"],
    correct: 1,
    explanation: "La distancia de frenado crece con el cuadrado de la velocidad. Si duplicas la velocidad, necesitas cuatro veces más distancia para detenerte."
  },
  {
    id: 83, category: "velocidad",
    question: "¿Cuál es el límite de velocidad en un carril de aceleración en autopista?",
    options: ["50 km/h", "80 km/h", "El mismo que la autopista (120 km/h)", "No hay límite específico, debe adaptarse"],
    correct: 2,
    explanation: "En los carriles de aceleración y deceleración de autopista se aplica el mismo límite máximo que en la autopista (120 km/h), aunque debes ajustar la velocidad a las condiciones."
  },
  {
    id: 84, category: "velocidad",
    question: "¿Cuándo puedes circular a 90 km/h en una vía urbana?",
    options: ["Cuando no haya peatones", "Nunca, el máximo urbano es 50 km/h salvo señalización específica", "De noche, si la vía está vacía", "Si la calzada tiene 4 carriles"],
    correct: 1,
    explanation: "El límite general en zona urbana es 50 km/h. Solo si hay una señal específica que autorice una velocidad superior se puede circular a más."
  },
  {
    id: 85, category: "velocidad",
    question: "¿Cuál es el efecto del viento lateral fuerte sobre el vehículo a alta velocidad?",
    options: ["Ninguno en vehículos modernos", "Puede desestabilizarlo, especialmente a vehículos altos y ligeros", "Solo afecta a las motos", "Mejora la estabilidad por el efecto aerodinámico"],
    correct: 1,
    explanation: "El viento lateral fuerte puede desestabilizar el vehículo, sobre todo en puentes, túneles de salida, zonas de sombra de viento y en vehículos altos (furgones, camiones). Debes reducir la velocidad."
  },

  // ==========================================
  // ADELANTAMIENTO (12)
  // ==========================================
  {
    id: 86, category: "adelantamiento",
    question: "¿Cuándo está prohibido adelantar en un paso de peatones?",
    options: ["Solo si hay peatones cruzando", "Siempre, en cualquier circunstancia", "Solo de noche", "Solo si el paso tiene semáforo"],
    correct: 1,
    explanation: "Está absolutamente prohibido adelantar en los pasos de peatones y en sus inmediaciones, independientemente de si hay peatones cruzando o no."
  },
  {
    id: 87, category: "adelantamiento",
    question: "¿Qué debes hacer antes de iniciar un adelantamiento?",
    options: ["Tocar el claxon y acelerar directamente", "Comprobar que la vía está libre, señalizar, y que hay espacio y visibilidad suficientes", "Avisar al vehículo de atrás con los frenos", "Encender las luces de cruce"],
    correct: 1,
    explanation: "Antes de adelantar: comprueba que la vía adelante está libre, que el retrovisor no muestra nadie adelantándote, señaliza con el intermitente izquierdo, y asegúrate de tener visibilidad y espacio."
  },
  {
    id: 88, category: "adelantamiento",
    question: "¿Está permitido adelantar en una intersección sin señalizar?",
    options: ["Sí, siempre que haya visibilidad", "No, está prohibido adelantar en intersecciones", "Solo si es una vía prioritaria", "Solo si la intersección es de poca importancia"],
    correct: 1,
    explanation: "El adelantamiento está prohibido en intersecciones salvo en las que la calzada principal esté señalizada como prioritaria. La falta de visibilidad en intersecciones lo hace especialmente peligroso."
  },
  {
    id: 89, category: "adelantamiento",
    question: "¿A qué distancia mínima del inicio de un cambio de rasante (cima) está prohibido adelantar?",
    options: ["No hay una distancia fija, depende de la visibilidad", "50 metros", "100 metros", "200 metros"],
    correct: 0,
    explanation: "No existe una distancia fija. La prohibición de adelantar se aplica cuando la visibilidad no es suficiente para completar la maniobra con seguridad, lo que varía según la velocidad y las condiciones."
  },
  {
    id: 90, category: "adelantamiento",
    question: "¿Qué debe hacer el conductor que va a ser adelantado?",
    options: ["Acelerar para que el adelantamiento sea más rápido", "Mantener su velocidad y posición, facilitando la maniobra", "Reducir la velocidad drásticamente", "Moverse hacia el centro de la calzada"],
    correct: 1,
    explanation: "El vehículo que va a ser adelantado no debe obstaculizar la maniobra ni acelerar. Debe mantener su velocidad y posición facilitando el adelantamiento."
  },
  {
    id: 91, category: "adelantamiento",
    question: "¿Cuándo está permitido adelantar por la derecha?",
    options: ["Nunca, siempre hay que adelantar por la izquierda", "Cuando el vehículo de delante va a girar a la izquierda y hay espacio suficiente a su derecha", "En autopista, si el de la izquierda no cede el paso", "Siempre que haya prisa"],
    correct: 1,
    explanation: "El adelantamiento por la derecha solo está permitido cuando el vehículo de delante señaliza que va a girar a la izquierda y hay espacio suficiente para pasar por su derecha de forma segura."
  },
  {
    id: 92, category: "adelantamiento",
    question: "¿Está prohibido adelantar en las curvas?",
    options: ["No, si la visibilidad es suficiente", "Sí, siempre en cualquier curva", "Depende del tipo de curva", "Solo en curvas ciegas con línea continua"],
    correct: 0,
    explanation: "No hay una prohibición genérica de adelantar en todas las curvas. Está prohibido cuando la visibilidad no es suficiente. En curvas con buena visibilidad y sin línea continua puede ser legal."
  },
  {
    id: 93, category: "adelantamiento",
    question: "Tras completar un adelantamiento, ¿qué debes hacer?",
    options: ["Quedarte en el carril izquierdo por comodidad", "Incorporarte a tu carril derecho señalizando y dejando espacio al adelantado", "Frenar inmediatamente para dejar espacio", "Apagar el intermitente antes de incorporarte"],
    correct: 1,
    explanation: "Tras adelantar: señaliza con el intermitente derecho, vuelve al carril derecho dejando suficiente espacio al vehículo adelantado, y ajusta la velocidad."
  },
  {
    id: 94, category: "adelantamiento",
    question: "¿Está permitido adelantar cuando hay niebla intensa?",
    options: ["Sí, si las luces de niebla están encendidas", "No, la falta de visibilidad lo hace extremadamente peligroso", "Solo en autopista con arcén amplio", "Sí, si se usa el claxon para avisar"],
    correct: 1,
    explanation: "Con niebla intensa, la visibilidad reducida hace imposible asegurar que el adelantamiento sea seguro. Es una maniobra extremadamente peligrosa que debe evitarse."
  },
  {
    id: 95, category: "adelantamiento",
    question: "¿Qué significa la señal de dos líneas paralelas, una continua y una discontinua, en el centro de la calzada?",
    options: ["Siempre prohibido adelantar en ambos sentidos", "El conductor que tiene la línea continua a su lado no puede cruzarla; el que tiene la discontinua sí puede", "Zona de obras", "Carril reversible"],
    correct: 1,
    explanation: "La doble línea mixta (continua + discontinua) prohíbe cruzar la línea al conductor que tiene la CONTINUA a su lado, pero permite cruzar al que tiene la DISCONTINUA."
  },
  {
    id: 96, category: "adelantamiento",
    question: "¿A un ciclista que circula por el arcén se le puede adelantar invadiendo el carril contrario?",
    options: ["No, nunca se puede invadir el carril contrario", "Sí, si la visibilidad y las condiciones lo permiten, manteniendo 1,5 metros de separación", "Solo si la bicicleta circula más lenta que 15 km/h", "Sí, siempre que el arcén sea estrecho"],
    correct: 1,
    explanation: "Para respetar la separación lateral mínima de 1,5 metros con el ciclista, es legal invadir parcialmente el carril contrario si la visibilidad es suficiente y no hay tráfico."
  },
  {
    id: 97, category: "adelantamiento",
    question: "¿Está prohibido adelantar inmediatamente antes y después de un túnel?",
    options: ["Solo dentro del túnel", "Sí, en los tramos sin visibilidad suficiente antes y dentro del túnel", "No hay restricciones especiales en túneles", "Solo de noche"],
    correct: 1,
    explanation: "En túneles y sus inmediaciones, la falta de visibilidad y el efecto de adaptación de los ojos hacen especialmente peligroso el adelantamiento. Se aplican las normas generales de visibilidad."
  },

  // ==========================================
  // ALCOHOL, DROGAS Y FÁRMACOS (15)
  // ==========================================
  {
    id: 98, category: "alcohol",
    question: "¿Cuál es la tasa de alcoholemia permitida para conductores en general?",
    options: ["0,25 mg/l en aire espirado", "0,50 mg/l en aire espirado", "0,30 mg/l en aire espirado", "0,80 mg/l en aire espirado"],
    correct: 0,
    explanation: "La tasa de alcoholemia permitida para conductores en general es de 0,25 mg/l en aire espirado (equivale a 0,5 g/l en sangre)."
  },
  {
    id: 99, category: "alcohol",
    question: "¿Cuál es la tasa para conductores noveles (menos de 2 años de permiso) y conductores profesionales?",
    options: ["0,25 mg/l en aire espirado", "0,15 mg/l en aire espirado", "0,10 mg/l en aire espirado", "0,00 mg/l (cero)"],
    correct: 1,
    explanation: "Los conductores con menos de 2 años de antigüedad en el permiso y los profesionales tienen un límite inferior: 0,15 mg/l en aire espirado (0,3 g/l en sangre)."
  },
  {
    id: 100, category: "alcohol",
    question: "¿Puede un conductor negarse a realizar la prueba de alcoholemia solicitada por un agente?",
    options: ["Sí, es un derecho del conductor", "No, la negativa es delito castigado con pena de prisión", "Sí, si ya realizó una prueba ese mismo día", "Solo puede negarse si no ha bebido nada"],
    correct: 1,
    explanation: "Negarse a las pruebas de detección de alcohol o drogas constituye un delito según el Código Penal, con pena de prisión de 6 meses a 1 año."
  },
  {
    id: 101, category: "alcohol",
    question: "¿Cuántos puntos se pierden por conducir con tasa de alcohol superior a la permitida?",
    options: ["2 puntos", "4 puntos", "6 puntos", "Todos los puntos del carnet"],
    correct: 2,
    explanation: "Conducir con una tasa de alcohol superior a la permitida supone la pérdida de 6 puntos del carnet de conducir, además de la sanción económica."
  },
  {
    id: 102, category: "alcohol",
    question: "¿Qué efecto tiene el alcohol sobre el tiempo de reacción del conductor?",
    options: ["Lo mejora por el efecto estimulante", "Lo aumenta, haciendo más lenta la respuesta ante peligros", "No tiene ningún efecto sobre el tiempo de reacción", "Solo afecta a la visión, no al tiempo de reacción"],
    correct: 1,
    explanation: "El alcohol altera el sistema nervioso central, aumentando el tiempo de reacción. Un conductor con alcohol tarda más en detectar un peligro y en reaccionar ante él."
  },
  {
    id: 103, category: "alcohol",
    question: "¿Cuántos cafés o tiempo son necesarios para eliminar el alcohol del organismo?",
    options: ["Dos cafés fuertes eliminan el alcohol rápidamente", "El tiempo es lo único que elimina el alcohol; el café solo reduce la somnolencia", "Ducharse con agua fría elimina el alcohol", "Hacer ejercicio intenso acelera la eliminación"],
    correct: 1,
    explanation: "Solo el tiempo elimina el alcohol del organismo. El café, el agua, el ejercicio o la ducha no aceleran la eliminación; solo pueden reducir la sensación de somnolencia."
  },
  {
    id: 104, category: "alcohol",
    question: "¿Qué diferencia hay entre la conducción bajo los efectos del alcohol y la conducción con tasas superiores a las permitidas?",
    options: ["No hay diferencia, ambas son la misma infracción", "La primera es delito penal; la segunda es infracción administrativa si no supera ciertos límites", "Solo la segunda es sancionable", "La primera es más grave siempre"],
    correct: 1,
    explanation: "Conducir con síntomas de embriaguez (pérdida de control) es delito penal. Superar la tasa permitida sin síntomas evidentes es infracción grave administrativa. Superar ciertos niveles también es delito."
  },
  {
    id: 105, category: "alcohol",
    question: "¿Qué efecto tienen los tranquilizantes y somníferos sobre la capacidad de conducir?",
    options: ["Ninguno a dosis normales", "Pueden reducir los reflejos y causar somnolencia, afectando gravemente la conducción", "Mejoran la concentración al reducir la ansiedad", "Solo afectan si se mezclan con alcohol"],
    correct: 1,
    explanation: "Los tranquilizantes, somníferos y muchos fármacos (antihistamínicos, antidepresivos) pueden afectar la conducción produciendo somnolencia y reduciendo los reflejos."
  },
  {
    id: 106, category: "alcohol",
    question: "¿Qué debe hacer un conductor que sabe que los medicamentos que toma pueden afectar a la conducción?",
    options: ["Conducir igual, los medicamentos no afectan mucho", "Consultar con el médico y abstenerse de conducir si hay riesgo", "Conducir solo trayectos cortos", "Aumentar la dosis de cafeína para compensar"],
    correct: 1,
    explanation: "Si tus medicamentos pueden afectar la conducción (somnolencia, visión borrosa, etc.), debes consultar con tu médico y abstenerte de conducir mientras tomes ese tratamiento."
  },
  {
    id: 107, category: "alcohol",
    question: "¿Cuándo puede someterse a un conductor a una prueba de detección de drogas?",
    options: ["Solo si ha tenido un accidente", "En cualquier momento, sin necesidad de sospecha", "Solo si se aprecia comportamiento anormal al volante", "Solo con autorización judicial"],
    correct: 1,
    explanation: "Los agentes pueden someter a cualquier conductor a pruebas de detección de alcohol o drogas en cualquier control, sin necesidad de que haya sospecha previa."
  },
  {
    id: 108, category: "alcohol",
    question: "¿Cómo afecta el alcohol a la visión del conductor?",
    options: ["Mejora la visión nocturna", "Reduce el campo visual, empeora la percepción de profundidad y distorsiona la visión", "No afecta la visión, solo los reflejos", "Amplía el campo visual"],
    correct: 1,
    explanation: "El alcohol reduce el campo visual (efecto túnel), empeora la percepción de profundidad y de las distancias, y dificulta la adaptación a los cambios de luz."
  },
  {
    id: 109, category: "alcohol",
    question: "¿Puede realizarse una segunda prueba de alcoholemia si el conductor lo solicita?",
    options: ["No, el resultado de la primera es definitivo", "Sí, tiene derecho a una segunda prueba con aparato diferente o análisis de sangre", "Solo si el resultado supera el doble del límite", "Sí, pero debe pagar el coste del análisis"],
    correct: 1,
    explanation: "El conductor tiene derecho a solicitar una segunda prueba. En caso de discrepancia entre las dos mediciones, se toma la más favorable para el conductor."
  },
  {
    id: 110, category: "alcohol",
    question: "¿Qué influye en el nivel de alcohol en sangre tras consumir bebidas alcohólicas?",
    options: ["Solo la cantidad de alcohol consumida", "El peso, el sexo, la alimentación, el tiempo y la cantidad de alcohol consumida", "Solo el peso corporal", "Solo si se ha comido antes o no"],
    correct: 1,
    explanation: "El nivel de alcohol en sangre depende de muchos factores: cantidad consumida, peso corporal, sexo (las mujeres metabolizan más lentamente), si se ha comido, y el tiempo transcurrido."
  },
  {
    id: 111, category: "alcohol",
    question: "¿Qué consecuencia tiene conducir bajo los efectos de drogas de tráfico?",
    options: ["Es solo una infracción leve si no hay accidente", "Es delito, con pena de prisión y suspensión del permiso de conducir", "Solo se pierde el carnet temporalmente", "Solo hay multa económica"],
    correct: 1,
    explanation: "Conducir bajo los efectos de drogas tóxicas, estupefacientes o psicotrópicos es un delito contra la seguridad vial, con pena de prisión de 3 a 6 meses y privación del permiso."
  },
  {
    id: 112, category: "alcohol",
    question: "¿Qué factor NO ayuda a eliminar el alcohol del organismo más rápidamente?",
    options: ["El tiempo transcurrido", "El café o el azúcar", "La actividad física intensa", "Todos los anteriores (b y c) son incorrectos"],
    correct: 3,
    explanation: "Solo el tiempo elimina el alcohol. El café, el azúcar, el agua fría o el ejercicio NO aceleran la metabolización del alcohol. Solo dan la falsa sensación de estar más despierto."
  },

  // ==========================================
  // MECÁNICA Y SEGURIDAD (18)
  // ==========================================
  {
    id: 113, category: "mecanica",
    question: "¿Qué debes hacer si se te revienta una rueda a alta velocidad?",
    options: ["Frenar bruscamente y tirar del volante hacia el lado opuesto", "Sujetar firmemente el volante, soltar el acelerador gradualmente y detenerse con suavidad", "Acelerar para mantener el control", "Cambiar de carril rápidamente"],
    correct: 1,
    explanation: "Ante un reventón: sujeta el volante con firmeza, no frenes bruscamente, suelta el acelerador con suavidad, deja que el vehículo se frene progresivamente y para en el arcén."
  },
  {
    id: 114, category: "mecanica",
    question: "¿Cuándo deben usarse las luces de emergencia (cuatro intermitentes)?",
    options: ["Para aparcar en zona de carga", "En situaciones de peligro, avería o emergencia que afecten al tráfico", "Al entrar en un túnel", "Para agradecer a otros conductores"],
    correct: 1,
    explanation: "Las luces de emergencia se usan para señalizar una situación de peligro, avería o emergencia. No está justificado usarlas para aparcar ilegalmente o en situaciones que no sean de emergencia."
  },
  {
    id: 115, category: "mecanica",
    question: "¿Qué indica el testigo de aceite encendido mientras se conduce?",
    options: ["Que es hora de cambiar el aceite", "Baja presión de aceite: debes detener el vehículo inmediatamente", "Que el nivel de aceite es óptimo", "Que el motor está caliente"],
    correct: 1,
    explanation: "El testigo rojo de aceite indica baja presión de lubricación. Es una emergencia: debes detenerte con seguridad inmediatamente porque el motor puede dañarse gravemente."
  },
  {
    id: 116, category: "mecanica",
    question: "¿Cuál es la función principal del ABS?",
    options: ["Reducir el consumo de combustible", "Evitar que las ruedas se bloqueen durante el frenado para mantener la dirección", "Mantener el vehículo estable en curvas", "Controlar la tracción en superficies resbaladizas"],
    correct: 1,
    explanation: "El ABS (Antiblockiersystem) evita que las ruedas se bloqueen al frenar bruscamente, lo que permite al conductor seguir dirigiendo el vehículo mientras frena."
  },
  {
    id: 117, category: "mecanica",
    question: "¿Cómo se debe frenar con ABS en una situación de emergencia?",
    options: ["Con bombeos rápidos del pedal de freno", "Pisando el freno a fondo y sin soltarlo mientras se dirige el vehículo", "Frenando progresivamente para no activar el ABS", "Usando solo el freno de mano"],
    correct: 1,
    explanation: "Con ABS, en emergencia, debes pisar el freno a fondo y mantenerlo pisado. El sistema bombea automáticamente. No sueltes el freno y sigue dirigiendo el vehículo."
  },
  {
    id: 118, category: "mecanica",
    question: "¿Qué es el ESP o control de estabilidad?",
    options: ["Un sistema que limita la velocidad máxima automáticamente", "Un sistema que detecta y corrige la inestabilidad del vehículo aplicando frenos individualmente", "El sistema de dirección asistida", "El control de crucero adaptativo"],
    correct: 1,
    explanation: "El ESP (Electronic Stability Program) detecta cuando el vehículo se desvía de la trayectoria deseada y aplica frenado en ruedas individuales para estabilizarlo."
  },
  {
    id: 119, category: "mecanica",
    question: "¿Qué indica el testigo de temperatura del motor?",
    options: ["Que el motor ha alcanzado su temperatura óptima de trabajo", "Que el motor está sobrecalentando: debes parar de forma segura", "Que la calefacción está encendida", "Que el ventilador del radiador no funciona"],
    correct: 1,
    explanation: "Si el testigo de temperatura está en rojo o la aguja está en el máximo, el motor se está sobrecalentando. Debes parar el vehículo con seguridad y apagar el motor."
  },
  {
    id: 120, category: "mecanica",
    question: "¿Qué efecto tiene el acuaplaning (aquaplaning)?",
    options: ["El vehículo gana velocidad al reducir la fricción con el agua", "Las ruedas pierden el contacto con el suelo al circular sobre agua, perdiendo la dirección y el frenado", "Solo afecta a los frenos, no a la dirección", "Es un fenómeno que solo ocurre a más de 150 km/h"],
    correct: 1,
    explanation: "El acuaplaning ocurre cuando el agua no puede evacuarse bajo los neumáticos y las ruedas 'flotan' sobre el agua. Se pierde toda tracción, frenado y dirección."
  },
  {
    id: 121, category: "mecanica",
    question: "¿Qué presión deben tener los neumáticos?",
    options: ["La misma en todas las ruedas: 2,0 bar siempre", "La indicada por el fabricante del vehículo para cada situación de carga", "Lo máximo posible para mayor seguridad", "La mínima posible para mayor agarre"],
    correct: 1,
    explanation: "La presión correcta es la especificada por el fabricante del vehículo (en el marco de la puerta o el manual). Varía según la carga del vehículo y el eje (delantera/trasera)."
  },
  {
    id: 122, category: "mecanica",
    question: "¿Cuándo es obligatorio llevar chaleco reflectante en el vehículo?",
    options: ["No es obligatorio, solo recomendable", "Es obligatorio y debe ponerse antes de salir del vehículo en cualquier avería o accidente", "Solo si se conduce de noche", "Solo en autopistas y autovías"],
    correct: 1,
    explanation: "Es obligatorio llevar al menos un chaleco reflectante. En caso de avería o accidente, debes ponértelo ANTES de salir del vehículo para ser visible."
  },
  {
    id: 123, category: "mecanica",
    question: "¿Qué debes comprobar antes de un viaje largo?",
    options: ["Solo el nivel de combustible", "Niveles de aceite, agua, líquido de frenos, presión de ruedas, luces y documentación", "Solo las luces y los frenos", "Solo la presión de las ruedas"],
    correct: 1,
    explanation: "Antes de un viaje largo, revisa: niveles (aceite, refrigerante, limpiaparabrisas, frenos), presión y estado de los neumáticos, luces, frenos, y que llevas la documentación obligatoria."
  },
  {
    id: 124, category: "mecanica",
    question: "¿Qué profundidad mínima del dibujo deben tener los neumáticos?",
    options: ["1 mm", "1,6 mm", "3 mm", "4 mm"],
    correct: 1,
    explanation: "La profundidad mínima legal del dibujo de los neumáticos es de 1,6 mm. Por debajo de este valor, la capacidad de evacuación de agua y el agarre disminuyen peligrosamente."
  },
  {
    id: 125, category: "mecanica",
    question: "¿Cuál es la función del airbag?",
    options: ["Sustituye al cinturón de seguridad", "Complementa al cinturón de seguridad, amortiguando el impacto del cuerpo contra el habitáculo", "Protege principalmente en impactos laterales", "Funciona independientemente de que se lleve cinturón"],
    correct: 1,
    explanation: "El airbag es un complemento del cinturón de seguridad, no un sustituto. Se infla en milisegundos en un choque frontal para amortiguar el impacto. Sin cinturón puede causar lesiones graves."
  },
  {
    id: 126, category: "mecanica",
    question: "¿Qué puede ocurrir si la dirección del vehículo vibra al frenar?",
    options: ["Es normal, indica que el ABS está funcionando", "Puede indicar que los discos de freno están deformados (combados)", "Indica que la presión de los neumáticos es baja", "Es señal de que el aceite de la dirección está bajo"],
    correct: 1,
    explanation: "La vibración en el volante al frenar suele indicar que los discos de freno están deformados (combados o ovalados), lo que requiere revisión mecánica urgente."
  },
  {
    id: 127, category: "mecanica",
    question: "¿Qué indica el símbolo de una batería en el cuadro de instrumentos?",
    options: ["Que la batería está completamente cargada", "Que el alternador no está cargando la batería correctamente", "Que es hora de cambiar la batería", "Que el vehículo está en modo eléctrico"],
    correct: 1,
    explanation: "El testigo de batería indica que el circuito de carga no funciona correctamente, es decir, que el alternador no está cargando la batería. El vehículo puede apagarse pronto."
  },
  {
    id: 128, category: "mecanica",
    question: "Si el vehículo derrapa en hielo, ¿qué debes hacer?",
    options: ["Frenar bruscamente para recuperar el control", "Girar el volante bruscamente hacia el lado contrario al derrape", "Soltar el acelerador suavemente y girar el volante en la dirección del derrape", "Pisar el freno y el embrague a la vez"],
    correct: 2,
    explanation: "En un derrape sobre hielo: suelta el acelerador con suavidad y gira el volante en la MISMA dirección del derrape (contravolante). No frenes bruscamente porque agravaría el derrape."
  },
  {
    id: 129, category: "mecanica",
    question: "¿Qué efecto tiene conducir con los neumáticos con poca presión?",
    options: ["Mayor agarre y seguridad", "Mayor consumo de combustible, desgaste irregular y riesgo de reventón", "Mejor comportamiento en curva", "Menor distancia de frenado"],
    correct: 1,
    explanation: "Los neumáticos con presión insuficiente aumentan el consumo de combustible, se desgastan más rápido en los bordes, aumentan la temperatura interior y el riesgo de reventón."
  },
  {
    id: 130, category: "mecanica",
    question: "¿En qué situación debes activar el freno de mano (freno de estacionamiento)?",
    options: ["Al parar en semáforo siempre", "Al estacionar el vehículo y siempre que se deje sin conductor", "Solo en pendientes pronunciadas", "Solo cuando el freno de pie no funciona"],
    correct: 1,
    explanation: "El freno de estacionamiento debe usarse siempre que dejes el vehículo aparcado o sin conductor, independientemente de si hay pendiente o no."
  },

  // ==========================================
  // ILUMINACIÓN (12)
  // ==========================================
  {
    id: 131, category: "iluminacion",
    question: "¿Cuándo es obligatorio el uso de luces de cruce (cortas) de día?",
    options: ["Siempre, incluso de día en todas las vías", "En túneles, bajo lluvia intensa, niebla o cuando la visibilidad sea reducida", "Solo de noche", "Solo en autopistas"],
    correct: 1,
    explanation: "Las luces de cruce son obligatorias de noche, en túneles, y de día cuando las condiciones reducen la visibilidad (lluvia, niebla, nieve, etc.)."
  },
  {
    id: 132, category: "iluminacion",
    question: "¿Cuándo deben usarse las luces largas (de carretera)?",
    options: ["Siempre en autopista de noche", "En vías interurbanas cuando no deslumbren a otros vehículos", "Solo en carreteras sin iluminación", "Siempre que se circule por encima de 90 km/h"],
    correct: 1,
    explanation: "Las luces largas se usan en vías interurbanas cuando no hay vehículos en sentido contrario ni delante. Al aproximarse a otro vehículo, hay que cambiar a cortas para no deslumbrar."
  },
  {
    id: 133, category: "iluminacion",
    question: "¿A qué distancia debes cambiar las luces largas a cortas al encontrar un vehículo en sentido contrario?",
    options: ["A 50 metros", "A 150 metros", "A 200 metros", "A 400 metros"],
    correct: 1,
    explanation: "Debes cambiar a luces cortas cuando el vehículo contrario esté a menos de 150 metros, para evitar deslumbrarlo. Conviene hacerlo antes si el vehículo está más lejos."
  },
  {
    id: 134, category: "iluminacion",
    question: "¿Para qué sirven las luces de niebla delanteras?",
    options: ["Para aumentar la visibilidad en condiciones de niebla, lluvia intensa o nieve", "Para señalizar emergencias", "Para iluminar mejor la carretera de noche sin niebla", "Son decorativas, sin función específica"],
    correct: 0,
    explanation: "Las luces de niebla delanteras están diseñadas para iluminar la calzada de forma rasante en condiciones de niebla, lluvia densa o nieve, donde las luces normales crean deslumbramiento."
  },
  {
    id: 135, category: "iluminacion",
    question: "¿Cuándo deben usarse las luces de niebla traseras?",
    options: ["Siempre de noche", "Solo cuando la visibilidad sea inferior a 50 metros por niebla, lluvia o nieve intensa", "En cualquier condición de lluvia", "Nunca, son peligrosas para el conductor de detrás"],
    correct: 1,
    explanation: "Las luces de niebla traseras (rojas, muy intensas) solo deben usarse cuando la visibilidad sea inferior a 50 metros. Usarlas sin necesidad deslumbra y puede causar accidentes."
  },
  {
    id: 136, category: "iluminacion",
    question: "¿Qué luz debes usar para señalizar que el vehículo está estacionado en una vía mal iluminada de noche?",
    options: ["Luces de cruce (cortas)", "Luces de posición (luces de estacionamiento)", "Luces de niebla", "Luces largas"],
    correct: 1,
    explanation: "Al estacionar en una vía poco iluminada de noche, debes dejar las luces de posición (luces de estacionamiento) encendidas para que el vehículo sea visible."
  },
  {
    id: 137, category: "iluminacion",
    question: "¿Cuándo deben usarse las luces de marcha atrás?",
    options: ["Solo de noche", "Se activan automáticamente al meter la marcha atrás", "El conductor las activa cuando necesita retroceder", "Solo si hay obstáculos detrás"],
    correct: 1,
    explanation: "Las luces de marcha atrás (blancas) se activan automáticamente al engancharse la marcha atrás. Indican a los demás usuarios que el vehículo va a retroceder."
  },
  {
    id: 138, category: "iluminacion",
    question: "Si un vehículo que circula en sentido contrario te deslumbra, ¿qué debes hacer?",
    options: ["Encender también tus luces largas para avisar", "Mirar hacia el borde derecho de la calzada y reducir velocidad", "Cerrar los ojos brevemente y seguir", "Frenar bruscamente y parar"],
    correct: 1,
    explanation: "Al ser deslumbrado: mira hacia el borde derecho de la calzada (no al centro ni a la fuente de luz), reduce la velocidad y no frenes bruscamente."
  },
  {
    id: 139, category: "iluminacion",
    question: "¿Qué indica un testigo de color naranja/ámbar en el cuadro de instrumentos?",
    options: ["Emergencia: parar inmediatamente", "Aviso o atención: algo requiere revisión próxima pero no es urgente", "Todo funciona correctamente", "El motor está en temperatura óptima"],
    correct: 1,
    explanation: "Los testigos ámbar/naranja son de AVISO: indican que hay algo que revisar, pero sin urgencia inmediata. Los rojos son de emergencia (parar). Los verdes/azules son informativos."
  },
  {
    id: 140, category: "iluminacion",
    question: "¿Es obligatorio encender las luces al entrar en un túnel aunque sea de día?",
    options: ["No, solo en túneles de más de 500 metros", "Sí, siempre que se entre en un túnel con señal de encendido de luces", "Solo si el túnel está oscuro", "No, los vehículos modernos lo hacen automáticamente"],
    correct: 1,
    explanation: "Al entrar en un túnel señalizado con la señal de encendido de luces, es obligatorio encenderlas independientemente de la hora del día y la longitud del túnel."
  },
  {
    id: 141, category: "iluminacion",
    question: "¿Para qué sirve el uso de luces de cruce durante el día en carretera?",
    options: ["No tienen ninguna utilidad de día", "Aumentan la visibilidad del vehículo para los demás usuarios", "Reducen el consumo del motor", "Activan el control de crucero"],
    correct: 1,
    explanation: "Usar las luces de cruce de día mejora la visibilidad del vehículo ante otros conductores, peatones y ciclistas, reduciendo el riesgo de accidente."
  },
  {
    id: 142, category: "iluminacion",
    question: "¿Cuál es la diferencia entre las luces de posición y las luces de cruce?",
    options: ["No hay diferencia, son lo mismo", "Las de posición son pequeñas y sirven para ser visto; las de cruce iluminan la calzada", "Las de posición iluminan más", "Las de cruce son solo para adelantar"],
    correct: 1,
    explanation: "Las luces de posición (piloto) son de baja intensidad y solo hacen visible el vehículo. Las de cruce (cortas) iluminan la calzada para que el conductor pueda ver."
  },

  // ==========================================
  // CONDUCCIÓN EFICIENTE (10)
  // ==========================================
  {
    id: 143, category: "medioambiente",
    question: "¿Qué gas es el principal responsable del efecto invernadero emitido por los vehículos?",
    options: ["Monóxido de carbono (CO)", "Dióxido de carbono (CO₂)", "Óxidos de nitrógeno (NOx)", "Partículas finas (PM2.5)"],
    correct: 1,
    explanation: "El CO₂ es el principal gas de efecto invernadero emitido por los vehículos. Aunque el CO es más tóxico, el CO₂ es el que más contribuye al cambio climático en términos de volumen."
  },
  {
    id: 144, category: "medioambiente",
    question: "¿Qué etiqueta ambiental corresponde a los vehículos eléctricos puros según la DGT?",
    options: ["Etiqueta ECO", "Etiqueta B", "Etiqueta C", "Etiqueta 0 emisiones"],
    correct: 3,
    explanation: "Los vehículos 100% eléctricos y los de pila de combustible tienen la etiqueta '0 emisiones' (cero emisiones), la más favorable del sistema de etiquetado ambiental."
  },
  {
    id: 145, category: "medioambiente",
    question: "¿Qué acción reduce más el consumo de combustible en carretera?",
    options: ["Llevar el vehículo recargado al máximo de equipaje", "Circular a velocidad constante y moderada con marchas largas", "Climatización al máximo", "Usar las luces largas permanentemente"],
    correct: 1,
    explanation: "Circular a velocidad constante y moderada en marchas largas (sin revoluciones innecesarias) es la forma más eficiente de reducir el consumo de combustible."
  },
  {
    id: 146, category: "medioambiente",
    question: "¿Cuándo debe apagarse el motor del vehículo para reducir emisiones en ciudad?",
    options: ["Nunca, apagarle y arrancarle consume más", "En paradas previsibles de más de 60 segundos (semáforos largos, esperas)", "Solo si la parada es de más de 5 minutos", "Solo en zonas de bajas emisiones señalizadas"],
    correct: 1,
    explanation: "Apagar el motor en paradas de más de 60 segundos ahorra combustible y reduce emisiones. Los vehículos modernos con Start&Stop lo hacen automáticamente."
  },
  {
    id: 147, category: "medioambiente",
    question: "¿Qué efecto tiene circular con las ventanillas abiertas a alta velocidad en el consumo de combustible?",
    options: ["Lo reduce porque enfría el motor", "Lo aumenta por la resistencia aerodinámica", "No tiene efecto significativo", "Solo afecta si todas las ventanillas están abiertas"],
    correct: 1,
    explanation: "A alta velocidad, las ventanillas abiertas aumentan la resistencia aerodinámica y por tanto el consumo de combustible. A más de 80 km/h es más eficiente usar el climatizador."
  },
  {
    id: 148, category: "medioambiente",
    question: "¿Cómo influye la presión de los neumáticos en el consumo de combustible?",
    options: ["No influye en el consumo", "Una presión baja aumenta el consumo; la presión correcta lo optimiza", "Mayor presión, mayor consumo", "Solo la presión trasera afecta al consumo"],
    correct: 1,
    explanation: "Los neumáticos con baja presión tienen mayor rodadura y por tanto más resistencia al rodamiento, aumentando el consumo de combustible. La presión correcta puede ahorrar un 3-5%."
  },
  {
    id: 149, category: "medioambiente",
    question: "¿Qué significa la etiqueta ECO de la DGT?",
    options: ["Vehículo 100% eléctrico", "Vehículos híbridos enchufables, híbridos convencionales o de gas con muy bajas emisiones", "Vehículos Euro 6 de gasolina", "Todos los vehículos fabricados después de 2015"],
    correct: 1,
    explanation: "La etiqueta ECO identifica vehículos híbridos enchufables con autonomía >40 km, vehículos de gas (GLP, GNC) y vehículos de hidrógeno, con menores emisiones que los convencionales."
  },
  {
    id: 150, category: "medioambiente",
    question: "¿Cuándo es recomendable anticiparse a las situaciones de tráfico para conducir de forma eficiente?",
    options: ["Solo en autopista", "Siempre: la anticipación evita aceleraciones y frenadas bruscas que consumen más", "Solo en ciudad, en carretera no importa", "Solo si el vehículo tiene control de crucero"],
    correct: 1,
    explanation: "La conducción anticipada (levantar el pie del acelerador antes de frenar, mantener distancias suficientes) reduce aceleraciones y frenadas bruscas, ahorrando combustible y reduciendo el desgaste."
  },
  {
    id: 151, category: "medioambiente",
    question: "¿Qué son las zonas de bajas emisiones (ZBE) en las ciudades?",
    options: ["Zonas donde la velocidad está limitada a 20 km/h", "Áreas urbanas donde se restringe la circulación de vehículos más contaminantes", "Zonas reservadas exclusivamente para vehículos eléctricos", "Carreteras de peaje para vehículos grandes"],
    correct: 1,
    explanation: "Las ZBE son áreas urbanas donde solo pueden circular vehículos con etiqueta ambiental favorable, limitando o prohibiendo el acceso a los más contaminantes para mejorar la calidad del aire."
  },
  {
    id: 152, category: "medioambiente",
    question: "¿Cuánto puede aumentar el consumo de combustible por llevar la baca o portaequipajes vacío montado?",
    options: ["No aumenta el consumo", "Hasta un 10-15% por la mayor resistencia aerodinámica", "Solo 1-2%", "Un 50% más"],
    correct: 1,
    explanation: "Una baca o portaequipajes vacío aumenta la resistencia aerodinámica y puede incrementar el consumo de combustible hasta un 10-15%. Es recomendable retirarlo cuando no se use."
  },

  // ==========================================
  // ACCIDENTES Y PRIMEROS AUXILIOS (12)
  // ==========================================
  {
    id: 153, category: "accidentes",
    question: "¿Cuál es el orden correcto del protocolo PAS ante un accidente?",
    options: ["Socorrer, Proteger, Avisar", "Proteger, Avisar, Socorrer", "Avisar, Socorrer, Proteger", "Proteger, Socorrer, Avisar"],
    correct: 1,
    explanation: "El protocolo PAS es: 1) PROTEGER la zona del accidente (evitar nuevos accidentes), 2) AVISAR a los servicios de emergencia (112), 3) SOCORRER a los heridos."
  },
  {
    id: 154, category: "accidentes",
    question: "¿A qué número se llama en caso de accidente con heridos en España?",
    options: ["091 (Policía)", "112 (Emergencias europeo)", "061 (Urgencias médicas)", "080 (Bomberos)"],
    correct: 1,
    explanation: "El 112 es el número único de emergencias europeo. Funciona desde cualquier teléfono (incluso sin cobertura propia o batería) y conecta con todos los servicios de emergencia."
  },
  {
    id: 155, category: "accidentes",
    question: "¿Cuándo debes mover a un herido en un accidente de tráfico?",
    options: ["Siempre para ponerlo más cómodo", "Nunca, excepto si hay riesgo inmediato de incendio o hundimiento", "Siempre si está inconsciente", "Solo si el herido lo pide expresamente"],
    correct: 1,
    explanation: "No debes mover a un herido a menos que exista un peligro inmediato (fuego, hundimiento). Moverlo incorrectamente puede agravar lesiones de columna vertebral."
  },
  {
    id: 156, category: "accidentes",
    question: "¿Qué es la posición lateral de seguridad (PLS)?",
    options: ["Colocar al herido boca arriba con las piernas elevadas", "Colocar al herido de lado para evitar que se ahogue con vómitos, si respira", "Sentar al herido apoyado contra la rueda del coche", "Colocar al herido boca abajo"],
    correct: 1,
    explanation: "La PLS coloca al herido inconsciente (pero que respira) de lado, con la boca apuntando hacia abajo, para evitar que se atragante si vomita."
  },
  {
    id: 157, category: "accidentes",
    question: "¿Cuántas compresiones por minuto se realizan en el masaje cardíaco de reanimación (RCP)?",
    options: ["30 por minuto", "60 por minuto", "100-120 por minuto", "150 por minuto"],
    correct: 2,
    explanation: "Las compresiones torácicas en la RCP deben realizarse a un ritmo de 100-120 por minuto, con una profundidad de 5-6 cm. Se alternan 30 compresiones con 2 ventilaciones."
  },
  {
    id: 158, category: "accidentes",
    question: "Si el herido tiene una hemorragia externa intensa, ¿qué debes hacer?",
    options: ["Aplicar torniquete siempre en primer lugar", "Presionar directamente sobre la herida con un trapo limpio o apósito", "Elevar la extremidad pero no presionar", "Limpiar la herida con agua antes de presionar"],
    correct: 1,
    explanation: "Para controlar una hemorragia externa, la medida más efectiva y segura es la presión directa sobre la herida con un trapo limpio o gasa. El torniquete solo se usa como último recurso."
  },
  {
    id: 159, category: "accidentes",
    question: "¿Es obligatorio detenerse si eres testigo de un accidente de tráfico con heridos?",
    options: ["No, solo si estás implicado en el accidente", "Sí, tienes la obligación de prestar auxilio si no supone riesgo para ti", "Solo si hay señal de obligatoriedad", "Solo si eres el primer vehículo en llegar"],
    correct: 1,
    explanation: "La legislación española obliga a prestar socorro a los accidentados cuando no suponga un peligro para el propio conductor. Omitir este socorro es un delito."
  },
  {
    id: 160, category: "accidentes",
    question: "¿Cuándo se debe retirar el casco a un motorista accidentado?",
    options: ["Siempre, lo primero que hay que hacer", "Nunca, el personal sanitario es quien debe retirarlo salvo riesgo vital", "Solo si el casco está dañado", "Solo si el motorista lo solicita"],
    correct: 1,
    explanation: "No debes retirar el casco a un motorista accidentado a menos que sea imprescindible para mantenerle con vida (parada respiratoria). La retirada incorrecta puede agravar lesiones cervicales."
  },
  {
    id: 161, category: "accidentes",
    question: "¿Qué debes hacer en caso de incendio del vehículo?",
    options: ["Intentar apagarlo antes de salir", "Detener el vehículo, apagar el motor, abandonar el vehículo rápidamente y alejarse al menos 50 metros", "Abrir el capó para apagar el incendio con agua", "Permanecer dentro del vehículo"],
    correct: 1,
    explanation: "En caso de incendio: para el vehículo, apaga el motor, sal inmediatamente con todos los ocupantes, aléjate al menos 50 metros y llama al 112. Nunca abras el capó si hay fuego bajo él."
  },
  {
    id: 162, category: "accidentes",
    question: "¿Cómo se llama la maniobra de reanimación cardiopulmonar básica?",
    options: ["OVACE", "RCP (Reanimación Cardiopulmonar)", "PLS (Posición Lateral de Seguridad)", "FAST (Face, Arms, Speech, Time)"],
    correct: 1,
    explanation: "La RCP (Reanimación Cardiopulmonar) consiste en la combinación de compresiones torácicas y ventilaciones de rescate para mantener la circulación y oxigenación cuando el corazón se ha parado."
  },
  {
    id: 163, category: "accidentes",
    question: "¿Qué información básica debes dar al llamar al 112 por un accidente?",
    options: ["Solo el número de heridos", "Localización exacta, tipo de accidente, número aproximado de heridos y tu nombre", "Solo la localización", "El número de matrícula de los vehículos"],
    correct: 1,
    explanation: "Al llamar al 112 indica: 1) Localización exacta (carretera, kilómetro, punto de referencia), 2) Qué ha ocurrido, 3) Número aproximado y estado de los heridos, 4) Tu nombre y teléfono."
  },
  {
    id: 164, category: "accidentes",
    question: "¿Es obligatorio dar los datos del seguro al otro conductor implicado en un accidente con daños materiales?",
    options: ["No, si no hay heridos puedes marcharte", "Sí, es obligatorio identificarse e intercambiar datos del seguro", "Solo si el otro conductor lo pide", "Solo si los daños superan los 1.000€"],
    correct: 1,
    explanation: "En cualquier accidente con daños (materiales o personales), los conductores implicados DEBEN detenerse, identificarse y facilitar los datos del seguro. Fugarse es un delito."
  },
];
