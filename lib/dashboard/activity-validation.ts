export type ActivityFilters = {
  search: string;
  action: string;
  resource: string;
  dateFrom: string;
  dateTo: string;
  page: number;
};

const allowedActions = [
  "client.created",
  "client.updated",
  "client.archived",
  "client.restored",
  "profile.updated",
  "profile.role_changed",
  "profile.activated",
  "profile.deactivated",
  "company_settings.updated",
];

const allowedResources = ["client", "profile", "company_settings"];

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function safeDate(value: string | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
  return Number.isNaN(Date.parse(`${value}T00:00:00Z`)) ? "" : value;
}

export function parseActivityFilters(
  params: Record<string, string | string[] | undefined>,
): ActivityFilters {
  const action = firstValue(params.action) || "";
  const resource = firstValue(params.resource) || "";
  const page = Number.parseInt(firstValue(params.page) || "1", 10);

  return {
    search: (firstValue(params.q) || "").trim().slice(0, 120),
    action: allowedActions.includes(action) ? action : "",
    resource: allowedResources.includes(resource) ? resource : "",
    dateFrom: safeDate(firstValue(params.from)),
    dateTo: safeDate(firstValue(params.to)),
    page: Number.isFinite(page) ? Math.max(1, page) : 1,
  };
}

export { allowedActions, allowedResources };
