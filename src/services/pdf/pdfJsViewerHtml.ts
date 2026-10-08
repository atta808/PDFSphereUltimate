export const PDF_JS_VIEWER_HTML = `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1" />
  <style>
    html, body { margin: 0; padding: 0; background: #f0f0f0; width: 100%; height: 100%; overflow: hidden; }
    #container { width: 100%; height: 100%; overflow: auto; display: flex; justify-content: center; align-items: flex-start; }
    canvas { margin: 16px auto; background: white; box-shadow: 0 1px 6px rgba(0,0,0,.2); }
    #message { color: #666; font-family: sans-serif; padding: 24px; text-align: center; }
  </style>
</head>
<body>
  <div id="container"><div id="message">Loading PDF...</div><canvas id="page" style="display:none"></canvas></div>
  <script type="module">
    import * as pdfjsLib from "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.min.mjs";
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.mjs";

    let pdf = null;
    let currentPage = 1;
    let scale = 1;

    const post = (message) => {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify(message));
      }
    };

    const base64ToBytes = (base64) => {
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
      return bytes;
    };

    const renderPage = async (pageNumber) => {
      if (!pdf) return;
      currentPage = Math.max(1, Math.min(pageNumber, pdf.numPages));
      const page = await pdf.getPage(currentPage);
      const viewport = page.getViewport({ scale });
      const canvas = document.getElementById("page");
      const context = canvas.getContext("2d");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.display = "block";
      document.getElementById("message").style.display = "none";
      await page.render({ canvasContext: context, viewport }).promise;
      post({ type: "pageChanged", page: currentPage });
    };

    const loadPdf = async (base64, password) => {
      try {
        pdf = await pdfjsLib.getDocument({ data: base64ToBytes(base64), disableWorker: false, password }).promise;
        post({ type: "loaded", pageCount: pdf.numPages });
        await renderPage(1);
      } catch (error) {
        if (error && error.name === "PasswordException") {\n          post({ type: "passwordRequired" });\n          return;\n        }\n        post({ type: "error", payload: error && error.message ? error.message : String(error) });
      }
    };

    window.addEventListener("message", async (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "loadPdf") await loadPdf(message.payload, message.password);
        else if (message.type === "setPage") await renderPage(Number(message.page) || 1);
        else if (message.type === "setScale") {
          scale = Math.max(0.5, Math.min(Number(message.scale) || 1, 3));
          await renderPage(currentPage);
        }
      } catch (error) {
        post({ type: "error", payload: String(error) });
      }
    });

    post({ type: "ready" });
  </script>
</body>
</html>
`;
