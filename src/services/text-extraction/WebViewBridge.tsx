import React from 'react';
import { WebView } from 'react-native-webview';
import { logger } from '../../utils/logger';
import { PDF_JS_EXTRACTOR_HTML } from './pdfJsHtml';

type MessagePayload = {
  type: string;
  payload?: any;
};

type ResponsePayload = {
  type: 'success' | 'error' | 'ready';
  payload: any;
};

/**
 * WebViewBridge manages a hidden WebView that runs pdfjs-dist for text extraction.
 * It provides a Promise-based API to send messages and receive responses.
 */
export class WebViewBridge {
  private webViewRef: React.RefObject<WebView> = React.createRef<WebView>();
  private pendingResolvers: Map<string, { resolve: (value: ResponsePayload) => void; reject: (reason: any) => void }> = new Map();
  private messageCounter: number = 0;
  private readyPromise: Promise<void> | null = null;
  private readyResolve: (() => void) | null = null;
  private isReady: boolean = false;
  private isInitialized: boolean = false;

  /**
   * Initialize the WebView. Must be called before any communication.
   */
  initialize(): void {
    if (this.isInitialized) {
      return;
    }
    this.readyPromise = new Promise<void>((resolve) => {
      this.readyResolve = resolve;
    });
    this.isInitialized = true;
    logger.debug('WebViewBridge initialized');
  }

  /**
   * Get the WebView component to be rendered in the component tree.
   * This should be placed in a hidden container (e.g., height: 0, width: 0, opacity: 0).
   */
  getWebView(): React.ReactElement {
    return (
      <WebView
        ref={this.webViewRef}
        source={{ html: PDF_JS_EXTRACTOR_HTML, baseUrl: 'https://cdnjs.cloudflare.com' }}
        onMessage={this.handleMessage}
        onLoadEnd={this.onLoadEnd}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        cacheEnabled={false}
        originWhitelist={['*']}
        style={{ height: 0, width: 0, opacity: 0 }}
      />
    );
  }

  /**
   * Called when the WebView finishes loading.
   * It waits for the 'ready' message from the HTML page.
   */
  private onLoadEnd = () => {
    // The WebView will send a 'ready' message when the page initializes.
    // We'll wait for that message to resolve the ready promise.
    logger.debug('WebView loaded, waiting for ready message...');
  };

  /**
   * Handle messages from the WebView.
   */
  private handleMessage = (event: any) => {
    try {
      const data: ResponsePayload = JSON.parse(event.nativeEvent.data);
      logger.debug('WebViewBridge received message:', data);

      if (data.type === 'ready') {
        this.isReady = true;
        if (this.readyResolve) {
          this.readyResolve();
          this.readyResolve = null;
        }
        return;
      }

      // For other messages, resolve the pending promise
      // We need to find the pending resolver for this message.
      // We'll use the message ID if present, or fallback to the latest.
      // For simplicity, we'll assume messages are processed in order.
      // To support multiple concurrent requests, we'd need to include an ID.
      // For now, we'll use a simple approach: the first pending resolver.
      const entry = this.pendingResolvers.values().next().value;
      if (entry) {
        entry.resolve(data);
        this.pendingResolvers.delete(this.pendingResolvers.keys().next().value);
      }
    } catch (error) {
      logger.error('Failed to parse WebView message:', error);
    }
  };

  /**
   * Wait for the WebView to be ready.
   * @throws If the WebView times out.
   */
  async waitForReady(timeout: number = 10000): Promise<void> {
    if (this.isReady) {
      return;
    }
    if (!this.readyPromise) {
      this.initialize();
    }
    // Race against timeout
    const timeoutPromise = new Promise<void>((_, reject) => {
      setTimeout(() => reject(new Error('WebView ready timeout')), timeout);
    });
    await Promise.race([this.readyPromise!, timeoutPromise]);
  }

  /**
   * Send a message to the WebView and wait for a response.
   * @param message The message payload.
   * @param timeout Maximum time to wait for a response (ms).
   * @returns The response payload.
   */
  async sendMessageAndWaitForResponse(message: MessagePayload, timeout: number = 60000): Promise<ResponsePayload> {
    if (!this.isInitialized) {
      throw new Error('WebViewBridge not initialized. Call initialize() first.');
    }
    await this.waitForReady();

    // Generate a unique ID for this request
    const id = `${Date.now()}-${++this.messageCounter}`;
    const fullMessage = { ...message, id };

    // Create a promise that will be resolved when we get a response
    const responsePromise = new Promise<ResponsePayload>((resolve, reject) => {
      this.pendingResolvers.set(id, { resolve, reject });
    });

    // Send the message
    if (this.webViewRef.current) {
      this.webViewRef.current.postMessage(JSON.stringify(fullMessage));
    } else {
      throw new Error('WebView ref is not available');
    }

    // Race against timeout
    const timeoutPromise = new Promise<ResponsePayload>((_, reject) => {
      setTimeout(() => reject(new Error('Response timeout')), timeout);
    });

    try {
      const response = await Promise.race([responsePromise, timeoutPromise]);
      // Clean up the resolver
      this.pendingResolvers.delete(id);
      return response;
    } catch (error) {
      this.pendingResolvers.delete(id);
      throw error;
    }
  }

  /**
   * Dispose of the WebView and clean up resources.
   */
  dispose(): void {
    this.isInitialized = false;
    this.isReady = false;
    this.pendingResolvers.clear();
    this.readyPromise = null;
    this.readyResolve = null;
    // If we have a WebView ref, we could unload it, but it's handled by React.
    logger.debug('WebViewBridge disposed');
  }
}