const STRINGS = {
  en: {
    title: "Daily Standup Generator",
    language: "Language",
    settings: "Settings",
    token: "GitHub token",
    remember: "Remember on this device",
    tokenHint:
      "Saved when you paste it. Needs read access to issues and pull requests. Uncheck “Remember” to forget it when the tab closes.",
    tokenSavedPlaceholder: "Saved. Paste a new token to replace it.",
    forgetToken: "Forget token",
    tokenChecking: "Checking…",
    tokenOk: "Connected as @{login}.",
    tokenNone: "No token saved.",
    repos: "Repositories",
    reposHint: "owner/repo, one per line. The first one is the default. Saved as you type.",
    reposSaved: "{count} saved.",
    reposEmpty: "Add at least one owner/repo.",
    completed: "Completed",
    inProgress: "In Progress",
    upcoming: "Upcoming",
    prs: "PR Review",
    addIssue: "+ Issue",
    addPr: "+ PR",
    addSubtask: "+ Subtask",
    remove: "Remove",
    issue: "Issue",
    pr: "PR",
    refPlaceholder: "123, owner/repo#123 or URL",
    repo: "Repo",
    eta: "ETA",
    etaFrom: "ETA from",
    etaTo: "ETA to",
    projected: "Projected",
    projectedStatus: "Status",
    subtask: "Subtask",
    description: "Description",
    generate: "Generate",
    generating: "Generating…",
    output: "Output",
    outputHint: "Markdown, editable. Copy for GitHub pastes it as is; Copy for Slack pastes it as formatted text.",
    copySlack: "Copy for Slack",
    copyGithub: "Copy for GitHub",
    copiedSlack: "Copied. Paste into Slack.",
    copiedGithub: "Copied. Paste into GitHub.",
    copyFailed: "Copy failed. Select the text and copy it manually.",
    errNoToken: "Save a GitHub token in Settings first.",
    errBadRef: "Not an issue number or GitHub URL, or no repo selected.",
    errUnauthorized: "GitHub rejected the token (401). Save a valid one in Settings.",
    errNotFound: "{ref} not found, or the token has no access to it.",
    errRateLimited: "GitHub rate limit reached. Try again later.",
    errNetwork: "Could not reach GitHub. Check your connection.",
    errApi: "GitHub error: {message}",
    errSummary: "{count} item(s) could not be loaded and are missing from the output. See the highlighted rows.",
  },
  es: {
    title: "Generador de Daily Standup",
    language: "Idioma",
    settings: "Configuración",
    token: "Token de GitHub",
    remember: "Recordar en este dispositivo",
    tokenHint:
      "Se guarda al pegarlo. Necesita acceso de lectura a issues y pull requests. Desmarcá “Recordar” para olvidarlo al cerrar la pestaña.",
    tokenSavedPlaceholder: "Guardado. Pegá uno nuevo para reemplazarlo.",
    forgetToken: "Olvidar token",
    tokenChecking: "Verificando…",
    tokenOk: "Conectado como @{login}.",
    tokenNone: "No hay token guardado.",
    repos: "Repositorios",
    reposHint: "owner/repo, uno por línea. El primero es el predeterminado. Se guarda mientras escribís.",
    reposSaved: "{count} guardado(s).",
    reposEmpty: "Agregá al menos un owner/repo.",
    completed: "Completado",
    inProgress: "En progreso",
    upcoming: "Próximo",
    prs: "Revisión de PR",
    addIssue: "+ Issue",
    addPr: "+ PR",
    addSubtask: "+ Subtarea",
    remove: "Quitar",
    issue: "Issue",
    pr: "PR",
    refPlaceholder: "123, owner/repo#123 o URL",
    repo: "Repo",
    eta: "ETA",
    etaFrom: "ETA desde",
    etaTo: "ETA hasta",
    projected: "Entrega estimada",
    projectedStatus: "Estado",
    subtask: "Subtarea",
    description: "Descripción",
    generate: "Generar",
    generating: "Generando…",
    output: "Resultado",
    outputHint: "Markdown editable. Copiar para GitHub lo pega tal cual; Copiar para Slack lo pega con formato.",
    copySlack: "Copiar para Slack",
    copyGithub: "Copiar para GitHub",
    copiedSlack: "Copiado. Pegalo en Slack.",
    copiedGithub: "Copiado. Pegalo en GitHub.",
    copyFailed: "No se pudo copiar. Seleccioná el texto y copialo a mano.",
    errNoToken: "Primero guardá un token de GitHub en Configuración.",
    errBadRef: "No es un número de issue o URL de GitHub, o no hay repo seleccionado.",
    errUnauthorized: "GitHub rechazó el token (401). Guardá uno válido en Configuración.",
    errNotFound: "{ref} no existe o el token no tiene acceso.",
    errRateLimited: "Se alcanzó el límite de GitHub. Probá más tarde.",
    errNetwork: "No se pudo conectar con GitHub. Revisá tu conexión.",
    errApi: "Error de GitHub: {message}",
    errSummary: "{count} ítem(s) no se pudieron cargar y faltan en el resultado. Mirá las filas marcadas.",
  },
};

export const LANGUAGES = Object.keys(STRINGS);

let current = "en";

export function setLanguage(lang) {
  current = STRINGS[lang] ? lang : "en";
  document.documentElement.lang = current;
  return current;
}

export function t(key, vars = {}) {
  const text = STRINGS[current][key] ?? STRINGS.en[key] ?? key;
  return text.replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? "");
}

export function applyTranslations(root = document) {
  root.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  root.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  document.title = t("title");
}
