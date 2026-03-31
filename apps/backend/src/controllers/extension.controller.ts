import { Request, Response } from "express";
import archiver from "archiver";
import path from "path";
import fs from "fs";

export const downloadExtension = (req: Request, res: Response) => {
  const sourceDir = path.join(__dirname, "..", "..", "public", "extension");
  const zipFileName = "extension.zip";
  const zipFilePath = path.join(__dirname, "..", "..", zipFileName);

  if (!fs.existsSync(sourceDir)) {
    return res.status(404).send("Extension files not found.");
  }

  const output = fs.createWriteStream(zipFilePath);
  const archive = archiver("zip", {
    zlib: { level: 9 },
  });

  output.on("close", () => {
    res.download(zipFilePath, zipFileName, (err) => {
      if (err) {
        console.error("Error downloading zip file:", err);
      }
      fs.unlinkSync(zipFilePath); // Clean up the zip file after download
    });
  });

  archive.on("error", (err) => {
    throw err;
  });

  archive.pipe(output);
  archive.directory(sourceDir, false);
  archive.finalize();
};
