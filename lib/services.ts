import { companySettings } from "./company";
import { buildWhatsAppUrl } from "./whatsapp";

export type ServiceItem = {
  title: string;
  explanation: string;
  typicalClient: string;
  process: string;
  requiredInformation: string;
};

export type ServiceGroup = {
  id: string;
  label: string;
  image: string;
  services: ServiceItem[];
};

export const serviceGroups: ServiceGroup[] = [
  {
    id: "surveying-mapping",
    label: "Land Surveying and Mapping",
    image: companySettings.assets.surveying,
    services: [
      {
        title: "Boundary and topographical survey coordination",
        explanation:
          "Coordinate the right survey inputs so clients understand boundaries, levels, site constraints and development implications.",
        typicalClient: "Land owners, buyers, developers and project teams.",
        process:
          "Review the site requirement, coordinate qualified survey input, organise findings and advise on practical next steps.",
        requiredInformation:
          "Location, available title or offer documents, site access details and intended development use.",
      },
      {
        title: "Land measurements",
        explanation:
          "Support land-size confirmation and practical measurement work for planning, sales and development decisions.",
        typicalClient: "Sellers, buyers, estate teams and developers.",
        process:
          "Confirm the measurement objective, coordinate field or document checks and present usable figures for decision-making.",
        requiredInformation:
          "Stand or lot number, current documents, location and any existing diagrams or survey records.",
      },
      {
        title: "Mapping",
        explanation:
          "Prepare and coordinate mapping information that helps clients understand location, access, surrounding land uses and site potential.",
        typicalClient: "Developers, investors, project managers and property owners.",
        process:
          "Gather site information, review map context, mark relevant constraints and package the output for planning discussions.",
        requiredInformation:
          "Pin location, nearby landmarks, site plans, access details and intended use.",
      },
      {
        title: "Stand and site calculations",
        explanation:
          "Help structure land calculations for stands, layouts, potential subdivisions and development planning.",
        typicalClient: "Land developers, stand sellers and planning teams.",
        process:
          "Assess available site information, coordinate technical checks and prepare calculation support for the planning path.",
        requiredInformation:
          "Site area, layout ideas, planning objective, existing diagrams and local authority context where available.",
      },
    ],
  },
  {
    id: "town-planning",
    label: "Town Planning and Applications",
    image: companySettings.assets.mapLocation,
    services: [
      {
        title: "Town-planning services",
        explanation:
          "Coordinate planning guidance for land use, site potential and the administrative steps required for development.",
        typicalClient: "Property owners, investors, developers and businesses changing land use.",
        process:
          "Clarify the goal, assess planning context, coordinate professional input and prepare a route for applications or approvals.",
        requiredInformation:
          "Property location, title or ownership documents, intended use, existing structures and council history if known.",
      },
      {
        title: "Subdivision applications",
        explanation:
          "Support the preparation and coordination of subdivision-permit applications and related technical documentation.",
        typicalClient: "Land owners, developers and families formalising portions of land.",
        process:
          "Review subdivision intent, coordinate surveys and planning input, prepare documentation and track submission steps.",
        requiredInformation:
          "Parent property details, proposed number of stands, access routes, services information and ownership documents.",
      },
      {
        title: "Change-of-use applications",
        explanation:
          "Assist clients who need to pursue a formal change in how land or buildings may be used.",
        typicalClient: "Businesses, developers, commercial property owners and institutional clients.",
        process:
          "Assess the current and proposed use, identify required submissions, coordinate professionals and support application follow-up.",
        requiredInformation:
          "Current use, proposed use, property address, plans, neighbour or authority notes and supporting documents.",
      },
      {
        title: "Development-permit support",
        explanation:
          "Coordinate the documents and professional inputs needed for development-permit processes.",
        typicalClient: "Residential, commercial and mixed-use development clients.",
        process:
          "Define the permit path, prepare information, coordinate relevant specialists and help monitor responses.",
        requiredInformation:
          "Project description, site location, drawings, ownership documents, servicing details and target timelines.",
      },
    ],
  },
  {
    id: "architecture-engineering",
    label: "Architectural and Engineering Support",
    image: companySettings.assets.projectManagement,
    services: [
      {
        title: "Architectural drawings",
        explanation:
          "Coordinate architectural drawing support for site layouts, building concepts and submission-ready documentation.",
        typicalClient: "Home builders, developers, businesses and property owners.",
        process:
          "Confirm the brief, coordinate architectural input, review drawings with the client and align documents with the project path.",
        requiredInformation:
          "Site details, building requirements, budget direction, reference plans and intended use.",
      },
      {
        title: "Engineering drawings",
        explanation:
          "Coordinate engineering documentation where structural, civil or infrastructure input is required.",
        typicalClient: "Developers, builders and project owners preparing construction work.",
        process:
          "Identify the engineering need, coordinate qualified input and connect drawings to the development programme.",
        requiredInformation:
          "Architectural plans, site conditions, intended works, services information and project timelines.",
      },
      {
        title: "Site layouts",
        explanation:
          "Help structure practical site layouts for stands, access, services, buildings and development sequencing.",
        typicalClient: "Land developers, construction clients and business-site owners.",
        process:
          "Review the site objective, coordinate layout input, identify constraints and refine the site arrangement.",
        requiredInformation:
          "Survey information, intended use, access requirements, services information and any authority guidance.",
      },
      {
        title: "Development documentation",
        explanation:
          "Package the right documents for planning, application, construction and project-management workflows.",
        typicalClient: "Project sponsors, property owners and development teams.",
        process:
          "List required documents, collect available records, coordinate missing inputs and maintain a clear document trail.",
        requiredInformation:
          "Project goal, site details, existing documents, stakeholder contacts and submission requirements.",
      },
    ],
  },
  {
    id: "construction-infrastructure",
    label: "Construction and Infrastructure",
    image: companySettings.assets.infrastructure,
    services: [
      {
        title: "Road construction",
        explanation:
          "Coordinate road-construction planning, contractor engagement and project monitoring for land-development work.",
        typicalClient: "Developers, communities, businesses and land owners preparing serviced stands.",
        process:
          "Assess access needs, coordinate technical input, organise contractor scope and monitor progress against agreed works.",
        requiredInformation:
          "Site access details, road length or scope, design requirements, authority conditions and budget direction.",
      },
      {
        title: "Building construction",
        explanation:
          "Support organised building-construction delivery through planning, coordination and progress monitoring.",
        typicalClient: "Home owners, commercial clients and developers.",
        process:
          "Confirm scope, coordinate drawings and contractor input, track progress and keep activity aligned to the project plan.",
        requiredInformation:
          "Approved drawings where available, site access, budget range, timeline and project brief.",
      },
      {
        title: "Infrastructure coordination",
        explanation:
          "Coordinate the practical infrastructure inputs that make development sites usable and better planned.",
        typicalClient: "Land developers, stand projects and project-management clients.",
        process:
          "Identify infrastructure gaps, coordinate technical input and sequence work with the wider development plan.",
        requiredInformation:
          "Site layout, access, water, electricity, drainage or sanitation information and authority requirements.",
      },
      {
        title: "Project supervision and monitoring",
        explanation:
          "Maintain clearer oversight of site work, responsibilities, progress and emerging issues.",
        typicalClient: "Project owners who need structured reporting and coordination.",
        process:
          "Set reporting expectations, monitor milestones, record issues and coordinate action between clients and professionals.",
        requiredInformation:
          "Project scope, contractor or consultant contacts, timelines, budget and reporting preferences.",
      },
    ],
  },
  {
    id: "land-property",
    label: "Land and Property Services",
    image: companySettings.assets.dueDiligence,
    services: [
      {
        title: "Residential stands",
        explanation:
          "Support clients assessing, marketing or enquiring about residential land opportunities.",
        typicalClient: "Families, buyers, sellers, developers and agents.",
        process:
          "Clarify the stand, review available information and coordinate follow-up for viewing, documentation and next steps.",
        requiredInformation:
          "Location, stand size, price guidance, ownership documents and services information.",
      },
      {
        title: "Commercial stands",
        explanation:
          "Assist with commercial land opportunities where access, permitted use and services require careful review.",
        typicalClient: "Businesses, investors, developers and institutions.",
        process:
          "Assess commercial objectives, review site information, coordinate due diligence and advise on action points.",
        requiredInformation:
          "Location, intended use, size, access details, services, price expectation and available records.",
      },
      {
        title: "Land advisory",
        explanation:
          "Provide practical guidance for land decisions before funds, designs or commitments are locked in.",
        typicalClient: "Buyers, sellers, families, developers and investors.",
        process:
          "Understand the objective, review documents and site context, identify risks and recommend the next steps.",
        requiredInformation:
          "Property location, documents available, decision deadline, budget and intended outcome.",
      },
      {
        title: "Due diligence",
        explanation:
          "Coordinate structured checks on property information before acquisition, investment or development.",
        typicalClient: "Investors, buyers, lenders, developers and business owners.",
        process:
          "Collect records, identify gaps, coordinate professional checks and summarise issues requiring confirmation.",
        requiredInformation:
          "Offer documents, title or ownership records, seller details, maps, price terms and transaction timeline.",
      },
      {
        title: "Ownership-verification support",
        explanation:
          "Assist clients in coordinating checks on ownership information and property documentation through relevant channels.",
        typicalClient: "Buyers, families, developers and anyone needing clarity before proceeding.",
        process:
          "Review available documents, identify confirmation channels and coordinate appropriate follow-up with professionals or authorities.",
        requiredInformation:
          "Names on documents, stand or lot number, title details, agreement copies and location information.",
      },
      {
        title: "Site assessment",
        explanation:
          "Review site conditions and surrounding context to support better planning, pricing and development decisions.",
        typicalClient: "Developers, owners, buyers and project sponsors.",
        process:
          "Confirm site access, assess visible constraints, coordinate specialist input where needed and report practical implications.",
        requiredInformation:
          "Pin location, access instructions, site photos, intended use and available plans or survey records.",
      },
    ],
  },
];

export function getServiceEnquiryUrl(serviceTitle: string) {
  return buildWhatsAppUrl(
    `Hello Averex Land Solutions, I would like to enquire about ${serviceTitle}.`,
  );
}
