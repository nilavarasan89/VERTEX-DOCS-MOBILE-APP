/**
 * Vertex Docs Mobile - Modular Backend API Client
 * Company: JM Vertex Technologies
 * 
 * Provides modular integration with enterprise document backend APIs.
 * When remote backend is enabled and online, routes conversion & translation
 * to REST endpoints. If backend is unconfigured or unreachable, seamlessly
 * falls back to high-fidelity on-device processing.
 */

import {
  API_CONFIG,
  ApiConvertRequest,
  ApiConvertResponse,
  ApiTranslateRequest,
  ApiTranslateResponse,
} from './apiConfig';

class ApiClient {
  private baseUrl: string = API_CONFIG.baseUrl;
  private timeoutMs: number = API_CONFIG.timeoutMs;
  private authToken: string | null = null;

  public setAuthToken(token: string) {
    this.authToken = token;
  }

  public getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'X-Client-Platform': 'VertexDocs-Mobile-Android',
      'X-Client-Version': '1.0.0',
    };
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }
    return headers;
  }

  /**
   * Request remote document conversion
   * POST /documents/convert
   */
  public async convertDocument(
    req: ApiConvertRequest
  ): Promise<ApiConvertResponse | null> {
    if (!API_CONFIG.useRemoteBackend) {
      return null;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const formData = new FormData();
      formData.append('sourceFormat', req.sourceFormat);
      formData.append('targetFormat', req.targetFormat);
      formData.append('fileName', req.fileName);
      formData.append('fileSize', String(req.fileSize));

      // Append file binary if local URI is provided
      if (req.fileUri) {
        formData.append('file', {
          uri: req.fileUri,
          name: req.fileName,
          type: 'application/octet-stream',
        } as any);
      }

      const response = await fetch(`${this.baseUrl}/documents/convert`, {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }

      const data: ApiConvertResponse = await response.json();
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      console.warn(
        `[ApiClient] Remote /documents/convert unavailable (${(error as Error).message}). Using client-side conversion engine.`
      );
      return null;
    }
  }

  /**
   * Request remote document translation
   * POST /documents/translate
   */
  public async translateDocument(
    req: ApiTranslateRequest
  ): Promise<ApiTranslateResponse | null> {
    if (!API_CONFIG.useRemoteBackend) {
      return null;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/documents/translate`, {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: req.text,
          documentTitle: req.documentTitle,
          sourceLanguage: req.sourceLanguage,
          targetLanguage: req.targetLanguage,
          domain: 'business_legal',
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }

      const data: ApiTranslateResponse = await response.json();
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      console.warn(
        `[ApiClient] Remote /documents/translate unavailable (${(error as Error).message}). Using client-side translation engine.`
      );
      return null;
    }
  }

  /**
   * Extract text and metadata from document
   * POST /documents/extract-text
   */
  public async extractText(fileUri: string, fileName: string): Promise<string | null> {
    if (!API_CONFIG.useRemoteBackend) {
      return null;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const formData = new FormData();
      formData.append('file', {
        uri: fileUri,
        name: fileName,
        type: 'application/octet-stream',
      } as any);

      const response = await fetch(`${this.baseUrl}/documents/extract-text`, {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();
      return data.text || null;
    } catch (error) {
      clearTimeout(timeoutId);
      console.warn(
        `[ApiClient] Remote /documents/extract-text unavailable. Using local extraction.`
      );
      return null;
    }
  }
}

export const apiClient = new ApiClient();

