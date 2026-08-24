export const PDS_HEALTH_WORKSPACE_LABEL = "PDS Health Workspace";
export const PDS_HEALTH_FACILITY_LABEL = "PDS Health pilot site";

const dentiraLabelPattern = /\bdentira\b/i;
const primaryDentiraFacilityPattern = /^dentira\s+main\s+office$/i;

export const formatCustomerWorkspaceLabel = (value?: string | null) => {
  const label = value?.trim();

  if (!label || dentiraLabelPattern.test(label)) {
    return PDS_HEALTH_WORKSPACE_LABEL;
  }

  return label;
};

export const formatCustomerFacilityLabel = (value?: string | null) => {
  const label = value?.trim();

  if (!label || primaryDentiraFacilityPattern.test(label)) {
    return PDS_HEALTH_FACILITY_LABEL;
  }

  if (dentiraLabelPattern.test(label)) {
    return label.replace(dentiraLabelPattern, "PDS Health");
  }

  return label;
};
