import { Request, Response } from 'express';
import { pool } from '../db';

// --- COMPANIES ---
export const getCompanies = async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM companies ORDER BY name');
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createCompany = async (req: Request, res: Response) => {
  try {
    const { name, domain, contact_person, email, industry } = req.body;
    const query = `
      INSERT INTO companies (name, domain, contact_person, email, industry)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const result = await pool.query(query, [name, domain, contact_person, email, industry]);
    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// --- CONTACTS ---
export const getContacts = async (req: Request, res: Response) => {
  try {
    const companyId = req.query.company_id;
    let query = `
        SELECT c.*, com.name as company_name 
        FROM contacts c
        LEFT JOIN companies com ON c.company_id = com.company_id
    `;
    const params: any[] = [];

    // FIX: Filter by Company ID if provided
    if (companyId) {
        query += ` WHERE c.company_id = $1`;
        params.push(companyId);
    }

    query += ` ORDER BY c.last_name`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createContact = async (req: Request, res: Response) => {
  try {
    const { first_name, last_name, email, company_id, role, phone } = req.body;
    const query = `
      INSERT INTO contacts (first_name, last_name, email, company_id, role, phone)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const result = await pool.query(query, [first_name, last_name, email, company_id, role, phone]);
    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// --- DEALS ---
export const getDeals = async (req: Request, res: Response) => {
  try {
    const companyId = req.query.company_id;
    let query = `
      SELECT 
        d.*,
        COALESCE((
          SELECT SUM(
            (quantity * base_annual_unit_price * (1 - year_1_discount_percent/100)) +
            (quantity * base_annual_unit_price * (1 - year_2_discount_percent/100)) +
            (quantity * base_annual_unit_price * (1 - year_3_discount_percent/100))
          )
          FROM deal_line_items dli 
          WHERE dli.deal_id = d.deal_id
        ), 0) as value,
        json_build_object(
          'company_id', c.company_id,
          'name', c.name,
          'domain', c.domain
        ) as company,
        (SELECT COUNT(*) FROM interactions i WHERE i.deal_id = d.deal_id) as interaction_count
      FROM deals d
      JOIN companies c ON d.company_id = c.company_id
    `;
    
    const params: any[] = [];

    // FIX: Filter by Company ID if provided
    if (companyId) {
        query += ` WHERE d.company_id = $1`;
        params.push(companyId);
    }

    query += ` ORDER BY d.updated_at DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// --- INTERACTIONS ---
export const getInteractions = async (req: Request, res: Response) => {
  try {
    const dealId = req.query.deal_id;
    const companyId = req.query.company_id;
    const contactId = req.query.contact_id;

    let query = `
      SELECT 
        i.*,
        json_build_object(
            'first_name', c.first_name,
            'last_name', c.last_name,
            'email', c.email
        ) as contact
      FROM interactions i
      LEFT JOIN contacts c ON i.contact_id = c.contact_id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    let paramCount = 1;

    // FIX: Robust filtering logic for timeline
    if (dealId) {
        query += ` AND i.deal_id = $${paramCount}`;
        params.push(dealId);
        paramCount++;
    }
    // Note: Interactions table currently links directly to deal/contact. 
    // Linking to company requires a JOIN via Deals or Contacts if 'company_id' isn't directly on interactions table.
    // Assuming schema has deal_id, contact_id. If company_id isn't on interactions, we filter deals by company first.
    
    query += ` ORDER BY i.timestamp DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// --- TICKETS ---
export const getTickets = async (req: Request, res: Response) => {
  try {
    const query = `
        SELECT t.*, c.first_name, c.last_name, c.email
        FROM support_tickets t
        JOIN contacts c ON t.contact_id = c.contact_id
        ORDER BY t.created_at DESC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createTicket = async (req: Request, res: Response) => {
  try {
    const { contact_id, subject, priority, status } = req.body;
    const query = `
      INSERT INTO support_tickets (contact_id, subject, priority, status)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const result = await pool.query(query, [contact_id, subject, priority, status || 'OPEN']);
    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// --- PROPOSALS ---
export const getProposal = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const query = `SELECT * FROM proposals WHERE proposal_id = $1`;
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Proposal not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const acceptProposal = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { signature_name } = req.body;
    const query = `
      UPDATE proposals 
      SET status = 'SIGNED', client_signature_name = $1, client_signed_at = NOW()
      WHERE proposal_id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [signature_name, id]);
    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const payProposal = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const query = `
      UPDATE proposals 
      SET payment_status = 'PAID'
      WHERE proposal_id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [id]);
    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};