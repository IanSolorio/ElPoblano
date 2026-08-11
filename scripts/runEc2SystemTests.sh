#!/usr/bin/env bash

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
RESULT_DIR="${REPO_DIR}/tests/results/fase5/ec2"
RESULT_FILE="${RESULT_DIR}/ejecucion-ec2.csv"
STATE_FILE="${RESULT_DIR}/.reboot-state"
API_HOST="${ELPOBLANO_API_HOST:-elpoblano-api.duckdns.org}"
FRONTEND_URL="${ELPOBLANO_FRONTEND_URL:-https://elpoblano.vercel.app}"
MAX_RECOVERY_SECONDS="${ELPOBLANO_MAX_RECOVERY_SECONDS:-30}"

if [[ "${EUID}" -ne 0 ]]; then
  exec sudo --preserve-env=ELPOBLANO_API_HOST,ELPOBLANO_FRONTEND_URL,ELPOBLANO_MAX_RECOVERY_SECONDS bash "$0" "$@"
fi

mkdir -p "${RESULT_DIR}"
if [[ ! -f "${RESULT_FILE}" ]]; then
  printf '%s\n' '"ID","Fecha UTC","Resultado","Duración segundos","Detalle"' > "${RESULT_FILE}"
fi

finish_permissions() {
  if [[ -n "${SUDO_USER:-}" && "${SUDO_USER}" != "root" ]]; then
    chown -R "${SUDO_USER}:${SUDO_USER}" "${RESULT_DIR}"
  fi
}
trap finish_permissions EXIT

csv_escape() {
  local value="${1//\"/\"\"}"
  printf '"%s"' "${value}"
}

record_result() {
  local id="$1"
  local result="$2"
  local duration="$3"
  local detail="$4"
  {
    csv_escape "${id}"
    printf ','
    csv_escape "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    printf ','
    csv_escape "${result}"
    printf ','
    csv_escape "${duration}"
    printf ','
    csv_escape "${detail}"
    printf '\n'
  } >> "${RESULT_FILE}"
}

wait_for_health() {
  local deadline=$((SECONDS + MAX_RECOVERY_SECONDS))
  while (( SECONDS <= deadline )); do
    if curl --silent --show-error --fail --max-time 3 http://localhost:3000/api/health >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done
  return 1
}

test_service_restart() {
  echo "[ST-NF-01] Reiniciando el servicio elpoblano..."
  local start_time=$SECONDS
  if ! systemctl restart elpoblano; then
    record_result "ST-NF-01" "NO_APROBADO" "$((SECONDS - start_time))" "systemctl restart devolvió error"
    echo "NO APROBADO: systemctl no pudo reiniciar el servicio."
    return 1
  fi

  if wait_for_health && systemctl is-active --quiet elpoblano; then
    local elapsed=$((SECONDS - start_time))
    record_result "ST-NF-01" "APROBADO" "${elapsed}" "Servicio activo y health HTTP 200 dentro del límite de ${MAX_RECOVERY_SECONDS} s"
    echo "APROBADO: el servicio volvió a responder en ${elapsed} segundos."
    return 0
  fi

  local elapsed=$((SECONDS - start_time))
  record_result "ST-NF-01" "NO_APROBADO" "${elapsed}" "El servicio no quedó activo y saludable dentro de ${MAX_RECOVERY_SECONDS} s"
  echo "NO APROBADO: el servicio no se recuperó dentro del límite."
  systemctl status elpoblano --no-pager -l || true
  return 1
}

test_https() {
  echo "[ST-NF-04] Validando redirección, certificado y recursos iniciales..."
  local http_result
  http_result="$(curl --silent --show-error --output /dev/null --max-time 10 --write-out '%{http_code}|%{redirect_url}' "http://${API_HOST}/api/health" || true)"
  local http_code="${http_result%%|*}"
  local redirect_url="${http_result#*|}"
  local https_code
  https_code="$(curl --silent --show-error --output /dev/null --max-time 10 --write-out '%{http_code}' "https://${API_HOST}/api/health" || true)"
  local certificate_ok="false"
  if timeout 15 openssl s_client -connect "${API_HOST}:443" -servername "${API_HOST}" </dev/null 2>/dev/null | openssl x509 -checkend 0 -noout >/dev/null 2>&1; then
    certificate_ok="true"
  fi

  local html
  html="$(curl --silent --show-error --fail --max-time 15 "${FRONTEND_URL}" || true)"
  local insecure_initial_resources="false"
  if printf '%s' "${html}" | grep -Eiq "(src|href)=[\"'][[:space:]]*http://"; then
    insecure_initial_resources="true"
  fi

  if [[ "${http_code}" =~ ^(301|302|307|308)$ ]] \
    && [[ "${redirect_url}" == https://* ]] \
    && [[ "${https_code}" == "200" ]] \
    && [[ "${certificate_ok}" == "true" ]] \
    && [[ -n "${html}" ]] \
    && [[ "${insecure_initial_resources}" == "false" ]]; then
    record_result "ST-NF-04" "APROBADO" "N/A" "HTTP ${http_code} redirige a HTTPS; API HTTPS 200; certificado vigente; HTML inicial sin recursos HTTP"
    echo "APROBADO: redirección y certificado válidos, sin recursos HTTP en el HTML inicial."
    return 0
  fi

  record_result "ST-NF-04" "NO_APROBADO" "N/A" "HTTP=${http_code}; redirect=${redirect_url}; HTTPS=${https_code}; certificado=${certificate_ok}; recursosHTTP=${insecure_initial_resources}"
  echo "NO APROBADO: revisa el detalle guardado en ${RESULT_FILE}."
  return 1
}

test_jmeter_evidence() {
  echo "[ST-NF-07] Comprobando la evidencia JMeter existente..."
  local summary
  summary="$(find "${REPO_DIR}/tests/results/fase6/jmeter" -name resumen.json -type f -print 2>/dev/null | sort | tail -n 1)"
  if [[ -n "${summary}" ]] && grep -Eq '"passed"[[:space:]]*:[[:space:]]*true' "${summary}"; then
    local p95
    local errors
    p95="$(awk -F: '/"p95Ms"/ {gsub(/[ ,]/, "", $2); print $2; exit}' "${summary}")"
    errors="$(awk -F: '/"errorPct"/ {gsub(/[ ,]/, "", $2); print $2; exit}' "${summary}")"
    record_result "ST-NF-07" "APROBADO" "N/A" "JMeter aprobado: p95=${p95} ms; errores=${errors}%"
    echo "APROBADO: JMeter registró p95=${p95} ms y errores=${errors}%."
    return 0
  fi

  record_result "ST-NF-07" "NO_APROBADO" "N/A" "No se encontró una evidencia JMeter aprobada"
  echo "NO APROBADO: no se encontró el resumen aprobado de JMeter."
  return 1
}

prepare_reboot() {
  echo "[ST-NF-02] Preparando la prueba de reinicio de EC2."
  local boot_id
  boot_id="$(cat /proc/sys/kernel/random/boot_id)"
  printf '%s|%s\n' "${boot_id}" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > "${STATE_FILE}"
  finish_permissions
  echo "El estado previo quedó guardado. La conexión SSH se cerrará al reiniciar."
  read -r -p "Escribe REINICIAR para continuar: " confirmation
  if [[ "${confirmation}" != "REINICIAR" ]]; then
    echo "Prueba cancelada; la instancia no fue reiniciada."
    return 0
  fi
  systemctl reboot
}

verify_reboot() {
  echo "[ST-NF-02] Verificando el reinicio de EC2..."
  if [[ ! -f "${STATE_FILE}" ]]; then
    echo "No existe el estado previo. Ejecuta primero el modo reboot."
    return 1
  fi

  local previous_state
  local previous_boot
  local current_boot
  previous_state="$(cat "${STATE_FILE}")"
  previous_boot="${previous_state%%|*}"
  current_boot="$(cat /proc/sys/kernel/random/boot_id)"
  local backend_active="false"
  local nginx_active="false"
  local backend_enabled="false"
  local nginx_enabled="false"
  local health_ok="false"

  systemctl is-active --quiet elpoblano && backend_active="true"
  systemctl is-active --quiet nginx && nginx_active="true"
  systemctl is-enabled --quiet elpoblano && backend_enabled="true"
  systemctl is-enabled --quiet nginx && nginx_enabled="true"
  curl --silent --show-error --fail --max-time 10 "https://${API_HOST}/api/health" >/dev/null 2>&1 && health_ok="true"

  if [[ "${current_boot}" != "${previous_boot}" ]] \
    && [[ "${backend_active}" == "true" ]] \
    && [[ "${nginx_active}" == "true" ]] \
    && [[ "${backend_enabled}" == "true" ]] \
    && [[ "${nginx_enabled}" == "true" ]] \
    && [[ "${health_ok}" == "true" ]]; then
    record_result "ST-NF-02" "APROBADO" "N/A" "Boot ID cambió; backend y Nginx activos/habilitados; health público HTTPS 200"
    rm -f "${STATE_FILE}"
    echo "APROBADO: EC2, backend, Nginx y HTTPS se recuperaron correctamente."
    return 0
  fi

  record_result "ST-NF-02" "NO_APROBADO" "N/A" "bootCambió=$([[ "${current_boot}" != "${previous_boot}" ]] && echo true || echo false); backendActivo=${backend_active}; nginxActivo=${nginx_active}; backendHabilitado=${backend_enabled}; nginxHabilitado=${nginx_enabled}; healthHTTPS=${health_ok}"
  echo "NO APROBADO: revisa el detalle guardado en ${RESULT_FILE}."
  return 1
}

run_without_reboot() {
  local result=0
  test_service_restart || result=1
  test_https || result=1
  test_jmeter_evidence || result=1
  echo "Evidencia: ${RESULT_FILE}"
  return "${result}"
}

case "${1:-}" in
  pre-reboot)
    run_without_reboot
    ;;
  reboot)
    prepare_reboot
    ;;
  verify-reboot)
    verify_reboot
    echo "Evidencia: ${RESULT_FILE}"
    ;;
  *)
    echo "Uso:"
    echo "  bash scripts/runEc2SystemTests.sh pre-reboot"
    echo "  bash scripts/runEc2SystemTests.sh reboot"
    echo "  bash scripts/runEc2SystemTests.sh verify-reboot"
    exit 1
    ;;
esac
