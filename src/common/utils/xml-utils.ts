import { XMLBuilder, XMLParser } from "fast-xml-parser";

export const xmlParser = new XMLParser({
  attributeNamePrefix: "@_",
  ignoreAttributes: false,
  parseAttributeValue: true,
});

export const xmlBuilder = new XMLBuilder({
  attributeNamePrefix: "@_",
  ignoreAttributes: false,
});
