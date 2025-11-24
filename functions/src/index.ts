import { onRequest } from "firebase-functions/v2/https";
import express from 'express';
import cors from 'cors';
import * as crm from './controllers/crmController';
import * as ai from './controllers/aiController';
import * as marketing from './controllers/marketingController';

const app = express();

// Enable CORS
app.use(cors({ origin: true }) as any);
app.use(express.json() as any);

// --- 1. CREATE A ROUTER ---
// This router will hold all our endpoints
const router = express.Router();

// --- CRM Routes (Attached to Router) ---
router.get('/companies', crm.getCompanies);
router.post('/companies', crm.createCompany);

router.get('/contacts', crm.getContacts);
router.post('/contacts', crm.createContact);

router.get('/deals', crm.getDeals);

router.get('/interactions', crm.getInteractions);

router.get('/tickets', crm.getTickets);
router.post('/tickets', crm.createTicket);

router.get('/proposals/:id', crm.getProposal);
router.post('/proposals/:id/accept', crm.acceptProposal);
router.post('/proposals/:id/pay', crm.payProposal);

// --- AI Routes (Attached to Router) ---
router.post('/summarize', ai.summarize);
router.post('/generate-proposal', ai.generateProposal);
router.post('/copilot-response', ai.copilotResponse);
router.post('/draft-email', ai.draftEmail);
router.post('/next-best-action', ai.nextBestAction);

// --- Marketing Routes (Attached to Router) ---
router.get('/research-prospect', marketing.researchProspect);
router.post('/generate-marketing-content', marketing.generateContent);
router.post('/generate-lead-list', marketing.generateLeadList);

// --- 2. MOUNT THE ROUTER AT /api ---
// This tells Express: "If the URL starts with /api, use this router."
app.use('/api', router);

// Expose the API as a Cloud Function
export const api = onRequest({ region: "europe-west1" }, app as any);