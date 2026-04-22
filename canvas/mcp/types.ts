/**
 * MCP-specific type definitions for the Fluid Canvas MCP server.
 */

/**
 * V2 input for push_asset: campaign-aware.
 * HTML is written to .fluid/campaigns/{campaignId}/{assetId}/{frameId}/{iterationId}.html.
 */
export interface PushAssetInput {
  campaignId: string;
  assetId: string;
  frameId: string;
  html: string;
  iterationIndex?: number;
  slotSchema?: object;
  source?: 'ai' | 'template';
  templateId?: string;
  platform?: string;
}

/**
 * V1 input shape — retained only so the MCP server can throw a descriptive
 * deprecation error when legacy clients call push_asset with sessionId/variationId.
 */
export interface PushAssetInputLegacy {
  sessionId: string;
  variationId: string;
  html: string;
  platform?: string;
}

export interface PushAssetResult {
  iterationId: string;
  htmlPath: string;
  message: string;
}
