import express from "express";
import {
  addCompany,
  createCompaniesSection,
  deleteCompaniesSection,
  deleteCompany,
  getCompaniesSection,
  updateCompaniesSection,
  updateCompany,
} from "../controllers/companiesSectionController.js";
import authMiddleware from "../middlewares/authJWT.js";

const router = express.Router();

router.get("/", getCompaniesSection);

router.post("/", authMiddleware("adminToken"), createCompaniesSection);

router.put("/:id", authMiddleware("adminToken"), updateCompaniesSection);

router.delete("/:id", authMiddleware("adminToken"), deleteCompaniesSection);

router.post("/:id/companies", authMiddleware("adminToken"), addCompany);
router.put("/:id/companies/:companyId", authMiddleware("adminToken"), updateCompany);
router.delete("/:id/companies/:companyId", authMiddleware("adminToken"), deleteCompany);

export default router;
