// ─────────────────────────────────────────────────────────────────
// SCIENCE AT RISK — Certificate Generator
// Airtable Scripting Extension v4
// ─────────────────────────────────────────────────────────────────

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const CONFIG = {
  rendererUrl: "https://aknoev.github.io/certificate-tool/certificate_renderer.html",
  tableName: "Verification",

  // Airtable field names
  fields: {
    name:              "Real Name",
    eventTitle:        "Event Title",
    presentationTitle: "Presentation Title",
    eventDate:         "Event Date",
    dateRange:         "Date Range",
    hours:             "Hours",
  },

  // Templates — label shown to employee, key matches renderer
  // fieldsUsed lists which URL params to include (only those fields are read)
  templates: [
    {
      label: "Audio interview",
      key: "audio-interview",
      fieldsUsed: ["name", "eventTitle", "eventDate"]
    },
    {
      label: "Conference",
      key: "conference",
      fieldsUsed: ["name", "eventTitle", "presentationTitle", "eventDate"]
    },
    {
      label: "Round table",
      key: "round-table",
      fieldsUsed: ["name", "eventTitle", "presentationTitle", "eventDate"]
    },
    {
      label: "Language course (lc-1)",
      key: "lc-1",
      fieldsUsed: ["name", "dateRange"]
    },
    {
      label: "Language course (lc-2)",
      key: "lc-2",
      fieldsUsed: ["name", "dateRange"]
    },
    {
      label: "Training (lecturer)",
      key: "training-lecturer",
      fieldsUsed: ["name", "eventTitle", "eventDate"]
    },
    {
      label: "Training (participant)",
      key: "training-participant",
      fieldsUsed: ["name", "eventTitle", "eventDate", "hours"]
    },
    {
      label: "Workshop",
      key: "workshop",
      fieldsUsed: ["name", "eventTitle", "eventDate", "hours"]
    },
  ]
};

// ═══════════════════════════════════════════════════════════════
// SCRIPT
// ═══════════════════════════════════════════════════════════════

output.markdown("## Certificate Generator");

// Load all relevant fields explicitly
const allFieldNames = Object.values(CONFIG.fields);
const table = base.getTable(CONFIG.tableName);
const query = await table.selectRecordsAsync({ fields: allFieldNames });

// Step 1: pick record
output.markdown("**Step 1 — Select the participant record:**");
const record = await input.recordAsync("Participant", table);

if (!record) {
  output.text("No record selected. Please run again and select a record.");
  throw new Error("No record selected.");
}

const name = record.getCellValueAsString(CONFIG.fields.name);
output.markdown(`Selected: **${name}**`);

// Step 2: pick template
output.markdown("**Step 2 — Select certificate type:**");
const templateKey = await input.buttonsAsync(
  "Certificate type",
  CONFIG.templates.map(t => ({ label: t.label, value: t.key }))
);

const tmpl = CONFIG.templates.find(t => t.key === templateKey);

// Build URL params — only include fields this template uses
const issueDate = new Date().toLocaleDateString("de-DE");

const urlParams = new URLSearchParams({ template: templateKey, issue_date: issueDate });

// Map from fieldsUsed key → URL param name + Airtable field name
const fieldMap = {
  name:              { param: "name",               airtable: CONFIG.fields.name              },
  eventTitle:        { param: "event_title",         airtable: CONFIG.fields.eventTitle        },
  presentationTitle: { param: "presentation_title",  airtable: CONFIG.fields.presentationTitle },
  eventDate:         { param: "event_date",           airtable: CONFIG.fields.eventDate         },
  dateRange:         { param: "date_range",           airtable: CONFIG.fields.dateRange         },
  hours:             { param: "hours",                airtable: CONFIG.fields.hours             },
};

const summaryRows = [["Field", "Value"], ["---", "---"], ["Template", tmpl.label], ["Issue date", issueDate]];

tmpl.fieldsUsed.forEach(fieldKey => {
  const mapping = fieldMap[fieldKey];
  if (!mapping) return;
  const value = record.getCellValueAsString(mapping.airtable);
  if (value) {
    urlParams.set(mapping.param, value);
    summaryRows.push([mapping.airtable, value]);
  }
});

const finalUrl = `${CONFIG.rendererUrl}?${urlParams.toString()}`;

// Output
output.markdown("---");
output.markdown("### Certificate ready");
output.markdown(summaryRows.map(r => `| ${r[0]} | ${r[1]} |`).join("\n"));
output.markdown("\nClick the link below, then use **Ctrl+P → Save as PDF:**");
output.markdown(`[Open certificate](${finalUrl})`);
