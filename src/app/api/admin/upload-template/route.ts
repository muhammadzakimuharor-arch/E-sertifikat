import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

const ALLOWED_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Berkas gambar template tidak ditemukan." },
        { status: 400 }
      );
    }

    const ext = ALLOWED_TYPES[file.type];
    if (!ext) {
      return NextResponse.json(
        {
          error:
            "Format gambar tidak didukung. Gunakan PNG, JPG, WEBP, atau SVG.",
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "Ukuran berkas maksimal 5 MB." },
        { status: 400 }
      );
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
    const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
    const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

    if (cloudName && apiKey && apiSecret) {
      const timestamp = Math.floor(Date.now() / 1000);
      const folder = "vericert-templates";
      const signaturePayload = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
      const signature = crypto
        .createHash("sha1")
        .update(signaturePayload)
        .digest("hex");

      const uploadForm = new FormData();
      uploadForm.append("file", file);
      uploadForm.append("api_key", apiKey);
      uploadForm.append("timestamp", String(timestamp));
      uploadForm.append("folder", folder);
      uploadForm.append("signature", signature);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: uploadForm,
        }
      );

      if (!res.ok) {
        const errText = await res.text();
        console.error("Cloudinary upload failed:", errText);
        return NextResponse.json(
          { error: "Gagal mengunggah gambar ke Cloudinary." },
          { status: 502 }
        );
      }

      const data = (await res.json()) as { secure_url?: string };
      if (!data.secure_url) {
        return NextResponse.json(
          { error: "Respons Cloudinary tidak menyertakan URL gambar." },
          { status: 502 }
        );
      }

      return NextResponse.json({
        ok: true,
        url: data.secure_url,
        storageMode: "cloudinary",
        fileName: file.name,
      });
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });
    const filename = `template-${crypto.randomUUID()}.${ext}`;
    const bytes = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(path.join(uploadsDir, filename), bytes);

    return NextResponse.json({
      ok: true,
      url: `/uploads/${filename}`,
      storageMode: "local",
      fileName: file.name,
    });
  } catch (error) {
    console.error("Upload template error:", error);
    return NextResponse.json(
      { error: "Gagal memproses unggahan template." },
      { status: 500 }
    );
  }
}
