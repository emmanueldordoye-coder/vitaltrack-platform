export const PDS_HEALTH_WORKSPACE_LABEL = "PDS Health Workspace";
export const PDS_HEALTH_FACILITY_LABEL = "PDS Health pilot site";

const dentiraLabelPattern = /\bdentira\b/i;

export const formatCustomerWorkspaceLabel = (value?: string | null) => {
  const label = value?.trim();

  if (!label || dentiraLabelPattern.test(label)) {
    return PDS_HEALTH_WORKSPACE_LABEL;
  }

  return label;
};

export const formatCustomerFacilityLabel = (value?: string | null) => {
  const label = value?.trim();

  if (!label || dentiraLabelPattern.test(label)) {
    return PDS_HEALTH_FACILITY_LABEL;
  }

  return label;
};
