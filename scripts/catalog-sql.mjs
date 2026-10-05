// Gera o SQL que semeia service_types e vehicle_categories a partir de src/data/content.ts.
// As FKs de jobs.service_type_id e vehicles.category_id apontam para essas tabelas, então
// o painel só consegue gravar se os slugs do site existirem no banco.
//
//   node --experimental-strip-types --no-warnings scripts/catalog-sql.mjs > supabase/migrations/000X_catalog.sql

import { localContent } from "../src/data/content.ts";

const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const arr = (xs) => `array[${xs.map(q).join(", ")}]::text[]`;
const nullable = (s) => (s == null ? "null" : q(s));

const services = [...localContent.serviceTypes].sort((a, b) => a.sortOrder - b.sortOrder);
const categories = [...localContent.vehicleCategories].sort((a, b) => a.sortOrder - b.sortOrder);

const out = [];
out.push("-- Catálogo do site (gerado de src/data/content.ts por scripts/catalog-sql.mjs).");
out.push("-- jobs.service_type_id e vehicles.category_id dependem destas linhas. Rodar de novo ao mudar o catálogo.");
out.push("");
out.push("insert into service_types (id, name_pt, name_en, summary_pt, summary_en, description_pt, description_en,");
out.push("  includes_pt, includes_en, ideal_for_pt, ideal_for_en, image_url, sort_order, published) values");
out.push(
  services
    .map(
      (s) =>
        `  (${q(s.id)}, ${q(s.name.pt)}, ${q(s.name.en)}, ${q(s.summary.pt)}, ${q(s.summary.en)}, ${q(s.description.pt)}, ${q(s.description.en)},\n` +
        `   ${arr(s.includes.pt)}, ${arr(s.includes.en)}, ${q(s.idealFor.pt)}, ${q(s.idealFor.en)}, ${nullable(s.image)}, ${s.sortOrder}, true)`,
    )
    .join(",\n"),
);
out.push("on conflict (id) do update set");
out.push("  name_pt = excluded.name_pt, name_en = excluded.name_en, summary_pt = excluded.summary_pt, summary_en = excluded.summary_en,");
out.push("  description_pt = excluded.description_pt, description_en = excluded.description_en, includes_pt = excluded.includes_pt,");
out.push("  includes_en = excluded.includes_en, ideal_for_pt = excluded.ideal_for_pt, ideal_for_en = excluded.ideal_for_en,");
out.push("  image_url = excluded.image_url, sort_order = excluded.sort_order;");
out.push("");
out.push(
  "insert into vehicle_categories (id, name_pt, name_en, description_pt, description_en, capacity, armored, image_url, sort_order, published) values",
);
out.push(
  categories
    .map(
      (c) =>
        `  (${q(c.id)}, ${q(c.name.pt)}, ${q(c.name.en)}, ${q(c.description.pt)}, ${q(c.description.en)}, ${c.capacity}, ${c.armored}, ${nullable(c.image)}, ${c.sortOrder}, true)`,
    )
    .join(",\n"),
);
out.push("on conflict (id) do update set");
out.push("  name_pt = excluded.name_pt, name_en = excluded.name_en, description_pt = excluded.description_pt,");
out.push("  description_en = excluded.description_en, capacity = excluded.capacity, armored = excluded.armored,");
out.push("  image_url = excluded.image_url, sort_order = excluded.sort_order;");
out.push("");

process.stdout.write(out.join("\n"));
