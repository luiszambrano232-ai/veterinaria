// =====================================
// MENÚ RESPONSIVE
// =====================================

const menuBtn = document.getElementById("menuBtn");
const navLinks = document.getElementById("navLinks");

if (menuBtn && navLinks) {
  menuBtn.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", String(isOpen));
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("open");
      menuBtn.setAttribute("aria-expanded", "false");
    });
  });
}


// =====================================
// ANIMACIONES AL HACER SCROLL
// =====================================

const revealElements = document.querySelectorAll(".reveal");
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

if (prefersReducedMotion) {
  revealElements.forEach((element) => element.classList.add("visible"));
} else {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.14 }
  );

  revealElements.forEach((element) => observer.observe(element));
}


// =====================================
// FECHA MÍNIMA DEL CALENDARIO
// =====================================

const appointmentDate = document.getElementById("appointmentDate");
const appointmentTime = document.getElementById("appointmentTime");

// Guardamos las horas originales del select para poder restaurarlas
// si el usuario cambia de "hoy" a otro día.
const allTimeOptions = appointmentTime
  ? Array.from(appointmentTime.options).map((option) => option.value)
  : [];

if (appointmentDate) {
  const today = new Date();
  const localDate = new Date(
    today.getTime() - today.getTimezoneOffset() * 60000
  )
    .toISOString()
    .split("T")[0];

  appointmentDate.min = localDate;

  function updateAvailableTimes() {
    if (!appointmentTime) return;

    const isToday = appointmentDate.value === localDate;
    const currentValue = appointmentTime.value;

    appointmentTime.innerHTML = "";

    allTimeOptions.forEach((value) => {
      if (value === "") {
        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = "Selecciona una hora";
        appointmentTime.appendChild(placeholder);
        return;
      }

      // Si el día elegido es hoy, ocultamos las horas que ya pasaron
      // (con 30 minutos de margen para preparar la atención).
      if (isToday) {
        const [hour, minute] = value.split(":").map(Number);
        const slotDate = new Date();
        slotDate.setHours(hour, minute, 0, 0);

        const now = new Date();
        now.setMinutes(now.getMinutes() + 30);

        if (slotDate < now) return;
      }

      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      appointmentTime.appendChild(option);
    });

    // Si la hora que tenía seleccionada ya no está disponible, la limpiamos.
    const stillAvailable = Array.from(appointmentTime.options).some(
      (option) => option.value === currentValue
    );
    appointmentTime.value = stillAvailable ? currentValue : "";
  }

  appointmentDate.addEventListener("change", updateAvailableTimes);
}


// =====================================
// RESUMEN DE PRECIO
// =====================================

const serviceSelect = document.getElementById("service");
const summaryBox = document.getElementById("summaryBox");
const summaryService = document.getElementById("summaryService");
const summaryPrice = document.getElementById("summaryPrice");
const depositPrice = document.getElementById("depositPrice");

let selectedPrice = 0;
let selectedDeposit = 0;

function formatCurrency(value) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0
  }).format(value);
}

if (serviceSelect) {
  serviceSelect.addEventListener("change", () => {
    const selectedOption =
      serviceSelect.options[serviceSelect.selectedIndex];

    if (!serviceSelect.value) {
      // Sin servicio seleccionado: ocultamos el resumen en vez de
      // mostrar un "$0" confuso.
      selectedPrice = 0;
      selectedDeposit = 0;
      if (summaryBox) summaryBox.hidden = true;
      return;
    }

    selectedPrice = Number(selectedOption.dataset.price || 0);
    selectedDeposit = Math.round(selectedPrice * 0.3);

    summaryService.textContent = serviceSelect.value;
    summaryPrice.textContent = formatCurrency(selectedPrice);
    depositPrice.textContent = formatCurrency(selectedDeposit);

    if (summaryBox) summaryBox.hidden = false;
  });
}


// =====================================
// PREPARAR RESERVA
// =====================================

const bookingForm = document.getElementById("bookingForm");
const confirmationSection =
  document.getElementById("confirmationSection");

const confirmationText =
  document.getElementById("confirmationText");

const paymentButton =
  document.getElementById("paymentButton");

const whatsappButton =
  document.getElementById("whatsappButton");

const calendarButton =
  document.getElementById("calendarButton");

const formError = document.getElementById("formError");

function showFormError(message) {
  if (!formError) return;
  formError.textContent = message;
  formError.hidden = false;
  formError.scrollIntoView({ behavior: "smooth", block: "center" });
}

function clearFormError() {
  if (!formError) return;
  formError.hidden = true;
  formError.textContent = "";
}

if (bookingForm) {
  bookingForm.addEventListener("submit", (event) => {
    event.preventDefault();
    clearFormError();

    const ownerName =
      document.getElementById("ownerName").value.trim();

    const ownerPhone =
      document.getElementById("ownerPhone").value.trim();

    const petName =
      document.getElementById("petName").value.trim();

    const petType =
      document.getElementById("petType").value;

    const service =
      document.getElementById("service").value;

    const date =
      document.getElementById("appointmentDate").value;

    const time =
      document.getElementById("appointmentTime").value;

    const reason =
      document.getElementById("reason").value.trim();

    // Doble chequeo: aunque el select es "required", nos aseguramos
    // de que realmente haya un servicio (y por lo tanto un precio) elegido
    // antes de armar la reserva.
    if (!service || selectedPrice <= 0) {
      showFormError("Por favor selecciona un servicio antes de continuar.");
      return;
    }

    // Verificamos que la fecha y hora elegidas no queden en el pasado
    // (por ejemplo, si el usuario dejó la pestaña abierta un buen rato).
    const selectedDateTime = new Date(`${date}T${time}:00`);
    if (Number.isNaN(selectedDateTime.getTime()) || selectedDateTime < new Date()) {
      showFormError(
        "La fecha u hora seleccionada ya no está disponible. Elige otro horario."
      );
      return;
    }

    confirmationText.textContent =
      `${ownerName}, preparaste una cita para ${petName} ` +
      `(${petType}) el ${formatDate(date)} a las ${time}. ` +
      `El abono estimado es ${formatCurrency(selectedDeposit)}.`;

    // Enlace demostrativo de pago.
    // Reemplázalo por el link real de Mercado Pago o Webpay.
    paymentButton.href =
      "https://www.mercadopago.cl/";

    // Cambia este número por el WhatsApp real de la veterinaria.
    const veterinaryPhone = "56912345678";

    const whatsappText = `
Hola VetCare, quiero confirmar una cita veterinaria.

Tutor: ${ownerName}
Teléfono: ${ownerPhone}
Mascota: ${petName}
Tipo: ${petType}
Servicio: ${service}
Fecha: ${formatDate(date)}
Hora: ${time}
Motivo: ${reason}
Abono estimado: ${formatCurrency(selectedDeposit)}
    `.trim();

    whatsappButton.href =
      `https://wa.me/${veterinaryPhone}?text=` +
      encodeURIComponent(whatsappText);

    calendarButton.href =
      createGoogleCalendarLink({
        ownerName,
        petName,
        service,
        date,
        time,
        reason
      });

    confirmationSection.classList.remove("hidden");

    setTimeout(() => {
      confirmationSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }, 100);
  });
}


// =====================================
// GOOGLE CALENDAR
// =====================================

function createGoogleCalendarLink(data) {
  // OJO: antes se creaba un objeto Date a partir de la fecha/hora y se
  // convertía a UTC con toISOString(). Eso asume que el navegador de
  // quien agenda está configurado en la hora de Chile — si alguien reserva
  // desde un dispositivo con otro huso horario, la cita aparecía a una
  // hora distinta a la que realmente se reservó.
  //
  // Para evitarlo, mandamos la hora "tal cual" (sin convertir a UTC) junto
  // con el parámetro ctz=America/Santiago, que le indica a Google Calendar
  // en qué zona horaria interpretar esos números, sin importar dónde esté
  // el navegador de quien hace clic en el enlace.
  const startDateTime = `${data.date}T${data.time}:00`;
  const endTime = addOneHour(data.time);
  const endDateTime = `${data.date}T${endTime}:00`;

  const title =
    `Cita veterinaria de ${data.petName}`;

  const details =
    `Servicio: ${data.service}\n` +
    `Tutor: ${data.ownerName}\n` +
    `Motivo: ${data.reason}`;

  const location = "VetCare, Santiago, Chile";

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates:
      `${formatCalendarDate(startDateTime)}/` +
      `${formatCalendarDate(endDateTime)}`,
    details,
    location,
    ctz: "America/Santiago"
  });

  return `https://calendar.google.com/calendar/render?${params}`;
}

function addOneHour(time) {
  const [hour, minute] = time.split(":").map(Number);
  const nextHour = (hour + 1) % 24;
  return `${String(nextHour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function formatCalendarDate(localDateTimeString) {
  // Convierte "2026-07-25T09:00:00" a "20260725T090000" (sin sufijo "Z",
  // ya que la zona horaria la define el parámetro ctz de arriba).
  return localDateTimeString.replace(/[-:]/g, "");
}

function formatDate(dateString) {
  const [year, month, day] = dateString.split("-");

  return `${day}/${month}/${year}`;
}