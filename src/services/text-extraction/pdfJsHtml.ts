export const PDF_JS_EXTRACTOR_HTML = `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <script type="module">
    import * as pdfjsLib from "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.min.mjs";

    pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.mjs";

    const post = (message) => {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify(message));
      }
    };

    const base64ToBytes = (base64) => {
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes;
    };

    const extractText = async (base64) => {
      const data = base64ToBytes(base64);
      const loadingTask = pdfjsLib.getDocument({ data, disableWorker: true });
      const pdf = await loadingTask.promise;
      const pages = [];

      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber);
        const content = await page.getTextContent();
        const text = content.items
          .map((item) => (item && typeof item.str === "string" ? item.str : ""))
          .join(" ")
          .replace(/\\s+/g, " ")
          .trim();

        if (text) {
          pages.push("[Page " + pageNumber + "]\\n" + text);
        }
      }

      return pages.join("\\n\\n");
    };

    window.addEventListener("message", async (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type !== "extractText") return;

        try {
          const text = await extractText(message.payload);
          post({ type: "success", payload: text, id: message.id });
        } catch (error) {
          post({
            type: "error",
            payload: error && error.message ? error.message : String(error),
            id: message.id,
          });
        }
      } catch (error) {
        post({ type: "error", payload: String(error) });
      }
    });

    post({ type: "ready" });
  </script>
</head>
<body></body>
</html>
`;
