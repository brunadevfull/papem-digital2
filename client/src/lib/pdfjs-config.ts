import { GlobalWorkerOptions } from 'pdfjs-dist';

// Configurar o worker do PDF.js
const pdfjsWorkerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${GlobalWorkerOptions.workerSrc ? GlobalWorkerOptions.workerSrc.split('/').slice(-2)[0] : '3.11.174'}/pdf.worker.min.js`;

GlobalWorkerOptions.workerSrc = pdfjsWorkerSrc;

export default GlobalWorkerOptions;