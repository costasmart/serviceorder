// URL do Google Apps Script (Configure no Passo 4)
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzuC3iWIJE7_cSN_lE9Lw00AE7bnJ0TtndiDmBCZfVCpsPkkw_H5_fok-KX82ETWsKd/exec";

let signaturePad;
let osNumber = "";
let photoList = [];

document.addEventListener("DOMContentLoaded", () => {
  // 1. Gera Número da O.S. (DDMMYYYYHHMMSS)
  osNumber = generateOSNumber();
  document.getElementById("os-number-display").innerText = osNumber;
  document.getElementById("os-date-display").innerText = new Date().toLocaleString("pt-BR");

  // 2. Inicializa Canvas da Assinatura
  const canvas = document.getElementById("signature-canvas");
  resizeCanvas(canvas);
  signaturePad = new SignaturePad(canvas, {
    backgroundColor: 'rgba(255, 255, 255, 0)',
    penColor: 'rgb(0, 0, 0)'
  });

  document.getElementById("btn-clear-signature").addEventListener("click", () => {
    signaturePad.clear();
  });

  // 3. Controle de Fotos
  const btnAddPhoto = document.getElementById("btn-add-photo");
  const photoFileInput = document.getElementById("photo-file-input");

  btnAddPhoto.addEventListener("click", () => {
    photoFileInput.click();
  });

  photoFileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(evt) {
        addPhotoToGrid(evt.target.result);
        photoFileInput.value = ""; // Reseta o input
      };
      reader.readAsDataURL(file);
    }
  });

  // 4. Concluir e Gerar OS
  document.getElementById("btn-submit").addEventListener("click", handleSaveOS);
});

// Gera código DDMMYYYYHHMMSS
function generateOSNumber() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  
  const dd = pad(now.getDate());
  const mm = pad(now.getMonth() + 1);
  const yyyy = now.getFullYear();
  const hh = pad(now.getHours());
  const min = pad(now.getMinutes());
  const ss = pad(now.getSeconds());

  return `${dd}${mm}${yyyy}${hh}${min}${ss}`;
}

// Ajusta resolução do Canvas para telas Mobile HD
function resizeCanvas(canvas) {
  const ratio = Math.max(window.devicePixelRatio || 1, 1);
  canvas.width = canvas.offsetWidth * ratio;
  canvas.height = canvas.offsetHeight * ratio;
  canvas.getContext("2d").scale(ratio, ratio);
}

// Adiciona imagem ao grid visual
function addPhotoToGrid(base64Image) {
  photoList.push(base64Image);
  const photosGrid = document.getElementById("photos-grid");

  const index = photoList.length - 1;
  const card = document.createElement("div");
  card.className = "photo-card";
  card.setAttribute("data-index", index);

  card.innerHTML = `
    <img src="${base64Image}" alt="Foto da OS">
    <button type="button" class="btn-remove-photo" onclick="removePhoto(${index})">&times;</button>
  `;

  photosGrid.appendChild(card);
}

// Remove foto selecionada
function removePhoto(index) {
  photoList.splice(index, 1);
  renderPhotosGrid();
}

function renderPhotosGrid() {
  const photosGrid = document.getElementById("photos-grid");
  photosGrid.innerHTML = "";
  const tempPhotos = [...photoList];
  photoList = [];
  tempPhotos.forEach(img => addPhotoToGrid(img));
}

// Função principal de geração de PDF e envio ao Drive
async function handleSaveOS() {
  const modal = document.getElementById("loading-modal");
  const loadingText = document.getElementById("loading-text");
  modal.style.display = "flex";

  try {
    // Captura Nome do Cliente
    const rawName = document.getElementById("cliente-nome").value.trim();
    const formattedName = rawName ? rawName.toUpperCase().replace(/[^A-Z0-9]/g, "_") : "CLIENTE";
    const filename = `${formattedName}_${osNumber}.pdf`;

    // Oculta botões para não saírem no PDF
    document.getElementById("action-buttons").style.display = "none";
    document.getElementById("btn-add-photo").style.display = "none";
    document.getElementById("btn-clear-signature").style.display = "none";
    document.querySelectorAll(".btn-remove-photo").forEach(btn => btn.style.display = "none");

    const element = document.getElementById("os-container");

    // Configurações do html2pdf
    const opt = {
      margin: 8,
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Gera PDF como Blob/Base64
    const pdfWorker = html2pdf().set(opt).from(element);
    
    // Baixa cópia local no dispositivo do técnico
    await pdfWorker.save();

    // Obtém Base64 do PDF para enviar ao Google Drive
    const pdfBase64 = await pdfWorker.outputPdf('datauristring');
    const base64Data = pdfBase64.split(',')[1];

    // Envia para o Google Drive se a URL do Script estiver configurada
    if (GOOGLE_SCRIPT_URL && GOOGLE_SCRIPT_URL !== "SUA_URL_DO_GOOGLE_APPS_SCRIPT_AQUI") {
      loadingText.innerText = "Salvando cópia no Google Drive...";
      
      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: filename,
          mimeType: "application/pdf",
          base64: base64Data
        })
      });
    }

    alert("Ordem de Serviço salva com sucesso!");

  } catch (error) {
    console.error("Erro ao gerar OS:", error);
    alert("Ocorreu um erro ao salvar a OS. O PDF foi gerado localmente.");
  } finally {
    // Restaura exibição dos botões
    document.getElementById("action-buttons").style.display = "block";
    document.getElementById("btn-add-photo").style.display = "flex";
    document.getElementById("btn-clear-signature").style.display = "inline-block";
    document.querySelectorAll(".btn-remove-photo").forEach(btn => btn.style.display = "block");
    modal.style.display = "none";
  }
}