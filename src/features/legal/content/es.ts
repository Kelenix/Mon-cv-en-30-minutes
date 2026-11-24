import type { LegalContent } from "../types";

// Traduction de fr.ts. À faire relire par un juriste avant le lancement (tâche manuelle 7).
export const es: LegalContent = {
  updatedAt: "2026-11-23",
  pages: {
    legalNotice: {
      title: "Aviso legal",
      description:
        "Titular, director de la publicación y proveedor de alojamiento del sitio {brandName}.",
      sections: [
        {
          title: "Titular del sitio web",
          paragraphs: [
            "El sitio {siteUrl} ({brandName}) es editado por {companyName}, {legalForm}, inscrita con el número {registration} y con domicilio social en {address}.",
            "Número de IVA intracomunitario: {vatNumber}.",
            "Contacto: {email}.",
          ],
        },
        {
          title: "Director de la publicación",
          paragraphs: ["{publisher}."],
        },
        {
          title: "Alojamiento",
          paragraphs: [
            "El sitio está alojado por {hosting}.",
            "Los datos de las cuentas se almacenan en el mismo servidor, situado en la Unión Europea.",
          ],
        },
        {
          title: "Propiedad intelectual",
          paragraphs: [
            "La marca {brandName}, el logotipo, las ilustraciones, los textos y el código del sitio están protegidos. Queda prohibida cualquier reproducción sin autorización por escrito.",
            "Los contenidos que usted introduce y los CV generados para usted le pertenecen.",
          ],
        },
      ],
    },
    terms: {
      title: "Condiciones generales de uso y de contratación",
      description:
        "Normas de uso del servicio {brandName}, de los créditos de IA, de las compras y de las suscripciones.",
      sections: [
        {
          title: "Objeto",
          paragraphs: [
            "Las presentes condiciones regulan el uso del servicio {brandName}, accesible en {siteUrl} y explotado por {companyName}. Se aplican desde la creación de una cuenta y en cada compra.",
          ],
        },
        {
          title: "El servicio",
          paragraphs: [
            "{brandName} le permite crear un CV con ayuda de la inteligencia artificial a partir de cinco preguntas y, después, mejorar sus candidaturas: mejora de las experiencias y del perfil, adaptación a una oferta de empleo con análisis de las palabras clave que faltan, versión para LinkedIn, carta de presentación y simulación de entrevista.",
            "La primera generación de CV es gratuita. Las demás funciones utilizan créditos de IA o están incluidas en un plan de suscripción, tal como se indica en la página de Precios.",
            "Los contenidos generados por la inteligencia artificial son propuestas: usted debe revisarlos y corregirlos antes de utilizarlos. El servicio no garantiza la obtención de una entrevista ni de un empleo.",
          ],
        },
        {
          title: "Cuenta",
          paragraphs: [
            "Es necesario disponer de una cuenta para generar y guardar un CV. Usted se compromete a facilitar información exacta y a mantener la confidencialidad del acceso a su dirección de correo electrónico.",
          ],
        },
        {
          title: "Créditos de IA",
          paragraphs: [
            "Cada operación de inteligencia artificial consume créditos: 1 crédito para generar un CV, mejorar una experiencia, mejorar el perfil o crear una versión para LinkedIn; 2 créditos para adaptar un CV a una oferta de empleo (análisis de palabras clave incluido), generar una carta de presentación o simular una entrevista.",
            "Los créditos incluidos en una suscripción se restablecen al nivel del plan cada mes, en la fecha aniversario de la contratación, también en el caso de una suscripción anual; los créditos incluidos no utilizados no se acumulan para el mes siguiente. Se consumen antes que los créditos comprados.",
            "Los créditos comprados (packs de créditos) y los obtenidos al ver un vídeo publicitario permanecen disponibles mientras exista la cuenta. Se pierden en caso de eliminación de la cuenta, tanto si la solicita usted como si se produce tras tres años de inactividad.",
            "Si una operación falla, los créditos descontados se devuelven automáticamente.",
          ],
        },
        {
          title: "Ofertas y precios",
          paragraphs: [
            "Los precios se indican con todos los impuestos incluidos, en euros, en la página de Precios, antes de cualquier compra.",
            "Los packs de créditos son compras únicas. El «CV Pro» desbloquea de forma definitiva, para un CV determinado, la exportación en PDF sin marca de agua y la exportación en DOCX; este desbloqueo se pierde si dicho CV se sustituye por una nueva generación. Cuando se ofrezca, la eliminación de la publicidad es una compra única y definitiva para la cuenta.",
            "Los planes Essential, Pro y Premium se ofrecen en modalidad mensual o anual. Las funciones y el número de créditos mensuales de cada plan se describen en la página de Precios.",
          ],
        },
        {
          title: "Suscripciones",
          paragraphs: [
            "La suscripción se renueva automáticamente al final de cada periodo (mes o año) al precio vigente, mediante cargo en el medio de pago registrado en nuestro proveedor de pagos Stripe.",
            "Puede gestionar su suscripción en cualquier momento desde «Gestionar mi suscripción»: el cambio a un plan superior es inmediato y se factura de forma prorrateada; el cambio a un plan inferior y la cancelación surten efecto al final del periodo ya pagado.",
            "Si un pago no se completa, se realizan nuevos intentos de cobro y sus derechos se mantienen durante ese plazo; si finalmente el pago no se efectúa, la suscripción finaliza.",
          ],
        },
        {
          title: "Prueba gratuita",
          paragraphs: [
            "Se ofrece una prueba gratuita de tres días del plan Pro, una sola vez por cuenta. Se solicita un medio de pago, pero no se realiza ningún cargo durante la prueba. La prueba da acceso a las funciones Pro con 10 créditos.",
            "Si no cancela antes de que finalice la prueba, la suscripción comienza y se cobra el primer pago; en ese momento se asignan los 60 créditos mensuales del plan Pro.",
          ],
        },
        {
          title: "Derecho de desistimiento",
          paragraphs: [
            "Los créditos y el CV Pro son contenidos digitales que se suministran inmediatamente después del pago. Al solicitar su suministro inmediato y reconocer, en el momento de la compra, que pierde su derecho de desistimiento, usted renuncia a dicho derecho.",
            "En el caso de una suscripción, dispone de un plazo de catorce días a partir de la contratación para desistir, escribiendo a {email}. Si ha solicitado que el servicio comience antes de que finalice dicho plazo, deberá abonar el importe correspondiente al servicio ya prestado.",
          ],
        },
        {
          title: "Uso de los contenidos",
          paragraphs: [
            "Usted sigue siendo el titular de la información que introduce y de los contenidos generados para usted. Se compromete a no utilizar el servicio para producir información falsa o contenidos ilícitos.",
          ],
        },
        {
          title: "Responsabilidad",
          paragraphs: [
            "Empleamos medios razonables para garantizar el acceso al servicio y la seguridad de sus datos, sin poder garantizar una disponibilidad permanente. No seremos responsables del uso que usted haga de los contenidos generados.",
          ],
        },
        {
          title: "Datos personales",
          paragraphs: [
            "El tratamiento de sus datos se describe en la política de privacidad.",
          ],
        },
        {
          title: "Eliminación de la cuenta",
          paragraphs: [
            "Puede eliminar su cuenta en cualquier momento desde su área personal. La eliminación conlleva la cancelación inmediata de la suscripción en curso, sin reembolso del periodo iniciado, así como la pérdida de los CV, de los contenidos generados y de los créditos.",
            "Las cuentas sin suscripción activa que permanezcan inactivas durante tres años se eliminan automáticamente; recibirá un aviso por correo electrónico treinta días antes.",
          ],
        },
        {
          title: "Reclamaciones, mediación y legislación aplicable",
          paragraphs: [
            "Para cualquier reclamación, escriba primero a {email}. Si no se encuentra una solución, puede recurrir gratuitamente al mediador de consumo: {mediator}.",
            "Las presentes condiciones se rigen por la legislación francesa, sin que ello le prive de la protección que le otorgan las disposiciones imperativas del país en el que reside.",
          ],
        },
        {
          title: "Modificación de las condiciones",
          paragraphs: [
            "Podemos modificar estas condiciones; se le informará antes de su entrada en vigor. En el caso de una suscripción en curso, las nuevas condiciones se aplicarán a partir de la siguiente renovación.",
          ],
        },
      ],
    },
    privacy: {
      title: "Política de privacidad",
      description:
        "Datos personales tratados por {brandName}, finalidades, plazos de conservación y derechos.",
      sections: [
        {
          title: "Responsable del tratamiento",
          paragraphs: [
            "{companyName}, {address}. Contacto para cualquier consulta sobre sus datos: {email}.",
          ],
        },
        {
          title: "Datos tratados",
          paragraphs: [
            "Cuenta: dirección de correo electrónico, nombre, apellidos y, si los indica, teléfono y ciudad.",
            "Contenido: sus respuestas a las preguntas, sus CV y los contenidos generados (cartas, versiones para LinkedIn, simulaciones de entrevista).",
            "Uso: operaciones realizadas, créditos, plan y compras. Los datos de la tarjeta bancaria son tratados únicamente por Stripe; solo conservamos las referencias de los pagos.",
            "Datos técnicos: dirección IP en forma de hash (transformada de manera irreversible) para prevenir abusos, registros técnicos y preferencia de idioma; país deducido de la dirección IP en el primer inicio de sesión (la dirección en sí no se conserva).",
          ],
        },
        {
          title: "Finalidades y bases jurídicas",
          paragraphs: [
            "Prestar el servicio y gestionar su cuenta, sus créditos y sus suscripciones: ejecución del contrato.",
            "Facturación y obligaciones contables: cumplimiento de una obligación legal.",
            "Prevención de abusos y seguimiento de los costes del servicio: interés legítimo.",
            "Estadísticas internas de visitas (sitio o campaña de procedencia, país), anónimas, sin cookies y sin vínculo con su cuenta: interés legítimo.",
            "Publicidad personalizada para los usuarios sin suscripción: consentimiento, que puede retirar en cualquier momento.",
          ],
        },
        {
          title: "Plazos de conservación",
          paragraphs: [
            "Los datos de la cuenta, los CV y los contenidos generados se conservan hasta la eliminación de la cuenta o durante tres años de inactividad; recibirá un aviso por correo electrónico treinta días antes de la eliminación automática.",
            "La dirección IP con hash se borra a los treinta días, y los eventos técnicos de pago, a los noventa días. Stripe conserva las facturas durante el plazo exigido por la ley.",
            "Tras la eliminación de una cuenta, solo se conservan el importe y la fecha de los pagos y el coste de las operaciones, sin ningún vínculo con usted, con fines contables y estadísticos. Las estadísticas de visitas se conservan veinticinco meses.",
            "Antes de crear su cuenta, sus respuestas a las cinco preguntas se guardan únicamente en su navegador y se borran en cuanto se guarda su CV.",
          ],
        },
        {
          title: "Destinatarios y encargados del tratamiento",
          paragraphs: [
            "Sus datos nunca se venden. Los tratan, por cuenta nuestra: Hostinger (alojamiento del sitio y de los datos, Unión Europea), Anthropic (tratamiento de los textos mediante inteligencia artificial para generar los contenidos que usted solicita), Stripe (pagos), Resend (envío de correos electrónicos), Cloudflare (protección contra bots al iniciar sesión) y, únicamente con su consentimiento previo, Google (publicidad).",
          ],
        },
        {
          title: "Transferencias fuera de la Unión Europea",
          paragraphs: [
            "Algunos proveedores pueden tratar datos fuera de la Unión Europea, en particular en Estados Unidos. Estas transferencias están amparadas por garantías adecuadas, como una decisión de adecuación de la Comisión Europea o sus cláusulas contractuales tipo.",
          ],
        },
        {
          title: "Inteligencia artificial",
          paragraphs: [
            "Los textos necesarios para una operación (sus respuestas, su CV, una oferta de empleo que usted pegue) se transmiten a nuestro proveedor de inteligencia artificial únicamente para generar el contenido solicitado.",
          ],
        },
        {
          title: "Sus derechos",
          paragraphs: [
            "Usted dispone de los derechos de acceso, rectificación, supresión, limitación del tratamiento, oposición y portabilidad, así como del derecho a retirar su consentimiento. Puede eliminar su cuenta directamente desde su área personal; para las demás solicitudes, escriba a {email}.",
            "Puede presentar una reclamación ante la CNIL (www.cnil.fr) o ante la autoridad de protección de datos de su país (por ejemplo, en España, la Agencia Española de Protección de Datos, www.aepd.es).",
          ],
        },
        {
          title: "Seguridad",
          paragraphs: [
            "Las comunicaciones están cifradas (HTTPS) y cada usuario solo puede acceder a sus propios datos, lo que se controla a nivel de la base de datos.",
          ],
        },
        {
          title: "Cookies",
          paragraphs: [
            "El uso de las cookies se describe en la página específica sobre cookies.",
          ],
        },
      ],
    },
    cookies: {
      title: "Gestión de cookies",
      description:
        "Cookies utilizadas por {brandName} y gestión de sus preferencias.",
      sections: [
        {
          title: "¿Qué es una cookie?",
          paragraphs: [
            "Una cookie es un pequeño archivo que se almacena en su navegador. Permite, por ejemplo, mantener la sesión iniciada o recordar una preferencia.",
          ],
        },
        {
          title: "Cookies estrictamente necesarias",
          paragraphs: [
            "Estas cookies son imprescindibles para el funcionamiento del sitio y no requieren consentimiento: sesión de acceso a su cuenta, memorización del idioma elegido (durante un año como máximo) y seguridad.",
          ],
        },
        {
          title: "Cookies publicitarias",
          paragraphs: [
            "Para los usuarios sin suscripción, Google puede mostrar anuncios. Las cookies publicitarias solo se instalan con su consentimiento, recabado mediante un banner que permite aceptarlas o rechazarlas con la misma facilidad. No se utiliza ninguna cookie publicitaria para los suscriptores.",
          ],
        },
        {
          title: "Gestionar sus preferencias",
          paragraphs: [
            "Puede modificar su elección en cualquier momento mediante el enlace «Gestionar cookies» situado al pie de cada página. Su elección se conserva durante seis meses. También puede eliminar las cookies desde la configuración de su navegador.",
          ],
        },
      ],
    },
  },
};
