import { access, readdir } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { cloudinary } from "../middlewares/cloudinaryUpload.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "../..");
const DEFAULT_IMAGE_DIRECTORIES = [
  path.join(PROJECT_ROOT, "images"),
  path.join(PROJECT_ROOT, "client", "src", "images"),
];
const CERTIFICATES_FOLDER = "certificates";
const rawStudentRecords = String.raw`
38889 ALISHA BHATI
38903 AMRITA
38413 BHUMIKA JOSHI
39275 BHUMIKA SHARMA
38900 DIVYA BHOBHRIYA
38412 HARMAN KAUR
39196 HIMANSHI
38644 KAJAL
39098 KANISHKA
38929 KHUSHNOOR KAUR VIRK
39017 KOMAL
38870 LAVISHA
38954 LAXMI
38962 MAHAK HANDA
39033 MAHAKMEET KAUR
38410 MANPREET KAUR
38416 MANVEER KAUR
39042 MANVEER KAUR
38376 MUSKAN BANSAL
38481 MUSKAN GARG
38880 NEELAKSHI SHARMA
38662 NIMRAT KAUR
39040 OSHEEN
38650 PARI ARORA
39046 PARNEET KAUR BHULLAR
38419 POOJA
38467 PRACHI
39065 PRAVESH
38480 SAMA
39054 SANIA
38974 SHAGUN CHUGH
38611 SHARDA KANTI
38930 SIMRAN ARORA
38460 SNEHA
39373 SURMUKH
38945 TANISHA JANA
39363 TRIPTI BHARDWAJ
39081 VIDHI ARORA
37944 ANCHAL VERMA
37956 ANCHAL VERMA
37857 ANJALI
37882 ARCHANA
37770 ARSHDIL BRAR
37755 ASMI
38231 Ayushi Verma
37850 BHAWANA SAHARAN
37576 Bhumika Datta
38135 BHUMIKA KALRA
37583 CHAKSHU AHUJA
37800 CHESTA SWAMI
37848 CHITRA SHARMA
37760 DEEPALI BANSAL
37783 GEETANJALI SINGAL
38001 HANSIKA
37596 HARMAN DHILLON
38121 ISHITA
37595 ISHVIN PHUTELA
38201 KALPANA CHOUDHARY
37631 KANIKA BAMBA
37573 KASHISH
37644 KASHISH GUPTA
37622 KHUSHBU JALANDHARA
37945 KHUSHI ARORA
37772 KHUSHPREET KAUR
37968 KOMAL AGGARWAL
37994 KOMALPREET
37907 KRITIKA BANSAL
38301 KUMKUM
37867 LAKSHMI SHARMA
37887 LAXMI
38470 MOHINII
37627 NANDINI YOUGI
37648 NEETU
37775 NISHA
37570 NOMITA
37861 NUPUR BHATHEJA
38471 PALAK
37950 PALAK CHAMRIA
37598 PARI SONI
36924 VINITA
37975 PAYAL
38092 PAYAL GODARA
38255 Pooja
37754 PRIYA
37817 PRIYANKA ARORA
38239 RASHI CHHETRI
37606 RIMPIKA CHOUDHARY
37864 RITIKA SONI
38472 SAHAJPREET KAUR
37604 SIMRAN KAUR KAMRA
37758 SUKHVEEN KAUR
37816 TWINKLE
37624 VARSHA
37645 VARSHA SHARMA
37888 Anjali
37034 ANJALI ANUPANI
37098 ANNANYA JAIN
37260 BHUMI MAKHIJA
36895 CHHAVI GROVER
37216 DEEPANSHI
36922 EKTA
36905 GUNGUN
37120 GUNGUN RANWA
36891 GURLEEN KAUR
37889 GURMAN KAUR
37890 GURNOOR KAUR
36918 HANISHA
37048 HARSHIL GOYAL
36960 HARSHITA
37099 HIMANI BISHNOI
37357 HITANSHI
36904 ISHIKA
37106 ISHWAN BRAR
36912 JIYA BANSAL
36872 KAJAL
37003 KASHISH CHOUDHARY
36896 KHUSHBOO AGGARWAL
36923 MAHAK
36889 MAHAK MONGA
36898 MAHIMA RAWAT
36901 MANISHA
37129 MANISHA
37037 MANVEER BHULLER
36972 MANYATA SARASWAT
38101 MEHAK
38179 MONIKA
36880 MUSKAN
37112 MUSKAN
37281 MUSKAN
36983 NAMAN AAGARWAL
36899 NAVYA GUPTA
36873 NAYAN TIWARI
37107 NEHA
36996 NOORMAN KAUR BRAR
37349 PALAK KHATRI
37280 PARUL
37228 PRABHJOT KOUR
36939 PRATIBHA SAIN
36931 RUHANI ARORA
37973 RUKHSAR SHEKH
37021 SAHAJPRET KAUR
37891 SANGEETA
37150 SARIKA SHARMA
36920 SNEHA CHHABRA
36975 TAMANNA
36890 TANVI GROVER
37001 TEENA
37370 UNNATI DHAMA
36913 VANDANA
37360 VANSHIKA GUPTA
37892 VENIKA VERMA
`;

const studentRecords = rawStudentRecords
  .trim()
  .split(/\r?\n/)
  .map((line, index) => {
    const match = line.trim().match(/^(\d+)\s+(.+)$/);

    if (!match) {
      throw new Error(`Invalid student record at line ${index + 1}: "${line}"`);
    }

    const [, id, rawName] = match;
    const cleanedName = rawName.trim().toLowerCase().replace(/\s+/g, "_");

    if (!cleanedName) {
      throw new Error(`Missing student name at line ${index + 1}`);
    }

    return {
      id,
      name: cleanedName,
    };
  });

export const names = studentRecords.map(({ name }) => name);

async function directoryExists(directoryPath) {
  try {
    await access(directoryPath);
    return true;
  } catch {
    return false;
  }
}

async function resolveImagesDirectory(imagesDirectory) {
  if (imagesDirectory) {
    const resolvedDirectory = path.resolve(imagesDirectory);

    if (await directoryExists(resolvedDirectory)) {
      return resolvedDirectory;
    }

    throw new Error(`Images directory does not exist: ${resolvedDirectory}`);
  }

  for (const candidateDirectory of DEFAULT_IMAGE_DIRECTORIES) {
    if (await directoryExists(candidateDirectory)) {
      return candidateDirectory;
    }
  }

  throw new Error(
    `Unable to locate an images directory. Checked: ${DEFAULT_IMAGE_DIRECTORIES.join(", ")}`
  );
}

function buildPdfUrl(publicId, version) {
  return cloudinary.url(publicId, {
    analytics: false,
    resource_type: "image",
    secure: true,
    transformation: [{ fetch_format: "pdf" }],
    type: "upload",
    version,
  });
}

function getFileSortMetadata(fileName) {
  const baseName = path.parse(fileName).name;
  const numericValue = Number.parseFloat(baseName);

  if (Number.isNaN(numericValue)) {
    throw new Error(`Image file "${fileName}" does not have a numeric base name.`);
  }

  return { fileName, baseName, numericValue };
}

function getPngFileNames(entries) {
  return entries
    .filter(
      (entry) =>
        entry.isFile() && path.extname(entry.name).toLowerCase() === ".png"
    )
    .map((entry) => entry.name)
    .sort((left, right) => {
      const leftMeta = getFileSortMetadata(left);
      const rightMeta = getFileSortMetadata(right);

      if (leftMeta.numericValue !== rightMeta.numericValue) {
        return leftMeta.numericValue - rightMeta.numericValue;
      }

      return leftMeta.baseName.localeCompare(rightMeta.baseName, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    });
}

function getErrorMessage(error) {
  return (
    error?.message ||
    error?.error?.message ||
    error?.error?.error?.message ||
    "Unknown upload error"
  );
}

function createPublicId(name, studentId) {
  const cleanedName = name?.trim();

  if (!cleanedName) {
    throw new Error("Cannot generate public_id from an empty name.");
  }

  if (!studentId) {
    throw new Error(`Cannot generate public_id for "${cleanedName}" without a student ID.`);
  }

  if (cleanedName !== cleanedName.toLowerCase() || /\s/.test(cleanedName)) {
    throw new Error(
      `Name "${cleanedName}" is not already cleaned as lowercase_with_underscores.`
    );
  }

  return `${cleanedName}_${studentId}`;
}

export async function uploadCertificatesFromImages(options = {}) {
  const {
    cloudinaryFolder = CERTIFICATES_FOLDER,
    imagesDirectory,
  } = options;

  try {
    const resolvedDirectory = await resolveImagesDirectory(imagesDirectory);
    const directoryEntries = await readdir(resolvedDirectory, {
      withFileTypes: true,
    });
    const pngFileNames = getPngFileNames(directoryEntries);

    console.log(`[certificates] Resolved images directory: ${resolvedDirectory}`);
    console.log(`[certificates] Total PNG files found: ${pngFileNames.length}`);
    console.log(`[certificates] Total names available: ${names.length}`);

    if (pngFileNames.length === 0) {
      throw new Error(`No PNG files found in: ${resolvedDirectory}`);
    }

    if (names.length !== pngFileNames.length) {
      throw new Error(
        `Names array has ${names.length} entries, but ${pngFileNames.length} PNG files were found.`
      );
    }

    const uploadedCertificates = [];
    const expectedCloudinaryPublicIds = [];

    for (const [index, fileName] of pngFileNames.entries()) {
      const filePath = path.join(resolvedDirectory, fileName);
      const mappedRecord = studentRecords[index];
      const mappedName = mappedRecord?.name;
      const studentId = mappedRecord?.id;

      if (mappedName === undefined) {
        throw new Error(`names[${index}] is undefined for file "${fileName}".`);
      }

      if (studentId === undefined) {
        throw new Error(`studentRecords[${index}].id is undefined for file "${fileName}".`);
      }

      console.log(
        `[certificates] Preparing file ${index + 1}/${pngFileNames.length}: ${fileName}`
      );
      console.log(`[certificates] Corresponding name: ${mappedName}`);
      console.log(`[certificates] Student ID: ${studentId}`);

      const basePublicId = createPublicId(mappedName, studentId);
      const expectedCloudinaryPublicId = `${cloudinaryFolder}/${basePublicId}`;

      console.log(`[certificates] Generated public_id: ${basePublicId}`);
      console.log(`[certificates] Source file path: ${filePath}`);

      try {
        const uploadResult = await cloudinary.uploader.upload(filePath, {
          folder: cloudinaryFolder,
          overwrite: true,
          public_id: basePublicId,
          resource_type: "image",
        });

        if (!uploadResult?.secure_url) {
          throw new Error(
            `Cloudinary upload succeeded without secure_url for "${fileName}".`
          );
        }

        const cloudinaryPublicId =
          uploadResult.public_id || expectedCloudinaryPublicId;
        const uploadedCertificate = {
          public_id: basePublicId,
          image_url: uploadResult.secure_url,
          pdf_url: buildPdfUrl(cloudinaryPublicId, uploadResult.version),
        };

        console.log(`[certificates] Uploaded ${fileName}`);
        console.log(
          `[certificates] Cloudinary upload response secure_url: ${uploadResult.secure_url}`
        );
        console.log(`[certificates] Image URL: ${uploadedCertificate.image_url}`);
        console.log(`[certificates] PDF URL: ${uploadedCertificate.pdf_url}`);

        expectedCloudinaryPublicIds.push(expectedCloudinaryPublicId);
        uploadedCertificates.push(uploadedCertificate);
      } catch (error) {
        const message = getErrorMessage(error);
        console.error(`[certificates] Failed to upload "${fileName}"`, {
          filePath,
          mappedName,
          public_id: basePublicId,
          message,
          error,
        });
        throw new Error(
          `Upload failed for file "${fileName}" mapped to "${mappedName}" with public_id "${basePublicId}": ${message}`
        );
      }
    }

    const verificationResult = await cloudinary.api.resources({
      max_results: 500,
      prefix: `${cloudinaryFolder}/`,
      resource_type: "image",
      type: "upload",
    });

    const verifiedPublicIds = new Set(
      verificationResult.resources.map((resource) => resource.public_id)
    );
    const missingPublicIds = expectedCloudinaryPublicIds.filter(
      (publicId) => !verifiedPublicIds.has(publicId)
    );

    console.log(
      `[certificates] Cloudinary folder "${cloudinaryFolder}" currently contains ${verificationResult.resources.length} image resources.`
    );

    if (missingPublicIds.length > 0) {
      console.error("[certificates] Verification failed. Missing public_ids:", missingPublicIds);
      throw new Error(
        `Cloudinary verification failed for ${missingPublicIds.length} uploaded images.`
      );
    }

    console.log(
      `[certificates] Successfully uploaded and verified ${uploadedCertificates.length} images in Cloudinary folder "${cloudinaryFolder}".`
    );

    return uploadedCertificates;
  } catch (error) {
    console.error("[certificates] uploadCertificatesFromImages failed:", error);
    throw error;
  }
}
