export type BizaflowLinkPayload = {
  tenantId: string;
  businessId: string;
  ownerUid: string;
};

export async function linkBusinessToBizaflow(payload: BizaflowLinkPayload) {
  return {
    ok: true,
    integrationStatus: "PENDING",
    externalReferenceId: `bizaflow-${payload.businessId}`,
    message: "Integration Bizaflow preparee. Connexion API reelle a brancher.",
  };
}
