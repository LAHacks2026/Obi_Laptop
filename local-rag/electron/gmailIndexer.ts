import { getDb } from "./database.js";

type EmbedManyFn = (texts: string[]) => Promise<number[][]>;

type GmailMessageListResponse = {
    messages?: Array<{ id: string; threadId: string }>;
    nextPageToken?: string;
    resultSizeEstimate?: number;
};

type GmailMessageDetailResponse = {
    id: string;
    threadId: string;
    snippet?: string;
    historyId?: string;
    internalDate?: string;
    labelIds?: string[];
    payload?: {
        headers?: Array<{ name?: string; value?: string }>;
    };
};

type GmailIndexerStatus = {
    connected: boolean;
    syncing: boolean;
    lastError: string | null;
    indexedCount: number;
    lastSyncedAtMs: number | null;
};

const GMAIL_API_BASE = "https://gmail.googleapis.com/gmail/v1/users/me";
const GMAIL_SCOPE_HINT = "https://www.googleapis.com/auth/gmail.readonly";

export class GmailIndexer {
    private syncing = false;
    private lastError: string | null = null;

    constructor(
        private readonly embedMany: EmbedManyFn,
        private readonly embeddingDimensions: number
    ) {}

    async getStatus(): Promise<GmailIndexerStatus> {
        const db = getDb();
        const row = db
            .prepare("SELECT COUNT(*) AS count FROM gmail_messages")
            .get() as { count: number } | undefined;
        const syncState = db
            .prepare("SELECT last_synced_at_ms FROM gmail_sync_state WHERE id = 1")
            .get() as { last_synced_at_ms: number } | undefined;
        return {
            connected: Boolean(this.getAccessToken()),
            syncing: this.syncing,
            lastError: this.lastError,
            indexedCount: Number(row?.count ?? 0),
            lastSyncedAtMs: syncState?.last_synced_at_ms ?? null,
        };
    }

    async syncMetadata(limit = 200): Promise<{ synced: number; skipped: number }> {
        if (this.syncing) {
            throw new Error("gmail_sync_in_progress");
        }
        this.syncing = true;
        this.lastError = null;
        try {
            const token = this.getAccessToken();
            if (!token) {
                throw new Error(
                    `Missing OBI_GMAIL_ACCESS_TOKEN. Provide a Gmail OAuth access token with ${GMAIL_SCOPE_HINT}.`
                );
            }

            const maxResults = Math.max(1, Math.min(500, Math.trunc(limit)));
            const messageRefs = await this.listRecentMessageRefs(token, maxResults);
            if (!messageRefs.length) {
                this.recordSyncState(null);
                return { synced: 0, skipped: 0 };
            }

            let synced = 0;
            let skipped = 0;
            let latestHistoryId: string | null = null;

            for (const ref of messageRefs) {
                const detail = await this.fetchMessageDetails(token, ref.id);
                if (detail.historyId && (!latestHistoryId || BigInt(detail.historyId) > BigInt(latestHistoryId))) {
                    latestHistoryId = detail.historyId;
                }
                const subject = this.getHeader(detail, "Subject");
                const sender = this.getHeader(detail, "From");
                const snippet = (detail.snippet ?? "").trim();
                const internalDateMs = Number(detail.internalDate ?? 0);
                const sentAtMs = this.parseDateHeaderMs(this.getHeader(detail, "Date"), internalDateMs);

                const content = this.buildIndexableContent({
                    subject,
                    sender,
                    snippet,
                    sentAtMs,
                    labels: detail.labelIds ?? [],
                });
                if (!content.trim()) {
                    skipped += 1;
                    continue;
                }
                await this.upsertMessage({
                    gmailMessageId: detail.id,
                    threadId: detail.threadId,
                    subject,
                    sender,
                    snippet,
                    sentAtMs,
                    internalDateMs,
                    labelIds: detail.labelIds ?? [],
                    content,
                });
                synced += 1;
            }

            this.recordSyncState(latestHistoryId);
            return { synced, skipped };
        } catch (error) {
            this.lastError = error instanceof Error ? error.message : String(error);
            throw error;
        } finally {
            this.syncing = false;
        }
    }

    async clearIndex(): Promise<{ cleared: number }> {
        const db = getDb();
        const existing = db
            .prepare("SELECT COUNT(*) AS count FROM gmail_messages")
            .get() as { count: number } | undefined;
        const count = Number(existing?.count ?? 0);

        const rows = db
            .prepare("SELECT path FROM gmail_messages")
            .all() as Array<{ path: string }>;

        const tx = db.transaction(() => {
            for (const row of rows) {
                const doc = db
                    .prepare("SELECT id FROM documents WHERE path = ?")
                    .get(row.path) as { id: number } | undefined;
                if (!doc) continue;
                db.prepare(`DELETE FROM chunk_embeddings WHERE chunk_id IN (SELECT id FROM chunks WHERE document_id = ?)`).run(doc.id);
                db.prepare(`DELETE FROM chunks_fts WHERE chunk_id IN (SELECT id FROM chunks WHERE document_id = ?)`).run(doc.id);
                db.prepare(`DELETE FROM chunks WHERE document_id = ?`).run(doc.id);
                db.prepare(`DELETE FROM documents WHERE id = ?`).run(doc.id);
            }
            db.prepare("DELETE FROM gmail_messages").run();
            db.prepare("INSERT INTO gmail_sync_state (id, last_synced_at_ms, last_history_id) VALUES (1, 0, NULL) ON CONFLICT(id) DO UPDATE SET last_synced_at_ms = 0, last_history_id = NULL").run();
        });
        tx();
        return { cleared: count };
    }

    private async listRecentMessageRefs(token: string, maxResults: number): Promise<Array<{ id: string; threadId: string }>> {
        const refs: Array<{ id: string; threadId: string }> = [];
        let pageToken: string | undefined;
        while (refs.length < maxResults) {
            const take = Math.min(100, maxResults - refs.length);
            const qs = new URLSearchParams({
                maxResults: String(take),
                includeSpamTrash: "false",
            });
            if (pageToken) qs.set("pageToken", pageToken);
            const res = await fetch(`${GMAIL_API_BASE}/messages?${qs.toString()}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                const body = await res.text().catch(() => "");
                throw new Error(`gmail_list_failed (${res.status}): ${body}`);
            }
            const payload = (await res.json()) as GmailMessageListResponse;
            refs.push(...(payload.messages ?? []));
            pageToken = payload.nextPageToken;
            if (!pageToken) break;
        }
        return refs.slice(0, maxResults);
    }

    private async fetchMessageDetails(token: string, messageId: string): Promise<GmailMessageDetailResponse> {
        const qs = new URLSearchParams({
            format: "metadata",
            metadataHeaders: "Subject",
        });
        qs.append("metadataHeaders", "From");
        qs.append("metadataHeaders", "Date");

        const res = await fetch(`${GMAIL_API_BASE}/messages/${encodeURIComponent(messageId)}?${qs.toString()}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
            const body = await res.text().catch(() => "");
            throw new Error(`gmail_message_fetch_failed (${res.status}) for ${messageId}: ${body}`);
        }
        return (await res.json()) as GmailMessageDetailResponse;
    }

    private getHeader(detail: GmailMessageDetailResponse, headerName: string): string {
        const target = headerName.toLowerCase();
        const header = detail.payload?.headers?.find((h) => (h.name ?? "").toLowerCase() === target);
        return (header?.value ?? "").trim();
    }

    private parseDateHeaderMs(dateHeader: string, fallbackMs: number): number {
        const parsed = Date.parse(dateHeader);
        if (Number.isFinite(parsed)) return parsed;
        return Number.isFinite(fallbackMs) ? fallbackMs : Date.now();
    }

    private buildIndexableContent(input: {
        subject: string;
        sender: string;
        snippet: string;
        sentAtMs: number;
        labels: string[];
    }): string {
        const lines = [
            `Source: Gmail`,
            `Subject: ${input.subject || "(no subject)"}`,
            `From: ${input.sender || "(unknown sender)"}`,
            `Date: ${new Date(input.sentAtMs).toISOString()}`,
            input.labels.length ? `Labels: ${input.labels.join(", ")}` : "",
            `Snippet: ${input.snippet || "(no snippet)"}`,
        ].filter(Boolean);
        return lines.join("\n");
    }

    private async upsertMessage(input: {
        gmailMessageId: string;
        threadId: string;
        subject: string;
        sender: string;
        snippet: string;
        sentAtMs: number;
        internalDateMs: number;
        labelIds: string[];
        content: string;
    }) {
        const db = getDb();
        const emailPath = `gmail://message/${input.gmailMessageId}`;
        const fileName = input.subject || `gmail-${input.gmailMessageId}`;
        const now = Date.now();

        const [embedding] = await this.embedMany([input.content]);
        if (!embedding || embedding.length !== this.embeddingDimensions) {
            throw new Error(`gmail_embedding_dimension_mismatch: expected ${this.embeddingDimensions}, got ${embedding?.length ?? 0}`);
        }

        const existingDoc = db
            .prepare("SELECT id FROM documents WHERE path = ?")
            .get(emailPath) as { id: number } | undefined;
        const existingGmail = db
            .prepare("SELECT id, index_count FROM gmail_messages WHERE gmail_message_id = ?")
            .get(input.gmailMessageId) as { id: number; index_count: number } | undefined;

        const tx = db.transaction(() => {
            let documentId: number;
            if (existingDoc) {
                documentId = existingDoc.id;
                db.prepare(`DELETE FROM chunk_embeddings WHERE chunk_id IN (SELECT id FROM chunks WHERE document_id = ?)`).run(documentId);
                db.prepare(`DELETE FROM chunks_fts WHERE chunk_id IN (SELECT id FROM chunks WHERE document_id = ?)`).run(documentId);
                db.prepare(`DELETE FROM chunks WHERE document_id = ?`).run(documentId);
                db.prepare(`
                    UPDATE documents
                    SET file_name = ?, updated_at_ms = ?, indexed_at_ms = ?, index_count = COALESCE(index_count, 1) + 1
                    WHERE id = ?
                `).run(fileName, input.internalDateMs || now, now, documentId);
            } else {
                const inserted = db.prepare(`
                    INSERT INTO documents (path, file_name, updated_at_ms, indexed_at_ms, index_count)
                    VALUES (?, ?, ?, ?, 1)
                `).run(emailPath, fileName, input.internalDateMs || now, now);
                documentId = Number(inserted.lastInsertRowid);
            }

            const chunkInserted = db.prepare(`
                INSERT INTO chunks (document_id, chunk_index, content, section_title, char_start, char_end)
                VALUES (?, 0, ?, 'gmail', 0, ?)
            `).run(documentId, input.content, input.content.length);
            const chunkId = Number(chunkInserted.lastInsertRowid);
            db.prepare("DELETE FROM chunk_embeddings WHERE chunk_id = CAST(? AS INTEGER)").run(chunkId);
            db.prepare(`
                INSERT INTO chunk_embeddings (chunk_id, embedding)
                VALUES (CAST(? AS INTEGER), vec_f32(?))
            `).run(chunkId, serializeVector(embedding));
            db.prepare(`
                INSERT INTO chunks_fts (content, chunk_id, document_path)
                VALUES (?, ?, ?)
            `).run(input.content, chunkId, emailPath);

            if (existingGmail) {
                db.prepare(`
                    UPDATE gmail_messages
                    SET
                        thread_id = ?,
                        path = ?,
                        subject = ?,
                        snippet = ?,
                        sender = ?,
                        sent_at_ms = ?,
                        internal_date_ms = ?,
                        label_ids_json = ?,
                        indexed_at_ms = ?,
                        updated_at_ms = ?,
                        index_count = COALESCE(index_count, 1) + 1
                    WHERE gmail_message_id = ?
                `).run(
                    input.threadId,
                    emailPath,
                    input.subject,
                    input.snippet,
                    input.sender,
                    input.sentAtMs,
                    input.internalDateMs,
                    JSON.stringify(input.labelIds),
                    now,
                    input.internalDateMs || now,
                    input.gmailMessageId
                );
            } else {
                db.prepare(`
                    INSERT INTO gmail_messages (
                        gmail_message_id, thread_id, path, subject, snippet, sender,
                        sent_at_ms, internal_date_ms, label_ids_json, indexed_at_ms, updated_at_ms, index_count
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
                `).run(
                    input.gmailMessageId,
                    input.threadId,
                    emailPath,
                    input.subject,
                    input.snippet,
                    input.sender,
                    input.sentAtMs,
                    input.internalDateMs,
                    JSON.stringify(input.labelIds),
                    now,
                    input.internalDateMs || now
                );
            }
        });
        tx();
    }

    private recordSyncState(lastHistoryId: string | null) {
        const db = getDb();
        db.prepare(`
            INSERT INTO gmail_sync_state (id, last_synced_at_ms, last_history_id)
            VALUES (1, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                last_synced_at_ms = excluded.last_synced_at_ms,
                last_history_id = excluded.last_history_id
        `).run(Date.now(), lastHistoryId);
    }

    private getAccessToken(): string | null {
        const token = process.env.OBI_GMAIL_ACCESS_TOKEN?.trim();
        return token ? token : null;
    }
}

function serializeVector(values: number[]): Buffer {
    const array = new Float32Array(values);
    return Buffer.from(array.buffer, array.byteOffset, array.byteLength);
}
