import {
  generateStructuredData,
  type StructuredDataParams,
} from "@/lib/structuredData";

export default function StructuredData(props: StructuredDataParams) {
  const schemas = generateStructuredData(props);
  return (
    <>
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}
