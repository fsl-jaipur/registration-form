/**
 * Migration Script: Azure Blob Storage → Cloudinary
 *
 * This script:
 * 1. Fetches ALL uploaded resources from your Cloudinary account
 * 2. Scans all MongoDB collections that store image URLs
 * 3. Matches filenames from Azure URLs to Cloudinary public IDs
 * 4. Updates MongoDB documents with the correct Cloudinary URLs
 *
 * Run: node migrate-to-cloudinary.js
 */

import "dotenv/config";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";

// ─── Cloudinary Config ────────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─── MongoDB Config ───────────────────────────────────────────────────────────
async function connectToDB() {
  await mongoose.connect(
    `mongodb://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@ac-zqogc3u-shard-00-00.4ont6qs.mongodb.net:27017,ac-zqogc3u-shard-00-01.4ont6qs.mongodb.net:27017,ac-zqogc3u-shard-00-02.4ont6qs.mongodb.net:27017/fsl?ssl=true&replicaSet=atlas-q6tt9g-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0`
  );
  console.log("✅ MongoDB connected");
}

// ─── Helper: strip filename (without extension) from any URL ─────────────────
function getBaseName(url) {
  if (!url) return null;
  try {
    const pathname = new URL(url).pathname;
    const parts = pathname.split("/");
    const filename = parts[parts.length - 1];
    return filename.replace(/\.[^/.]+$/, "").toLowerCase();
  } catch {
    return null;
  }
}

// ─── Fetch ALL Cloudinary resources (handles pagination) ──────────────────────
async function getAllCloudinaryResources() {
  console.log("\n📦 Fetching all Cloudinary resources...");
  const all = [];
  let nextCursor = null;

  do {
    const params = { resource_type: "image", max_results: 500 };
    if (nextCursor) params.next_cursor = nextCursor;

    const result = await cloudinary.api.resources(params);
    all.push(...result.resources);
    nextCursor = result.next_cursor || null;
    console.log(`   Fetched ${all.length} resources so far...`);
  } while (nextCursor);

  console.log(`✅ Total Cloudinary resources found: ${all.length}`);
  return all;
}

// ─── Build lookup map: basename → secure_url ─────────────────────────────────
function buildCloudinaryMap(resources) {
  const map = new Map();
  for (const r of resources) {
    const parts = r.public_id.split("/");
    const name = parts[parts.length - 1].toLowerCase();
    if (!map.has(name)) {
      map.set(name, r.secure_url);
    }
  }
  console.log(`\n🗺️  Built lookup map with ${map.size} unique filenames`);
  return map;
}

// ─── Check if a URL is an Azure Blob URL ─────────────────────────────────────
function isAzureUrl(url) {
  return typeof url === "string" && url.includes("blob.core.windows.net");
}

// ─── Migrate a collection with a simple string image field ───────────────────
async function migrateSimpleField(collection, field, cloudinaryMap) {
  const docs = await collection.find({});
  let updated = 0;
  let skipped = 0;
  let notFound = 0;

  for (const doc of docs) {
    const url = doc[field];
    if (!isAzureUrl(url)) {
      skipped++;
      continue;
    }

    const name = getBaseName(url);
    const newUrl = cloudinaryMap.get(name);

    if (!newUrl) {
      console.warn(`   ⚠️  No Cloudinary match for: ${url} (basename: "${name}")`);
      notFound++;
      continue;
    }

    doc[field] = newUrl;
    await doc.save();
    console.log(`   ✅ Updated [${doc._id}]: ${url}\n            → ${newUrl}`);
    updated++;
  }

  return { updated, skipped, notFound };
}

// ─── Migrate HeroSection images[] array ───────────────────────────────────────
async function migrateHeroSectionImages(HeroSection, cloudinaryMap) {
  const docs = await HeroSection.find({});
  let updated = 0;
  let skipped = 0;
  let notFound = 0;

  for (const doc of docs) {
    let docChanged = false;
    for (const img of doc.images || []) {
      if (!isAzureUrl(img.url)) {
        skipped++;
        continue;
      }

      const name = getBaseName(img.url);
      const newUrl = cloudinaryMap.get(name);

      if (!newUrl) {
        console.warn(`   ⚠️  No Cloudinary match for: ${img.url} (basename: "${name}")`);
        notFound++;
        continue;
      }

      console.log(`   ✅ Hero image updated: ${img.url}\n               → ${newUrl}`);
      img.url = newUrl;
      docChanged = true;
      updated++;
    }

    if (docChanged) {
      doc.markModified("images");
      await doc.save();
    }
  }

  return { updated, skipped, notFound };
}

// ─── Migrate CompaniesSection companies[].logo ────────────────────────────────
async function migrateCompaniesLogos(CompaniesSection, cloudinaryMap) {
  const docs = await CompaniesSection.find({});
  let updated = 0;
  let skipped = 0;
  let notFound = 0;

  for (const doc of docs) {
    let docChanged = false;
    for (const company of doc.companies || []) {
      if (!isAzureUrl(company.logo)) {
        skipped++;
        continue;
      }

      const name = getBaseName(company.logo);
      const newUrl = cloudinaryMap.get(name);

      if (!newUrl) {
        console.warn(`   ⚠️  No Cloudinary match for: ${company.logo} (basename: "${name}")`);
        notFound++;
        continue;
      }

      console.log(`   ✅ Company logo updated: ${company.logo}\n                  → ${newUrl}`);
      company.logo = newUrl;
      docChanged = true;
      updated++;
    }

    if (docChanged) {
      doc.markModified("companies");
      await doc.save();
    }
  }

  return { updated, skipped, notFound };
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  await connectToDB();

  // Fetch all Cloudinary resources and build name map
  const resources = await getAllCloudinaryResources();
  const cloudinaryMap = buildCloudinaryMap(resources);

  // Print all available Cloudinary filenames for reference
  console.log("\n📋 Available Cloudinary filenames:");
  for (const [name, url] of cloudinaryMap) {
    console.log(`   ${name} → ${url}`);
  }

  // Dynamically import models
  const { default: PlacedStudent } = await import("./models/placedStudentModel.js");
  const { default: HeroSection } = await import("./models/heroSectionModel.js");
  const { default: EngineeringTeam } = await import("./models/engineeringTeamModel.js");
  const { default: SuccessStory } = await import("./models/successStoryModel.js");
  const { default: LifeAtFslImage } = await import("./models/lifeAtFslModel.js");
  const { default: CompaniesSection } = await import("./models/companiesSectionModel.js");

  const results = {};

  // ── PlacedStudents → photo ─────────────────────────────────────────────────
  console.log("\n🔄 Migrating PlacedStudents (photo)...");
  results.placedStudents = await migrateSimpleField(PlacedStudent, "photo", cloudinaryMap);

  // ── HeroSection → images[].url ─────────────────────────────────────────────
  console.log("\n🔄 Migrating HeroSection (images[].url)...");
  results.heroSection = await migrateHeroSectionImages(HeroSection, cloudinaryMap);

  // ── EngineeringTeam → photo ────────────────────────────────────────────────
  console.log("\n🔄 Migrating EngineeringTeam (photo)...");
  results.engineeringTeam = await migrateSimpleField(EngineeringTeam, "photo", cloudinaryMap);

  // ── SuccessStory → photo ───────────────────────────────────────────────────
  console.log("\n🔄 Migrating SuccessStories (photo)...");
  results.successStories = await migrateSimpleField(SuccessStory, "photo", cloudinaryMap);

  // ── LifeAtFslImage → imageUrl ──────────────────────────────────────────────
  console.log("\n🔄 Migrating LifeAtFslImages (imageUrl)...");
  results.lifeAtFsl = await migrateSimpleField(LifeAtFslImage, "imageUrl", cloudinaryMap);

  // ── CompaniesSection → companies[].logo ────────────────────────────────────
  console.log("\n🔄 Migrating CompaniesSection (companies[].logo)...");
  results.companies = await migrateCompaniesLogos(CompaniesSection, cloudinaryMap);

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log("\n\n════════════════════════════════════════");
  console.log("           MIGRATION SUMMARY");
  console.log("════════════════════════════════════════");
  for (const [key, stats] of Object.entries(results)) {
    console.log(`\n📁 ${key}:`);
    console.log(`   ✅ Updated  : ${stats.updated}`);
    console.log(`   ⏩ Skipped  : ${stats.skipped} (already Cloudinary/non-Azure)`);
    console.log(`   ❓ Not Found: ${stats.notFound} (no match in Cloudinary)`);
  }
  console.log("\n════════════════════════════════════════");
  console.log("✅ Migration complete!");

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Migration failed:", err);
  mongoose.disconnect();
  process.exit(1);
});
