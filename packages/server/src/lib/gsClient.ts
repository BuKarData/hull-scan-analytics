// Klient do "GS Server" - bazowej aplikacji, ktora z zestawu zdjec z telefonu
// generuje model Gaussian Splatting (COLMAP + Brush) i udostepnia go jako .ply.
// Kontrakt endpointow zgodny z CLIENT_INTEGRATION_GUIDE.md dostarczonym przez
// zespol. Modul NIE jest jeszcze podpiety pod zadne trasy API tej aplikacji -
// to gotowa warstwa integracyjna na moment, gdy przechodzimy z danych demo na
// realne skany. Docelowy przeplyw opisany w docs/ARCHITECTURE.md.
//
// Uwaga: adres serwera jest srodowiskowy i nie powinien byc zahardkodowany -
// przekazujemy go w konstruktorze / przez zmienna srodowiskowa GS_SERVER_URL.

export type TrainingMode = "colmap_images" | "pointcloud_only" | "hybrid_colmap_pointcloud";

export type JobStatus =
  | "pending"
  | "uploading"
  | "uploaded"
  | "colmap_running"
  | "colmap_done"
  | "training"
  | "completed"
  | "failed"
  | "cancelled"
  | "colmap_failed"
  | "training_failed";

const TERMINAL_STATUSES = new Set<JobStatus>(["completed", "failed", "cancelled", "colmap_failed", "training_failed"]);

export interface CreateJobOptions {
  autoStart?: boolean;
  totalSteps?: number;
  maxResolution?: number;
  trainingMode?: TrainingMode;
}

export interface JobResponse {
  job_id: string;
  upload_url?: string;
  websocket_url?: string;
}

export interface TrainingProgress {
  current_step: number;
  total_steps: number;
  steps_per_second?: number;
  psnr?: number;
  ssim?: number;
  splat_count?: number;
}

export interface ProgressResponse {
  status: JobStatus;
  overall_progress: number;
  message?: string;
  error?: string;
  training?: TrainingProgress;
}

export class GSServerClient {
  private baseUrl: string;

  constructor(serverUrl: string) {
    this.baseUrl = serverUrl.replace(/\/$/, "");
  }

  async checkConnection(): Promise<boolean> {
    try {
      const r = await fetch(`${this.baseUrl}/status`);
      return r.ok;
    } catch {
      return false;
    }
  }

  async createJob(name: string, opts: CreateJobOptions = {}): Promise<JobResponse> {
    const payload = {
      name,
      auto_start: opts.autoStart ?? true,
      training_mode: opts.trainingMode ?? "colmap_images",
      brush_config: {
        total_steps: opts.totalSteps ?? 30000,
        max_resolution: opts.maxResolution ?? 1920,
      },
    };
    const r = await fetch(`${this.baseUrl}/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!r.ok) throw new Error(`Nie udalo sie utworzyc zadania GS: ${r.status}`);
    return (await r.json()) as JobResponse;
  }

  /** `images` - bufory JPEG/PNG z aplikacji mobilnej wykonujacej skan przegladowy. */
  async uploadImages(jobId: string, images: { filename: string; data: Buffer }[]): Promise<void> {
    const form = new FormData();
    for (const img of images) {
      form.append("files", new Blob([new Uint8Array(img.data)]), img.filename);
    }
    const r = await fetch(`${this.baseUrl}/jobs/${jobId}/upload`, { method: "POST", body: form });
    if (!r.ok) throw new Error(`Blad przesylania zdjec: ${r.status}`);
  }

  async completeUpload(jobId: string): Promise<void> {
    const r = await fetch(`${this.baseUrl}/jobs/${jobId}/upload/complete`, { method: "POST" });
    if (!r.ok) throw new Error(`Blad finalizacji uploadu: ${r.status}`);
  }

  async getProgress(jobId: string): Promise<ProgressResponse> {
    const r = await fetch(`${this.baseUrl}/jobs/${jobId}/progress`);
    if (!r.ok) throw new Error(`Blad pobierania postepu: ${r.status}`);
    return (await r.json()) as ProgressResponse;
  }

  async waitForCompletion(jobId: string, pollIntervalMs = 3000, onProgress?: (p: ProgressResponse) => void): Promise<ProgressResponse> {
    while (true) {
      const progress = await this.getProgress(jobId);
      onProgress?.(progress);
      if (TERMINAL_STATUSES.has(progress.status)) return progress;
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }
  }

  /** Zwraca surowe bajty .ply wytrenowanego modelu Gaussian Splatting. */
  async downloadModel(jobId: string): Promise<Buffer> {
    const r = await fetch(`${this.baseUrl}/jobs/${jobId}/model`);
    if (!r.ok) throw new Error(`Blad pobierania modelu: ${r.status}`);
    return Buffer.from(await r.arrayBuffer());
  }
}
