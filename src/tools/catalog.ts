import { z } from 'zod';

export const ToolAccessLevelSchema = z.enum(['disabled', 'read-only', 'guarded-write', 'full-access']);
export type ToolAccessLevel = z.infer<typeof ToolAccessLevelSchema>;

export const ToolDefinitionSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string(),
  category: z.string(),
  risk: z.enum(['low', 'medium', 'high']),
  recommendedAccess: ToolAccessLevelSchema,
  defaultAccess: ToolAccessLevelSchema,
  requiresApprovalForWrite: z.boolean().default(false),
});

export type ToolDefinition = z.infer<typeof ToolDefinitionSchema>;

export const CORE_TOOL_CATALOG: ToolDefinition[] = [
  {
    id: 'file-management',
    label: 'File Management System',
    description: 'Read, write, and modify local files, reports, CSVs, and documents.',
    category: 'core',
    risk: 'medium',
    recommendedAccess: 'guarded-write',
    defaultAccess: 'read-only',
    requiresApprovalForWrite: true,
  },
  {
    id: 'database-connectors',
    label: 'Database Connectors',
    description: 'Connect to SQL, NoSQL, and vector databases for structured access and retrieval.',
    category: 'data',
    risk: 'high',
    recommendedAccess: 'guarded-write',
    defaultAccess: 'disabled',
    requiresApprovalForWrite: true,
  },
  {
    id: 'api-automation',
    label: 'API Connector & Workflow Automation',
    description: 'Connect external apps and trigger automated workflows.',
    category: 'automation',
    risk: 'high',
    recommendedAccess: 'guarded-write',
    defaultAccess: 'disabled',
    requiresApprovalForWrite: true,
  },
  {
    id: 'mcp-servers',
    label: 'MCP Servers',
    description: 'Attach model context protocol servers for tool and service access.',
    category: 'integration',
    risk: 'high',
    recommendedAccess: 'guarded-write',
    defaultAccess: 'disabled',
    requiresApprovalForWrite: true,
  },
  {
    id: 'email-client',
    label: 'Email Client',
    description: 'Read, draft, and send email through configured providers.',
    category: 'communication',
    risk: 'high',
    recommendedAccess: 'guarded-write',
    defaultAccess: 'disabled',
    requiresApprovalForWrite: true,
  },
  {
    id: 'calendar-scheduling',
    label: 'Calendar & Scheduling Manager',
    description: 'Check availability, schedule meetings, and manage calendars.',
    category: 'communication',
    risk: 'high',
    recommendedAccess: 'guarded-write',
    defaultAccess: 'disabled',
    requiresApprovalForWrite: true,
  },
  {
    id: 'data-extraction',
    label: 'Data Extraction / Web Scraper',
    description: 'Extract structured data from websites and documents.',
    category: 'data',
    risk: 'medium',
    recommendedAccess: 'read-only',
    defaultAccess: 'read-only',
    requiresApprovalForWrite: false,
  },
  {
    id: 'human-approval',
    label: 'Human-in-the-Loop Approval',
    description: 'Gate high-risk tasks behind explicit human approval.',
    category: 'safety',
    risk: 'low',
    recommendedAccess: 'full-access',
    defaultAccess: 'full-access',
    requiresApprovalForWrite: false,
  },
];
