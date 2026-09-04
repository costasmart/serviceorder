// URL do Google Apps Script
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzuC3iWIJE7_cSN_lE9Lw00AE7bnJ0TtndiDmBCZfVCpsPkkw_H5_fok-KX82ETWsKd/exec";

let signaturePad;
let osNumber = "";
let photoList = [];

document.addEventListener("DOMContentLoaded", () => {
  osNumber = generateOSNumber();
  document.getElementById("os-number-display").innerText = osNumber;
  document.getElementById("os-date-display").innerText = new Date().toLocaleString("pt-BR");

  const canvas = document.getElementById("signature-canvas");
  resizeCanvas(canvas);
  signaturePad = new SignaturePad(canvas, {
    backgroundColor: 'rgba(255, 255, 255, 0)',
    penColor: 'rgb(0, 0, 0)'
  });

  document.getElementById("btn-clear-signature").addEventListener("click", () => {
    signaturePad.clear();
  });

  const btnAddPhoto = document.getElementById("btn-add-photo");
  const photoFileInput = document.getElementById("photo-file-input");

  btnAddPhoto.addEventListener("click", () => {
    photoFileInput.click();
  });

  photoFileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      compressImage(file, 800, (compressedBase64) => {
        addPhotoToGrid(compressedBase64);
        photoFileInput.value = ""; 
      });
    }
  });

  document.getElementById("btn-submit").addEventListener("click", handleSaveOS);
});

function compressImage(file, maxWidth, callback) {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = function(event) {
    const img = new Image();
    img.src = event.target.result;
    img.onload = function() {
      const canvas = document.createElement('canvas');
      const scaleSize = maxWidth / img.width;
      
      if (scaleSize >= 1) {
        canvas.width = img.width;
        canvas.height = img.height;
      } else {
        canvas.width = maxWidth;
        canvas.height = img.height * scaleSize;
      }

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
      callback(compressedBase64);
    };
  };
}

function generateOSNumber() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(now.getDate())}${pad(now.getMonth() + 1)}${now.getFullYear()}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

function resizeCanvas(canvas) {
  const ratio = Math.max(window.devicePixelRatio || 1, 1);
  canvas.width = canvas.offsetWidth * ratio;
  canvas.height = canvas.offsetHeight * ratio;
  canvas.getContext("2d").scale(ratio, ratio);
}

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

// CORREÇÃO CORTE LATERAL PDF PC E TRANSBORDO PDF MOBILE
// async function handleSaveOS() {
//   const modal = document.getElementById("loading-modal");
//   const loadingText = document.getElementById("loading-text");
//   modal.style.display = "flex";

//   const element = document.getElementById("os-container");
//   const originalWidth = element.style.width;
//   const originalMaxWidth = element.style.maxWidth;

//   try {
//     const rawName = document.getElementById("cliente-nome").value.trim();
//     const formattedName = rawName ? rawName.toUpperCase().replace(/[^A-Z0-9]/g, "_") : "CLIENTE";
//     const filename = `${formattedName}_${osNumber}.pdf`;

//     document.getElementById("action-buttons").style.display = "none";
//     document.getElementById("btn-add-photo").style.display = "none";
//     document.getElementById("btn-clear-signature").style.display = "none";
//     document.querySelectorAll(".btn-remove-photo").forEach(btn => btn.style.display = "none");

//     window.scrollTo(0, 0);

//     // TRUQUE: Força o formulário a ter 800px temporariamente para o PDF não cortar
//     element.style.width = '800px';
//     element.style.maxWidth = '800px';

//     const opt = {
//       margin: 5,
//       filename: filename,
//       image: { type: 'jpeg', quality: 0.98 },
//       pagebreak: { mode: ['css', 'legacy'] },
//       html2canvas: { 
//         scale: 2, 
//         useCORS: true,
//         scrollY: 0,
//         scrollX: 0,
//         windowWidth: 820 // Câmera virtual captura os 800px inteiros
//       },
//       jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
//     };

//     const pdfWorker = html2pdf().set(opt).from(element);
    
//     await pdfWorker.save();

//     const pdfBase64 = await pdfWorker.outputPdf('datauristring');
//     const base64Data = pdfBase64.split(',')[1];

//     if (GOOGLE_SCRIPT_URL) {
//       loadingText.innerText = "Salvando cópia no Google Drive...";
      
//       await fetch(GOOGLE_SCRIPT_URL, {
//         method: "POST",
//         mode: "no-cors",
//         headers: {
//           "Content-Type": "text/plain;charset=utf-8", 
//         },
//         body: JSON.stringify({
//           filename: filename,
//           mimeType: "application/pdf",
//           base64: base64Data
//         })
//       });
//     }

//     alert("Ordem de Serviço gerada e salva no Drive com sucesso!");

//   } catch (error) {
//     console.error("Erro ao gerar OS:", error);
//     alert("Ocorreu um erro ao gerar a O.S. Verifique sua conexão e tente novamente.");
//   } finally {
//     // Restaura o tamanho normal para não quebrar a tela do celular
//     element.style.width = originalWidth;
//     element.style.maxWidth = originalMaxWidth;

//     document.getElementById("action-buttons").style.display = "block";
//     document.getElementById("btn-add-photo").style.display = "flex";
//     document.getElementById("btn-clear-signature").style.display = "inline-block";
//     document.querySelectorAll(".btn-remove-photo").forEach(btn => btn.style.display = "block");
//     modal.style.display = "none";
//   }
// }

async function handleSaveOS() {
  const modal = document.getElementById("loading-modal");
  const loadingText = document.getElementById("loading-text");
  modal.style.display = "flex";

  try {
    const rawName = document.getElementById("cliente-nome").value.trim();
    const formattedName = rawName ? rawName.toUpperCase().replace(/[^A-Z0-9]/g, "_") : "CLIENTE";
    const filename = `${formattedName}_${osNumber}.pdf`;

    // Oculta os botões
    document.getElementById("action-buttons").style.display = "none";
    document.getElementById("btn-add-photo").style.display = "none";
    document.getElementById("btn-clear-signature").style.display = "none";
    document.querySelectorAll(".btn-remove-photo").forEach(btn => btn.style.display = "none");

    window.scrollTo(0, 0);

    // TRUQUE MESTRE: Aplica a classe que transforma a tela num A4 perfeito
    document.body.classList.add("pdf-mode");

    const element = document.getElementById("os-container");

    const opt = {
      margin: 5,
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      pagebreak: { mode: ['css', 'legacy'] },
      html2canvas: { 
        scale: 2, 
        useCORS: true,
        scrollY: 0,
        scrollX: 0,
        windowWidth: 800 // Trava a câmera virtual em exatos 800px
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    const pdfWorker = html2pdf().set(opt).from(element);
    
    // Baixa o PDF no dispositivo
    await pdfWorker.save();

    // Extrai o código base64 para enviar ao Drive
    const pdfBase64 = await pdfWorker.outputPdf('datauristring');
    const base64Data = pdfBase64.split(',')[1];

    if (GOOGLE_SCRIPT_URL) {
      loadingText.innerText = "Salvando cópia no Google Drive...";
      
      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "text/plain;charset=utf-8", 
        },
        body: JSON.stringify({
          filename: filename,
          mimeType: "application/pdf",
          base64: base64Data
        })
      });
    }

    alert("Ordem de Serviço gerada e salva no Drive com sucesso!");

  } catch (error) {
    console.error("Erro ao gerar OS:", error);
    alert("Ocorreu um erro ao gerar a O.S. Verifique sua conexão e tente novamente.");
  } finally {
    // RESTAURA a tela para o tamanho normal apagando a classe do A4
    document.body.classList.remove("pdf-mode");

    // Restaura os botões
    document.getElementById("action-buttons").style.display = "block";
    document.getElementById("btn-add-photo").style.display = "flex";
    document.getElementById("btn-clear-signature").style.display = "inline-block";
    document.querySelectorAll(".btn-remove-photo").forEach(btn => btn.style.display = "block");
    modal.style.display = "none";
  }
}